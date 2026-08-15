import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import { LegendaTipoServico } from "@/app/components/calendario/legenda";
import { MonthView } from "@/app/components/calendario/month-view";
import { ToggleVisao } from "@/app/components/calendario/toggle-visao";
import type { ServicoDoDia } from "@/app/components/calendario/types";
import { WeekView } from "@/app/components/calendario/week-view";
import {
  addDays,
  addMonths,
  getMonthGrid,
  getWeekDays,
  hojeBrasil,
  parseDateKey,
  startOfMonth,
  toDateKey,
} from "@/app/lib/date-utils";
import { getUsuarioAtual } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";

const SELECT_SERVICO = {
  id: true,
  local: true,
  horario: true,
  tipoServico: true,
  status: true,
  data: true,
  responsavel: { select: { nome: true } },
} as const;

// Depende de sessão e consulta o banco — não pode ser renderizada
// estaticamente no build (variáveis de ambiente de runtime, como
// DATABASE_URL, ainda não estão disponíveis nesse momento).
export const dynamic = "force-dynamic";

function buildHref(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  const query = usp.toString();
  return query ? `/?${query}` : "/";
}

function agruparPorDia(servicos: ServicoDoDia[]): Map<string, ServicoDoDia[]> {
  const mapa = new Map<string, ServicoDoDia[]>();
  for (const servico of servicos) {
    const key = toDateKey(servico.data);
    const lista = mapa.get(key);
    if (lista) {
      lista.push(servico);
    } else {
      mapa.set(key, [servico]);
    }
  }
  return mapa;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; data?: string; dia?: string }>;
}) {
  const usuario = await getUsuarioAtual();
  const { view: viewParam, data: dataParam, dia: diaParam } = await searchParams;

  const visao: "semana" | "mes" = viewParam === "mes" ? "mes" : "semana";
  const hoje = hojeBrasil();
  const anchor = parseDateKey(dataParam) ?? hoje;
  const diaSelecionadoKey =
    visao === "mes" && parseDateKey(diaParam) ? (diaParam as string) : null;

  let conteudo: ReactNode;

  if (visao === "semana") {
    const dias = getWeekDays(anchor);
    const inicio = dias[0];
    const fim = addDays(inicio, 7);

    const servicos = await prisma.servico.findMany({
      where: { data: { gte: inicio, lt: fim } },
      select: SELECT_SERVICO,
      orderBy: [{ data: "asc" }, { horario: "asc" }],
    });

    conteudo = (
      <WeekView
        dias={dias}
        hoje={hoje}
        porDia={agruparPorDia(servicos)}
        hrefAnterior={buildHref({ view: "semana", data: toDateKey(addDays(inicio, -7)) })}
        hrefSeguinte={buildHref({ view: "semana", data: toDateKey(addDays(inicio, 7)) })}
        hrefHoje={buildHref({ view: "semana", data: toDateKey(hoje) })}
      />
    );
  } else {
    const mesReferencia = startOfMonth(anchor);
    const mesAnchorKey = toDateKey(mesReferencia);
    const dias = getMonthGrid(mesReferencia);
    const inicio = dias[0];
    const fim = addDays(inicio, 42);

    const servicos = await prisma.servico.findMany({
      where: { data: { gte: inicio, lt: fim } },
      select: SELECT_SERVICO,
      orderBy: [{ data: "asc" }, { horario: "asc" }],
    });

    conteudo = (
      <MonthView
        dias={dias}
        mesReferencia={mesReferencia}
        hoje={hoje}
        porDia={agruparPorDia(servicos)}
        diaSelecionadoKey={diaSelecionadoKey}
        hrefAnterior={buildHref({
          view: "mes",
          data: toDateKey(addMonths(mesReferencia, -1)),
        })}
        hrefSeguinte={buildHref({
          view: "mes",
          data: toDateKey(addMonths(mesReferencia, 1)),
        })}
        hrefHoje={buildHref({ view: "mes", data: toDateKey(startOfMonth(hoje)) })}
        hrefFecharDia={buildHref({ view: "mes", data: mesAnchorKey })}
        buildHrefDia={(key) => buildHref({ view: "mes", data: mesAnchorKey, dia: key })}
      />
    );
  }

  const referenciaParaSemana = diaSelecionadoKey
    ? (parseDateKey(diaSelecionadoKey) ?? anchor)
    : anchor;
  const hrefSemanaToggle = buildHref({
    view: "semana",
    data: toDateKey(referenciaParaSemana),
  });
  const hrefMesToggle = buildHref({ view: "mes", data: toDateKey(startOfMonth(anchor)) });
  const dataParaNovoServico = diaSelecionadoKey ?? toDateKey(anchor);
  const hrefNovoServico = `/servicos/novo?data=${dataParaNovoServico}`;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Climar</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {usuario.nome} · {usuario.tipo === "admin" ? "admin" : "funcionário"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {usuario.tipo === "admin" && (
            <Link
              href="/admin"
              className="flex h-9 items-center rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Admin
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="flex h-9 items-center rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4 pb-24">
        <ToggleVisao visao={visao} hrefSemana={hrefSemanaToggle} hrefMes={hrefMesToggle} />
        <LegendaTipoServico />
        {conteudo}
      </main>

      <Link
        href={hrefNovoServico}
        aria-label="Novo serviço"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        +
      </Link>
    </div>
  );
}
