// Apresentação do Gantt — rótulos (PT-BR) e classes de cor. Separado de
// `gantt.ts` (domínio puro) pelo mesmo motivo que `tarefas-display.ts`:
// o domínio não conhece UI.
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Escala, OrigemSpan } from "@/lib/gantt";

export const ESCALA_LABEL: Record<Escala, string> = {
  dia: "Dia",
  semana: "Semana",
  mes: "Mês",
};

/** Rótulo do cabeçalho de uma coluna da grade. */
export function rotuloColuna(inicio: Date, escala: Escala): string {
  if (escala === "dia") return format(inicio, "dd/MM", { locale: ptBR });
  if (escala === "semana") return format(inicio, "dd/MM", { locale: ptBR });
  return format(inicio, "MMM/yy", { locale: ptBR });
}

/** Rótulo secundário (dia da semana / "semana de"), quando ajuda a ler a grade. */
export function subRotuloColuna(inicio: Date, escala: Escala): string | null {
  if (escala === "dia") return format(inicio, "EEEEEE", { locale: ptBR });
  if (escala === "semana") return "sem.";
  return null;
}

/**
 * Como cada origem de intervalo é desenhada. Um plano explícito é sólido; um
 * intervalo inferido é listrado/esmaecido, para não mentir sobre a confiança
 * do dado. Ver `OrigemSpan` em `gantt.ts`.
 */
export const ORIGEM_ESTILO: Record<OrigemSpan, { barra: string; rotulo: string }> = {
  planejado: {
    barra: "bg-indigo-500 dark:bg-indigo-400",
    rotulo: "Início e prazo definidos",
  },
  realizado: {
    barra: "bg-emerald-500 dark:bg-emerald-400",
    rotulo: "Concluída — do início até a conclusão",
  },
  execucao: {
    barra: "bg-blue-500 dark:bg-blue-400",
    rotulo: "Bloco de trabalho agendado no dia",
  },
  ponto: {
    barra: "bg-blue-500 ring-2 ring-blue-300 dark:bg-blue-400 dark:ring-blue-700",
    rotulo: "Só tem data de início — sem duração",
  },
  // Barra inferida: borda tracejada em vez de preenchimento sólido — sinaliza
  // "isto é um palpite" sem depender de gradiente arbitrário no Tailwind v4.
  ate_prazo: {
    barra: "border border-dashed border-amber-600/70 bg-amber-300/60 dark:border-amber-400/70 dark:bg-amber-500/30",
    rotulo: "Inferido: da criação até o prazo (sem início definido)",
  },
  rollup: {
    barra: "bg-zinc-400/70 dark:bg-zinc-500/70",
    rotulo: "Período somado das tarefas filhas",
  },
};

/** Texto do intervalo para tooltip/legenda. */
export function formatarIntervalo(inicio: Date, fim: Date): string {
  const mesmo = inicio.getTime() === fim.getTime();
  if (mesmo) return format(inicio, "dd/MM/yyyy", { locale: ptBR });
  return `${format(inicio, "dd/MM/yyyy", { locale: ptBR })} – ${format(fim, "dd/MM/yyyy", { locale: ptBR })}`;
}
