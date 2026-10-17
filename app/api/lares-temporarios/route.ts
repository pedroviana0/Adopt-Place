import { NextResponse } from "next/server";

import { createFosterHome } from "@/lib/actions/lares-temporarios";
import {
  actionErrorResponse,
  readJson,
  requireActiveOrganization,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { getFosterHomes } from "@/lib/queries/lares-temporarios";
import { larTemporarioCreateSchema } from "@/lib/schemas/lar-temporario";

export async function GET() {
  const current = await requireActiveOrganization();
  if ("response" in current) return current.response;

  const laresTemporarios = await getFosterHomes(current.context.responsavelId);
  return NextResponse.json({ laresTemporarios });
}

export async function POST(request: Request) {
  const current = await requireActiveOrganization();
  if ("response" in current) return current.response;

  const json = await readJson(request);
  if ("response" in json) return json.response;

  const input = larTemporarioCreateSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await createFosterHome(input.data, current.context);
  if (result.error || !result.id) return actionErrorResponse(result);

  return NextResponse.json({ larTemporario: { id: result.id } }, { status: 201 });
}
