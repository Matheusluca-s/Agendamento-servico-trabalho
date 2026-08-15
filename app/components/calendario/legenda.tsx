import { TIPOS_SERVICO, corDoTipoServico, labelDoTipoServico } from "@/app/lib/tipo-servico";

export function LegendaTipoServico() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
      {TIPOS_SERVICO.map((tipo) => {
        const cor = corDoTipoServico(tipo);
        return (
          <div key={tipo} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cor.dot}`} />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {labelDoTipoServico(tipo)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
