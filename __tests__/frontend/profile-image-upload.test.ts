import { describe, expect, it, vi } from "vitest";

vi.mock("uploadthing/client", () => ({ genUploader: () => ({ uploadFiles: vi.fn() }) }));

import {
  MAX_PROFILE_IMAGE_BYTES,
  uploadProfileImage,
  validateProfileImage,
} from "../../frontend/src/lib/data/profile-image-upload";

describe("profile image upload adapter", () => {
  it("rejeita tipo e tamanho invalidos antes do provedor", () => {
    expect(validateProfileImage(new File(["x"], "x.txt", { type: "text/plain" }))).toContain("imagem");
    const large = new File(["x"], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(large, "size", { value: MAX_PROFILE_IMAGE_BYTES + 1 });
    expect(validateProfileImage(large)).toContain("4 MB");
  });

  it("so retorna sucesso depois da persistencia confirmada", async () => {
    const file = new File(["x"], "profile.jpg", { type: "image/jpeg" });
    const confirmed = vi.fn().mockResolvedValue([
      { serverData: { profileImage: { fotoUrl: "https://cdn.example.com/profile.jpg" } } },
    ]);
    await expect(uploadProfileImage(file, confirmed)).resolves.toBe("https://cdn.example.com/profile.jpg");
    expect(confirmed).toHaveBeenCalledWith("profileImage", { files: [file], input: {} });

    await expect(uploadProfileImage(file, vi.fn().mockResolvedValue([{ serverData: null }]))).rejects.toThrow(
      "não confirmou",
    );
  });
});
