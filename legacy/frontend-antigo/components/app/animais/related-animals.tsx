import { AnimalCard } from "@/components/app/vitrine/animal-card";
import type { RelatedPublicAnimal } from "@/lib/queries/public-animal";

type RelatedAnimalsProps = {
  animals: RelatedPublicAnimal[];
};

export function RelatedAnimals({ animals }: RelatedAnimalsProps) {
  if (animals.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Animais relacionados</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map((animal) => (
          <AnimalCard key={animal.id} animal={animal} showRequestHint />
        ))}
      </div>
    </section>
  );
}
