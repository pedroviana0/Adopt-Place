import { NextResponse } from "next/server";

import { searchPublicOrganizations } from "@/lib/queries/public-profiles";
import { organizationSearchSchema } from "@/lib/schemas/public-profiles";

export async function GET(request: Request) {
  const parsed = organizationSearchSchema.safeParse(new URL(request.url).searchParams.get("q") ?? "");
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Revise o termo de busca." } },
      { status: 400 },
    );
  }
  return NextResponse.json({ results: await searchPublicOrganizations(parsed.data) });
}
