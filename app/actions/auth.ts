"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { createSession, deleteSession } from "@/app/lib/session";
import { LoginSchema } from "@/app/lib/validation";

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 10;

export type LoginState = { erro: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const validatedFields = LoginSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    pin: formData.get("pin"),
  });

  if (!validatedFields.success) {
    return { erro: "Selecione um usuário e digite um PIN de 4 dígitos." };
  }

  const { usuarioId, pin } = validatedFields.data;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
  });

  if (!usuario) {
    return { erro: "Usuário ou PIN inválido." };
  }

  const agora = new Date();

  if (usuario.bloqueadoAte && usuario.bloqueadoAte > agora) {
    const minutosRestantes = Math.ceil(
      (usuario.bloqueadoAte.getTime() - agora.getTime()) / 60_000,
    );
    return {
      erro: `Muitas tentativas erradas. Tente novamente em ${minutosRestantes} minuto${minutosRestantes === 1 ? "" : "s"}.`,
    };
  }

  const pinValido = await compare(pin, usuario.pinHash);

  if (!pinValido) {
    const tentativas = usuario.tentativasFalhas + 1;
    const deveBloquear = tentativas >= MAX_TENTATIVAS;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: deveBloquear
        ? {
            tentativasFalhas: 0,
            bloqueadoAte: new Date(agora.getTime() + BLOQUEIO_MINUTOS * 60_000),
          }
        : { tentativasFalhas: tentativas },
    });

    if (deveBloquear) {
      return {
        erro: `Muitas tentativas erradas. Tente novamente em ${BLOQUEIO_MINUTOS} minutos.`,
      };
    }

    return { erro: "Usuário ou PIN inválido." };
  }

  if (usuario.tentativasFalhas > 0 || usuario.bloqueadoAte) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativasFalhas: 0, bloqueadoAte: null },
    });
  }

  await createSession({ userId: usuario.id, tipo: usuario.tipo });
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
