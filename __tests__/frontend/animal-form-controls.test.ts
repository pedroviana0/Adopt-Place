import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AnimalPhotoInput } from "../../frontend/src/components/app/AnimalPhotoInput";
import { firstSelectedFile } from "../../frontend/src/lib/animal-photo-input";
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
  it("renders an accessible Portuguese file control associated with the real input", () => {
    const html = renderToStaticMarkup(
      createElement(AnimalPhotoInput, { file: null, onChange: vi.fn() }),
    );

    expect(html).toContain('id="animal-primary-photo"');
    expect(html).toContain('for="animal-primary-photo"');
    expect(html).toContain('type="file"');
    expect(html).toContain('accept="image/*"');
    expect(html).toContain("Selecionar foto");
    expect(html).toContain("Nenhum arquivo selecionado");
    expect(html).toContain("sr-only");
    expect(html).not.toContain("display:none");
  });

  it("shows the selected file name", () => {
    const file = new File(["image"], "animal.jpg", { type: "image/jpeg" });
    const html = renderToStaticMarkup(
      createElement(AnimalPhotoInput, { file, onChange: vi.fn() }),
    );

    expect(html).toContain("animal.jpg");
  });

  it("passes the selected file to the existing upload flow", () => {
    const file = new File(["image"], "animal.jpg", { type: "image/jpeg" });
    const files = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    } as unknown as FileList;

    expect(firstSelectedFile(files)).toBe(file);
    expect(firstSelectedFile(null)).toBeNull();
  });
});
