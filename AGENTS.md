<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Gestão de Processos

App web de gestão de tarefas profissionais via chat em linguagem natural. O usuário conversa
sobre suas atividades e a IA (Gemini, via function calling) interpreta e organiza tarefas,
prazos e lembretes. Escopo e roadmap completos em `ESCOPO.md`.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Prisma 6 + PostgreSQL (Supabase) — fixado na v6 de propósito (v7 exige driver adapters)
- Gemini API (`@google/generative-ai`) com function calling — a IA chama funções reais de CRUD
- Lembretes: Web Notifications API no navegador (MVP só com app aberto)

## Design (premissa)
Inspirar-se em Monday/Jira: sidebar à esquerda, barra de ferramentas no topo, múltiplas visões
com seletor (Kanban + Tabela no MVP; Calendário/Gantt depois), cards arrastáveis no Kanban,
edição inline na Tabela, cor como sinal (pills de status/prioridade), visual limpo e denso.
O chat da IA é um painel integrado ao layout, não uma página isolada.

## Princípios de código (premissa)
Responsabilidade única e boas práticas são premissa, não opcional. Antes de adicionar
funcionalidade, verifique se o arquivo/função alvo ainda tem uma única razão para mudar;
se não, separe primeiro.
- **Domínio puro sem apresentação nem React**: regras/tipos/guards em `src/lib/tarefas.ts`;
  rótulos e cores (apresentação) em `src/lib/tarefas-display.ts`. O domínio não conhece UI.
- **Lógica de dados/estado em hooks, não em componentes**: dados+CRUD da lista em
  `src/lib/useTarefas.ts`; estado+mutações do detalhe em `src/lib/useTarefaDetalhe.ts`.
  Componentes cuidam de renderização e de estado puramente visual (rascunhos de input, popovers).
- **Sem duplicação**: utilitários compartilhados em módulo próprio (ex.: datas em `src/lib/datas.ts`).
  Reutilizar, não copiar.
- **Componentes focados**: um componente grande que mistura várias seções deve ser quebrado
  (ex.: `SubtarefaLinha` separado de `TarefaDetalhe`).
- Garantir zero regressão a cada mudança estrutural: `npx tsc --noEmit` + smoke test no preview.

## Convenções
- Idioma PT-BR; fuso America/São_Paulo; datas exibidas com date-fns + locale ptBR
- Status: `a_fazer` | `em_andamento` | `concluido` ("atrasado" é DERIVADO do prazo, ver `isAtrasada`)
- Prioridade: `baixa` | `media` | `alta` · Recorrência: `none` | `diaria` | `semanal` | `mensal`
- Nível: `operacional` | `tatico` | `estrategico` (label, não hierarquia)
- Domínio compartilhado em `src/lib/tarefas.ts` (regras/tipos/guards) e apresentação em
  `src/lib/tarefas-display.ts` (labels/cores) — reutilizar, não duplicar
- Cliente Prisma singleton em `src/lib/prisma.ts`; cliente HTTP do front em `src/lib/api.ts`

## Estrutura
- `src/app/api/tarefas/` — REST de tarefas (GET/POST e [id] PATCH/DELETE)
- `src/components/` — componentes de UI (client); subpastas por feature (ex.: `tarefa-detalhe/`)
- `src/lib/` — domínio, hooks (`use*.ts`), clientes de API e utilitários
- API valida entrada manualmente e retorna `{ erro }` com status apropriado

## Comandos
- `npm run dev` — servidor de desenvolvimento (porta 3000)
- `npx prisma db push` — sincroniza o schema com o Postgres/Supabase (não usar `migrate dev`)
- `npx prisma studio` — inspecionar o banco
- `npx tsc --noEmit` — checagem de tipos
