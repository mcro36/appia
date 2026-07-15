import "server-only";
import { prisma } from "@/lib/prisma";

// Guardas de posse: confirmam que um recurso pertence à workspace antes de
// ler/alterar/excluir por id — defesa contra IDOR. Retornam o registro (ou null).
// Reuniao/Topico não têm workspaceId próprio: a posse é verificada pela relação
// (reunião → tarefa; tópico → reunião → tarefa).

export function tarefaDaWorkspace(id: string, workspaceId: string) {
  return prisma.tarefa.findFirst({ where: { id, workspaceId }, select: { id: true } });
}

export function reuniaoDaWorkspace(id: string, workspaceId: string) {
  return prisma.reuniao.findFirst({ where: { id, tarefa: { workspaceId } }, select: { id: true } });
}

export function topicoDaWorkspace(id: string, workspaceId: string) {
  return prisma.topico.findFirst({
    where: { id, reuniao: { tarefa: { workspaceId } } },
    select: { id: true },
  });
}
