"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import {
  AlternarAtivoSchema,
  EditarFuncionarioSchema,
  NovoFuncionarioSchema,
  ResetarPinSchema,
} from "@/app/lib/validation";

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

  revalidatePath("/admin/funcionarios");
  return { sucesso: true };
}

export type EditarFuncionarioState = { erro: string } | { sucesso: true } | undefined;

export async function editarFuncionario(
  _prevState: EditarFuncionarioState,
  formData: FormData,
): Promise<EditarFuncionarioState> {
  await requireAdmin();

  const validatedFields = EditarFuncionarioSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    nome: formData.get("nome"),
  });

  if (!validatedFields.success) {
    return { erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { usuarioId, nome } = validatedFields.data;

  const duplicado = await prisma.usuario.findFirst({
    where: { nome, NOT: { id: usuarioId } },
  });
  if (duplicado) {
    return { erro: "Já existe um funcionário cadastrado com esse nome." };
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { nome } });

  revalidatePath("/admin/funcionarios");
  return { sucesso: true };
}

export type ResetarPinState = { erro: string } | { sucesso: true } | undefined;

export async function resetarPinFuncionario(
  _prevState: ResetarPinState,
  formData: FormData,
): Promise<ResetarPinState> {
  await requireAdmin();

  const validatedFields = ResetarPinSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    novoPin: formData.get("novoPin"),
    novoPinConfirmacao: formData.get("novoPinConfirmacao"),
  });

  if (!validatedFields.success) {
    return { erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { usuarioId, novoPin } = validatedFields.data;
  const pinHash = await hash(novoPin, 10);

  // Reseta também o bloqueio por tentativas erradas — o PIN novo é um
  // recomeço, não faz sentido deixar o funcionário travado com ele.
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { pinHash, tentativasFalhas: 0, bloqueadoAte: null },
  });

  revalidatePath("/admin/funcionarios");
  return { sucesso: true };
}

export type AlternarAtivoState = { erro: string } | undefined;

export async function alternarAtivoFuncionario(
  _prevState: AlternarAtivoState,
  formData: FormData,
): Promise<AlternarAtivoState> {
  await requireAdmin();

  const validatedFields = AlternarAtivoSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
  });

  if (!validatedFields.success) {
    return { erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { usuarioId } = validatedFields.data;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { ativo: true, tipo: true },
  });

  if (!usuario) {
    return { erro: "Funcionário não encontrado." };
  }

  // Nunca desativa um admin pela tela — poderia travar o acesso administrativo.
  if (usuario.tipo === "admin") {
    return { erro: "Não é possível desativar um administrador." };
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { ativo: !usuario.ativo },
  });

  revalidatePath("/admin/funcionarios");
  revalidatePath("/servicos/novo");
  return undefined;
}
