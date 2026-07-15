"use client";

import { mesmoDia, type FolhaDTO } from "@/lib/agenda";
import { formatarDuracao } from "@/lib/datas";

// Carga planejada por pessoa no dia: soma a duração das folhas em andamento
// agendadas para o dia, agrupada por responsável. Só aparece quando há
// colaboração (mais de um responsável distinto entre os blocos do dia).
export function WorkloadDia({ folhas, dia }: { folhas: FolhaDTO[]; dia: Date }) {
  const doDia = folhas.filter((f) => f.status === "em_andamento" && mesmoDia(f.dataInicio, dia));

  const mapa = new Map<string, { nome: string; min: number }>();
  for (const f of doDia) {
    const chave = f.assignee?.id ?? "sem";
    const nome = f.assignee?.nome ?? "Sem responsável";
    const atual = mapa.get(chave) ?? { nome, min: 0 };
    atual.min += f.duracaoMin ?? 0;
    mapa.set(chave, atual);
  }

  if (mapa.size < 2) return null; // sem colaboração relevante no dia

  const linhas = [...mapa.values()].sort((a, b) => b.min - a.min);
  const max = Math.max(...linhas.map((l) => l.min), 1);

  return (
    <div className="rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
      <p className="mb-2 text-xs font-semibold text-zinc-500">Carga por pessoa</p>
      <div className="flex flex-col gap-1.5">
        {linhas.map((l) => (
          <div key={l.nome} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-xs text-zinc-600 dark:text-zinc-300">{l.nome}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(l.min / max) * 100}%` }} />
            </div>
            <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-zinc-500">{formatarDuracao(l.min)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
