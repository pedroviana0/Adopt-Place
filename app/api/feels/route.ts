import { NextResponse } from "next/server";

import { apiError, requireActiveAdopter } from "@/lib/api/adopter-context";
import { arredondarPorPrivacidade, type Coordenada } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { getFeelsCards } from "@/lib/queries/feels";
import { feelsFilterSchema } from "@/lib/schemas/feels";

type OrigemResolvida = {
  coordenada: Coordenada;
  fonte: "navegador" | "municipio" | "cadastro";
  cidade: string | null;
  estado: string | null;
};

/**
 * Ordem de resolucao da posicao (FR-017): o que o navegador mandou, depois o
 * municipio pedido a mao, depois o cadastro. Nenhuma delas bloqueia o feed.
 */
async function resolverOrigem(
  adotanteId: string,
  filtros: { latitude?: number; longitude?: number; municipioId?: string },
): Promise<OrigemResolvida | null> {
  if (filtros.latitude !== undefined && filtros.longitude !== undefined) {
    return {
      // Arredondada de novo no servidor: nao dependemos de o cliente ter feito.
      coordenada: arredondarPorPrivacidade({
        latitude: filtros.latitude,
        longitude: filtros.longitude,
      }),
      fonte: "navegador",
      cidade: null,
      estado: null,
    };
  }

  if (filtros.municipioId) {
    const municipio = await prisma.municipio.findUnique({
      where: { codigoIbge: filtros.municipioId },
      select: { nome: true, uf: true, latitude: true, longitude: true },
    });
    if (municipio) {
      return {
        coordenada: { latitude: municipio.latitude, longitude: municipio.longitude },
        fonte: "municipio",
        cidade: municipio.nome,
        estado: municipio.uf,
      };
    }
  }

  const adotante = await prisma.adotante.findUnique({
    where: { id: adotanteId },
    select: { cidade: true, estado: true, latitude: true, longitude: true },
  });

  if (adotante?.latitude == null || adotante.longitude == null) return null;

  return {
    coordenada: { latitude: adotante.latitude, longitude: adotante.longitude },
    fonte: "cadastro",
    cidade: adotante.cidade,
    estado: adotante.estado,
  };
}

// Feed do Feels (US2/US4). Exclusivo de adotante ativo: curtir grava favorito,
// que e uma acao de adotante. Nao devolve coordenada de ninguem — so distancia
// arredondada, cidade e UF (FR-029).
export async function GET(request: Request) {
  const atual = await requireActiveAdopter();
  if ("response" in atual) {
    return atual.response;
  }

  const { searchParams } = new URL(request.url);
  const filtros = feelsFilterSchema.safeParse({
    raioKm: searchParams.get("raioKm") ?? undefined,
    especie: searchParams.get("especie") ?? undefined,
    latitude: searchParams.get("latitude") ?? undefined,
    longitude: searchParams.get("longitude") ?? undefined,
    municipioId: searchParams.get("municipioId") ?? undefined,
    excluir: searchParams.get("excluir") ?? "",
    limite: searchParams.get("limite") ?? undefined,
  });

  if (!filtros.success) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Filtros invalidos.",
      filtros.error.flatten().fieldErrors,
    );
  }

  const origem = await resolverOrigem(atual.adotanteId, filtros.data);
  if (!origem) {
    return apiError(
      422,
      "LOCATION_REQUIRED",
      "Informe sua localizacao para ver animais por proximidade.",
    );
  }

  // Favoritados e ja solicitados saem da pilha: a pessoa ja decidiu sobre eles.
  const [favoritos, solicitacoes] = await Promise.all([
    prisma.favorito.findMany({
      where: { adotanteId: atual.adotanteId },
      select: { animalId: true },
    }),
    prisma.solicitacaoAdocao.findMany({
      where: { adotanteId: atual.adotanteId },
      select: { animalId: true },
    }),
  ]);

  const excluir = [
    ...new Set([
      ...filtros.data.excluir,
      ...favoritos.map((f) => f.animalId),
      ...solicitacoes.map((s) => s.animalId),
    ]),
  ];

  const { cartoes, cidades } = await getFeelsCards(
    origem.coordenada,
    filtros.data,
    { animalIds: excluir },
  );

  return NextResponse.json({
    cartoes,
    cidades,
    origem: { fonte: origem.fonte, cidade: origem.cidade, estado: origem.estado },
  });
}
