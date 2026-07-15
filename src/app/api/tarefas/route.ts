import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeEscrever } from "@/lib/contexto";
import { registrarAtividade } from "@/lib/atividade";
import { isPrioridade, isNivel, isRecorrencia, isStatus, isTipo } from "@/lib/tarefas";
import { includeTarefa as include, mapTarefa } from "@/lib/mapTarefa";

// GET /api/tarefas — lista apenas raízes (atividades e projetos) da workspace
export async function GET() {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const tarefas = await prisma.tarefa.findMany({
    where: { tarefaPaiId: null, workspaceId: ctx.workspaceId },
    orderBy: [{ prazo: "asc" }, { criadaEm: "desc" }],
    include,
  });
  return NextResponse.json(tarefas.map(mapTarefa));
}

// POST /api/tarefas
export async function POST(req: Request) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.titulo !== "string" || !body.titulo.trim())
    return NextResponse.json({ erro: "Título é obrigatório." }, { status: 400 });
  if (body.tipo !== undefined && !isTipo(body.tipo))
    return NextResponse.json({ erro: "Tipo inválido." }, { status: 400 });
  if (body.nivel !== undefined && !isNivel(body.nivel))
    return NextResponse.json({ erro: "Nível inválido." }, { status: 400 });
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
      nivel: body.nivel ?? "operacional",
      titulo: body.titulo.trim(),
      descricao: typeof body.descricao === "string" ? body.descricao.trim() || null : null,
      prazo: body.prazo ? new Date(body.prazo) : null,
      prioridade: body.prioridade ?? "media",
      status: body.status ?? "a_fazer",
      recorrencia: body.recorrencia ?? "none",
      recorrenciaAte: body.recorrenciaAte ? new Date(body.recorrenciaAte) : null,
      tarefaPaiId: typeof body.tarefaPaiId === "string" ? body.tarefaPaiId : null,
      workspaceId: ctx.workspaceId,
      tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include,
  });

  await registrarAtividade(ctx.workspaceId, ctx.usuarioId, "criou", tarefa.id, null).catch(() => {});
  return NextResponse.json(mapTarefa(tarefa), { status: 201 });
}
