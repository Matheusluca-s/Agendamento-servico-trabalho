import Link from "next/link";
import { formatDiaCompleto, formatWeekRangeLabel, toDateKey } from "@/app/lib/date-utils";
import { ServicoCard } from "./servico-card";
import type { ServicoDoDia } from "./types";

export function WeekView({
  dias,
  hoje,
  porDia,
  hrefAnterior,
  hrefSeguinte,
  hrefHoje,
}: {
  dias: Date[];
  hoje: Date;
  porDia: Map<string, ServicoDoDia[]>;
  hrefAnterior: string;
  hrefSeguinte: string;
  hrefHoje: string;
}) {
  const hojeKey = toDateKey(hoje);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={hrefAnterior}
          aria-label="Semana anterior"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ‹
        </Link>
        <Link
          href={hrefHoje}
          className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
        >
          {formatWeekRangeLabel(dias)}
        </Link>
        <Link
          href={hrefSeguinte}
          aria-label="Próxima semana"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ›
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {dias.map((dia) => {
          const key = toDateKey(dia);
          const servicos = porDia.get(key) ?? [];
          const ehHoje = key === hojeKey;

          return (
            <div
              key={key}
              className={`rounded-xl border p-3 ${
                ehHoje
                  ? "border-zinc-900 bg-white dark:border-zinc-50 dark:bg-zinc-950"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    ehHoje
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {formatDiaCompleto(dia)}
                </span>
                {ehHoje && (
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white dark:bg-zinc-50 dark:text-zinc-900">
                    Hoje
                  </span>
                )}
              </div>

              {servicos.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-600">
                  Nenhum serviço
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
        })}
      </div>
    </div>
  );
}
