"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

export function TrocarSenhaModal({ onFechar }: { onFechar: () => void }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const r = await fetch("/api/senha", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atual, nova }),
    });
    setEnviando(false);
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      setErro(j?.erro ?? "Não foi possível trocar a senha.");
      return;
    }
    setOk(true);
    setTimeout(onFechar, 1200);
  }

  return (
    <Modal aberto titulo="Trocar senha" onFechar={onFechar}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Senha atual</span>
          <input
            type="password"
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            required
            autoComplete="current-password"
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Nova senha</span>
          <input
            type="password"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900"
          />
          <span className="text-xs text-zinc-400">Mínimo de 8 caracteres.</span>
        </label>

        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {ok && <p className="text-sm text-emerald-600">Senha alterada com sucesso.</p>}

        <button
          type="submit"
          disabled={enviando || ok}
          className="mt-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </Modal>
  );
}
