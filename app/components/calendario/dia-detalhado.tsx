import Link from "next/link";
import { formatDiaCompleto, parseDateKey } from "@/app/lib/date-utils";
import { ServicoCard } from "./servico-card";
import type { ServicoDoDia } from "./types";

export function DiaDetalhado({
  diaKey,
  servicos,
  hrefFechar,
}: {
  diaKey: string;
  servicos: ServicoDoDia[];
  hrefFechar: string;
}) {
  const dia = parseDateKey(diaKey);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {dia ? formatDiaCompleto(dia) : diaKey}
        </h2>
        <Link
          href={hrefFechar}
          aria-label="Fechar detalhes do dia"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          ×
        </Link>
      </div>

      {servicos.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          Nenhum serviço nesse dia
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {servicos.map((servico) => (
            <ServicoCard key={servico.id} servico={servico} />
          ))}
        </div>
      )}
    </div>
  );
}
