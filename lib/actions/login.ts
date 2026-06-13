"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import { errorState, validationErrorState } from "@/lib/actions/form-state";
import { loginSchema } from "@/lib/schemas/adotante";
import type { FormState } from "@/lib/schemas/common";

export async function loginWithCredentials(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: parsed.data.callbackUrl || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorState("E-mail ou senha invalidos.");
    }

    throw error;
  }

  return errorState("Nao foi possivel iniciar sessao.");
}
