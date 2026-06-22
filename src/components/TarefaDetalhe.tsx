"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, CheckSquare, Square, Plus,
  Tag, Calendar, GitBranch, Clock, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  STATUS_LABEL, PRIORIDADE_LABEL, STATUS_COR, PRIORIDADE_COR,
  TIPO_LABEL, TIPO_COR,
  type TarefaDTO, type TarefaFilhaDTO, type TagDTO,
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

function SubtarefaLinha({
  sub,
  onToggle,
  onSalvarAgenda,
}: {
  sub: TarefaFilhaDTO;
  onToggle: (sub: TarefaFilhaDTO) => void;
  onSalvarAgenda: (sub: TarefaFilhaDTO, dataInicio: string | null, duracaoMin: number | null) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [dataInicio, setDataInicio] = useState(sub.dataInicio ? paraInputLocal(sub.dataInicio) : "");
  const [duracaoMin, setDuracaoMin] = useState(sub.duracaoMin ? String(sub.duracaoMin) : "");
  const temAgenda = !!(sub.dataInicio || sub.duracaoMin);

  function salvar() {
    const di = dataInicio ? new Date(dataInicio).toISOString() : null;
    const dur = duracaoMin ? parseInt(duracaoMin, 10) : null;
    onSalvarAgenda(sub, di, dur);
  }

  function handleBlurContainer(e: React.FocusEvent<HTMLDivElement>) {
    // salva quando o foco sai completamente da seção expandida
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      salvar();
    }
  }

  function toggleExpandido() {
    if (expandido) salvar(); // salva ao colapsar
    setExpandido((v) => !v);
  }

  return (
    <li className="rounded-lg border border-black/5 bg-white dark:border-white/5 dark:bg-zinc-800/50">
      <div className="flex items-center gap-2 px-2 py-2">
        <button onClick={() => onToggle(sub)} className="shrink-0 text-zinc-400 hover:text-indigo-600">
          {sub.status === "concluido"
            ? <CheckSquare size={16} className="text-emerald-600" />
            : <Square size={16} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`truncate text-sm ${sub.status === "concluido" ? "line-through text-zinc-400" : ""}`}>
            {sub.titulo}
          </p>
          {temAgenda && !expandido && (
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

        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COR[sub.status as keyof typeof STATUS_COR]?.pill ?? ""}`}>
          {STATUS_LABEL[sub.status as keyof typeof STATUS_LABEL]}
        </span>

        <button
          onClick={toggleExpandido}
          title="Agendar"
          className={`shrink-0 rounded p-1 transition-colors ${
            temAgenda
              ? "text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              : "text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
          } ${expandido ? "rotate-180" : ""}`}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {expandido && (
        <div
          className="border-t border-black/5 px-3 pb-3 pt-2 dark:border-white/5"
          onBlur={handleBlurContainer}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                <Calendar size={10} /> Início
              </p>
              <input
                type="datetime-local"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full rounded-md bg-zinc-50 px-2 py-1 text-xs ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-900 dark:ring-white/10"
              />
            </div>
            <div>
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
                className="w-full rounded-md bg-zinc-50 px-2 py-1 text-xs ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-900 dark:ring-white/10"
              />
            </div>
          </div>
        </div>
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

  async function toggleSubtarefa(sub: TarefaFilhaDTO) {
    const novoStatus = sub.status === "concluido" ? "a_fazer" : "concluido";
    await tarefasApi.atualizar(sub.id, { status: novoStatus });
    setTarefa((t) => ({
      ...t,
      tarefas: t.tarefas.map((s) => (s.id === sub.id ? { ...s, status: novoStatus } : s)),
    }));
    onTarefasMudaram();
  }

  async function salvarAgendaSubtarefa(sub: TarefaFilhaDTO, dataInicio: string | null, duracaoMin: number | null) {
    await tarefasApi.atualizar(sub.id, { dataInicio, duracaoMin } as Parameters<typeof tarefasApi.atualizar>[1]);
    setTarefa((t) => ({
      ...t,
      tarefas: t.tarefas.map((s) => (s.id === sub.id ? { ...s, dataInicio, duracaoMin } : s)),
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
                  onToggle={toggleSubtarefa}
                  onSalvarAgenda={salvarAgendaSubtarefa}
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
