import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/topicos/:id
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.titulo === "string" && body.titulo.trim()) data.titulo = body.titulo.trim();
  if (typeof body.concluido === "boolean") data.concluido = body.concluido;

  const topico = await prisma.topico.update({ where: { id }, data });
  return NextResponse.json({ id: topico.id, titulo: topico.titulo, concluido: topico.concluido });
}

// DELETE /api/topicos/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await prisma.topico.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
