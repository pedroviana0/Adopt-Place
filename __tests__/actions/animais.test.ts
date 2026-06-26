import { StatusAnimal, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAnimal, updateAnimal, updateAnimalStatus } from "@/lib/actions/animais";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AnimalInput } from "@/lib/schemas/animal";

const animalId = "cm00000000000000000000001";
const organizacaoId = "cm00000000000000000000002";
const otherOrganizacaoId = "cm00000000000000000000003";
const acolhedorId = "cm00000000000000000000004";

const baseAnimalInput: AnimalInput = {
  nome: "Luna",
  especieId: "cm00000000000000000000005",
  racaId: "cm00000000000000000000006",
  porte: "M",
  sexo: "F",
  cor: "Caramelo",
  castrado: true,
  descricao: "Docil e brincalhona",
  status: "RESGATADO",
  organizacaoId,
  acolhedorId: null,
};

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000007",
      email: "org@example.com",
      name: "Organizacao",
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId,
      acolhedorId: null,
      ...overrides,
    },
  };
}

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedPrisma = vi.mocked(prisma);
const findAnimal = prisma.animal.findUnique as unknown as {
  mockResolvedValue(
    value: { id: string; organizacaoId: string | null; acolhedorId: string | null; status: StatusAnimal } | null,
  ): void;
};
const createAnimalMock = prisma.animal.create as unknown as {
  mockResolvedValue(value: { id: string }): void;
};
const updateAnimalMock = prisma.animal.update as unknown as {
  mockResolvedValue(value: { id: string }): void;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("animal actions", () => {
  describe("createAnimal", () => {
    it("returns an error without session and does not access data", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(null);

      // When
      const result = await createAnimal(baseAnimalInput);

      // Then
      expect(result.error).toBe("Não autenticado");
      expect(mockedPrisma.animal.create).not.toHaveBeenCalled();
      expect(mockedPrisma.animal.findUnique).not.toHaveBeenCalled();
    });

    it("returns an error when an adopter tries to create an animal", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ADOTANTE,
          adotanteId: "cm00000000000000000000008",
          organizacaoId: null,
        }),
      );

      // When
      const result = await createAnimal(baseAnimalInput);

      // Then
      expect(result.error).toBe("Apenas organizações ou acolhedores podem gerenciar animais");
      expect(mockedPrisma.animal.create).not.toHaveBeenCalled();
    });

    it("returns Conta desativada for inactive accounts", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session({ ativo: false }));

      // When
      const result = await createAnimal(baseAnimalInput);

      // Then
      expect(result.error).toBe("Conta desativada");
      expect(mockedPrisma.animal.create).not.toHaveBeenCalled();
    });

    it("returns XOR error when both organization and foster owners are present", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());

      // When
      const result = await createAnimal({
        ...baseAnimalInput,
        acolhedorId,
      });

      // Then
      expect(result.error).toBe("Animal deve pertencer a exatamente um responsável (organização ou acolhedor)");
      expect(mockedPrisma.animal.create).not.toHaveBeenCalled();
    });

    it("returns XOR error when no owner is present", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());

      // When
      const result = await createAnimal({
        ...baseAnimalInput,
        organizacaoId: null,
      });

      // Then
      expect(result.error).toBe("Animal deve pertencer a exatamente um responsável (organização ou acolhedor)");
      expect(mockedPrisma.animal.create).not.toHaveBeenCalled();
    });

    it("creates an animal for a valid organization owner", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());
      createAnimalMock.mockResolvedValue({ id: animalId });

      // When
      const result = await createAnimal(baseAnimalInput);

      // Then
      expect(mockedPrisma.animal.create).toHaveBeenCalledWith({
        data: baseAnimalInput,
        select: { id: true },
      });
      expect(result).toEqual({ id: animalId });
    });
  });

  describe("updateAnimal", () => {
    it("returns an error when the session user does not own the animal", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());
      findAnimal.mockResolvedValue({
        id: animalId,
        organizacaoId: otherOrganizacaoId,
        acolhedorId: null,
        status: StatusAnimal.RESGATADO,
      });

      // When
      const result = await updateAnimal(animalId, baseAnimalInput);

      // Then
      expect(result.error).toBe("Acesso negado");
      expect(mockedPrisma.animal.update).not.toHaveBeenCalled();
    });
  });

  describe("updateAnimalStatus", () => {
    it("updates RESGATADO to EM_CUIDADOS for a valid owner", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());
      findAnimal.mockResolvedValue({
        id: animalId,
        organizacaoId,
        acolhedorId: null,
        status: StatusAnimal.RESGATADO,
      });
      updateAnimalMock.mockResolvedValue({ id: animalId });

      // When
      const result = await updateAnimalStatus(animalId, StatusAnimal.EM_CUIDADOS);

      // Then
      expect(mockedPrisma.animal.update).toHaveBeenCalledWith({
        where: { id: animalId },
        data: { status: StatusAnimal.EM_CUIDADOS },
      });
      expect(result).toEqual({ success: true });
    });

    it("returns an error for an invalid owner", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());
      findAnimal.mockResolvedValue({
        id: animalId,
        organizacaoId: otherOrganizacaoId,
        acolhedorId: null,
        status: StatusAnimal.RESGATADO,
      });

      // When
      const result = await updateAnimalStatus(animalId, StatusAnimal.EM_CUIDADOS);

      // Then
      expect(result.error).toBe("Acesso negado");
      expect(mockedPrisma.animal.update).not.toHaveBeenCalled();
    });
  });
});
