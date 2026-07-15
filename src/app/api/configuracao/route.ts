import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto } from "@/lib/contexto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConfig(c: any) {
  return {
    expedienteInicioMin: c.expedienteInicioMin,
    expedienteFimMin: c.expedienteFimMin,
    almocoInicioMin: c.almocoInicioMin,
    almocoFimMin: c.almocoFimMin,
    duracaoPadraoMin: c.duracaoPadraoMin,
    bufferMin: c.bufferMin,
  };
}

// GET /api/configuracao
export async function GET() {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const config = await prisma.configuracao.upsert({
    where: { usuarioId: ctx.usuarioId },
    create: { usuarioId: ctx.usuarioId },
    update: {},
  });
  return NextResponse.json(mapConfig(config));
}

// PATCH /api/configuracao
export async function PATCH(req: Request) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });

  const data: Record<string, number | null> = {};
  const intCampos = ["expedienteInicioMin", "expedienteFimMin", "duracaoPadraoMin", "bufferMin"] as const;
  for (const k of intCampos) {
    if (k in body) {
      if (typeof body[k] !== "number") return NextResponse.json({ erro: `${k} inválido.` }, { status: 400 });
      data[k] = Math.round(body[k]);
    }
  }
  for (const k of ["almocoInicioMin", "almocoFimMin"] as const) {
    if (k in body) data[k] = body[k] == null ? null : Math.round(body[k]);
  }

  const config = await prisma.configuracao.upsert({
    where: { usuarioId: ctx.usuarioId },
    create: { usuarioId: ctx.usuarioId, ...data },
    update: data,
  });
  return NextResponse.json(mapConfig(config));
}
