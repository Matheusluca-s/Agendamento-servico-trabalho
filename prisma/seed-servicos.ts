// Popula o banco com funcionários e serviços de exemplo, só para visualizar
// o calendário funcionando. Apaga e recria os serviços a cada execução.
//
// Uso:
//   npm run db:seed-servicos

import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function dataUTC(diasAPartirDeHoje: number): Date {
  const hoje = new Date();
  const base = new Date(
    Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()),
  );
  base.setUTCDate(base.getUTCDate() + diasAPartirDeHoje);
  return base;
}

async function garantirFuncionario(nome: string) {
  const existente = await prisma.usuario.findFirst({ where: { nome } });
  if (existente) return existente;

  const pinHash = await hash("1234", 10);
  return prisma.usuario.create({
    data: { nome, pinHash, tipo: "funcionario" },
  });
}

async function main() {
  const admin = await prisma.usuario.findFirst({ where: { tipo: "admin" } });
  if (!admin) {
    console.error(
      'Nenhum admin encontrado. Rode antes: npm run db:seed -- "Nome do Admin" 1234',
    );
    process.exitCode = 1;
    return;
  }

  const joao = await garantirFuncionario("João Silva");
  const maria = await garantirFuncionario("Maria Souza");

  await prisma.servico.deleteMany();

  await prisma.servico.createMany({
    data: [
      {
        local: "Mercado Bom Preço",
        endereco: "Av. Brasil, 1200",
        data: dataUTC(-3),
        horario: "09:00",
        tipoServico: "instalacao",
        status: "concluido",
        responsavelId: joao.id,
      },
      {
        local: "Residência Sr. Antônio",
        endereco: "Rua das Palmeiras, 45",
        data: dataUTC(-1),
        horario: "14:00",
        tipoServico: "manutencao",
        status: "concluido",
        responsavelId: maria.id,
      },
      {
        local: "Consultório Dra. Paula",
        endereco: "Rua XV de Novembro, 300, sala 12",
        data: dataUTC(0),
        horario: "08:30",
        tipoServico: "limpeza",
        status: "em_andamento",
        responsavelId: joao.id,
      },
      {
        local: "Padaria Pão Quente",
        endereco: "Rua Sete de Setembro, 88",
        data: dataUTC(0),
        horario: "13:00",
        tipoServico: "manutencao",
        status: "agendado",
        responsavelId: maria.id,
      },
      {
        local: "Escritório Contábil Silva & Souza",
        endereco: "Av. Getúlio Vargas, 500, sala 8",
        data: dataUTC(0),
        horario: "16:30",
        tipoServico: "outro",
        status: "agendado",
        observacoes: "Cliente pediu orçamento para mais 2 splits.",
        responsavelId: admin.id,
      },
      {
        local: "Academia Corpo em Forma",
        endereco: "Rua Marechal Deodoro, 210",
        data: dataUTC(2),
        horario: "10:00",
        tipoServico: "instalacao",
        status: "agendado",
        responsavelId: joao.id,
      },
      {
        local: "Residência Sra. Célia",
        endereco: "Rua dos Ipês, 77",
        data: dataUTC(4),
        horario: "09:30",
        tipoServico: "limpeza",
        status: "agendado",
        responsavelId: maria.id,
      },
      {
        local: "Farmácia Vida Saudável",
        endereco: "Av. Brasil, 950",
        data: dataUTC(4),
        horario: "15:00",
        tipoServico: "manutencao",
        status: "agendado",
        responsavelId: joao.id,
      },
      {
        local: "Restaurante Sabor Caseiro",
        endereco: "Rua Bahia, 33",
        data: dataUTC(8),
        horario: "11:00",
        tipoServico: "instalacao",
        status: "agendado",
        responsavelId: maria.id,
      },
      {
        local: "Residência Sr. Roberto",
        endereco: "Rua Paraná, 150",
        data: dataUTC(11),
        horario: "14:30",
        tipoServico: "outro",
        status: "cancelado",
        observacoes: "Cliente remarcou para o mês seguinte.",
        responsavelId: joao.id,
      },
      {
        local: "Loja Moda & Cia",
        endereco: "Rua das Flores, 500",
        data: dataUTC(-8),
        horario: "10:00",
        tipoServico: "limpeza",
        status: "concluido",
        responsavelId: maria.id,
      },
      {
        local: "Clínica Odontológica Sorriso",
        endereco: "Av. Central, 700",
        data: dataUTC(15),
        horario: "09:00",
        tipoServico: "manutencao",
        status: "agendado",
        responsavelId: admin.id,
      },
    ],
  });

  const total = await prisma.servico.count();
  console.log(`${total} serviços de exemplo criados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
