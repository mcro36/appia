"use client";

import { format } from "date-fns";
import { Lock, Play, ChevronsRight, Clock, Timer, AlertTriangle } from "lucide-react";
import { PRIORIDADE_COR, PRIORIDADE_LABEL } from "@/lib/tarefas-display";
import { formatarDuracao } from "@/lib/datas";
import type { FolhaDTO } from "@/lib/agenda";

// Cartão de uma folha (tarefa-folha) no planejador: arrastável entre colunas,
// com ações de foco/adiar e indicadores de horário, tempo real e atraso.
export function CartaoFolha({
  folha,
  carryOver,
  onDragStart,
  onAdiar,
  onFoco,
  focando,
}: {
  folha: FolhaDTO;
  carryOver: boolean;
  onDragStart: () => void;
  onAdiar?: () => void;
  onFoco?: () => void;
  focando?: boolean;
}) {
  const concluida = folha.status === "concluido";
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group cursor-grab rounded-lg border bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:bg-zinc-900 ${
        focando ? "border-indigo-400 ring-1 ring-indigo-300" : "border-black/10 dark:border-white/10"
      }`}
    >
      <div className="flex items-start gap-2">
        {folha.prazoRigido && (
          <Lock size={11} className="mt-0.5 shrink-0 text-red-500" aria-label="Prazo rígido" />
        )}
        <p className={`flex-1 text-sm leading-snug ${concluida ? "text-zinc-400 line-through" : "font-medium"}`}>
          {folha.titulo}
        </p>
        {onFoco && !focando && (
          <button
            onClick={(e) => { e.stopPropagation(); onFoco(); }}
            title="Iniciar foco"
            className="shrink-0 rounded p-0.5 text-zinc-300 opacity-0 transition hover:text-indigo-600 group-hover:opacity-100"
          >
            <Play size={14} />
          </button>
        )}
        {onAdiar && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdiar(); }}
            title="Adiar para amanhã"
            className="shrink-0 rounded p-0.5 text-zinc-300 opacity-0 transition hover:text-indigo-600 group-hover:opacity-100"
          >
            <ChevronsRight size={15} />
          </button>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORIDADE_COR[folha.prioridade]}`}>
          {PRIORIDADE_LABEL[folha.prioridade]}
        </span>
        {folha.dataInicio && (
          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600">
            <Clock size={10} />
            {format(new Date(folha.dataInicio), "HH:mm")}
            {folha.duracaoMin ? ` · ${formatarDuracao(folha.duracaoMin)}` : ""}
          </span>
        )}
        {folha.tempoGastoMin != null && folha.tempoGastoMin > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600" title="Tempo real registrado">
            <Timer size={10} /> {formatarDuracao(folha.tempoGastoMin)}
          </span>
        )}
        {carryOver && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600">
            <AlertTriangle size={10} /> atrasada
          </span>
        )}
      </div>
    </div>
  );
}
