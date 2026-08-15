"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, verifySession } from "@/app/lib/dal";
import { parseDateKey, toDateKey } from "@/app/lib/date-utils";
import { prisma } from "@/app/lib/db";
import { ExcluirServicoSchema, MudarStatusSchema, NovoServicoSchema } from "@/app/lib/validation";

export type NovoServicoState = { erro: string } | undefined;

export async function criarServico(
  _prevState: NovoServicoState,
  formData: FormData,
): Promise<NovoServicoState> {
  // Qualquer usuário logado (admin ou funcionário) pode criar serviços.
  await verifySession();

  const validatedFields = NovoServicoSchema.safeParse({
    local: formData.get("local"),
    endereco: formData.get("endereco"),
    data: formData.get("data"),
    horario: formData.get("horario"),
    tipoServico: formData.get("tipoServico"),
    responsavelId: formData.get("responsavelId"),
    observacoes: formData.get("observacoes"),
  });

  if (!validatedFields.success) {
    return { erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { local, endereco, data, horario, tipoServico, responsavelId, observacoes } =
    validatedFields.data;

  const dataServico = parseDateKey(data);
  if (!dataServico) {
    return { erro: "Selecione uma data válida." };
  }

  const responsavel = await prisma.usuario.findUnique({
    where: { id: responsavelId },
    select: { id: true },
  });
  if (!responsavel) {
    return { erro: "Funcionário responsável inválido." };
  }

  await prisma.servico.create({
    data: {
      local,
      endereco: endereco || null,
      data: dataServico,
      horario,
      tipoServico,
      responsavelId,
      observacoes: observacoes || null,
    },
  });

  const diaKey = toDateKey(dataServico);
  revalidatePath("/");
  redirect(`/?view=mes&data=${diaKey}&dia=${diaKey}`);
}

export type MudarStatusState = { erro: string } | undefined;

// Fluxo de status: agendado -> concluido, com cancelado possível a
// qualquer momento a partir de agendado. "em_andamento" era uma etapa
// intermediária do fluxo antigo — não é mais um destino válido, mas
// serviços antigos com esse status ainda podem ser concluídos ou
// cancelados normalmente.
const TRANSICOES_VALIDAS: Record<string, readonly string[]> = {
  agendado: ["concluido", "cancelado"],
  em_andamento: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
};

export async function mudarStatusServico(
  _prevState: MudarStatusState,
  formData: FormData,
): Promise<MudarStatusState> {
  await verifySession();

  const validatedFields = MudarStatusSchema.safeParse({
    servicoId: formData.get("servicoId"),
    novoStatus: formData.get("novoStatus"),
    // Ausente (null) se o campo não vier no formData — normaliza pra
    // string vazia, já que é opcional no schema.
    observacoes: formData.get("observacoes") ?? "",
  });

  if (!validatedFields.success) {
    return { erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { servicoId, novoStatus, observacoes } = validatedFields.data;

  const servico = await prisma.servico.findUnique({
    where: { id: servicoId },
    select: { status: true, data: true },
  });

  if (!servico) {
    return { erro: "Serviço não encontrado." };
  }

  // Checagem da transição sempre no servidor — nunca confia no botão que o
  // cliente conseguiu clicar.
  if (!TRANSICOES_VALIDAS[servico.status]?.includes(novoStatus)) {
    return { erro: "Essa mudança de status não é permitida." };
  }

  await prisma.servico.update({
    where: { id: servicoId },
    data: {
      status: novoStatus,
      // Opcional: se preenchido, substitui o valor atual (não acumula
      // histórico); se vazio, mantém as observações que já existiam.
      ...(observacoes ? { observacoes } : {}),
      ...(novoStatus === "concluido" ? { concluidoEm: new Date() } : {}),
    },
  });

  const diaKey = toDateKey(servico.data);
  revalidatePath("/");
  redirect(`/?view=mes&data=${diaKey}&dia=${diaKey}`);
}

export type ExcluirServicoState = { erro: string } | undefined;

export async function excluirServico(
  _prevState: ExcluirServicoState,
  formData: FormData,
): Promise<ExcluirServicoState> {
  // Só admin pode excluir serviços (diferente de criar/mudar status, que
  // qualquer usuário logado pode fazer).
  await requireAdmin();

  const validatedFields = ExcluirServicoSchema.safeParse({
    servicoId: formData.get("servicoId"),
  });

  if (!validatedFields.success) {
    return { erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { servicoId } = validatedFields.data;

  const servico = await prisma.servico.findUnique({
    where: { id: servicoId },
    select: { id: true },
  });
  if (!servico) {
    return { erro: "Serviço não encontrado." };
  }

  // Sem bloqueio de vínculo aqui — diferente de excluir funcionário, não
  // existe nada dependente de um serviço.
  await prisma.servico.delete({ where: { id: servicoId } });

  revalidatePath("/");
  revalidatePath("/admin/servicos");
  redirect("/admin/servicos");
}
