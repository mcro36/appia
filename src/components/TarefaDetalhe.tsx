"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Tag, Calendar, GitBranch } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NIVEIS, type TarefaDTO, type TagDTO } from "@/lib/tarefas";
import {
  STATUS_LABEL, PRIORIDADE_LABEL, STATUS_COR, PRIORIDADE_COR,
  TIPO_LABEL, TIPO_COR, NIVEL_LABEL, NIVEL_COR,
} from "@/lib/tarefas-display";
import { dataParaInputLocal } from "@/lib/datas";
import { useTarefaDetalhe } from "@/lib/useTarefaDetalhe";
import { SubtarefaLinha } from "@/components/tarefa-detalhe/SubtarefaLinha";

type Props = {
  tarefa: TarefaDTO;
  tagsDisponiveis: TagDTO[];
  onFechar: () => void;
  onAtualizar: (id: string, dados: Partial<TarefaDTO>) => void;
  onTarefasMudaram: () => void;
};

export function TarefaDetalhe({ tarefa: tarefaInicial, tagsDisponiveis, onFechar, onAtualizar, onTarefasMudaram }: Props) {
  const {
    tarefa,
    salvarTitulo, salvarDescricao, mudarStatus, mudarPrioridade, mudarPrazo, mudarTipo, mudarNivel,
    adicionarTarefaFilha, alternarConclusao, renomear, excluir, adicionarSubFilha, salvarAgendaTarefa,
    toggleTag, criarTag,
  } = useTarefaDetalhe(tarefaInicial, onAtualizar, onTarefasMudaram);

  const [titulo, setTitulo] = useState(tarefaInicial.titulo);
  const [descricao, setDescricao] = useState(tarefaInicial.descricao ?? "");
  const [novaSubtarefa, setNovaSubtarefa] = useState("");
  const tituloRef = useRef<HTMLInputElement>(null);

  useEffect(() => { tituloRef.current?.focus(); }, []);

  // Limpa o input antes de aguardar para evitar duplo envio (blur + click).
  function handleAdicionarTarefa() {
    const texto = novaSubtarefa.trim();
    if (!texto) return;
    setNovaSubtarefa("");
    adicionarTarefaFilha(texto);
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
            onBlur={() => salvarTitulo(titulo)}
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

          {/* Toggle Nível */}
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {NIVEIS.map((n) => (
              <button
                key={n}
                onClick={() => mudarNivel(n)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  tarefa.nivel === n
                    ? `${NIVEL_COR[n]} shadow-sm`
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {NIVEL_LABEL[n]}
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
                value={dataParaInputLocal(tarefa.prazo)}
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
              onBlur={() => salvarDescricao(descricao)}
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
                onKeyDown={(e) => { if (e.key === "Enter") handleAdicionarTarefa(); }}
                onBlur={handleAdicionarTarefa}
                placeholder="Adicionar tarefa…"
                className="flex-1 rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
              />
              <button
                onClick={handleAdicionarTarefa}
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
