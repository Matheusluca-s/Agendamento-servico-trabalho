"use client";

import { useActionState, useState } from "react";
import { criarServico, type NovoServicoState } from "@/app/actions/servicos";
import { NovoServicoSchema } from "@/app/lib/validation";
import { TIPOS_SERVICO, corDoTipoServico, labelDoTipoServico } from "@/app/lib/tipo-servico";

// Mesmo schema Zod usado no Server Action: aqui só dá feedback rápido antes
// de bater no servidor, que sempre revalida tudo de novo (nunca confia só
// nessa checagem do cliente).
async function acaoComValidacaoLocal(
  prevState: NovoServicoState,
  formData: FormData,
): Promise<NovoServicoState> {
  const parsed = NovoServicoSchema.safeParse({
    local: formData.get("local"),
    endereco: formData.get("endereco"),
    data: formData.get("data"),
    horario: formData.get("horario"),
    tipoServico: formData.get("tipoServico"),
    responsavelId: formData.get("responsavelId"),
    observacoes: formData.get("observacoes"),
  });

  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return criarServico(prevState, formData);
}

const inputClass =
  "h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700";
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function NovoServicoForm({
  usuarios,
  dataInicial,
}: {
  usuarios: { id: string; nome: string }[];
  dataInicial: string;
}) {
  const [state, formAction, pending] = useActionState<NovoServicoState, FormData>(
    acaoComValidacaoLocal,
    undefined,
  );
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="local" className={labelClass}>
          Local
        </label>
        <input
          id="local"
          name="local"
          type="text"
          required
          maxLength={150}
          autoComplete="off"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="endereco" className={labelClass}>
          Endereço (opcional)
        </label>
        <input
          id="endereco"
          name="endereco"
          type="text"
          maxLength={200}
          autoComplete="off"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="data" className={labelClass}>
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={dataInicial}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="horario" className={labelClass}>
            Horário
          </label>
          <input id="horario" name="horario" type="time" required className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Tipo de serviço</span>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_SERVICO.map((tipo) => {
            const cor = corDoTipoServico(tipo);
            const selecionado = tipoSelecionado === tipo;
            return (
              <label
                key={tipo}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-3 ${cor.bg} ${
                  selecionado ? cor.border : "border-transparent"
                }`}
              >
                <input
                  type="radio"
                  name="tipoServico"
                  value={tipo}
                  required
                  checked={selecionado}
                  onChange={() => setTipoSelecionado(tipo)}
                  className="sr-only"
                />
                <span className={`h-3 w-3 shrink-0 rounded-full ${cor.dot}`} />
                <span className={`text-sm font-medium ${cor.text}`}>
                  {labelDoTipoServico(tipo)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="responsavelId" className={labelClass}>
          Funcionário responsável
        </label>
        <select id="responsavelId" name="responsavelId" required className={inputClass}>
          <option value="">Selecione...</option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="observacoes" className={labelClass}>
          Observações (opcional)
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          maxLength={1000}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700"
        />
      </div>

      {state && "erro" in state && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
        >
          {state.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 rounded-lg bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Salvando..." : "Criar serviço"}
      </button>
    </form>
  );
}
