"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, GitBranch } from "lucide-react";
import { isAtrasada, PRIORIDADES, STATUS, type Prioridade, type Status, type TarefaDTO } from "@/lib/tarefas";
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
import { dataParaInputLocal } from "@/lib/datas";
import type { NovaTarefa } from "@/lib/api";

const TD = "px-4 py-2 align-middle";

function LinhaTarefa({
  t,
  onAtualizar,
  onRemover,
  onAbrir,
}: {
  t: TarefaDTO;
  onAtualizar: (id: string, dados: Partial<NovaTarefa>) => void;
  onRemover: (id: string) => void;
  onAbrir: (t: TarefaDTO) => void;
}) {
  const atrasada = isAtrasada(t);
  return (
    <tr className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.02]">
      <td className={`${TD} max-w-xs`}>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onAbrir(t)}
            className={`text-left font-medium hover:text-indigo-600 ${t.status === "concluido" ? "text-zinc-400 line-through" : ""}`}
          >
            {t.titulo}
          </button>
          <div className="flex flex-wrap gap-1">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TIPO_COR[t.tipo].pill}`}>
              {TIPO_LABEL[t.tipo]}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${NIVEL_COR[t.nivel]}`}>
              {NIVEL_LABEL[t.nivel]}
            </span>
            {t.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: tag.cor }}
              >
                {tag.nome}
              </span>
            ))}
            {t.tarefas.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-400">
                <GitBranch size={11} /> {t.tarefas.filter((s) => s.status === "concluido").length}/{t.tarefas.length}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className={TD}>
        <select
          value={t.status}
          onChange={(e) => onAtualizar(t.id, { status: e.target.value as Status })}
          className={`rounded-full border-0 px-2 py-1 text-xs font-medium outline-none ${STATUS_COR[t.status].pill}`}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </td>
      <td className={TD}>
        <select
          value={t.prioridade}
          onChange={(e) => onAtualizar(t.id, { prioridade: e.target.value as Prioridade })}
          className={`rounded-full border-0 px-2 py-1 text-xs font-medium outline-none ${PRIORIDADE_COR[t.prioridade]}`}
        >
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>
          ))}
        </select>
      </td>
      <td className={TD}>
        <input
          type="datetime-local"
          value={dataParaInputLocal(t.prazo)}
          onChange={(e) =>
            onAtualizar(t.id, { prazo: e.target.value ? new Date(e.target.value).toISOString() : null })
          }
          className={`rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none focus:border-indigo-500 dark:border-white/15 ${
            atrasada ? "text-red-600" : "text-zinc-600 dark:text-zinc-300"
          }`}
        />
      </td>
      <td className={`${TD} text-right`}>
        <button
          onClick={() => onRemover(t.id)}
          aria-label="Remover"
          className="rounded-md p-1.5 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}

export function TabelaTarefas({
  tarefas,
  onAtualizar,
  onRemover,
  onAbrir,
}: {
  tarefas: TarefaDTO[];
  onAtualizar: (id: string, dados: Partial<NovaTarefa>) => void;
  onRemover: (id: string) => void;
  onAbrir: (t: TarefaDTO) => void;
}) {
  const [concluidasAbertas, setConcluidasAbertas] = useState(false);

  const th = "px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400";
  const ativas = tarefas.filter((t) => t.status !== "concluido");
  const concluidas = tarefas.filter((t) => t.status === "concluido");

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
      <table className="w-full border-collapse text-sm">
        <thead className="border-b border-black/10 dark:border-white/10">
          <tr>
            <th className={th}>Tarefa</th>
            <th className={th}>Status</th>
            <th className={th}>Prioridade</th>
            <th className={th}>Prazo</th>
            <th className={th}></th>
          </tr>
        </thead>
        <tbody>
          {ativas.map((t) => (
            <LinhaTarefa key={t.id} t={t} onAtualizar={onAtualizar} onRemover={onRemover} onAbrir={onAbrir} />
          ))}
          {ativas.length === 0 && concluidas.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                Nenhuma tarefa ainda.
              </td>
            </tr>
          )}
          {concluidas.length > 0 && (
            <>
              <tr>
                <td colSpan={5} className="border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={() => setConcluidasAbertas((v) => !v)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {concluidasAbertas ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    Concluídas ({concluidas.length})
                  </button>
                </td>
              </tr>
              {concluidasAbertas && concluidas.map((t) => (
                <LinhaTarefa key={t.id} t={t} onAtualizar={onAtualizar} onRemover={onRemover} onAbrir={onAbrir} />
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
