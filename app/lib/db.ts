import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

// Evita criar múltiplas instâncias do PrismaClient durante hot-reload no dev
// (e reaproveita a conexão entre invocações "quentes" de function no Vercel).
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

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  return new PrismaClient({ adapter });
}

// Client "preguiçoso": a instanciação (e a checagem de DATABASE_URL) só
// acontece na primeira consulta de verdade, nunca na importação do módulo.
// O `next build` importa este arquivo pra coletar dados de cada rota — até
// as 100% dinâmicas — e nesse momento variáveis de ambiente de runtime
// (DATABASE_URL) ainda não existem; instanciar o client no topo do módulo
// derrubava o build inteiro nesse passo.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    globalForPrisma.prisma ??= createPrismaClient();
    return Reflect.get(globalForPrisma.prisma as object, prop, receiver);
  },
});
