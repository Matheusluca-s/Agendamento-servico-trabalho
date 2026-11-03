# Climar

Sistema web interno de agendamento e acompanhamento de serviços para a Climar, uma empresa de
ar-condicionado. Trabalho final da disciplina de Análise Orientada a Objetos.

## Objetivo

**Problema.** A Climar é uma empresa pequena (o dono e de 2 a 5 funcionários, divididos em duas
equipes) que faz instalação, manutenção e limpeza de ar-condicionado. O dono passava os serviços aos
funcionários por WhatsApp, sem um lugar único para ver a agenda da semana nem acompanhar o que já
tinha sido feito.

**Público.** Os funcionários e o dono (administrador), que usam o sistema pelo celular, em campo,
entre um atendimento e outro. É um sistema de uso interno, não um produto comercial.

**Solução.** Um site mobile-first, instalável na tela inicial do celular (PWA), onde a equipe
registra cada serviço (local, endereço, data, horário, tipo e responsável) e acompanha o status
em um calendário. O administrador tem uma área própria para ver todos os serviços e gerenciar os
funcionários. O sistema não guarda dados sensíveis de clientes (não há CPF, cartão etc.), apenas
nome/local, endereço e tipo de serviço.

## Funcionalidades

1. **Login:** o usuário escolhe o nome numa lista e digita um PIN de 4 dígitos. O acesso é
   bloqueado após 5 erros seguidos.
2. **Cadastro de funcionário** (só admin): nome e PIN.
3. **Calendário** com visão semanal e mensal, cores por tipo de serviço e legenda das cores.
4. **Novo serviço:** local, endereço, data, horário, tipo, responsável (opcional) e observações.
5. **Mudança de status:** agendado → concluído, ou cancelado. Uma observação pode ser registrada
   em qualquer mudança de status. Na conclusão, pode-se informar quem realmente fez o serviço.
6. **Área de admin:** visão geral de todos os serviços; gerenciamento de funcionários (editar,
   resetar PIN, desativar/reativar preservando o histórico, excluir); exclusão de serviço.

## Regras de negócio

- **RN01 — Fluxo de status:** um serviço nasce `agendado` e só pode ir para `concluido` ou
  `cancelado`. Serviço concluído ou cancelado não muda mais de status. Ao concluir, `concluidoEm`
  é preenchido.
- **RN02 — Bloqueio por força bruta:** após 5 PINs errados seguidos, o login do usuário fica
  bloqueado por um período (`bloqueadoAte`). Login correto zera `tentativasFalhas`.
- **RN03 — Responsável ativo:** só usuários ativos podem ser escolhidos como responsável.
  Desativar um funcionário não apaga seus serviços.
- **RN04 — Permissão de admin:** só admin cadastra/edita/desativa funcionários e acessa a área de
  admin.

## Tecnologias

- [Next.js](https://nextjs.org/) (App Router) com TypeScript
- Tailwind CSS (layout mobile-first)
- Prisma ORM + PostgreSQL (hospedado no Supabase)
- Zod para validação dos dados (o mesmo schema no frontend e no backend)
- bcrypt para o hash dos PINs; sessão em cookie httpOnly assinado (JWT, com a biblioteca `jose`)
- PWA (instalável na tela inicial do celular)
- Vitest para os testes de unidade e de integração
- Deploy no Vercel

## Arquitetura

As regras de negócio ficam separadas do framework e do banco de dados, em três camadas:

```
app/
├── domain/        Regras de negócio puras
├── application/   Casos de uso
├── infra/         Acesso ao banco (Prisma)
└── actions/       Server Actions (ponto de entrada das telas)
```

- **`app/domain/`** — classes com as regras de negócio, sem nenhuma dependência de Prisma,
  Next.js ou do servidor. Por isso podem ser testadas isoladamente.
  - `Servico` (`servico.ts`): guarda o status, as observações, o responsável e a data de
    conclusão, e aplica o fluxo de status da RN01 com `podeMudarPara()`, `concluir()` e
    `cancelar()`. Uma transição não permitida lança `TransicaoInvalidaError`. Serviços antigos com
    o status `em_andamento` (de uma versão anterior do fluxo) ainda podem ser concluídos ou
    cancelados.
  - `BloqueioLogin` (`bloqueio-login.ts`): aplica a RN02 com `estaBloqueado()`,
    `minutosRestantes()`, `registrarFalha()` e `registrarSucesso()` (5 tentativas, 10 minutos de
    bloqueio).
- **`app/application/`** — os casos de uso, que coordenam validação, domínio e persistência.
  - `ServicoRepository` (`servico-repository.ts`): interface que descreve o que o caso de uso
    precisa do banco (`buscarPorId`, `criar`, `atualizar`, `buscarUsuarioAtivo`).
  - `ServicoService` (`servico-service.ts`): casos de uso `cadastrar()` e `mudarStatus()`. Valida
    os dados com Zod, aplica as regras da classe `Servico` e a RN03 (responsável precisa estar
    ativo) e grava pelo `ServicoRepository`. Retorna `{ ok: true, ... }` ou
    `{ ok: false, erro: "mensagem" }`. Depende apenas da interface, não do Prisma.
- **`app/infra/`** — implementações concretas.
  - `PrismaServicoRepository` (`prisma-servico-repository.ts`): implementa `ServicoRepository`
    usando o Prisma e o PostgreSQL.
- **`app/actions/`** — as Server Actions do Next.js chamadas pelos formulários. Elas só verificam
  a sessão, montam os dados do formulário, chamam o caso de uso e redirecionam a tela.

Fluxo de "cadastrar e concluir serviço":

```
Formulário → Server Action → ServicoService → Servico (domínio)
                                   ↓
                           ServicoRepository → PrismaServicoRepository → PostgreSQL
```

## Como executar

Pré-requisitos: Node.js 20.9 ou superior e um banco PostgreSQL (o projeto usa o Supabase, plano
gratuito).

```bash
# 1. Instalar as dependências (também gera o client do Prisma)
npm install

# 2. Criar o arquivo de ambiente e preencher com os valores reais (veja a seção abaixo)
cp .env.example .env

# 3. Criar as tabelas no banco
npx prisma migrate deploy

# 4. Criar o primeiro usuário admin (nome e PIN de 4 dígitos)
npm run db:seed -- "Nome do Admin" 1234

# 5. Subir o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e entre com o nome e o PIN do admin criado no
passo 4. Os demais funcionários são cadastrados pela área de admin.

Se o admin já existir, rodar o `db:seed` de novo com o mesmo nome apenas troca o PIN e desbloqueia
o login.

Opcionalmente, para popular o calendário com funcionários e serviços de exemplo:

```bash
npm run db:seed-servicos
```

> **Atenção:** `db:seed-servicos` apaga e recria os serviços a cada execução. Use apenas em um
> banco de desenvolvimento.

## Como rodar os testes

```bash
npm test                  # todos os testes
npm run test:unit         # só os testes de unidade
npm run test:integration  # só os testes de integração
```

**Os testes não precisam de banco de dados nem de arquivo `.env`.** Nenhum teste importa o acesso
ao banco (`app/lib/db.ts`) ou a camada `app/infra/`. Basta ter rodado `npm install`.

- **Testes de unidade** (`tests/unit/`) testam as classes de domínio isoladamente:
  - `servico.test.ts` (RN01): `agendado` pode ir para `concluido` e `cancelado`; serviço concluído
    ou cancelado não muda mais de status (lança `TransicaoInvalidaError`); o status legado
    `em_andamento` pode ser concluído; concluir preenche `concluidoEm` e o responsável informado;
    uma observação nova substitui a anterior.
  - `bloqueio-login.test.ts` (RN02): 4 erros seguidos não bloqueiam e o 5º bloqueia por 10
    minutos; depois de 10 minutos o login é liberado; um login correto zera as tentativas.
- **Testes de integração** (`tests/integration/`) testam o fluxo "cadastrar e concluir serviço"
  de ponta a ponta: validação Zod → `ServicoService` → domínio → repositório. No lugar do banco é
  usado um `InMemoryServicoRepository`, que guarda os dados em memória e já vem com um usuário
  ativo e um inativo. O teste `cadastrar-e-concluir-servico.test.ts` verifica:
  - sucesso: cadastra um serviço válido, conclui informando quem fez e confere no repositório o
    status, `concluidoEm`, o responsável e as observações;
  - dados inválidos (ex.: horário `25:00`) retornam a mensagem de erro e nada é gravado;
  - responsável inativo é recusado, no cadastro e na conclusão (RN03);
  - mudar o status de um serviço já concluído retorna "Essa mudança de status não é permitida."

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

No Vercel, as migrations (`npx prisma migrate deploy`) não rodam automaticamente no build: devem
ser aplicadas manualmente antes de cada deploy que mude o schema.

## Segurança

- **Autenticação:** o PIN é guardado apenas como hash bcrypt, nunca em texto puro. Após 5 PINs
  errados seguidos o login fica bloqueado por 10 minutos (RN02). Toda página e toda ação verifica
  a sessão no servidor, e as ações de administrador verificam também o perfil (RN04).
- **Sessão:** cookie httpOnly (inacessível ao JavaScript da página), assinado e com
  `SameSite=Lax`.
- **CSRF:** os formulários usam Server Actions do Next.js, que já trazem proteção contra CSRF.
- **Validação:** todos os dados são validados com Zod no servidor, mesmo que o frontend também
  valide; o servidor nunca confia apenas no que veio da tela.
- **SQL injection:** todo acesso ao banco usa os métodos do Prisma, que parametrizam as consultas;
  não há SQL montado por concatenação de strings.
- **XSS:** o React escapa todo conteúdo exibido, e o projeto não usa `dangerouslySetInnerHTML`.
- **Headers de segurança:** configurados em `next.config.ts` para todas as rotas —
  Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  Referrer-Policy e Strict-Transport-Security.
- **Segredos:** strings de conexão e a chave da sessão ficam só em variáveis de ambiente; o `.env`
  não é commitado e o `.env.example` traz apenas os nomes, sem valores reais.
