import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPrioridade, isRecorrencia, isStatus, isTipo } from "@/lib/tarefas";
import { includeTarefaDetalhe as include, mapTarefa } from "@/lib/mapTarefa";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tarefas/:id
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const tarefa = await prisma.tarefa.findUnique({ where: { id }, include });
  if (!tarefa) return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  return NextResponse.json(mapTarefa(tarefa));
}

// PATCH /api/tarefas/:id
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });

  const data: Prisma.TarefaUpdateInput = {};

  if (body.tipo !== undefined) {
    if (!isTipo(body.tipo)) return NextResponse.json({ erro: "Tipo inválido." }, { status: 400 });
    data.tipo = body.tipo;
  }
  if (body.titulo !== undefined) {
    if (typeof body.titulo !== "string" || !body.titulo.trim())
      return NextResponse.json({ erro: "Título inválido." }, { status: 400 });
    data.titulo = body.titulo.trim();
  }
  if (body.descricao !== undefined)
    data.descricao = typeof body.descricao === "string" ? body.descricao.trim() || null : null;
  if (body.prazo !== undefined)
    data.prazo = body.prazo ? new Date(body.prazo) : null;
  if (body.prioridade !== undefined) {
    if (!isPrioridade(body.prioridade))
      return NextResponse.json({ erro: "Prioridade inválida." }, { status: 400 });
    data.prioridade = body.prioridade;
  }
  if (body.status !== undefined) {
    if (!isStatus(body.status))
      return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
    data.status = body.status;
  }
  if (body.recorrencia !== undefined) {
    if (!isRecorrencia(body.recorrencia))
      return NextResponse.json({ erro: "Recorrência inválida." }, { status: 400 });
    data.recorrencia = body.recorrencia;
  }
  if (body.recorrenciaAte !== undefined)
    data.recorrenciaAte = body.recorrenciaAte ? new Date(body.recorrenciaAte) : null;
  if (body.dataInicio !== undefined)
    data.dataInicio = body.dataInicio ? new Date(body.dataInicio) : null;
  if (body.duracaoMin !== undefined)
    data.duracaoMin = typeof body.duracaoMin === "number" ? Math.round(body.duracaoMin) : null;
  if (Array.isArray(body.tagIds))
    data.tags = { deleteMany: {}, create: (body.tagIds as string[]).map((tagId) => ({ tagId })) };

  try {
    const tarefa = await prisma.tarefa.update({ where: { id }, data, include });
    return NextResponse.json(mapTarefa(tarefa));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
    throw e;
  }
}

// DELETE /api/tarefas/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.tarefa.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
    throw e;
  }
}
