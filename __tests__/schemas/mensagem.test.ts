import { describe, expect, it } from "vitest";

import { mensagemSchema } from "@/lib/schemas/mensagem";

describe("mensagemSchema", () => {
  it("trims and accepts text up to 2,000 characters", () => {
    const result = mensagemSchema.safeParse({ texto: `  ${"a".repeat(1998)}  ` });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.texto).toHaveLength(1998);
    }
  });

  it.each(["", "   "])("rejects empty text %#", (texto) => {
    expect(mensagemSchema.safeParse({ texto }).success).toBe(false);
  });

  it("rejects text over 2,000 characters", () => {
    expect(mensagemSchema.safeParse({ texto: "a".repeat(2001) }).success).toBe(false);
  });
});
