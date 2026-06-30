"use client";

import { addDays, startOfWeek, isSameDay, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users } from "lucide-react";
import { mesmoDia, capacidadeDoDia, type FolhaDTO, type ReuniaoSlim, type ConfigDTO } from "@/lib/agenda";
import { formatarDuracao } from "@/lib/datas";

export function VisaoSemana({
  dia,
  folhas,
  reunioes,
  config,
  onSelecionarDia,
}: {
  dia: Date;
  folhas: FolhaDTO[];
  reunioes: ReuniaoSlim[];
  config: ConfigDTO;
  onSelecionarDia: (d: Date) => void;
}) {
  const inicio = startOfWeek(dia, { weekStartsOn: 1 });
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicio, i));

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {dias.map((d) => {
        const blocos = folhas
          .filter((f) => f.status === "em_andamento" && mesmoDia(f.dataInicio, d))
          .sort((a, b) => (a.dataInicio ?? "").localeCompare(b.dataInicio ?? ""));
        const reuniaoDia = reunioes.filter((r) => mesmoDia(r.dataHora, d));
        const cap = capacidadeDoDia(reunioes, blocos, d, config);
        const sobre = cap.planejadoMin > cap.disponivelMin;

        return (
          <button
            key={d.toISOString()}
            onClick={() => onSelecionarDia(d)}
            className={`flex min-h-44 flex-col rounded-xl border p-2 text-left transition-colors hover:border-indigo-400 ${
              isToday(d)
                ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                : "border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]"
            }`}
          >
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-semibold capitalize">{format(d, "EEE", { locale: ptBR })}</span>
              <span className={`text-xs tabular-nums ${isSameDay(d, dia) ? "font-bold text-indigo-600" : "text-zinc-400"}`}>
                {format(d, "dd/MM")}
              </span>
            </div>
            <span className={`mb-1.5 text-[10px] ${sobre ? "font-medium text-red-600" : "text-zinc-400"}`}>
              {formatarDuracao(cap.planejadoMin)} / {formatarDuracao(cap.disponivelMin)}
            </span>

            <div className="flex flex-col gap-1">
              {reuniaoDia.map((r) => (
                <div key={r.id} className="flex items-center gap-1 truncate rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                  <Users size={9} className="shrink-0" />
                  <span className="truncate">{r.titulo || "Reunião"}</span>
                </div>
              ))}
              {blocos.map((f) => (
                <div key={f.id} className="truncate rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-100">
                  {f.dataInicio ? format(new Date(f.dataInicio), "HH:mm") + " " : ""}{f.titulo}
                </div>
              ))}
              {blocos.length === 0 && reuniaoDia.length === 0 && (
                <span className="text-[10px] text-zinc-300 dark:text-zinc-600">livre</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
