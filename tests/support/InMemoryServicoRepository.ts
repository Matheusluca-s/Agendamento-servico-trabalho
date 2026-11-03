import type {
  AlteracoesServico,
  NovoServicoDados,
  ServicoRegistro,
  ServicoRepository,
} from "@/app/application/servico-repository";

// Repositório em memória para os testes de integração — substitui o
// PrismaServicoRepository, então nenhum teste toca no banco.

export type ServicoArmazenado = ServicoRegistro & NovoServicoDados;

export const USUARIO_ATIVO_ID = "usuario-ativo";
export const USUARIO_INATIVO_ID = "usuario-inativo";

export class InMemoryServicoRepository implements ServicoRepository {
  readonly servicos = new Map<string, ServicoArmazenado>();

  readonly usuarios = new Map<string, { id: string; nome: string; ativo: boolean }>([
    [USUARIO_ATIVO_ID, { id: USUARIO_ATIVO_ID, nome: "Carlos", ativo: true }],
    [USUARIO_INATIVO_ID, { id: USUARIO_INATIVO_ID, nome: "Pedro", ativo: false }],
  ]);

  private proximoId = 1;

  async buscarPorId(id: string): Promise<ServicoRegistro | null> {
    const servico = this.servicos.get(id);
    return servico ? { ...servico } : null;
  }

  async criar(dados: NovoServicoDados): Promise<ServicoRegistro> {
    const servico: ServicoArmazenado = {
      ...dados,
      id: `servico-${this.proximoId++}`,
      status: "agendado",
      concluidoEm: null,
    };
    this.servicos.set(servico.id, servico);
    return { ...servico };
  }

  async atualizar(id: string, alteracoes: AlteracoesServico): Promise<void> {
    const servico = this.servicos.get(id);
    if (!servico) {
      throw new Error(`Serviço ${id} não existe.`);
    }
    this.servicos.set(id, { ...servico, ...alteracoes });
  }

  async buscarUsuarioAtivo(id: string): Promise<{ id: string } | null> {
    const usuario = this.usuarios.get(id);
    return usuario?.ativo ? { id: usuario.id } : null;
  }
}
