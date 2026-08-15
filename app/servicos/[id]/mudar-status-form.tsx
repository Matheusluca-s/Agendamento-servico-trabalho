"use client";

import { useActionState, useState } from "react";
import { mudarStatusServico, type MudarStatusState } from "@/app/actions/servicos";

const TRANSICOES: Record<string, readonly string[]> = {
  agendado: ["em_andamento", "cancelado"],
  em_andamento: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
};

const BOTAO_ESTILO: Record<string, string> = {
  em_andamento: "bg-amber-600 text-white hover:bg-amber-700",
  concluido: "bg-emerald-600 text-white hover:bg-emerald-700",
  cancelado:
    "border-2 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950",
};

const BOTAO_LABEL: Record<string, string> = {
  em_andamento: "Iniciar atendimento",
  concluido: "Marcar como concluído",
  cancelado: "Cancelar serviço",
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
  const [mostrarConclusao, setMostrarConclusao] = useState(false);

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

      {mostrarConclusao ? (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="servicoId" value={servicoId} />
          <input type="hidden" name="novoStatus" value="concluido" />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="observacoesFinais"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Observações finais (opcional)
            </label>
            <textarea
              id="observacoesFinais"
              name="observacoesFinais"
              rows={3}
              maxLength={1000}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMostrarConclusao(false)}
              className="h-12 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-12 flex-1 rounded-lg bg-emerald-600 text-base font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? "Salvando..." : "Confirmar conclusão"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          {opcoes.map((status) =>
            status === "concluido" ? (
              <button
                key={status}
                type="button"
                onClick={() => setMostrarConclusao(true)}
                className={`h-12 rounded-lg text-base font-medium transition-colors ${BOTAO_ESTILO[status]}`}
              >
                {BOTAO_LABEL[status]}
              </button>
            ) : (
              <form key={status} action={formAction}>
                <input type="hidden" name="servicoId" value={servicoId} />
                <input type="hidden" name="novoStatus" value={status} />
                <button
                  type="submit"
                  disabled={pending}
                  className={`h-12 w-full rounded-lg text-base font-medium transition-colors disabled:opacity-60 ${BOTAO_ESTILO[status]}`}
                >
                  {pending ? "Salvando..." : BOTAO_LABEL[status]}
                </button>
              </form>
            ),
          )}
        </div>
      )}
    </div>
  );
}
