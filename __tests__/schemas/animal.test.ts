import { describe, expect, it } from "vitest";

import { animalSchema } from "@/lib/schemas/animal";

const baseAnimal = {
  nome: "Luna",
  especieId: "cm00000000000000000000001",
  racaId: "cm00000000000000000000002",
  porte: "M",
  sexo: "F",
  cor: "Caramelo",
  castrado: true,
  descricao: "Docil e brincalhona",
  status: "DISPONIVEL",
};

describe("animalSchema", () => {
  it("rejects when both organizacaoId and acolhedorId are present", () => {
    const result = animalSchema.safeParse({
      ...baseAnimal,
      organizacaoId: "cm00000000000000000000003",
      acolhedorId: "cm00000000000000000000004",
    });

    expect(result.success).toBe(false);
  });

  it("rejects when neither organizacaoId nor acolhedorId is present", () => {
    const result = animalSchema.safeParse(baseAnimal);

    expect(result.success).toBe(false);
  });

  it("accepts a single organization owner", () => {
    const result = animalSchema.safeParse({
      ...baseAnimal,
      organizacaoId: "cm00000000000000000000003",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a single foster owner", () => {
    const result = animalSchema.safeParse({
      ...baseAnimal,
      acolhedorId: "cm00000000000000000000004",
    });

    expect(result.success).toBe(true);
  });
});
