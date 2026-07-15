import "server-only";
import { prisma } from "@/lib/prisma";

// Registra um evento na timeline de uma tarefa. Chamado após mutações-chave.
// `texto` guarda o conteúdo do comentário ou o resumo do evento (ex.: o novo
// status, ou o nome do responsável). Erros aqui não devem quebrar a mutação
// principal — por isso o chamador faz best-effort (catch silencioso).
export function registrarAtividade(
  workspaceId: string,
  usuarioId: string,
  tipo: string,
  tarefaId: string | null,
  texto: string | null,
) {
  return prisma.atividade.create({
    data: { workspaceId, usuarioId, tipo, tarefaId, texto },
  });
}
