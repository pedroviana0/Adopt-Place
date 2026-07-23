import { createFileRoute } from "@tanstack/react-router";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { listFavoritos } from "@/lib/data/favoritos";
import { getAnimal } from "@/lib/data/animais";
import { AnimalCard } from "@/components/app/AnimalCard";
import { EmptyState } from "@/components/app/EmptyState";

export const Route = createFileRoute("/_authenticated/meus-favoritos")({
  head: () => ({ meta: [{ title: "Meus favoritos — AdoptPlace" }, { name: "description", content: "Animais que você favoritou." }] }),
  component: Page,
});

function Page() {
  useDbVersion();
  const s = useSessao();
  const favs = s?.adotanteId ? listFavoritos(s.adotanteId) : [];
  const animais = favs.map((f) => getAnimal(f.animalId)).filter((x): x is NonNullable<typeof x> => !!x);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Meus favoritos</h1>
      {animais.length === 0 ? (
        <div className="mt-6"><EmptyState title="Você ainda não favoritou nenhum animal" action={{ label: "Ver vitrine", to: "/vitrine" }} /></div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {animais.map((a) => <AnimalCard key={a.id} animal={a} />)}
        </div>
      )}
    </div>
  );
}
