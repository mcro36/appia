import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/registro — cria conta + workspace pessoal + membership (owner).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";

  if (!nome || !email || !senha)
    return NextResponse.json({ erro: "Nome, email e senha são obrigatórios." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ erro: "Email inválido." }, { status: 400 });
  if (senha.length < 8)
    return NextResponse.json({ erro: "A senha deve ter ao menos 8 caracteres." }, { status: 400 });

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe)
    return NextResponse.json({ erro: "Já existe uma conta com este email." }, { status: 409 });

  const senhaHash = await bcrypt.hash(senha, 10);
  // Transação interativa (sequencial): uma conexão só, compatível com o pooler
  // connection_limit=1. Cria usuário → workspace pessoal → membership owner.
  const usuario = await prisma.$transaction(async (tx) => {
    const u = await tx.usuario.create({ data: { nome, email, senhaHash } });
    const ws = await tx.workspace.create({ data: { nome: `Espaço de ${nome}` } });
    await tx.membro.create({ data: { usuarioId: u.id, workspaceId: ws.id, papel: "owner" } });
    return u;
  });

  return NextResponse.json({ ok: true, id: usuario.id }, { status: 201 });
}
