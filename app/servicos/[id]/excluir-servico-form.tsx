"use client";

import { useActionState, useState } from "react";
import { excluirServico, type ExcluirServicoState } from "@/app/actions/servicos";

export function ExcluirServicoForm({
  servicoId,
  local,
}: {
  servicoId: string;
  local: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, acao, pending] = useActionState<ExcluirServicoState, FormData>(
    excluirServico,
    undefined,
  );

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      {estado && "erro" in estado && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
        >
          {estado.erro}
        </p>
      )}

      {confirmando ? (
        <form action={acao} className="flex flex-col gap-3">
          <input type="hidden" name="servicoId" value={servicoId} />
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            Excluir {local} permanentemente? Essa ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="h-12 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-12 flex-1 rounded-lg bg-red-600 text-base font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "Excluindo..." : "Confirmar exclusão"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="h-12 rounded-lg border-2 border-red-300 text-base font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          Excluir serviço
        </button>
      )}
    </div>
  );
}
