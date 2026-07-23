import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { getOwnedAnimals } from "@/lib/queries/owned-animals";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.animal.findMany).mockResolvedValue([]);
});

describe("getOwnedAnimals filters", () => {
  it("combines canonical status with organization ownership", async () => {
    await getOwnedAnimals("org-1", "ORGANIZACAO", { status: "DISPONIVEL" });

    expect(vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0]?.where).toEqual({
      organizacaoId: "org-1",
      status: "DISPONIVEL",
    });
  });
});
