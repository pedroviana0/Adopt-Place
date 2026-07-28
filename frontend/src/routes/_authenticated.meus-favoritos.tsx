import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchFavoritos, setFavorito } from "@/lib/data/favoritos";
import { PublicAnimalCard } from "@/components/app/PublicAnimalCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";

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
  const favoritos = useQuery({ queryKey: ["favoritos"], queryFn: fetchFavoritos });

  const remover = async (animalId: string) => {
    try {
      await setFavorito(animalId, false);
      await queryClient.invalidateQueries({ queryKey: ["favoritos"] });
      toast.success("Removido dos favoritos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    }
  };

  const items = favoritos.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Meus favoritos</h1>
      {favoritos.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : favoritos.isError ? (
        <div className="mt-6">
          <EmptyState
            title="Não foi possível carregar seus favoritos"
            action={{ label: "Tentar novamente", onClick: () => favoritos.refetch() }}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Você ainda não favoritou nenhum animal"
            action={{ label: "Ver vitrine", to: "/vitrine" }}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((f) => (
            <div key={f.animalId} className="space-y-2">
              <PublicAnimalCard animal={f.animal} />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => remover(f.animalId)}
              >
                Remover dos favoritos
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
