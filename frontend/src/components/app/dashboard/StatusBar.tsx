import { cn } from "@/lib/utils";
import type { StatusAnimal } from "@/lib/domain/enums";
import { statusSlices, type Tone } from "@/lib/dashboard-visual";
import { toneFillClass } from "./tone";

// Alinhado aos chips dos indicadores (C6): "não anunciado" é neutro.
const statusTone: Record<StatusAnimal, Tone> = {
  EM_CUIDADOS: "neutral",
  DISPONIVEL: "primary",
  EM_PROCESSO_ADOCAO: "accent",
  ADOTADO: "success",
};

// Spec 011 (US3, C6): barra empilhada decorativa + legenda escrita e clicável.
export function StatusBar({ counts }: { counts: Record<StatusAnimal, number> }) {
  const slices = statusSlices(counts);
  const empty = slices.every((slice) => slice.count === 0);

  return (
    <section aria-labelledby="painel-status" className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 id="painel-status" className="font-serif text-xl font-semibold">
        Meus animais por status
      </h2>

      {/* A largura é dado (proporção), não cor: por isso vai inline. */}
      <div aria-hidden="true" className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
        {slices
          .filter((slice) => slice.count > 0)
          .map((slice) => (
            <div
              key={slice.status}
              className={cn("h-full", toneFillClass[statusTone[slice.status]])}
              style={{ width: `${slice.fraction * 100}%` }}
            />
          ))}
      </div>

      {empty && <p className="mt-3 text-sm text-muted-foreground">Nenhum animal cadastrado ainda.</p>}

      <ul className="mt-4 grid gap-1 sm:grid-cols-2">
        {slices.map((slice) => (
          <li key={slice.status}>
            <a
              href={slice.href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <span
                aria-hidden="true"
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", toneFillClass[statusTone[slice.status]])}
              />
              <span>
                {slice.label} · <span className="tabular-nums">{slice.count}</span>{" "}
                <span className="text-muted-foreground tabular-nums">({slice.percent}%)</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
