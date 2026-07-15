import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { lerContexto } from "@/lib/contexto";

// PATCH /api/senha — troca a senha do usuário logado (exige a senha atual).
export async function PATCH(req: Request) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const atual = typeof body?.atual === "string" ? body.atual : "";
  const nova = typeof body?.nova === "string" ? body.nova : "";
  if (!atual || !nova)
    return NextResponse.json({ erro: "Informe a senha atual e a nova." }, { status: 400 });
  if (nova.length < 8)
    return NextResponse.json({ erro: "A nova senha deve ter ao menos 8 caracteres." }, { status: 400 });

  const u = await prisma.usuario.findUnique({ where: { id: ctx.usuarioId } });
  if (!u) return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });

  const ok = await bcrypt.compare(atual, u.senhaHash);
  if (!ok) return NextResponse.json({ erro: "Senha atual incorreta." }, { status: 403 });

  const senhaHash = await bcrypt.hash(nova, 10);
  await prisma.usuario.update({ where: { id: u.id }, data: { senhaHash } });
  return NextResponse.json({ ok: true });
}
