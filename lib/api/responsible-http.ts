import { NextResponse } from "next/server";

import {
  getResponsibleContext,
  type ResponsibleContext,
} from "@/lib/api/responsible-context";

export function responsibleApiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export async function requireActiveResponsible(): Promise<
  { context: ResponsibleContext } | { response: NextResponse }
> {
  const result = await getResponsibleContext();
  if ("error" in result) {
    return {
      response: responsibleApiError(
        result.error.status,
        result.error.code,
        result.error.message,
      ),
    };
  }
  return result;
}

export function actionErrorResponse(result: {
  error?: string;
  code?: string;
}): NextResponse {
  const code = result.code ?? "OPERATION_FAILED";
  const status =
    code === "UNAUTHENTICATED"
      ? 401
      : code === "FORBIDDEN" || code === "INACTIVE_ACCOUNT"
        ? 403
        : code === "NOT_FOUND"
          ? 404
          : code === "HAS_DEPENDENCIES" ||
              code === "PRIMARY_REPLACEMENT_REQUIRED" ||
              code === "INVALID_TRANSITION"
            ? 409
            : 400;

  return responsibleApiError(
    status,
    code,
    result.error ?? "Operacao nao concluida",
  );
}

export async function readJson(
  request: Request,
): Promise<{ body: unknown } | { response: NextResponse }> {
  try {
    return { body: await request.json() } as const;
  } catch {
    return {
      response: responsibleApiError(
        400,
        "INVALID_JSON",
        "Corpo JSON invalido",
      ),
    } as const;
  }
}
