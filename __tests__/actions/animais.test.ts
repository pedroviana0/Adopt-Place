import { StatusAnimal, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAnimal,
  deleteAnimal,
  updateAnimal,
  updateAnimalStatus,
} from "@/lib/actions/animais";
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

function mockActiveOrganization() {
  vi.mocked(getServerSession).mockResolvedValue(session());
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    organizacao: { id: organizacaoId },
    acolhedor: null,
  } as never);
  vi.mocked(prisma.raca.findUnique).mockResolvedValue({
    especieId: baseAnimalInput.especieId,
    nome: "Labrador Retriever",
  } as never);
  vi.mocked(prisma.especie.findUnique).mockResolvedValue({
    id: baseAnimalInput.especieId,
    nome: "Cachorro",
  } as never);
}

const findAnimal = vi.mocked(prisma.animal.findUnique);
const createAnimalMock = vi.mocked(prisma.animal.create);
const updateAnimalMock = vi.mocked(prisma.animal.update);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("animal actions", () => {
  describe("createAnimal", () => {
    it("returns an error without session and does not access data", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await createAnimal(baseAnimalInput);

      expect(result.error).toBe("Nao autenticado");
      expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
      expect(prisma.animal.create).not.toHaveBeenCalled();
    });

    it("returns an error when an adopter tries to create an animal", async () => {
      vi.mocked(getServerSession).mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ADOTANTE,
          adotanteId: "cm00000000000000000000008",
          organizacaoId: null,
        }),
      );
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
        ativo: true,
        tipoPerfil: TipoPerfil.ADOTANTE,
        organizacao: null,
        acolhedor: null,
      } as never);

      const result = await createAnimal(baseAnimalInput);

      expect(result.error).toBe(
        "Apenas organizacoes ou acolhedores podem gerenciar animais",
      );
      expect(prisma.animal.create).not.toHaveBeenCalled();
    });

    it("revalidates an account deactivated after session issuance", async () => {
      vi.mocked(getServerSession).mockResolvedValue(session());
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
        ativo: false,
        tipoPerfil: TipoPerfil.ORGANIZACAO,
        organizacao: { id: organizacaoId },
        acolhedor: null,
      } as never);

      const result = await createAnimal(baseAnimalInput);

      expect(result.error).toBe("Conta desativada");
      expect(prisma.animal.create).not.toHaveBeenCalled();
    });

    it("derives exactly one organization owner from the current account", async () => {
      mockActiveOrganization();
      createAnimalMock.mockResolvedValue({ id: animalId } as never);

      const result = await createAnimal(baseAnimalInput);

      expect(prisma.animal.create).toHaveBeenCalledWith({
        data: {
          ...baseAnimalInput,
          organizacaoId,
          acolhedorId: null,
        },
        select: { id: true },
      });
      expect(result).toEqual({ id: animalId });
    });

    it("rejects a species that is not part of the canonical catalog", async () => {
      mockActiveOrganization();
      vi.mocked(prisma.especie.findUnique).mockResolvedValue(null);

      const result = await createAnimal(baseAnimalInput);

      expect(result).toEqual({
        error: "A especie informada nao esta disponivel",
        code: "INVALID_SPECIES",
      });
      expect(prisma.raca.findUnique).not.toHaveBeenCalled();
      expect(prisma.animal.create).not.toHaveBeenCalled();
    });

    it("rejects a breed from a different species", async () => {
      mockActiveOrganization();
      vi.mocked(prisma.raca.findUnique).mockResolvedValue({
        especieId: "cm00000000000000000000009",
        nome: "Persa",
      } as never);

      const result = await createAnimal(baseAnimalInput);

      expect(result).toEqual({
        error: "A raca nao pertence a especie informada",
        code: "INVALID_BREED",
      });
      expect(prisma.animal.create).not.toHaveBeenCalled();
    });

    it("derives exactly one foster owner from the current account", async () => {
      vi.mocked(getServerSession).mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ACOLHEDOR,
          organizacaoId: null,
          acolhedorId,
        }),
      );
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
        ativo: true,
        tipoPerfil: TipoPerfil.ACOLHEDOR,
        organizacao: null,
        acolhedor: { id: acolhedorId },
      } as never);
      vi.mocked(prisma.raca.findUnique).mockResolvedValue({
        especieId: baseAnimalInput.especieId,
        nome: "Labrador Retriever",
      } as never);
      vi.mocked(prisma.especie.findUnique).mockResolvedValue({
        id: baseAnimalInput.especieId,
        nome: "Cachorro",
      } as never);
      createAnimalMock.mockResolvedValue({ id: animalId } as never);

      const result = await createAnimal(baseAnimalInput);

      expect(prisma.animal.create).toHaveBeenCalledWith({
        data: {
          ...baseAnimalInput,
          organizacaoId: null,
          acolhedorId,
        },
        select: { id: true },
      });
      expect(result).toEqual({ id: animalId });
    });

    it("rejects browser-supplied owner identifiers before creating", async () => {
      mockActiveOrganization();

      const result = await createAnimal({
        ...baseAnimalInput,
        organizacaoId: otherOrganizacaoId,
      } as AnimalInput);

      expect(result.error).toBe("Revise os campos informados");
      expect(prisma.animal.create).not.toHaveBeenCalled();
    });
  });

  describe("updateAnimal", () => {
    it("returns an error when the current account does not own the animal", async () => {
      mockActiveOrganization();
      findAnimal.mockResolvedValue({
        organizacaoId: otherOrganizacaoId,
        acolhedorId: null,
        status: StatusAnimal.RESGATADO,
      } as never);

      const result = await updateAnimal(animalId, baseAnimalInput);

      expect(result.error).toBe("Acesso negado");
      expect(prisma.animal.update).not.toHaveBeenCalled();
    });

    it("does not allow ownership transfer in an update payload", async () => {
      mockActiveOrganization();
      findAnimal.mockResolvedValue({
        organizacaoId,
        acolhedorId: null,
        status: StatusAnimal.RESGATADO,
      } as never);

      const result = await updateAnimal(animalId, {
        ...baseAnimalInput,
        organizacaoId: otherOrganizacaoId,
      } as AnimalInput);

      expect(result.error).toBe("Revise os campos informados");
      expect(prisma.animal.update).not.toHaveBeenCalled();
    });

    it("rejects an incompatible breed before updating an owned animal", async () => {
      mockActiveOrganization();
      findAnimal.mockResolvedValue({
        organizacaoId,
        acolhedorId: null,
        status: StatusAnimal.RESGATADO,
      } as never);
      vi.mocked(prisma.raca.findUnique).mockResolvedValue({
        especieId: "cm00000000000000000000009",
        nome: "Persa",
      } as never);

      const result = await updateAnimal(animalId, baseAnimalInput);

      expect(result).toEqual({
        error: "A raca nao pertence a especie informada",
        code: "INVALID_BREED",
      });
      expect(prisma.animal.update).not.toHaveBeenCalled();
    });
  });

  describe("updateAnimalStatus", () => {
    it("updates status for the current owner", async () => {
      mockActiveOrganization();
      findAnimal.mockResolvedValue({
        organizacaoId,
        acolhedorId: null,
        status: StatusAnimal.RESGATADO,
      } as never);
      updateAnimalMock.mockResolvedValue({ id: animalId } as never);

      const result = await updateAnimalStatus(
        animalId,
        StatusAnimal.EM_CUIDADOS,
      );

      expect(prisma.animal.update).toHaveBeenCalledWith({
        where: { id: animalId },
        data: { status: StatusAnimal.EM_CUIDADOS },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("deleteAnimal", () => {
    it("does not delete an animal owned by another responsible account", async () => {
      mockActiveOrganization();
      findAnimal.mockResolvedValue({
        organizacaoId: otherOrganizacaoId,
        acolhedorId: null,
        status: StatusAnimal.RESGATADO,
      } as never);

      const result = await deleteAnimal(animalId);

      expect(result.error).toBe("Acesso negado");
      expect(prisma.animal.delete).not.toHaveBeenCalled();
    });
  });
});
