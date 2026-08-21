import "server-only";
import { prisma } from "@/lib/prisma";
import { statusDerivado } from "@/lib/tarefas";

// Recalcula o status DERIVADO dos ancestrais de uma tarefa e sobe até a raiz.
// É um efeito de SISTEMA (roda fora do guard de edição): quando um membro
// conclui a própria subtarefa, o status do projeto/atividade pai é atualizado
// mesmo que o pai pertença a outra pessoa.
// Recomputa o status derivado do PRÓPRIO nó (se tiver filhas) e depois sobe.
// Use quando as FILHAS de um nó mudaram (adicionar/remover subtarefa).
export async function recalcularNo(noId: string): Promise<void> {
  const filhas = await prisma.tarefa.findMany({ where: { tarefaPaiId: noId }, select: { status: true } });
  if (filhas.length > 0) {
    const novo = statusDerivado(filhas as { status: "a_fazer" | "em_andamento" | "concluido" }[]);
    const no = await prisma.tarefa.findUnique({ where: { id: noId }, select: { status: true } });
    if (no && no.status !== novo) {
      await prisma.tarefa.update({
        where: { id: noId },
        data: { status: novo, concluidaEm: novo === "concluido" ? new Date() : null },
      });
    }
  }
  await recalcularAncestrais(noId);
}

export async function recalcularAncestrais(tarefaId: string): Promise<void> {
  const inicial = await prisma.tarefa.findUnique({
    where: { id: tarefaId },
    select: { tarefaPaiId: true },
  });
  let paiId = inicial?.tarefaPaiId ?? null;

  const visitados = new Set<string>();
  while (paiId && !visitados.has(paiId)) {
    visitados.add(paiId);
    const pai = await prisma.tarefa.findUnique({
      where: { id: paiId },
      select: { status: true, tarefaPaiId: true },
    });
    if (!pai) break;
    const filhas = await prisma.tarefa.findMany({
      where: { tarefaPaiId: paiId },
      select: { status: true },
    });
    const novo = statusDerivado(filhas as { status: "a_fazer" | "em_andamento" | "concluido" }[]);
    if (pai.status !== novo) {
      await prisma.tarefa.update({
        where: { id: paiId },
        data: { status: novo, concluidaEm: novo === "concluido" ? new Date() : null },
      });
    }
    paiId = pai.tarefaPaiId;
  }
}
