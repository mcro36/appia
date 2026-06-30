"use client";

import { CheckCircle2, Clock, Timer, ListTodo } from "lucide-react";
import { resumo, porProjeto, eisenhower, type Quadrante } from "@/lib/metricas";
import { formatarDuracao } from "@/lib/datas";
import { NIVEL_COR, NIVEL_LABEL, PRIORIDADE_COR, PRIORIDADE_LABEL } from "@/lib/tarefas-display";
import type { FolhaDTO } from "@/lib/agenda";

const QUADRANTES: { id: Quadrante; titulo: string; desc: string; cor: string }[] = [
  { id: "fazer", titulo: "Fazer agora", desc: "urgente + importante", cor: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30" },
  { id: "agendar", titulo: "Agendar", desc: "importante, sem pressa", cor: "border-indigo-300 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30" },
  { id: "delegar", titulo: "Delegar / rápido", desc: "urgente, menos importante", cor: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30" },
  { id: "eliminar", titulo: "Quando sobrar", desc: "nem urgente nem importante", cor: "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40" },
];

export function PainelMetricas({ folhas, carregando }: { folhas: FolhaDTO[]; carregando: boolean }) {
  if (carregando) return <p className="text-sm text-zinc-500">Carregando…</p>;

  const r = resumo(folhas);
  const projetos = porProjeto(folhas);
  const matriz = eisenhower(folhas);

  return (
    <div className="flex flex-col gap-6">
      {/* Cartões de resumo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao icone={<CheckCircle2 size={18} className="text-emerald-600" />} rotulo="Conclusão" valor={`${r.pctConcluido}%`} sub={`${r.concluidas} de ${r.total}`} />
        <Cartao icone={<ListTodo size={18} className="text-zinc-500" />} rotulo="A fazer" valor={String(r.aFazer)} sub={`${r.emAndamento} em andamento`} />
        <Cartao icone={<Clock size={18} className="text-indigo-600" />} rotulo="Estimado" valor={formatarDuracao(r.estimadoMin)} sub="soma das durações" />
        <Cartao icone={<Timer size={18} className="text-emerald-600" />} rotulo="Tempo real" valor={formatarDuracao(r.realMin)} sub="registrado no foco" />
      </div>

      {/* Conclusão por projeto */}
      <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-zinc-900/40">
        <p className="mb-3 text-sm font-semibold">Conclusão por projeto</p>
        <div className="flex flex-col gap-2.5">
          {projetos.length === 0 && <p className="text-xs text-zinc-400">Sem dados.</p>}
          {projetos.map((l) => {
            const pct = l.total ? Math.round((l.concluidas / l.total) * 100) : 0;
            return (
              <div key={l.projeto.id}>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="truncate font-medium">{l.projeto.titulo}</span>
                  <span className={`rounded px-1 py-px text-[9px] font-semibold ${NIVEL_COR[l.projeto.nivel]}`}>
                    {NIVEL_LABEL[l.projeto.nivel]}
                  </span>
                  <span className="ml-auto tabular-nums text-zinc-400">
                    {l.concluidas}/{l.total}{l.realMin ? ` · ${formatarDuracao(l.realMin)}` : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matriz de Eisenhower */}
      <div>
        <p className="mb-3 text-sm font-semibold">Matriz de prioridades (Eisenhower)</p>
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
      </div>
    </div>
  );
}

function Cartao({ icone, rotulo, valor, sub }: { icone: React.ReactNode; rotulo: string; valor: string; sub: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-zinc-900/40">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-zinc-500">
        {icone} {rotulo}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="text-[11px] text-zinc-400">{sub}</p>
    </div>
  );
}
