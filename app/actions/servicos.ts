"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { parseDateKey, toDateKey } from "@/app/lib/date-utils";
import { prisma } from "@/app/lib/db";
import { MudarStatusSchema, NovoServicoSchema } from "@/app/lib/validation";

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

export type MudarStatusState = { erro: string } | { sucesso: true } | undefined;

// Fluxo de status: agendado -> em_andamento -> concluido, com cancelado
// possível a qualquer momento antes de um estado final.
const TRANSICOES_VALIDAS: Record<string, readonly string[]> = {
  agendado: ["em_andamento", "cancelado"],
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
    // Ausente (null) nos formulários que não pedem observações finais —
    // normaliza pra string vazia, já que o campo é opcional no schema.
    observacoesFinais: formData.get("observacoesFinais") ?? "",
  });

  if (!validatedFields.success) {
    return { erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { servicoId, novoStatus, observacoesFinais } = validatedFields.data;

  const servico = await prisma.servico.findUnique({
    where: { id: servicoId },
    select: { status: true, observacoes: true },
  });

  if (!servico) {
    return { erro: "Serviço não encontrado." };
  }

  // Checagem da transição sempre no servidor — nunca confia no botão que o
  // cliente conseguiu clicar.
  if (!TRANSICOES_VALIDAS[servico.status]?.includes(novoStatus)) {
    return { erro: "Essa mudança de status não é permitida." };
  }

  const novasObservacoes =
    novoStatus === "concluido" && observacoesFinais
      ? [servico.observacoes, observacoesFinais].filter(Boolean).join("\n\n")
      : undefined;

  await prisma.servico.update({
    where: { id: servicoId },
    data: {
      status: novoStatus,
      ...(novasObservacoes !== undefined ? { observacoes: novasObservacoes } : {}),
      ...(novoStatus === "concluido" ? { concluidoEm: new Date() } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath(`/servicos/${servicoId}`);
  return { sucesso: true };
}
