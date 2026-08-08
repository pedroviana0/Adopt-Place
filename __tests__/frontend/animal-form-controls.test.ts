import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AnimalPhotoInput } from "../../frontend/src/components/app/AnimalPhotoInput";
import { selectedFiles } from "../../frontend/src/lib/animal-photo-input";
import {
  changeAnimalSpecies,
  getBreedsForSpecies,
  validateAnimalTaxonomy,
} from "../../frontend/src/lib/animal-taxonomy";

const catalog = [
  {
    id: "dog-id",
    nome: "Cachorro",
    racas: [
      { id: "dog-srd", nome: "Sem raça definida (SRD)", especieId: "dog-id" },
      { id: "dog-lab", nome: "Labrador Retriever", especieId: "dog-id" },
    ],
  },
  {
    id: "cat-id",
    nome: "Gato",
    racas: [
      { id: "cat-srd", nome: "Sem raça definida (SRD)", especieId: "cat-id" },
      { id: "cat-persian", nome: "Persa", especieId: "cat-id" },
    ],
  },
];

describe("animal taxonomy controls", () => {
  it("filters breeds by species and rejects incompatible selections", () => {
    expect(getBreedsForSpecies(catalog, "dog-id").map((breed) => breed.nome)).toEqual([
      "Sem raça definida (SRD)",
      "Labrador Retriever",
    ]);
    expect(validateAnimalTaxonomy(catalog, "dog-id", "cat-persian")).toBe(
      "A raça selecionada não pertence à espécie informada.",
    );
    expect(validateAnimalTaxonomy(catalog, "unknown", null)).toBe(
      "Selecione uma espécie válida.",
    );
  });

  it("clears a previously selected breed when species changes", () => {
    expect(
      changeAnimalSpecies({ especieId: "dog-id", racaId: "dog-lab" }, "cat-id"),
    ).toEqual({ especieId: "cat-id", racaId: null });
  });
});

describe("animal photo input", () => {
  const foto = (nome: string) =>
    new File(["image"], nome, { type: "image/jpeg" });

  const render = (files: File[]) =>
    renderToStaticMarkup(
      createElement(AnimalPhotoInput, { files, onChange: vi.fn(), minFiles: 2 }),
    );

  it("renders an accessible Portuguese multi-file control associated with the real input", () => {
    const html = render([]);

    expect(html).toContain('id="animal-photos"');
    expect(html).toContain('for="animal-photos"');
    expect(html).toContain('type="file"');
    expect(html).toContain('accept="image/*"');
    expect(html).toContain("multiple");
    expect(html).toContain("Selecionar fotos");
    expect(html).toContain("sr-only");
    expect(html).not.toContain("display:none");
  });

  it("states the announcement minimum while it is unmet", () => {
    expect(render([])).toContain("envie pelo menos 2");
    expect(render([foto("luna.jpg")])).toContain("falta 1 para anunciar");
  });

  it("lists every selected file and marks the first as the primary photo", () => {
    const html = render([foto("luna.jpg"), foto("luna-2.jpg")]);

    expect(html).toContain("luna.jpg");
    expect(html).toContain("luna-2.jpg");
    expect(html).toContain("Principal");
    expect(html).toContain("2 fotos selecionadas");
  });

  it("collects every file chosen in one pick", () => {
    const primeira = foto("a.jpg");
    const segunda = foto("b.jpg");
    const files = {
      0: primeira,
      1: segunda,
      length: 2,
      item: (index: number) => [primeira, segunda][index] ?? null,
      [Symbol.iterator]: function* () {
        yield primeira;
        yield segunda;
      },
    } as unknown as FileList;

    expect(selectedFiles(files)).toEqual([primeira, segunda]);
    expect(selectedFiles(null)).toEqual([]);
  });
});
