"use client";

import { Columns3, Table2, CalendarDays, type LucideIcon } from "lucide-react";

export type Visao = "kanban" | "tabela" | "calendario";

const OPCOES: { id: Visao; label: string; Icone: LucideIcon }[] = [
  { id: "kanban", label: "Quadro", Icone: Columns3 },
  { id: "tabela", label: "Tabela", Icone: Table2 },
  { id: "calendario", label: "Calendário", Icone: CalendarDays },
];

export function ViewSwitcher({
  visao,
  onMudar,
}: {
  visao: Visao;
  onMudar: (v: Visao) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-black/10 bg-white p-0.5 dark:border-white/10 dark:bg-zinc-900">
      {OPCOES.map(({ id, label, Icone }) => (
        <button
          key={id}
          onClick={() => onMudar(id)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
            visao === id
              ? "bg-indigo-600 text-white"
              : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
          }`}
        >
          <Icone size={16} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
