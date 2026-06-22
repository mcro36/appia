"use client";

import { ListTodo, X } from "lucide-react";

export function Sidebar({
  mobileAberto,
  onFecharMobile,
}: {
  mobileAberto?: boolean;
  onFecharMobile?: () => void;
}) {
  return (
    <>
      {/* Backdrop mobile */}
      {mobileAberto && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onFecharMobile}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-black/10 bg-white px-3 py-4
          transition-transform duration-300 ease-in-out
          dark:border-white/10 dark:bg-zinc-950
          md:relative md:inset-auto md:z-auto md:w-56 md:translate-x-0
          ${mobileAberto ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="mb-6 flex items-center justify-between gap-2.5 px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              A
            </div>
            <span className="font-semibold tracking-tight">APPIA</span>
          </div>
          <button
            onClick={onFecharMobile}
            className="rounded-lg p-1 text-zinc-400 hover:bg-black/5 md:hidden dark:hover:bg-white/10"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          <button className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            <ListTodo size={18} className="shrink-0" />
            <span className="flex-1 text-left">Minhas tarefas</span>
          </button>
        </nav>

        <div className="mt-auto px-3 text-xs text-zinc-400">MVP · single-user</div>
      </aside>
    </>
  );
}
