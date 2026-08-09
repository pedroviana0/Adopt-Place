import { StatusAnimal } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { getFeelsCards } from "@/lib/queries/feels";
import { feelsFilterSchema } from "@/lib/schemas/feels";

const voltaRedonda = { latitude: -22.5202, longitude: -44.0996 };

function animal(
  id: string,
  nome: string,
  cidade: string,
  coord: { latitude: number; longitude: number },
  extras: Record<string, unknown> = {},
) {
  return {
    id,
    nome,
    porte: "P",
    sexo: "F",
    idadeEstimada: "2 anos",
    castrado: true,
    status: StatusAnimal.DISPONIVEL,
    fotos: [{ urlFoto: "https://exemplo/1.jpg" }, { urlFoto: "https://exemplo/2.jpg" }],
    especie: { nome: "Gato" },
    raca: null,
    registrosSaude: [],
    organizacao: { cidade, estado: "RJ", ...coord },
    acolhedor: null,
    ...extras,
  };
}

const base = [
  animal("resende", "Longe", "Resende", { latitude: -22.4705, longitude: -44.4509 }),
  animal("vr", "Perto", "Volta Redonda", voltaRedonda),
  animal("angra", "Mais longe", "Angra dos Reis", { latitude: -23.0011, longitude: -44.3196 }),
  animal("barra", "Meio", "Barra Mansa", { latitude: -22.5481, longitude: -44.1752 }),
];

const filtros = (extra: Record<string, unknown> = {}) =>
  feelsFilterSchema.parse({ excluir: "", ...extra });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getFeelsCards", () => {
  it("ordena do mais perto para o mais longe", async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue(base as never);

    const { cartoes } = await getFeelsCards(voltaRedonda, filtros(), { animalIds: [] });

    expect(cartoes.map((c) => c.id)).toEqual(["vr", "barra", "resende", "angra"]);
    const distancias = cartoes.map((c) => c.distanciaKm ?? 0);
    expect(distancias).toEqual([...distancias].sort((a, b) => a - b));
  });

  it("nao devolve coordenada de responsavel em nenhum cartao", async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue(base as never);

    const { cartoes } = await getFeelsCards(voltaRedonda, filtros(), { animalIds: [] });

    const serializado = JSON.stringify(cartoes);
    expect(serializado).not.toContain("latitude");
    expect(serializado).not.toContain("longitude");
    expect(serializado).not.toContain("-44.4509");
  });

  it("corta pelo raio exato, nao pelo retangulo do banco", async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue(base as never);

    const { cartoes } = await getFeelsCards(voltaRedonda, filtros({ raioKm: 25 }), {
      animalIds: [],
    });

    // Dentro de 25 km: Volta Redonda (0) e Barra Mansa (8). Resende (36) e
    // Angra (58) entram no retangulo mas nao no circulo.
    expect(cartoes.map((c) => c.id)).toEqual(["vr", "barra"]);
  });

  it("resume as cidades da pilha, da mais perto para a mais longe", async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue(base as never);

    const { cidades } = await getFeelsCards(voltaRedonda, filtros(), { animalIds: [] });

    expect(cidades.map((c) => c.nome)).toEqual([
      "Volta Redonda",
      "Barra Mansa",
      "Resende",
      "Angra dos Reis",
    ]);
    expect(cidades[0]).toMatchObject({ estado: "RJ", distanciaKm: 0, animais: 1 });
  });

  it("conta todos os animais da cidade, mesmo alem do limite da pagina", async () => {
    const muitos = [
      ...base,
      animal("vr2", "Outro perto", "Volta Redonda", voltaRedonda),
      animal("vr3", "Mais um perto", "Volta Redonda", voltaRedonda),
    ];
    vi.mocked(prisma.animal.findMany).mockResolvedValue(muitos as never);

    const { cartoes, cidades } = await getFeelsCards(
      voltaRedonda,
      filtros({ limite: 2 }),
      { animalIds: [] },
    );

    expect(cartoes).toHaveLength(2);
    expect(cidades.find((c) => c.nome === "Volta Redonda")?.animais).toBe(3);
  });

  it("repassa as exclusoes para o banco em vez de filtrar depois", async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue([] as never);

    await getFeelsCards(voltaRedonda, filtros(), { animalIds: ["a", "b"] });

    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { notIn: ["a", "b"] } }),
      }),
    );
  });

  it("pede ao banco so a especie escolhida", async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue([] as never);

    await getFeelsCards(voltaRedonda, filtros({ especie: "cachorro" }), { animalIds: [] });

    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ especie: { nome: "Cachorro" } }),
      }),
    );
  });

  it("entrega todas as fotos do animal, para o carrossel do cartao", async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue([base[1]] as never);

    const { cartoes } = await getFeelsCards(voltaRedonda, filtros(), { animalIds: [] });

    expect(cartoes[0].fotos).toHaveLength(2);
  });
});

describe("feelsFilterSchema", () => {
  it("aceita qualquer distancia por padrao", () => {
    const f = feelsFilterSchema.parse({});
    expect(f.raioKm).toBeUndefined();
    expect(f.especie).toBe("todos");
  });

  it("recusa raio fora da escada oferecida", () => {
    expect(feelsFilterSchema.safeParse({ raioKm: 37 }).success).toBe(false);
    expect(feelsFilterSchema.safeParse({ raioKm: 50 }).success).toBe(true);
  });

  it("le a lista de exclusao separada por virgula", () => {
    expect(feelsFilterSchema.parse({ excluir: "a,b,c" }).excluir).toEqual(["a", "b", "c"]);
    expect(feelsFilterSchema.parse({ excluir: "" }).excluir).toEqual([]);
  });

  it("recusa coordenada fora do globo", () => {
    expect(feelsFilterSchema.safeParse({ latitude: 91 }).success).toBe(false);
    expect(feelsFilterSchema.safeParse({ longitude: -181 }).success).toBe(false);
  });
});
