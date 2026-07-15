import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Auth.js v5 com Credentials (email+senha). Sessão em JWT — o adapter de banco
// não se aplica a Credentials. A workspace pessoal é resolvida no authorize
// (roda só no Node) e viaja no token; os callbacks jwt/session NÃO tocam o
// banco, para manterem-se baratos (o proxy os avalia a cada requisição).
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const senha = String(creds?.senha ?? "");
        if (!email || !senha) return null;

        const u = await prisma.usuario.findUnique({ where: { email } });
        if (!u) return null;
        const ok = await bcrypt.compare(senha, u.senhaHash);
        if (!ok) return null;

        // Workspace pessoal (a mais antiga) — evita query nos callbacks.
        const membro = await prisma.membro.findFirst({
          where: { usuarioId: u.id },
          orderBy: { criadoEm: "asc" },
        });
        return { id: u.id, name: u.nome, email: u.email, workspaceId: membro?.workspaceId ?? null };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.wid = user.workspaceId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = (token.uid as string | undefined) ?? "";
      session.workspaceId = (token.wid as string | null | undefined) ?? null;
      return session;
    },
  },
});
