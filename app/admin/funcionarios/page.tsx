import { prisma } from "@/app/lib/db";
import { FuncionarioRow } from "./funcionario-row";
import { NovoFuncionarioForm } from "./novo-funcionario-form";

export default async function AdminFuncionariosPage() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, tipo: true, ativo: true },
    orderBy: [{ ativo: "desc" }, { criadoEm: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Novo funcionário
        </h1>
        <NovoFuncionarioForm />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Cadastrados
        </h2>
        <ul className="flex flex-col gap-2">
          {usuarios.map((usuario) => (
            <FuncionarioRow key={usuario.id} usuario={usuario} />
          ))}
        </ul>
      </div>
    </div>
  );
}
