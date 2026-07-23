import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AnimalForm } from "@/components/app/AnimalForm";
import { HealthPanel } from "@/components/app/HealthPanel";
import { RelatedAnimalsPanel } from "@/components/app/RelatedAnimalsPanel";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { getAnimal } from "@/lib/data/animais";
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
  useDbVersion();
  const { animalId } = Route.useParams();
  const s = useSessao();
  const navigate = useNavigate();
  const animal = getAnimal(animalId);

  useEffect(() => {
    if (s && s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR") {
      navigate({ to: "/dashboard" });
    }
  }, [s, navigate]);

  if (!s || (s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR")) return null;

  if (!animal) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-semibold">Animal não encontrado</h1>
        <Button asChild className="mt-4" variant="outline"><Link to="/dashboard/animais">Voltar</Link></Button>
      </div>
    );
  }

  const proprio =
    (s.organizacaoId && animal.organizacaoId === s.organizacaoId) ||
    (s.acolhedorId && animal.acolhedorId === s.acolhedorId);
  if (!proprio) {
    return <div className="text-muted-foreground">Você não tem permissão para editar este animal.</div>;
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Editar {animal.nome}</h1>
      <Tabs defaultValue="dados" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dados">Dados & fotos</TabsTrigger>
          <TabsTrigger value="saude">Saúde</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" className="mt-6">
          <AnimalForm sessao={s} animal={animal} mode="edit" />
        </TabsContent>
        <TabsContent value="saude" className="mt-6">
          <HealthPanel animalId={animal.id} />
        </TabsContent>
        <TabsContent value="vinculos" className="mt-6">
          <RelatedAnimalsPanel animalId={animal.id} sessao={s} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
