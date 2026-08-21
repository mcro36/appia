import "server-only";
import { prisma } from "@/lib/prisma";
import { podeAdministrar, type Contexto } from "@/lib/contexto";

// Visibilidade por atribuição (ver ESCOPO.md). Ponto único onde a regra vive —
// todas as rotas/IA derivam daqui. Sem RLS: enforced em app.
//
// - Ver: dono/admin veem tudo do espaço; membro vê um projeto-raiz se é
//   responsável/criador de QUALQUER item dele (via rootId).
// - Editar/apagar/concluir: só se é responsável OU criador do item (ou dono/admin).

// Conjunto de projetos-raiz que o usuário pode VER no espaço ativo.
export async function rootsVisiveis(ctx: Contexto): Promise<{ tudo: true } | { ids: string[] }> {
  if (podeAdministrar(ctx.papel)) return { tudo: true };
  const linhas = await prisma.tarefa.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      OR: [{ assigneeId: ctx.usuarioId }, { criadoPorId: ctx.usuarioId }],
    },
    select: { id: true, rootId: true },
  });
  const ids = new Set<string>();
  for (const t of linhas) ids.add(t.rootId ?? t.id); // rootId sempre preenchido pós-backfill
  return { ids: [...ids] };
}

// Fragmento de `where` para filtrar TAREFAS pela visibilidade (qualquer nível):
// membro só vê itens cujo rootId está entre os projetos visíveis.
export function filtroVisibilidade(vis: { tudo: true } | { ids: string[] }) {
  return "tudo" in vis ? {} : { rootId: { in: vis.ids.length ? vis.ids : ["__nenhum__"] } };
}

// LEITURA de um item específico: pertence ao espaço e sua raiz é visível.
export async function tarefaVisivel(id: string, ctx: Contexto): Promise<boolean> {
  const t = await prisma.tarefa.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    select: { id: true, rootId: true },
  });
  if (!t) return false;
  if (podeAdministrar(ctx.papel)) return true;
  const raiz = t.rootId ?? t.id;
  const n = await prisma.tarefa.count({
    where: {
      workspaceId: ctx.workspaceId,
      rootId: raiz,
      OR: [{ assigneeId: ctx.usuarioId }, { criadoPorId: ctx.usuarioId }],
    },
  });
  return n > 0;
}

// Reunião/tópico seguem a visibilidade da tarefa dona (artefatos colaborativos
// do projeto: quem vê o projeto gerencia suas reuniões/tópicos).
export async function reuniaoVisivel(reuniaoId: string, ctx: Contexto): Promise<boolean> {
  const r = await prisma.reuniao.findUnique({ where: { id: reuniaoId }, select: { tarefaId: true } });
  return r ? tarefaVisivel(r.tarefaId, ctx) : false;
}
export async function topicoVisivel(topicoId: string, ctx: Contexto): Promise<boolean> {
  const t = await prisma.topico.findUnique({
    where: { id: topicoId },
    select: { reuniao: { select: { tarefaId: true } } },
  });
  return t ? tarefaVisivel(t.reuniao.tarefaId, ctx) : false;
}

// ESCRITA de um item: só o responsável, o criador, ou dono/admin. (O papel
// `leitor` é barrado antes, por `podeEscrever`, nas rotas.)
export async function tarefaEditavel(id: string, ctx: Contexto): Promise<boolean> {
  const t = await prisma.tarefa.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    select: { assigneeId: true, criadoPorId: true },
  });
  if (!t) return false;
  if (podeAdministrar(ctx.papel)) return true;
  return t.assigneeId === ctx.usuarioId || t.criadoPorId === ctx.usuarioId;
}
