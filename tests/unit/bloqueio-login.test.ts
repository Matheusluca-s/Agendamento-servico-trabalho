import { describe, expect, it } from "vitest";
import { BLOQUEIO_MINUTOS, BloqueioLogin, MAX_TENTATIVAS } from "@/app/domain/bloqueio-login";

const AGORA = new Date("2026-11-02T14:30:00Z");
const minutosDepois = (minutos: number) => new Date(AGORA.getTime() + minutos * 60_000);

function semFalhas(): BloqueioLogin {
  return new BloqueioLogin({ tentativasFalhas: 0, bloqueadoAte: null });
}

describe("BloqueioLogin — força bruta (RN02)", () => {
  it("usa 5 tentativas e 10 minutos de bloqueio", () => {
    expect(MAX_TENTATIVAS).toBe(5);
    expect(BLOQUEIO_MINUTOS).toBe(10);
  });

  it("4 erros seguidos não bloqueiam", () => {
    const bloqueio = semFalhas();

    for (let i = 0; i < 4; i++) {
      expect(bloqueio.registrarFalha(AGORA)).toBe(false);
    }

    expect(bloqueio.tentativasFalhas).toBe(4);
    expect(bloqueio.estaBloqueado(AGORA)).toBe(false);
  });

  it("o 5º erro bloqueia por 10 minutos", () => {
    const bloqueio = semFalhas();
    for (let i = 0; i < 4; i++) bloqueio.registrarFalha(AGORA);

    expect(bloqueio.registrarFalha(AGORA)).toBe(true);

    expect(bloqueio.estaBloqueado(AGORA)).toBe(true);
    expect(bloqueio.bloqueadoAte).toEqual(minutosDepois(10));
    expect(bloqueio.minutosRestantes(AGORA)).toBe(10);
    expect(bloqueio.estaBloqueado(minutosDepois(9.9))).toBe(true);
    expect(bloqueio.minutosRestantes(minutosDepois(9.9))).toBe(1);
  });

  it("depois de 10 minutos libera", () => {
    const bloqueio = semFalhas();
    for (let i = 0; i < 5; i++) bloqueio.registrarFalha(AGORA);

    expect(bloqueio.estaBloqueado(minutosDepois(10))).toBe(false);
    expect(bloqueio.minutosRestantes(minutosDepois(10))).toBe(0);
  });

  it("ao bloquear, o contador de tentativas volta a zero", () => {
    const bloqueio = semFalhas();
    for (let i = 0; i < 5; i++) bloqueio.registrarFalha(AGORA);

    expect(bloqueio.tentativasFalhas).toBe(0);
  });

  it("sucesso zera as tentativas", () => {
    const bloqueio = new BloqueioLogin({ tentativasFalhas: 3, bloqueadoAte: null });

    expect(bloqueio.registrarSucesso()).toBe(true);

    expect(bloqueio.tentativasFalhas).toBe(0);
    expect(bloqueio.bloqueadoAte).toBeNull();
  });

  it("depois de um sucesso, precisa de mais 5 erros para bloquear", () => {
    const bloqueio = semFalhas();
    for (let i = 0; i < 4; i++) bloqueio.registrarFalha(AGORA);
    bloqueio.registrarSucesso();

    for (let i = 0; i < 4; i++) {
      expect(bloqueio.registrarFalha(AGORA)).toBe(false);
    }
    expect(bloqueio.estaBloqueado(AGORA)).toBe(false);
  });

  it("sucesso sem falhas anteriores não tem nada para zerar", () => {
    expect(semFalhas().registrarSucesso()).toBe(false);
  });
});
