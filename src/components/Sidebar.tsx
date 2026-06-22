"use client";

import { ListTodo } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-black/10 bg-white px-3 py-4 dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          GP
        </div>
        <span className="font-semibold tracking-tight">Gestão de Processos</span>
      </div>

      <nav className="flex flex-col gap-1">
        <button className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
          <ListTodo size={18} className="shrink-0" />
          <span className="flex-1 text-left">Minhas tarefas</span>
        </button>
      </nav>

      <div className="mt-auto px-3 text-xs text-zinc-400">
        MVP · single-user local
      </div>
    </aside>
  );
}
