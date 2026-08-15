"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import { NovoFuncionarioSchema } from "@/app/lib/validation";

export type NovoFuncionarioState = { erro: string } | { sucesso: true } | undefined;

export async function criarFuncionario(
  _prevState: NovoFuncionarioState,
  formData: FormData,
): Promise<NovoFuncionarioState> {
  // Checagem de autorização no servidor — nunca confia em nada vindo do
  // cliente (nem que o link/formulário só apareça pra admin na tela).
  await requireAdmin();

  const validatedFields = NovoFuncionarioSchema.safeParse({
    nome: formData.get("nome"),
    pin: formData.get("pin"),
    pinConfirmacao: formData.get("pinConfirmacao"),
  });

  if (!validatedFields.success) {
    return { erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, pin } = validatedFields.data;

  const existente = await prisma.usuario.findFirst({ where: { nome } });
  if (existente) {
    return { erro: "Já existe um funcionário cadastrado com esse nome." };
  }

  const pinHash = await hash(pin, 10);

  // Tipo é sempre "funcionario" aqui — não vem do formulário, para evitar
  // promoção acidental (ou maliciosa) a admin pela tela de cadastro.
  await prisma.usuario.create({
    data: { nome, pinHash, tipo: "funcionario" },
  });

  revalidatePath("/funcionarios");
  return { sucesso: true };
}
