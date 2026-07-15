import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto } from "@/lib/contexto";

export const runtime = "nodejs";

// POST /api/push/subscribe — registra (ou atualiza) uma inscrição de push do navegador
export async function POST(req: Request) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const endpoint: unknown = body?.endpoint;
  const p256dh: unknown = body?.keys?.p256dh;
  const auth: unknown = body?.keys?.auth;

  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
    return NextResponse.json({ erro: "Inscrição inválida." }, { status: 400 });
  }

  // O endpoint é único global (mesmo device): a inscrição passa a ser do usuário atual.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, usuarioId: ctx.usuarioId },
    update: { p256dh, auth, usuarioId: ctx.usuarioId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// DELETE /api/push/subscribe — remove a inscrição (ao desativar notificações)
export async function DELETE(req: Request) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const endpoint: unknown = body?.endpoint;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ erro: "endpoint obrigatório." }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint, usuarioId: ctx.usuarioId } });
  return NextResponse.json({ ok: true });
}
