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
- Prisma 6 + SQLite (`prisma/dev.db`) — fixado na v6 de propósito (v7 exige driver adapters)
- Gemini API (`@google/generative-ai`) com function calling — a IA chama funções reais de CRUD
- Lembretes: Web Notifications API no navegador (MVP só com app aberto)

## Design (premissa)
Inspirar-se em Monday/Jira: sidebar à esquerda, barra de ferramentas no topo, múltiplas visões
com seletor (Kanban + Tabela no MVP; Calendário/Gantt depois), cards arrastáveis no Kanban,
edição inline na Tabela, cor como sinal (pills de status/prioridade), visual limpo e denso.
O chat da IA é um painel integrado ao layout, não uma página isolada.

## Convenções
- Idioma PT-BR; fuso America/São_Paulo; datas exibidas com date-fns + locale ptBR
- Status: `a_fazer` | `em_andamento` | `concluido` ("atrasado" é DERIVADO do prazo, ver `isAtrasada`)
- Prioridade: `baixa` | `media` | `alta` · Recorrência: `none` | `diaria` | `semanal` | `mensal`
- Domínio compartilhado (constantes/labels/guards) em `src/lib/tarefas.ts` — reutilizar, não duplicar
- Cliente Prisma singleton em `src/lib/prisma.ts`; cliente HTTP do front em `src/lib/api.ts`

## Estrutura
- `src/app/api/tarefas/` — REST de tarefas (GET/POST e [id] PATCH/DELETE)
- `src/components/` — componentes de UI (client)
- API valida entrada manualmente e retorna `{ erro }` com status apropriado

## Comandos
- `npm run dev` — servidor de desenvolvimento (porta 3000)
- `npx prisma migrate dev --name <nome>` — nova migration
- `npx prisma studio` — inspecionar o banco
- `npx tsc --noEmit` — checagem de tipos
