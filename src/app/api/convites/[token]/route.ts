import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, WS_COOKIE } from "@/lib/contexto";

type Ctx = { params: Promise<{ token: string }> };

// GET /api/convites/:token — prévia do convite (nome da workspace, papel).
export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const c = await prisma.convite.findUnique({
    where: { token },
    include: { workspace: { select: { nome: true } } },
  });
  if (!c || c.aceitoEm || c.expiraEm <= new Date())
    return NextResponse.json({ valido: false }, { status: 404 });
  return NextResponse.json({ valido: true, workspaceNome: c.workspace.nome, papel: c.papel });
}

// POST /api/convites/:token — aceita o convite: cria a membership (idempotente)
// e ativa a workspace. Exige estar logado.
export async function POST(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { token } = await params;
  const c = await prisma.convite.findUnique({ where: { token } });
  if (!c || c.aceitoEm || c.expiraEm <= new Date())
    return NextResponse.json({ erro: "Convite inválido ou expirado." }, { status: 404 });

  const jaMembro = await prisma.membro.findUnique({
    where: { usuarioId_workspaceId: { usuarioId: ctx.usuarioId, workspaceId: c.workspaceId } },
  });
  if (!jaMembro) {
    await prisma.membro.create({
      data: { usuarioId: ctx.usuarioId, workspaceId: c.workspaceId, papel: c.papel },
    });
  }
  await prisma.convite.update({ where: { token }, data: { aceitoEm: new Date() } });

  // Já entra na workspace recém-aceita.
  const res = NextResponse.json({ ok: true, workspaceId: c.workspaceId });
  res.cookies.set(WS_COOKIE, c.workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
