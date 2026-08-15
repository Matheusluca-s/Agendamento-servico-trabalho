"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  criarFuncionario,
  type NovoFuncionarioState,
} from "@/app/actions/funcionarios";
import { NovoFuncionarioSchema } from "@/app/lib/validation";

// Mesmo schema Zod usado no Server Action: aqui só dá feedback rápido antes
// de bater no servidor, que sempre revalida tudo de novo (nunca confia só
// nessa checagem do cliente).
async function acaoComValidacaoLocal(
  prevState: NovoFuncionarioState,
  formData: FormData,
): Promise<NovoFuncionarioState> {
  const parsed = NovoFuncionarioSchema.safeParse({
    nome: formData.get("nome"),
    pin: formData.get("pin"),
    pinConfirmacao: formData.get("pinConfirmacao"),
  });

  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return criarFuncionario(prevState, formData);
}

export function NovoFuncionarioForm() {
  const [state, formAction, pending] = useActionState<
    NovoFuncionarioState,
    FormData
  >(acaoComValidacaoLocal, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "sucesso" in state) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="nome"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          maxLength={100}
          autoComplete="off"
          className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="pin"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          minLength={4}
          autoComplete="off"
          required
          placeholder="••••"
          className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-center text-2xl tracking-[0.5em] text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="pinConfirmacao"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Confirmar PIN
        </label>
        <input
          id="pinConfirmacao"
          name="pinConfirmacao"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          minLength={4}
          autoComplete="off"
          required
          placeholder="••••"
          className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-center text-2xl tracking-[0.5em] text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700"
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

      {state && "sucesso" in state && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400"
        >
          Funcionário cadastrado com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 rounded-lg bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Salvando..." : "Cadastrar"}
      </button>
    </form>
  );
}
