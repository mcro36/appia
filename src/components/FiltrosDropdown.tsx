"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { NIVEIS, type Nivel, type Tipo } from "@/lib/tarefas";
import { NIVEL_LABEL } from "@/lib/tarefas-display";
import type { TagDTO } from "@/lib/tarefas";
import type { MembroDTO } from "@/lib/api";

type Props = {
  filtroTipo: Tipo | "todos";
  filtroNivel: Nivel | "todos";
  filtroTagId: string | null;
  filtroResponsavel: string;
  tags: TagDTO[];
  membros: MembroDTO[];
  onFiltroTipo: (v: Tipo | "todos") => void;
  onFiltroNivel: (v: Nivel | "todos") => void;
  onFiltroTagId: (v: string | null) => void;
  onFiltroResponsavel: (v: string) => void;
};

export function FiltrosDropdown({
  filtroTipo, filtroNivel, filtroTagId, filtroResponsavel, tags, membros,
  onFiltroTipo, onFiltroNivel, onFiltroTagId, onFiltroResponsavel,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const ativos =
    (filtroTipo !== "todos" ? 1 : 0) +
    (filtroNivel !== "todos" ? 1 : 0) +
    (filtroTagId ? 1 : 0) +
    (filtroResponsavel !== "todos" ? 1 : 0);

  useEffect(() => {
    if (!aberto) return;
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [aberto]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
          ativos > 0
            ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
            : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        <SlidersHorizontal size={13} />
        Filtros
        {ativos > 0 && (
          <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
            {ativos}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-xl border border-black/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-zinc-900">
          {/* Tipo */}
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Tipo</p>
          <div className="mb-3 flex rounded-lg border border-black/10 dark:border-white/10">
            {(["todos", "atividade", "projeto"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onFiltroTipo(t)}
                className={`flex-1 py-1.5 text-xs transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  filtroTipo === t
                    ? "bg-indigo-600 font-medium text-white"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {t === "todos" ? "Todos" : t === "atividade" ? "Atividades" : "Projetos"}
              </button>
            ))}
          </div>

          {/* Nível */}
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Nível</p>
          <div className="mb-3 flex rounded-lg border border-black/10 dark:border-white/10">
            {(["todos", ...NIVEIS] as const).map((n) => (
              <button
                key={n}
                onClick={() => onFiltroNivel(n)}
                className={`flex-1 py-1.5 text-xs transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  filtroNivel === n
                    ? "bg-indigo-600 font-medium text-white"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {n === "todos" ? "Todos" : NIVEL_LABEL[n]}
              </button>
            ))}
          </div>

          {/* Responsável — só em espaço compartilhado */}
          {membros.length > 1 && (
            <>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Responsável</p>
              <select
                value={filtroResponsavel}
                onChange={(e) => onFiltroResponsavel(e.target.value)}
                className="mb-3 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs text-zinc-600 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="todos">Qualquer responsável</option>
                <option value="sem">Sem responsável</option>
                {membros.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Tag</p>
              <select
                value={filtroTagId ?? ""}
                onChange={(e) => onFiltroTagId(e.target.value || null)}
                className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs text-zinc-600 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="">Todas as tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.nome}</option>
                ))}
              </select>
            </>
          )}

          {ativos > 0 && (
            <button
              onClick={() => { onFiltroTipo("todos"); onFiltroNivel("todos"); onFiltroTagId(null); onFiltroResponsavel("todos"); }}
              className="mt-3 w-full rounded-lg border border-black/10 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
