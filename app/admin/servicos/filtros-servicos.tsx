"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TIPOS_SERVICO, TODOS_STATUS, labelDoStatus, labelDoTipoServico } from "@/app/lib/tipo-servico";

const selectClass =
  "h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-700";

export function FiltrosServicos({
  funcionarios,
}: {
  funcionarios: { id: string; nome: string; ativo: boolean }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function atualizarFiltro(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set(chave, valor);
    } else {
      params.delete(chave);
    }
    router.push(`/admin/servicos${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <select
        aria-label="Filtrar por status"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => atualizarFiltro("status", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os status</option>
        {TODOS_STATUS.map((status) => (
          <option key={status} value={status}>
            {labelDoStatus(status)}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por tipo de serviço"
        value={searchParams.get("tipoServico") ?? ""}
        onChange={(e) => atualizarFiltro("tipoServico", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os tipos</option>
        {TIPOS_SERVICO.map((tipo) => (
          <option key={tipo} value={tipo}>
            {labelDoTipoServico(tipo)}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por responsável"
        value={searchParams.get("responsavelId") ?? ""}
        onChange={(e) => atualizarFiltro("responsavelId", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os responsáveis</option>
        {funcionarios.map((funcionario) => (
          <option key={funcionario.id} value={funcionario.id}>
            {funcionario.nome}
            {!funcionario.ativo ? " (inativo)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
