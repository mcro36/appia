import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
  type Content,
} from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { PRIORIDADES, RECORRENCIAS, STATUS, TIPOS } from "@/lib/tarefas";
import { includeTarefaDetalhe, flattenFolhas } from "@/lib/mapTarefa";
import { ocupadosDoDia, proximaVaga, mesmoDia, type ConfigDTO, type ReuniaoSlim } from "@/lib/agenda";
import { proximaOcorrencia } from "@/lib/datas";

const MODELO = "gemini-2.5-flash";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada no .env");
  return new GoogleGenerativeAI(apiKey);
}

// ---- Declaração das funções que a IA pode chamar ----------------------------

const funcoes: FunctionDeclaration[] = [
  {
    name: "listar_tarefas",
    description:
      "Lista as tarefas existentes. Use SOMENTE se precisar de um filtro dinâmico não disponível no snapshot.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          format: "enum",
          description: "Filtra por status (opcional).",
          enum: [...STATUS],
        },
      },
    },
  },
  {
    name: "criar_tarefa",
    description: "Cria uma nova atividade ou projeto. Por padrão cria como 'atividade'; use 'projeto' apenas se o usuário indicar explicitamente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tipo: { type: SchemaType.STRING, format: "enum", enum: [...TIPOS], description: "Tipo: 'atividade' (padrão) ou 'projeto'." },
        titulo: { type: SchemaType.STRING, description: "Título." },
        descricao: { type: SchemaType.STRING, description: "Detalhes adicionais (participantes, local, links, contexto)." },
        prazo: { type: SchemaType.STRING, description: "Prazo ISO 8601 com fuso -03:00. Obrigatório quando informado." },
        prioridade: { type: SchemaType.STRING, format: "enum", enum: [...PRIORIDADES] },
        status: { type: SchemaType.STRING, format: "enum", enum: [...STATUS] },
        recorrencia: { type: SchemaType.STRING, format: "enum", enum: [...RECORRENCIAS] },
        duracaoMin: { type: SchemaType.NUMBER, description: "Duração estimada em minutos para executar. Estime um valor realista (ex.: 30, 60) quando o usuário não informar." },
        tags: { type: SchemaType.STRING, description: "Tags separadas por vírgula (ex.: 'infraestrutura,rede'). Opcional." },
      },
      required: ["titulo"],
    },
  },
  {
    name: "criar_subtarefa",
    description: "Cria uma tarefa vinculada a uma atividade ou projeto existente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tarefaPaiId: { type: SchemaType.STRING, description: "id da tarefa pai (do snapshot)." },
        titulo: { type: SchemaType.STRING, description: "Título da subtarefa." },
        prazo: { type: SchemaType.STRING, description: "Prazo/deadline ISO 8601 (opcional)." },
        dataInicio: { type: SchemaType.STRING, description: "Data e hora de início do bloco de trabalho, ISO 8601 com fuso -03:00. Use quando o usuário agendar para uma data/hora específica." },
        duracaoMin: { type: SchemaType.NUMBER, description: "Duração estimada em minutos (ex.: 60 para 1h). Use quando o usuário informar duração." },
        prioridade: { type: SchemaType.STRING, format: "enum", enum: [...PRIORIDADES] },
      },
      required: ["tarefaPaiId", "titulo"],
    },
  },
  {
    name: "atualizar_tarefa",
    description: "Atualiza campos de uma tarefa existente. Informe apenas os campos a alterar.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: "id da tarefa (do snapshot)." },
        titulo: { type: SchemaType.STRING },
        descricao: { type: SchemaType.STRING },
        prazo: { type: SchemaType.STRING, description: "Novo prazo ISO 8601, ou vazio para remover." },
        prioridade: { type: SchemaType.STRING, format: "enum", enum: [...PRIORIDADES] },
        status: { type: SchemaType.STRING, format: "enum", enum: [...STATUS] },
        recorrencia: { type: SchemaType.STRING, format: "enum", enum: [...RECORRENCIAS] },
        tags: {
          type: SchemaType.STRING,
          description: "Nova lista de tags separadas por vírgula (substitui as existentes). Vazio para remover todas.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "planejar_dia",
    description:
      "Distribui as tarefas pendentes de hoje na agenda, encaixando nos horários livres entre reuniões e almoço, dentro do expediente, por ordem de prioridade e prazo. Use quando o usuário pedir para planejar/organizar o dia.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "concluir_tarefa",
    description: "Marca uma tarefa como concluída.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: "id da tarefa." },
      },
      required: ["id"],
    },
  },
  {
    name: "remover_tarefa",
    description: "Remove (exclui) uma tarefa permanentemente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: "id da tarefa." },
      },
      required: ["id"],
    },
  },
];

// ---- Execução real das funções contra o banco ------------------------------

type Args = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const dataOuNull = (v: unknown) => {
  const s = str(v);
  return s ? new Date(s) : null;
};

export type AcaoExecutada = { funcao: string; resultado: unknown };

async function resolverTags(tagsStr: string | undefined): Promise<string[]> {
  if (!tagsStr) return [];
  const nomes = tagsStr.split(",").map((s) => s.trim()).filter(Boolean);
  const ids: string[] = [];
  for (const nome of nomes) {
    const tag = await prisma.tag.upsert({
      where: { nome },
      create: { nome },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids;
}

async function executar(nome: string, args: Args): Promise<unknown> {
  switch (nome) {
    case "listar_tarefas": {
      const status = str(args.status);
      const tarefas = await prisma.tarefa.findMany({
        where: status ? { status } : undefined,
        orderBy: [{ prazo: "asc" }, { criadaEm: "desc" }],
      });
      return tarefas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        status: t.status,
        prioridade: t.prioridade,
        prazo: t.prazo,
      }));
    }
    case "criar_tarefa": {
      const titulo = str(args.titulo);
      if (!titulo) return { erro: "Título é obrigatório." };
      const tagIds = await resolverTags(str(args.tags));
      const t = await prisma.tarefa.create({
        data: {
          tipo: str(args.tipo) ?? "atividade",
          titulo,
          descricao: str(args.descricao) ?? null,
          prazo: dataOuNull(args.prazo),
          prioridade: str(args.prioridade) ?? "media",
          status: str(args.status) ?? "a_fazer",
          recorrencia: str(args.recorrencia) ?? "none",
          duracaoMin: typeof args.duracaoMin === "number" ? Math.round(args.duracaoMin) : null,
          tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
        },
      });
      return { ok: true, id: t.id, titulo: t.titulo };
    }
    case "criar_subtarefa": {
      const tarefaPaiId = str(args.tarefaPaiId);
      const titulo = str(args.titulo);
      if (!tarefaPaiId || !titulo) return { erro: "tarefaPaiId e título são obrigatórios." };
      const t = await prisma.tarefa.create({
        data: {
          titulo,
          prazo: dataOuNull(args.prazo),
          dataInicio: dataOuNull(args.dataInicio),
          duracaoMin: typeof args.duracaoMin === "number" ? Math.round(args.duracaoMin) : null,
          prioridade: str(args.prioridade) ?? "media",
          tarefaPaiId,
        },
      });
      return { ok: true, id: t.id, titulo: t.titulo };
    }
    case "atualizar_tarefa": {
      const id = str(args.id);
      if (!id) return { erro: "id é obrigatório." };
      const data: Record<string, unknown> = {};
      if (args.titulo !== undefined) data.titulo = str(args.titulo);
      if (args.descricao !== undefined) data.descricao = str(args.descricao) ?? null;
      if (args.prazo !== undefined) data.prazo = dataOuNull(args.prazo);
      if (args.prioridade !== undefined) data.prioridade = str(args.prioridade);
      if (args.status !== undefined) {
        data.status = str(args.status);
        data.concluidaEm = str(args.status) === "concluido" ? new Date() : null;
      }
      if (args.recorrencia !== undefined) data.recorrencia = str(args.recorrencia);
      if (args.tags !== undefined) {
        const tagIds = await resolverTags(str(args.tags));
        data.tags = { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) };
      }
      try {
        const t = await prisma.tarefa.update({ where: { id }, data });
        return { ok: true, id: t.id, titulo: t.titulo };
      } catch {
        return { erro: "Tarefa não encontrada." };
      }
    }
    case "planejar_dia": {
      const dia = new Date();
      const [raizes, reunioesRow, cfgRow] = await Promise.all([
        prisma.tarefa.findMany({ where: { tarefaPaiId: null }, include: includeTarefaDetalhe }),
        prisma.reuniao.findMany({ where: { dataHora: { not: null } }, select: { id: true, titulo: true, dataHora: true, duracaoMin: true } }),
        prisma.configuracao.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
      ]);
      const cfg: ConfigDTO = {
        expedienteInicioMin: cfgRow.expedienteInicioMin,
        expedienteFimMin: cfgRow.expedienteFimMin,
        almocoInicioMin: cfgRow.almocoInicioMin,
        almocoFimMin: cfgRow.almocoFimMin,
        duracaoPadraoMin: cfgRow.duracaoPadraoMin,
        bufferMin: cfgRow.bufferMin,
      };
      const reunioes: ReuniaoSlim[] = reunioesRow.map((r) => ({
        id: r.id, titulo: r.titulo, dataHora: r.dataHora!.toISOString(), duracaoMin: r.duracaoMin,
      }));
      const todas = flattenFolhas(raizes);
      // blocos já ocupados hoje (tarefas em andamento agendadas para hoje)
      const blocos = todas
        .filter((f) => f.status === "em_andamento" && mesmoDia(f.dataInicio, dia))
        .map((f) => ({ dataInicio: f.dataInicio as string | null, duracaoMin: f.duracaoMin as number | null }));
      // pendentes por prioridade (alta→baixa) e prazo (mais cedo primeiro)
      const ordemPri: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
      const pendentes = todas
        .filter((f) => f.status === "a_fazer")
        .sort((a, b) =>
          (ordemPri[a.prioridade] - ordemPri[b.prioridade]) ||
          (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999"));

      const agendadas: { titulo: string; inicio: string }[] = [];
      for (const f of pendentes) {
        const ocup = ocupadosDoDia(reunioes, blocos, dia, cfg);
        const dur = f.duracaoMin ?? cfg.duracaoPadraoMin;
        const { inicio, estouro } = proximaVaga(dia, ocup, dur, new Date(), cfg);
        if (estouro) break; // dia cheio
        await prisma.tarefa.update({ where: { id: f.id }, data: { status: "em_andamento", dataInicio: new Date(inicio), duracaoMin: dur } });
        blocos.push({ dataInicio: inicio, duracaoMin: dur });
        agendadas.push({ titulo: f.titulo, inicio });
      }
      return { ok: true, agendadas: agendadas.length, restantes: pendentes.length - agendadas.length, itens: agendadas };
    }
    case "concluir_tarefa": {
      const id = str(args.id);
      if (!id) return { erro: "id é obrigatório." };
      try {
        const atual = await prisma.tarefa.findUnique({
          where: { id },
          select: { recorrencia: true, prazo: true, recorrenciaAte: true },
        });
        // Hábitos: tarefa recorrente rola para a próxima ocorrência ao concluir.
        let data: Record<string, unknown> = { status: "concluido", concluidaEm: new Date() };
        if (atual && atual.recorrencia && atual.recorrencia !== "none") {
          const agora = new Date();
          const base = atual.prazo && atual.prazo > agora ? atual.prazo : agora;
          const prox = proximaOcorrencia(base, atual.recorrencia);
          if (!atual.recorrenciaAte || prox <= atual.recorrenciaAte) {
            data = { status: "a_fazer", concluidaEm: null, prazo: prox, dataInicio: null };
          }
        }
        const t = await prisma.tarefa.update({ where: { id }, data });
        return { ok: true, id: t.id, titulo: t.titulo };
      } catch {
        return { erro: "Tarefa não encontrada." };
      }
    }
    case "remover_tarefa": {
      const id = str(args.id);
      if (!id) return { erro: "id é obrigatório." };
      try {
        const t = await prisma.tarefa.delete({ where: { id } });
        return { ok: true, id: t.id, titulo: t.titulo };
      } catch {
        return { erro: "Tarefa não encontrada." };
      }
    }
    default:
      return { erro: `Função desconhecida: ${nome}` };
  }
}

// ---- Orquestração de um turno de conversa ----------------------------------

async function snapshotTarefas(): Promise<string> {
  const tarefas = await prisma.tarefa.findMany({
    where: { tarefaPaiId: null },
    orderBy: [{ status: "asc" }, { prazo: "asc" }],
    take: 100,
    include: { tags: { include: { tag: true } }, tarefas: true },
  });
  if (tarefas.length === 0) return "(nenhuma tarefa cadastrada)";
  return tarefas
    .map((t) => {
      const prazo = t.prazo
        ? t.prazo.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })
        : "sem prazo";
      const tags = t.tags.length ? ` | tags: ${t.tags.map((tt: any) => tt.tag.nome).join(",")}` : "";
      const filhas = t.tarefas.length ? ` | tarefas: ${t.tarefas.length}` : "";
      return `id=${t.id} | [${t.tipo}] ${t.titulo} | ${t.status} | ${t.prioridade} | prazo: ${prazo}${tags}${filhas}`;
    })
    .join("\n");
}

function instrucaoSistema(snapshot: string): string {
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return [
    "Você é o assistente de produtividade do app 'Gestão de Processos'.",
    "Ajuda o usuário a gerenciar atividades e projetos profissionais, com suas tarefas, prazos e cronograma.",
    "Conceitos: Atividade = unidade de trabalho independente. Projeto = conjunto de atividades/tarefas relacionadas.",
    "Tarefa = passo dentro de uma atividade ou projeto. Padrão ao criar: atividade.",
    `Data e hora atuais: ${agora} (fuso America/São_Paulo).`,
    "",
    "ESTADO ATUAL DAS TAREFAS (use estes ids diretamente; só chame listar_tarefas se",
    "precisar de um filtro que não dê para resolver com a lista abaixo):",
    snapshot,
    "",
    "Regras gerais:",
    "- Para responder perguntas sobre tarefas existentes, use a lista acima e responda direto,",
    "  SEM chamar funções.",
    "- Converta datas relativas ('sexta', 'amanhã às 15h') para ISO 8601 com fuso -03:00 a",
    "  partir da data atual.",
    "- Responda sempre em português, de forma breve e objetiva.",
    "- Tags devem ser curtas e em minúsculas (ex.: 'infraestrutura', 'cliente-x', 'urgente').",
    "",
    "Senso crítico antes de criar (IMPORTANTE):",
    "- Quando o pedido for VAGO ou faltar informação essencial, NÃO crie ainda.",
    "  Primeiro faça UMA resposta curta perguntando só o essencial que falta.",
    "- Perguntas obrigatórias para QUALQUER tarefa que envolva data/hora:",
    "    • Se o usuário mencionou data mas NÃO mencionou horário → pergunte o horário.",
    "    • Se o usuário mencionou 'quinta', 'amanhã', etc. mas não especificou a semana → confirme.",
    "    • Se não foi mencionado nenhum prazo → SEMPRE pergunte se há prazo.",
    "- Perguntas adicionais por tipo de demanda:",
    "    • Reunião: com quem? presencial ou remoto (qual local/link)?",
    "    • Projeto: qual o nome/objetivo? há etapas iniciais? qual o prazo de entrega?",
    "    • Relatório/entrega: qual o assunto? para quem? para quando?",
    "- Se uma data for ambígua (ex.: 'quinta' pode ser desta ou da próxima semana), confirme.",
    "- Agrupe as perguntas numa lista curta (no máximo uma rodada). Não faça interrogatório.",
    "- Se o usuário disser 'pode criar assim', 'não sei' ou 'tanto faz', crie com o que",
    "  houver, usando padrões sensatos, e deixe claro o que você assumiu.",
    "- Se o pedido JÁ vier completo com título, prazo e demais detalhes, crie direto.",
    "- Ao criar, coloque informações extras na descrição (participantes, local, links, contexto).",
    "  Ex.: 'Com: João · Local: Google Meet · Remoto'.",
    "- Ao criar tarefas, estime uma duração realista (duracaoMin) quando o usuário não",
    "  informar — necessária para o planejamento do dia.",
    "",
    "Planejamento do dia:",
    "- Quando o usuário pedir para 'planejar/organizar meu dia', chame planejar_dia: ele",
    "  distribui as tarefas pendentes nos horários livres respeitando reuniões e almoço.",
    "- Depois, resuma quantas foram agendadas e quantas ficaram de fora por falta de tempo.",
  ].join("\n");
}

export type TurnoResposta = {
  texto: string;
  acoes: AcaoExecutada[];
};

export async function processarMensagem(
  mensagem: string,
  historico: Content[] = [],
): Promise<TurnoResposta> {
  const snapshot = await snapshotTarefas();
  const model = client().getGenerativeModel({
    model: MODELO,
    systemInstruction: instrucaoSistema(snapshot),
    tools: [{ functionDeclarations: funcoes }],
    generationConfig: { temperature: 0.2 },
  });

  const chat = model.startChat({ history: historico });
  const acoes: AcaoExecutada[] = [];

  try {
    let result = await chat.sendMessage(mensagem);

    for (let i = 0; i < 5; i++) {
      const chamadas = result.response.functionCalls();
      if (!chamadas || chamadas.length === 0) {
        return { texto: result.response.text(), acoes };
      }

      const respostas = [];
      for (const chamada of chamadas) {
        const resultado = await executar(chamada.name, (chamada.args ?? {}) as Args);
        acoes.push({ funcao: chamada.name, resultado });
        respostas.push({
          functionResponse: { name: chamada.name, response: { resultado } },
        });
      }
      result = await chat.sendMessage(respostas);
    }

    return { texto: result.response.text(), acoes };
  } catch (e) {
    if (acoes.length > 0) {
      return { texto: resumoAcoes(acoes), acoes };
    }
    throw e;
  }
}

function resumoAcoes(acoes: AcaoExecutada[]): string {
  const titulo = (r: unknown) =>
    (r && typeof r === "object" && "titulo" in r ? String((r as { titulo: unknown }).titulo) : "tarefa");
  const linhas = acoes
    .filter((a) => a.funcao !== "listar_tarefas")
    .map((a) => {
      switch (a.funcao) {
        case "criar_tarefa": return `Tarefa "${titulo(a.resultado)}" criada.`;
        case "criar_subtarefa": return `Subtarefa "${titulo(a.resultado)}" criada.`;
        case "atualizar_tarefa": return `Tarefa "${titulo(a.resultado)}" atualizada.`;
        case "concluir_tarefa": return `Tarefa "${titulo(a.resultado)}" concluída.`;
        case "remover_tarefa": return `Tarefa "${titulo(a.resultado)}" removida.`;
        default: return null;
      }
    })
    .filter(Boolean);
  return linhas.length ? linhas.join(" ") : "Pronto.";
}
