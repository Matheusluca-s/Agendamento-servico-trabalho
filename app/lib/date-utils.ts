// Todas as datas aqui são tratadas como "dia de calendário" em UTC, sem hora.
// Isso bate exatamente com o campo Servico.data (timestamp sem timezone no
// Postgres — o Prisma o expõe como Date com getUTCFullYear/Month/Date iguais
// aos valores gravados). O horário de exibição vem do campo Servico.horario,
// não da parte de hora de `data`.

const FUSO_HORARIO = "America/Sao_Paulo";

export function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string | undefined): Date | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Garante que a data é válida (ex: rejeita 2026-02-30).
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

export function addDays(date: Date, dias: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + dias),
  );
}

export function addMonths(date: Date, meses: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + meses, 1));
}

// Semana começa na segunda-feira.
export function startOfWeek(date: Date): Date {
  const diaSemana = date.getUTCDay(); // 0 = domingo
  const offset = (diaSemana + 6) % 7; // segunda-feira = 0
  return addDays(date, -offset);
}

export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function getWeekDays(anchor: Date): Date[] {
  const inicio = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
}

// Grade de 6 semanas (42 dias) cobre qualquer mês, incluindo os dias de
// preenchimento do mês anterior/seguinte.
export function getMonthGrid(anchor: Date): Date[] {
  const inicioGrade = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: 42 }, (_, i) => addDays(inicioGrade, i));
}

// "Hoje" no fuso horário de Brasília, convertido para um Date UTC-meia-noite
// (mesma representação usada pros dias do calendário) — evita que o
// destaque do dia atual fique errado perto da meia-noite se o servidor
// rodar em UTC (padrão na Vercel).
export function hojeBrasil(): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_HORARIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(partes.find((p) => p.type === "year")?.value);
  const m = Number(partes.find((p) => p.type === "month")?.value);
  const d = Number(partes.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatWeekdayShort(date: Date): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
  return texto.replace(".", "");
}

export function formatDayNumber(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatMonthYear(date: Date): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatDiaCompleto(date: Date): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Para timestamps reais (ex: concluidoEm), diferente das demais funções
// acima que tratam datas como "dia de calendário" em UTC.
export function formatDataHora(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO_HORARIO,
  }).format(date);
}

export function formatWeekRangeLabel(dias: Date[]): string {
  const inicio = dias[0];
  const fim = dias[dias.length - 1];
  const mesInicio = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  }).format(inicio);
  const mesFim = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  }).format(fim);
  const diaInicio = formatDayNumber(inicio);
  const diaFim = formatDayNumber(fim);

  if (mesInicio === mesFim) {
    return `${diaInicio} – ${diaFim} de ${mesFim.replace(".", "")}`;
  }
  return `${diaInicio} de ${mesInicio.replace(".", "")} – ${diaFim} de ${mesFim.replace(".", "")}`;
}
