import { prisma } from "@/lib/prisma";

// Consulted on 2026-08-04: CBKC/FCI for dogs and FIFe/TICA for cats.
// https://cbkc.org/racas/buscar | https://fci.be/en/nomenclature/Default.aspx
// https://fifeweb.org/cats/breeds/ | https://tica.org/ticas-breeds/browse-all-breeds/
const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

function sortedBreeds(breeds: string[]): readonly string[] {
  return Object.freeze([...breeds].sort((left, right) => collator.compare(left, right)));
}

export const CANONICAL_SPECIES_NAMES = ["Cachorro", "Gato"] as const;

export const ANIMAL_CATALOG = Object.freeze([
  {
    name: "Cachorro",
    breeds: sortedBreeds([
      "Akita",
      "American Bully",
      "American Pit Bull Terrier",
      "American Staffordshire Terrier",
      "Australian Cattle Dog",
      "Australian Shepherd",
      "Basenji",
      "Beagle",
      "Bichon Frisé",
      "Border Collie",
      "Boston Terrier",
      "Boxer",
      "Buldogue Francês",
      "Buldogue Inglês",
      "Bull Terrier",
      "Cane Corso",
      "Cavalier King Charles Spaniel",
      "Chihuahua",
      "Chow Chow",
      "Cocker Spaniel Americano",
      "Cocker Spaniel Inglês",
      "Dachshund",
      "Dálmata",
      "Dobermann",
      "Dogue Alemão",
      "Fila Brasileiro",
      "Golden Retriever",
      "Husky Siberiano",
      "Jack Russell Terrier",
      "Labrador Retriever",
      "Lhasa Apso",
      "Maltês",
      "Mastiff Inglês",
      "Pastor Alemão",
      "Pastor Belga Malinois",
      "Pastor Branco Suíço",
      "Pequinês",
      "Pinscher Miniatura",
      "Pointer Inglês",
      "Poodle",
      "Pug",
      "Rottweiler",
      "Samoieda",
      "Schnauzer Miniatura",
      "Sem raça definida (SRD)",
      "Setter Irlandês",
      "Shar Pei",
      "Shiba",
      "Shih Tzu",
      "Spitz Alemão Anão (Lulu da Pomerânia)",
      "Staffordshire Bull Terrier",
      "Terra Nova",
      "Terrier Brasileiro",
      "Weimaraner",
      "Whippet",
      "Yorkshire Terrier",
    ]),
  },
  {
    name: "Gato",
    breeds: sortedBreeds([
      "Abissínio",
      "American Shorthair",
      "Angorá Turco",
      "Azul Russo",
      "Bengal",
      "Bombay",
      "British Shorthair",
      "Chartreux",
      "Cornish Rex",
      "Devon Rex",
      "Exótico de Pelo Curto",
      "Maine Coon",
      "Manx",
      "Mau Egípcio",
      "Munchkin",
      "Norueguês da Floresta",
      "Oriental Shorthair",
      "Persa",
      "Ragdoll",
      "Sagrado da Birmânia",
      "Savannah",
      "Scottish Fold",
      "Sem raça definida (SRD)",
      "Siamês",
      "Siberiano",
      "Sphynx",
      "Van Turco",
    ]),
  },
] as const);

export function isCanonicalSpeciesName(
  name: string,
): name is (typeof CANONICAL_SPECIES_NAMES)[number] {
  return CANONICAL_SPECIES_NAMES.some((canonicalName) => canonicalName === name);
}

export function canonicalBreedsForSpecies(name: string): readonly string[] {
  return ANIMAL_CATALOG.find((entry) => entry.name === name)?.breeds ?? [];
}

export function isCanonicalBreedForSpecies(
  speciesName: string,
  breedName: string,
): boolean {
  return canonicalBreedsForSpecies(speciesName).includes(breedName);
}

export async function ensureAnimalCatalog(): Promise<void> {
  await prisma.especie.createMany({
    data: CANONICAL_SPECIES_NAMES.map((nome) => ({ nome })),
    skipDuplicates: true,
  });

  const species = await prisma.especie.findMany({
    where: { nome: { in: [...CANONICAL_SPECIES_NAMES] } },
    select: { id: true, nome: true },
  });
  const speciesIds = new Map(species.map(({ id, nome }) => [nome, id]));

  if (speciesIds.size !== CANONICAL_SPECIES_NAMES.length) {
    throw new Error("Nao foi possivel disponibilizar o catalogo de especies");
  }

  await prisma.raca.createMany({
    data: ANIMAL_CATALOG.flatMap((entry) => {
      const especieId = speciesIds.get(entry.name);
      if (!especieId) return [];
      return entry.breeds.map((nome) => ({ especieId, nome }));
    }),
    skipDuplicates: true,
  });
}
