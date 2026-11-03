// Script para criar (ou resetar o PIN de) o primeiro usuário admin.
// Os demais funcionários são cadastrados pela área de admin
// (/admin/funcionarios) — este script só é necessário para o primeiro
// acesso, quando ainda não existe nenhum admin para entrar no sistema.
//
// Uso:
//   npm run db:seed -- "Nome do Admin" 1234

import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [nome, pin] = process.argv.slice(2);

  if (!nome || !pin) {
    console.error('Uso: npm run db:seed -- "Nome do Admin" 1234');
    process.exitCode = 1;
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    console.error("O PIN deve ter exatamente 4 dígitos.");
    process.exitCode = 1;
    return;
  }

  const pinHash = await hash(pin, 10);
  const usuarioExistente = await prisma.usuario.findFirst({ where: { nome } });

  const usuario = usuarioExistente
    ? await prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          pinHash,
          tipo: "admin",
          tentativasFalhas: 0,
          bloqueadoAte: null,
        },
      })
    : await prisma.usuario.create({
        data: { nome, pinHash, tipo: "admin" },
      });

  console.log(
    `${usuarioExistente ? "PIN atualizado para" : "Criado"} usuário admin "${usuario.nome}" (id: ${usuario.id}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
