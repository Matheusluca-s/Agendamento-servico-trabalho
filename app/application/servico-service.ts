import { Servico } from "@/app/domain/servico";
import { parseDateKey } from "@/app/lib/date-utils";
import { MudarStatusSchema, NovoServicoSchema } from "@/app/lib/validation";
import type { AlteracoesServico, ServicoRepository } from "@/app/application/servico-repository";

// Casos de uso de serviço: validação (Zod) -> regras de domínio -> repositório.
// Não conhece Next.js nem Prisma — a Server Action só monta a entrada a partir
// do FormData e trata o resultado (redirect/revalidatePath).

export type EntradaCadastrarServico = {
  local: unknown;
  endereco: unknown;
  data: unknown;
  horario: unknown;
  tipoServico: unknown;
  responsavelId: unknown;
  observacoes: unknown;
};

export type EntradaMudarStatus = {
  servicoId: unknown;
  novoStatus: unknown;
  observacoes: unknown;
  responsavelId: unknown;
};

export type ResultadoServico =
  | { ok: true; servicoId: string; data: Date }
  | { ok: false; erro: string };

export class ServicoService {
  constructor(
    private readonly repositorio: ServicoRepository,
    private readonly agora: () => Date = () => new Date(),
  ) {}

  async cadastrar(dados: EntradaCadastrarServico): Promise<ResultadoServico> {
    const validatedFields = NovoServicoSchema.safeParse(dados);
    if (!validatedFields.success) {
      return { ok: false, erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
    }

    const { local, endereco, data, horario, tipoServico, responsavelId, observacoes } =
      validatedFields.data;

    const dataServico = parseDateKey(data);
    if (!dataServico) {
      return { ok: false, erro: "Selecione uma data válida." };
    }

    // Responsável é opcional — só valida se algum foi selecionado (RN03).
    if (responsavelId && !(await this.repositorio.buscarUsuarioAtivo(responsavelId))) {
      return { ok: false, erro: "Funcionário responsável inválido." };
    }

    const servico = await this.repositorio.criar({
      local,
      endereco: endereco || null,
      data: dataServico,
      horario,
      tipoServico,
      responsavelId: responsavelId || null,
      observacoes: observacoes || null,
    });

    return { ok: true, servicoId: servico.id, data: servico.data };
  }

  async mudarStatus(dados: EntradaMudarStatus): Promise<ResultadoServico> {
    const validatedFields = MudarStatusSchema.safeParse(dados);
    if (!validatedFields.success) {
      return { ok: false, erro: validatedFields.error.issues[0]?.message ?? "Dados inválidos." };
    }

    const { servicoId, novoStatus, observacoes, responsavelId } = validatedFields.data;

    const registro = await this.repositorio.buscarPorId(servicoId);
    if (!registro) {
      return { ok: false, erro: "Serviço não encontrado." };
    }

    // Checagem da transição sempre no servidor — nunca confia no botão que o
    // cliente conseguiu clicar.
    const servico = new Servico(registro);
    if (!servico.podeMudarPara(novoStatus)) {
      return { ok: false, erro: "Essa mudança de status não é permitida." };
    }

    // "Quem realizou o serviço" só se aplica na conclusão — ignora esse
    // campo silenciosamente pra qualquer outra transição, mesmo que um
    // cliente malicioso tente enviá-lo junto de "cancelado".
    let novoResponsavelId: string | undefined;
    if (novoStatus === "concluido" && responsavelId) {
      if (!(await this.repositorio.buscarUsuarioAtivo(responsavelId))) {
        return { ok: false, erro: "Funcionário selecionado é inválido." };
      }
      novoResponsavelId = responsavelId;
    }

    if (novoStatus === "concluido") {
      servico.concluir(observacoes || undefined, novoResponsavelId, this.agora());
    } else if (novoStatus === "cancelado") {
      servico.cancelar(observacoes || undefined);
    }

    // Só grava os campos que a regra de domínio de fato alterou.
    const alteracoes: AlteracoesServico = { status: servico.status };
    if (observacoes) alteracoes.observacoes = servico.observacoes;
    if (novoResponsavelId) alteracoes.responsavelId = novoResponsavelId;
    if (servico.concluidoEm !== registro.concluidoEm) alteracoes.concluidoEm = servico.concluidoEm;

    await this.repositorio.atualizar(servicoId, alteracoes);

    return { ok: true, servicoId, data: registro.data };
  }
}
