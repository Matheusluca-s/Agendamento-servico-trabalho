import type { DadosServico } from "@/app/domain/servico";

// Contrato de persistência usado pelo ServicoService. A implementação real
// fica em app/infra (Prisma); os testes usam uma versão em memória.

export type ServicoRegistro = DadosServico & {
  id: string;
  data: Date;
};

export type NovoServicoDados = {
  local: string;
  endereco: string | null;
  data: Date;
  horario: string;
  tipoServico: string;
  responsavelId: string | null;
  observacoes: string | null;
};

// Só os campos presentes são gravados — o que ficar de fora mantém o valor
// atual no banco.
export type AlteracoesServico = {
  status?: string;
  observacoes?: string | null;
  responsavelId?: string;
  concluidoEm?: Date | null;
};

export interface ServicoRepository {
  buscarPorId(id: string): Promise<ServicoRegistro | null>;
  criar(dados: NovoServicoDados): Promise<ServicoRegistro>;
  atualizar(id: string, alteracoes: AlteracoesServico): Promise<void>;
  // Retorna null se o usuário não existe ou está inativo (RN03).
  buscarUsuarioAtivo(id: string): Promise<{ id: string } | null>;
}
