"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { ativarNotificacoes, assinarPush, pushSuportado } from "@/lib/pushClient";

const DISPENSADO_KEY = "banner_notif_dispensado";

/**
 * Banner de ativação de notificações push — exibido só quando suportado e
 * a permissão ainda está como "default". Se já concedida, re-sincroniza a
 * inscrição silenciosamente (o endpoint pode ter mudado).
 */
export function BannerNotificacoes() {
  const [visivel, setVisivel] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!pushSuportado()) return;
    if (Notification.permission === "granted") {
      assinarPush().catch(() => {});
      return;
    }
    if (Notification.permission === "default" && localStorage.getItem(DISPENSADO_KEY) !== "1") {
      setVisivel(true);
    }
  }, []);

  async function ativar() {
    setOcupado(true);
    const permissao = await ativarNotificacoes();
    setOcupado(false);
    if (permissao !== "default") setVisivel(false);
  }

  function dispensar() {
    localStorage.setItem(DISPENSADO_KEY, "1");
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 dark:border-indigo-900 dark:bg-indigo-950/40">
      <BellRing size={18} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
          Ativar notificações
        </p>
        <p className="text-xs text-indigo-700/80 dark:text-indigo-300/70">
          Receba avisos de prazos mesmo com o app fechado.
        </p>
      </div>
      <button
        onClick={ativar}
        disabled={ocupado}
        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
      >
        {ocupado ? "..." : "Ativar"}
      </button>
      <button
        onClick={dispensar}
        aria-label="Dispensar"
        className="shrink-0 rounded-lg p-1 text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
      >
        <X size={16} />
      </button>
    </div>
  );
}
