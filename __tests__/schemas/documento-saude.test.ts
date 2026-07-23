import { describe, expect, it } from "vitest";

import {
  MAX_HEALTH_DOCUMENT_BYTES,
  documentoSaudeUploadSchema,
} from "@/lib/schemas/documento-saude";

const baseDocument = {
  animalId: "cm00000000000000000000001",
  tipo: "EXAME",
  nomeArquivo: "hemograma.pdf",
  mimeType: "application/pdf",
  tamanhoBytes: 1024,
};

describe("documentoSaudeUploadSchema", () => {
  it.each(["application/pdf", "image/jpeg", "image/png", "image/webp"])(
    "accepts supported MIME %s",
    (mimeType) => {
      expect(
        documentoSaudeUploadSchema.safeParse({ ...baseDocument, mimeType }).success,
      ).toBe(true);
    },
  );

  it("accepts a file at the 10 MB limit", () => {
    expect(
      documentoSaudeUploadSchema.safeParse({
        ...baseDocument,
        tamanhoBytes: MAX_HEALTH_DOCUMENT_BYTES,
      }).success,
    ).toBe(true);
  });

  it("rejects an unsupported MIME and an oversized file", () => {
    expect(
      documentoSaudeUploadSchema.safeParse({
        ...baseDocument,
        mimeType: "application/zip",
      }).success,
    ).toBe(false);
    expect(
      documentoSaudeUploadSchema.safeParse({
        ...baseDocument,
        tamanhoBytes: MAX_HEALTH_DOCUMENT_BYTES + 1,
      }).success,
    ).toBe(false);
  });
});
