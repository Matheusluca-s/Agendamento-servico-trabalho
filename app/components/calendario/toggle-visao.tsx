import Link from "next/link";

export function ToggleVisao({
  visao,
  hrefSemana,
  hrefMes,
}: {
  visao: "semana" | "mes";
  hrefSemana: string;
  hrefMes: string;
}) {
  const base =
    "flex h-10 flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors";
  const ativo = "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50";
  const inativo =
    "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200";

  return (
    <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
      <Link
        href={hrefSemana}
        className={`${base} ${visao === "semana" ? ativo : inativo}`}
      >
        Semana
      </Link>
      <Link href={hrefMes} className={`${base} ${visao === "mes" ? ativo : inativo}`}>
        Mês
      </Link>
    </div>
  );
}
