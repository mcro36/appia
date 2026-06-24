"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckSquare, Square, Plus, Pencil, Trash2, Check,
  Calendar, Clock, ChevronRight, ChevronDown, CalendarClock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_COR, STATUS_LABEL } from "@/lib/tarefas-display";
import { dataParaInputLocal, formatarDuracao } from "@/lib/datas";
import type { TarefaFilhaDTO } from "@/lib/tarefas";

export type SubtarefaLinhaProps = {
  sub: TarefaFilhaDTO;
  onToggle: (sub: TarefaFilhaDTO) => void;
  onRenomear: (id: string, titulo: string) => void;
  onExcluir: (sub: TarefaFilhaDTO) => void;
  onSalvarAgenda: (sub: TarefaFilhaDTO, dataInicio: string | null, duracaoMin: number | null) => void;
  onAdicionarFilha?: (paiId: string, titulo: string) => void;
};

export function SubtarefaLinha({ sub, onToggle, onRenomear, onExcluir, onSalvarAgenda, onAdicionarFilha }: SubtarefaLinhaProps) {
  const temFilhas = sub.tarefas.length > 0;
  const concluida = sub.status === "concluido";
  const temAgenda = !!(sub.dataInicio || sub.duracaoMin);
  const concluidasFilhas = sub.tarefas.filter((n) => n.status === "concluido").length;

  const [expandido, setExpandido] = useState(false);
  const [editando, setEditando] = useState(false);
  const [tituloEdit, setTituloEdit] = useState(sub.titulo);
  const [agendaAberta, setAgendaAberta] = useState(false);
  const [dataInicio, setDataInicio] = useState(dataParaInputLocal(sub.dataInicio));
  const [duracaoMin, setDuracaoMin] = useState(sub.duracaoMin ? String(sub.duracaoMin) : "");
  const [addAberto, setAddAberto] = useState(false);
  const [novaFilha, setNovaFilha] = useState("");
  const [netosConcluidosAbertos, setNetosConcluidosAbertos] = useState(false);
  const agendaRef = useRef<HTMLDivElement>(null);

  function salvarAgenda() {
    const di = dataInicio ? new Date(dataInicio).toISOString() : null;
    const dur = duracaoMin ? parseInt(duracaoMin, 10) : null;
    if (di !== sub.dataInicio || dur !== sub.duracaoMin) onSalvarAgenda(sub, di, dur);
  }

  // Fecha o popover de agenda ao clicar fora (salvando)
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
  }, [agendaAberta, dataInicio, duracaoMin]);

  function salvarRenome() {
    const novo = tituloEdit.trim();
    if (novo && novo !== sub.titulo) onRenomear(sub.id, novo);
    else setTituloEdit(sub.titulo);
    setEditando(false);
  }

  function criarFilha() {
    const t = novaFilha.trim();
    if (!t) { setAddAberto(false); return; }
    setNovaFilha("");
    setAddAberto(false);
    onAdicionarFilha?.(sub.id, t);
    setExpandido(true);
  }

  return (
    <li className="rounded-lg border border-black/5 bg-white dark:border-white/5 dark:bg-zinc-800/50">
      <div className="flex items-center gap-2 px-2 py-2">
        {/* Controle líder: checkbox (sem filhas) ou chevron de expandir (com filhas) */}
        {temFilhas ? (
          <button
            onClick={() => setExpandido((v) => !v)}
            aria-label={expandido ? "Recolher" : "Expandir"}
            className="shrink-0 text-zinc-400 hover:text-indigo-600"
          >
            <ChevronRight size={16} className={`transition-transform ${expandido ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onToggle(sub)}
            aria-label="Concluir"
            className="shrink-0 text-zinc-400 hover:text-indigo-600"
          >
            {concluida ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
          </button>
        )}

        <div
          className="flex-1 min-w-0"
          onClick={temFilhas && !editando ? () => setExpandido((v) => !v) : undefined}
          role={temFilhas && !editando ? "button" : undefined}
        >
          {editando ? (
            <input
              autoFocus
              value={tituloEdit}
              onChange={(e) => setTituloEdit(e.target.value)}
              onBlur={salvarRenome}
              onKeyDown={(e) => {
                if (e.key === "Enter") salvarRenome();
                if (e.key === "Escape") { setTituloEdit(sub.titulo); setEditando(false); }
              }}
              className="w-full rounded border border-indigo-400 bg-white px-1.5 py-0.5 text-sm outline-none dark:bg-zinc-900"
            />
          ) : (
            <p className={`truncate text-sm ${concluida ? "text-zinc-400 line-through" : ""} ${temFilhas ? "cursor-pointer" : ""}`}>
              {sub.titulo}
            </p>
          )}

          {temAgenda && !editando && !agendaAberta && (
            <div className="mt-0.5 flex flex-wrap gap-2">
              {sub.dataInicio && (
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600">
                  <Calendar size={10} />
                  {format(new Date(sub.dataInicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
              {sub.duracaoMin && (
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <Clock size={10} />
                  {formatarDuracao(sub.duracaoMin)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Contador de subtarefas */}
        {temFilhas && !editando && (
          <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
            {concluidasFilhas}/{sub.tarefas.length}
          </span>
        )}

        {!editando && (
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COR[sub.status]?.pill ?? ""}`}>
            {STATUS_LABEL[sub.status]}
          </span>
        )}

        {/* Ações */}
        {editando ? (
          <>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onExcluir(sub)}
              title="Excluir"
              className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            >
              <Trash2 size={15} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={salvarRenome}
              title="Salvar"
              className="shrink-0 rounded p-1 text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Check size={15} />
            </button>
          </>
        ) : (
          <>
            {onAdicionarFilha && (
              <button
                onClick={() => setAddAberto(true)}
                title="Adicionar subtarefa"
                className="shrink-0 rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
              >
                <Plus size={15} />
              </button>
            )}
            <button
              onClick={() => setAgendaAberta((v) => !v)}
              title="Agendar"
              className={`shrink-0 rounded p-1 transition-colors ${
                temAgenda
                  ? "text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  : "text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
              }`}
            >
              <CalendarClock size={15} />
            </button>
            <button
              onClick={() => { setTituloEdit(sub.titulo); setEditando(true); }}
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
              <Calendar size={10} /> Início
            </p>
            <input
              type="datetime-local"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="mb-2 w-full rounded-md bg-zinc-50 px-2 py-1 text-xs ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
            />
            <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-zinc-500">
              <Clock size={10} /> Duração (min)
            </p>
            <input
              type="number"
              min={5}
              step={5}
              value={duracaoMin}
              onChange={(e) => setDuracaoMin(e.target.value)}
              placeholder="ex: 60"
              className="w-full rounded-md bg-zinc-50 px-2 py-1 text-xs ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
            />
            <button
              onClick={() => { salvarAgenda(); setAgendaAberta(false); }}
              className="mt-2 w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      {/* Input de nova subtarefa */}
      {addAberto && (
        <div className="px-2 pb-2 pl-8">
          <input
            autoFocus
            value={novaFilha}
            onChange={(e) => setNovaFilha(e.target.value)}
            onBlur={criarFilha}
            onKeyDown={(e) => { if (e.key === "Enter") criarFilha(); if (e.key === "Escape") { setNovaFilha(""); setAddAberto(false); } }}
            placeholder="Nova subtarefa…"
            className="w-full rounded-lg px-2 py-1 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-900 dark:ring-white/10"
          />
        </div>
      )}

      {/* Subtarefas (nível 2) */}
      {temFilhas && expandido && (() => {
        const netosAtivos = sub.tarefas.filter((n) => n.status !== "concluido");
        const netosConcluidos = sub.tarefas.filter((n) => n.status === "concluido");
        const netoProps = { onToggle, onRenomear, onExcluir, onSalvarAgenda };
        return (
          <>
            {netosAtivos.length > 0 && (
              <ul className="space-y-1.5 px-2 pb-1 pl-8">
                {netosAtivos.map((neto) => <SubtarefaLinha key={neto.id} sub={neto} {...netoProps} />)}
              </ul>
            )}
            {netosConcluidos.length > 0 && (
              <div className="px-2 pb-2 pl-8">
                <button
                  onClick={() => setNetosConcluidosAbertos((v) => !v)}
                  className="flex items-center gap-1.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {netosConcluidosAbertos ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  Concluídas ({netosConcluidos.length})
                </button>
                {netosConcluidosAbertos && (
                  <ul className="mt-1 space-y-1.5">
                    {netosConcluidos.map((neto) => <SubtarefaLinha key={neto.id} sub={neto} {...netoProps} />)}
                  </ul>
                )}
              </div>
            )}
          </>
        );
      })()}
    </li>
  );
}
