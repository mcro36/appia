# Gestão de Processos — Assistente de Produtividade Conversacional

## Visão
Aplicação web que gerencia tarefas profissionais através de **conversa em linguagem natural**.
O usuário descreve o status, adiciona ou remove atividades em um chat, e a IA (Gemini) interpreta,
estrutura, agenda e organiza tudo automaticamente — com lembretes de prazo e visão de cronograma.

**Princípio central:** o usuário descreve, a IA estrutura. Tudo que a IA faz é visível e reversível.

## Decisões do projeto
- **Stack:** Next.js (App Router) + TypeScript, full-stack
- **Banco:** PostgreSQL (Supabase) + Prisma ORM
- **IA:** Gemini API com *function calling*
- **UI:** Tailwind CSS
- **Lembretes:** Web Notifications API (navegador) + scheduler client-side
- **Auth:** single-tenant no MVP; multiusuário (Auth.js) em andamento — ver seção própria

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

Fora do escopo (Futuro): integração Google/Outlook Calendar.

## Multiusuário (autenticação + isolamento) — EM ANDAMENTO
Deixa de ser single-tenant. **Propriedade do dado ancorada em `Workspace`** desde a
Fase A (cada usuário nasce com uma workspace pessoal); na Fase B a mesma workspace
ganha vários membros — sem re-chavear nada. Ver `AGENTS.md`/`CLAUDE.md` para stack.

**Modelo de propriedade**
- `workspaceId`: `Tarefa` (todos os níveis), `Tag`, e via Tarefa: `Reuniao`/`Topico`/`Lembrete`.
- `usuarioId`: `Configuracao` (expediente é pessoal), `MensagemChat` (chat da IA), `PushSubscription`.
- Fase B: `Membro` (usuário↔workspace + papel), `Convite`, `assigneeId` na Tarefa.

**Autenticação:** Auth.js v5 (Credentials email+senha), sessão em **JWT** (sem adapter
de banco). Workspace pessoal resolvida no `authorize` e propagada no token (callbacks
não tocam o banco). No Next 16 o "middleware" é `proxy.ts` (runtime Node) — usado só
para checagem otimista; o isolamento real fica na camada de contexto, junto à fonte.

**Fase A — contas privadas (isolamento funcional)**
- [x] Deps (`next-auth@5`, `bcryptjs`); schema `Usuario`/`Workspace`/`Membro` + FKs.
- [x] Auth.js Credentials + `proxy.ts` (gate) + DAL `src/lib/contexto.ts` + registro + telas login/registro.
- [x] Backfill dos dados existentes para a workspace do dono; FKs agora obrigatórias.
- [x] Escopar 13 rotas + IA (`gemini.ts`) + cron push (agrupado por usuário); guardas de posse em `src/lib/escopo.ts` (anti-IDOR); Tag `@@unique([workspaceId, nome])`; Configuracao por usuário.
- [x] Testes de isolamento entre 2 contas: dados invisíveis entre workspaces; GET/PATCH/DELETE cross-conta → 404.
- [x] UX de sessão: menu de conta (`UserMenu`) com logout + trocar senha (`/api/senha`).
- [x] **Operacional (free tier):** manter `connection_limit=1`. Com Supabase free + Vercel
  serverless, o *transaction pooler* multiplexa a concorrência de muitos clientes sobre
  poucas conexões reais; elevar o limite arriscaria estourar o pool. **Não alterar.**

**Fase B — colaboração (aditiva) — COMPLETA**
- [x] `Convite` (link/token, sem email no free tier); `lerContexto` resolve a workspace
  ATIVA por cookie (validando membership) e retorna o **papel**. Fallback à pessoal (sem regressão).
- [x] APIs: `GET /api/workspaces` (listar), `POST /api/workspaces/ativa` (trocar),
  `POST /api/workspaces/convites` (owner/admin cria), `GET|POST /api/convites/[token]` (prévia/aceite).
- [x] UI: seletor de espaços + "Convidar pessoas" no `UserMenu`; página `/convite/[token]`.
- [x] Verificado: convidado (papel membro) vê os dados da workspace compartilhada; trocar
  para workspace de que não é membro → 403 (cookie forjado não dá acesso).
- [x] `assigneeId` (responsável): DTO + PATCH (valida membership) + `GET /api/workspaces/membros`;
  seletor no detalhe (só em espaço com >1 membro) + avatar no card do Quadro.
- [x] Enforcement do papel `leitor` (read-only) em todas as rotas de escrita + ações da IA.
  Verificado: leitor lê (200), mas criar/editar/tag → 403.
- [x] Filtro por responsável (Todos / Sem responsável / cada membro) no `FiltrosDropdown`
  (só em espaço compartilhado); **workload por pessoa** (`WorkloadDia`): carga planejada
  do dia por responsável, no planejador. Verificado com 2 contas.

**Colaboração avançada — COMPLETA**
- [x] **Gestão de membros** (`GerenciarMembrosModal`): mudar papel / remover, com guardas —
  só owner/admin; owner só por owner; nunca remover o último dono; ao remover, zera as
  atribuições no espaço. `PATCH|DELETE /api/workspaces/membros/[usuarioId]`. Verificado.
- [x] **Comentários + feed de atividade** (`Atividade`): timeline por tarefa unindo
  comentários e eventos (criou/status/responsável), no detalhe (`AtividadeTarefa`).
  `GET|POST /api/tarefas/[id]/atividade`, `DELETE /api/atividade/[id]`. Verificado.
- [x] **Quase-tempo-real**: refetch silencioso da visão ativa ao focar a aba + a cada 25s
  (só com aba visível), pela API escopada. Evita Supabase Realtime (exigiria RLS). Verificado.

**Backlog de colaboração (futuro)**
- [ ] **Onboarding por convite**: link de convite leva a cadastro/login que já aceita o
  convite (sem perder o token); opção de convidar por email existente. Hoje o cadastro
  cria espaço próprio e o aceite exige login antes — gera confusão de "cadastrei e não entrei no time".
- [ ] Recuperar senha ("esqueci") e notificar ao atribuir/mencionar — dependem de provedor de email.

## Visibilidade por atribuição — EM ANDAMENTO (Fase 1)
Substitui o espaço plano (todos veem tudo) por um modelo **assignment-first**: a
atribuição/criação é que dá acesso. Inspirado em Asana "My Tasks" + permissões por item
do Jira. Sem RLS — enforced na camada de escopo em app.

**Regra**
- **Ver** um projeto-raiz R (árvore inteira): se sou dona/admin do espaço de R, **ou** sou
  responsável/criador de **qualquer item** dentro de R.
- **Editar/apagar/concluir** um item T: só se `T.assigneeId = eu` **ou** `T.criadoPorId = eu`
  (ou dono/admin). Os "irmãos" ficam **somente-leitura** (least privilege).
- Comentar segue a **leitura** (quem vê, comenta). Roll-up de status do pai é **efeito de
  sistema** (roda no servidor, fora do guard de escrita).

**Dados:** `Tarefa.rootId` (raiz ancestral — visibilidade plana e indexável, sem CTE
recursiva no free tier) e `Tarefa.criadoPorId` (autor). Índices em rootId/assigneeId/criadoPorId.

**Código:** módulo único `src/lib/visibilidade.ts` — `rootsVisiveis(ctx)`,
`tarefaVisivel(id,ctx)` (leitura), `tarefaEditavel(id,ctx)` (escrita). Todas as rotas de
leitura/escrita + IA (gemini) + métricas/workload derivam desse predicado.

**UI:** telas atuais mostram menos projetos (sem poda de árvore); itens visíveis-não-editáveis
em modo somente-leitura (sem status/lixeira/drag) + cadeadinho; selo "de X" e avatares no
card do projeto; empty states.

**Fase 2 (futuro):** home agregada cross-workspace ("Atribuídos a mim") + atribuir a qualquer
usuário — o mesmo predicado já é cross-workspace.

**Migração:** `rootId`/`criadoPorId` nullable + backfill; schema e código sobem **juntos**
para o `master` (lição do deploy anterior).

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
