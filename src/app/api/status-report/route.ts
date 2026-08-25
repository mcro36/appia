import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeAdministrar } from "@/lib/contexto";
import { rootsVisiveis, filtroVisibilidade } from "@/lib/visibilidade";
import { includeTarefa as include, mapTarefa } from "@/lib/mapTarefa";

// GET /api/status-report — tarefas marcadas (`noStatusReport`), de QUALQUER nível,
// agrupadas pelo projeto-raiz (`rootId`). Respeita a visibilidade por atribuição
// (membro só vê tarefas cujo projeto-raiz ele participa). Retorna:
//   [{ rootId, titulo, itens: TarefaDTO[] }]
export async function GET() {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const vis = await rootsVisiveis(ctx);
  const tarefas = await prisma.tarefa.findMany({
    where: { workspaceId: ctx.workspaceId, noStatusReport: true, ...filtroVisibilidade(vis) },
    orderBy: [{ criadaEm: "asc" }],
    include,
  });
  const perm = { usuarioId: ctx.usuarioId, admin: podeAdministrar(ctx.papel) };

  // Título de cada projeto-raiz (a raiz pode não estar marcada, então busca à parte).
  // rootId pode ser null em dados muito antigos → cai no próprio id.
  const rootIds = [...new Set(tarefas.map((t) => t.rootId ?? t.id))];
  const raizes = await prisma.tarefa.findMany({
    where: { id: { in: rootIds }, workspaceId: ctx.workspaceId },
    select: { id: true, titulo: true },
  });
  const tituloRaiz = new Map(raizes.map((r) => [r.id, r.titulo]));

  // Agrupa por projeto-raiz, preservando a ordem de aparição.
  const grupos = new Map<string, ReturnType<typeof mapTarefa>[]>();
  for (const t of tarefas) {
    const rid = t.rootId ?? t.id;
    const lista = grupos.get(rid) ?? [];
    lista.push(mapTarefa(t, perm));
    grupos.set(rid, lista);
  }
  const projetos = [...grupos.entries()].map(([rootId, itens]) => ({
    rootId,
    titulo: tituloRaiz.get(rootId) ?? "Projeto",
    itens,
  }));
  return NextResponse.json(projetos);
}
