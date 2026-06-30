// Mapeia o registro do Prisma (com relações) para o DTO consumido pelo front.
// Mantido fora dos arquivos de rota: no Next 16, route handlers só podem
// exportar os métodos HTTP e configs reservadas.

// Include raso: lista de raízes (Kanban/Tabela) — só 1 nível de filhas.
export const includeTarefa = {
  tags: { include: { tag: true } },
  tarefas: true,
};

// Include profundo: detalhe de uma tarefa — 2 níveis de filhas (tarefa → subtarefa).
export const includeTarefaDetalhe = {
  tags: { include: { tag: true } },
  tarefas: { include: { tarefas: true } },
};

// Achata a árvore (raízes → filhas → netas) em folhas agendáveis (nós sem
// filhos), carregando o projeto/atividade raiz para o planejador diário.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenFolhas(raizes: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (node: any, raiz: any) => {
    const filhos = node.tarefas ?? [];
    if (filhos.length === 0) {
      out.push({
        id: node.id,
        titulo: node.titulo,
        status: node.status,
        prioridade: node.prioridade,
        prazo: node.prazo,
        dataInicio: node.dataInicio,
        duracaoMin: node.duracaoMin,
        tempoGastoMin: node.tempoGastoMin ?? null,
        concluidaEm: node.concluidaEm ?? null,
        projeto: { id: raiz.id, titulo: raiz.titulo, tipo: raiz.tipo, nivel: raiz.nivel },
      });
    } else {
      for (const f of filhos) walk(f, raiz);
    }
  };
  for (const r of raizes) walk(r, r);
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFilha(s: any) {
  return {
    id: s.id,
    titulo: s.titulo,
    status: s.status,
    prioridade: s.prioridade,
    prazo: s.prazo,
    dataInicio: s.dataInicio,
    duracaoMin: s.duracaoMin,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tarefas: (s.tarefas ?? []).map((n: any) => mapFilha(n)),
  };
}

export const includeReuniao = {
  topicos: { orderBy: { criadoEm: "asc" as const } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapReuniao(r: any) {
  return {
    id: r.id,
    tarefaId: r.tarefaId,
    titulo: r.titulo ?? null,
    dataHora: r.dataHora ?? null,
    duracaoMin: r.duracaoMin ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    topicos: (r.topicos ?? []).map((t: any) => ({ id: t.id, titulo: t.titulo, concluido: t.concluido })),
    criadaEm: r.criadaEm,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTarefa(t: any) {
  return {
    id: t.id,
    tipo: t.tipo,
    nivel: t.nivel,
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
    tarefas: (t.tarefas ?? []).map(mapFilha),
  };
}
