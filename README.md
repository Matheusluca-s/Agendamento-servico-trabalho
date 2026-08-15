# Climar

Site interno de agendamento de serviços para uma empresa de ar-condicionado. Uso mobile-first, em
campo, por um time pequeno (dono + funcionários). Veja `CLAUDE.md` para o contexto completo do
projeto (escopo, modelo de dados, decisões de segurança).

## Stack

- Next.js (App Router, TypeScript), Tailwind CSS
- Prisma ORM + Postgres (Supabase)
- Autenticação por nome + PIN de 4 dígitos (hash bcrypt, sessão em cookie httpOnly assinado)
- PWA (instalável na tela inicial do celular)
- Deploy no Vercel

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com os valores reais (veja abaixo)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Pra popular o banco com um usuário admin e alguns serviços de exemplo:

```bash
npm run db:seed -- "Nome do Admin" 1234
npm run db:seed-servicos
```

## Variáveis de ambiente

Definidas em `.env` localmente (veja `.env.example`) e no painel do Vercel (Project Settings →
Environment Variables) antes do primeiro deploy:

| Variável         | Uso                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Conexão com o Postgres via pooler do Supabase (pgbouncer, porta 6543) — usada em runtime pela aplicação. |
| `DIRECT_URL`     | Conexão direta com o Postgres (sem pooler, porta 5432) — usada pela CLI do Prisma (migrations). |
| `SESSION_SECRET` | Chave aleatória usada para assinar o cookie de sessão (JWT). Gere uma com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |

As três são obrigatórias em todos os ambientes do Vercel (Production, Preview e Development) —
sem elas o app não sobe (erro já na conexão com o banco ou ao assinar a sessão).

## Deploy no Vercel

1. Configure as três variáveis de ambiente acima no painel do Vercel.
2. Conecte o repositório — o Vercel detecta o Next.js automaticamente (build command
   `next build`, install command `npm install`).
3. `postinstall` já roda `prisma generate` automaticamente a cada `npm install` (não precisa de
   conexão com o banco pra isso, só do schema).
4. As migrations do banco (`prisma migrate deploy`) não rodam automaticamente no build — aplique
   manualmente contra o Supabase antes de cada deploy que mude o schema.

## Segurança

Headers de segurança (CSP, X-Frame-Options, HSTS etc.) são configurados em `next.config.ts` e se
aplicam a todas as rotas, incluindo o manifest e os ícones do PWA. Veja `CLAUDE.md` para a lista
completa de práticas obrigatórias no projeto.
