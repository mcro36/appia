import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeEscrever } from "@/lib/contexto";
import { reuniaoVisivel } from "@/lib/visibilidade";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/reunioes/:id/topicos
export async function POST(req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id: reuniaoId } = await params;
  if (!(await reuniaoVisivel(reuniaoId, ctx)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.titulo !== "string" || !body.titulo.trim())
    return NextResponse.json({ erro: "Título é obrigatório." }, { status: 400 });

  const topico = await prisma.topico.create({
    data: { reuniaoId, titulo: body.titulo.trim() },
  });
  return NextResponse.json({ id: topico.id, titulo: topico.titulo, concluido: topico.concluido }, { status: 201 });
}
