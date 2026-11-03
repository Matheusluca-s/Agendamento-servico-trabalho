"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { BLOQUEIO_MINUTOS, BloqueioLogin } from "@/app/domain/bloqueio-login";
import { prisma } from "@/app/lib/db";
import { createSession, deleteSession } from "@/app/lib/session";
import { LoginSchema } from "@/app/lib/validation";

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
  const bloqueio = new BloqueioLogin(usuario);

  if (bloqueio.estaBloqueado(agora)) {
    const minutosRestantes = bloqueio.minutosRestantes(agora);
    return {
      erro: `Muitas tentativas erradas. Tente novamente em ${minutosRestantes} minuto${minutosRestantes === 1 ? "" : "s"}.`,
    };
  }

  const pinValido = await compare(pin, usuario.pinHash);

  if (!pinValido) {
    const deveBloquear = bloqueio.registrarFalha(agora);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: deveBloquear
        ? { tentativasFalhas: bloqueio.tentativasFalhas, bloqueadoAte: bloqueio.bloqueadoAte }
        : { tentativasFalhas: bloqueio.tentativasFalhas },
    });

    if (deveBloquear) {
      return {
        erro: `Muitas tentativas erradas. Tente novamente em ${BLOQUEIO_MINUTOS} minutos.`,
      };
    }

    return { erro: "Usuário ou PIN inválido." };
  }

  if (bloqueio.registrarSucesso()) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativasFalhas: bloqueio.tentativasFalhas, bloqueadoAte: bloqueio.bloqueadoAte },
    });
  }

  await createSession({ userId: usuario.id, tipo: usuario.tipo });
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
