import { NextResponse } from "next/server";

import { requireActiveAdmin } from "@/lib/api/admin-http";
import { getAllUsers } from "@/lib/queries/admin-users";

// ADMIN-01 (Issue #60, T109): admin-only user listing. Returns an allowlisted
// user DTO (no password hash or private profile data). Dates are ISO strings.
export async function GET() {
  const current = await requireActiveAdmin();
  if ("response" in current) return current.response;

  const users = await getAllUsers();
  return NextResponse.json({ users });
}
