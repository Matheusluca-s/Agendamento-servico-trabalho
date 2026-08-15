"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

type Usuario = {
  id: string;
  nome: string;
};

export function LoginForm({ usuarios }: { usuarios: Usuario[] }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="usuarioId"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nome
        </label>
        <select
          id="usuarioId"
          name="usuarioId"
          required
          defaultValue=""
          className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700"
        >
          <option value="" disabled>
            Selecione seu nome
          </option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nome}
            </option>
          ))}
        </select>
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

      {state?.erro && (
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
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
