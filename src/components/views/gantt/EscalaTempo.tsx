"use client";

// Cabeçalho da grade: rótulos das colunas + marcador de "hoje".
import { percentual, type Escala, type Janela } from "@/lib/gantt";
import { rotuloColuna, subRotuloColuna } from "@/lib/gantt-display";
import { LARGURA_ROTULO_PX } from "./LinhaGantt";

export function EscalaTempo({
  colunas,
  janela,
  escala,
}: {
  colunas: { inicio: Date; fim: Date }[];
  janela: Janela;
  escala: Escala;
}) {
  const hoje = new Date();
  const hojeDentro = hoje >= janela.de && hoje <= janela.ate ? percentual(hoje, janela) : null;

  return (
    <div className="sticky top-0 z-20 flex border-b border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-800/60">
      <div
        className="sticky left-0 z-10 shrink-0 border-r border-black/10 bg-zinc-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:bg-zinc-800/60"
        style={{ width: LARGURA_ROTULO_PX }}
      >
        Tarefa
      </div>

      <div className="relative flex flex-1">
        {colunas.map((c, i) => {
          const sub = subRotuloColuna(c.inicio, escala);
          const fimDeSemana = escala === "dia" && [0, 6].includes(c.inicio.getDay());
          return (
            <div
              key={i}
              className={`flex-1 border-r border-black/[0.06] px-1 py-1 text-center last:border-r-0 dark:border-white/[0.08] ${
                fimDeSemana ? "bg-black/[0.03] dark:bg-white/[0.03]" : ""
              }`}
            >
              <div className="truncate text-[10px] font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
                {rotuloColuna(c.inicio, escala)}
              </div>
              {sub && <div className="truncate text-[9px] text-zinc-400">{sub}</div>}
            </div>
          );
        })}

        {/* Marcador de hoje */}
        {hojeDentro !== null && (
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-red-500/70"
            style={{ left: `${hojeDentro}%` }}
          >
            <span className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red-500" />
          </div>
        )}
      </div>
    </div>
  );
}
