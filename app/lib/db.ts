import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

// Evita criar múltiplas instâncias do PrismaClient durante hot-reload no dev.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Sem essa checagem, `pg.Pool` recebe `connectionString: undefined` e
    // cai silenciosamente no padrão dele (127.0.0.1:5432) em vez de avisar
    // que a variável não foi configurada — vira um P1001 confuso em
    // produção ("can't reach database server at 127.0.0.1:5432") que
    // esconde a causa real.
    throw new Error(
      "DATABASE_URL não configurada. Defina essa variável de ambiente " +
        "(conexão pooled do Postgres) antes de iniciar a aplicação.",
    );
  }
  return url;
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
