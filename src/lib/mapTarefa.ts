// Mapeia o registro do Prisma (com relações) para o DTO consumido pelo front.
// Mantido fora dos arquivos de rota: no Next 16, route handlers só podem
// exportar os métodos HTTP e configs reservadas.

export const includeTarefa = {
  tags: { include: { tag: true } },
  tarefas: true,
};

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
