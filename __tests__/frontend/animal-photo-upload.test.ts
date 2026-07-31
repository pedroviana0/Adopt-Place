import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadFiles = vi.hoisted(() => vi.fn());

vi.mock("uploadthing/client", () => ({
  genUploader: () => ({ uploadFiles }),
}));

import {
  animalPhotoUploadErrorMessage,
  completeAnimalPrimaryPhoto,
  uploadThingFetch,
  uploadAnimalPhoto,
  validateAnimalPhotoFile,
} from "../../frontend/src/lib/data/animal-photo-upload";

const animalId = "cm00000000000000000000003";

beforeEach(() => {
  uploadFiles.mockReset();
  vi.unstubAllGlobals();
});

describe("official frontend animal photo upload", () => {
  it("sends credentials only to the local authenticated upload route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal("fetch", fetchMock);

    await uploadThingFetch("/api/uploadthing?slug=animalPhoto", {
      method: "POST",
    });
    await uploadThingFetch("https://example.ufs.sh/upload/file", {
      method: "PUT",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/uploadthing?slug=animalPhoto",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://example.ufs.sh/upload/file",
      expect.objectContaining({ credentials: "omit" }),
    );
  });

  it("rejects invalid type and size before calling the provider", () => {
    expect(() =>
      validateAnimalPhotoFile(
        new File(["notes"], "notes.txt", { type: "text/plain" }),
      ),
    ).toThrow("Apenas imagens");

    const oversized = new File(["x"], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(oversized, "size", { value: 4 * 1024 * 1024 + 1 });
    expect(() => validateAnimalPhotoFile(oversized)).toThrow("4 MB");
    expect(uploadFiles).not.toHaveBeenCalled();
  });

  it("returns persisted metadata for a valid first primary photo", async () => {
    uploadFiles.mockResolvedValue([
      {
        serverData: {
          photo: {
            id: "photo-1",
            animalId,
            principal: true,
            ordem: 0,
          },
        },
      },
    ]);

    const result = await uploadAnimalPhoto(
      animalId,
      new File(["image"], "luna.jpg", { type: "image/jpeg" }),
      undefined,
      uploadFiles,
    );

    expect(uploadFiles).toHaveBeenCalledWith(
      "animalPhoto",
      expect.objectContaining({
        files: [expect.any(File)],
        input: { animalId },
      }),
    );
    expect(result).toMatchObject({
      id: "photo-1",
      animalId,
      principal: true,
    });
  });

  it("throws a retryable message when provider upload or persistence fails", async () => {
    uploadFiles.mockRejectedValue(new Error("provider unavailable"));

    await expect(
      uploadAnimalPhoto(
        animalId,
        new File(["image"], "luna.jpg", { type: "image/jpeg" }),
        undefined,
        uploadFiles,
      ),
    ).rejects.toThrow("Não foi possível enviar a foto");
    expect(
      animalPhotoUploadErrorMessage(new Error("provider unavailable")),
    ).toContain("Tente novamente");
  });

  it("does not report success when server persistence metadata is absent", async () => {
    uploadFiles.mockResolvedValue([{ serverData: null }]);

    await expect(
      uploadAnimalPhoto(
        animalId,
        new File(["image"], "luna.jpg", { type: "image/jpeg" }),
        undefined,
        uploadFiles,
      ),
    ).rejects.toThrow("não foi confirmada");
  });

  it("concludes a new animal only after a fresh read confirms its primary photo", async () => {
    uploadFiles.mockResolvedValue([
      {
        serverData: {
          photo: {
            id: "photo-1",
            animalId,
            principal: true,
            ordem: 0,
          },
        },
      },
    ]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ animal: { fotos: [] } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            animal: { fotos: [{ id: "photo-1", principal: true }] },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      completeAnimalPrimaryPhoto(
        animalId,
        new File(["image"], "luna.jpg", { type: "image/jpeg" }),
        undefined,
        uploadFiles,
      ),
    ).resolves.toEqual({ id: "photo-1", principal: true });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/animais/gerenciados/${animalId}`,
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("does not upload a duplicate when retry finds an existing primary photo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            animal: { fotos: [{ id: "photo-1", principal: true }] },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await expect(
      completeAnimalPrimaryPhoto(
        animalId,
        new File(["image"], "luna.jpg", { type: "image/jpeg" }),
        undefined,
        uploadFiles,
      ),
    ).resolves.toEqual({ id: "photo-1", principal: true });
    expect(uploadFiles).not.toHaveBeenCalled();
  });
});
