import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createAdopterAccount,
  createFosterAccount,
  createOrganizationAccount,
  RegistrationConflictError,
} from "@/lib/actions/auth-register";
import { adopterRegistrationSchema } from "@/lib/schemas/adotante";
import {
  fosterRegistrationSchema,
  organizationRegistrationSchema,
} from "@/lib/schemas/perfil";

const registrationTypeSchema = z.enum(["adotante", "organizacao", "acolhedor"]);

function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const parsedType = registrationTypeSchema.safeParse((await params).tipo);
  if (!parsedType.success) {
    return errorResponse(
      404,
      "REGISTRATION_TYPE_NOT_FOUND",
      "Tipo de cadastro nao encontrado.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "JSON invalido.");
  }

  const schema =
    parsedType.data === "adotante"
      ? adopterRegistrationSchema
      : parsedType.data === "organizacao"
        ? organizationRegistrationSchema
        : fosterRegistrationSchema;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados.",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const user =
      parsedType.data === "adotante"
        ? await createAdopterAccount(
            parsed.data as z.infer<typeof adopterRegistrationSchema>,
          )
        : parsedType.data === "organizacao"
          ? await createOrganizationAccount(
              parsed.data as z.infer<typeof organizationRegistrationSchema>,
            )
          : await createFosterAccount(
              parsed.data as z.infer<typeof fosterRegistrationSchema>,
            );

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      const messages = {
        EMAIL_ALREADY_EXISTS: "E-mail ja cadastrado.",
        CPF_ALREADY_EXISTS: "CPF ja cadastrado.",
        CNPJ_ALREADY_EXISTS: "CNPJ ja cadastrado.",
      } as const;
      return errorResponse(409, error.code, messages[error.code]);
    }
    throw error;
  }
}
