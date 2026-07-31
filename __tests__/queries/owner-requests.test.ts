import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { getOwnerRequestDetail } from "@/lib/queries/owner-request-detail";
import { getOwnerRequests } from "@/lib/queries/owner-requests";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.solicitacaoAdocao.findMany).mockResolvedValue([]);
});

describe("getOwnerRequestDetail ownership", () => {
  it("applies ownership in the same query that selects screening data", async () => {
    vi.mocked(prisma.solicitacaoAdocao.findFirst).mockResolvedValue(null);

    await getOwnerRequestDetail("request-1", "org-1", "ORGANIZACAO");

    expect(prisma.solicitacaoAdocao.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "request-1",
          animal: { organizacaoId: "org-1" },
        },
      }),
    );
    expect(prisma.solicitacaoAdocao.findUnique).not.toHaveBeenCalled();
  });
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
