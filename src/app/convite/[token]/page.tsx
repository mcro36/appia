"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Preview = { valido: boolean; workspaceNome?: string; papel?: string };

export default function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/convites/${token}`)
      .then((r) => r.json())
      .then(setPreview)
      .catch(() => setPreview({ valido: false }));
  }, [token]);

  async function aceitar() {
    setEntrando(true);
    setErro(null);
    const r = await fetch(`/api/convites/${token}`, { method: "POST" });
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      setErro(j?.erro ?? "Não foi possível aceitar o convite.");
      setEntrando(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-zinc-950">
        {preview === null ? (
          <p className="text-sm text-zinc-500">Carregando convite…</p>
        ) : !preview.valido ? (
          <>
            <h1 className="mb-2 text-lg font-semibold">Convite inválido</h1>
            <p className="text-sm text-zinc-500">Este convite não existe, expirou ou já foi usado.</p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-semibold">Convite para colaborar</h1>
            <p className="mb-6 text-sm text-zinc-500">
              Você foi convidado para o espaço <span className="font-medium text-zinc-700 dark:text-zinc-200">{preview.workspaceNome}</span> como <span className="font-medium">{preview.papel}</span>.
            </p>
            {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
            <button
              onClick={aceitar}
              disabled={entrando}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
            >
              {entrando ? "Entrando…" : "Aceitar e entrar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
