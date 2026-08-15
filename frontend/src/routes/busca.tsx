import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchOrganizations } from "@/lib/data/busca-organizacoes";
import { organizationSearchTermSchema } from "@/lib/schemas/public-profiles";

export const Route = createFileRoute("/busca")({
  head: () => ({ meta: [{ title: "Buscar organizações — AdoptPlace" }] }),
  component: Page,
});

function Page() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const validation = organizationSearchTermSchema.safeParse(input);
  const query = useQuery({
    queryKey: ["busca-organizacoes", term],
    queryFn: () => searchOrganizations(term),
    enabled: Boolean(term),
  });

  return (
    <main className="page-canvas min-h-[calc(100dvh-10rem)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface-subtle text-primary shadow-sm">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Buscar organizações
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Encontre organizações pelo nome. Para proteger a privacidade, pessoas físicas não aparecem nesta busca.
          </p>
        </header>

        <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur sm:p-6">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
            onSubmit={(event) => {
              event.preventDefault();
              if (validation.success) setTerm(validation.data);
            }}
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="organization-search" className="mb-2 block text-sm font-medium">
                Nome da organização
              </label>
              <Input
                id="organization-search"
                maxLength={120}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ex.: Organização de Teste"
                aria-invalid={input.length > 0 && !validation.success}
              />
              {input.length > 0 && !validation.success && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {validation.error.issues[0]?.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="sm:mt-7 sm:min-w-28"
              disabled={!validation.success || query.isFetching}
            >
              <Search className="mr-2 h-4 w-4" />
              {query.isFetching ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </section>

        <div className="mx-auto mt-8 max-w-3xl" aria-live="polite">
          {query.isError && (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-card p-5 text-destructive">
              Não foi possível realizar a busca.
            </p>
          )}
          {term && query.isSuccess && query.data.length === 0 && (
            <section className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center">
              <h2 className="font-serif text-xl font-semibold">Nenhuma organização encontrada</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tente outro nome ou conheça os animais disponíveis.</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/vitrine">Ver animais disponíveis</Link>
              </Button>
            </section>
          )}
          {query.data && query.data.length > 0 && (
            <section aria-label="Resultados da busca">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                {query.data.length} {query.data.length === 1 ? "organização encontrada" : "organizações encontradas"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {query.data.map((organization) => (
                  <Link
                    key={organization.id}
                    to="/organizacoes/$organizacaoId"
                    params={{ organizacaoId: organization.id }}
                    className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-subtle text-primary">
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="break-words font-serif text-lg font-semibold group-hover:text-primary">
                          {organization.nome}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {organization.municipio} — {organization.uf}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
