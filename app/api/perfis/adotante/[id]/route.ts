import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { getAdopterProfile } from "@/lib/queries/public-profiles";
import { publicProfileIdSchema } from "@/lib/schemas/public-profiles";

const errorResponse = (status: number, code: string, message: string) =>
  NextResponse.json({ error: { code, message } }, { status });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsedId = publicProfileIdSchema.safeParse((await context.params).id);
  if (!parsedId.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Revise os parâmetros informados.");
  }

  const profile = await getAdopterProfile(parsedId.data, await getServerSession());
  if (!profile) return errorResponse(404, "PROFILE_NOT_FOUND", "Perfil não encontrado.");
  return NextResponse.json({ profile });
}
