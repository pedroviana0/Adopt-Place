import type { NextResponse } from "next/server";

import { responsibleApiError } from "@/lib/api/responsible-http";

// HEALTH-CENTER-01 (Issue #49): the planned-care Server Actions return
// `{ error: string }` without a code. Route-level auth is already handled by
// `requireActiveResponsible`, so here we map only the remaining domain errors to
// HTTP status by their stable message, without modifying the shared actions.
export function mapCareActionError(error: string): NextResponse {
  const lower = error.toLowerCase();
  const status = lower.includes("nao encontrado")
    ? 404
    : lower.includes("acesso negado") || lower.includes("apenas responsaveis")
      ? 403
      : lower.includes("nao autenticado")
        ? 401
        : lower.includes("desativada")
          ? 403
          : lower.includes("ja concluido") || lower.includes("ja cancelado")
            ? 409
            : 400;

  return responsibleApiError(status, "OPERATION_FAILED", error);
}
