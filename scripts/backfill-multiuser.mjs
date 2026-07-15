// Backfill único da Fase A do multiusuário: cria o usuário-dono + workspace
// pessoal e atribui todos os dados órfãos (workspaceId/usuarioId NULL) a ele.
// Idempotente: pode rodar mais de uma vez sem duplicar. Sequencial de propósito
// (pooler connection_limit=1). Rodar com: node scripts/backfill-multiuser.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const EMAIL = "rnleite@fiemg.com.br";
const NOME = "Rodrigo Leite"; // placeholder — editável quando houver perfil

async function main() {
  // 1. Usuário-dono (idempotente). Senha provisória só se for criar agora.
  let owner = await prisma.usuario.findUnique({ where: { email: EMAIL } });
  let senhaProvisoria = null;
  if (!owner) {
    senhaProvisoria = crypto.randomBytes(9).toString("base64url"); // ~12 chars
    const senhaHash = await bcrypt.hash(senhaProvisoria, 10);
    owner = await prisma.usuario.create({ data: { nome: NOME, email: EMAIL, senhaHash } });
  }

  // 2. Workspace pessoal + membership (idempotente).
  let membro = await prisma.membro.findFirst({
    where: { usuarioId: owner.id },
    orderBy: { criadoEm: "asc" },
  });
  let workspaceId;
  if (!membro) {
    const ws = await prisma.workspace.create({ data: { nome: `Espaço de ${NOME}` } });
    await prisma.membro.create({ data: { usuarioId: owner.id, workspaceId: ws.id, papel: "owner" } });
    workspaceId = ws.id;
  } else {
    workspaceId = membro.workspaceId;
  }

  // 3. Backfill dos órfãos (sequencial).
  const tarefas = await prisma.tarefa.updateMany({ where: { workspaceId: null }, data: { workspaceId } });
  const tags = await prisma.tag.updateMany({ where: { workspaceId: null }, data: { workspaceId } });
  const chats = await prisma.mensagemChat.updateMany({ where: { usuarioId: null }, data: { usuarioId: owner.id } });
  const pushes = await prisma.pushSubscription.updateMany({ where: { usuarioId: null }, data: { usuarioId: owner.id } });

  console.log(JSON.stringify({
    ownerId: owner.id,
    workspaceId,
    senhaProvisoria, // null se o usuário já existia
    backfilled: { tarefas: tarefas.count, tags: tags.count, chats: chats.count, pushes: pushes.count },
  }, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
