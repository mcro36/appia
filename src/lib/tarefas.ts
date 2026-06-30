// Domínio de tarefas — constantes, tipos, guards e regras de negócio puras.
// Sem dependências de React nem detalhes de apresentação (labels/cores ficam
// em `tarefas-display.ts`). Compartilhado entre client e server.

export const NIVEIS = ["operacional", "tatico", "estrategico"] as const;
export const TIPOS = ["atividade", "projeto"] as const;
export const STATUS = ["a_fazer", "em_andamento", "concluido"] as const;
export const PRIORIDADES = ["baixa", "media", "alta"] as const;
export const RECORRENCIAS = ["none", "diaria", "semanal", "mensal"] as const;

export type Nivel = (typeof NIVEIS)[number];
export type Tipo = (typeof TIPOS)[number];
export type Status = (typeof STATUS)[number];
export type Prioridade = (typeof PRIORIDADES)[number];
export type Recorrencia = (typeof RECORRENCIAS)[number];

export type TagDTO = {
  id: string;
  nome: string;
  cor: string;
};

// Tarefa = passo de uma atividade ou projeto (era "subtarefa")
// Pode ter subtarefas próprias (até 2 níveis na UI).
export type TarefaFilhaDTO = {
  id: string;
  titulo: string;
  status: Status;
  prioridade: Prioridade;
  prazo: string | null;
  dataInicio: string | null;
  duracaoMin: number | null;
  tarefas: TarefaFilhaDTO[];
};

// DTO principal — representa uma Atividade ou Projeto
export type TarefaDTO = {
  id: string;
  tipo: Tipo;
  nivel: Nivel;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  prioridade: Prioridade;
  status: Status;
  recorrencia: Recorrencia;
  recorrenciaAte: string | null;
  dataInicio: string | null;
  duracaoMin: number | null;
  criadaEm: string;
  atualizadaEm: string;
  tarefaPaiId: string | null;
  tags: TagDTO[];
  tarefas: TarefaFilhaDTO[];
};

export type TopicoDTO = {
  id: string;
  titulo: string;
  concluido: boolean;
};

export type ReuniaoDTO = {
  id: string;
  tarefaId: string;
  titulo: string | null;
  dataHora: string | null;
  duracaoMin: number | null;
  topicos: TopicoDTO[];
  criadaEm: string;
};

// ── Regras de negócio ──────────────────────────────────────────────

/** "Atrasada" é derivado do prazo: tem prazo vencido e não está concluída. */
export function isAtrasada(t: Pick<TarefaDTO, "prazo" | "status">): boolean {
  if (!t.prazo || t.status === "concluido") return false;
  return new Date(t.prazo).getTime() < Date.now();
}

/**
 * Status derivado de uma tarefa a partir das suas subtarefas:
 * todas concluídas → concluido; alguma concluída → em_andamento; nenhuma → a_fazer.
 */
export function statusDerivado(filhas: Pick<TarefaFilhaDTO, "status">[]): Status {
  const total = filhas.length;
  if (total === 0) return "a_fazer";
  const concluidas = filhas.filter((f) => f.status === "concluido").length;
  if (concluidas === total) return "concluido";
  if (concluidas > 0) return "em_andamento";
  return "a_fazer";
}

// ── Type guards (validação de entrada na API) ──────────────────────

export function isNivel(v: unknown): v is Nivel {
  return typeof v === "string" && (NIVEIS as readonly string[]).includes(v);
}
export function isTipo(v: unknown): v is Tipo {
  return typeof v === "string" && (TIPOS as readonly string[]).includes(v);
}
export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUS as readonly string[]).includes(v);
}
export function isPrioridade(v: unknown): v is Prioridade {
  return typeof v === "string" && (PRIORIDADES as readonly string[]).includes(v);
}
export function isRecorrencia(v: unknown): v is Recorrencia {
  return typeof v === "string" && (RECORRENCIAS as readonly string[]).includes(v);
}
