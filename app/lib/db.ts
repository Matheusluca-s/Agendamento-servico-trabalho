import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

// DEBUG TEMPORÁRIO — remover depois de confirmar nos logs do Vercel.
// Nunca loga a URL inteira (teria a senha): só existência, tamanho e os
// primeiros 15 caracteres (ex: "postgresql://us").
console.log("[debug] DATABASE_URL existe:", Boolean(process.env.DATABASE_URL));
console.log("[debug] DATABASE_URL length:", process.env.DATABASE_URL?.length);
console.log("[debug] DATABASE_URL início:", process.env.DATABASE_URL?.slice(0, 15));
console.log("[debug] DIRECT_URL existe:", Boolean(process.env.DIRECT_URL));
console.log("[debug] DIRECT_URL length:", process.env.DIRECT_URL?.length);
console.log("[debug] DIRECT_URL início:", process.env.DIRECT_URL?.slice(0, 15));

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
    //
    // DEBUG TEMPORÁRIO — remover o bloco de diagnóstico abaixo depois de
    // confirmar a causa nos logs do Vercel. Nunca inclui valores, só
    // existência, tamanho e os nomes das variáveis de ambiente candidatas.
    const chavesRelacionadas = Object.keys(process.env).filter(
      (chave) => chave.includes("DATABASE") || chave.includes("DIRECT"),
    );
    const diagnostico =
      `DATABASE_URL existe: ${Boolean(process.env.DATABASE_URL)}; ` +
      `DATABASE_URL length: ${process.env.DATABASE_URL?.length ?? "n/a"}; ` +
      `DIRECT_URL existe: ${Boolean(process.env.DIRECT_URL)}; ` +
      `DIRECT_URL length: ${process.env.DIRECT_URL?.length ?? "n/a"}; ` +
      `chaves candidatas: [${chavesRelacionadas.join(", ")}]`;

    throw new Error(
      "DATABASE_URL não configurada. Defina essa variável de ambiente " +
        `(conexão pooled do Postgres) antes de iniciar a aplicação. (${diagnostico})`,
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
