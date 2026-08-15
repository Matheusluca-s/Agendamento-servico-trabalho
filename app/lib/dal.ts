import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";

// Checagem "otimista" (só decodifica o cookie assinado) já é feita no proxy.ts
// para toda rota. Esta função faz a checagem "segura" — usada nas páginas e
// Server Actions — e ainda confirma que o usuário continua existindo no banco.
export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  return session;
});

// Data Transfer Object: nunca retorna pinHash nem outros campos sensíveis.
export const getUsuarioAtual = cache(async () => {
  const session = await verifySession();

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { id: true, nome: true, tipo: true },
  });

  if (!usuario) {
    redirect("/login");
  }

  return usuario;
});

// Checagem de autorização "segura": confirma o papel do usuário direto no
// banco (não confia em nenhum dado vindo do cliente). Use no topo de páginas
// e Server Actions restritas a admin — nunca dependa só de esconder o link.
export const requireAdmin = cache(async () => {
  const usuario = await getUsuarioAtual();

  if (usuario.tipo !== "admin") {
    redirect("/");
  }

  return usuario;
});
