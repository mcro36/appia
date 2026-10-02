"use client";

// Visão Gantt — uma linha do tempo por projeto-raiz. Orquestra seletor de
// projeto, escala e grade; os dados e o estado derivado vêm de `useGantt`.
import { useState } from "react";
import { CalendarRange, TriangleAlert } from "lucide-react";
import { tarefasApi } from "@/lib/api";
import { ESCALAS, type Escala } from "@/lib/gantt";
import { ESCALA_LABEL, ORIGEM_ESTILO } from "@/lib/gantt-display";
import type { TarefaDTO } from "@/lib/tarefas";
import { useGantt } from "@/lib/useGantt";
import { EscalaTempo } from "./gantt/EscalaTempo";
import { LARGURA_ROTULO_PX, LinhaGantt } from "./gantt/LinhaGantt";

// Largura mínima de coluna por escala — abaixo disso o rótulo fica ilegível, e
// a grade passa a rolar na horizontal.
const LARGURA_COLUNA_PX: Record<Escala, number> = { dia: 44, semana: 62, mes: 76 };

// Legenda: sem ela, as barras listradas/esmaecidas parecem defeito.
const LEGENDA = ["planejado", "realizado", "execucao", "ate_prazo", "rollup"] as const;

export function GanttProjeto({
  projetos,
  versao,
  onAbrirTarefa,
}: {
  projetos: TarefaDTO[];
  /** Muda quando algo que afeta a árvore foi gravado — força refetch. */
  versao: number;
  onAbrirTarefa: (t: TarefaDTO) => void;
}) {
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [falhaAoAbrir, setFalhaAoAbrir] = useState<string | null>(null);

  // Seleção efetiva DERIVADA (sem efeito de sincronização): vale a escolha do
  // usuário enquanto ela existir na lista, senão cai no primeiro projeto. Cobre
  // de uma vez a primeira carga, a lista vazia e o projeto que saiu por filtro
  // ou exclusão.
  const projetoId = escolhido && projetos.some((p) => p.id === escolhido)
    ? escolhido
    : projetos[0]?.id ?? null;

  const g = useGantt(projetoId, versao);

  // A linha só tem o id; o painel de detalhe precisa do DTO completo. Falha
  // não pode ser silenciosa: sem aviso, clicar numa linha simplesmente não faz
  // nada e parece defeito.
  async function abrir(id: string) {
    const existente = projetos.find((p) => p.id === id);
    if (existente) {
      setFalhaAoAbrir(null);
      return onAbrirTarefa(existente);
    }
    try {
      const dto = await tarefasApi.obter(id);
      setFalhaAoAbrir(null);
      onAbrirTarefa(dto);
    } catch (e) {
      setFalhaAoAbrir(e instanceof Error ? e.message : "Não foi possível abrir a tarefa.");
    }
  }

  if (projetos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 p-8 text-center text-sm text-zinc-500 dark:border-white/10">
        Nenhum projeto para exibir. Crie uma atividade ou projeto — ou ajuste os filtros.
      </p>
    );
  }

  const larguraGrade = LARGURA_ROTULO_PX + g.colunas.length * LARGURA_COLUNA_PX[g.escala];

  return (
    <div className="flex flex-col gap-3">
      {/* Barra da visão: projeto + escala */}
      <div className="flex flex-wrap items-center gap-2">
        <CalendarRange size={16} className="shrink-0 text-zinc-400" />
        <select
          value={projetoId ?? ""}
          onChange={(e) => setEscolhido(e.target.value)}
          aria-label="Projeto"
          className="min-w-0 max-w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titulo}
            </option>
          ))}
        </select>

        <div className="ml-auto inline-flex rounded-lg border border-black/10 bg-white p-0.5 dark:border-white/10 dark:bg-zinc-900">
          {ESCALAS.map((e) => (
            <button
              key={e}
              onClick={() => g.setEscala(e)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                g.escala === e
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              }`}
            >
              {ESCALA_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {(g.erro || falhaAoAbrir) && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {g.erro ?? falhaAoAbrir}
        </p>
      )}

      {/* Grade */}
      {g.carregando && g.visiveis.length === 0 ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-black/5 bg-white dark:border-white/5 dark:bg-zinc-900">
          <div style={{ minWidth: larguraGrade }}>
            <EscalaTempo colunas={g.colunas} janela={g.janela} escala={g.escala} />
            {g.visiveis.map((no) => (
              <LinhaGantt
                key={no.id}
                no={no}
                janela={g.janela}
                colunas={g.colunas}
                recolhido={g.recolhidos.has(no.id)}
                onAlternar={g.alternarRecolhido}
                onAbrir={abrir}
              />
            ))}
          </div>
        </div>
      )}

      {/* Legenda — as barras são DERIVADAS de campos diferentes; sem isto o
          usuário não sabe por que uma é sólida e outra listrada. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-500">
        {LEGENDA.map((o) => (
          <span key={o} className="inline-flex items-center gap-1.5" title={ORIGEM_ESTILO[o].rotulo}>
            <span className={`h-2 w-5 rounded-[2px] ${ORIGEM_ESTILO[o].barra}`} />
            {ORIGEM_ESTILO[o].rotulo}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rotate-45 bg-zinc-500 dark:bg-zinc-300" />
          Prazo
        </span>
      </div>

      {g.semData > 0 && (
        <p className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert size={13} className="shrink-0" />
          {g.semData} tarefa(s) sem data alguma — não rendem barra. Defina início ou prazo no detalhe
          para que apareçam na linha do tempo.
        </p>
      )}
    </div>
  );
}
