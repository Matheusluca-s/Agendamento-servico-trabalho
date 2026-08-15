import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE_NAME } from "@/app/lib/session";

// Checagem "otimista": só decodifica o cookie assinado, sem bater no banco.
// Roda em toda rota (exceto assets estáticos, via matcher abaixo) e garante
// que nenhuma página além do login é servida sem sessão válida. As Server
// Actions/páginas ainda fazem a checagem "segura" via app/lib/dal.ts.
const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);

  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicPath && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.svg$|.*\\.png$).*)",
  ],
};
