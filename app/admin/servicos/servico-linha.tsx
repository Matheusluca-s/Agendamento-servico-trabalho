import Link from "next/link";
import { formatDayNumber, formatMonthYear } from "@/app/lib/date-utils";
import { corDoTipoServico, labelDoStatus, labelDoTipoServico } from "@/app/lib/tipo-servico";

export type ServicoLinhaData = {
  id: string;
  local: string;
  data: Date;
  horario: string;
  tipoServico: string;
  status: string;
  responsavel: { nome: string };
};

export function ServicoLinha({ servico }: { servico: ServicoLinhaData }) {
  const cor = corDoTipoServico(servico.tipoServico);
  const concluidoOuCancelado = servico.status === "concluido" || servico.status === "cancelado";

  return (
    <Link
      href={`/servicos/${servico.id}`}
      className={`block rounded-lg border px-3 py-2 ${cor.bg} ${cor.border} ${
        concluidoOuCancelado ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-sm font-medium text-zinc-900 dark:text-zinc-50 ${
            servico.status === "cancelado" ? "line-through" : ""
          }`}
        >
          {servico.local}
        </p>
        <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatDayNumber(servico.data)} {formatMonthYear(servico.data).slice(0, 3)} · {servico.horario}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`text-xs font-medium ${cor.text}`}>
          {labelDoTipoServico(servico.tipoServico)}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {labelDoStatus(servico.status)}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {servico.responsavel.nome}
        </span>
      </div>
    </Link>
  );
}
