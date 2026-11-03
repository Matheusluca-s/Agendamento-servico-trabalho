"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ServicoService } from "@/app/application/servico-service";
import { PrismaServicoRepository } from "@/app/infra/prisma-servico-repository";
import { requireAdmin, verifySession } from "@/app/lib/dal";
import { toDateKey } from "@/app/lib/date-utils";
import { prisma } from "@/app/lib/db";
import { ExcluirServicoSchema } from "@/app/lib/validation";

const servicoService = new ServicoService(new PrismaServicoRepository());

export type NovoServicoState = { erro: string } | undefined;

export async function criarServico(
  _prevState: NovoServicoState,
  formData: FormData,
): Promise<NovoServicoState> {
  // Qualquer usuário logado (admin ou funcionário) pode criar serviços.
  await verifySession();

  const resultado = await servicoService.cadastrar({
    local: formData.get("local"),
    endereco: formData.get("endereco"),
    data: formData.get("data"),
    horario: formData.get("horario"),
    tipoServico: formData.get("tipoServico"),
    responsavelId: formData.get("responsavelId"),
    observacoes: formData.get("observacoes"),
  });

  if (!resultado.ok) {
    return { erro: resultado.erro };
  }

  const diaKey = toDateKey(resultado.data);
  revalidatePath("/");
  redirect(`/?view=mes&data=${diaKey}&dia=${diaKey}`);
}

export type MudarStatusState = { erro: string } | undefined;

export async function mudarStatusServico(
  _prevState: MudarStatusState,
  formData: FormData,
): Promise<MudarStatusState> {
  await verifySession();

  const resultado = await servicoService.mudarStatus({
    servicoId: formData.get("servicoId"),
    novoStatus: formData.get("novoStatus"),
    // Ausente (null) se o campo não vier no formData — normaliza pra
    // string vazia, já que é opcional no schema.
    observacoes: formData.get("observacoes") ?? "",
    responsavelId: formData.get("responsavelId") ?? "",
  });

  if (!resultado.ok) {
    return { erro: resultado.erro };
  }

  const diaKey = toDateKey(resultado.data);
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
