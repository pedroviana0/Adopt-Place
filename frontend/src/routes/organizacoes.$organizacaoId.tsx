import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { ProfileCatalog } from "@/components/app/ProfileCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPublicOrganizationProfile } from "@/lib/data/perfis";
import type { ApiError } from "@/lib/data/api";
import {
  EMPTY_PROFILE_CATALOG_FILTERS,
  type ProfileCatalogFilters,
} from "@/lib/schemas/public-profiles";

export const Route = createFileRoute("/organizacoes/$organizacaoId")({
  head: () => ({
    meta: [
      { title: "Organização — AdoptPlace" },
      {
        name: "description",
        content: "Conheça uma organização e seus animais disponíveis para adoção.",
      },
    ],
  }),
  component: PublicOrganizationPage,
});

function PublicOrganizationPage() {
  const { organizacaoId } = Route.useParams();
  const [filters, setFilters] = useState<ProfileCatalogFilters>(
    EMPTY_PROFILE_CATALOG_FILTERS,
  );
  const query = useQuery({
    queryKey: ["public-organization", organizacaoId, filters],
    queryFn: () => fetchPublicOrganizationProfile(organizacaoId, filters),
  });
  const notFound = (query.error as ApiError | null)?.code === "PROFILE_NOT_FOUND";

  if (query.isLoading && !query.data) {
    return (
      <main className="page-canvas min-h-screen">
        <div
          className="mx-auto max-w-6xl px-4 py-10"
          aria-busy="true"
          aria-label="Carregando perfil da organização"
        >
          <div className="flex flex-col gap-6 sm:flex-row">
            <Skeleton className="h-32 w-32 shrink-0 rounded-2xl" />
            <div className="w-full space-y-3">
              <Skeleton className="h-9 w-72 max-w-full" />
              <Skeleton className="h-5 w-52 max-w-full" />
              <Skeleton className="h-20 w-full max-w-2xl" />
            </div>
          </div>
          <div className="mt-10">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="mt-5 h-28 w-full rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (query.isError && !query.data) {
    return (
      <main className="page-canvas min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <EmptyState
            icon={Building2}
            title={notFound ? "Organização não encontrada" : "Não foi possível carregar o perfil"}
            description={
              notFound
                ? "Este perfil não existe ou não está disponível publicamente."
                : "Tente novamente ou conheça os animais disponíveis na vitrine."
            }
            action={{ label: "Ver vitrine", to: "/vitrine" }}
          />
        </div>
      </main>
    );
  }

  const data = query.data;
  const profile = data?.profile;
  if (!data || !profile) return null;

  return (
    <main className="page-canvas min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-surface-subtle">
            {profile.fotoUrl ? (
              <img
                src={profile.fotoUrl}
                alt={`Imagem da organização ${profile.nome}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Organização</p>
            <h1 className="mt-1 break-words font-serif text-3xl font-semibold sm:text-4xl">
              {profile.nome}
            </h1>
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {profile.endereco}, {profile.municipio} — {profile.uf}
              </span>
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {profile.descricao ??
                "Esta organização ainda não adicionou uma descrição pública."}
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
        />
      </div>
    </main>
  );
}
