import type { DefaultSession } from "next-auth";

// Estende a sessão/JWT com o id do usuário e a workspace ativa — resolvidos no
// authorize (Node) e propagados via token, sem consultas nos callbacks (perf).
declare module "next-auth" {
  interface Session {
    workspaceId: string | null;
    user: { id: string } & DefaultSession["user"];
  }
  interface User {
    workspaceId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    wid?: string | null;
  }
}
