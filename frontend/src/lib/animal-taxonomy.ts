import type { PublicCatalog } from "./data/catalogos";

type SpeciesOption = PublicCatalog["especies"][number];
type BreedOption = SpeciesOption["racas"][number];

export function getBreedsForSpecies(species: SpeciesOption[], speciesId: string): BreedOption[] {
  return species.find((option) => option.id === speciesId)?.racas ?? [];
}

export function validateAnimalTaxonomy(
  species: SpeciesOption[],
  speciesId: string,
  breedId: string | null | undefined,
): string | null {
  const selectedSpecies = species.find((option) => option.id === speciesId);
  if (!selectedSpecies) return "Selecione uma espécie válida.";
  if (breedId && !selectedSpecies.racas.some((breed) => breed.id === breedId)) {
    return "A raça selecionada não pertence à espécie informada.";
  }
  return null;
}

export function changeAnimalSpecies(
  _selection: { especieId: string; racaId?: string | null },
  especieId: string,
): { especieId: string; racaId: null } {
  return { especieId, racaId: null };
}
