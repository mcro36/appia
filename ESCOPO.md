# Gestão de Processos — Assistente de Produtividade Conversacional

## Visão
Aplicação web que gerencia tarefas profissionais através de **conversa em linguagem natural**.
O usuário descreve o status, adiciona ou remove atividades em um chat, e a IA (Gemini) interpreta,
estrutura, agenda e organiza tudo automaticamente — com lembretes de prazo e visão de cronograma.

**Princípio central:** o usuário descreve, a IA estrutura. Tudo que a IA faz é visível e reversível.

## Decisões do projeto
- **Stack:** Next.js (App Router) + TypeScript, full-stack
- **Banco:** SQLite + Prisma ORM (local, single-user no MVP)
- **IA:** Gemini API com *function calling*
- **UI:** Tailwind CSS + shadcn/ui
- **Lembretes:** Web Notifications API (navegador) + scheduler client-side
- **Escopo MVP:** uso local, apenas o próprio usuário, sem login complexo

## Funcionalidades

### MVP
1. **Chat com IA** — interpreta intenção (criar / atualizar / remover / consultar)
2. **CRUD de tarefas via IA** — extrai título, prazo, prioridade, status e grava no banco
3. **Lista/quadro de tarefas** — visão estruturada e editável manualmente
4. **Agenda/calendário** — tarefas distribuídas por data
5. **Lembretes de prazo** — notificação no navegador antes do vencimento
6. **Status e histórico** — a fazer / em andamento / concluído / atrasado

### Fase 2
- Subtarefas e dependências
- Sugestões proativas da IA
- Resumo diário/semanal gerado pela IA
- Tags/projetos para agrupar
- Busca conversacional

### Futuro
- Integração Google Calendar / e-mail
- PWA / mobile
- Anexos e notas por tarefa
- Multiusuário (autenticação + isolamento de dados)

## Planejador diário (time-blocking) — IMPLEMENTADO
Visão "Dia" inspirada em Sunsama/Motion: planejar o dia distribuindo as tarefas
pendentes em blocos de horário, em volta dos compromissos fixos (reuniões).
Unidade agendável = tarefa-folha (atividade simples ou subtarefa sem filhos).
O "dia" de uma tarefa é a data do seu `dataInicio` (sem campo extra).

- **Fase 1** — Visão Dia (4ª no seletor) com barra `Geral | << | Hoje | >>`,
  3 colunas escopadas ao dia (a fazer agrupado por projeto / em andamento /
  concluído), carry-over de incompletas e snooze ("adiar para amanhã").
- **Fase 2** — Distribuição automática (`agenda.ts` `proximaVaga`) ao soltar em
  "em andamento": encaixa nos buracos entre reuniões e almoço, no expediente,
  começando de "agora" se hoje. Modelo `Configuracao` (expediente/almoço/duração
  padrão/buffer) editável; indicador de capacidade "planejado/livre".
- **Fase 3** — Timeline visual do dia (`AgendaDia`): reuniões + blocos de tarefa,
  almoço sombreado; arrastar bloco reagenda (snap 5min).
- **Fase 4** — `concluidaEm` (Concluído-do-dia confiável); IA `planejar_dia`
  (function calling) + botão determinístico "Planejar dia"; ritual "Encerrar o
  dia"; duração estimada pela IA ao criar.
- **Fase 5** — Cronômetro de foco + `tempoGastoMin` (real vs estimado); hábitos:
  concluir tarefa recorrente rola para a próxima ocorrência.
- **Fase 6** — Painel de métricas + matriz de Eisenhower; visão Semana; prazo
  rígido vs flexível (`prazoRigido`, prioriza no planejamento).

Fora do escopo (Futuro): integração Google/Outlook Calendar e multiusuário.

## Design / experiência (premissa)
A aplicação se inspira em **Monday, Jira e ferramentas similares** de gestão de trabalho:
- Sidebar de navegação à esquerda + barra de ferramentas no topo
- Múltiplas visões dos mesmos dados com seletor de visão (MVP: **Quadro Kanban + Tabela +
  Calendário** com visões mês/semana/dia; futuro: Linha do tempo/Gantt)
- Kanban com colunas por status e cards arrastáveis entre colunas
- Tabela/grid com edição inline
- Uso forte de cor como sinal (pills de status e prioridade), visual limpo e denso
- Painel de chat da IA integrado ao layout (não uma página isolada)

## Convenções / padrões
- Idioma: PT-BR · Fuso: America/São_Paulo · Data: DD/MM/AAAA
- Modelo Gemini: `gemini-2.5-flash` (a chave do usuário está sem quota no 2.0-flash)
- Status: a fazer / em andamento / concluído ("atrasado" é derivado do prazo)
- Prioridade: baixa / média / alta
- Chat: a IA recebe as últimas mensagens como contexto

## Modelo de dados inicial
- **Tarefa**: id, título, descrição, prazo, prioridade, status, criada_em, atualizada_em,
  projeto_id, recorrencia (none/diaria/semanal/mensal), recorrencia_ate
- **Projeto/Categoria**: id, nome, cor
- **Lembrete**: id, tarefa_id, disparar_em, enviado
- **Mensagem de chat**: id, papel (user/ia), conteúdo, timestamp, ação_executada

## Lembretes (MVP)
- Apenas notificação no navegador (dispara com app/aba aberto) + painel de alertas no app.
- Recorrência **prevista no modelo de dados desde o início**; lógica de geração de
  ocorrências entra na Fase 2. Campo já nasce no schema para evitar migration futura.

## Arquitetura — pontos-chave
- A IA retorna **ações estruturadas** via function calling, não apenas texto.
- O backend (API routes) executa as funções de verdade contra o banco.
- O frontend mostra o resultado estruturado para conferência/correção pelo usuário.

## Riscos
- Custo e latência da API Gemini (cada mensagem = uma chamada)
- Confiabilidade da extração (mitigado por confirmação visual)
- Entrega de lembretes (navegador precisa estar aberto no MVP)

## Roadmap de construção
1. Scaffold do projeto Next.js + Tailwind + Prisma + SQLite
2. Modelo de dados (schema Prisma) e migrations
3. Tela de tarefas (CRUD manual) — base estável antes da IA
4. Integração Gemini com function calling
5. Chat conectado às funções de tarefas
6. Calendário/agenda
7. Lembretes + notificações no navegador
8. Polimento de UI e histórico de chat
