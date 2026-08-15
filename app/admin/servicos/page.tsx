import { prisma } from "@/app/lib/db";
import { FiltroServicosSchema } from "@/app/lib/validation";
import { FiltrosServicos } from "./filtros-servicos";
import { ServicoLinha } from "./servico-linha";

export default async function AdminServicosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipoServico?: string; responsavelId?: string }>;
}) {
  const params = await searchParams;

  // Filtros vêm da query string — qualquer valor fora do esperado é
  // descartado (cai pra "sem filtro") em vez de quebrar a página.
  const filtro = FiltroServicosSchema.safeParse({
    status: params.status || undefined,
    tipoServico: params.tipoServico || undefined,
    responsavelId: params.responsavelId || undefined,
  });
  const { status, tipoServico, responsavelId } = filtro.success ? filtro.data : {};

  const [servicos, funcionarios] = await Promise.all([
    prisma.servico.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(tipoServico ? { tipoServico } : {}),
        ...(responsavelId ? { responsavelId } : {}),
      },
      select: {
        id: true,
        local: true,
        data: true,
        horario: true,
        tipoServico: true,
        status: true,
        responsavel: { select: { nome: true } },
      },
      orderBy: [{ data: "desc" }, { horario: "desc" }],
    }),
    prisma.usuario.findMany({
      select: { id: true, nome: true, ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <FiltrosServicos funcionarios={funcionarios} />

      {servicos.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          Nenhum serviço encontrado com esses filtros.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {servicos.map((servico) => (
            <ServicoLinha key={servico.id} servico={servico} />
          ))}
        </div>
      )}
    </div>
  );
}
