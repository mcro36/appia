"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Tag } from "lucide-react";
import { BotaoIA } from "@/components/BotaoIA";
import { ChatPanel } from "@/components/ChatPanel";
import { CentralAlertas } from "@/components/CentralAlertas";
import { ViewSwitcher, type Visao } from "@/components/ViewSwitcher";
import { BannerNotificacoes } from "@/components/BannerNotificacoes";
import { NovaTarefaForm } from "@/components/NovaTarefaForm";
import { Modal } from "@/components/ui/Modal";
import { TarefaDetalhe } from "@/components/TarefaDetalhe";
import { KanbanBoard } from "@/components/views/KanbanBoard";
import { TabelaTarefas } from "@/components/views/TabelaTarefas";
import { CalendarioTarefas } from "@/components/views/CalendarioTarefas";
import { tarefasApi, tagsApi, type NovaTarefa } from "@/lib/api";
import { isAtrasada, type Tipo, type TarefaDTO, type TagDTO } from "@/lib/tarefas";
import { useIsPWA } from "@/lib/useIsPWA";

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
  const isPWA = useIsPWA();

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
    <div className="flex h-full flex-1 overflow-hidden bg-zinc-50 dark:bg-black">
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Barra de ferramentas */}
        <div className="relative z-20 flex items-center gap-2 border-b border-black/10 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-zinc-950 md:gap-3 md:px-6 md:py-4">
          {/* Esquerda: filtros (só desktop) */}
          <div className="flex flex-1 items-center gap-2">
            <div className="hidden rounded-lg border border-black/10 bg-white text-xs md:flex dark:border-white/10 dark:bg-zinc-900">
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

            {tags.length > 0 && (
              <div className="hidden items-center gap-1 md:flex">
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
          </div>

          {/* Centro: seletor de visões */}
          <div className="flex justify-center">
            <ViewSwitcher visao={visao} onMudar={setVisao} />
          </div>

          {/* Direita: alertas + nova (só desktop; no PWA viram botões flutuantes/automáticos) */}
          <div className="flex flex-1 items-center justify-end gap-2">
            {!isPWA && <CentralAlertas tarefas={tarefas} />}
            {!isPWA && (
              <button
                onClick={() => setMostrarForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 md:px-4"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nova</span>
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-3 md:p-6">
          {isPWA && <BannerNotificacoes />}
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
            <CalendarioTarefas tarefas={tarefasFiltradas} compacto={isPWA} onSelecionar={setTarefaAberta} />
          )}
        </div>
      </main>

      {/* Chat lateral */}
      {chatAberto && (
        <ChatPanel onFechar={() => setChatAberto(false)} onTarefasMudaram={carregar} />
      )}

      {/* Botão flutuante "Nova" — só no PWA, acima do botão da IA */}
      {isPWA && !chatAberto && (
        <button
          onClick={() => setMostrarForm(true)}
          aria-label="Nova atividade"
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={24} />
        </button>
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
