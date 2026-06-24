"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar, ChevronRight, ChevronDown, Trash2,
  CheckSquare, Square, Plus, Users,
} from "lucide-react";
import { dataParaInputLocal } from "@/lib/datas";
import type { ReuniaoDTO, TopicoDTO } from "@/lib/tarefas";

type Props = {
  reuniao: ReuniaoDTO;
  onAtualizar: (id: string, dados: { titulo?: string | null; dataHora?: string | null; anotacoes?: string | null }) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
  onAdicionarTopico: (reuniaoId: string, titulo: string) => Promise<void>;
  onToggleTopico: (reuniaoId: string, topico: TopicoDTO) => Promise<void>;
  onRenomearTopico: (reuniaoId: string, topicoId: string, titulo: string) => Promise<void>;
  onRemoverTopico: (reuniaoId: string, topicoId: string) => Promise<void>;
};

export function ReuniaoLinha({
  reuniao, onAtualizar, onRemover,
  onAdicionarTopico, onToggleTopico, onRenomearTopico, onRemoverTopico,
}: Props) {
  const [expandido, setExpandido] = useState(false);
  const [titulo, setTitulo] = useState(reuniao.titulo ?? "");
  const [dataHora, setDataHora] = useState(dataParaInputLocal(reuniao.dataHora));
  const [anotacoes, setAnotacoes] = useState(reuniao.anotacoes ?? "");
  const [novoTopico, setNovoTopico] = useState("");
  const [editandoTopico, setEditandoTopico] = useState<string | null>(null);
  const [topicoEdit, setTopicoEdit] = useState("");
  const [concluidosAbertos, setConcluidosAbertos] = useState(false);

  const topicosAtivos = reuniao.topicos.filter((t) => !t.concluido);
  const topicosConcluidos = reuniao.topicos.filter((t) => t.concluido);

  function salvarTitulo() {
    const novo = titulo.trim();
    if (novo !== (reuniao.titulo ?? "")) onAtualizar(reuniao.id, { titulo: novo || null });
  }

  function salvarDataHora() {
    const novo = dataHora ? new Date(dataHora).toISOString() : null;
    if (novo !== reuniao.dataHora) onAtualizar(reuniao.id, { dataHora: novo });
  }

  function salvarAnotacoes() {
    const nova = anotacoes.trim();
    if (nova !== (reuniao.anotacoes ?? "")) onAtualizar(reuniao.id, { anotacoes: nova || null });
  }

  async function adicionarTopico() {
    const texto = novoTopico.trim();
    if (!texto) return;
    setNovoTopico("");
    await onAdicionarTopico(reuniao.id, texto);
  }

  function iniciarEdicaoTopico(t: TopicoDTO) {
    setEditandoTopico(t.id);
    setTopicoEdit(t.titulo);
  }

  async function salvarEdicaoTopico(topicoId: string, tituloAtual: string) {
    const novo = topicoEdit.trim();
    if (novo && novo !== tituloAtual) await onRenomearTopico(reuniao.id, topicoId, novo);
    setEditandoTopico(null);
  }

  function confirmarExclusao() {
    if (!confirm(`Excluir reunião "${reuniao.titulo || "sem título"}"?`)) return;
    onRemover(reuniao.id);
  }

  function renderTopico(t: TopicoDTO) {
    const editando = editandoTopico === t.id;
    return (
      <li key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onToggleTopico(reuniao.id, t)}
          className="shrink-0 text-zinc-400 hover:text-indigo-600"
        >
          {t.concluido
            ? <CheckSquare size={14} className="text-emerald-600" />
            : <Square size={14} />
          }
        </button>
        {editando ? (
          <input
            autoFocus
            value={topicoEdit}
            onChange={(e) => setTopicoEdit(e.target.value)}
            onBlur={() => salvarEdicaoTopico(t.id, t.titulo)}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvarEdicaoTopico(t.id, t.titulo);
              if (e.key === "Escape") setEditandoTopico(null);
            }}
            className="flex-1 rounded border border-indigo-400 bg-white px-1.5 py-0.5 text-sm outline-none dark:bg-zinc-900"
          />
        ) : (
          <span
            onClick={() => iniciarEdicaoTopico(t)}
            className={`flex-1 cursor-pointer text-sm ${t.concluido ? "text-zinc-400 line-through" : ""}`}
          >
            {t.titulo}
          </span>
        )}
        {!editando && (
          <button
            onClick={() => onRemoverTopico(reuniao.id, t.id)}
            className="shrink-0 text-zinc-300 transition-colors hover:text-red-500"
          >
            <Trash2 size={12} />
          </button>
        )}
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-black/5 bg-white dark:border-white/5 dark:bg-zinc-800/50">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => setExpandido((v) => !v)}
          className="shrink-0 text-zinc-400 hover:text-indigo-600"
        >
          {expandido ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <Users size={14} className="shrink-0 text-zinc-400" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${!reuniao.titulo ? "italic text-zinc-400" : ""}`}>
            {reuniao.titulo || "Reunião sem título"}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {reuniao.dataHora && (
              <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600">
                <Calendar size={10} />
                {format(new Date(reuniao.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
            {reuniao.topicos.length > 0 && (
              <span className="text-[11px] tabular-nums text-zinc-400">
                {topicosConcluidos.length}/{reuniao.topicos.length} tópicos
              </span>
            )}
          </div>
        </div>
        <button
          onClick={confirmarExclusao}
          title="Excluir reunião"
          className="shrink-0 rounded p-1 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Conteúdo expandido */}
      {expandido && (
        <div className="space-y-3 border-t border-black/5 px-3 pb-3 pt-2 dark:border-white/5">
          {/* Título + Data */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[11px] font-medium text-zinc-500">Título</p>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onBlur={salvarTitulo}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                placeholder="Reunião sem título"
                className="w-full rounded-md px-2 py-1 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-zinc-500">Data e hora</p>
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                onBlur={salvarDataHora}
                className="w-full rounded-md px-2 py-1 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
              />
            </div>
          </div>

          {/* Tópicos */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-zinc-500">Tópicos</p>
            {topicosAtivos.length > 0 && (
              <ul className="mb-1 space-y-0.5">{topicosAtivos.map(renderTopico)}</ul>
            )}
            {topicosConcluidos.length > 0 && (
              <div className="mb-1">
                <button
                  onClick={() => setConcluidosAbertos((v) => !v)}
                  className="flex items-center gap-1.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {concluidosAbertos ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  Concluídos ({topicosConcluidos.length})
                </button>
                {concluidosAbertos && (
                  <ul className="space-y-0.5">{topicosConcluidos.map(renderTopico)}</ul>
                )}
              </div>
            )}
            <div className="mt-1 flex gap-1.5">
              <input
                value={novoTopico}
                onChange={(e) => setNovoTopico(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") adicionarTopico(); }}
                onBlur={adicionarTopico}
                placeholder="Adicionar tópico…"
                className="flex-1 rounded-md px-2 py-1 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
              />
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={adicionarTopico}
                disabled={!novoTopico.trim()}
                className="rounded-md bg-zinc-100 px-2 py-1 hover:bg-zinc-200 disabled:opacity-40 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Anotações */}
          <div>
            <p className="mb-1 text-[11px] font-medium text-zinc-500">Anotações</p>
            <textarea
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              onBlur={salvarAnotacoes}
              rows={3}
              placeholder="Ata, decisões, próximos passos…"
              className="w-full resize-none rounded-md p-2 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10 dark:text-zinc-300"
            />
          </div>
        </div>
      )}
    </li>
  );
}
