import { StatusAnimal } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Regra de anuncio: um animal so aparece na vitrine publica com pelo menos
// duas fotos reais. Uma foto sozinha nao mostra o animal o bastante para
// alguem decidir adotar.
export const MIN_PHOTOS_TO_PUBLISH = 2;

export const PHOTOS_REQUIRED_TO_PUBLISH = "PHOTOS_REQUIRED_TO_PUBLISH";
export const PUBLISHED_MIN_PHOTOS = "PUBLISHED_MIN_PHOTOS";

export const photosRequiredToPublishMessage = `O anuncio exige pelo menos ${MIN_PHOTOS_TO_PUBLISH} fotos do animal`;

export const publishedMinPhotosMessage = `Um animal anunciado precisa manter pelo menos ${MIN_PHOTOS_TO_PUBLISH} fotos. Envie outra foto ou tire o animal da vitrine antes de remover esta`;

export const newAnimalCannotPublishMessage =
  "Cadastre o animal, envie as fotos e depois publique o anuncio";

export function countAnimalPhotos(animalId: string): Promise<number> {
  return prisma.fotoAnimal.count({ where: { animalId } });
}

/**
 * A regra vale na *transicao* para DISPONIVEL, nao em toda escrita de um animal
 * ja publicado. Animais anunciados antes desta regra continuam editaveis; o que
 * fica bloqueado e publicar de novo sem atender ao minimo.
 */
export function isPublishTransition(
  currentStatus: StatusAnimal,
  nextStatus: StatusAnimal,
): boolean {
  return (
    nextStatus === StatusAnimal.DISPONIVEL &&
    currentStatus !== StatusAnimal.DISPONIVEL
  );
}
