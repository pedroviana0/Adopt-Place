import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteAnimalPhoto,
  persistAnimalPhotoUpload,
  setPrimaryPhoto,
  updatePhotoOrder,
} from "@/lib/actions/fotos";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  authorizeAnimalPhotoUpload,
  createAnimalPhotoCustomId,
} from "@/lib/upload-router";

const userId = "cm00000000000000000000001";
const organizacaoId = "cm00000000000000000000002";
const animalId = "cm00000000000000000000003";
const photoOneId = "cm00000000000000000000004";
const photoTwoId = "cm00000000000000000000005";

function session(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: userId,
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
  vi.mocked(prisma.animal.findUnique).mockResolvedValue({
    organizacaoId,
    acolhedorId: null,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.usuario.findUnique).mockReset();
  vi.mocked(prisma.animal.findUnique).mockReset();
});

describe("animal photo actions", () => {
  it("creates a distinct UploadThing custom id for every photo of the same animal", () => {
    const first = createAnimalPhotoCustomId(animalId);
    const second = createAnimalPhotoCustomId(animalId);

    expect(first).toMatch(new RegExp(`^${animalId}:`));
    expect(second).toMatch(new RegExp(`^${animalId}:`));
    expect(second).not.toBe(first);
  });

  it("rejects upload without authentication before reading the animal", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    await expect(
      authorizeAnimalPhotoUpload(
        { animalId },
        [{ name: "luna.jpg", type: "image/jpeg", size: 1024 }],
      ),
    ).rejects.toThrow("Unauthorized");
    expect(prisma.animal.findUnique).not.toHaveBeenCalled();
  });

  it("rejects inactive and unauthorized roles before reading the animal", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session());
    vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
      ativo: false,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: organizacaoId },
      acolhedor: null,
    } as never);

    await expect(
      authorizeAnimalPhotoUpload(
        { animalId },
        [{ name: "luna.jpg", type: "image/jpeg", size: 1024 }],
      ),
    ).rejects.toThrow("Forbidden");

    vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
      ativo: true,
      tipoPerfil: TipoPerfil.ADOTANTE,
      organizacao: null,
      acolhedor: null,
    } as never);
    await expect(
      authorizeAnimalPhotoUpload(
        { animalId },
        [{ name: "luna.jpg", type: "image/jpeg", size: 1024 }],
      ),
    ).rejects.toThrow("Forbidden");
    expect(prisma.animal.findUnique).not.toHaveBeenCalled();
  });

  it("rejects non-image and oversized files in the backend", async () => {
    mockActiveOrganization();

    await expect(
      authorizeAnimalPhotoUpload(
        { animalId },
        [{ name: "notes.txt", type: "text/plain", size: 1024 }],
      ),
    ).rejects.toThrow("Apenas imagens");
    await expect(
      authorizeAnimalPhotoUpload(
        { animalId },
        [{ name: "large.jpg", type: "image/jpeg", size: 4 * 1024 * 1024 + 1 }],
      ),
    ).rejects.toThrow("4 MB");
  });

  it("rejects upload to an animal owned by another responsible party", async () => {
    mockActiveOrganization();
    vi.mocked(prisma.animal.findUnique).mockResolvedValue({
      organizacaoId: "another-org",
      acolhedorId: null,
    } as never);

    await expect(
      authorizeAnimalPhotoUpload(
        { animalId },
        [{ name: "luna.jpg", type: "image/jpeg", size: 1024 }],
      ),
    ).rejects.toThrow("Forbidden");
  });

  it("returns server-derived metadata for a valid owned upload", async () => {
    mockActiveOrganization();

    await expect(
      authorizeAnimalPhotoUpload(
        { animalId },
        [{ name: "luna.jpg", type: "image/jpeg", size: 1024 }],
      ),
    ).resolves.toEqual({
      userId,
      organizacaoId,
      acolhedorId: null,
      animalId,
    });
  });

  it("rejects an incomplete order set before updating any photo", async () => {
    mockActiveOrganization();
    vi.mocked(prisma.fotoAnimal.findMany).mockResolvedValue([
      { id: photoOneId, animalId },
      { id: photoTwoId, animalId },
    ] as never);

    const result = await updatePhotoOrder(animalId, [
      { id: photoOneId, ordem: 0 },
    ]);

    expect(result.error).toBe("Informe todas as fotos do animal uma unica vez");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("sets one owned photo as primary in a transaction", async () => {
    mockActiveOrganization();
    vi.mocked(prisma.fotoAnimal.findUnique).mockResolvedValue({
      id: photoTwoId,
      animalId,
    } as never);

    const result = await setPrimaryPhoto(animalId, photoTwoId);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("requires a replacement before deleting the current primary photo", async () => {
    mockActiveOrganization();
    vi.mocked(prisma.fotoAnimal.findMany).mockResolvedValue([
      { id: photoOneId, principal: true },
      { id: photoTwoId, principal: false },
    ] as never);

    const result = await deleteAnimalPhoto(animalId, photoOneId);

    expect(result).toEqual({
      error: "Informe a nova foto principal",
      code: "PRIMARY_REPLACEMENT_REQUIRED",
    });
    expect(prisma.fotoAnimal.delete).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not delete the only primary photo", async () => {
    mockActiveOrganization();
    vi.mocked(prisma.fotoAnimal.findMany).mockResolvedValue([
      { id: photoOneId, principal: true },
    ] as never);

    const result = await deleteAnimalPhoto(animalId, photoOneId);

    expect(result.code).toBe("LAST_PHOTO_REQUIRED");
    expect(prisma.fotoAnimal.delete).not.toHaveBeenCalled();
  });

  it("persists the first completed upload as primary and ordered", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback) => callback(prisma as never),
    );
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: organizacaoId },
      acolhedor: null,
    } as never);
    vi.mocked(prisma.animal.findUnique).mockResolvedValue({
      organizacaoId,
      acolhedorId: null,
    } as never);
    vi.mocked(prisma.fotoAnimal.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.fotoAnimal.count).mockResolvedValue(0);
    vi.mocked(prisma.fotoAnimal.create).mockResolvedValue({
      id: photoOneId,
      animalId,
      urlFoto: "https://files.example/luna.jpg",
      principal: true,
      ordem: 0,
      criadoEm: new Date("2026-07-29T00:00:00.000Z"),
    } as never);

    const result = await persistAnimalPhotoUpload(
      { userId, organizacaoId, acolhedorId: null, animalId },
      { url: "https://files.example/luna.jpg" },
    );

    expect(prisma.fotoAnimal.create).toHaveBeenCalledWith({
      data: {
        animalId,
        urlFoto: "https://files.example/luna.jpg",
        principal: true,
        ordem: 0,
      },
      select: {
        id: true,
        animalId: true,
        urlFoto: true,
        principal: true,
        ordem: true,
        criadoEm: true,
      },
    });
    expect(result.principal).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: "Serializable" },
    );
  });

  it("appends a later upload without creating another primary photo", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback) => callback(prisma as never),
    );
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: organizacaoId },
      acolhedor: null,
    } as never);
    vi.mocked(prisma.animal.findUnique).mockResolvedValue({
      organizacaoId,
      acolhedorId: null,
    } as never);
    vi.mocked(prisma.fotoAnimal.findFirst).mockResolvedValue({
      id: photoOneId,
    } as never);
    vi.mocked(prisma.fotoAnimal.count).mockResolvedValue(1);
    vi.mocked(prisma.fotoAnimal.create).mockResolvedValue({
      id: photoTwoId,
      animalId,
      urlFoto: "https://files.example/luna-2.jpg",
      principal: false,
      ordem: 1,
      criadoEm: new Date("2026-07-29T00:00:00.000Z"),
    } as never);

    const result = await persistAnimalPhotoUpload(
      { userId, organizacaoId, acolhedorId: null, animalId },
      { url: "https://files.example/luna-2.jpg" },
    );

    expect(prisma.fotoAnimal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          principal: false,
          ordem: 1,
        }),
      }),
    );
    expect(result.principal).toBe(false);
  });
});
