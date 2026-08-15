"use client";

import { useActionState, useState } from "react";
import {
  alternarAtivoFuncionario,
  editarFuncionario,
  excluirFuncionario,
  resetarPinFuncionario,
  type AlternarAtivoState,
  type EditarFuncionarioState,
  type ExcluirFuncionarioState,
  type ResetarPinState,
} from "@/app/actions/funcionarios";

type Usuario = {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
};

type Modo = "visualizar" | "editar-nome" | "resetar-pin" | "excluir";

const inputClass =
  "h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700";
const botaoSecundario =
  "h-10 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";
const botaoPrimario =
  "h-10 flex-1 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";

export function FuncionarioRow({
  usuario,
  usuarioAtualId,
}: {
  usuario: Usuario;
  usuarioAtualId: string;
}) {
  const [modo, setModo] = useState<Modo>("visualizar");
  const ehContaLogada = usuario.id === usuarioAtualId;

  // Volta pro modo "visualizar" assim que a action retorna sucesso — o
  // efeito colateral acontece no próprio encadeamento async do dispatch,
  // não num useEffect (evita o re-render em cascata) nem numa ref lida
  // durante a renderização.
  const [estadoEdicao, acaoEdicao, pendingEdicao] = useActionState<
    EditarFuncionarioState,
    FormData
  >(async (prevState, formData) => {
    const resultado = await editarFuncionario(prevState, formData);
    if (resultado && "sucesso" in resultado) setModo("visualizar");
    return resultado;
  }, undefined);
  const [estadoPin, acaoPin, pendingPin] = useActionState<ResetarPinState, FormData>(
    async (prevState, formData) => {
      const resultado = await resetarPinFuncionario(prevState, formData);
      if (resultado && "sucesso" in resultado) setModo("visualizar");
      return resultado;
    },
    undefined,
  );
  const [estadoAtivo, acaoAtivo, pendingAtivo] = useActionState<
    AlternarAtivoState,
    FormData
  >(alternarAtivoFuncionario, undefined);
  const [estadoExclusao, acaoExclusao, pendingExclusao] = useActionState<
    ExcluirFuncionarioState,
    FormData
  >(excluirFuncionario, undefined);

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {usuario.nome}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            {usuario.tipo}
          </span>
          {!usuario.ativo && (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
              Inativo
            </span>
          )}
        </div>
      </div>

      {modo === "editar-nome" ? (
        <form action={acaoEdicao} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="usuarioId" value={usuario.id} />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`nome-${usuario.id}`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Nome
            </label>
            <input
              id={`nome-${usuario.id}`}
              name="nome"
              type="text"
              required
              maxLength={100}
              autoComplete="off"
              defaultValue={usuario.nome}
              className={inputClass}
            />
          </div>
          {estadoEdicao && "erro" in estadoEdicao && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
            >
              {estadoEdicao.erro}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setModo("visualizar")} className={botaoSecundario}>
              Cancelar
            </button>
            <button type="submit" disabled={pendingEdicao} className={botaoPrimario}>
              {pendingEdicao ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      ) : modo === "resetar-pin" ? (
        <form action={acaoPin} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="usuarioId" value={usuario.id} />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`novoPin-${usuario.id}`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Novo PIN
            </label>
            <input
              id={`novoPin-${usuario.id}`}
              name="novoPin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              minLength={4}
              autoComplete="off"
              required
              placeholder="••••"
              className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`novoPinConfirmacao-${usuario.id}`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Confirmar novo PIN
            </label>
            <input
              id={`novoPinConfirmacao-${usuario.id}`}
              name="novoPinConfirmacao"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              minLength={4}
              autoComplete="off"
              required
              placeholder="••••"
              className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            />
          </div>
          {estadoPin && "erro" in estadoPin && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
            >
              {estadoPin.erro}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setModo("visualizar")} className={botaoSecundario}>
              Cancelar
            </button>
            <button type="submit" disabled={pendingPin} className={botaoPrimario}>
              {pendingPin ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      ) : modo === "excluir" ? (
        <form action={acaoExclusao} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="usuarioId" value={usuario.id} />
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            Excluir {usuario.nome} permanentemente? Essa ação não pode ser desfeita.
          </p>
          {estadoExclusao && "erro" in estadoExclusao && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
            >
              {estadoExclusao.erro}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setModo("visualizar")} className={botaoSecundario}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendingExclusao}
              className="h-10 flex-1 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pendingExclusao ? "Excluindo..." : "Confirmar exclusão"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {estadoAtivo && "erro" in estadoAtivo && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
            >
              {estadoAtivo.erro}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setModo("editar-nome")}
              className="h-10 flex-1 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Editar nome
            </button>
            <button
              type="button"
              onClick={() => setModo("resetar-pin")}
              className="h-10 flex-1 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Resetar PIN
            </button>
            {usuario.tipo !== "admin" && (
              <form action={acaoAtivo}>
                <input type="hidden" name="usuarioId" value={usuario.id} />
                <button
                  type="submit"
                  disabled={pendingAtivo}
                  className={
                    usuario.ativo
                      ? "h-10 w-full rounded-lg border-2 border-red-300 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      : "h-10 w-full rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  }
                >
                  {pendingAtivo ? "Salvando..." : usuario.ativo ? "Desativar" : "Reativar"}
                </button>
              </form>
            )}
            {!ehContaLogada && (
              <button
                type="button"
                onClick={() => setModo("excluir")}
                className="h-10 flex-1 rounded-lg border-2 border-red-300 px-3 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
