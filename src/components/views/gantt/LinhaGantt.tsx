"use client";

// Uma linha do Gantt: rótulo (coluna fixa à esquerda) + faixa de tempo.
// Separado de `GanttProjeto` para manter cada componente focado.
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import type { Janela, NoGantt } from "@/lib/gantt";
import { STATUS_COR } from "@/lib/tarefas-display";
import { BarraTarefa } from "./BarraTarefa";

export const LARGURA_ROTULO_PX = 260;
const RECUO_POR_NIVEL_PX = 14;

export function LinhaGantt({
  no,
  janela,
  colunas,
  recolhido,
  onAlternar,
  onAbrir,
}: {
  no: NoGantt;
  janela: Janela;
  colunas: { inicio: Date; fim: Date }[];
  recolhido: boolean;
  onAlternar: (id: string) => void;
  onAbrir: (id: string) => void;
}) {
  const temFilhos = no.filhos.length > 0;

  return (
    <div className="flex border-b border-black/5 last:border-b-0 hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.02]">
      {/* Rótulo — gruda na esquerda ao rolar a linha do tempo na horizontal. */}
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-black/5 bg-white px-2 py-1.5 dark:border-white/5 dark:bg-zinc-900"
        style={{ width: LARGURA_ROTULO_PX, paddingLeft: 8 + no.profundidade * RECUO_POR_NIVEL_PX }}
      >
        {temFilhos ? (
          <button
            onClick={() => onAlternar(no.id)}
            aria-label={recolhido ? "Expandir" : "Recolher"}
            aria-expanded={!recolhido}
            className="shrink-0 rounded text-zinc-400 hover:bg-black/5 hover:text-zinc-600 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          >
            {recolhido ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          <span className="w-[14px] shrink-0" />
        )}

        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_COR[no.status].ponto}`} />

        <button
          onClick={() => onAbrir(no.id)}
          title={no.titulo}
          className="min-w-0 flex-1 truncate text-left text-xs text-zinc-700 hover:underline dark:text-zinc-200"
        >
          {no.titulo}
        </button>

        {!no.editavel && (
          <Lock size={11} className="shrink-0 text-zinc-400" aria-label="Somente leitura" />
        )}
        {!no.span && (
          <span className="shrink-0 rounded bg-amber-100 px-1 text-[9px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            sem data
          </span>
        )}
      </div>

      {/* Faixa de tempo */}
      <div className="relative h-8 flex-1">
        {/* Linhas verticais da grade (atrás das barras) */}
        <div className="absolute inset-0 flex">
          {colunas.map((c, i) => (
            <div
              key={i}
              className="flex-1 border-r border-black/[0.04] last:border-r-0 dark:border-white/[0.06]"
            />
          ))}
        </div>

        <BarraTarefa no={no} janela={janela} onAbrir={onAbrir} />
      </div>
    </div>
  );
}
