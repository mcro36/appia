// Apresentação — rótulos (PT-BR), ícones e classes de cor para o domínio de tarefas.
// Separado de `tarefas.ts` (domínio puro) para honrar responsabilidade única:
// o domínio não conhece detalhes de exibição.
import type { Nivel, Tipo, Status, Prioridade, Recorrencia } from "@/lib/tarefas";

export const NIVEL_LABEL: Record<Nivel, string> = {
  operacional: "Operacional",
  tatico: "Tático",
  estrategico: "Estratégico",
};

export const NIVEL_COR: Record<Nivel, string> = {
  operacional: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  tatico: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  estrategico: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

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
