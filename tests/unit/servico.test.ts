import { describe, expect, it } from "vitest";
import { Servico, TransicaoInvalidaError, type DadosServico } from "@/app/domain/servico";

function criarServico(dados: Partial<DadosServico> = {}): Servico {
  return new Servico({
    status: "agendado",
    observacoes: null,
    responsavelId: null,
    concluidoEm: null,
    ...dados,
  });
}

const AGORA = new Date("2026-11-02T14:30:00Z");

describe("Servico — fluxo de status (RN01)", () => {
  it("agendado pode ir para concluido e cancelado", () => {
    const servico = criarServico();

    expect(servico.podeMudarPara("concluido")).toBe(true);
    expect(servico.podeMudarPara("cancelado")).toBe(true);
    expect(servico.podeMudarPara("agendado")).toBe(false);
    expect(servico.podeMudarPara("em_andamento")).toBe(false);
  });

  it("agendado é concluído", () => {
    const servico = criarServico();

    servico.concluir(undefined, undefined, AGORA);

    expect(servico.status).toBe("concluido");
  });

  it("agendado é cancelado", () => {
    const servico = criarServico();

    servico.cancelar();

    expect(servico.status).toBe("cancelado");
    expect(servico.concluidoEm).toBeNull();
  });

  it.each(["concluido", "cancelado"])("serviço %s não muda mais de status", (status) => {
    const servico = criarServico({ status });

    expect(servico.podeMudarPara("concluido")).toBe(false);
    expect(servico.podeMudarPara("cancelado")).toBe(false);
    expect(() => servico.concluir(undefined, undefined, AGORA)).toThrow(TransicaoInvalidaError);
    expect(() => servico.cancelar()).toThrow(TransicaoInvalidaError);
    expect(servico.status).toBe(status);
  });

  it("em_andamento legado pode ser concluído", () => {
    const servico = criarServico({ status: "em_andamento" });

    servico.concluir(undefined, undefined, AGORA);

    expect(servico.status).toBe("concluido");
    expect(servico.concluidoEm).toEqual(AGORA);
  });

  it("em_andamento legado pode ser cancelado", () => {
    const servico = criarServico({ status: "em_andamento" });

    servico.cancelar();

    expect(servico.status).toBe("cancelado");
  });
});

describe("Servico — conclusão", () => {
  it("concluir preenche concluidoEm", () => {
    const servico = criarServico();

    servico.concluir(undefined, undefined, AGORA);

    expect(servico.concluidoEm).toEqual(AGORA);
  });

  it("concluir define o responsável quando informado", () => {
    const servico = criarServico({ responsavelId: "usuario-a" });

    servico.concluir(undefined, "usuario-b", AGORA);

    expect(servico.responsavelId).toBe("usuario-b");
  });

  it("concluir mantém o responsável atual quando não informado", () => {
    const servico = criarServico({ responsavelId: "usuario-a" });

    servico.concluir(undefined, undefined, AGORA);

    expect(servico.responsavelId).toBe("usuario-a");
  });
});

describe("Servico — observações", () => {
  it("observação nova substitui a anterior", () => {
    const servico = criarServico({ observacoes: "Levar escada" });

    servico.concluir("Filtro trocado", undefined, AGORA);

    expect(servico.observacoes).toBe("Filtro trocado");
  });

  it("observação nova substitui a anterior também no cancelamento", () => {
    const servico = criarServico({ observacoes: "Levar escada" });

    servico.cancelar("Cliente desmarcou");

    expect(servico.observacoes).toBe("Cliente desmarcou");
  });

  it("sem observação nova, mantém a anterior", () => {
    const servico = criarServico({ observacoes: "Levar escada" });

    servico.concluir(undefined, undefined, AGORA);

    expect(servico.observacoes).toBe("Levar escada");
  });
});
