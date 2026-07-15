"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { FiltrosDropdown } from "@/components/FiltrosDropdown";
import { BotaoIA } from "@/components/BotaoIA";
import { ChatPanel } from "@/components/ChatPanel";
import { CentralAlertas } from "@/components/CentralAlertas";
import { ViewSwitcher, type Visao } from "@/components/ViewSwitcher";
import { UserMenu } from "@/components/UserMenu";
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
import { workspacesApi, type NovaTarefa, type MembroDTO } from "@/lib/api";
import { type Nivel, type Tipo, type TarefaDTO } from "@/lib/tarefas";
import { useTarefas } from "@/lib/useTarefas";
import { useIsPWA } from "@/lib/useIsPWA";

export default function Home() {
  const { tarefas, tags, carregando, erro, recarregar, criar, atualizar, remover, atualizarLocal } = useTarefas();
  const {
    folhas, reunioes, config, carregando: carregandoAgenda,
    carregar: carregarAgenda, aplicar: aplicarAgenda, salvarConfig,
  } = useAgenda();
  const [visao, setVisao] = useState<Visao>("kanban");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const [tarefaAberta, setTarefaAberta] = useState<TarefaDTO | null>(null);
  const [filtroTagId, setFiltroTagId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<Tipo | "todos">("todos");
  const [filtroNivel, setFiltroNivel] = useState<Nivel | "todos">("todos");
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("todos"); // "todos" | "sem" | usuarioId
  const [membros, setMembros] = useState<MembroDTO[]>([]);
  const isPWA = useIsPWA();

  // Membros da workspace ativa (para filtrar por responsável — só faz sentido
  // em espaço compartilhado).
  useEffect(() => { workspacesApi.membros().then(setMembros).catch(() => {}); }, []);

  // Coordenação entre as duas fontes (lista de tarefas x folhas do planejador):
  // uma mutação numa marca a OUTRA como suja; cada visão recarrega só ao ser
  // aberta e só se estiver suja — evita refetch redundante e o duplo-GET por ação.
  const tarefasSuja = useRef(false);
  const agendaSuja = useRef(false);
  const FOLHAS = useMemo(() => new Set<Visao>(["painel"]), []);

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

  // Ao trocar de visão, recarrega a(s) fonte(s) da visão aberta se estiverem sujas.
  // "kanban" hospeda Geral (tarefas) e Dia/Semana (folhas), então verifica ambas.
  useEffect(() => {
    if (visao === "kanban") {
      if (agendaSuja.current) { agendaSuja.current = false; carregarAgenda(); }
      if (tarefasSuja.current) { tarefasSuja.current = false; recarregar(); }
    } else if (FOLHAS.has(visao)) {
      if (agendaSuja.current) { agendaSuja.current = false; carregarAgenda(); }
    } else if (tarefasSuja.current) {
      tarefasSuja.current = false;
      recarregar();
    }
  }, [visao, FOLHAS, carregarAgenda, recarregar]);

  // Sincronização quase-em-tempo-real: enquanto a aba está visível, atualiza a
  // fonte da visão atual ao focar/voltar à aba e a cada 25s — assim mudanças de
  // colegas aparecem sem recarregar. Passa pela API escopada (seguro); evita
  // Supabase Realtime, que exigiria RLS. O refetch é silencioso (não pisca
  // "Carregando…", pois carregar/recarregar não ligam o loading).
  useEffect(() => {
    function sincronizar() {
      if (document.visibilityState !== "visible") return;
      if (visao === "kanban") { recarregar(); carregarAgenda(); }
      else if (FOLHAS.has(visao)) carregarAgenda();
      else recarregar();
    }
    const t = setInterval(sincronizar, 25000);
    window.addEventListener("focus", sincronizar);
    document.addEventListener("visibilitychange", sincronizar);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", sincronizar);
      document.removeEventListener("visibilitychange", sincronizar);
    };
  }, [visao, FOLHAS, recarregar, carregarAgenda]);

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
      .filter((t) => !filtroTagId || t.tags.some((tag) => tag.id === filtroTagId))
      .filter((t) =>
        filtroResponsavel === "todos" ||
        (filtroResponsavel === "sem" ? !t.assigneeId : t.assigneeId === filtroResponsavel));
  }, [tarefas, filtroTipo, filtroNivel, filtroTagId, filtroResponsavel]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-zinc-50 dark:bg-black">
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Barra de ferramentas */}
        <div className="relative z-20 flex items-center gap-2 border-b border-black/10 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-zinc-950 md:gap-3 md:px-6 md:py-4">
          {/* Esquerda: filtros (só desktop) */}
          <div className="flex flex-1 items-center gap-2">
            <FiltrosDropdown
              filtroTipo={filtroTipo}
              filtroNivel={filtroNivel}
              filtroTagId={filtroTagId}
              filtroResponsavel={filtroResponsavel}
              tags={tags}
              membros={membros}
              onFiltroTipo={setFiltroTipo}
              onFiltroNivel={setFiltroNivel}
              onFiltroTagId={setFiltroTagId}
              onFiltroResponsavel={setFiltroResponsavel}
            />
          </div>

          {/* Centro: seletor de visões */}
          <div className="flex justify-center">
            <ViewSwitcher visao={visao} onMudar={setVisao} />
          </div>

          {/* Direita: alertas + conta */}
          <div className="flex flex-1 items-center justify-end gap-2">
            {!isPWA && <CentralAlertas tarefas={tarefas} />}
            <UserMenu />
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
          {visao === "kanban" ? (
            <PlanejadorDia
              folhas={folhas}
              reunioes={reunioes}
              config={config}
              carregando={carregandoAgenda}
              onAplicar={aplicarNoPlanejador}
              onSalvarConfig={salvarConfig}
              slotGeral={
                carregando ? (
                  <p className="text-sm text-zinc-500">Carregando…</p>
                ) : (
                  <KanbanBoard
                    tarefas={tarefasFiltradas}
                    onMudarStatus={(id, status) => atualizarTarefa(id, { status })}
                    onRemover={handleRemover}
                    onAbrir={setTarefaAberta}
                  />
                )
              }
            />
          ) : visao === "painel" ? (
            <PainelMetricas folhas={folhas} carregando={carregandoAgenda} />
          ) : carregando ? (
            <p className="text-sm text-zinc-500">Carregando…</p>
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

      {/* Botão flutuante "Nova" — sempre visível, acima do botão da IA */}
      {!chatAberto && (
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
