"use client";

// Lógica de detalhe de uma tarefa: estado local + operações de mutação no
// servidor (status, prioridade, prazo, tipo, nível, subtarefas em 2 níveis,
// agenda e tags). O componente TarefaDetalhe consome este hook e cuida só da UI.
import { useEffect, useState } from "react";
import { tarefasApi, tagsApi } from "@/lib/api";
import { statusDerivado, type Status, type TarefaDTO, type TarefaFilhaDTO, type TagDTO } from "@/lib/tarefas";

type OnAtualizar = (id: string, dados: Partial<TarefaDTO>) => void;

export function useTarefaDetalhe(
  tarefaInicial: TarefaDTO,
  onAtualizar: OnAtualizar,
  onTarefasMudaram: () => void,
) {
  const [tarefa, setTarefa] = useState<TarefaDTO>(tarefaInicial);

  // A lista (`/api/tarefas`) só inclui 1 nível de filhas. Ao abrir o detalhe,
  // busca a árvore completa (2 níveis) para que subtarefas e sub-subtarefas
  // apareçam atualizadas, sem depender do recarregamento da lista.
  useEffect(() => {
    let ativo = true;
    tarefasApi.obter(tarefaInicial.id).then((completa) => {
      if (ativo) setTarefa(completa);
    }).catch(() => {});
    return () => { ativo = false; };
  }, [tarefaInicial.id]);

  async function salvarTitulo(novoTitulo: string) {
    const novo = novoTitulo.trim();
    if (!novo || novo === tarefa.titulo) return;
    const atualizado = await tarefasApi.atualizar(tarefa.id, { titulo: novo });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { titulo: novo });
  }

  async function salvarDescricao(novaDescricao: string) {
    const nova = novaDescricao.trim();
    if (nova === (tarefa.descricao ?? "")) return;
    const atualizado = await tarefasApi.atualizar(tarefa.id, { descricao: nova || null });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { descricao: atualizado.descricao });
  }

  async function mudarStatus(status: TarefaDTO["status"]) {
    const atualizado = await tarefasApi.atualizar(tarefa.id, { status });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { status });
  }

  async function mudarPrioridade(prioridade: TarefaDTO["prioridade"]) {
    const atualizado = await tarefasApi.atualizar(tarefa.id, { prioridade });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { prioridade });
  }

  async function mudarPrazo(valor: string) {
    const prazo = valor ? new Date(valor).toISOString() : null;
    const atualizado = await tarefasApi.atualizar(tarefa.id, { prazo });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { prazo });
  }

  async function mudarPrazoRigido(prazoRigido: boolean) {
    const atualizado = await tarefasApi.atualizar(tarefa.id, { prazoRigido });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { prazoRigido });
  }

  async function mudarTipo(tipo: TarefaDTO["tipo"]) {
    const atualizado = await tarefasApi.atualizar(tarefa.id, { tipo });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { tipo });
  }

  async function mudarNivel(nivel: TarefaDTO["nivel"]) {
    const atualizado = await tarefasApi.atualizar(tarefa.id, { nivel });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { nivel });
  }

  async function adicionarTarefaFilha(titulo: string) {
    const texto = titulo.trim();
    if (!texto) return;
    const sub = await tarefasApi.adicionarTarefa(tarefa.id, { titulo: texto });
    setTarefa((t) => ({ ...t, tarefas: [...t.tarefas, sub] }));
    onTarefasMudaram();
  }

  // Localiza a tarefa-pai (filha) de uma subtarefa neta.
  function paiDeNeto(netoId: string) {
    return tarefa.tarefas.find((f) => f.tarefas.some((n) => n.id === netoId));
  }

  // Alterna conclusão de uma tarefa SEM filhas (filha folha ou neto).
  async function alternarConclusao(node: TarefaFilhaDTO) {
    if (node.tarefas.length > 0) return; // tarefas com subtarefas têm status derivado
    const novoStatus: Status = node.status === "concluido" ? "a_fazer" : "concluido";
    await tarefasApi.atualizar(node.id, { status: novoStatus });

    const ehFilha = tarefa.tarefas.some((f) => f.id === node.id);
    if (ehFilha) {
      setTarefa((t) => ({ ...t, tarefas: t.tarefas.map((f) => (f.id === node.id ? { ...f, status: novoStatus } : f)) }));
    } else {
      const pai = paiDeNeto(node.id);
      if (!pai) return;
      const netos = pai.tarefas.map((n) => (n.id === node.id ? { ...n, status: novoStatus } : n));
      const statusPai = statusDerivado(netos);
      if (statusPai !== pai.status) await tarefasApi.atualizar(pai.id, { status: statusPai });
      setTarefa((t) => ({ ...t, tarefas: t.tarefas.map((f) => (f.id === pai.id ? { ...f, status: statusPai, tarefas: netos } : f)) }));
    }
    onTarefasMudaram();
  }

  async function renomear(id: string, novoTitulo: string) {
    await tarefasApi.atualizar(id, { titulo: novoTitulo });
    setTarefa((t) => ({
      ...t,
      tarefas: t.tarefas.map((f) =>
        f.id === id
          ? { ...f, titulo: novoTitulo }
          : { ...f, tarefas: f.tarefas.map((n) => (n.id === id ? { ...n, titulo: novoTitulo } : n)) },
      ),
    }));
    onTarefasMudaram();
  }

  async function excluir(node: TarefaFilhaDTO) {
    const aviso = node.tarefas.length
      ? `Excluir "${node.titulo}" e suas ${node.tarefas.length} subtarefa(s)?`
      : `Excluir "${node.titulo}"?`;
    if (!confirm(aviso)) return;
    await tarefasApi.remover(node.id);

    const ehFilha = tarefa.tarefas.some((f) => f.id === node.id);
    if (ehFilha) {
      setTarefa((t) => ({ ...t, tarefas: t.tarefas.filter((f) => f.id !== node.id) }));
    } else {
      const pai = paiDeNeto(node.id);
      if (pai) {
        const netos = pai.tarefas.filter((n) => n.id !== node.id);
        const statusPai = netos.length ? statusDerivado(netos) : pai.status;
        if (statusPai !== pai.status) await tarefasApi.atualizar(pai.id, { status: statusPai });
        setTarefa((t) => ({ ...t, tarefas: t.tarefas.map((f) => (f.id === pai.id ? { ...f, status: statusPai, tarefas: netos } : f)) }));
      }
    }
    onTarefasMudaram();
  }

  async function adicionarSubFilha(paiId: string, tituloFilha: string) {
    const novo = await tarefasApi.adicionarTarefa(paiId, { titulo: tituloFilha });
    const pai = tarefa.tarefas.find((f) => f.id === paiId);
    if (!pai) return;
    const netos = [...pai.tarefas, novo];
    const statusPai = statusDerivado(netos);
    if (statusPai !== pai.status) await tarefasApi.atualizar(paiId, { status: statusPai });
    setTarefa((t) => ({ ...t, tarefas: t.tarefas.map((f) => (f.id === paiId ? { ...f, status: statusPai, tarefas: netos } : f)) }));
    onTarefasMudaram();
  }

  async function salvarAgendaTarefa(node: TarefaFilhaDTO, dataInicio: string | null, duracaoMin: number | null) {
    await tarefasApi.atualizar(node.id, { dataInicio, duracaoMin });
    setTarefa((t) => ({
      ...t,
      tarefas: t.tarefas.map((f) =>
        f.id === node.id
          ? { ...f, dataInicio, duracaoMin }
          : { ...f, tarefas: f.tarefas.map((n) => (n.id === node.id ? { ...n, dataInicio, duracaoMin } : n)) },
      ),
    }));
    onTarefasMudaram();
  }

  async function toggleTag(tag: TagDTO) {
    const temTag = tarefa.tags.some((t) => t.id === tag.id);
    const novasTags = temTag ? tarefa.tags.filter((t) => t.id !== tag.id) : [...tarefa.tags, tag];
    const atualizado = await tarefasApi.atualizar(tarefa.id, { tagIds: novasTags.map((t) => t.id) });
    setTarefa(atualizado);
    onAtualizar(tarefa.id, { tags: atualizado.tags });
  }

  async function criarTag() {
    const nome = prompt("Nome da nova tag:");
    if (!nome?.trim()) return;
    const nova = await tagsApi.criar(nome.trim());
    await toggleTag(nova);
    onTarefasMudaram();
  }

  return {
    tarefa,
    salvarTitulo,
    salvarDescricao,
    mudarStatus,
    mudarPrioridade,
    mudarPrazo,
    mudarPrazoRigido,
    mudarTipo,
    mudarNivel,
    adicionarTarefaFilha,
    alternarConclusao,
    renomear,
    excluir,
    adicionarSubFilha,
    salvarAgendaTarefa,
    toggleTag,
    criarTag,
  };
}
