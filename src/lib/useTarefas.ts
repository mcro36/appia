"use client";

// Fonte única de verdade das tarefas no client: carregamento, criação,
// atualização (otimista) e remoção. A página consome este hook e cuida só de
// filtros e renderização — responsabilidade única.
import { useCallback, useEffect, useState } from "react";
import { tarefasApi, tagsApi, type NovaTarefa } from "@/lib/api";
import type { TarefaDTO, TagDTO } from "@/lib/tarefas";

export type UseTarefas = {
  tarefas: TarefaDTO[];
  tags: TagDTO[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  criar: (dados: NovaTarefa) => Promise<void>;
  atualizar: (id: string, dados: Partial<NovaTarefa>) => Promise<void>;
  remover: (id: string) => Promise<void>;
  /** Atualiza apenas o estado local (usado quando o detalhe já persistiu no servidor). */
  atualizarLocal: (id: string, dados: Partial<TarefaDTO>) => void;
};

export function useTarefas(): UseTarefas {
  const [tarefas, setTarefas] = useState<TarefaDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const criar = useCallback(async (dados: NovaTarefa) => {
    const nova = await tarefasApi.criar(dados);
    setTarefas((prev) => [...prev, nova]);
  }, []);

  const atualizar = useCallback(async (id: string, dados: Partial<NovaTarefa>) => {
    let anterior: TarefaDTO[] = [];
    setTarefas((prev) => {
      anterior = prev;
      return prev.map((t) => (t.id === id ? { ...t, ...dados } : t));
    });
    try {
      await tarefasApi.atualizar(id, dados);
    } catch {
      setTarefas(anterior);
    }
  }, []);

  const remover = useCallback(async (id: string) => {
    let anterior: TarefaDTO[] = [];
    setTarefas((prev) => {
      anterior = prev;
      return prev.filter((t) => t.id !== id);
    });
    try {
      await tarefasApi.remover(id);
    } catch {
      setTarefas(anterior);
    }
  }, []);

  const atualizarLocal = useCallback((id: string, dados: Partial<TarefaDTO>) => {
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, ...dados } : t)));
  }, []);

  return { tarefas, tags, carregando, erro, recarregar, criar, atualizar, remover, atualizarLocal };
}
