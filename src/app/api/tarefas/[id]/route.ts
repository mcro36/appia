import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeEscrever, podeAdministrar } from "@/lib/contexto";
import { tarefaVisivel, tarefaEditavel } from "@/lib/visibilidade";
import { registrarAtividade } from "@/lib/atividade";
import { recalcularAncestrais, recalcularNo } from "@/lib/rollup";
import { isPrioridade, isNivel, isRecorrencia, isStatus, isTipo } from "@/lib/tarefas";
import { includeTarefaDetalhe as include, mapTarefa } from "@/lib/mapTarefa";
import { dadosAoConcluir } from "@/lib/recorrencia";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tarefas/:id — visível se o usuário participa do projeto (ou dono/admin).
export async function GET(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  if (!(await tarefaVisivel(id, ctx)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  const tarefa = await prisma.tarefa.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include });
  if (!tarefa) return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  return NextResponse.json(mapTarefa(tarefa, { usuarioId: ctx.usuarioId, admin: podeAdministrar(ctx.papel) }));
}

// PATCH /api/tarefas/:id
export async function PATCH(req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id } = await params;
  if (!(await tarefaEditavel(id, ctx)))
    return NextResponse.json({ erro: "Só o responsável ou o criador podem alterar este item." }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });

  const data: Prisma.TarefaUpdateInput = {};

  if (body.tipo !== undefined) {
    if (!isTipo(body.tipo)) return NextResponse.json({ erro: "Tipo inválido." }, { status: 400 });
    data.tipo = body.tipo;
  }
  if (body.nivel !== undefined) {
    if (!isNivel(body.nivel)) return NextResponse.json({ erro: "Nível inválido." }, { status: 400 });
    data.nivel = body.nivel;
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
  if (body.prazoRigido !== undefined)
    data.prazoRigido = Boolean(body.prazoRigido);
  if (body.prioridade !== undefined) {
    if (!isPrioridade(body.prioridade))
      return NextResponse.json({ erro: "Prioridade inválida." }, { status: 400 });
    data.prioridade = body.prioridade;
  }
  if (body.status !== undefined) {
    if (!isStatus(body.status))
      return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
    data.status = body.status;
    // Carimba (ou limpa) o horário de conclusão para a visão "Concluído do dia".
    data.concluidaEm = body.status === "concluido" ? new Date() : null;
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
  if (body.tempoGastoMin !== undefined)
    data.tempoGastoMin = typeof body.tempoGastoMin === "number" ? Math.round(body.tempoGastoMin) : null;
  // Status Report (Fase 1)
  if (body.noStatusReport !== undefined)
    data.noStatusReport = Boolean(body.noStatusReport);
  if (body.sc !== undefined)
    data.sc = typeof body.sc === "string" ? body.sc.trim() || null : null;
  if (body.statusReportNota !== undefined)
    data.statusReportNota = typeof body.statusReportNota === "string" ? body.statusReportNota.trim() || null : null;
  if (body.proximoPasso !== undefined)
    data.proximoPasso = typeof body.proximoPasso === "string" ? body.proximoPasso.trim() || null : null;
  if (Array.isArray(body.tagIds))
    data.tags = { deleteMany: {}, create: (body.tagIds as string[]).map((tagId) => ({ tagId })) };
  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null) {
      data.assignee = { disconnect: true };
    } else if (typeof body.assigneeId === "string") {
      // Só permite atribuir a alguém que é membro do espaço.
      const membro = await prisma.membro.findUnique({
        where: { usuarioId_workspaceId: { usuarioId: body.assigneeId, workspaceId: ctx.workspaceId } },
      });
      if (!membro) return NextResponse.json({ erro: "Responsável não é membro do espaço." }, { status: 400 });
      data.assignee = { connect: { id: body.assigneeId } };
    }
  }

  // Hábitos: concluir uma tarefa recorrente gera a próxima ocorrência em vez de
  // encerrá-la (regra centralizada em recorrencia.ts).
  if (body.status === "concluido") {
    const atual = await prisma.tarefa.findUnique({
      where: { id },
      select: { recorrencia: true, prazo: true, recorrenciaAte: true },
    });
    if (atual) Object.assign(data, dadosAoConcluir(atual));
  }

  try {
    const tarefa = await prisma.tarefa.update({ where: { id }, data, include });
    // Roll-up do status do pai (efeito de sistema, fora do guard de edição).
    if (body.status !== undefined) await recalcularAncestrais(id).catch(() => {});
    // Timeline: registra mudança de status e de responsável (best-effort).
    if (body.status !== undefined)
      await registrarAtividade(ctx.workspaceId, ctx.usuarioId, "status", id, tarefa.status).catch(() => {});
    if (body.assigneeId !== undefined)
      await registrarAtividade(ctx.workspaceId, ctx.usuarioId, "responsavel", id, tarefa.assignee?.nome ?? null).catch(() => {});
    return NextResponse.json(mapTarefa(tarefa, { usuarioId: ctx.usuarioId, admin: podeAdministrar(ctx.papel) }));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
    throw e;
  }
}

// DELETE /api/tarefas/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id } = await params;
  if (!(await tarefaEditavel(id, ctx)))
    return NextResponse.json({ erro: "Só o responsável ou o criador podem alterar este item." }, { status: 403 });
  try {
    // Captura o pai antes de excluir para recalcular o status derivado dele.
    const alvo = await prisma.tarefa.findUnique({ where: { id }, select: { tarefaPaiId: true } });
    await prisma.tarefa.delete({ where: { id } });
    if (alvo?.tarefaPaiId) await recalcularNo(alvo.tarefaPaiId).catch(() => {});
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
    throw e;
  }
}
