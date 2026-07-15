"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { atividadeApi, type AtividadeDTO } from "@/lib/api";
import { STATUS_LABEL } from "@/lib/tarefas-display";
import type { Status } from "@/lib/tarefas";

// Resumo textual de um evento do sistema (não-comentário).
function resumoEvento(a: AtividadeDTO): string {
  switch (a.tipo) {
    case "criou": return "criou a tarefa";
    case "status": return `mudou o status para ${STATUS_LABEL[a.texto as Status] ?? a.texto}`;
    case "responsavel": return a.texto ? `definiu ${a.texto} como responsável` : "removeu o responsável";
    default: return "";
  }
}

export function AtividadeTarefa({ tarefaId }: { tarefaId: string }) {
  const [itens, setItens] = useState<AtividadeDTO[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(() => {
    atividadeApi.listar(tarefaId).then(setItens).catch(() => {});
  }, [tarefaId]);
  useEffect(() => { carregar(); }, [carregar]);

  async function comentar() {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    setEnviando(true);
    try {
      const novo = await atividadeApi.comentar(tarefaId, t);
      setItens((xs) => [...xs, novo]);
    } catch { /* ignore */ } finally { setEnviando(false); }
  }

  async function remover(id: string) {
    setItens((xs) => xs.filter((x) => x.id !== id));
    await atividadeApi.remover(id).catch(() => carregar());
  }

  const rel = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });

  return (
    <div>
      <p className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-500">
        <MessageSquare size={12} /> Atividade
      </p>

      <ul className="space-y-2">
        {itens.length === 0 && <li className="text-xs text-zinc-400">Nenhuma atividade ainda.</li>}
        {itens.map((a) =>
          a.tipo === "comentario" ? (
            <li key={a.id} className="group flex gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                {a.usuario.nome.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 rounded-lg bg-zinc-50 px-2.5 py-1.5 dark:bg-zinc-800/60">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium">{a.usuario.nome}</span>
                  <span className="text-[10px] text-zinc-400">{rel(a.criadoEm)}</span>
                  {a.meu && (
                    <button
                      onClick={() => remover(a.id)}
                      aria-label="Remover comentário"
                      className="ml-auto text-zinc-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-zinc-700 dark:text-zinc-200">{a.texto}</p>
              </div>
            </li>
          ) : (
            <li key={a.id} className="flex items-center gap-2 px-1 text-[11px] text-zinc-400">
              <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="truncate">
                <span className="font-medium text-zinc-500">{a.usuario.nome}</span> {resumoEvento(a)}
              </span>
              <span className="ml-auto shrink-0">{rel(a.criadoEm)}</span>
            </li>
          ),
        )}
      </ul>

      <div className="mt-2 flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") comentar(); }}
          placeholder="Escrever um comentário…"
          className="flex-1 rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10"
        />
        <button
          onClick={comentar}
          disabled={enviando || !texto.trim()}
          aria-label="Enviar comentário"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
