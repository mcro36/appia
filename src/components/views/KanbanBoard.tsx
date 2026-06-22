"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertTriangle, X, GitBranch } from "lucide-react";
import {
  isAtrasada,
  PRIORIDADE_COR,
  PRIORIDADE_LABEL,
  STATUS,
  STATUS_COR,
  STATUS_LABEL,
  TIPO_COR,
  TIPO_LABEL,
  type Status,
  type TarefaDTO,
} from "@/lib/tarefas";

function Card({
  tarefa,
  onRemover,
  onDragStart,
  onAbrir,
}: {
  tarefa: TarefaDTO;
  onRemover: (id: string) => void;
  onDragStart: (id: string) => void;
  onAbrir: (t: TarefaDTO) => void;
}) {
  const atrasada = isAtrasada(tarefa);
  const subConcluidas = tarefa.tarefas.filter((s) => s.status === "concluido").length;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(tarefa.id)}
      onClick={() => onAbrir(tarefa)}
      className={`group cursor-pointer rounded-lg border border-black/10 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-white/10 dark:bg-zinc-900 border-l-2 ${TIPO_COR[tarefa.tipo].borda}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={`mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${TIPO_COR[tarefa.tipo].pill}`}>
            {TIPO_LABEL[tarefa.tipo]}
          </span>
          <p className="text-sm font-medium leading-snug">{tarefa.titulo}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemover(tarefa.id); }}
          aria-label="Remover"
          className="shrink-0 text-zinc-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tags */}
      {tarefa.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tarefa.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: tag.cor }}
            >
              {tag.nome}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORIDADE_COR[tarefa.prioridade]}`}>
          {PRIORIDADE_LABEL[tarefa.prioridade]}
        </span>
        {tarefa.prazo && (
          <span className={`inline-flex items-center gap-1 text-[11px] ${atrasada ? "font-medium text-red-600" : "text-zinc-500"}`}>
            {atrasada ? <AlertTriangle size={12} /> : <Clock size={12} />}
            {format(new Date(tarefa.prazo), "dd/MM HH:mm", { locale: ptBR })}
          </span>
        )}
        {tarefa.tarefas.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-400">
            <GitBranch size={11} />
            {subConcluidas}/{tarefa.tarefas.length}
          </span>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tarefas,
  onMudarStatus,
  onRemover,
  onAbrir,
}: {
  tarefas: TarefaDTO[];
  onMudarStatus: (id: string, status: Status) => void;
  onRemover: (id: string) => void;
  onAbrir: (t: TarefaDTO) => void;
}) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<Status | null>(null);

  function soltar(status: Status) {
    if (arrastando) onMudarStatus(arrastando, status);
    setArrastando(null);
    setColunaAlvo(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS.map((status) => {
        const daColuna = tarefas.filter((t) => t.status === status);
        const realce = colunaAlvo === status;
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setColunaAlvo(status); }}
            onDragLeave={() => setColunaAlvo((c) => (c === status ? null : c))}
            onDrop={() => soltar(status)}
            className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
              realce
                ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30"
                : "border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]"
            }`}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COR[status].ponto}`} />
              <span className="text-sm font-semibold">{STATUS_LABEL[status]}</span>
              <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/10">
                {daColuna.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {daColuna.map((t) => (
                <Card key={t.id} tarefa={t} onRemover={onRemover} onDragStart={setArrastando} onAbrir={onAbrir} />
              ))}
              {daColuna.length === 0 && (
                <p className="rounded-lg border border-dashed border-black/10 px-3 py-6 text-center text-xs text-zinc-400 dark:border-white/10">
                  Arraste tarefas para cá
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
