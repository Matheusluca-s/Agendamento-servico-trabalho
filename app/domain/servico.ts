// Regras de negócio do serviço (RN01 — fluxo de status). Classe pura: não
// depende de Prisma, Next.js nem de nada do servidor, pra poder ser testada
// isoladamente.

// Fluxo de status: agendado -> concluido, com cancelado possível a
// qualquer momento a partir de agendado. "em_andamento" era uma etapa
// intermediária do fluxo antigo — não é mais um destino válido, mas
// serviços antigos com esse status ainda podem ser concluídos ou
// cancelados normalmente.
export const TRANSICOES_VALIDAS: Record<string, readonly string[]> = {
  agendado: ["concluido", "cancelado"],
  em_andamento: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
};

export class TransicaoInvalidaError extends Error {
  constructor(
    readonly statusAtual: string,
    readonly novoStatus: string,
  ) {
    super(`Transição de status inválida: ${statusAtual} -> ${novoStatus}.`);
    this.name = "TransicaoInvalidaError";
  }
}

export type DadosServico = {
  status: string;
  observacoes: string | null;
  responsavelId: string | null;
  concluidoEm: Date | null;
};

export class Servico {
  status: string;
  observacoes: string | null;
  responsavelId: string | null;
  concluidoEm: Date | null;

  constructor(dados: DadosServico) {
    this.status = dados.status;
    this.observacoes = dados.observacoes;
    this.responsavelId = dados.responsavelId;
    this.concluidoEm = dados.concluidoEm;
  }

  podeMudarPara(novoStatus: string): boolean {
    return TRANSICOES_VALIDAS[this.status]?.includes(novoStatus) ?? false;
  }

  // `responsavelId` é quem realmente fez o serviço — se vier vazio, mantém
  // o responsável atual. A checagem de que é um usuário ativo (RN03) fica
  // com quem chama, já que depende do banco.
  concluir(observacao: string | undefined, responsavelId: string | undefined, agora: Date): void {
    this.mudarStatus("concluido", observacao);
    if (responsavelId) {
      this.responsavelId = responsavelId;
    }
    this.concluidoEm = agora;
  }

  cancelar(observacao?: string): void {
    this.mudarStatus("cancelado", observacao);
  }

  private mudarStatus(novoStatus: string, observacao: string | undefined): void {
    if (!this.podeMudarPara(novoStatus)) {
      throw new TransicaoInvalidaError(this.status, novoStatus);
    }
    this.status = novoStatus;
    // Se preenchida, substitui a observação atual (não acumula histórico);
    // se vazia, mantém a que já existia.
    if (observacao) {
      this.observacoes = observacao;
    }
  }
}
