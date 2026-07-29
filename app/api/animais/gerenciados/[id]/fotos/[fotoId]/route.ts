import { NextResponse } from "next/server";

import {
  deleteAnimalPhoto,
  setPrimaryPhoto,
} from "@/lib/actions/fotos";
import {
  actionErrorResponse,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { idSchema } from "@/lib/schemas/common";
import { deletePhotoSchema } from "@/lib/schemas/foto-animal";

type RouteContext = {
  params: Promise<{ id: string; fotoId: string }>;
};

async function ids(context: RouteContext) {
  const params = await context.params;
  const animalId = idSchema.safeParse(params.id);
  const fotoId = idSchema.safeParse(params.fotoId);
  return animalId.success && fotoId.success
    ? { animalId: animalId.data, fotoId: fotoId.data }
    : null;
}

export async function PUT(_request: Request, context: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const parsedIds = await ids(context);
  if (!parsedIds) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const result = await setPrimaryPhoto(parsedIds.animalId, parsedIds.fotoId);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const parsedIds = await ids(context);
  if (!parsedIds) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  let input: unknown = {};
  const body = await request.text();
  if (body) {
    try {
      input = JSON.parse(body);
    } catch {
      return responsibleApiError(400, "INVALID_JSON", "Corpo JSON invalido");
    }
  }
  const parsedInput = deletePhotoSchema.safeParse(input);
  if (!parsedInput.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Dados invalidos");
  }

  const result = await deleteAnimalPhoto(
    parsedIds.animalId,
    parsedIds.fotoId,
    parsedInput.data,
  );
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
