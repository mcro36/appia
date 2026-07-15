"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { workspacesApi, type MembroDTO } from "@/lib/api";

const PAPEIS = ["owner", "admin", "membro", "leitor"] as const;
const PAPEL_LABEL: Record<string, string> = {
  owner: "Dono", admin: "Admin", membro: "Membro", leitor: "Leitor",
};

export function GerenciarMembrosModal({ papelAtual, onFechar }: { papelAtual: string; onFechar: () => void }) {
  const { data } = useSession();
  const meuId = data?.user?.id;
  const [membros, setMembros] = useState<MembroDTO[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try { setMembros(await workspacesApi.membros()); } catch { /* ignore */ }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const souOwner = papelAtual === "owner";
  const donos = membros.filter((m) => m.papel === "owner").length;

  async function mudarPapel(m: MembroDTO, papel: string) {
    setErro(null);
    try {
      await workspacesApi.mudarPapel(m.id, papel);
      await carregar();
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao mudar papel."); }
  }

  async function remover(m: MembroDTO) {
    if (!confirm(`Remover ${m.nome} do espaço?`)) return;
    setErro(null);
    try {
      await workspacesApi.removerMembro(m.id);
      await carregar();
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao remover."); }
  }

  // Regras espelhando o backend, para desabilitar controles impossíveis.
  const podeEditarPapel = (m: MembroDTO) =>
    (m.papel === "owner" || souOwner) ? souOwner : true; // mexer em owner exige owner
  const podeRemover = (m: MembroDTO) =>
    m.papel === "owner" ? souOwner && donos > 1 : true;

  return (
    <Modal aberto titulo="Membros do espaço" onFechar={onFechar}>
      <div className="flex flex-col gap-2">
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {membros.map((m) => {
          const eu = m.id === meuId;
          const ultimoDono = m.papel === "owner" && donos <= 1;
          return (
            <div key={m.id} className="flex items-center gap-2 rounded-lg border border-black/5 px-3 py-2 dark:border-white/10">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.nome}{eu && <span className="text-zinc-400"> (você)</span>}</p>
                <p className="truncate text-xs text-zinc-500">{m.email}</p>
              </div>
              <select
                value={m.papel}
                onChange={(e) => mudarPapel(m, e.target.value)}
                disabled={!podeEditarPapel(m) || ultimoDono}
                className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-zinc-600 outline-none disabled:opacity-50 focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {PAPEIS.map((p) => (
                  // owner só pode ser escolhido por um owner
                  <option key={p} value={p} disabled={p === "owner" && !souOwner}>{PAPEL_LABEL[p]}</option>
                ))}
              </select>
              <button
                onClick={() => remover(m)}
                disabled={!podeRemover(m)}
                aria-label={`Remover ${m.nome}`}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-red-950/30"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
