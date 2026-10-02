"use client";

// Dados e estado derivado do Gantt de um projeto. Os componentes cuidam só da
// renderização (princípio do AGENTS.md: lógica de dados/estado mora em hooks).
import { useCallback, useEffect, useMemo, useState } from "react";
import { tarefasApi } from "@/lib/api";
import {
  achatarVisiveis, colunasDe, contarSemData, janelaDe, montarArvore,
  type Escala, type Janela, type NoGantt, type NoGanttDTO,
} from "@/lib/gantt";

export type UseGantt = {
  arvore: NoGantt | null;
  /** Linhas a desenhar, já respeitando os nós recolhidos. */
  visiveis: NoGantt[];
  janela: Janela;
  colunas: { inicio: Date; fim: Date }[];
  escala: Escala;
  setEscala: (e: Escala) => void;
  recolhidos: ReadonlySet<string>;
  alternarRecolhido: (id: string) => void;
  /** Quantas tarefas da árvore não têm data alguma. */
  semData: number;
  carregando: boolean;
  erro: string | null;
};

// Constantes estáveis: evitam invalidar os memos a cada render.
const SEM_LINHAS: NoGanttDTO[] = [];
const SEM_RECOLHIDOS: ReadonlySet<string> = new Set();

// O estado guarda a QUAL projeto pertence. Assim `carregando`, `erro` e os nós
// recolhidos são derivados por comparação — sem efeito de sincronização, que
// dispara render em cascata (react-hooks/set-state-in-effect).
type Carga = { projeto: string; linhas: NoGanttDTO[] };
type Falha = { projeto: string; mensagem: string };
type Recolhe = { projeto: string; ids: ReadonlySet<string> };

/**
 * @param versao contador externo: muda quando algo gravado em outro lugar
 *   (detalhe, chat, sincronização de 25s) pode ter alterado a árvore. A árvore
 *   é fonte PRÓPRIA — `useTarefas` não a alcança —, então sem isto uma data
 *   definida no detalhe não apareceria como barra.
 */
export function useGantt(projetoId: string | null, versao = 0): UseGantt {
  const [carga, setCarga] = useState<Carga | null>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [recolhe, setRecolhe] = useState<Recolhe | null>(null);
  const [escala, setEscala] = useState<Escala>("semana");

  useEffect(() => {
    if (!projetoId) return;
    // Guarda de corrida: trocar de projeto rápido não pode deixar a resposta
    // antiga sobrescrever a nova.
    let atual = true;
    tarefasApi
      .arvore(projetoId)
      .then((linhas) => {
        if (!atual) return;
        setCarga({ projeto: projetoId, linhas });
        setFalha(null);
      })
      .catch((e) => {
        if (!atual) return;
        setFalha({
          projeto: projetoId,
          mensagem: e instanceof Error ? e.message : "Erro ao carregar a árvore.",
        });
      });
    return () => {
      atual = false;
    };
    // `versao` entra nas deps de propósito: é o gatilho de refetch. O refetch é
    // SILENCIOSO — `carregando` só liga quando o projeto muda, então a grade não
    // pisca "Carregando…", igual às outras visões.
  }, [projetoId, versao]);

  // ── Derivados do projeto atual ───────────────────────────────────────
  const linhas = carga?.projeto === projetoId ? carga.linhas : SEM_LINHAS;
  const erro = falha?.projeto === projetoId ? falha.mensagem : null;
  const carregando = projetoId !== null && carga?.projeto !== projetoId && erro === null;
  const recolhidos = recolhe?.projeto === projetoId ? recolhe.ids : SEM_RECOLHIDOS;

  const arvore = useMemo(
    () => (projetoId ? montarArvore(linhas, projetoId) : null),
    [linhas, projetoId],
  );

  const visiveis = useMemo(
    () => (arvore ? achatarVisiveis(arvore, recolhidos) : []),
    [arvore, recolhidos],
  );

  // A janela vem da árvore INTEIRA, não só do que está visível: recolher um nó
  // não deve deslocar a linha do tempo debaixo do usuário.
  const janela = useMemo(() => {
    const todos = arvore ? achatarVisiveis(arvore, SEM_RECOLHIDOS) : [];
    return janelaDe(todos.map((n) => n.span), escala);
  }, [arvore, escala]);

  const colunas = useMemo(() => colunasDe(janela, escala), [janela, escala]);

  const alternarRecolhido = useCallback(
    (id: string) => {
      if (!projetoId) return;
      setRecolhe((prev) => {
        const base = prev?.projeto === projetoId ? prev.ids : SEM_RECOLHIDOS;
        const prox = new Set(base);
        if (prox.has(id)) prox.delete(id);
        else prox.add(id);
        return { projeto: projetoId, ids: prox };
      });
    },
    [projetoId],
  );

  return {
    arvore,
    visiveis,
    janela,
    colunas,
    escala,
    setEscala,
    recolhidos,
    alternarRecolhido,
    semData: arvore ? contarSemData(arvore) : 0,
    carregando,
    erro,
  };
}
