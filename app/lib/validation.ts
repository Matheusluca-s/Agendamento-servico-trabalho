import { z } from "zod";
import { TIPOS_SERVICO, TODOS_STATUS } from "@/app/lib/tipo-servico";

export const LoginSchema = z.object({
  usuarioId: z.string().min(1, { error: "Selecione um usuário." }),
  pin: z.string().regex(/^\d{4}$/, { error: "O PIN deve ter 4 dígitos." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const NovoFuncionarioSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, { error: "O nome é obrigatório." })
      .max(100, { error: "Nome muito longo." }),
    pin: z.string().regex(/^\d{4}$/, { error: "O PIN deve ter 4 dígitos." }),
    pinConfirmacao: z
      .string()
      .regex(/^\d{4}$/, { error: "Confirme o PIN com 4 dígitos." }),
  })
  .refine((data) => data.pin === data.pinConfirmacao, {
    error: "Os PINs não coincidem.",
    path: ["pinConfirmacao"],
  });

export type NovoFuncionarioInput = z.infer<typeof NovoFuncionarioSchema>;

export const EditarFuncionarioSchema = z.object({
  usuarioId: z.string().min(1, { error: "Funcionário inválido." }),
  nome: z
    .string()
    .trim()
    .min(1, { error: "O nome é obrigatório." })
    .max(100, { error: "Nome muito longo." }),
});

export type EditarFuncionarioInput = z.infer<typeof EditarFuncionarioSchema>;

export const ResetarPinSchema = z
  .object({
    usuarioId: z.string().min(1, { error: "Funcionário inválido." }),
    novoPin: z.string().regex(/^\d{4}$/, { error: "O PIN deve ter 4 dígitos." }),
    novoPinConfirmacao: z
      .string()
      .regex(/^\d{4}$/, { error: "Confirme o PIN com 4 dígitos." }),
  })
  .refine((data) => data.novoPin === data.novoPinConfirmacao, {
    error: "Os PINs não coincidem.",
    path: ["novoPinConfirmacao"],
  });

export type ResetarPinInput = z.infer<typeof ResetarPinSchema>;

export const AlternarAtivoSchema = z.object({
  usuarioId: z.string().min(1, { error: "Funcionário inválido." }),
});

export type AlternarAtivoInput = z.infer<typeof AlternarAtivoSchema>;

export const ExcluirFuncionarioSchema = z.object({
  usuarioId: z.string().min(1, { error: "Funcionário inválido." }),
});

export type ExcluirFuncionarioInput = z.infer<typeof ExcluirFuncionarioSchema>;

export const NovoServicoSchema = z.object({
  local: z
    .string()
    .trim()
    .min(1, { error: "O local é obrigatório." })
    .max(150, { error: "Local muito longo." }),
  endereco: z
    .string()
    .trim()
    .max(200, { error: "Endereço muito longo." })
    .optional()
    .or(z.literal("")),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Selecione uma data válida." }),
  horario: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Selecione um horário válido." }),
  tipoServico: z.enum(TIPOS_SERVICO, { error: "Selecione o tipo de serviço." }),
  responsavelId: z.string().optional().or(z.literal("")),
  observacoes: z
    .string()
    .trim()
    .max(1000, { error: "Observações muito longas." })
    .optional()
    .or(z.literal("")),
});

export type NovoServicoInput = z.infer<typeof NovoServicoSchema>;

// "em_andamento" não é mais um destino válido de transição — fica de fora
// de propósito. Serviços antigos ainda podem ter esse status gravado (era
// uma etapa intermediária do fluxo antigo), só não é mais possível definir
// um serviço como "em_andamento" pela tela.
export const STATUS_SERVICO = ["agendado", "concluido", "cancelado"] as const;

export const MudarStatusSchema = z.object({
  servicoId: z.string().min(1, { error: "Serviço inválido." }),
  novoStatus: z.enum(STATUS_SERVICO, { error: "Status inválido." }),
  observacoes: z
    .string()
    .trim()
    .max(500, { error: "Observações muito longas (máximo 500 caracteres)." })
    .optional()
    .or(z.literal("")),
  // Só usado na transição pra "concluido" ("quem realizou o serviço") —
  // opcional, mantém o responsável atual se não vier preenchido.
  responsavelId: z.string().optional().or(z.literal("")),
});

export type MudarStatusInput = z.infer<typeof MudarStatusSchema>;

export const ExcluirServicoSchema = z.object({
  servicoId: z.string().min(1, { error: "Serviço inválido." }),
});

export type ExcluirServicoInput = z.infer<typeof ExcluirServicoSchema>;

// Filtros da visão geral de serviços (admin) — vêm da query string, então
// qualquer valor fora do esperado é descartado (cai pra "sem filtro") em
// vez de quebrar a página.
export const FiltroServicosSchema = z.object({
  status: z.enum(TODOS_STATUS).optional(),
  tipoServico: z.enum(TIPOS_SERVICO).optional(),
  responsavelId: z.string().min(1).optional(),
});

export type FiltroServicosInput = z.infer<typeof FiltroServicosSchema>;
