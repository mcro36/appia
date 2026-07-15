import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeAdministrar } from "@/lib/contexto";

const PAPEIS = new Set(["admin", "membro", "leitor"]);
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

// POST /api/workspaces/convites — gera um convite (link/token) para a workspace
// ativa. Só owner/admin. Sem envio de email (free tier): o criador compartilha
// o link manualmente.
export async function POST(req: Request) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeAdministrar(ctx.papel))
    return NextResponse.json({ erro: "Sem permissão para convidar." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const papel = typeof body?.papel === "string" && PAPEIS.has(body.papel) ? body.papel : "membro";
  const email =
    typeof body?.email === "string" && body.email.trim() ? body.email.trim().toLowerCase() : null;

  const convite = await prisma.convite.create({
    data: {
      workspaceId: ctx.workspaceId,
      papel,
      email,
      criadoPor: ctx.usuarioId,
      expiraEm: new Date(Date.now() + VALIDADE_MS),
    },
  });

  return NextResponse.json(
    { token: convite.token, papel, caminho: `/convite/${convite.token}`, expiraEm: convite.expiraEm },
    { status: 201 },
  );
}
