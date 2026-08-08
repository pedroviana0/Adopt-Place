import { StatusAnimal, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAnimal,
  updateAnimal,
  updateAnimalStatus,
} from "@/lib/actions/animais";
import { deleteAnimalPhoto } from "@/lib/actions/fotos";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AnimalInput } from "@/lib/schemas/animal";

const animalId = "cm00000000000000000000001";
const organizacaoId = "cm00000000000000000000002";
const fotoA = "cm00000000000000000000101";
const fotoB = "cm00000000000000000000102";
const fotoC = "cm00000000000000000000103";

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

function session(): Session {
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

function ownedAnimal(status: StatusAnimal) {
  vi.mocked(prisma.animal.findUnique).mockResolvedValue({
    organizacaoId,
    acolhedorId: null,
    status,
  } as never);
}

function photoCount(count: number) {
  vi.mocked(prisma.fotoAnimal.count).mockResolvedValue(count as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("regra de anuncio: minimo de duas fotos", () => {
  describe("createAnimal", () => {
    it("nao deixa um animal nascer anunciado, porque ele ainda nao tem foto", async () => {
      mockActiveOrganization();

      const result = await createAnimal({
        ...baseAnimalInput,
        status: StatusAnimal.DISPONIVEL,
      });

      expect(result.code).toBe("PHOTOS_REQUIRED_TO_PUBLISH");
      expect(prisma.animal.create).not.toHaveBeenCalled();
    });

    it("cria normalmente em um status que nao e anuncio", async () => {
      mockActiveOrganization();
      vi.mocked(prisma.animal.create).mockResolvedValue({
        id: animalId,
      } as never);

      const result = await createAnimal({
        ...baseAnimalInput,
        status: StatusAnimal.EM_CUIDADOS,
      });

      expect(result).toEqual({ id: animalId });
      expect(prisma.animal.create).toHaveBeenCalled();
    });
  });

  describe("updateAnimal", () => {
    it("recusa a publicacao com uma unica foto", async () => {
      mockActiveOrganization();
      ownedAnimal(StatusAnimal.EM_CUIDADOS);
      photoCount(1);

      const result = await updateAnimal(animalId, {
        ...baseAnimalInput,
        status: StatusAnimal.DISPONIVEL,
      });

      expect(result.code).toBe("PHOTOS_REQUIRED_TO_PUBLISH");
      expect(prisma.animal.update).not.toHaveBeenCalled();
    });

    it("publica quando o animal atinge duas fotos", async () => {
      mockActiveOrganization();
      ownedAnimal(StatusAnimal.EM_CUIDADOS);
      photoCount(2);
      vi.mocked(prisma.animal.update).mockResolvedValue({
        id: animalId,
      } as never);

      const result = await updateAnimal(animalId, {
        ...baseAnimalInput,
        status: StatusAnimal.DISPONIVEL,
      });

      expect(result).toEqual({ success: true });
      expect(prisma.animal.update).toHaveBeenCalled();
    });

    it("nao trava a edicao de um animal ja anunciado antes da regra", async () => {
      mockActiveOrganization();
      ownedAnimal(StatusAnimal.DISPONIVEL);
      vi.mocked(prisma.animal.update).mockResolvedValue({
        id: animalId,
      } as never);

      const result = await updateAnimal(animalId, {
        ...baseAnimalInput,
        status: StatusAnimal.DISPONIVEL,
      });

      expect(result).toEqual({ success: true });
      expect(prisma.fotoAnimal.count).not.toHaveBeenCalled();
    });
  });

  describe("updateAnimalStatus", () => {
    it("recusa publicar sem foto nenhuma", async () => {
      mockActiveOrganization();
      ownedAnimal(StatusAnimal.RESGATADO);
      photoCount(0);

      const result = await updateAnimalStatus(
        animalId,
        StatusAnimal.DISPONIVEL,
      );

      expect(result.code).toBe("PHOTOS_REQUIRED_TO_PUBLISH");
      expect(prisma.animal.update).not.toHaveBeenCalled();
    });

    it("nao conta fotos ao mudar para um status que nao e anuncio", async () => {
      mockActiveOrganization();
      ownedAnimal(StatusAnimal.RESGATADO);
      vi.mocked(prisma.animal.update).mockResolvedValue({
        id: animalId,
      } as never);

      const result = await updateAnimalStatus(
        animalId,
        StatusAnimal.EM_CUIDADOS,
      );

      expect(result).toEqual({ success: true });
      expect(prisma.fotoAnimal.count).not.toHaveBeenCalled();
    });
  });

  describe("deleteAnimalPhoto", () => {
    it("impede cair abaixo do minimo enquanto o animal esta anunciado", async () => {
      mockActiveOrganization();
      ownedAnimal(StatusAnimal.DISPONIVEL);
      vi.mocked(prisma.fotoAnimal.findMany).mockResolvedValue([
        { id: fotoA, principal: true },
        { id: fotoB, principal: false },
      ] as never);

      const result = await deleteAnimalPhoto(animalId, fotoB);

      expect(result.code).toBe("PUBLISHED_MIN_PHOTOS");
      expect(prisma.fotoAnimal.delete).not.toHaveBeenCalled();
    });

    it("permite remover quando sobram fotos suficientes", async () => {
      mockActiveOrganization();
      ownedAnimal(StatusAnimal.DISPONIVEL);
      vi.mocked(prisma.fotoAnimal.findMany).mockResolvedValue([
        { id: fotoA, principal: true },
        { id: fotoB, principal: false },
        { id: fotoC, principal: false },
      ] as never);

      const result = await deleteAnimalPhoto(animalId, fotoC);

      expect(result).toEqual({ success: true });
      expect(prisma.fotoAnimal.delete).toHaveBeenCalledWith({
        where: { id: fotoC },
      });
    });

    it("nao aplica o minimo de anuncio a um animal fora da vitrine", async () => {
      mockActiveOrganization();
      ownedAnimal(StatusAnimal.EM_CUIDADOS);
      vi.mocked(prisma.fotoAnimal.findMany).mockResolvedValue([
        { id: fotoA, principal: true },
        { id: fotoB, principal: false },
      ] as never);

      const result = await deleteAnimalPhoto(animalId, fotoB);

      expect(result).toEqual({ success: true });
      expect(prisma.fotoAnimal.delete).toHaveBeenCalledWith({
        where: { id: fotoB },
      });
    });
  });
});
