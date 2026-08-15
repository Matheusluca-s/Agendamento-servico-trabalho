import Link from "next/link";
import { requireAdmin } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import { NovoFuncionarioForm } from "./novo-funcionario-form";

export default async function FuncionariosPage() {
  await requireAdmin();

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, tipo: true },
    orderBy: { criadoEm: "asc" },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Voltar
        </Link>

        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Funcionários
        </h1>

        <NovoFuncionarioForm />

        <h2 className="mb-3 mt-8 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Cadastrados
        </h2>
        <ul className="flex flex-col gap-2">
          {usuarios.map((usuario) => (
            <li
              key={usuario.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {usuario.nome}
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                {usuario.tipo}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
