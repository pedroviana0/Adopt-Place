import { NextResponse } from "next/server";

import { getPublicAnimalById } from "@/lib/queries/public-animal";
import { getAnimalTags } from "@/lib/tags";
import { formatPublicFosterName } from "@/lib/public-profile-name";

// Public animal detail contract (SHOWCASE-01 / Issue #26): GET /api/animais/[id].
// Public, no auth. Excludes responsible/adopter private data, contacts, and
// granular clinical fields (only the health summary category + date is exposed).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const animal = await getPublicAnimalById(id);

  if (!animal) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Animal nao encontrado." } },
      { status: 404 },
    );
  }

  const responsavel = animal.organizacao?.razaoSocial ??
    (animal.acolhedor ? formatPublicFosterName(animal.acolhedor.nomeCompleto) : null);
  const responsavelId = animal.organizacao?.id ?? animal.acolhedor?.id ?? null;
  const responsavelTipo = animal.organizacao
    ? "ORGANIZACAO"
    : animal.acolhedor
      ? "ACOLHEDOR"
      : null;
  const cidade = animal.organizacao?.cidade ?? animal.acolhedor?.cidade ?? null;

  return NextResponse.json({
    id: animal.id,
    nome: animal.nome,
    porte: animal.porte,
    sexo: animal.sexo,
    cor: animal.cor,
    idadeEstimada: animal.idadeEstimada,
    castrado: animal.castrado,
    descricao: animal.descricao,
    status: animal.status,
    criadoEm: animal.criadoEm,
    especie: animal.especie?.nome ?? null,
    raca: animal.raca?.nome ?? null,
    fotos: animal.fotos.map((foto) => ({
      id: foto.id,
      urlFoto: foto.urlFoto,
      principal: foto.principal,
    })),
    resumoSaude: animal.registrosSaude.map((registro) => ({
      id: registro.id,
      tipo: registro.tipo,
      dataRegistro: registro.dataRegistro,
    })),
    responsavel,
    responsavelId,
    responsavelTipo,
    cidade,
    tags: getAnimalTags(animal),
    relacionados: animal.relacionadosA.map(({ animalRelacionado }) => ({
      id: animalRelacionado.id,
      nome: animalRelacionado.nome,
      porte: animalRelacionado.porte,
      sexo: animalRelacionado.sexo,
      idadeEstimada: animalRelacionado.idadeEstimada,
      castrado: animalRelacionado.castrado,
      status: animalRelacionado.status,
      fotoPrincipal: animalRelacionado.fotos[0]?.urlFoto ?? null,
      especie: animalRelacionado.especie?.nome ?? null,
      raca: animalRelacionado.raca?.nome ?? null,
      cidade:
        animalRelacionado.organizacao?.cidade ??
        animalRelacionado.acolhedor?.cidade ??
        null,
      responsavel:
        animalRelacionado.organizacao?.razaoSocial ??
        (animalRelacionado.acolhedor
          ? formatPublicFosterName(animalRelacionado.acolhedor.nomeCompleto)
          : null),
      responsavelId:
        animalRelacionado.organizacao?.id ?? animalRelacionado.acolhedor?.id ?? null,
      responsavelTipo: animalRelacionado.organizacao
        ? "ORGANIZACAO"
        : animalRelacionado.acolhedor
          ? "ACOLHEDOR"
          : null,
      tags: getAnimalTags(animalRelacionado),
    })),
  });
}
