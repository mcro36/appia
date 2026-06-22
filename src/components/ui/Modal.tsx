"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  aberto,
  titulo,
  onFechar,
  children,
}: {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    /* Mobile: bottom sheet. Desktop: modal centralizado */
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm md:items-start md:justify-center md:p-4 md:pt-[10vh]"
      onClick={onFechar}
    >
      <div
        className="w-full rounded-t-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900 md:max-w-lg md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <h2 className="text-base font-semibold">{titulo}</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
