"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, CheckSquare, Square, Plus, Pencil, Trash2, Check,
  Tag, Calendar, GitBranch, Clock, ChevronRight, CalendarClock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  STATUS_LABEL, PRIORIDADE_LABEL, STATUS_COR, PRIORIDADE_COR,
  TIPO_LABEL, TIPO_COR,
  type Status, type TarefaDTO, type TarefaFilhaDTO, type TagDTO,
} from "@/lib/tarefas";
import { tarefasApi, tagsApi } from "@/lib/api";

type Props = {
  tarefa: TarefaDTO;
  tagsDisponiveis: TagDTO[];
  onFechar: () => void;
  onAtualizar: (id: string, dados: Partial<TarefaDTO>) => void;
  onTarefasMudaram: () => void;
};

function formatarDuracao(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}min` : `${h}h`;
}

function paraInputLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Status derivado de uma tarefa a partir das suas subtarefas. */
function statusDerivado(netos: TarefaFilhaDTO[]): Status {
  const total = netos.length;
  const concluidas = netos.filter((n) => n.status === "concluido").length;
  if (total === 0) return "a_fazer";
  if (concluidas === total) return "concluido";
  if (concluidas > 0) return "em_andamento";
  return "a_fazer";
}

type LinhaProps = {
  sub: TarefaFilhaDTO;
  onToggle: (sub: TarefaFilhaDTO) => void;
  onRenomear: (id: string, titulo: string) => void;
  onExcluir: (sub: TarefaFilhaDTO) => void;
  onSalvarAgenda: (sub: TarefaFilhaDTO, dataInicio: string | null, duracaoMin: number | null) => void;
  onAdicionarFilha?: (paiId: string, titulo: string) => void;
};

function SubtarefaLinha({ sub, onToggle, onRenomear, onExcluir, onSalvarAgenda, onAdicionarFilha }: LinhaProps) {
  const temFilhas = sub.tarefas.length > 0;
  const concluida = sub.status === "concluido";
  const temAgenda = !!(sub.dataInicio || sub.duracaoMin);
  const concluidasFilhas = sub.tarefas.filter((n) => n.status === "concluido").length;

  const [expandido, setExpandido] = useState(false);
  const [editando, setEditando] = useState(false);
  const [tituloEdit, setTituloEdit] = useState(sub.titulo);
  const [agendaAberta, setAgendaAberta] = useState(false);
  const [dataInicio, setDataInicio] = useState(sub.dataInicio ? paraInputLocal(sub.dataInicio) : "");
  const [duracaoMin, setDuracaoMin] = useState(sub.duracaoMin ? String(sub.duracaoMin) : "");
  const [addAberto, setAddAberto] = useState(false);
  const [novaFilha, setNovaFilha] = useState("");
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
      {temFilhas && expandido && (
        <ul className="space-y-1.5 px-2 pb-2 pl-8">
          {sub.tarefas.map((neto) => (
            <SubtarefaLinha
              key={neto.id}
              sub={neto}
              onToggle={onToggle}
              onRenomear={onRenomear}
              onExcluir={onExcluir}
              onSalvarAgenda={onSalvarAgenda}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TarefaDetalhe({ tarefa: tarefaInicial, tagsDisponiveis, onFechar, onAtualizar, onTarefasMudaram }: Props) {
  const [tarefa, setTarefa] = useState<TarefaDTO>(tarefaInicial);
  const [novaSubtarefa, setNovaSubtarefa] = useState("");
  const [titulo, setTitulo] = useState(tarefaInicial.titulo);
  const [descricao, setDescricao] = useState(tarefaInicial.descricao ?? "");
  const tituloRef = useRef<HTMLInputElement>(null);

  useEffect(() => { tituloRef.current?.focus(); }, []);

  async function salvarTitulo() {
    const novo = titulo.trim();
    if (!novo || novo === tarefa.titulo) return;
    const atualizado = await tarefasApi.atualizar(tarefa.id, { titulo: novo });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { titulo: novo });
  }

  async function salvarDescricao() {
    const nova = descricao.trim();
    if (nova === (tarefa.descricao ?? "")) return;
    const atualizado = await tarefasApi.atualizar(tarefa.id, { descricao: nova || null });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { descricao: atualizado.descricao });
  }

  async function mudarStatus(status: TarefaDTO["status"]) {
    const atualizado = await tarefasApi.atualizar(tarefa.id, { status });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { status });
  }

  async function mudarPrioridade(prioridade: TarefaDTO["prioridade"]) {
    const atualizado = await tarefasApi.atualizar(tarefa.id, { prioridade });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { prioridade });
  }

  async function mudarPrazo(valor: string) {
    const prazo = valor ? new Date(valor).toISOString() : null;
    const atualizado = await tarefasApi.atualizar(tarefa.id, { prazo });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { prazo });
  }

  async function mudarTipo(tipo: TarefaDTO["tipo"]) {
    const atualizado = await tarefasApi.atualizar(tarefa.id, { tipo });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { tipo });
  }

  async function adicionarTarefaFilha() {
    const texto = novaSubtarefa.trim();
    if (!texto) return;
    setNovaSubtarefa(""); // limpa antes do await para evitar duplo envio (blur + click)
    const sub = await tarefasApi.adicionarTarefa(tarefa.id, { titulo: texto });
    setTarefa((t) => ({ ...t, tarefas: [...t.tarefas, sub] }));
    onTarefasMudaram();
  }

  // Localiza a tarefa-pai (filha) de uma subtarefa neta.
  function paiDeNeto(netoId: string) {
    return tarefa.tarefas.find((f) => f.tarefas.some((n) => n.id === netoId));
  }

  // Alterna conclusão de uma tarefa SEM filhas (filha folha ou neto).
  async function alternarConclusao(node: TarefaFilhaDTO) {
    if (node.tarefas.length > 0) return; // tarefas com subtarefas têm status derivado
    const novoStatus: Status = node.status === "concluido" ? "a_fazer" : "concluido";
    await tarefasApi.atualizar(node.id, { status: novoStatus });

    const ehFilha = tarefa.tarefas.some((f) => f.id === node.id);
    if (ehFilha) {
      setTarefa((t) => ({ ...t, tarefas: t.tarefas.map((f) => (f.id === node.id ? { ...f, status: novoStatus } : f)) }));
    } else {
      const pai = paiDeNeto(node.id);
      if (!pai) return;
      const netos = pai.tarefas.map((n) => (n.id === node.id ? { ...n, status: novoStatus } : n));
      const statusPai = statusDerivado(netos);
      if (statusPai !== pai.status) await tarefasApi.atualizar(pai.id, { status: statusPai });
      setTarefa((t) => ({ ...t, tarefas: t.tarefas.map((f) => (f.id === pai.id ? { ...f, status: statusPai, tarefas: netos } : f)) }));
    }
    onTarefasMudaram();
  }

  async function renomear(id: string, novoTitulo: string) {
    await tarefasApi.atualizar(id, { titulo: novoTitulo });
    setTarefa((t) => ({
      ...t,
      tarefas: t.tarefas.map((f) =>
        f.id === id
          ? { ...f, titulo: novoTitulo }
          : { ...f, tarefas: f.tarefas.map((n) => (n.id === id ? { ...n, titulo: novoTitulo } : n)) },
      ),
    }));
    onTarefasMudaram();
  }

  async function excluir(node: TarefaFilhaDTO) {
    const aviso = node.tarefas.length
      ? `Excluir "${node.titulo}" e suas ${node.tarefas.length} subtarefa(s)?`
      : `Excluir "${node.titulo}"?`;
    if (!confirm(aviso)) return;
    await tarefasApi.remover(node.id);

    const ehFilha = tarefa.tarefas.some((f) => f.id === node.id);
    if (ehFilha) {
      setTarefa((t) => ({ ...t, tarefas: t.tarefas.filter((f) => f.id !== node.id) }));
    } else {
      const pai = paiDeNeto(node.id);
      if (pai) {
        const netos = pai.tarefas.filter((n) => n.id !== node.id);
        const statusPai = netos.length ? statusDerivado(netos) : pai.status;
        if (statusPai !== pai.status) await tarefasApi.atualizar(pai.id, { status: statusPai });
        setTarefa((t) => ({ ...t, tarefas: t.tarefas.map((f) => (f.id === pai.id ? { ...f, status: statusPai, tarefas: netos } : f)) }));
      }
    }
    onTarefasMudaram();
  }

  async function adicionarSubFilha(paiId: string, tituloFilha: string) {
    const novo = await tarefasApi.adicionarTarefa(paiId, { titulo: tituloFilha });
    const pai = tarefa.tarefas.find((f) => f.id === paiId);
    if (!pai) return;
    const netos = [...pai.tarefas, novo];
    const statusPai = statusDerivado(netos);
    if (statusPai !== pai.status) await tarefasApi.atualizar(paiId, { status: statusPai });
    setTarefa((t) => ({ ...t, tarefas: t.tarefas.map((f) => (f.id === paiId ? { ...f, status: statusPai, tarefas: netos } : f)) }));
    onTarefasMudaram();
  }

  async function salvarAgendaTarefa(node: TarefaFilhaDTO, dataInicio: string | null, duracaoMin: number | null) {
    await tarefasApi.atualizar(node.id, { dataInicio, duracaoMin } as Parameters<typeof tarefasApi.atualizar>[1]);
    setTarefa((t) => ({
      ...t,
      tarefas: t.tarefas.map((f) =>
        f.id === node.id
          ? { ...f, dataInicio, duracaoMin }
          : { ...f, tarefas: f.tarefas.map((n) => (n.id === node.id ? { ...n, dataInicio, duracaoMin } : n)) },
      ),
    }));
    onTarefasMudaram();
  }

  async function toggleTag(tag: TagDTO) {
    const temTag = tarefa.tags.some((t) => t.id === tag.id);
    const novasTags = temTag ? tarefa.tags.filter((t) => t.id !== tag.id) : [...tarefa.tags, tag];
    const atualizado = await tarefasApi.atualizar(tarefa.id, { tagIds: novasTags.map((t) => t.id) });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { tags: atualizado.tags });
  }

  async function criarTag() {
    const nome = prompt("Nome da nova tag:");
    if (!nome?.trim()) return;
    const nova = await tagsApi.criar(nome.trim());
    await toggleTag(nova);
    onTarefasMudaram();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onFechar} />

      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-black/10 px-6 py-4 dark:border-white/10">
          <input
            ref={tituloRef}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onBlur={salvarTitulo}
            onKeyDown={(e) => { if (e.key === "Enter") tituloRef.current?.blur(); }}
            className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold outline-none hover:border-black/10 focus:border-indigo-400 dark:hover:border-white/10"
          />
          <button onClick={onFechar} className="mt-0.5 shrink-0 rounded p-1 hover:bg-black/5 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {/* Toggle Atividade / Projeto */}
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {(["atividade", "projeto"] as const).map((t) => (
              <button
                key={t}
                onClick={() => mudarTipo(t)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  tarefa.tipo === t
                    ? `${TIPO_COR[t].pill} shadow-sm`
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {TIPO_LABEL[t]}
              </button>
            ))}
          </div>

          {/* Metadados */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">Status</p>
              <select
                value={tarefa.status}
                onChange={(e) => mudarStatus(e.target.value as TarefaDTO["status"])}
                className={`w-full rounded-lg border-0 px-3 py-1.5 text-xs font-medium outline-none ring-1 ring-black/10 ${STATUS_COR[tarefa.status].pill}`}
              >
                {(["a_fazer", "em_andamento", "concluido"] as const).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">Prioridade</p>
              <select
                value={tarefa.prioridade}
                onChange={(e) => mudarPrioridade(e.target.value as TarefaDTO["prioridade"])}
                className={`w-full rounded-lg border-0 px-3 py-1.5 text-xs font-medium outline-none ring-1 ring-black/10 ${PRIORIDADE_COR[tarefa.prioridade]}`}
              >
                {(["baixa", "media", "alta"] as const).map((p) => (
                  <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-500">
                <Calendar size={12} /> Prazo
              </p>
              <input
                type="datetime-local"
                value={tarefa.prazo ? paraInputLocal(tarefa.prazo) : ""}
                onChange={(e) => mudarPrazo(e.target.value)}
                className="w-full rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-500">
              <Tag size={12} /> Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tagsDisponiveis.map((tag) => {
                const ativa = tarefa.tags.some((t) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      ativa ? "text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                    style={ativa ? { backgroundColor: tag.cor } : undefined}
                  >
                    {tag.nome}
                  </button>
                );
              })}
              <button
                onClick={criarTag}
                className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              >
                <Plus size={10} /> nova
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <p className="mb-1 text-xs font-medium text-zinc-500">Descrição</p>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onBlur={salvarDescricao}
              rows={4}
              placeholder="Adicione uma descrição…"
              className="w-full resize-none rounded-lg p-2 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10 dark:text-zinc-300"
            />
          </div>

          {/* Tarefas filhas */}
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-500">
              <GitBranch size={12} /> Tarefas
              {tarefa.tarefas.length > 0 && (
                <span className="ml-1 text-zinc-400">
                  {tarefa.tarefas.filter((s) => s.status === "concluido").length}/{tarefa.tarefas.length}
                </span>
              )}
            </p>
            <ul className="space-y-1.5">
              {tarefa.tarefas.map((sub) => (
                <SubtarefaLinha
                  key={sub.id}
                  sub={sub}
                  onToggle={alternarConclusao}
                  onRenomear={renomear}
                  onExcluir={excluir}
                  onSalvarAgenda={salvarAgendaTarefa}
                  onAdicionarFilha={adicionarSubFilha}
                />
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                value={novaSubtarefa}
                onChange={(e) => setNovaSubtarefa(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") adicionarTarefaFilha(); }}
                onBlur={adicionarTarefaFilha}
                placeholder="Adicionar tarefa…"
                className="flex-1 rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
              />
              <button
                onClick={adicionarTarefaFilha}
                disabled={!novaSubtarefa.trim()}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 hover:bg-zinc-200 disabled:opacity-40 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Rodapé */}
          <div className="border-t border-black/5 pt-4 dark:border-white/5">
            <p className="text-xs text-zinc-400">
              Criada em {format(new Date(tarefa.criadaEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {tarefa.atualizadaEm !== tarefa.criadaEm && (
                <> · atualizada {format(new Date(tarefa.atualizadaEm), "dd/MM 'às' HH:mm", { locale: ptBR })}</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
