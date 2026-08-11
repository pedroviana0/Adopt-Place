import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AnimalForm } from "@/components/app/AnimalForm";
import { AnimalPhotosPanel } from "@/components/app/AnimalPhotosPanel";
import { HealthPanel } from "@/components/app/HealthPanel";
import { RelatedAnimalsPanel } from "@/components/app/RelatedAnimalsPanel";
import { useSessao } from "@/lib/data/hooks";
import { fetchAnimalGerenciado, excluirAnimal } from "@/lib/data/animais";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AsyncState } from "@/components/app/AsyncState";
import { ConfirmDestructiveAction } from "@/components/app/ConfirmDestructiveAction";

export const Route = createFileRoute("/_authenticated/dashboard/animais/$animalId")({
  head: () => ({
    meta: [
      { title: "Editar animal — AdoptPlace" },
      { name: "description", content: "Atualize os dados, saúde e vínculos do animal." },
    ],
  }),
  component: Page,
});

function Page() {
  const { animalId } = Route.useParams();
  const s = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (s && s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR") {
      navigate({ to: "/dashboard" });
    }
  }, [s, navigate]);

  const animalQuery = useQuery({
    queryKey: ["animal-gerenciado", animalId],
    queryFn: () => fetchAnimalGerenciado(animalId),
    enabled: s?.tipoPerfil === "ORGANIZACAO" || s?.tipoPerfil === "ACOLHEDOR",
  });

  if (!s || (s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR")) return null;

  if (animalQuery.isLoading || animalQuery.isError || !animalQuery.data)
    return (
      <AsyncState
        isLoading={animalQuery.isLoading}
        isError={animalQuery.isError}
        error={animalQuery.error}
        isEmpty={!animalQuery.isLoading && !animalQuery.isError && !animalQuery.data}
        onRetry={() => animalQuery.refetch()}
        emptyState={{
          title: "Animal não encontrado",
          description: "O animal pode ter sido removido ou não estar disponível para este perfil.",
          action: { label: "Voltar aos animais", to: "/dashboard/animais" },
        }}
      >
        <span />
      </AsyncState>
    );

  const animal = animalQuery.data;

  const handleExcluir = async () => {
    try {
      await excluirAnimal(animal.id);
      await queryClient.invalidateQueries({ queryKey: ["animais-gerenciados"] });
      toast.success("Animal excluído");
      navigate({ to: "/dashboard/animais" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao excluir";
      toast.error(message);
      throw new Error(message);
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Editar {animal.nome}</h1>
        <ConfirmDestructiveAction
          title="Excluir este animal?"
          item={animal.nome}
          consequence="O cadastro e seus dados associados deixarão de estar disponíveis. Esta ação não pode ser desfeita."
          confirmLabel="Excluir animal"
          onConfirm={handleExcluir}
          trigger={
            <Button variant="outline" size="sm" className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir animal
            </Button>
          }
        />
      </div>
      <Tabs defaultValue="dados" className="mt-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max min-w-full justify-start">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="saude">Saúde</TabsTrigger>
            <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="dados" className="mt-6">
          <AnimalForm animal={animal} mode="edit" />
        </TabsContent>
        <TabsContent value="fotos" className="mt-6">
          <AnimalPhotosPanel
            animalId={animal.id}
            fotos={animal.fotos}
            status={animal.status}
          />
        </TabsContent>
        <TabsContent value="saude" className="mt-6">
          <HealthPanel animalId={animal.id} />
        </TabsContent>
        <TabsContent value="vinculos" className="mt-6">
          <RelatedAnimalsPanel animalId={animal.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
