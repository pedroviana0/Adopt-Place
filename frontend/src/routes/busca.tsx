import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

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
    <main className="page-canvas space-y-8 py-10">
      <header>
        <h1 className="font-serif text-3xl font-semibold">Buscar organizações</h1>
        <p className="mt-1 text-muted-foreground">Encontre organizações pelo nome. Pessoas físicas não aparecem nesta busca.</p>
      </header>
      <form
        className="flex max-w-2xl flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (validation.success) setTerm(validation.data);
        }}
      >
        <div className="flex-1">
          <label htmlFor="organization-search" className="sr-only">Nome da organização</label>
          <Input id="organization-search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nome da organização" aria-invalid={input.length > 0 && !validation.success} />
          {input.length > 0 && !validation.success && <p role="alert" className="mt-1 text-sm text-destructive">{validation.error.issues[0]?.message}</p>}
        </div>
        <Button type="submit" disabled={!validation.success || query.isFetching}><Search className="mr-2 h-4 w-4" />{query.isFetching ? "Buscando..." : "Buscar"}</Button>
      </form>
      {query.isError && <p role="alert" className="text-destructive">Não foi possível realizar a busca.</p>}
      {term && query.isSuccess && query.data.length === 0 && (
        <section className="rounded-xl border border-dashed p-6"><h2 className="font-serif text-xl font-semibold">Nenhuma organização encontrada</h2><Button asChild variant="link" className="px-0"><Link to="/vitrine">Ver animais disponíveis</Link></Button></section>
      )}
      {query.data && query.data.length > 0 && (
        <section aria-label="Resultados da busca" className="grid gap-3 sm:grid-cols-2">
          {query.data.map((organization) => (
            <Link key={organization.id} to="/organizacoes/$organizacaoId" params={{ organizacaoId: organization.id }} className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted">
              <h2 className="font-serif text-xl font-semibold">{organization.nome}</h2>
              <p className="text-sm text-muted-foreground">{organization.municipio} — {organization.uf}</p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
