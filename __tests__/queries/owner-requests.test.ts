import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { getOwnerRequests } from "@/lib/queries/owner-requests";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.solicitacaoAdocao.findMany).mockResolvedValue([]);
});

describe("getOwnerRequests filters", () => {
  it("applies EM_ANALISE together with responsible ownership", async () => {
    await getOwnerRequests("org-1", "ORGANIZACAO", { status: "EM_ANALISE" });

    const query = vi.mocked(prisma.solicitacaoAdocao.findMany).mock.calls[0]?.[0];
    expect(query?.where).toEqual({
      animal: { organizacaoId: "org-1" },
      status: "EM_ANALISE",
    });
  });
});
