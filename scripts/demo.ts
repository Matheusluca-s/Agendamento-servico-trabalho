// Demonstração pelo terminal do fluxo "cadastrar e concluir serviço" e do
// bloqueio de login, sem banco de dados: usa o ServicoService com o
// repositório em memória (o mesmo dos testes de integração).
//
// Uso:
//   npm run demo

import { ServicoService } from "@/app/application/servico-service";
import { BloqueioLogin, MAX_TENTATIVAS } from "@/app/domain/bloqueio-login";
import {
  InMemoryServicoRepository,
  USUARIO_ATIVO_ID,
} from "../tests/support/InMemoryServicoRepository";

const repositorio = new InMemoryServicoRepository();
const service = new ServicoService(repositorio);

function titulo(numero: number, texto: string): void {
  console.log(`\n${numero}. ${texto}`);
  console.log("-".repeat(60));
}

function formatar(data: Date | null): string {
  return data
    ? data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "(vazio)";
}

async function main(): Promise<void> {
  console.log("Climar — demonstração pelo terminal (sem banco de dados)");

  titulo(1, "Cadastro de um serviço válido");
  const cadastro = await service.cadastrar({
    local: "Padaria Central",
    endereco: "Rua das Flores, 123",
    data: "2026-11-05",
    horario: "09:30",
    tipoServico: "manutencao",
    responsavelId: "",
    observacoes: "Levar escada",
  });
  if (!cadastro.ok) {
    throw new Error(`Falha inesperada no cadastro: ${cadastro.erro}`);
  }
  const agendado = repositorio.servicos.get(cadastro.servicoId)!;
  console.log(`✔ Serviço cadastrado (id: ${cadastro.servicoId})`);
  console.log(`  Local:        ${agendado.local}`);
  console.log(`  Data:         ${agendado.data.toISOString().slice(0, 10)} às ${agendado.horario}`);
  console.log(`  Status:       ${agendado.status}`);
  console.log(`  Observação:   ${agendado.observacoes}`);

  titulo(2, "Conclusão do serviço informando quem fez");
  const conclusao = await service.mudarStatus({
    servicoId: cadastro.servicoId,
    novoStatus: "concluido",
    observacoes: "Filtro trocado e gás completado",
    responsavelId: USUARIO_ATIVO_ID,
  });
  if (!conclusao.ok) {
    throw new Error(`Falha inesperada na conclusão: ${conclusao.erro}`);
  }
  const concluido = repositorio.servicos.get(cadastro.servicoId)!;
  console.log("✔ Serviço concluído");
  console.log(`  Status:       ${concluido.status}`);
  console.log(`  Concluído em: ${formatar(concluido.concluidoEm)}`);
  console.log(
    `  Quem fez:     ${repositorio.usuarios.get(concluido.responsavelId!)?.nome} (id: ${concluido.responsavelId})`,
  );
  console.log(`  Observação:   ${concluido.observacoes}`);

  titulo(3, "Tentativa de cancelar o serviço já concluído (erro esperado)");
  const recancelamento = await service.mudarStatus({
    servicoId: cadastro.servicoId,
    novoStatus: "cancelado",
    observacoes: "",
    responsavelId: "",
  });
  if (recancelamento.ok) {
    throw new Error("O serviço concluído não deveria poder mudar de status.");
  }
  console.log(`✘ Recusado: ${recancelamento.erro}`);
  console.log(`  Status continua: ${repositorio.servicos.get(cadastro.servicoId)!.status}`);

  titulo(4, 'Tentativa de cadastrar com horário inválido "25:00" (erro esperado)');
  const totalAntes = repositorio.servicos.size;
  const invalido = await service.cadastrar({
    local: "Escritório Norte",
    endereco: "",
    data: "2026-11-06",
    horario: "25:00",
    tipoServico: "limpeza",
    responsavelId: "",
    observacoes: "",
  });
  if (invalido.ok) {
    throw new Error("O horário 25:00 não deveria ser aceito.");
  }
  console.log(`✘ Recusado: ${invalido.erro}`);
  console.log(
    `  Serviços gravados: ${repositorio.servicos.size} (antes: ${totalAntes}) — nada foi gravado`,
  );

  titulo(5, `Simulação de ${MAX_TENTATIVAS} PINs errados seguidos (erro esperado)`);
  const agora = new Date();
  const bloqueio = new BloqueioLogin({ tentativasFalhas: 0, bloqueadoAte: null });
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const bloqueou = bloqueio.registrarFalha(agora);
    console.log(
      `  PIN errado #${tentativa} → ${bloqueou ? "BLOQUEADO" : "ainda liberado"}`,
    );
  }
  if (!bloqueio.estaBloqueado(agora)) {
    throw new Error("O login deveria estar bloqueado após 5 erros.");
  }
  const minutos = bloqueio.minutosRestantes(agora);
  console.log(
    `✘ Login bloqueado: Muitas tentativas erradas. Tente novamente em ${minutos} minutos.`,
  );
  console.log(`  Bloqueado até: ${formatar(bloqueio.bloqueadoAte)}`);

  console.log("\nDemonstração concluída: todos os cenários se comportaram como esperado.");
}

main().catch((error: unknown) => {
  console.error("\nA demonstração falhou:", error);
  process.exitCode = 1;
});
