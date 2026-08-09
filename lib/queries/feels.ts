import { Prisma, StatusAnimal } from "@prisma/client";

import { distanciaKm, faixaGeografica, type Coordenada } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import type { FeelsFilters } from "@/lib/schemas/feels";
import { getAnimalTags } from "@/lib/tags";

/**
 * Quantos candidatos o banco entrega antes de o servidor ordenar por distancia.
 * O recorte por faixa de lat/lng ja descartou o resto do pais; este teto evita
 * carregar uma cidade inteira em memoria quando o raio e "qualquer".
 */
const TETO_CANDIDATOS = 300;

const selecaoAnimal = {
  id: true,
  nome: true,
  porte: true,
  sexo: true,
  idadeEstimada: true,
  castrado: true,
  status: true,
  fotos: {
    orderBy: [{ principal: "desc" as const }, { ordem: "asc" as const }],
    select: { urlFoto: true },
  },
  especie: { select: { nome: true } },
  raca: { select: { nome: true } },
  registrosSaude: { select: { tipo: true } },
  organizacao: { select: { cidade: true, estado: true, latitude: true, longitude: true } },
  acolhedor: { select: { cidade: true, estado: true, latitude: true, longitude: true } },
};

function filtroDeEspecie(especie: FeelsFilters["especie"]): Prisma.AnimalWhereInput {
  if (especie === "todos") return {};
  return { especie: { nome: especie === "cachorro" ? "Cachorro" : "Gato" } };
}

/**
 * Recorte geografico feito pelo banco, por faixa de latitude e longitude.
 *
 * A constituicao do projeto proibe SQL cru, e o Prisma nao tem Haversine — o
 * banco reduz por indice e a distancia exata sai no servidor, sobre um conjunto
 * ja pequeno. O retangulo e maior que o circulo, entao inclui alguns pontos
 * fora do raio; quem corta de verdade e o filtro de distancia depois.
 */
function filtroGeografico(
  origem: Coordenada,
  raioKm: number | undefined,
): Prisma.AnimalWhereInput {
  if (!raioKm) return {};

  const faixa = faixaGeografica(origem, raioKm);
  const dentro = {
    latitude: { gte: faixa.latMin, lte: faixa.latMax },
    longitude: { gte: faixa.lngMin, lte: faixa.lngMax },
  };

  return { OR: [{ organizacao: dentro }, { acolhedor: dentro }] };
}

export type CartaoDoFeels = {
  id: string;
  nome: string;
  porte: string;
  sexo: string;
  idadeEstimada: string | null;
  especie: string | null;
  raca: string | null;
  cidade: string | null;
  estado: string | null;
  distanciaKm: number | null;
  fotos: string[];
  tags: ReturnType<typeof getAnimalTags>;
};

export type ResultadoDoFeels = {
  cartoes: CartaoDoFeels[];
  /**
   * Cidades representadas na pilha, da mais perto para a mais longe. Torna o
   * raio concreto: "50 km" nao diz nada, "Volta Redonda, Barra Mansa e Resende"
   * diz.
   */
  cidades: { nome: string; estado: string; distanciaKm: number; animais: number }[];
};

export async function getFeelsCards(
  origem: Coordenada,
  filtros: FeelsFilters,
  exclusoes: { animalIds: string[] },
): Promise<ResultadoDoFeels> {
  const candidatos = await prisma.animal.findMany({
    where: {
      status: StatusAnimal.DISPONIVEL,
      ...(exclusoes.animalIds.length > 0 ? { id: { notIn: exclusoes.animalIds } } : {}),
      ...filtroDeEspecie(filtros.especie),
      ...filtroGeografico(origem, filtros.raioKm),
    },
    take: TETO_CANDIDATOS,
    orderBy: { criadoEm: "desc" },
    select: selecaoAnimal,
  });

  const comDistancia = candidatos
    .map((animal) => {
      const responsavel = animal.organizacao ?? animal.acolhedor;
      const distancia =
        responsavel?.latitude != null && responsavel.longitude != null
          ? distanciaKm(origem, {
              latitude: responsavel.latitude,
              longitude: responsavel.longitude,
            })
          : null;

      return { animal, responsavel, distancia };
    })
    // O retangulo do banco e mais largo que o circulo: o corte exato e aqui.
    .filter((item) => !filtros.raioKm || (item.distancia !== null && item.distancia <= filtros.raioKm))
    .sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));

  const paginados = comDistancia.slice(0, filtros.limite);

  const porCidade = new Map<string, { nome: string; estado: string; distanciaKm: number; animais: number }>();
  for (const { responsavel, distancia } of comDistancia) {
    if (!responsavel?.cidade || distancia === null) continue;
    const chave = `${responsavel.cidade}/${responsavel.estado}`;
    const atual = porCidade.get(chave);
    if (atual) atual.animais += 1;
    else
      porCidade.set(chave, {
        nome: responsavel.cidade,
        estado: responsavel.estado,
        distanciaKm: Math.round(distancia),
        animais: 1,
      });
  }

  return {
    cartoes: paginados.map(({ animal, responsavel, distancia }) => ({
      id: animal.id,
      nome: animal.nome,
      porte: animal.porte,
      sexo: animal.sexo,
      idadeEstimada: animal.idadeEstimada,
      especie: animal.especie?.nome ?? null,
      raca: animal.raca?.nome ?? null,
      cidade: responsavel?.cidade ?? null,
      estado: responsavel?.estado ?? null,
      // Arredondada: a coordenada do responsavel nunca cruza a fronteira HTTP.
      distanciaKm: distancia === null ? null : Math.round(distancia * 10) / 10,
      fotos: animal.fotos.map((f) => f.urlFoto),
      tags: getAnimalTags(animal),
    })),
    cidades: [...porCidade.values()].sort((a, b) => a.distanciaKm - b.distanciaKm),
  };
}
