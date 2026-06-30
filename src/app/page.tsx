"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { PlanejadorDia } from "@/components/views/PlanejadorDia";
import { PainelMetricas } from "@/components/views/PainelMetricas";
import { useAgenda } from "@/lib/useAgenda";
import { type NovaTarefa } from "@/lib/api";
import { NIVEIS, type Nivel, type Tipo, type TarefaDTO } from "@/lib/tarefas";
import { NIVEL_LABEL } from "@/lib/tarefas-display";
import { useTarefas } from "@/lib/useTarefas";
import { useIsPWA } from "@/lib/useIsPWA";

export default function Home() {
  const { tarefas, tags, carregando, erro, recarregar, criar, atualizar, remover, atualizarLocal } = useTarefas();
  const {
    folhas, reunioes, config, carregando: carregandoAgenda,
    carregar: carregarAgenda, aplicar: aplicarAgenda, salvarConfig,
  } = useAgenda();
  const [visao, setVisao] = useState<Visao>("dia");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const [tarefaAberta, setTarefaAberta] = useState<TarefaDTO | null>(null);
  const [filtroTagId, setFiltroTagId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<Tipo | "todos">("todos");
  const [filtroNivel, setFiltroNivel] = useState<Nivel | "todos">("todos");
  const isPWA = useIsPWA();

  // Coordenação entre as duas fontes (lista de tarefas x folhas do planejador):
  // uma mutação numa marca a OUTRA como suja; cada visão recarrega só ao ser
  // aberta e só se estiver suja — evita refetch redundante e o duplo-GET por ação.
  const tarefasSuja = useRef(false);
  const agendaSuja = useRef(false);
  const FOLHAS = useMemo(() => new Set<Visao>(["dia", "painel"]), []);

  async function handleCriar(dados: NovaTarefa) {
    await criar(dados);
    agendaSuja.current = true;
    setMostrarForm(false);
  }

  // Detalhe já persistiu no servidor: sincroniza lista + painel aberto.
  function atualizarDetalhe(id: string, dados: Partial<TarefaDTO>) {
    atualizarLocal(id, dados);
    setTarefaAberta((prev) => (prev?.id === id ? { ...prev, ...dados } : prev));
    agendaSuja.current = true;
  }

  // Subtarefas/reuniões mudaram (detalhe, chat): atualiza a lista visível e
  // marca o planejador para recarregar na próxima visita.
  function tarefasMudaram() {
    recarregar();
    agendaSuja.current = true;
  }

  // Mutação direta na lista (Kanban/Tabela): otimista + marca o planejador sujo.
  function atualizarTarefa(id: string, dados: Partial<NovaTarefa>) {
    atualizar(id, dados);
    agendaSuja.current = true;
  }

  // Edição no planejador: aplica otimista nas folhas e marca a lista suja.
  function aplicarNoPlanejador(id: string, dados: Parameters<typeof aplicarAgenda>[1]) {
    aplicarAgenda(id, dados);
    tarefasSuja.current = true;
  }

  // Ao trocar de visão, recarrega a fonte da visão aberta se estiver suja.
  useEffect(() => {
    if (FOLHAS.has(visao)) {
      if (agendaSuja.current) { agendaSuja.current = false; carregarAgenda(); }
    } else if (tarefasSuja.current) {
      tarefasSuja.current = false;
      recarregar();
    }
  }, [visao, FOLHAS, carregarAgenda, recarregar]);

  // Remoção a partir da lista (Kanban/Tabela): confirma antes, pois o cascade
  // apaga subtarefas e reuniões vinculadas.
  function handleRemover(id: string) {
    const t = tarefas.find((x) => x.id === id);
    if (!t) return;
    const nFilhas = t.tarefas.length;
    const aviso = nFilhas
      ? `Excluir "${t.titulo}" e suas ${nFilhas} subtarefa(s)?`
      : `Excluir "${t.titulo}"?`;
    if (!confirm(aviso)) return;
    remover(id);
    agendaSuja.current = true;
  }

  const tarefasFiltradas = useMemo(() => {
    return tarefas
      .filter((t) => filtroTipo === "todos" || t.tipo === filtroTipo)
      .filter((t) => filtroNivel === "todos" || t.nivel === filtroNivel)
      .filter((t) => !filtroTagId || t.tags.some((tag) => tag.id === filtroTagId));
  }, [tarefas, filtroTipo, filtroNivel, filtroTagId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-zinc-50 dark:bg-black">
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

            <div className="hidden rounded-lg border border-black/10 bg-white text-xs md:flex dark:border-white/10 dark:bg-zinc-900">
              {(["todos", ...NIVEIS] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setFiltroNivel(n)}
                  className={`px-3 py-1.5 transition-colors first:rounded-l-lg last:rounded-r-lg ${
                    filtroNivel === n
                      ? "bg-indigo-600 font-medium text-white"
                      : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {n === "todos" ? "Todos" : NIVEL_LABEL[n]}
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
          {visao === "dia" ? (
            <PlanejadorDia
              folhas={folhas}
              reunioes={reunioes}
              config={config}
              carregando={carregandoAgenda}
              onAplicar={aplicarNoPlanejador}
              onSalvarConfig={salvarConfig}
            />
          ) : visao === "painel" ? (
            <PainelMetricas folhas={folhas} carregando={carregandoAgenda} />
          ) : carregando ? (
            <p className="text-sm text-zinc-500">Carregando…</p>
          ) : visao === "kanban" ? (
            <KanbanBoard
              tarefas={tarefasFiltradas}
              onMudarStatus={(id, status) => atualizarTarefa(id, { status })}
              onRemover={handleRemover}
              onAbrir={setTarefaAberta}
            />
          ) : visao === "tabela" ? (
            <TabelaTarefas
              tarefas={tarefasFiltradas}
              onAtualizar={atualizarTarefa}
              onRemover={handleRemover}
              onAbrir={setTarefaAberta}
            />
          ) : (
            <CalendarioTarefas tarefas={tarefasFiltradas} compacto={isPWA} onSelecionar={setTarefaAberta} />
          )}
        </div>
      </main>

      {/* Chat lateral */}
      {chatAberto && (
        <ChatPanel onFechar={() => setChatAberto(false)} onTarefasMudaram={tarefasMudaram} />
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
          onAtualizar={atualizarDetalhe}
          onTarefasMudaram={tarefasMudaram}
        />
      )}

      <Modal aberto={mostrarForm} titulo="Nova atividade / projeto" onFechar={() => setMostrarForm(false)}>
        <NovaTarefaForm onCriar={handleCriar} onCancelar={() => setMostrarForm(false)} />
      </Modal>
    </div>
  );
}
