"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar, Clock, ChevronRight, ChevronDown, Trash2, Check,
  CheckSquare, Square, Plus, Users, Pencil, CalendarClock,
} from "lucide-react";
import { dataParaInputLocal, formatarDuracao } from "@/lib/datas";
import type { ReuniaoDTO, TopicoDTO } from "@/lib/tarefas";

type Props = {
  reuniao: ReuniaoDTO;
  onAtualizar: (id: string, dados: { titulo?: string | null; dataHora?: string | null; duracaoMin?: number | null }) => Promise<void>;
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
  const [editando, setEditando] = useState(false);
  const [tituloEdit, setTituloEdit] = useState(reuniao.titulo ?? "");
  const [agendaAberta, setAgendaAberta] = useState(false);
  const [dataHoraEdit, setDataHoraEdit] = useState(dataParaInputLocal(reuniao.dataHora));
  const [duracaoEdit, setDuracaoEdit] = useState(reuniao.duracaoMin ? String(reuniao.duracaoMin) : "");
  const [novoTopico, setNovoTopico] = useState("");
  const [editandoTopico, setEditandoTopico] = useState<string | null>(null);
  const [topicoEdit, setTopicoEdit] = useState("");
  const [concluidosAbertos, setConcluidosAbertos] = useState(false);
  const agendaRef = useRef<HTMLDivElement>(null);

  const topicosAtivos = reuniao.topicos.filter((t) => !t.concluido);
  const topicosConcluidos = reuniao.topicos.filter((t) => t.concluido);

  // Fecha popover de agenda ao clicar fora (salvando)
  useEffect(() => {
    if (!agendaAberta) return;
    const onClick = (e: MouseEvent) => {
      if (agendaRef.current && !agendaRef.current.contains(e.target as Node)) {
        salvarAgenda();
        setAgendaAberta(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendaAberta, dataHoraEdit, duracaoEdit]);

  function salvarAgenda() {
    const novaData = dataHoraEdit ? new Date(dataHoraEdit).toISOString() : null;
    const novaDur = duracaoEdit ? parseInt(duracaoEdit, 10) : null;
    if (novaData !== reuniao.dataHora || novaDur !== reuniao.duracaoMin)
      onAtualizar(reuniao.id, { dataHora: novaData, duracaoMin: novaDur });
  }

  function salvarTitulo() {
    const novo = tituloEdit.trim();
    if (novo !== (reuniao.titulo ?? "")) onAtualizar(reuniao.id, { titulo: novo || null });
    setEditando(false);
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
    const eEditando = editandoTopico === t.id;
    return (
      <li key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onToggleTopico(reuniao.id, t)}
          className="shrink-0 text-zinc-400 hover:text-indigo-600"
        >
          {t.concluido
            ? <CheckSquare size={14} className="text-emerald-600" />
            : <Square size={14} />}
        </button>
        {eEditando ? (
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
        {!eEditando && (
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
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          onClick={() => setExpandido((v) => !v)}
          className="shrink-0 text-zinc-400 hover:text-indigo-600"
        >
          {expandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <Users size={14} className="shrink-0 text-zinc-400" />

        <div className="flex-1 min-w-0" onClick={!editando ? () => setExpandido((v) => !v) : undefined} role={!editando ? "button" : undefined}>
          {editando ? (
            <input
              autoFocus
              value={tituloEdit}
              onChange={(e) => setTituloEdit(e.target.value)}
              onBlur={salvarTitulo}
              onKeyDown={(e) => {
                if (e.key === "Enter") salvarTitulo();
                if (e.key === "Escape") { setTituloEdit(reuniao.titulo ?? ""); setEditando(false); }
              }}
              className="w-full rounded border border-indigo-400 bg-white px-1.5 py-0.5 text-sm outline-none dark:bg-zinc-900"
            />
          ) : (
            <>
              <p className={`truncate text-sm font-medium ${!reuniao.titulo ? "italic text-zinc-400" : ""}`}>
                {reuniao.titulo || "Reunião sem título"}
              </p>
              {(reuniao.dataHora || reuniao.duracaoMin) && (
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  {reuniao.dataHora && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600">
                      <Calendar size={10} />
                      {format(new Date(reuniao.dataHora), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  )}
                  {reuniao.duracaoMin && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                      <Clock size={10} />
                      {formatarDuracao(reuniao.duracaoMin)}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Contador de tópicos */}
        {reuniao.topicos.length > 0 && !editando && (
          <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
            {topicosConcluidos.length}/{reuniao.topicos.length}
          </span>
        )}

        {/* Ações */}
        {editando ? (
          <>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={confirmarExclusao}
              title="Excluir"
              className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            >
              <Trash2 size={15} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={salvarTitulo}
              title="Salvar"
              className="shrink-0 rounded p-1 text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Check size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setAgendaAberta((v) => !v)}
              title="Agendar"
              className={`shrink-0 rounded p-1 transition-colors ${
                reuniao.dataHora
                  ? "text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  : "text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
              }`}
            >
              <CalendarClock size={15} />
            </button>
            <button
              onClick={() => { setTituloEdit(reuniao.titulo ?? ""); setEditando(true); }}
              title="Editar"
              className="shrink-0 rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
            >
              <Pencil size={15} />
            </button>
          </>
        )}
      </div>

      {/* Popover de agendamento */}
      {agendaAberta && (
        <div ref={agendaRef} className="relative">
          <div className="absolute right-2 z-30 mt-1 w-64 rounded-xl border border-black/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-900">
            <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-zinc-500">
              <Calendar size={10} /> Data e hora
            </p>
            <input
              type="datetime-local"
              value={dataHoraEdit}
              onChange={(e) => setDataHoraEdit(e.target.value)}
              className="mb-2 w-full rounded-md bg-zinc-50 px-2 py-1 text-xs ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
            />
            <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-zinc-500">
              <Clock size={10} /> Duração (min)
            </p>
            <input
              type="number"
              min={5}
              step={5}
              value={duracaoEdit}
              onChange={(e) => setDuracaoEdit(e.target.value)}
              placeholder="ex: 60"
              className="mb-2 w-full rounded-md bg-zinc-50 px-2 py-1 text-xs ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
            />
            <button
              onClick={() => { salvarAgenda(); setAgendaAberta(false); }}
              className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Tópicos expandidos */}
      {expandido && (
        <div className="space-y-2 border-t border-black/5 px-3 pb-3 pt-2 dark:border-white/5">
          {topicosAtivos.length > 0 && (
            <ul className="space-y-0.5">{topicosAtivos.map(renderTopico)}</ul>
          )}
          {topicosConcluidos.length > 0 && (
            <div>
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
          {topicosAtivos.length === 0 && topicosConcluidos.length === 0 && (
            <p className="text-xs text-zinc-400">Nenhum tópico ainda.</p>
          )}
          <div className="flex gap-1.5">
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
      )}
    </li>
  );
}
