export type Coordenada = {
  latitude: number;
  longitude: number;
};

const RAIO_TERRA_KM = 6371;

const emRadianos = (graus: number) => (graus * Math.PI) / 180;

/**
 * Distancia em linha reta entre dois pontos, por Haversine.
 *
 * Roda no servidor sobre o conjunto ja reduzido pelo recorte de FR-003: a
 * constituicao do projeto proibe SQL cru, e o Prisma nao tem Haversine nativo,
 * entao o banco corta por faixa de lat/lng e a distancia exata sai aqui.
 */
export function distanciaKm(origem: Coordenada, destino: Coordenada): number {
  const dLat = emRadianos(destino.latitude - origem.latitude);
  const dLon = emRadianos(destino.longitude - origem.longitude);
  const lat1 = emRadianos(origem.latitude);
  const lat2 = emRadianos(destino.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type FaixaGeografica = {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
};

/**
 * Retangulo que contem o circulo de raio informado. Serve para o banco
 * descartar a maior parte das linhas por indice antes de qualquer trigonometria.
 *
 * O retangulo e sempre maior que o circulo, entao inclui pontos que estao um
 * pouco fora do raio — quem filtra de verdade e a distancia calculada depois.
 * Nunca exclui um ponto que deveria entrar, que e a propriedade que importa.
 */
export function faixaGeografica(centro: Coordenada, raioKm: number): FaixaGeografica {
  const grausLat = (raioKm / RAIO_TERRA_KM) * (180 / Math.PI);
  // Um grau de longitude encurta conforme se afasta do equador.
  const cosLat = Math.cos(emRadianos(centro.latitude));
  const grausLng =
    Math.abs(cosLat) < 1e-9 ? 180 : grausLat / Math.abs(cosLat);

  return {
    latMin: Math.max(-90, centro.latitude - grausLat),
    latMax: Math.min(90, centro.latitude + grausLat),
    lngMin: Math.max(-180, centro.longitude - grausLng),
    lngMax: Math.min(180, centro.longitude + grausLng),
  };
}

/**
 * Coordenada arredondada antes de sair do navegador (FR-030): precisao
 * suficiente para ordenar por proximidade, insuficiente para apontar a
 * residencia de alguem. Duas casas decimais equivalem a cerca de 1 km.
 */
export const CASAS_DECIMAIS_PRIVACIDADE = 2;

export function arredondarPorPrivacidade(coordenada: Coordenada): Coordenada {
  const fator = 10 ** CASAS_DECIMAIS_PRIVACIDADE;
  return {
    latitude: Math.round(coordenada.latitude * fator) / fator,
    longitude: Math.round(coordenada.longitude * fator) / fator,
  };
}

/** "menos de 1 km" / "a 12 km", conforme FR-009. */
export function formatarDistancia(km: number): string {
  return km < 1 ? "menos de 1 km" : `a ${Math.round(km)} km`;
}
