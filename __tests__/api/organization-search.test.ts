import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/busca/organizacoes/route";
import { prisma } from "@/lib/prisma";

const findMany = vi.mocked(prisma.organizacao.findMany);

beforeEach(() => vi.clearAllMocks());

function forbiddenKeys(value: unknown): string[] {
  const forbidden = new Set(["cpf", "cnpj", "email", "telefone", "endereco", "cep", "latitude", "longitude", "precisaoCoordenada", "usuarioId", "adotante", "acolhedor"]);
  const found: string[] = [];
  const visit = (current: unknown) => {
    if (!current || typeof current !== "object") return;
    for (const [key, nested] of Object.entries(current)) {
      if (forbidden.has(key)) found.push(key);
      visit(nested);
    }
  };
  visit(value);
  return found;
}

describe("GET /api/busca/organizacoes", () => {
  it.each(["", " ", "a", "á"])("rejeita termo inválido %j antes da query", async (q) => {
    const response = await GET(new Request(`http://localhost/api/busca/organizacoes?q=${encodeURIComponent(q)}`));
    expect(response.status).toBe(400);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("retorna no máximo organizações em allowlist sem pessoas ou dados privados", async () => {
    findMany.mockResolvedValue(Array.from({ length: 10 }, (_, index) => ({
      id: `org-${index}`,
      razaoSocial: `Organização ${index}`,
      cidade: "Volta Redonda",
      estado: "RJ",
    })) as never);
    const response = await GET(new Request("http://localhost/api/busca/organizacoes?q=organizacao"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.results).toHaveLength(10);
    expect(Object.keys(body.results[0])).toEqual(["id", "nome", "municipio", "uf"]);
    expect(forbiddenKeys(body)).toEqual([]);
  });
});
