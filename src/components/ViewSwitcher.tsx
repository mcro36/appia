"use client";

import { Columns3, Table2, CalendarDays, type LucideIcon } from "lucide-react";
import { useIsPWA } from "@/lib/useIsPWA";

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
  const isPWA = useIsPWA();

  return (
    <div className="inline-flex rounded-lg border border-black/10 bg-white p-0.5 dark:border-white/10 dark:bg-zinc-900">
      {OPCOES.map(({ id, label, Icone }) => (
        <button
          key={id}
          onClick={() => onMudar(id)}
          aria-label={label}
          className={`flex items-center justify-center gap-1.5 rounded-md text-sm transition-colors ${
            isPWA ? "min-h-10 flex-1 px-4 py-2" : "px-2 py-1.5 md:px-3"
          } ${
            visao === id
              ? "bg-indigo-600 text-white"
              : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
          }`}
        >
          <Icone size={isPWA ? 18 : 16} />
          <span className={isPWA ? "inline" : "hidden sm:inline"}>{label}</span>
        </button>
      ))}
    </div>
  );
}
