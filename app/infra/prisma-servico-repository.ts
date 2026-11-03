import "server-only";
import { prisma } from "@/app/lib/db";
import type {
  AlteracoesServico,
  NovoServicoDados,
  ServicoRegistro,
  ServicoRepository,
} from "@/app/application/servico-repository";

const CAMPOS_REGISTRO = {
  id: true,
  data: true,
  status: true,
  observacoes: true,
  responsavelId: true,
  concluidoEm: true,
} as const;

export class PrismaServicoRepository implements ServicoRepository {
  async buscarPorId(id: string): Promise<ServicoRegistro | null> {
    return prisma.servico.findUnique({ where: { id }, select: CAMPOS_REGISTRO });
  }

  async criar(dados: NovoServicoDados): Promise<ServicoRegistro> {
    const { responsavelId, ...resto } = dados;
    return prisma.servico.create({
      data: {
        ...resto,
        // Omite a chave por completo quando vazio — passar `null` direto
        // confunde a resolução do input "checked"/"unchecked" do Prisma pra
        // uma FK opcional (ele passa a exigir o objeto de relação inteiro).
        ...(responsavelId ? { responsavelId } : {}),
      },
      select: CAMPOS_REGISTRO,
    });
  }

  async atualizar(id: string, alteracoes: AlteracoesServico): Promise<void> {
    await prisma.servico.update({ where: { id }, data: alteracoes });
  }

  async buscarUsuarioAtivo(id: string): Promise<{ id: string } | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, ativo: true },
    });
    return usuario?.ativo ? { id: usuario.id } : null;
  }
}
