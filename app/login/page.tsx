import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";
import { LoginForm } from "./login-form";

// Consulta o banco pra listar os usuários — não pode ser renderizada
// estaticamente no build (variáveis de ambiente de runtime, como
// DATABASE_URL, ainda não estão disponíveis nesse momento).
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Climar
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Entre com seu nome e PIN para continuar
        </p>
        <LoginForm usuarios={usuarios} />
      </div>
    </div>
  );
}
