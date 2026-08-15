# CLAUDE.md

Este arquivo documenta o contexto do projeto para que não seja necessário reexplicá-lo em cada novo comando.

## Visão geral

Site interno (não é produto comercial) para uma empresa de ar-condicionado. Funcionários e o dono (admin) acessam pelo celular, em campo, para marcar e acompanhar serviços: local, data, horário, o que foi feito e status. Time pequeno (2 a 5 funcionários). Não há dado sensível de cliente (sem CPF, cartão etc.) — apenas nome/local, endereço e tipo de serviço.

## Stack

- Next.js (App Router, TypeScript), Tailwind CSS, mobile-first
- Prisma ORM + Postgres (Supabase, plano gratuito)
- Deploy no Vercel (plano gratuito)
- Validação com Zod (frontend e backend)
- Autenticação simples: nome + PIN de 4 dígitos (hash bcrypt)
- PWA (instalável na tela inicial do celular)

## Modelo de dados (Prisma)

```prisma
model Usuario {
  id               String    @id @default(cuid())
  nome             String
  pinHash          String    // hash bcrypt, nunca texto puro
  tipo             String    // "admin" ou "funcionario"
  tentativasFalhas Int       @default(0) // tentativas de PIN erradas seguidas
  bloqueadoAte     DateTime? // se no futuro, login bloqueado por força bruta
  criadoEm         DateTime  @default(now())
  servicos         Servico[]
}

model Servico {
  id            String   @id @default(cuid())
  local         String
  endereco      String?
  data          DateTime
  horario       String
  tipoServico   String   // "instalacao" | "manutencao" | "limpeza" | "outro"
  status        String   @default("agendado") // agendado, em_andamento, concluido, cancelado
  observacoes   String?
  responsavelId String
  responsavel   Usuario  @relation(fields: [responsavelId], references: [id])
  criadoEm      DateTime @default(now())
  concluidoEm   DateTime?
}
```

## Funcionalidades planejadas (ainda não implementadas)

1. Login: escolher nome numa lista + PIN de 4 dígitos
2. Cadastro de funcionário (só admin): nome + PIN
3. Calendário com visão semanal e mensal, cores por tipo de serviço, legenda das cores
4. Novo serviço: formulário com local, endereço, data, horário, tipo, responsável, observações
5. Detalhes/edição: mudar status (agendado → em andamento → concluído), observações finais

## Fora de escopo (decisão explícita)

Foto do serviço, histórico/relatório por funcionário, serviço recorrente, cadastro de clientes separado (fica texto livre), notificações push/WhatsApp.

## Segurança (obrigatório em toda implementação futura)

- **SQL injection**: sempre métodos normais do Prisma; nunca `$queryRawUnsafe`/`$executeRawUnsafe` com string concatenada; se precisar SQL bruto, usar `$queryRaw` com template literal
- **XSS**: nunca `dangerouslySetInnerHTML`
- **CSRF**: preferir Server Actions (proteção automática); se usar API Routes, validar Origin/Referer e cookies httpOnly + SameSite=Lax/Strict
- **Validação**: schema Zod único usado no frontend (feedback) e no backend (validação real, nunca confiar só no frontend)
- **Autenticação**: PIN sempre com hash bcrypt; bloquear após ~5 tentativas erradas seguidas; toda rota checa sessão válida no servidor
- **Headers de segurança** no `next.config.js`: Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Strict-Transport-Security
- **Segredos** (string de conexão etc.) só em variáveis de ambiente, nunca commitados

## Convenções

- Interface e mensagens em português
- Mobile-first sempre
- Priorizar simplicidade — uso interno de empresa pequena, não precisa escalar
