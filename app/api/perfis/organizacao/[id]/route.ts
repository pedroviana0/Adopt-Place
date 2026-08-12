import { NextResponse } from "next/server";

import { getPublicOrganizationProfile } from "@/lib/queries/public-profiles";
import {
  publicProfileCatalogFilterSchema,
  publicProfileIdSchema,
  type PublicProfileSearchParams,
} from "@/lib/schemas/public-profiles";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function searchParamsFrom(request: Request): PublicProfileSearchParams {
  const searchParams = new URL(request.url).searchParams;
  const params: PublicProfileSearchParams = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    params[key] = values.length > 1 ? values : values[0];
  }
  return params;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const parsedId = publicProfileIdSchema.safeParse(id);
  const parsedFilters = publicProfileCatalogFilterSchema.safeParse(
    searchParamsFrom(request),
  );

  if (!parsedId.success || !parsedFilters.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Revise os parâmetros informados.",
    );
  }

  const result = await getPublicOrganizationProfile(
    parsedId.data,
    parsedFilters.data,
  );

  if (!result) {
    return errorResponse(404, "PROFILE_NOT_FOUND", "Perfil não encontrado.");
  }

  return NextResponse.json(result);
}
