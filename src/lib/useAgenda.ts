"use client";

// Fonte de dados do planejador diário: carrega as folhas agendáveis e aplica
// mutações (status, horário) com atualização otimista. Componentes cuidam só
// de renderização e estado visual.
import { useCallback, useEffect, useState } from "react";
import { agendaApi, tarefasApi } from "@/lib/api";
import type { FolhaDTO } from "@/lib/agenda";
import type { Status } from "@/lib/tarefas";

export type MudancaFolha = {
  status?: Status;
  dataInicio?: string | null;
  duracaoMin?: number | null;
};

export function useAgenda() {
  const [folhas, setFolhas] = useState<FolhaDTO[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setFolhas(await agendaApi.listar());
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Atualiza otimista e persiste; em caso de falha, recarrega do servidor.
  const aplicar = useCallback(async (id: string, dados: MudancaFolha) => {
    setFolhas((prev) => prev.map((f) => (f.id === id ? { ...f, ...dados } : f)));
    try {
      await tarefasApi.atualizar(id, dados);
    } catch {
      carregar();
    }
  }, [carregar]);

  return { folhas, carregando, carregar, aplicar };
}
