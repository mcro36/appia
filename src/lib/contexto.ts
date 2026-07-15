import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Camada de acesso (DAL): centraliza a verificação de sessão e devolve o
// contexto de escopo (usuário + workspace ATIVA + papel). Toda rota/consulta
// parte daqui — um `where` esquecido deixa de ser possível quando a origem do
// usuarioId/workspaceId é única.
export type Papel = "owner" | "admin" | "membro" | "leitor";
export type Contexto = { usuarioId: string; workspaceId: string; papel: string };

export const WS_COOKIE = "ws";

// Permissões por papel — usadas nas rotas de escrita/administração.
export const podeEscrever = (papel: string) => papel !== "leitor";
export const podeAdministrar = (papel: string) => papel === "owner" || papel === "admin";

// Para Server Components / Server Actions: redireciona ao /login se não houver
// sessão válida. Memoizado por render (cache do React).
export const exigirContexto = cache(async (): Promise<Contexto> => {
  const ctx = await lerContexto();
  if (!ctx) redirect("/login");
  return ctx;
});

// Para Route Handlers: devolve null em vez de redirecionar, para a rota
// responder 401 explicitamente.
export async function lerContexto(): Promise<Contexto | null> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) return null;

  // Workspace ativa: cookie 'ws' (validado como membership); senão a do token
  // (pessoal); senão a mais antiga. Sempre confirma que o usuário é membro —
  // ninguém acessa uma workspace de que não faz parte, mesmo forjando o cookie.
  const desejada = (await cookies()).get(WS_COOKIE)?.value;
  let membro = desejada
    ? await prisma.membro.findUnique({ where: { usuarioId_workspaceId: { usuarioId, workspaceId: desejada } } })
    : null;
  if (!membro && session.workspaceId) {
    membro = await prisma.membro.findUnique({
      where: { usuarioId_workspaceId: { usuarioId, workspaceId: session.workspaceId } },
    });
  }
  if (!membro) {
    membro = await prisma.membro.findFirst({ where: { usuarioId }, orderBy: { criadoEm: "asc" } });
  }
  if (!membro) return null;

  return { usuarioId, workspaceId: membro.workspaceId, papel: membro.papel };
}
