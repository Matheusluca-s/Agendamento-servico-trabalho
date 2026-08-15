"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { excluirServico, type ExcluirServicoState } from "@/app/actions/servicos";
import { formatDayNumber, formatMonthYear } from "@/app/lib/date-utils";
import {
  corDoTipoServico,
  labelDoStatus,
  labelDoTipoServico,
  nomeDoResponsavel,
} from "@/app/lib/tipo-servico";

export type ServicoLinhaData = {
  id: string;
  local: string;
  data: Date;
  horario: string;
  tipoServico: string;
  status: string;
  responsavel: { nome: string } | null;
};

export function ServicoLinha({ servico }: { servico: ServicoLinhaData }) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, acao, pending] = useActionState<ExcluirServicoState, FormData>(
    excluirServico,
    undefined,
  );

  const cor = corDoTipoServico(servico.tipoServico);
  const concluidoOuCancelado = servico.status === "concluido" || servico.status === "cancelado";

  if (confirmando) {
    return (
      <div className={`rounded-lg border px-3 py-2 ${cor.bg} ${cor.border}`}>
        <form action={acao} className="flex flex-col gap-2">
          <input type="hidden" name="servicoId" value={servico.id} />
          <p className="text-sm text-red-700 dark:text-red-400">
            Excluir {servico.local} permanentemente? Essa ação não pode ser desfeita.
          </p>
          {estado && "erro" in estado && (
            <p role="alert" className="text-xs text-red-700 dark:text-red-400">
              {estado.erro}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="h-9 flex-1 rounded-lg border border-zinc-300 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-9 flex-1 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "Excluindo..." : "Confirmar exclusão"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-lg border px-3 py-2 ${cor.bg} ${cor.border} ${
        concluidoOuCancelado ? "opacity-70" : ""
      }`}
    >
      <Link href={`/servicos/${servico.id}`} className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium text-zinc-900 dark:text-zinc-50 ${
              servico.status === "cancelado" ? "line-through" : ""
            }`}
          >
            {servico.local}
          </p>
          <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
            {formatDayNumber(servico.data)} {formatMonthYear(servico.data).slice(0, 3)} ·{" "}
            {servico.horario}
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
            {nomeDoResponsavel(servico.responsavel)}
          </span>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label={`Excluir ${servico.local}`}
        className="shrink-0 rounded-lg px-2 py-3 text-xs font-medium text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950"
      >
        Excluir
      </button>
    </div>
  );
}
