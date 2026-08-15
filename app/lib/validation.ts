import { z } from "zod";
import { TIPOS_SERVICO } from "@/app/lib/tipo-servico";

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
  responsavelId: z.string().min(1, { error: "Selecione o funcionário responsável." }),
  observacoes: z
    .string()
    .trim()
    .max(1000, { error: "Observações muito longas." })
    .optional()
    .or(z.literal("")),
});

export type NovoServicoInput = z.infer<typeof NovoServicoSchema>;

export const STATUS_SERVICO = [
  "agendado",
  "em_andamento",
  "concluido",
  "cancelado",
] as const;

export const MudarStatusSchema = z.object({
  servicoId: z.string().min(1, { error: "Serviço inválido." }),
  novoStatus: z.enum(STATUS_SERVICO, { error: "Status inválido." }),
  observacoesFinais: z
    .string()
    .trim()
    .max(1000, { error: "Observações muito longas." })
    .optional()
    .or(z.literal("")),
});

export type MudarStatusInput = z.infer<typeof MudarStatusSchema>;
