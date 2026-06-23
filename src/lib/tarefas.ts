// Domínio — constantes, rótulos e helpers compartilhados (client + server)

export const TIPOS = ["atividade", "projeto"] as const;
export const STATUS = ["a_fazer", "em_andamento", "concluido"] as const;
export const PRIORIDADES = ["baixa", "media", "alta"] as const;
export const RECORRENCIAS = ["none", "diaria", "semanal", "mensal"] as const;

export type Tipo = (typeof TIPOS)[number];
export type Status = (typeof STATUS)[number];
export type Prioridade = (typeof PRIORIDADES)[number];
export type Recorrencia = (typeof RECORRENCIAS)[number];

export const TIPO_LABEL: Record<Tipo, string> = {
  atividade: "Atividade",
  projeto: "Projeto",
};

export const TIPO_ICONE: Record<Tipo, string> = {
  atividade: "⚡",
  projeto: "📁",
};

export const STATUS_LABEL: Record<Status, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const RECORRENCIA_LABEL: Record<Recorrencia, string> = {
  none: "Não repete",
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
};

export const STATUS_COR: Record<Status, { pill: string; barra: string; ponto: string }> = {
  a_fazer: {
    pill: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    barra: "bg-zinc-400",
    ponto: "bg-zinc-400",
  },
  em_andamento: {
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    barra: "bg-blue-500",
    ponto: "bg-blue-500",
  },
  concluido: {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    barra: "bg-emerald-500",
    ponto: "bg-emerald-500",
  },
};

export const TIPO_COR: Record<Tipo, { pill: string; borda: string }> = {
  atividade: {
    pill: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    borda: "border-l-sky-400",
  },
  projeto: {
    pill: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    borda: "border-l-violet-500",
  },
};

export const PRIORIDADE_COR: Record<Prioridade, string> = {
  baixa: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  alta: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

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

export function isAtrasada(t: Pick<TarefaDTO, "prazo" | "status">): boolean {
  if (!t.prazo || t.status === "concluido") return false;
  return new Date(t.prazo).getTime() < Date.now();
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
