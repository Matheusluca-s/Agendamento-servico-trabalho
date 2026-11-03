import { beforeEach, describe, expect, it } from "vitest";
import { ServicoService } from "@/app/application/servico-service";
import {
  InMemoryServicoRepository,
  USUARIO_ATIVO_ID,
  USUARIO_INATIVO_ID,
} from "./InMemoryServicoRepository";

// Fluxo "cadastrar e concluir serviço" de ponta a ponta:
// validação Zod -> ServicoService -> domínio (Servico) -> repositório.

const AGORA = new Date("2026-11-02T17:45:00Z");

const servicoValido = {
  local: "Padaria Central",
  endereco: "Rua das Flores, 123",
  data: "2026-11-05",
  horario: "09:30",
  tipoServico: "manutencao",
  responsavelId: "",
  observacoes: "Levar escada",
};

describe("Cadastrar e concluir serviço", () => {
  let repositorio: InMemoryServicoRepository;
  let service: ServicoService;

  beforeEach(() => {
    repositorio = new InMemoryServicoRepository();
    service = new ServicoService(repositorio, () => AGORA);
  });

  it("cadastra um serviço válido e conclui informando quem fez", async () => {
    const cadastro = await service.cadastrar(servicoValido);

    expect(cadastro.ok).toBe(true);
    if (!cadastro.ok) return;
    expect(cadastro.data).toEqual(new Date(Date.UTC(2026, 10, 5)));

    const agendado = repositorio.servicos.get(cadastro.servicoId);
    expect(agendado).toMatchObject({
      local: "Padaria Central",
      status: "agendado",
      responsavelId: null,
      observacoes: "Levar escada",
      concluidoEm: null,
    });

    const conclusao = await service.mudarStatus({
      servicoId: cadastro.servicoId,
      novoStatus: "concluido",
      observacoes: "Filtro trocado e gás completado",
      responsavelId: USUARIO_ATIVO_ID,
    });

    expect(conclusao).toEqual({ ok: true, servicoId: cadastro.servicoId, data: cadastro.data });

    const concluido = repositorio.servicos.get(cadastro.servicoId);
    expect(concluido?.status).toBe("concluido");
    expect(concluido?.concluidoEm).toEqual(AGORA);
    expect(concluido?.responsavelId).toBe(USUARIO_ATIVO_ID);
    expect(concluido?.observacoes).toBe("Filtro trocado e gás completado");
  });

  it("recusa dados inválidos com a mensagem do Zod e não grava nada", async () => {
    const resultado = await service.cadastrar({ ...servicoValido, horario: "25:00" });

    expect(resultado).toEqual({ ok: false, erro: "Selecione um horário válido." });
    expect(repositorio.servicos.size).toBe(0);
  });

  it("recusa responsável inativo no cadastro", async () => {
    const resultado = await service.cadastrar({
      ...servicoValido,
      responsavelId: USUARIO_INATIVO_ID,
    });

    expect(resultado).toEqual({ ok: false, erro: "Funcionário responsável inválido." });
    expect(repositorio.servicos.size).toBe(0);
  });

  it("recusa responsável inativo na conclusão e mantém o serviço agendado", async () => {
    const cadastro = await service.cadastrar(servicoValido);
    if (!cadastro.ok) throw new Error(cadastro.erro);

    const resultado = await service.mudarStatus({
      servicoId: cadastro.servicoId,
      novoStatus: "concluido",
      observacoes: "",
      responsavelId: USUARIO_INATIVO_ID,
    });

    expect(resultado).toEqual({ ok: false, erro: "Funcionário selecionado é inválido." });
    const servico = repositorio.servicos.get(cadastro.servicoId);
    expect(servico?.status).toBe("agendado");
    expect(servico?.concluidoEm).toBeNull();
  });

  it("não permite mudar o status de um serviço já concluído", async () => {
    const cadastro = await service.cadastrar(servicoValido);
    if (!cadastro.ok) throw new Error(cadastro.erro);
    await service.mudarStatus({
      servicoId: cadastro.servicoId,
      novoStatus: "concluido",
      observacoes: "",
      responsavelId: "",
    });

    const resultado = await service.mudarStatus({
      servicoId: cadastro.servicoId,
      novoStatus: "cancelado",
      observacoes: "Tentativa de cancelar depois de concluído",
      responsavelId: "",
    });

    expect(resultado).toEqual({ ok: false, erro: "Essa mudança de status não é permitida." });
    const servico = repositorio.servicos.get(cadastro.servicoId);
    expect(servico?.status).toBe("concluido");
    expect(servico?.observacoes).toBe("Levar escada");
  });
});
