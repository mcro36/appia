"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, KeyRound, Check, UserPlus, Building2, Users } from "lucide-react";
import { TrocarSenhaModal } from "@/components/TrocarSenhaModal";
import { GerenciarMembrosModal } from "@/components/GerenciarMembrosModal";

type Workspace = { id: string; nome: string; papel: string };

export function UserMenu() {
  const { data } = useSession();
  const [aberto, setAberto] = useState(false);
  const [senhaAberta, setSenhaAberta] = useState(false);
  const [membrosAberto, setMembrosAberto] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [linkConvite, setLinkConvite] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/workspaces");
      if (!r.ok) return;
      const j = await r.json();
      setWorkspaces(j.workspaces ?? []);
      setAtiva(j.ativa ?? null);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!aberto) return;
    carregar();
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [aberto, carregar]);

  async function trocar(id: string) {
    if (id === ativa) return;
    const r = await fetch("/api/workspaces/ativa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: id }),
    });
    if (r.ok) window.location.reload();
  }

  async function convidar() {
    const r = await fetch("/api/workspaces/convites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ papel: "membro" }),
    });
    if (!r.ok) return;
    const j = await r.json();
    const url = `${window.location.origin}${j.caminho}`;
    setLinkConvite(url);
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }

  const email = data?.user?.email ?? "";
  const nome = data?.user?.name || email;
  const inicial = (nome || "?").charAt(0).toUpperCase();
  const papelAtivo = workspaces.find((w) => w.id === ativa)?.papel;
  const podeConvidar = papelAtivo === "owner" || papelAtivo === "admin";

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setAberto((v) => !v)}
          aria-label="Conta"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white transition-transform hover:scale-105"
        >
          {inicial}
        </button>

        {aberto && (
          <div className="absolute right-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
            <div className="border-b border-black/5 px-3 py-2.5 dark:border-white/5">
              {data?.user?.name && <p className="truncate text-sm font-medium">{data.user.name}</p>}
              <p className="truncate text-xs text-zinc-500">{email}</p>
            </div>

            {/* Workspaces */}
            <div className="border-b border-black/5 py-1 dark:border-white/5">
              <p className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                <Building2 size={11} /> Espaços
              </p>
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => trocar(w.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {w.id === ativa && <Check size={14} className="text-indigo-600" />}
                  </span>
                  <span className="flex-1 truncate">{w.nome}</span>
                  <span className="shrink-0 text-[10px] text-zinc-400">{w.papel}</span>
                </button>
              ))}
              {podeConvidar && (
                <>
                  <button
                    onClick={convidar}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-indigo-600 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center"><UserPlus size={14} /></span>
                    Convidar pessoas
                  </button>
                  <button
                    onClick={() => { setAberto(false); setMembrosAberto(true); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/5"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center"><Users size={14} className="text-zinc-400" /></span>
                    Gerenciar membros
                  </button>
                </>
              )}
              {linkConvite && (
                <p className="mx-3 my-1 break-all rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  Link copiado: {linkConvite}
                </p>
              )}
            </div>

            <button
              onClick={() => { setAberto(false); setSenhaAberta(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              <KeyRound size={15} className="text-zinc-400" /> Trocar senha
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        )}
      </div>

      {senhaAberta && <TrocarSenhaModal onFechar={() => setSenhaAberta(false)} />}
      {membrosAberto && (
        <GerenciarMembrosModal papelAtual={papelAtivo ?? "membro"} onFechar={() => { setMembrosAberto(false); carregar(); }} />
      )}
    </>
  );
}
