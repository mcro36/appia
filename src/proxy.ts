import { auth } from "@/auth";

// Proxy (antigo "middleware" — renomeado no Next 16). Checagem OTIMISTA apenas:
// lê a sessão do cookie/JWT e redireciona. A autorização real e o isolamento de
// dados ficam nas rotas via a camada de contexto (não confie só nisto).
export default auth((req) => {
  const logado = !!req.auth?.user;
  const { pathname } = req.nextUrl;
  const publica = pathname === "/login" || pathname === "/registro";

  if (!logado && !publica) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
  if (logado && publica) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

// Não roda em APIs (elas se protegem com 401 via contexto), assets estáticos,
// nem arquivos do PWA (manifest/service worker/ícones).
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|manifest.webmanifest|sw.js|workbox-.*|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
