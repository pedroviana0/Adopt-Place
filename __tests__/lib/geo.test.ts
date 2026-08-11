import { describe, expect, it } from "vitest";

import {
  arredondarPorPrivacidade,
  distanciaKm,
  faixaGeografica,
  formatarDistancia,
} from "@/lib/geo";

const voltaRedonda = { latitude: -22.5202, longitude: -44.0996 };
const barraMansa = { latitude: -22.5446, longitude: -44.1717 };
const resende = { latitude: -22.4705, longitude: -44.4509 };
const saoPaulo = { latitude: -23.5475, longitude: -46.6361 };
const manaus = { latitude: -3.1019, longitude: -60.025 };
const boaVista = { latitude: 2.8235, longitude: -60.6758 };
const chui = { latitude: -33.6875, longitude: -53.4595 };

describe("distanciaKm", () => {
  it("mede distancias conhecidas entre municipios", () => {
    // Distancias reais entre os centroides, conferidas contra o dataset do IBGE.
    expect(distanciaKm(voltaRedonda, barraMansa)).toBeCloseTo(8.2, 0);
    expect(distanciaKm(voltaRedonda, resende)).toBeCloseTo(36.5, 0);
    expect(distanciaKm(voltaRedonda, saoPaulo)).toBeCloseTo(283.6, 0);
  });

  it("da zero para o mesmo ponto, sem erro de arredondamento", () => {
    expect(distanciaKm(voltaRedonda, voltaRedonda)).toBe(0);
  });

  it("e simetrica", () => {
    expect(distanciaKm(manaus, saoPaulo)).toBeCloseTo(
      distanciaKm(saoPaulo, manaus),
      6,
    );
  });

  it("atravessa o equador sem erro de sinal", () => {
    // Boa Vista fica no hemisferio norte; Chui no extremo sul. ~4.400 km.
    const d = distanciaKm(boaVista, chui);
    expect(d).toBeGreaterThan(4000);
    expect(d).toBeLessThan(4800);
  });

  it("nunca devolve valor negativo", () => {
    const pontos = [voltaRedonda, saoPaulo, manaus, boaVista, chui];
    for (const a of pontos)
      for (const b of pontos) expect(distanciaKm(a, b)).toBeGreaterThanOrEqual(0);
  });
});

describe("faixaGeografica", () => {
  it("contem todo ponto que esta dentro do raio", () => {
    const raio = 50;
    const faixa = faixaGeografica(voltaRedonda, raio);

    for (const ponto of [barraMansa, resende]) {
      expect(distanciaKm(voltaRedonda, ponto)).toBeLessThan(raio);
      expect(ponto.latitude).toBeGreaterThanOrEqual(faixa.latMin);
      expect(ponto.latitude).toBeLessThanOrEqual(faixa.latMax);
      expect(ponto.longitude).toBeGreaterThanOrEqual(faixa.lngMin);
      expect(ponto.longitude).toBeLessThanOrEqual(faixa.lngMax);
    }
  });

  it("exclui quem esta claramente fora", () => {
    const faixa = faixaGeografica(voltaRedonda, 50);
    const foraDaFaixa =
      saoPaulo.latitude < faixa.latMin ||
      saoPaulo.latitude > faixa.latMax ||
      saoPaulo.longitude < faixa.lngMin ||
      saoPaulo.longitude > faixa.lngMax;
    expect(foraDaFaixa).toBe(true);
  });

  it("alarga a faixa de longitude longe do equador", () => {
    const perto = faixaGeografica({ latitude: 0, longitude: 0 }, 100);
    const longe = faixaGeografica({ latitude: -33, longitude: 0 }, 100);
    expect(longe.lngMax - longe.lngMin).toBeGreaterThan(perto.lngMax - perto.lngMin);
  });

  it("nao estoura os limites do globo", () => {
    const faixa = faixaGeografica({ latitude: -89.9, longitude: 179.9 }, 500);
    expect(faixa.latMin).toBeGreaterThanOrEqual(-90);
    expect(faixa.latMax).toBeLessThanOrEqual(90);
    expect(faixa.lngMin).toBeGreaterThanOrEqual(-180);
    expect(faixa.lngMax).toBeLessThanOrEqual(180);
  });
});

describe("arredondarPorPrivacidade", () => {
  it("corta a coordenada em duas casas", () => {
    expect(arredondarPorPrivacidade({ latitude: -22.520234, longitude: -44.099687 })).toEqual({
      latitude: -22.52,
      longitude: -44.1,
    });
  });

  it("desloca o ponto em menos de 2 km, mantendo a ordenacao util", () => {
    const exato = { latitude: -22.520234, longitude: -44.099687 };
    expect(distanciaKm(exato, arredondarPorPrivacidade(exato))).toBeLessThan(2);
  });
});

describe("formatarDistancia", () => {
  it("nao mostra zero km para quem esta muito perto", () => {
    expect(formatarDistancia(0)).toBe("menos de 1 km");
    expect(formatarDistancia(0.4)).toBe("menos de 1 km");
  });

  it("arredonda a partir de 1 km", () => {
    expect(formatarDistancia(1)).toBe("a 1 km");
    expect(formatarDistancia(12.4)).toBe("a 12 km");
    expect(formatarDistancia(12.6)).toBe("a 13 km");
  });
});
