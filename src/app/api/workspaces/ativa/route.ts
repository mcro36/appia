import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, WS_COOKIE } from "@/lib/contexto";

// POST /api/workspaces/ativa — troca a workspace ativa (cookie). Só permite
// workspaces das quais o usuário é membro.
export async function POST(req: Request) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) return NextResponse.json({ erro: "workspaceId obrigatório." }, { status: 400 });

  const membro = await prisma.membro.findUnique({
    where: { usuarioId_workspaceId: { usuarioId: ctx.usuarioId, workspaceId } },
  });
  if (!membro) return NextResponse.json({ erro: "Você não faz parte desta workspace." }, { status: 403 });

  const res = NextResponse.json({ ok: true, ativa: workspaceId });
  res.cookies.set(WS_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
