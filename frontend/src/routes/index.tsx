import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Home as HomeIcon, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PublicAnimalCard } from "@/components/app/PublicAnimalCard";
import { AnimalFilters, emptyFilters, type FilterState } from "@/components/app/AnimalFilters";
import { AsyncState } from "@/components/app/AsyncState";
import { AnimalShowcaseSkeleton } from "@/components/app/AnimalShowcaseSkeleton";
import { useState } from "react";
import { fetchVitrine, fetchPublicMetrics } from "@/lib/data/animais";
import { fetchCatalogos } from "@/lib/data/catalogos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdoptPlace — Encontre seu parceiro ideal" },
      {
        name: "description",
        content:
          "Conectamos animais resgatados a famílias prontas para adotar em Volta Redonda/RJ.",
      },
      { property: "og:title", content: "AdoptPlace — Encontre seu parceiro ideal" },
      {
        property: "og:description",
        content:
          "Adote com responsabilidade: animais resgatados por organizações e acolhedores de Volta Redonda/RJ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters());
  const [page, setPage] = useState(1);

  const catalogos = useQuery({ queryKey: ["catalogos"], queryFn: fetchCatalogos });
  const metricsQuery = useQuery({ queryKey: ["metrics"], queryFn: fetchPublicMetrics });
  const vitrine = useQuery({
    queryKey: ["vitrine", filters, page],
    queryFn: () => fetchVitrine({ ...filters, page }),
  });

  const paginados = vitrine.data?.animals ?? [];
  const pagination = vitrine.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalDisponiveis = pagination?.total ?? 0;

  const metrics = {
    disponiveis: metricsQuery.data?.availableAnimals ?? 0,
    adotados: metricsQuery.data?.completedAdoptions ?? 0,
    parceiros: metricsQuery.data?.responsibleParties ?? 0,
  };

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-secondary/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Volta Redonda/RJ · Adoção responsável
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-6xl">
              Encontre seu parceiro ideal
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              O AdoptPlace conecta animais resgatados por organizações e acolhedores independentes a
              famílias prontas para dar um lar cheio de amor.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#vitrine">
                  Ver animais disponíveis <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/cadastro/organizacao">Sou uma organização</Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              icon={<Heart className="h-5 w-5" />}
              label="Animais disponíveis"
              value={metrics.disponiveis}
            />
            <MetricCard
              icon={<HomeIcon className="h-5 w-5" />}
              label="Adoções realizadas"
              value={metrics.adotados}
            />
            <MetricCard
              icon={<Users className="h-5 w-5" />}
              label="Parceiros responsáveis"
              value={metrics.parceiros}
            />
          </div>
        </div>
      </section>

      {/* Vitrine */}
      <section id="vitrine" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold">Animais disponíveis</h2>
            <p className="text-sm text-muted-foreground">
              {totalDisponiveis} {totalDisponiveis === 1 ? "animal" : "animais"} para conhecer
            </p>
          </div>
        </div>

        <AnimalFilters
          value={filters}
          onChange={(v) => {
            setFilters(v);
            setPage(1);
          }}
          especies={catalogos.data?.especies}
          isCatalogLoading={catalogos.isLoading}
          isCatalogError={catalogos.isError}
          onRetryCatalog={() => catalogos.refetch()}
        />

        <AsyncState
          isLoading={vitrine.isLoading}
          isError={vitrine.isError}
          error={vitrine.error}
          isEmpty={paginados.length === 0}
          loadingLabel="Carregando animais disponíveis…"
          loadingFallback={<AnimalShowcaseSkeleton cards={8} showFilters={false} />}
          errorTitle="Não foi possível carregar os animais"
          onRetry={() => vitrine.refetch()}
          emptyState={{
            title: "Nenhum animal encontrado com esses critérios",
            description: "Ajuste ou limpe os filtros para explorar outros perfis disponíveis.",
            action: {
              label: "Limpar filtros",
              onClick: () => {
                setFilters(emptyFilters());
                setPage(1);
              },
            },
          }}
        >
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginados.map((a) => (
                <PublicAnimalCard key={a.id} animal={a} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        </AsyncState>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 font-serif text-3xl font-semibold">{value}</p>
    </div>
  );
}
