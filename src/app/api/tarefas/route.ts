import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrioridade, isRecorrencia, isStatus, isTipo } from "@/lib/tarefas";

const include = {
  tags: { include: { tag: true } },
  tarefas: true,
};

// GET /api/tarefas — lista apenas raízes (atividades e projetos)
export async function GET() {
  const tarefas = await prisma.tarefa.findMany({
    where: { tarefaPaiId: null },
    orderBy: [{ prazo: "asc" }, { criadaEm: "desc" }],
    include,
  });
  return NextResponse.json(tarefas.map(mapTarefa));
}

// POST /api/tarefas
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.titulo !== "string" || !body.titulo.trim())
    return NextResponse.json({ erro: "Título é obrigatório." }, { status: 400 });
  if (body.tipo !== undefined && !isTipo(body.tipo))
    return NextResponse.json({ erro: "Tipo inválido." }, { status: 400 });
  if (body.prioridade !== undefined && !isPrioridade(body.prioridade))
    return NextResponse.json({ erro: "Prioridade inválida." }, { status: 400 });
  if (body.status !== undefined && !isStatus(body.status))
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  if (body.recorrencia !== undefined && !isRecorrencia(body.recorrencia))
    return NextResponse.json({ erro: "Recorrência inválida." }, { status: 400 });

  const tagIds: string[] = Array.isArray(body.tagIds) ? body.tagIds : [];

  const tarefa = await prisma.tarefa.create({
    data: {
      tipo: body.tipo ?? "atividade",
      titulo: body.titulo.trim(),
      descricao: typeof body.descricao === "string" ? body.descricao.trim() || null : null,
      prazo: body.prazo ? new Date(body.prazo) : null,
      prioridade: body.prioridade ?? "media",
      status: body.status ?? "a_fazer",
      recorrencia: body.recorrencia ?? "none",
      recorrenciaAte: body.recorrenciaAte ? new Date(body.recorrenciaAte) : null,
      tarefaPaiId: typeof body.tarefaPaiId === "string" ? body.tarefaPaiId : null,
      tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include,
  });

  return NextResponse.json(mapTarefa(tarefa), { status: 201 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTarefa(t: any) {
  return {
    id: t.id,
    tipo: t.tipo,
    titulo: t.titulo,
    descricao: t.descricao,
    prazo: t.prazo,
    prioridade: t.prioridade,
    status: t.status,
    recorrencia: t.recorrencia,
    recorrenciaAte: t.recorrenciaAte,
    dataInicio: t.dataInicio,
    duracaoMin: t.duracaoMin,
    criadaEm: t.criadaEm,
    atualizadaEm: t.atualizadaEm,
    tarefaPaiId: t.tarefaPaiId,
    tags: (t.tags ?? []).map((tt: any) => ({ id: tt.tag.id, nome: tt.tag.nome, cor: tt.tag.cor })),
    tarefas: (t.tarefas ?? []).map((s: any) => ({
      id: s.id, titulo: s.titulo, status: s.status,
      prioridade: s.prioridade, prazo: s.prazo,
      dataInicio: s.dataInicio, duracaoMin: s.duracaoMin,
    })),
  };
}
