-- DropForeignKey
ALTER TABLE "Servico" DROP CONSTRAINT "Servico_responsavelId_fkey";

-- AlterTable
ALTER TABLE "Servico" ALTER COLUMN "responsavelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
