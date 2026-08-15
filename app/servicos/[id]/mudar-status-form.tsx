"use client";

import { useActionState, useState } from "react";
import { mudarStatusServico, type MudarStatusState } from "@/app/actions/servicos";

// "em_andamento" era uma etapa intermediária do fluxo antigo — não é mais
// oferecida como destino, mas fica aqui pra serviços antigos com esse
// status ainda poderem ser concluídos ou cancelados normalmente.
const TRANSICOES: Record<string, readonly string[]> = {
  agendado: ["concluido", "cancelado"],
  em_andamento: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
};

const BOTAO_ESTILO: Record<string, string> = {
  concluido: "bg-emerald-600 text-white hover:bg-emerald-700",
  cancelado:
    "border-2 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950",
};

const BOTAO_LABEL: Record<string, string> = {
  concluido: "Concluir serviço",
  cancelado: "Cancelar serviço",
};

const CONFIRMAR_LABEL: Record<string, string> = {
  concluido: "Confirmar conclusão",
  cancelado: "Confirmar cancelamento",
};

export function MudarStatusForm({
  servicoId,
  statusAtual,
}: {
  servicoId: string;
  statusAtual: string;
}) {
  const [state, formAction, pending] = useActionState<MudarStatusState, FormData>(
    mudarStatusServico,
    undefined,
  );
  const [statusSelecionado, setStatusSelecionado] = useState<string | null>(null);

  const opcoes = TRANSICOES[statusAtual] ?? [];

  if (opcoes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Atualizar status
      </h2>

      {state && "erro" in state && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
        >
          {state.erro}
        </p>
      )}

      {statusSelecionado ? (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="servicoId" value={servicoId} />
          <input type="hidden" name="novoStatus" value={statusSelecionado} />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="observacoes"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Observações (opcional)
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={4}
              maxLength={500}
              inputMode="text"
              placeholder="O que foi feito, pendências, detalhes do local..."
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatusSelecionado(null)}
              className="h-12 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`h-12 flex-1 rounded-lg text-base font-medium transition-colors disabled:opacity-60 ${BOTAO_ESTILO[statusSelecionado]}`}
            >
              {pending ? "Salvando..." : CONFIRMAR_LABEL[statusSelecionado]}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          {opcoes.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusSelecionado(status)}
              className={`h-12 rounded-lg text-base font-medium transition-colors ${BOTAO_ESTILO[status]}`}
            >
              {BOTAO_LABEL[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
