import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchFavoritos, setFavorito } from "@/lib/data/favoritos";
import { PublicAnimalCard } from "@/components/app/PublicAnimalCard";
import { Button } from "@/components/ui/button";
import { AsyncState } from "@/components/app/AsyncState";
import { AnimalShowcaseSkeleton } from "@/components/app/AnimalShowcaseSkeleton";
import { useState } from "react";
import { HeartOff, LoaderCircle } from "lucide-react";
import { removerPulado } from "@/lib/data/feels";

export const Route = createFileRoute("/_authenticated/meus-favoritos")({
  head: () => ({
    meta: [
      { title: "Meus favoritos — AdoptPlace" },
      { name: "description", content: "Animais que você favoritou." },
    ],
  }),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const [pendingAnimalId, setPendingAnimalId] = useState<string | null>(null);
  const favoritos = useQuery({ queryKey: ["favoritos"], queryFn: fetchFavoritos });

  const remover = async (animalId: string) => {
    setPendingAnimalId(animalId);
    try {
      await setFavorito(animalId, false);
      removerPulado(animalId);
      await queryClient.invalidateQueries({ queryKey: ["feels"] });
      await queryClient.invalidateQueries({ queryKey: ["favoritos"] });
      toast.success("Removido dos favoritos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setPendingAnimalId(null);
    }
  };

  const items = favoritos.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Meus favoritos</h1>
      <AsyncState
        isLoading={favoritos.isLoading}
        isError={favoritos.isError}
        error={favoritos.error}
        isEmpty={items.length === 0}
        loadingLabel="Carregando seus favoritos…"
        loadingFallback={<AnimalShowcaseSkeleton cards={4} showFilters={false} />}
        errorTitle="Não foi possível carregar seus favoritos"
        onRetry={() => favoritos.refetch()}
        emptyState={{
          title: "Você ainda não favoritou nenhum animal",
          description: "Explore a vitrine e salve os animais que deseja conhecer melhor.",
          action: { label: "Ver vitrine", to: "/vitrine" },
        }}
      >
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((f) => (
            <div key={f.animalId} className="relative h-full rounded-xl">
              <PublicAnimalCard animal={f.animal} />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-3 top-3 z-10 gap-1.5 rounded-full border border-border bg-card/95 px-3 shadow-floating backdrop-blur hover:bg-card"
                disabled={pendingAnimalId === f.animalId}
                onClick={() => remover(f.animalId)}
                aria-label={`Remover ${f.animal.nome} dos favoritos`}
              >
                {pendingAnimalId === f.animalId ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <HeartOff className="h-4 w-4 text-destructive" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {pendingAnimalId === f.animalId ? "Removendo…" : "Remover"}
                </span>
              </Button>
            </div>
          ))}
        </div>
      </AsyncState>
    </div>
  );
}
