import { NextResponse } from "next/server";

import { updatePhotoOrder } from "@/lib/actions/fotos";
import {
  actionErrorResponse,
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { idSchema } from "@/lib/schemas/common";
import { photoOrderSchema } from "@/lib/schemas/foto-animal";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const animalId = idSchema.safeParse((await context.params).id);
  if (!animalId.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const json = await readJson(request);
  if ("response" in json) {
    return json.response;
  }
  const body =
    json.body && typeof json.body === "object" && "photos" in json.body
      ? (json.body as { photos: unknown }).photos
      : undefined;
  const photos = photoOrderSchema.safeParse(body);
  if (!photos.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Ordenacao de fotos invalida",
      photos.error.flatten().fieldErrors,
    );
  }

  const result = await updatePhotoOrder(animalId.data, photos.data);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
