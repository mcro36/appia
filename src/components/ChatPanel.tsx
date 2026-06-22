"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { chatApi, type MensagemChat } from "@/lib/chatApi";

const SUGESTOES = [
  "Adicione: enviar relatório até sexta às 17h, prioridade alta",
  "O que vence essa semana?",
  "Marque a tarefa de revisar contrato como concluída",
];

type Item =
  | MensagemChat
  | { id: string; papel: "user" | "ia"; conteudo: string; acaoExecutada: string | null; pendente?: boolean };

export function ChatPanel({
  onFechar,
  onTarefasMudaram,
}: {
  onFechar: () => void;
  onTarefasMudaram: () => void;
}) {
  const [itens, setItens] = useState<Item[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi.historico().then(setItens).catch(() => {});
  }, []);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [itens, enviando]);

  async function enviar(msg: string) {
    const conteudo = msg.trim();
    if (!conteudo || enviando) return;
    setErro(null);
    setTexto("");
    setEnviando(true);
    const tempId = `tmp-${Date.now()}`;
    setItens((prev) => [
      ...prev,
      { id: tempId, papel: "user", conteudo, acaoExecutada: null },
    ]);

    try {
      const resp = await chatApi.enviar(conteudo);
      setItens((prev) => [
        ...prev,
        {
          id: resp.id,
          papel: "ia",
          conteudo: resp.texto,
          acaoExecutada: resp.acoes.length
            ? JSON.stringify(resp.acoes.map((a) => a.funcao))
            : null,
        },
      ]);
      if (resp.mudouTarefas) onTarefasMudaram();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
      <header className="flex items-center gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
        <Sparkles size={18} className="text-indigo-600" />
        <span className="font-semibold">Assistente IA</span>
        <button
          onClick={onFechar}
          aria-label="Fechar chat"
          className="ml-auto rounded-lg p-1 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {itens.length === 0 && (
          <div className="mt-4 text-center">
            <Sparkles size={28} className="mx-auto text-indigo-400" />
            <p className="mt-3 text-sm font-medium">Fale com o assistente</p>
            <p className="mt-1 text-xs text-zinc-500">
              Descreva suas tarefas em linguagem natural — ele organiza para você.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="rounded-lg border border-black/10 px-3 py-2 text-left text-xs text-zinc-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-indigo-950/30"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {itens.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.papel === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.papel === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              {m.conteudo}
              {m.acaoExecutada && (
                <span className="mt-1 block text-[10px] opacity-70">
                  ✓ ação executada
                </span>
              )}
            </div>
          </div>
        ))}

        {enviando && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-400 dark:bg-zinc-800">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce [animation-delay:0.15s]">•</span>
                <span className="animate-bounce [animation-delay:0.3s]">•</span>
              </span>
            </div>
          </div>
        )}

        {erro && (
          <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {erro}
          </p>
        )}

        <div ref={fimRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="flex items-end gap-2 border-t border-black/10 p-3 dark:border-white/10"
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(texto);
            }
          }}
          rows={1}
          placeholder="Escreva uma mensagem…"
          className="max-h-32 flex-1 resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviando}
          aria-label="Enviar"
          className="rounded-lg bg-indigo-600 p-2.5 text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
}
