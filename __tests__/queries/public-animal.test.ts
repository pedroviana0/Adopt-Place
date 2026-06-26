import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicAnimalById } from "@/lib/queries/public-animal";
import { prisma } from "@/lib/prisma";

const animalId = "cm00000000000000000000100";

const sensitiveKeys = [
  "cpf",
  "cnpj",
  "email",
  "telefone",
  "senhaHash",
  "endereco",
  "tipoMoradia",
  "temQuintal",
  "permiteVisita",
  "experienciaAnimais",
  "temOutrosAnimais",
  "horasSozinho",
  "triagemConcluida",
] as const;

const publicAnimalResult = {
  id: animalId,
  nome: "Luna",
  porte: "M",
  sexo: "F",
  cor: "Caramelo",
  idadeEstimada: "2 anos",
  castrado: true,
  descricao: "Docil",
  status: "DISPONIVEL",
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  especie: { nome: "Cachorro" },
  raca: { nome: "SRD" },
  fotos: [{ id: "foto-1", urlFoto: "/luna.jpg", principal: true }],
  registrosSaude: [{ id: "saude-1", tipo: "VACINA", dataRegistro: new Date("2026-01-02T00:00:00.000Z") }],
  organizacao: { razaoSocial: "Cia Animal VR", cidade: "Volta Redonda" },
  acolhedor: null,
  relacionadosA: [],
};

const findAnimal = prisma.animal.findUnique as unknown as {
  mockResolvedValue(value: typeof publicAnimalResult): void;
};

function collectObjectKeys(value: unknown): Set<string> {
  const keys = new Set<string>();

  function visit(current: unknown): void {
    if (!current || typeof current !== "object") {
      return;
    }

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    for (const [key, nestedValue] of Object.entries(current)) {
      keys.add(key);
      visit(nestedValue);
    }
  }

  visit(value);
  return keys;
}

describe("getPublicAnimalById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not include sensitive fields in the serialized public result", async () => {
    findAnimal.mockResolvedValue(publicAnimalResult);

    const result = await getPublicAnimalById(animalId);
    const serialized = JSON.parse(JSON.stringify(result));
    const resultKeys = collectObjectKeys(serialized);

    for (const key of sensitiveKeys) {
      expect(resultKeys.has(key), `${key} should not be exposed`).toBe(false);
    }
  });

  it("does not select sensitive fields in the public Prisma query", async () => {
    findAnimal.mockResolvedValue(publicAnimalResult);

    await getPublicAnimalById(animalId);

    const query = vi.mocked(prisma.animal.findUnique).mock.calls[0]?.[0];
    const selectedKeys = collectObjectKeys(query);

    for (const key of sensitiveKeys) {
      expect(selectedKeys.has(key), `${key} should not be selected`).toBe(false);
    }
  });
});
