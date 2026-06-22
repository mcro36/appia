"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { BotaoIA } from "@/components/BotaoIA";
import { ChatPanel } from "@/components/ChatPanel";
import { CentralAlertas } from "@/components/CentralAlertas";
import { ViewSwitcher, type Visao } from "@/components/ViewSwitcher";
import { NovaTarefaForm } from "@/components/NovaTarefaForm";
import { Modal } from "@/components/ui/Modal";
import { TarefaDetalhe } from "@/components/TarefaDetalhe";
import { KanbanBoard } from "@/components/views/KanbanBoard";
import { TabelaTarefas } from "@/components/views/TabelaTarefas";
import { CalendarioTarefas } from "@/components/views/CalendarioTarefas";
import { tarefasApi, tagsApi, type NovaTarefa } from "@/lib/api";
import { isAtrasada, type Tipo, type TarefaDTO, type TagDTO } from "@/lib/tarefas";

export default function Home() {
  const [tarefas, setTarefas] = useState<TarefaDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [visao, setVisao] = useState<Visao>("kanban");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const [tarefaAberta, setTarefaAberta] = useState<TarefaDTO | null>(null);
  const [filtroTagId, setFiltroTagId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<Tipo | "todos">("todos");

  async function carregar() {
    try {
      const [ts, tgs] = await Promise.all([tarefasApi.listar(), tagsApi.listar()]);
      setTarefas(ts);
      setTags(tgs);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function criar(dados: NovaTarefa) {
    const nova = await tarefasApi.criar(dados);
    setTarefas((prev) => [...prev, nova]);
    setMostrarForm(false);
  }

  async function atualizar(id: string, dados: Partial<NovaTarefa>) {
    const anterior = tarefas;
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, ...dados } : t)));
    try {
      await tarefasApi.atualizar(id, dados);
    } catch {
      setTarefas(anterior);
    }
  }

  async function remover(id: string) {
    const anterior = tarefas;
    setTarefas((prev) => prev.filter((t) => t.id !== id));
    try {
      await tarefasApi.remover(id);
    } catch {
      setTarefas(anterior);
    }
  }

  function atualizarLocal(id: string, dados: Partial<TarefaDTO>) {
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, ...dados } : t)));
    setTarefaAberta((prev) => (prev?.id === id ? { ...prev, ...dados } : prev));
  }

  const tarefasFiltradas = useMemo(() => {
    return tarefas
      .filter((t) => filtroTipo === "todos" || t.tipo === filtroTipo)
      .filter((t) => !filtroTagId || t.tags.some((tag) => tag.id === filtroTagId));
  }, [tarefas, filtroTipo, filtroTagId]);

  const resumo = useMemo(() => {
    const total = tarefas.length;
    const atividades = tarefas.filter((t) => t.tipo === "atividade").length;
    const projetos = tarefas.filter((t) => t.tipo === "projeto").length;
    const atrasadas = tarefas.filter(isAtrasada).length;
    return { total, atividades, projetos, atrasadas };
  }, [tarefas]);

  return (
    <div className="flex flex-1 bg-zinc-50 dark:bg-black">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Barra de ferramentas */}
        <div className="relative z-20 flex flex-wrap items-center gap-3 border-b border-black/10 px-6 py-4 dark:border-white/10">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Minhas tarefas</h1>
            <p className="text-xs text-zinc-500">
              {resumo.atividades} atividade(s) · {resumo.projetos} projeto(s)
              {resumo.atrasadas > 0 && (
                <> · <span className="font-medium text-red-600">{resumo.atrasadas} atrasada(s)</span></>
              )}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Filtro por tipo */}
            <div className="flex rounded-lg border border-black/10 bg-white text-xs dark:border-white/10 dark:bg-zinc-900">
              {(["todos", "atividade", "projeto"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-1.5 transition-colors first:rounded-l-lg last:rounded-r-lg ${
                    filtroTipo === t
                      ? "bg-indigo-600 font-medium text-white"
                      : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {t === "todos" ? "Todos" : t === "atividade" ? "Atividades" : "Projetos"}
                </button>
              ))}
            </div>

            {/* Filtro por tag */}
            {tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag size={14} className="text-zinc-400" />
                <select
                  value={filtroTagId ?? ""}
                  onChange={(e) => setFiltroTagId(e.target.value || null)}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs text-zinc-600 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <option value="">Todas as tags</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <CentralAlertas tarefas={tarefas} />
            <ViewSwitcher visao={visao} onMudar={setVisao} />
            <button
              onClick={() => setMostrarForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              <Plus size={16} />
              Nova
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-6">
          {erro && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {erro}
            </p>
          )}
          {carregando ? (
            <p className="text-sm text-zinc-500">Carregando…</p>
          ) : visao === "kanban" ? (
            <KanbanBoard
              tarefas={tarefasFiltradas}
              onMudarStatus={(id, status) => atualizar(id, { status })}
              onRemover={remover}
              onAbrir={setTarefaAberta}
            />
          ) : visao === "tabela" ? (
            <TabelaTarefas
              tarefas={tarefasFiltradas}
              onAtualizar={atualizar}
              onRemover={remover}
              onAbrir={setTarefaAberta}
            />
          ) : (
            <CalendarioTarefas tarefas={tarefasFiltradas} />
          )}
        </div>
      </main>

      {/* Chat lateral */}
      {chatAberto && (
        <ChatPanel onFechar={() => setChatAberto(false)} onTarefasMudaram={carregar} />
      )}

      {/* Botão flutuante IA */}
      <BotaoIA aberto={chatAberto} onToggle={() => setChatAberto((v) => !v)} />

      {/* Detalhe da tarefa */}
      {tarefaAberta && (
        <TarefaDetalhe
          tarefa={tarefaAberta}
          tagsDisponiveis={tags}
          onFechar={() => setTarefaAberta(null)}
          onAtualizar={atualizarLocal}
          onTarefasMudaram={carregar}
        />
      )}

      <Modal aberto={mostrarForm} titulo="Nova atividade / projeto" onFechar={() => setMostrarForm(false)}>
        <NovaTarefaForm onCriar={criar} onCancelar={() => setMostrarForm(false)} />
      </Modal>
    </div>
  );
}
