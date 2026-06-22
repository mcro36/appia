import { NextResponse } from "next/server";
import type { Content } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { processarMensagem } from "@/lib/gemini";

// GET /api/chat — histórico de mensagens (ordem cronológica)
export async function GET() {
  const mensagens = await prisma.mensagemChat.findMany({
    orderBy: { timestamp: "asc" },
    take: 100,
  });
  return NextResponse.json(mensagens);
}

// POST /api/chat — envia uma mensagem ao assistente e executa as ações decididas
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const mensagem = typeof body?.mensagem === "string" ? body.mensagem.trim() : "";
  if (!mensagem) {
    return NextResponse.json({ erro: "Mensagem vazia." }, { status: 400 });
  }

  // Histórico anterior (últimas ~5 trocas) para dar contexto ao modelo sem
  // inflar tokens — o estado das tarefas vai à parte, no snapshot do system prompt.
  const recentes = await prisma.mensagemChat.findMany({
    orderBy: { timestamp: "desc" },
    take: 10,
  });
  const anteriores = recentes.reverse();
  // A API do Gemini exige que o histórico comece por uma mensagem 'user'.
  while (anteriores.length && anteriores[0].papel !== "user") anteriores.shift();
  const historico: Content[] = anteriores.map((m) => ({
    role: m.papel === "user" ? "user" : "model",
    parts: [{ text: m.conteudo }],
  }));

  // Processa ANTES de persistir: se falhar, não deixamos a mensagem do usuário
  // órfã no histórico (o que confundiria os próximos turnos).
  let resposta;
  try {
    resposta = await processarMensagem(mensagem, historico);
  } catch (e) {
    const bruto = e instanceof Error ? e.message : String(e);
    // Erro de quota/limite da API Gemini → mensagem amigável + 429
    if (bruto.includes("429") || bruto.includes("Too Many Requests") || bruto.includes("quota")) {
      return NextResponse.json(
        {
          erro:
            "Limite da API Gemini atingido (free tier). Aguarde alguns instantes e tente novamente, " +
            "ou habilite o faturamento no Google AI Studio para limites maiores.",
        },
        { status: 429 },
      );
    }
    return NextResponse.json({ erro: bruto }, { status: 500 });
  }

  // Persiste o par usuário + IA somente após sucesso (com resumo das ações)
  const acoesResumo = resposta.acoes.length
    ? JSON.stringify(resposta.acoes.map((a) => a.funcao))
    : null;
  await prisma.mensagemChat.create({ data: { papel: "user", conteudo: mensagem } });
  const msgIa = await prisma.mensagemChat.create({
    data: { papel: "ia", conteudo: resposta.texto, acaoExecutada: acoesResumo },
  });

  return NextResponse.json({
    id: msgIa.id,
    texto: resposta.texto,
    acoes: resposta.acoes,
    // sinaliza ao front se a lista de tarefas mudou (para recarregar as visões)
    mudouTarefas: resposta.acoes.some(
      (a) => a.funcao !== "listar_tarefas",
    ),
  });
}
