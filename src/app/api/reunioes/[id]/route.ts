import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { includeReuniao, mapReuniao } from "@/lib/mapTarefa";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/reunioes/:id
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if ("titulo" in body) data.titulo = typeof body.titulo === "string" ? body.titulo.trim() || null : null;
  if ("dataHora" in body) data.dataHora = body.dataHora ? new Date(body.dataHora) : null;
  if ("anotacoes" in body) data.anotacoes = typeof body.anotacoes === "string" ? body.anotacoes.trim() || null : null;

  const reuniao = await prisma.reuniao.update({
    where: { id },
    data,
    include: includeReuniao,
  });
  return NextResponse.json(mapReuniao(reuniao));
}

// DELETE /api/reunioes/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await prisma.reuniao.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
