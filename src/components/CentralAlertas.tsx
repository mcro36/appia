"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  alertasAtuais,
  nivelAlerta,
  JANELA_NOTIFICAR_MS,
  type Alerta,
} from "@/lib/lembretes";
import type { TarefaDTO } from "@/lib/tarefas";

const STORAGE_KEY = "lembretes_disparados";
const temNotificacao = () => typeof window !== "undefined" && "Notification" in window;

function disparados(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function marcarDisparado(chave: string) {
  const atual = disparados();
  atual[chave] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(atual));
}

export function CentralAlertas({ tarefas }: { tarefas: TarefaDTO[] }) {
  const [aberto, setAberto] = useState(false);
  const [, setTick] = useState(0);
  const [permissao, setPermissao] = useState<NotificationPermission>("default");
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado inicial da permissão
  useEffect(() => {
    if (temNotificacao()) setPermissao(Notification.permission);
  }, []);

  // Reavalia os prazos a cada 60s (o tempo passa, tarefas vencem)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fecha o painel ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [aberto]);

  const alertas = alertasAtuais(tarefas);

  // Dispara notificações do navegador (uma vez por tarefa/nível)
  useEffect(() => {
    if (!temNotificacao() || Notification.permission !== "granted") return;
    const agora = Date.now();
    for (const t of tarefas) {
      const nivel = nivelAlerta(t, agora);
      if (!nivel) continue;
      // "vencendo" só notifica quando faltam <= 60 min
      if (nivel === "vencendo") {
        const falta = new Date(t.prazo as string).getTime() - agora;
        if (falta > JANELA_NOTIFICAR_MS) continue;
      }
      const chave = `${t.id}:${nivel}`;
      if (disparados()[chave]) continue;
      const titulo = nivel === "atrasada" ? "⚠ Tarefa atrasada" : "🕑 Tarefa vencendo";
      new Notification(titulo, {
        body: t.titulo,
        tag: chave,
      });
      marcarDisparado(chave);
    }
  });

  async function pedirPermissao() {
    if (!temNotificacao()) return;
    const p = await Notification.requestPermission();
    setPermissao(p);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Alertas"
        className="relative rounded-lg border border-black/10 bg-white p-2 text-zinc-600 transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5"
      >
        {alertas.length > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {alertas.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {alertas.length}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900">
          <div className="border-b border-black/10 px-4 py-3 text-sm font-semibold dark:border-white/10">
            Alertas de prazo
          </div>

          {permissao !== "granted" && (
            <button
              onClick={pedirPermissao}
              className="flex w-full items-center gap-2 border-b border-black/10 bg-indigo-50 px-4 py-2.5 text-left text-xs text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-white/10 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              <BellRing size={14} />
              {permissao === "denied"
                ? "Notificações bloqueadas no navegador"
                : "Ativar notificações do navegador"}
            </button>
          )}

          <div className="max-h-80 overflow-y-auto">
            {alertas.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                Nenhum prazo crítico no momento. 🎉
              </p>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {alertas.map(({ tarefa, nivel }: Alerta) => (
                  <li key={tarefa.id} className="flex items-start gap-2 px-4 py-3">
                    {nivel === "atrasada" ? (
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-600" />
                    ) : (
                      <Clock size={15} className="mt-0.5 shrink-0 text-amber-600" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm">{tarefa.titulo}</p>
                      {tarefa.prazo && (
                        <p
                          className={`text-xs ${nivel === "atrasada" ? "text-red-600" : "text-amber-600"}`}
                        >
                          {nivel === "atrasada" ? "Atrasada · " : "Vence "}
                          {format(new Date(tarefa.prazo), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
