"use client";

// Fonte de dados do planejador diário: carrega folhas agendáveis, reuniões
// (compromissos fixos) e a configuração; aplica mutações com atualização
// otimista. Componentes cuidam só de renderização e estado visual.
import { useCallback, useEffect, useState } from "react";
import { agendaApi, configApi, tarefasApi } from "@/lib/api";
import { CONFIG_PADRAO, type ConfigDTO, type FolhaDTO, type ReuniaoSlim } from "@/lib/agenda";
import type { Status } from "@/lib/tarefas";

export type MudancaFolha = {
  status?: Status;
  dataInicio?: string | null;
  duracaoMin?: number | null;
};

export function useAgenda() {
  const [folhas, setFolhas] = useState<FolhaDTO[]>([]);
  const [reunioes, setReunioes] = useState<ReuniaoSlim[]>([]);
  const [config, setConfig] = useState<ConfigDTO>(CONFIG_PADRAO);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const data = await agendaApi.listar();
      setFolhas(data.folhas);
      setReunioes(data.reunioes);
      setConfig(data.config);
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

  const salvarConfig = useCallback(async (dados: Partial<ConfigDTO>) => {
    const atualizada = await configApi.atualizar(dados);
    setConfig(atualizada);
  }, []);

  return { folhas, reunioes, config, carregando, carregar, aplicar, salvarConfig };
}
