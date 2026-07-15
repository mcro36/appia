"use client";

import { SessionProvider } from "next-auth/react";

// Provê a sessão do Auth.js aos componentes client (useSession).
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
