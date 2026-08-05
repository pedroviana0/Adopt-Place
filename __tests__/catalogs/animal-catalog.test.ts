import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANIMAL_CATALOG,
  CANONICAL_SPECIES_NAMES,
  ensureAnimalCatalog,
} from "@/lib/animal-catalog";
import { prisma } from "@/lib/prisma";

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

describe("canonical animal catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("contains exactly dog and cat with sorted, unique breed lists", () => {
    expect(CANONICAL_SPECIES_NAMES).toEqual(["Cachorro", "Gato"]);
    expect(ANIMAL_CATALOG.map((species) => species.name)).toEqual([
      "Cachorro",
      "Gato",
    ]);

    for (const species of ANIMAL_CATALOG) {
      expect(species.breeds).toContain("Sem raça definida (SRD)");
      expect(new Set(species.breeds).size).toBe(species.breeds.length);
      expect(species.breeds).toEqual(
        [...species.breeds].sort((left, right) => collator.compare(left, right)),
      );
    }
  });

  it("covers representative popular dog and cat breeds", () => {
    const dog = ANIMAL_CATALOG.find((species) => species.name === "Cachorro");
    const cat = ANIMAL_CATALOG.find((species) => species.name === "Gato");

    expect(dog?.breeds).toEqual(
      expect.arrayContaining(["Fila Brasileiro", "Labrador Retriever", "Shih Tzu"]),
    );
    expect(cat?.breeds).toEqual(
      expect.arrayContaining(["Maine Coon", "Persa", "Siamês"]),
    );
  });

  it("creates only missing canonical references with duplicate protection", async () => {
    vi.mocked(prisma.especie.findMany).mockResolvedValue([
      { id: "dog-id", nome: "Cachorro" },
      { id: "cat-id", nome: "Gato" },
    ] as never);

    await ensureAnimalCatalog();

    expect(prisma.especie.createMany).toHaveBeenCalledWith({
      data: [{ nome: "Cachorro" }, { nome: "Gato" }],
      skipDuplicates: true,
    });
    expect(prisma.raca.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: expect.arrayContaining([
          { especieId: "dog-id", nome: "Sem raça definida (SRD)" },
          { especieId: "cat-id", nome: "Sem raça definida (SRD)" },
        ]),
      }),
    );
  });
});
