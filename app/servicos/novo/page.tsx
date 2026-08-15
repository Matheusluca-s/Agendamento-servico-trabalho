import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { hojeBrasil, parseDateKey, toDateKey } from "@/app/lib/date-utils";
import { prisma } from "@/app/lib/db";
import { NovoServicoForm } from "./novo-servico-form";

export default async function NovoServicoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  await verifySession();
  const { data } = await searchParams;
  const dataInicial = toDateKey(parseDateKey(data) ?? hojeBrasil());

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Voltar
        </Link>

        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Novo serviço
        </h1>

        <NovoServicoForm usuarios={usuarios} dataInicial={dataInicial} />
      </div>
    </div>
  );
}
