import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrioridade, isStatus } from "@/lib/tarefas";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/tarefas/:id/subtarefas — cria tarefa filha
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.titulo !== "string" || !body.titulo.trim())
    return NextResponse.json({ erro: "Título é obrigatório." }, { status: 400 });
  if (body.prioridade !== undefined && !isPrioridade(body.prioridade))
    return NextResponse.json({ erro: "Prioridade inválida." }, { status: 400 });
  if (body.status !== undefined && !isStatus(body.status))
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });

  const sub = await prisma.tarefa.create({
    data: {
      titulo: body.titulo.trim(),
      descricao: typeof body.descricao === "string" ? body.descricao.trim() || null : null,
      prazo: body.prazo ? new Date(body.prazo) : null,
      prioridade: body.prioridade ?? "media",
      status: body.status ?? "a_fazer",
      dataInicio: body.dataInicio ? new Date(body.dataInicio) : null,
      duracaoMin: typeof body.duracaoMin === "number" ? body.duracaoMin : null,
      tarefaPaiId: id,
    },
  });
  return NextResponse.json({
    id: sub.id, titulo: sub.titulo, status: sub.status,
    prioridade: sub.prioridade, prazo: sub.prazo,
    dataInicio: sub.dataInicio, duracaoMin: sub.duracaoMin,
    tarefas: [],
  }, { status: 201 });
}
