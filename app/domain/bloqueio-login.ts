// Regras de bloqueio de login por força bruta (RN02). Classe pura: não
// depende de Prisma, Next.js nem de nada do servidor, pra poder ser testada
// isoladamente.

export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_MINUTOS = 10;

export type DadosBloqueioLogin = {
  tentativasFalhas: number;
  bloqueadoAte: Date | null;
};

export class BloqueioLogin {
  tentativasFalhas: number;
  bloqueadoAte: Date | null;

  constructor(dados: DadosBloqueioLogin) {
    this.tentativasFalhas = dados.tentativasFalhas;
    this.bloqueadoAte = dados.bloqueadoAte;
  }

  estaBloqueado(agora: Date): boolean {
    return this.bloqueadoAte !== null && this.bloqueadoAte > agora;
  }

  minutosRestantes(agora: Date): number {
    if (!this.estaBloqueado(agora)) {
      return 0;
    }
    return Math.ceil((this.bloqueadoAte!.getTime() - agora.getTime()) / 60_000);
  }

  // Retorna true se essa falha disparou o bloqueio. Ao bloquear, o contador
  // volta a zero — depois do bloqueio o usuário tem mais 5 tentativas.
  registrarFalha(agora: Date): boolean {
    const tentativas = this.tentativasFalhas + 1;
    if (tentativas >= MAX_TENTATIVAS) {
      this.tentativasFalhas = 0;
      this.bloqueadoAte = new Date(agora.getTime() + BLOQUEIO_MINUTOS * 60_000);
      return true;
    }
    this.tentativasFalhas = tentativas;
    return false;
  }

  // Retorna true se havia algo pra zerar (evita um update desnecessário).
  registrarSucesso(): boolean {
    const haviaEstado = this.tentativasFalhas > 0 || this.bloqueadoAte !== null;
    this.tentativasFalhas = 0;
    this.bloqueadoAte = null;
    return haviaEstado;
  }
}
