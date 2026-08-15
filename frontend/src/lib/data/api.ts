// Shared HTTP helper for the official frontend → backend contracts.
// Calls relative `/api/*` with cookies (same-origin/proxy boundary, T019) and
// unwraps the standard error envelope. `details` remains accepted only for
// backward compatibility with responses emitted before the fieldErrors contract.

export interface ApiError extends Error {
  code?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    ...rest,
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const envelope = (
      data as {
        error?: {
          code?: string;
          message?: string;
          fieldErrors?: Record<string, string[] | undefined>;
          details?: Record<string, string[] | undefined>;
        };
      }
    )?.error;
    const err: ApiError = new Error(envelope?.message ?? "Não foi possível concluir a operação");
    err.code = envelope?.code;
    err.fieldErrors = envelope?.fieldErrors ?? envelope?.details;
    throw err;
  }
  return data as T;
}
