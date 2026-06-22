"use client";

import { useState } from "react";
import type { NovaTarefa } from "@/lib/api";
import {
  PRIORIDADES,
  PRIORIDADE_LABEL,
  RECORRENCIAS,
  RECORRENCIA_LABEL,
  STATUS,
  STATUS_LABEL,
  type Prioridade,
  type Recorrencia,
  type Status,
} from "@/lib/tarefas";

const campo =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15 dark:bg-zinc-800";
const rotulo = "mb-1 block text-xs font-medium text-zinc-500";

export function NovaTarefaForm({
  onCriar,
  onCancelar,
}: {
  onCriar: (dados: NovaTarefa) => Promise<void>;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [status, setStatus] = useState<Status>("a_fazer");
  const [recorrencia, setRecorrencia] = useState<Recorrencia>("none");
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || salvando) return;
    setSalvando(true);
    try {
      await onCriar({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        prazo: prazo ? new Date(prazo).toISOString() : null,
        prioridade,
        status,
        recorrencia,
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className={rotulo}>Título *</label>
        <input
          autoFocus
          className={campo}
          placeholder="Ex.: Enviar relatório mensal à diretoria"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

      <div>
        <label className={rotulo}>Descrição</label>
        <textarea
          className={`${campo} min-h-20 resize-y`}
          placeholder="Detalhes, contexto, links…"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={rotulo}>Prazo</label>
          <input
            type="datetime-local"
            className={campo}
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
        </div>
        <div>
          <label className={rotulo}>Prioridade</label>
          <select
            className={campo}
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as Prioridade)}
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {PRIORIDADE_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Status</label>
          <select
            className={campo}
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Repetição</label>
          <select
            className={campo}
            value={recorrencia}
            onChange={(e) => setRecorrencia(e.target.value as Recorrencia)}
          >
            {RECORRENCIAS.map((r) => (
              <option key={r} value={r}>
                {RECORRENCIA_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!titulo.trim() || salvando}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {salvando ? "Adicionando…" : "Adicionar tarefa"}
        </button>
      </div>
    </form>
  );
}
