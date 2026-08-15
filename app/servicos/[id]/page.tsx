import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { formatDataHora, formatDiaCompleto } from "@/app/lib/date-utils";
import { prisma } from "@/app/lib/db";
import { corDoTipoServico, labelDoStatus, labelDoTipoServico } from "@/app/lib/tipo-servico";
import { MudarStatusForm } from "./mudar-status-form";

// Depende de sessão e consulta o banco — não pode ser renderizada
// estaticamente no build (variáveis de ambiente de runtime, como
// DATABASE_URL, ainda não estão disponíveis nesse momento).
export const dynamic = "force-dynamic";

export default async function ServicoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;

  const servico = await prisma.servico.findUnique({
    where: { id },
    select: {
      id: true,
      local: true,
      endereco: true,
      data: true,
      horario: true,
      tipoServico: true,
      status: true,
      observacoes: true,
      concluidoEm: true,
      responsavel: { select: { nome: true } },
    },
  });

  if (!servico) {
    notFound();
  }

  const cor = corDoTipoServico(servico.tipoServico);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Voltar
        </Link>

        <div className={`mb-4 rounded-2xl border p-5 ${cor.bg} ${cor.border}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${cor.text}`}>
              {labelDoTipoServico(servico.tipoServico)}
            </span>
            <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-black/30 dark:text-zinc-200">
              {labelDoStatus(servico.status)}
            </span>
          </div>

          <h1
            className={`text-xl font-semibold text-zinc-900 dark:text-zinc-50 ${
              servico.status === "cancelado" ? "line-through" : ""
            }`}
          >
            {servico.local}
          </h1>
          {servico.endereco && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{servico.endereco}</p>
          )}

          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Data</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {formatDiaCompleto(servico.data)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Horário</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {servico.horario}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Responsável</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {servico.responsavel.nome}
              </dd>
            </div>
            {servico.concluidoEm && (
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Concluído em</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {formatDataHora(servico.concluidoEm)}
                </dd>
              </div>
            )}
          </dl>

          {servico.observacoes && (
            <div className="mt-4 border-t border-black/10 pt-3 dark:border-white/10">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Observações
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                {servico.observacoes}
              </p>
            </div>
          )}
        </div>

        <MudarStatusForm servicoId={servico.id} statusAtual={servico.status} />
      </div>
    </div>
  );
}
