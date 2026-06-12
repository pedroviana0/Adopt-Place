"use server";

import { revalidatePath } from "next/cache";

import { requireAdopter } from "@/lib/actions/auth-guards";
import { successState, validationErrorState } from "@/lib/actions/form-state";
import { prisma } from "@/lib/prisma";
import { adopterScreeningSchema } from "@/lib/schemas/adotante";
import type { FormState } from "@/lib/schemas/common";

export async function saveScreening(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAdopter();
  const adotanteId = session.user.adotanteId;

  if (!adotanteId) {
    throw new Error("Perfil de adotante nao encontrado.");
  }

  const parsed = adopterScreeningSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  await prisma.adotante.update({
    where: { id: adotanteId },
    data: {
      ...Object.fromEntries(
        Object.entries(parsed.data).map(([key, value]) => [key, value === undefined ? null : value]),
      ),
      triagemConcluida: true,
    },
  });

  revalidatePath("/dashboard/triagem");

  return successState("Triagem salva.");
}
