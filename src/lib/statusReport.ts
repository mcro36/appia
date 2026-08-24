// Domínio do Status Report — tipos, cores (apresentação separada em classes
// Tailwind) e a semente com o conteúdo já salvo. Sem React nem persistência aqui.

export const CORES = ["verde", "amarelo", "azul", "cinza", "vermelho", "nenhum"] as const;
export type Cor = (typeof CORES)[number];

export type ItemStatus = {
  descricao: string;
  sc: string;
  corSc: Cor;
  status: string;
  corStatus: Cor;
  proximoPasso: string;
};
export type ProjetoStatus = { nome: string; itens: ItemStatus[] };
export type StatusDoc = { titulo: string; projetos: ProjetoStatus[] };

export const COR_LABEL: Record<Cor, string> = {
  verde: "Verde", amarelo: "Amarelo", azul: "Azul", cinza: "Cinza", vermelho: "Vermelho", nenhum: "Sem selo",
};

// Classe do selo (pill). "nenhum" = texto simples, sem fundo.
export const COR_SELO: Record<Cor, string> = {
  verde: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  amarelo: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  azul: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  cinza: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  vermelho: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  nenhum: "",
};

// Bolinha de cor (usada no seletor de cor).
export const COR_PONTO: Record<Cor, string> = {
  verde: "bg-emerald-500", amarelo: "bg-amber-500", azul: "bg-blue-500",
  cinza: "bg-zinc-400", vermelho: "bg-red-500", nenhum: "border border-zinc-300 dark:border-zinc-600",
};

export function isCor(v: unknown): v is Cor {
  return typeof v === "string" && (CORES as readonly string[]).includes(v);
}

export function itemVazio(): ItemStatus {
  return { descricao: "", sc: "", corSc: "nenhum", status: "", corStatus: "nenhum", proximoPasso: "" };
}

// Valida/normaliza um documento vindo do localStorage ou de import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizar(bruto: any): StatusDoc {
  const titulo = typeof bruto?.titulo === "string" ? bruto.titulo : "Status dos Projetos";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projetos: ProjetoStatus[] = Array.isArray(bruto?.projetos) ? bruto.projetos.map((p: any) => ({
    nome: typeof p?.nome === "string" ? p.nome : "Projeto",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itens: Array.isArray(p?.itens) ? p.itens.map((it: any) => ({
      descricao: String(it?.descricao ?? ""),
      sc: String(it?.sc ?? ""),
      corSc: isCor(it?.corSc) ? it.corSc : "verde",
      status: String(it?.status ?? ""),
      corStatus: isCor(it?.corStatus) ? it.corStatus : "nenhum",
      proximoPasso: String(it?.proximoPasso ?? ""),
    })) : [],
  })) : [];
  return { titulo, projetos };
}

// Semente: o conteúdo que já estava salvo (Nova pasta/status-fiemg-moove.json),
// usado só na primeira vez (quando não há nada no localStorage).
export const STATUS_SEED: StatusDoc = normalizar({
  titulo: "Status dos Projetos",
  projetos: [
    {
      nome: "Status FIEMG MOOVE",
      itens: [
        { descricao: "Link de internet 1GB - Dupla abordagem - VALENET", sc: "Contrato - 166767", corSc: "verde", status: "Visita técnica dia 24/08", corStatus: "amarelo" },
        { descricao: "Link de internet 1GB - North", sc: "Contrato - 166768", corSc: "verde", status: "Agendamento de Vistita técnica para instalação", corStatus: "amarelo" },
        { descricao: "Fibra apagada - Dupla Abordagem - NORTH", sc: "Contrato - 166763", corSc: "verde", status: "Agendamento de visita técnica para instalação", corStatus: "amarelo" },
        { descricao: "Catracas", sc: "SC.023600.02MG0001", corSc: "azul", status: "envio da minuta do contrato pra assinatura", corStatus: "amarelo" },
        { descricao: "Firewall", sc: "SC.023599.02MG0001", corSc: "azul", status: "Fase de elaboração de contrato SSJ.232062/2026", corStatus: "nenhum" },
        { descricao: "Switchs e APs", sc: "SC.023711.02MG0001", corSc: "azul", status: "Parecer técnico anexado a SC", corStatus: "nenhum" },
        { descricao: "Nobreak", sc: "Aguardando cadastro de material", corSc: "amarelo", status: "Aguardando o código do protheus pra abrir a SC", corStatus: "nenhum" },
        { descricao: "Validação do projeto da ON", sc: "NA", corSc: "cinza", status: "Aguardando proposta da IK eventos e do Dênio", corStatus: "nenhum" },
      ],
    },
    {
      nome: "Call Center",
      itens: [
        { descricao: "Assinatura do contrato", sc: "", corSc: "verde", status: "Pendente devido a questionamentos", corStatus: "amarelo" },
        { descricao: "Parecer técnico da TI referente aos questionamentos", sc: "NA", corSc: "cinza", status: "Concluído", corStatus: "verde" },
        { descricao: "Parecer técnico do Jurídico referente aos questionamentos", sc: "SSJ.226159/2026", corSc: "cinza", status: "Concluído", corStatus: "verde" },
        { descricao: "Parecer da Integridade referente aos questionamentos", sc: "NA", corSc: "cinza", status: "Concluído", corStatus: "verde" },
        { descricao: "Análise do Jurídico dos pareceres e novo parecer sobre ajuste do contrato", sc: "NA", corSc: "cinza", status: "Em andamento", corStatus: "amarelo" },
      ],
    },
    {
      nome: "Projeto de WIFI SEDE",
      itens: [
        { descricao: "Realinhamento sobre o escopo do projeto", sc: "NA", corSc: "cinza", status: "Concuído", corStatus: "verde" },
        { descricao: "TRoubleshooting do Captive Portal", sc: "", corSc: "verde", status: "Concluído", corStatus: "verde" },
        { descricao: "Deploy na Sede", sc: "", corSc: "verde", status: "Concluído", corStatus: "verde" },
        { descricao: "Site Survey e Tunning gratuito nos 03 prédios Sede", sc: "", corSc: "verde", status: "Em andamento com relatório para 26/08", corStatus: "amarelo" },
        { descricao: "Site Survey Pago On site", sc: "", corSc: "verde", status: "pre-agendado pra 08/09. Falta propostas e aprovação", corStatus: "amarelo" },
      ],
    },
    {
      nome: "PROJETO VOIP",
      itens: [
        { descricao: "Análise inicial da divergência de medição dos dois contratos", sc: "", corSc: "verde", status: "Aguardando da Método a resposta da contestação que fizemos", corStatus: "amarelo" },
        { descricao: "Elaboração do escopo e quantitativo pro VOIP AF e RBA", sc: "", corSc: "verde", status: "Concluído", corStatus: "verde" },
        { descricao: "Elaboração do escopo e quantitativo pra contratação/aditivo unidades Algar", sc: "", corSc: "verde", status: "Em andamento", corStatus: "amarelo" },
        { descricao: "Disparo automatizado de ligação para as linhas e ramais para verificar se estão ativos", sc: "", corSc: "verde", status: "Necessário aprovação", corStatus: "amarelo" },
      ],
    },
  ],
});
