// Cliente HTTP do assistente de chat

export type MensagemChat = {
  id: string;
  papel: "user" | "ia";
  conteudo: string;
  acaoExecutada: string | null;
  timestamp: string;
};

export type RespostaChat = {
  id: string;
  texto: string;
  acoes: { funcao: string; resultado: unknown }[];
  mudouTarefas: boolean;
};

export const chatApi = {
  historico: () =>
    fetch("/api/chat").then((r) => r.json() as Promise<MensagemChat[]>),

  enviar: async (mensagem: string): Promise<RespostaChat> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem }),
    });
    const corpo = await res.json();
    if (!res.ok) throw new Error(corpo?.erro ?? `Erro ${res.status}`);
    return corpo as RespostaChat;
  },
};
