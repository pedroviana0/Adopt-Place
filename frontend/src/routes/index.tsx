import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PawPrint } from "lucide-react";
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
  const featuredQuery = useQuery({
    queryKey: ["featured-animal"],
    queryFn: () => fetchVitrine({ ...emptyFilters(), page: 1 }),
  });
  const featured = featuredQuery.data?.animals?.[0] ?? null;

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
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-brand/20 via-brand/5 to-secondary/30">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="font-display text-6xl font-bold leading-[1.02] tracking-tight text-primary md:text-7xl lg:text-8xl">
              Uma vida mais feliz começa com a{" "}
              <span className="text-brand">adoção</span>.
            </h1>
            <p className="mt-6 max-w-md text-xl text-muted-foreground md:text-2xl">
              Encontre o companheiro ideal entre animais resgatados pertinho de você.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-brand px-7 text-brand-foreground hover:bg-brand/90"
              >
                <a href="#vitrine">
                  Adotar agora <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full">
                <Link to="/cadastro/organizacao">Sou uma organização</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">{metrics.disponiveis}</strong>{" "}
              disponíveis ·{" "}
              <strong className="font-semibold text-foreground">{metrics.adotados}</strong>{" "}
              adoções ·{" "}
              <strong className="font-semibold text-foreground">{metrics.parceiros}</strong>{" "}
              parceiros
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <HeroBlobPhoto
              src={featured?.fotoPrincipal ?? null}
              alt={featured ? `${featured.nome}, disponível para adoção` : "Animais para adoção"}
            />
            <div className="absolute -bottom-2 left-0 sm:-left-2">
              <PawBadge />
            </div>
            {featured && (
              <Link
                to="/animais/$animalId"
                params={{ animalId: featured.id }}
                className="absolute bottom-3 right-1 rounded-full bg-background/85 px-3 py-1.5 text-sm font-medium text-foreground shadow-md backdrop-blur transition hover:bg-background"
              >
                Conheça {featured.nome} →
              </Link>
            )}
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

// Blob orgânico do hero (foto do animal recortada numa forma teal).
const HERO_BLOB =
  "M411.5,308Q392,366,340,397.5Q288,429,229.5,420Q171,411,120,378Q69,345,60.5,287.5Q52,230,72,175Q92,120,143,86Q194,52,255,58.5Q316,65,362,102Q408,139,421,194.5Q434,250,411.5,308Z";

function HeroBlobPhoto({ src, alt }: { src: string | null; alt: string }) {
  return (
    <svg viewBox="0 0 480 480" className="h-auto w-full" role="img" aria-label={alt}>
      <defs>
        <clipPath id="heroBlobClip">
          <path d={HERO_BLOB} />
        </clipPath>
      </defs>
      {/* halo teal atrás da foto */}
      <path
        d={HERO_BLOB}
        transform="translate(240 240) scale(1.07) translate(-240 -240)"
        fill="var(--color-primary)"
      />
      {src ? (
        <image
          href={src}
          x="0"
          y="0"
          width="480"
          height="480"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#heroBlobClip)"
        />
      ) : (
        <rect width="480" height="480" fill="var(--color-secondary)" clipPath="url(#heroBlobClip)" />
      )}
    </svg>
  );
}

function PawBadge() {
  return (
    <div className="relative grid h-24 w-24 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg sm:h-28 sm:w-28">
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full animate-[spin_18s_linear_infinite] motion-reduce:animate-none"
        aria-hidden="true"
      >
        <defs>
          <path id="pawBadgeCircle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <text fill="currentColor" fontSize="12" fontWeight="700" letterSpacing="2.4">
          <textPath href="#pawBadgeCircle" startOffset="0">
            ADOTAR · AMAR · CUIDAR · ADOTAR · AMAR ·{" "}
          </textPath>
        </text>
      </svg>
      <PawPrint className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
      <span className="sr-only">Adotar, amar, cuidar</span>
    </div>
  );
}
