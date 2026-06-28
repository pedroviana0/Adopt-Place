import type { ZodError } from "zod";

import type { FormState } from "@/lib/schemas/common";

export const initialFormState: FormState = {
  ok: false,
};

export function successState(message?: string): FormState {
  return {
    ok: true,
    message,
  };
}

export function errorState(message: string): FormState {
  return {
    ok: false,
    message,
  };
}

export function validationErrorState(error: ZodError): FormState {
  const fieldErrors = Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );

  return {
    ok: false,
    message: "Revise os campos destacados.",
    fieldErrors,
  };
}
