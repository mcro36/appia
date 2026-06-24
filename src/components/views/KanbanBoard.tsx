"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, Clock, AlertTriangle, X, GitBranch } from "lucide-react";
import { useIsPWA } from "@/lib/useIsPWA";
import { isAtrasada, STATUS, type Status, type TarefaDTO } from "@/lib/tarefas";
import {
  NIVEL_COR,
  NIVEL_LABEL,
  PRIORIDADE_COR,
  PRIORIDADE_LABEL,
  STATUS_COR,
  STATUS_LABEL,
  TIPO_COR,
  TIPO_LABEL,
} from "@/lib/tarefas-display";

const PWA_STATUS_LABEL: Record<Status, string> = {
  a_fazer: "A fazer",
  em_andamento: "Andamento",
  concluido: "Concluído",
};

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
          <div className="mb-1 flex flex-wrap gap-1">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TIPO_COR[tarefa.tipo].pill}`}>
              {TIPO_LABEL[tarefa.tipo]}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${NIVEL_COR[tarefa.nivel]}`}>
              {NIVEL_LABEL[tarefa.nivel]}
            </span>
          </div>
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

function Coluna({
  status,
  tarefas,
  realce,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemover,
  onDragStart,
  onAbrir,
  textoVazio,
  hideHeader,
  colapsavel,
}: {
  status: Status;
  tarefas: TarefaDTO[];
  realce: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onRemover: (id: string) => void;
  onDragStart: (id: string) => void;
  onAbrir: (t: TarefaDTO) => void;
  textoVazio: string;
  hideHeader?: boolean;
  colapsavel?: boolean;
}) {
  const [colapsado, setColapsado] = useState(colapsavel ?? false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-col rounded-xl border p-3 transition-colors ${
        realce
          ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30"
          : "border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]"
      }`}
    >
      {!hideHeader && (
        <div
          className={`mb-3 flex items-center gap-2 px-1 ${colapsavel ? "cursor-pointer select-none" : ""}`}
          onClick={colapsavel ? () => setColapsado((v) => !v) : undefined}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COR[status].ponto}`} />
          <span className="text-sm font-semibold">{STATUS_LABEL[status]}</span>
          <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/10">
            {tarefas.length}
          </span>
          {colapsavel && (
            <ChevronDown size={14} className={`text-zinc-400 transition-transform ${colapsado ? "-rotate-90" : ""}`} />
          )}
        </div>
      )}
      {!colapsado && (
        <div className="flex flex-col gap-2">
          {tarefas.map((t) => (
            <Card key={t.id} tarefa={t} onRemover={onRemover} onDragStart={onDragStart} onAbrir={onAbrir} />
          ))}
          {tarefas.length === 0 && (
            <p className="rounded-lg border border-dashed border-black/10 px-3 py-6 text-center text-xs text-zinc-400 dark:border-white/10">
              {textoVazio}
            </p>
          )}
        </div>
      )}
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
  const [abaAtiva, setAbaAtiva] = useState<Status>("a_fazer");
  const isPWA = useIsPWA();

  function soltar(status: Status) {
    if (arrastando) onMudarStatus(arrastando, status);
    setArrastando(null);
    setColunaAlvo(null);
  }

  const colunaProps = (status: Status) => ({
    status,
    tarefas: tarefas.filter((t) => t.status === status),
    realce: colunaAlvo === status,
    onDragOver: () => setColunaAlvo(status),
    onDragLeave: () => setColunaAlvo((c) => (c === status ? null : c)),
    onDrop: () => soltar(status),
    onRemover,
    onDragStart: setArrastando,
    onAbrir,
    textoVazio: "Nenhuma tarefa",
  });

  /* ── Layout PWA: abas ── */
  if (isPWA) {
    return (
      <div className="flex flex-col gap-4">
        {/* Segmented control — estilo nativo */}
        <div className="grid grid-cols-3 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800/60">
          {STATUS.map((status) => {
            const count = tarefas.filter((t) => t.status === status).length;
            const ativa = abaAtiva === status;
            return (
              <button
                key={status}
                onClick={() => setAbaAtiva(status)}
                className={`flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-200 ${
                  ativa
                    ? "bg-white shadow-sm dark:bg-zinc-700"
                    : "text-zinc-400 active:bg-white/50 dark:text-zinc-500"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${STATUS_COR[status].ponto}`} />
                <span className={`text-[11px] font-semibold ${ativa ? "text-zinc-800 dark:text-zinc-100" : ""}`}>
                  {PWA_STATUS_LABEL[status]}
                </span>
                <span className={`text-[10px] tabular-nums ${ativa ? "text-zinc-400" : "text-zinc-300 dark:text-zinc-600"}`}>
                  {count} {count === 1 ? "item" : "itens"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Coluna ativa — sem cabeçalho (tab já mostra o status) */}
        <Coluna {...colunaProps(abaAtiva)} textoVazio="Nenhuma tarefa" hideHeader />
      </div>
    );
  }

  /* ── Layout desktop: colunas side-by-side ── */
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS.map((status) => (
        <div key={status} className="w-72 shrink-0">
          <Coluna {...colunaProps(status)} textoVazio="Arraste tarefas para cá" colapsavel={status === "concluido"} />
        </div>
      ))}
    </div>
  );
}
