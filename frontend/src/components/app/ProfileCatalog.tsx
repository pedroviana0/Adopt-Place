import { useEffect, useMemo } from "react";
import { X } from "lucide-react";

import { AnimalShowcaseSkeleton } from "@/components/app/AnimalShowcaseSkeleton";
import { AsyncState } from "@/components/app/AsyncState";
import { PublicAnimalCard } from "@/components/app/PublicAnimalCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicProfileCatalog } from "@/lib/data/perfis";
import { porteLabel, sexoLabel } from "@/lib/domain/enums";
import {
  EMPTY_PROFILE_CATALOG_FILTERS,
  profileCatalogFilterSchema,
  type ProfileCatalogFilters,
} from "@/lib/schemas/public-profiles";

type ProfileCatalogProps = {
  catalog?: PublicProfileCatalog;
  filters: ProfileCatalogFilters;
  onFiltersChange: (filters: ProfileCatalogFilters) => void;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry: () => void;
  ownerKind?: "organização" | "acolhedor";
};

export function ProfileCatalog({
  catalog,
  filters,
  onFiltersChange,
  isLoading,
  isError,
  error,
  onRetry,
  ownerKind = "organização",
}: ProfileCatalogProps) {
  const ownerLabel = ownerKind === "acolhedor" ? "acolhedor" : "organização";
  const racas = useMemo(
    () =>
      filters.especieId
        ? (catalog?.filterOptions.racas ?? []).filter(
            (raca) => raca.especieId === filters.especieId,
          )
        : [],
    [catalog?.filterOptions.racas, filters.especieId],
  );
  const hasFilters = Boolean(
    filters.especieId || filters.racaId || filters.porte || filters.sexo,
  );

  useEffect(() => {
    if (filters.racaId && !racas.some((raca) => raca.id === filters.racaId)) {
      onFiltersChange(profileCatalogFilterSchema.parse({ ...filters, racaId: undefined, page: 1 }));
    }
  }, [filters, onFiltersChange, racas]);

  const updateFilters = (patch: Partial<ProfileCatalogFilters>) => {
    onFiltersChange(
      profileCatalogFilterSchema.parse({ ...filters, ...patch, page: 1 }),
    );
  };

  return (
    <section aria-labelledby="catalogo-perfil" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="catalogo-perfil" className="font-serif text-2xl font-semibold">
            Animais disponíveis
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Somente animais sob responsabilidade deste perfil de {ownerLabel}.
          </p>
        </div>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange(EMPTY_PROFILE_CATALOG_FILTERS)}
          >
            <X className="mr-1 h-4 w-4" aria-hidden="true" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="profile-species">Espécie</Label>
          <Select
            value={filters.especieId ?? "__all"}
            onValueChange={(value) =>
              updateFilters({
                especieId: value === "__all" ? undefined : value,
                racaId: undefined,
              })
            }
          >
            <SelectTrigger id="profile-species" className="mt-1 w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas</SelectItem>
              {(catalog?.filterOptions.especies ?? []).map((especie) => (
                <SelectItem key={especie.id} value={especie.id}>
                  {especie.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

          <div>
            <Label htmlFor="profile-breed">Raça</Label>
            <Select
              value={filters.racaId ?? "__all"}
              onValueChange={(value) =>
                updateFilters({ racaId: value === "__all" ? undefined : value })
              }
              disabled={!filters.especieId || racas.length === 0 || isLoading || isError}
            >
              <SelectTrigger id="profile-breed" className="mt-1 w-full">
                <SelectValue placeholder={!filters.especieId ? "Selecione uma espécie" : racas.length === 0 ? "Nenhuma raça disponível" : "Todas"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas</SelectItem>
                {racas.map((raca) => (
                  <SelectItem key={raca.id} value={raca.id}>
                    {raca.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        <div>
          <Label htmlFor="profile-size">Porte</Label>
          <Select
            value={filters.porte ?? "__all"}
            onValueChange={(value) =>
              updateFilters({
                porte:
                  value === "__all" ? undefined : (value as "P" | "M" | "G"),
              })
            }
          >
            <SelectTrigger id="profile-size" className="mt-1 w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              <SelectItem value="P">{porteLabel.P}</SelectItem>
              <SelectItem value="M">{porteLabel.M}</SelectItem>
              <SelectItem value="G">{porteLabel.G}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="profile-sex">Sexo</Label>
          <Select
            value={filters.sexo ?? "__all"}
            onValueChange={(value) =>
              updateFilters({
                sexo: value === "__all" ? undefined : (value as "M" | "F"),
              })
            }
          >
            <SelectTrigger id="profile-sex" className="mt-1 w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              <SelectItem value="M">{sexoLabel.M}</SelectItem>
              <SelectItem value="F">{sexoLabel.F}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={(catalog?.animals.length ?? 0) === 0}
        loadingLabel={`Carregando catálogo do ${ownerLabel}…`}
        loadingFallback={<AnimalShowcaseSkeleton cards={6} showFilters={false} />}
        errorTitle="Não foi possível carregar o catálogo"
        onRetry={onRetry}
        emptyState={{
          title: hasFilters
            ? "Nenhum animal corresponde aos filtros"
            : `Este perfil de ${ownerLabel} não possui animais disponíveis`,
          description: hasFilters
            ? "Remova os filtros para consultar o catálogo completo."
            : "Volte em outro momento ou conheça outros animais na vitrine.",
          action: hasFilters
            ? {
                label: "Limpar filtros",
                onClick: () => onFiltersChange(EMPTY_PROFILE_CATALOG_FILTERS),
              }
            : { label: "Ver vitrine", to: "/vitrine" },
        }}
      >
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {(catalog?.animals ?? []).map((animal) => (
              <PublicAnimalCard key={animal.id} animal={animal} />
            ))}
          </div>

          {(catalog?.pagination.totalPages ?? 1) > 1 && (
            <nav
              aria-label={`Paginação do catálogo do ${ownerLabel}`}
              className="mt-8 flex items-center justify-center gap-2"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filters.page === 1}
                onClick={() =>
                  onFiltersChange(
                    profileCatalogFilterSchema.parse({
                      ...filters,
                      page: Math.max(1, filters.page - 1),
                    }),
                  )
                }
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground" aria-live="polite">
                Página {catalog?.pagination.page ?? filters.page} de {catalog?.pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filters.page === catalog?.pagination.totalPages}
                onClick={() =>
                  onFiltersChange(
                    profileCatalogFilterSchema.parse({
                      ...filters,
                      page: Math.min(
                        catalog?.pagination.totalPages ?? filters.page,
                        filters.page + 1,
                      ),
                    }),
                  )
                }
              >
                Próxima
              </Button>
            </nav>
          )}
        </>
      </AsyncState>
    </section>
  );
}
