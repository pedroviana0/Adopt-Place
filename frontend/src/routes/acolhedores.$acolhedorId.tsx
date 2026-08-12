import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, MapPin } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { ProfileCatalog } from "@/components/app/ProfileCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/data/api";
import { fetchPublicFosterProfile } from "@/lib/data/perfis";
import {
  EMPTY_PROFILE_CATALOG_FILTERS,
  type ProfileCatalogFilters,
} from "@/lib/schemas/public-profiles";

export const Route = createFileRoute("/acolhedores/$acolhedorId")({
  head: () => ({
    meta: [
      { title: "Acolhedor — AdoptPlace" },
      { name: "description", content: "Conheça um acolhedor e seus animais disponíveis." },
    ],
  }),
  component: PublicFosterPage,
});

function PublicFosterPage() {
  const { acolhedorId } = Route.useParams();
  const [filters, setFilters] = useState<ProfileCatalogFilters>(
    EMPTY_PROFILE_CATALOG_FILTERS,
  );
  const query = useQuery({
    queryKey: ["public-foster", acolhedorId, filters],
    queryFn: () => fetchPublicFosterProfile(acolhedorId, filters),
  });
  const notFound = (query.error as ApiError | null)?.code === "PROFILE_NOT_FOUND";

  if (query.isLoading && !query.data) {
    return (
      <main className="page-canvas min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true" aria-label="Carregando perfil do acolhedor">
          <div className="flex flex-col gap-6 sm:flex-row">
            <Skeleton className="h-32 w-32 shrink-0 rounded-2xl" />
            <div className="w-full space-y-3">
              <Skeleton className="h-9 w-72 max-w-full" />
              <Skeleton className="h-5 w-52 max-w-full" />
              <Skeleton className="h-20 w-full max-w-2xl" />
            </div>
          </div>
          <Skeleton className="mt-10 h-28 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (query.isError && !query.data) {
    return (
      <main className="page-canvas min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <EmptyState
            icon={HeartHandshake}
            title={notFound ? "Acolhedor não encontrado" : "Não foi possível carregar o perfil"}
            description={notFound ? "Este perfil não existe ou não está disponível publicamente." : "Tente novamente ou conheça os animais disponíveis na vitrine."}
            action={{ label: "Ver vitrine", to: "/vitrine" }}
          />
        </div>
      </main>
    );
  }

  const data = query.data;
  if (!data) return null;
  const { profile } = data;

  return (
    <main className="page-canvas min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-surface-subtle">
            {profile.fotoUrl ? (
              <img src={profile.fotoUrl} alt={`Imagem do acolhedor ${profile.nome}`} className="h-full w-full object-cover" />
            ) : (
              <HeartHandshake className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Acolhedor independente</p>
            <h1 className="mt-1 break-words font-serif text-3xl font-semibold sm:text-4xl">{profile.nome}</h1>
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{profile.municipio} — {profile.uf}</span>
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {profile.descricao ?? "Este acolhedor ainda não adicionou uma descrição pública."}
            </p>
          </div>
        </header>

        <ProfileCatalog
          catalog={data.catalog}
          filters={filters}
          onFiltersChange={setFilters}
          isLoading={query.isFetching}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          ownerKind="acolhedor"
        />
      </div>
    </main>
  );
}
