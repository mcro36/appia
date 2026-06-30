"use client";

import { useCallback, useState } from "react";
import { reunioesApi, topicosApi } from "@/lib/api";
import type { ReuniaoDTO, TopicoDTO } from "@/lib/tarefas";

export function useReunioes(tarefaId: string) {
  const [reunioes, setReunioes] = useState<ReuniaoDTO[]>([]);

  const carregar = useCallback(async () => {
    const data = await reunioesApi.listar(tarefaId);
    setReunioes(data);
  }, [tarefaId]);

  async function criar(dados: { titulo?: string | null; dataHora?: string | null }) {
    const nova = await reunioesApi.criar(tarefaId, dados);
    setReunioes((prev) => [...prev, nova]);
    return nova;
  }

  async function atualizar(id: string, dados: { titulo?: string | null; dataHora?: string | null; duracaoMin?: number | null }) {
    const atualizada = await reunioesApi.atualizar(id, dados);
    setReunioes((prev) => prev.map((r) => (r.id === id ? atualizada : r)));
  }

  async function remover(id: string) {
    await reunioesApi.remover(id);
    setReunioes((prev) => prev.filter((r) => r.id !== id));
  }

  async function adicionarTopico(reuniaoId: string, titulo: string) {
    const topico = await topicosApi.criar(reuniaoId, titulo);
    setReunioes((prev) =>
      prev.map((r) => (r.id === reuniaoId ? { ...r, topicos: [...r.topicos, topico] } : r))
    );
  }

  async function toggleTopico(reuniaoId: string, topico: TopicoDTO) {
    const atualizado = await topicosApi.atualizar(topico.id, { concluido: !topico.concluido });
    setReunioes((prev) =>
      prev.map((r) =>
        r.id === reuniaoId
          ? { ...r, topicos: r.topicos.map((t) => (t.id === topico.id ? atualizado : t)) }
          : r
      )
    );
  }

  async function renomearTopico(reuniaoId: string, topicoId: string, titulo: string) {
    const atualizado = await topicosApi.atualizar(topicoId, { titulo });
    setReunioes((prev) =>
      prev.map((r) =>
        r.id === reuniaoId
          ? { ...r, topicos: r.topicos.map((t) => (t.id === topicoId ? atualizado : t)) }
          : r
      )
    );
  }

  async function removerTopico(reuniaoId: string, topicoId: string) {
    await topicosApi.remover(topicoId);
    setReunioes((prev) =>
      prev.map((r) =>
        r.id === reuniaoId ? { ...r, topicos: r.topicos.filter((t) => t.id !== topicoId) } : r
      )
    );
  }

  return { reunioes, carregar, criar, atualizar, remover, adicionarTopico, toggleTopico, renomearTopico, removerTopico };
}
