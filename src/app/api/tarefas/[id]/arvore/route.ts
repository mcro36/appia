import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeAdministrar } from "@/lib/contexto";
import { tarefaVisivel } from "@/lib/visibilidade";
import { podeEditar } from "@/lib/mapTarefa";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tarefas/:id/arvore — árvore COMPLETA de um projeto-raiz, achatada.
//
// Por que uma rota nova: `includeTarefa` traz 1 nível e `includeTarefaDetalhe`
// traz 2, mas a árvore real chega a 3+ níveis. Em vez de aninhar `include`
// (profundidade fixa, e um JOIN por nível), consulta plana por `rootId` — que é
// indexado — e a hierarquia é remontada no client (`montarArvore`). Uma query
// só, agnóstica à profundidade: amigável ao `connection_limit=1` do free tier.
//
// Visibilidade: quem enxerga a raiz enxerga a árvore inteira, conforme a regra
// de visibilidade por atribuição do ESCOPO.md. `editavel` continua por item.
export async function GET(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  // 404 (não 403) para não revelar a existência de tarefa de outra workspace.
  if (!(await tarefaVisivel(id, ctx)))
    return NextResponse.json({ erro: "Tarefa não encontrada." }, { status: 404 });

  const linhas = await prisma.tarefa.findMany({
    where: { workspaceId: ctx.workspaceId, OR: [{ id }, { rootId: id }] },
    orderBy: [{ criadaEm: "asc" }],
    select: {
      id: true,
      titulo: true,
      tipo: true,
      status: true,
      prioridade: true,
      tarefaPaiId: true,
      prazo: true,
      dataInicio: true,
      duracaoMin: true,
      concluidaEm: true,
      criadaEm: true,
      assigneeId: true,
      criadoPorId: true,
      assignee: { select: { id: true, nome: true } },
    },
  });

  const perm = { usuarioId: ctx.usuarioId, admin: podeAdministrar(ctx.papel) };
  return NextResponse.json(
    linhas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      tipo: t.tipo,
      status: t.status,
      prioridade: t.prioridade,
      tarefaPaiId: t.tarefaPaiId,
      prazo: t.prazo?.toISOString() ?? null,
      dataInicio: t.dataInicio?.toISOString() ?? null,
      duracaoMin: t.duracaoMin,
      concluidaEm: t.concluidaEm?.toISOString() ?? null,
      criadaEm: t.criadaEm.toISOString(),
      editavel: podeEditar(t, perm),
      assignee: t.assignee,
    })),
  );
}
