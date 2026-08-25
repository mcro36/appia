"use client";

// Status Report integrado: as tarefas marcadas (noStatusReport) agrupadas por
// projeto-raiz, vindas de /api/status-report. Os campos do report (contrato, sc,
// nota de status, próximo passo) são editados direto na tarefa (PATCH), com
// atualização otimista. Convive com o modo manual (useStatusReport/localStorage).
import { useCallback, useEffect, useState } from "react";
import { statusReportApi, tarefasApi, type StatusReportProjetoDTO } from "@/lib/api";
import type { TarefaDTO } from "@/lib/tarefas";

type CampoSR = "sc" | "statusReportNota" | "proximoPasso";

export function useStatusReportIntegrado() {
  const [projetos, setProjetos] = useState<StatusReportProjetoDTO[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setProjetos(await statusReportApi.listar());
    } catch {
      // banco pode estar indisponível (ex.: rede sem acesso) — mantém o que houver
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Edita um campo do report na tarefa; otimista, reconcilia no erro.
  const atualizarCampo = useCallback(async (tarefaId: string, patch: Partial<Record<CampoSR, string | null>>) => {
    setProjetos((ps) => ps.map((proj) => ({
      ...proj,
      itens: proj.itens.map((t) => (t.id === tarefaId ? { ...t, ...patch } : t)),
    })));
    try {
      await tarefasApi.atualizar(tarefaId, patch);
    } catch {
      carregar();
    }
  }, [carregar]);

  // Desmarca a tarefa do report (some da lista).
  const desmarcar = useCallback(async (tarefaId: string) => {
    setProjetos((ps) =>
      ps
        .map((proj) => ({ ...proj, itens: proj.itens.filter((t) => t.id !== tarefaId) }))
        .filter((proj) => proj.itens.length > 0),
    );
    try {
      await tarefasApi.atualizar(tarefaId, { noStatusReport: false });
    } catch {
      carregar();
    }
  }, [carregar]);

  return { projetos, carregando, carregar, atualizarCampo, desmarcar };
}

export type { TarefaDTO };
