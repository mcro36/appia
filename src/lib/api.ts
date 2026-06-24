import type { Nivel, Tipo, Prioridade, Recorrencia, Status, TarefaDTO, TagDTO, TarefaFilhaDTO, ReuniaoDTO, TopicoDTO } from "@/lib/tarefas";

export type NovaTarefa = {
  tipo?: Tipo;
  nivel?: Nivel;
  titulo?: string;
  descricao?: string | null;
  prazo?: string | null;
  prioridade?: Prioridade;
  status?: Status;
  recorrencia?: Recorrencia;
  recorrenciaAte?: string | null;
  tarefaPaiId?: string | null;
  tagIds?: string[];
  dataInicio?: string | null;
  duracaoMin?: number | null;
};

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const corpo = await res.json().catch(() => null);
    throw new Error(corpo?.erro ?? `Erro ${res.status}`);
  }
  return res.json();
}

export const tarefasApi = {
  listar: () => fetch("/api/tarefas").then((r) => parse<TarefaDTO[]>(r)),

  obter: (id: string) => fetch(`/api/tarefas/${id}`).then((r) => parse<TarefaDTO>(r)),

  criar: (dados: NovaTarefa) =>
    fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => parse<TarefaDTO>(r)),

  atualizar: (id: string, dados: Partial<NovaTarefa>) =>
    fetch(`/api/tarefas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => parse<TarefaDTO>(r)),

  remover: async (id: string) => {
    const res = await fetch(`/api/tarefas/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(`Erro ${res.status}`);
  },

  adicionarTarefa: (id: string, dados: { titulo: string; prazo?: string | null; prioridade?: Prioridade; dataInicio?: string | null; duracaoMin?: number | null }) =>
    fetch(`/api/tarefas/${id}/subtarefas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => parse<TarefaFilhaDTO>(r)),
};

export const reunioesApi = {
  listar: (tarefaId: string) =>
    fetch(`/api/tarefas/${tarefaId}/reunioes`).then((r) => parse<ReuniaoDTO[]>(r)),

  criar: (tarefaId: string, dados: { titulo?: string | null; dataHora?: string | null }) =>
    fetch(`/api/tarefas/${tarefaId}/reunioes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => parse<ReuniaoDTO>(r)),

  atualizar: (id: string, dados: { titulo?: string | null; dataHora?: string | null; anotacoes?: string | null }) =>
    fetch(`/api/reunioes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => parse<ReuniaoDTO>(r)),

  remover: async (id: string) => {
    const res = await fetch(`/api/reunioes/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(`Erro ${res.status}`);
  },
};

export const topicosApi = {
  criar: (reuniaoId: string, titulo: string) =>
    fetch(`/api/reunioes/${reuniaoId}/topicos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo }),
    }).then((r) => parse<TopicoDTO>(r)),

  atualizar: (id: string, dados: { titulo?: string; concluido?: boolean }) =>
    fetch(`/api/topicos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => parse<TopicoDTO>(r)),

  remover: async (id: string) => {
    const res = await fetch(`/api/topicos/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(`Erro ${res.status}`);
  },
};

export const tagsApi = {
  listar: () => fetch("/api/tags").then((r) => parse<TagDTO[]>(r)),
  criar: (nome: string, cor?: string) =>
    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cor }),
    }).then((r) => parse<TagDTO>(r)),
};
