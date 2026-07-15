"use client";

import { eisenhower, type Quadrante } from "@/lib/metricas";
import { PRIORIDADE_COR, PRIORIDADE_LABEL } from "@/lib/tarefas-display";
import type { FolhaDTO } from "@/lib/agenda";

const QUADRANTES: { id: Quadrante; titulo: string; desc: string; cor: string }[] = [
  { id: "fazer", titulo: "Fazer agora", desc: "urgente + importante", cor: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30" },
  { id: "agendar", titulo: "Agendar", desc: "importante, sem pressa", cor: "border-indigo-300 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30" },
  { id: "delegar", titulo: "Delegar / rápido", desc: "urgente, menos importante", cor: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30" },
  { id: "eliminar", titulo: "Quando sobrar", desc: "nem urgente nem importante", cor: "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40" },
];

export function PainelMetricas({ folhas, carregando }: { folhas: FolhaDTO[]; carregando: boolean }) {
  if (carregando) return <p className="text-sm text-zinc-500">Carregando…</p>;

  const matriz = eisenhower(folhas);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {QUADRANTES.map((q) => (
        <div key={q.id} className={`rounded-xl border p-3 ${q.cor}`}>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-sm font-semibold">{q.titulo}</span>
            <span className="text-[11px] text-zinc-500">{q.desc}</span>
            <span className="ml-auto rounded-full bg-black/10 px-2 py-0.5 text-xs tabular-nums dark:bg-white/10">
              {matriz[q.id].length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {matriz[q.id].length === 0 && <p className="text-xs text-zinc-400">—</p>}
            {matriz[q.id].slice(0, 6).map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-md bg-white/70 px-2 py-1 text-xs dark:bg-zinc-900/60">
                <span className="truncate">{f.titulo}</span>
                <span className={`ml-auto shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium ${PRIORIDADE_COR[f.prioridade]}`}>
                  {PRIORIDADE_LABEL[f.prioridade]}
                </span>
              </div>
            ))}
            {matriz[q.id].length > 6 && (
              <p className="text-[11px] text-zinc-400">+{matriz[q.id].length - 6} mais</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
