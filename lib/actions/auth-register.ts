"use server";

import { TipoPerfil } from "@prisma/client";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";

import { errorState, validationErrorState } from "@/lib/actions/form-state";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adopterRegistrationSchema } from "@/lib/schemas/adotante";
import type { FormState } from "@/lib/schemas/common";

export async function registerAdopter(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = adopterRegistrationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const existingEmail = await prisma.usuario.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingEmail) {
    return errorState("E-mail ja cadastrado.");
  }

  const existingCpf = await prisma.adotante.findUnique({
    where: { cpf: parsed.data.cpf },
    select: { id: true },
  });

  if (existingCpf) {
    return errorState("CPF ja cadastrado.");
  }

  const senhaHash = await hash(parsed.data.password, 12);

  await prisma.usuario.create({
    data: {
      email: parsed.data.email,
      senhaHash,
      tipoPerfil: TipoPerfil.ADOTANTE,
      adotante: {
        create: {
          nomeCompleto: parsed.data.nomeCompleto,
          cpf: parsed.data.cpf,
          telefone: parsed.data.telefone,
          instagram: parsed.data.instagram,
          endereco: parsed.data.endereco,
          cidade: parsed.data.cidade,
          estado: parsed.data.estado,
        },
      },
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard/triagem",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorState("Conta criada, mas nao foi possivel iniciar sessao.");
    }

    throw error;
  }

  return errorState("Conta criada, mas o redirecionamento nao foi concluido.");
}
