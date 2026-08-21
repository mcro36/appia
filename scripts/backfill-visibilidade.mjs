// Backfill da visibilidade por atribuição: preenche Tarefa.rootId (raiz ancestral)
// e Tarefa.criadoPorId (dono do espaço) nos dados existentes. Idempotente.
// Sequencial de propósito (pooler connection_limit=1).
// Rodar QUANDO o banco estiver acessível: node scripts/backfill-visibilidade.mjs
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  // 1. rootId — sobe a cadeia de pais para achar a raiz de cada tarefa.
  const todas = await p.tarefa.findMany({ select: { id: true, tarefaPaiId: true, rootId: true } });
  const byId = new Map(todas.map((t) => [t.id, t]));
  const raizDe = (t) => {
    let cur = t;
    const visto = new Set();
    while (cur.tarefaPaiId && !visto.has(cur.id)) {
      visto.add(cur.id);
      const pai = byId.get(cur.tarefaPaiId);
      if (!pai) break;
      cur = pai;
    }
    return cur.id;
  };
  let nRoot = 0;
  for (const t of todas) {
    const r = raizDe(t);
    if (t.rootId !== r) {
      await p.tarefa.update({ where: { id: t.id }, data: { rootId: r } });
      nRoot++;
    }
  }

  // 2. criadoPorId — atribui ao dono (owner) do espaço de cada tarefa.
  const owners = await p.membro.findMany({ where: { papel: "owner" }, select: { usuarioId: true, workspaceId: true } });
  const ownerDoWs = new Map(owners.map((m) => [m.workspaceId, m.usuarioId]));
  const semCriador = await p.tarefa.findMany({ where: { criadoPorId: null }, select: { id: true, workspaceId: true } });
  let nCriador = 0;
  for (const t of semCriador) {
    const dono = ownerDoWs.get(t.workspaceId);
    if (dono) {
      await p.tarefa.update({ where: { id: t.id }, data: { criadoPorId: dono } });
      nCriador++;
    }
  }

  console.log(JSON.stringify({ total: todas.length, rootIdPreenchidos: nRoot, criadoPorPreenchidos: nCriador }));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
