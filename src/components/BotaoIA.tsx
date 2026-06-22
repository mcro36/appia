"use client";

import { Sparkles, X } from "lucide-react";

export function BotaoIA({
  aberto,
  onToggle,
}: {
  aberto: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={aberto ? "Fechar assistente" : "Abrir assistente IA"}
      className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
        aberto
          ? "bg-zinc-700 text-white hover:bg-zinc-600"
          : "bg-indigo-600 text-white hover:bg-indigo-500"
      }`}
    >
      {aberto ? <X size={22} /> : <Sparkles size={22} />}

      {/* Anel pulsante quando fechado */}
      {!aberto && (
        <span className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-30" />
      )}
    </button>
  );
}
