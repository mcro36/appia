import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { configurarWebPush, webpush } from "@/lib/pushServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JANELA_NOTIFICAR_MS = 60 * 60 * 1000; // notifica "vencendo" quando faltam ≤ 60 min

type Nivel = "atrasada" | "vencendo";

/** Decide se uma tarefa deve gerar notificação agora. */
function nivelNotificar(prazo: Date, agora: number): Nivel | null {
  const t = prazo.getTime();
  if (t < agora) return "atrasada";
  if (t - agora <= JANELA_NOTIFICAR_MS) return "vencendo";
  return null;
}

function autorizado(req: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return true; // sem segredo configurado, libera (dev)
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${segredo}`) return true; // Vercel Cron
  const url = new URL(req.url);
  return url.searchParams.get("secret") === segredo; // chamada manual/externa
}

// GET /api/push/check — varre prazos e dispara notificações pendentes
export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  let inscricoes;
  try {
    configurarWebPush();
    inscricoes = await prisma.pushSubscription.findMany();
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Falha ao configurar push." },
      { status: 500 },
    );
  }

  if (inscricoes.length === 0) {
    return NextResponse.json({ ok: true, enviadas: 0, motivo: "sem inscrições" });
  }

  const agora = Date.now();
  const tarefas = await prisma.tarefa.findMany({
    where: { tarefaPaiId: null, prazo: { not: null }, status: { not: "concluido" } },
  });

  let enviadas = 0;

  for (const tarefa of tarefas) {
    if (!tarefa.prazo) continue;
    const nivel = nivelNotificar(tarefa.prazo, agora);
    if (!nivel) continue;

    // já notificada nesse nível?
    const jaEnviada = await prisma.notificacaoEnviada.findUnique({
      where: { tarefaId_nivel: { tarefaId: tarefa.id, nivel } },
    });
    if (jaEnviada) continue;

    const payload = JSON.stringify({
      title: nivel === "atrasada" ? "⚠ Tarefa atrasada" : "🕑 Tarefa vencendo",
      body: tarefa.titulo,
      url: "/",
      tag: `${tarefa.id}:${nivel}`,
    });

    await Promise.all(
      inscricoes.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          enviadas++;
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          // 404/410 = inscrição expirada/cancelada → remove
          if (status === 404 || status === 410) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } });
          }
        }
      }),
    );

    await prisma.notificacaoEnviada.create({ data: { tarefaId: tarefa.id, nivel } });
  }

  return NextResponse.json({ ok: true, enviadas });
}
