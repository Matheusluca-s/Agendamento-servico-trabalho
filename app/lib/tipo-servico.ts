export const TIPOS_SERVICO = [
  "instalacao",
  "manutencao",
  "limpeza",
  "outro",
] as const;

export type TipoServico = (typeof TIPOS_SERVICO)[number];

export const TIPO_SERVICO_LABEL: Record<TipoServico, string> = {
  instalacao: "Instalação",
  manutencao: "Manutenção",
  limpeza: "Limpeza",
  outro: "Outro",
};

// Classes Tailwind para cada tipo de serviço — usadas nos cards e na
// legenda, com suporte a dark mode.
export const TIPO_SERVICO_COR: Record<
  TipoServico,
  { bg: string; border: string; text: string; dot: string }
> = {
  instalacao: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-300 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  manutencao: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  limpeza: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    border: "border-emerald-300 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  outro: {
    bg: "bg-zinc-100 dark:bg-zinc-900",
    border: "border-zinc-300 dark:border-zinc-700",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-zinc-500",
  },
};

export function corDoTipoServico(tipo: string) {
  return TIPO_SERVICO_COR[tipo as TipoServico] ?? TIPO_SERVICO_COR.outro;
}

export function labelDoTipoServico(tipo: string): string {
  return TIPO_SERVICO_LABEL[tipo as TipoServico] ?? tipo;
}

export const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export function labelDoStatus(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

// Todos os status possíveis de aparecer num serviço, incluindo "em_andamento"
// (legado — não é mais um destino de transição, mas serviços antigos podem
// ter esse valor gravado). Usado pro filtro da visão geral de serviços.
export const TODOS_STATUS = ["agendado", "em_andamento", "concluido", "cancelado"] as const;

// Responsável é opcional — serviço pode não ter ninguém definido ainda.
export function nomeDoResponsavel(responsavel: { nome: string } | null): string {
  return responsavel?.nome ?? "Sem responsável";
}
