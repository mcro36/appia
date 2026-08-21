"use client";

// Estado + persistência do Status Report. Fonte da verdade: localStorage
// (espelha o comportamento da página original). Na primeira vez, semeia com o
// conteúdo já salvo (STATUS_SEED). Componentes cuidam só da renderização.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  normalizar, itemVazio, STATUS_SEED,
  type Cor, type ItemStatus, type ProjetoStatus, type StatusDoc,
} from "@/lib/statusReport";

const CHAVE = "status-fiemg-moove";

export function useStatusReport() {
  const [doc, setDoc] = useState<StatusDoc>(STATUS_SEED);
  const carregado = useRef(false);

  // Carrega do localStorage ao montar (client). Sem nada salvo → mantém a semente.
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) setDoc(normalizar(JSON.parse(bruto)));
    } catch { /* ignore */ }
    carregado.current = true;
  }, []);

  // Persiste a cada mudança (só depois do carregamento inicial).
  useEffect(() => {
    if (!carregado.current) return;
    try { localStorage.setItem(CHAVE, JSON.stringify(doc)); } catch { /* ignore */ }
  }, [doc]);

  const setTitulo = useCallback((titulo: string) => setDoc((d) => ({ ...d, titulo })), []);

  const addProjeto = useCallback((nome: string) => {
    const n = nome.trim();
    if (!n) return;
    setDoc((d) => ({ ...d, projetos: [...d.projetos, { nome: n, itens: [] }] }));
  }, []);

  const renomearProjeto = useCallback((pi: number, nome: string) => {
    const n = nome.trim();
    setDoc((d) => ({ ...d, projetos: d.projetos.map((p, i) => (i === pi ? { ...p, nome: n || p.nome } : p)) }));
  }, []);

  const excluirProjeto = useCallback((pi: number) => {
    setDoc((d) => ({ ...d, projetos: d.projetos.filter((_, i) => i !== pi) }));
  }, []);

  const addItem = useCallback((pi: number) => {
    setDoc((d) => ({
      ...d,
      projetos: d.projetos.map((p, i) => (i === pi ? { ...p, itens: [...p.itens, itemVazio()] } : p)),
    }));
  }, []);

  // Insere um item completo (usado pelo formulário de adicionar).
  const inserirItem = useCallback((pi: number, item: ItemStatus) => {
    setDoc((d) => ({
      ...d,
      projetos: d.projetos.map((p, i) => (i === pi ? { ...p, itens: [...p.itens, item] } : p)),
    }));
  }, []);

  // Move um item entre posições/projetos (arrastar para reordenar).
  const moverItem = useCallback((fp: number, fi: number, tp: number, ti: number) => {
    setDoc((d) => {
      const projetos = d.projetos.map((p) => ({ ...p, itens: [...p.itens] }));
      if (!projetos[fp] || !projetos[tp]) return d;
      const [item] = projetos[fp].itens.splice(fi, 1);
      if (!item) return d;
      const idx = fp === tp && fi < ti ? ti - 1 : ti;
      projetos[tp].itens.splice(idx, 0, item);
      return { ...d, projetos };
    });
  }, []);

  const atualizarItem = useCallback((pi: number, ii: number, patch: Partial<ItemStatus>) => {
    setDoc((d) => ({
      ...d,
      projetos: d.projetos.map((p, i) =>
        i === pi ? { ...p, itens: p.itens.map((it, j) => (j === ii ? { ...it, ...patch } : it)) } : p,
      ),
    }));
  }, []);

  const excluirItem = useCallback((pi: number, ii: number) => {
    setDoc((d) => ({
      ...d,
      projetos: d.projetos.map((p, i) => (i === pi ? { ...p, itens: p.itens.filter((_, j) => j !== ii) } : p)),
    }));
  }, []);

  const importar = useCallback((bruto: unknown) => setDoc(normalizar(bruto)), []);

  return {
    doc,
    setTitulo,
    addProjeto,
    renomearProjeto,
    excluirProjeto,
    addItem,
    inserirItem,
    moverItem,
    atualizarItem,
    excluirItem,
    importar,
  };
}

export type UseStatusReport = ReturnType<typeof useStatusReport>;
export type { Cor, ItemStatus, ProjetoStatus, StatusDoc };
