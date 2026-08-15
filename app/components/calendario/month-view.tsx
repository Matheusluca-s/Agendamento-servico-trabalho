import Link from "next/link";
import {
  formatDayNumber,
  formatMonthYear,
  formatWeekdayShort,
  getWeekDays,
  toDateKey,
} from "@/app/lib/date-utils";
import type { ServicoDoDia } from "./types";
import { DiaDetalhado } from "./dia-detalhado";

export function MonthView({
  dias,
  mesReferencia,
  hoje,
  porDia,
  diaSelecionadoKey,
  hrefAnterior,
  hrefSeguinte,
  hrefHoje,
  hrefFecharDia,
  buildHrefDia,
}: {
  dias: Date[];
  mesReferencia: Date;
  hoje: Date;
  porDia: Map<string, ServicoDoDia[]>;
  diaSelecionadoKey: string | null;
  hrefAnterior: string;
  hrefSeguinte: string;
  hrefHoje: string;
  hrefFecharDia: string;
  buildHrefDia: (key: string) => string;
}) {
  const hojeKey = toDateKey(hoje);
  const mesAtual = mesReferencia.getUTCMonth();
  const nomesDiasSemana = getWeekDays(hoje).map(formatWeekdayShort);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={hrefAnterior}
          aria-label="Mês anterior"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ‹
        </Link>
        <Link
          href={hrefHoje}
          className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
        >
          {formatMonthYear(mesReferencia)}
        </Link>
        <Link
          href={hrefSeguinte}
          aria-label="Próximo mês"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-zinc-400 dark:text-zinc-600">
        {nomesDiasSemana.map((nome, i) => (
          <span key={i}>{nome}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia) => {
          const key = toDateKey(dia);
          const servicos = porDia.get(key) ?? [];
          const ehHoje = key === hojeKey;
          const ehMesAtual = dia.getUTCMonth() === mesAtual;
          const ehSelecionado = key === diaSelecionadoKey;

          return (
            <Link
              key={key}
              href={buildHrefDia(key)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-sm ${
                ehSelecionado
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : ehHoje
                    ? "border-zinc-900 bg-white text-zinc-900 dark:border-zinc-50 dark:bg-zinc-950 dark:text-zinc-50"
                    : "border-transparent bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              } ${!ehMesAtual ? "opacity-35" : ""}`}
            >
              <span className="font-medium tabular-nums">{formatDayNumber(dia)}</span>
              {servicos.length > 0 && (
                <span
                  className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${
                    ehSelecionado
                      ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                      : "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  }`}
                >
                  {servicos.length}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {diaSelecionadoKey && (
        <DiaDetalhado
          diaKey={diaSelecionadoKey}
          servicos={porDia.get(diaSelecionadoKey) ?? []}
          hrefFechar={hrefFecharDia}
        />
      )}
    </div>
  );
}
