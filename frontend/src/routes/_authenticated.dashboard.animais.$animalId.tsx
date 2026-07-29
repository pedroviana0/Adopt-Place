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

  if (animalQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (animalQuery.isError || !animalQuery.data) {
    // Backend scopes to the owner, so a missing/forbidden animal returns 404.
    return (
      <div>
        <h1 className="font-serif text-2xl font-semibold">Animal não encontrado</h1>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/dashboard/animais">Voltar</Link>
        </Button>
      </div>
    );
  }

  const animal = animalQuery.data;

  const handleExcluir = async () => {
    try {
      await excluirAnimal(animal.id);
      await queryClient.invalidateQueries({ queryKey: ["animais-gerenciados"] });
      toast.success("Animal excluído");
      navigate({ to: "/dashboard/animais" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Editar {animal.nome}</h1>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive"
          onClick={handleExcluir}
        >
          <Trash2 className="h-4 w-4" /> Excluir animal
        </Button>
      </div>
      <Tabs defaultValue="dados" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
          <TabsTrigger value="saude">Saúde</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" className="mt-6">
          <AnimalForm animal={animal} mode="edit" />
        </TabsContent>
        <TabsContent value="fotos" className="mt-6">
          <AnimalPhotosPanel animalId={animal.id} fotos={animal.fotos} />
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
