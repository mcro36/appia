import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/reunioes/:id/topicos
export async function POST(req: Request, { params }: Ctx) {
  const { id: reuniaoId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.titulo !== "string" || !body.titulo.trim())
    return NextResponse.json({ erro: "Título é obrigatório." }, { status: 400 });

  const topico = await prisma.topico.create({
    data: { reuniaoId, titulo: body.titulo.trim() },
  });
  return NextResponse.json({ id: topico.id, titulo: topico.titulo, concluido: topico.concluido }, { status: 201 });
}
