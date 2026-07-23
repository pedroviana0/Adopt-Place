import { describe, expect, it } from "vitest";

import {
  conversationFilterSchema,
  healthAgendaFilterSchema,
  ownedAnimalFilterSchema,
  ownerRequestFilterSchema,
} from "@/lib/schemas/dashboard-filters";

describe("dashboard URL filters", () => {
  it("accepts supported source-of-truth filters", () => {
    expect(ownerRequestFilterSchema.safeParse({ status: "EM_ANALISE" }).success).toBe(
      true,
    );
    expect(ownedAnimalFilterSchema.safeParse({ status: "DISPONIVEL" }).success).toBe(
      true,
    );
    expect(
      healthAgendaFilterSchema.safeParse({ situacao: "ATRASADO" }).success,
    ).toBe(true);
    expect(conversationFilterSchema.safeParse({ status: "arquivadas" }).success).toBe(
      true,
    );
  });

  it("rejects unsupported filter values", () => {
    expect(ownerRequestFilterSchema.safeParse({ status: "PENDENTE" }).success).toBe(
      false,
    );
    expect(ownedAnimalFilterSchema.safeParse({ status: "INATIVO" }).success).toBe(
      false,
    );
    expect(
      healthAgendaFilterSchema.safeParse({ situacao: "AMANHA" }).success,
    ).toBe(false);
    expect(conversationFilterSchema.safeParse({ status: "excluidas" }).success).toBe(
      false,
    );
  });
});
