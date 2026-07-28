import { Prisma, TipoPerfil } from "@prisma/client";
import { NextResponse } from "next/server";
import type { z } from "zod";

import { getServerSession, INACTIVE_ACCOUNT_MESSAGE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  adopterProfileUpdateSchema,
  fosterProfileUpdateSchema,
  organizationProfileUpdateSchema,
} from "@/lib/schemas/perfil";

const profileSelect = {
  id: true,
  email: true,
  tipoPerfil: true,
  ativo: true,
  adotante: {
    select: {
      id: true,
      nomeCompleto: true,
      cpf: true,
      telefone: true,
      instagram: true,
      endereco: true,
      cidade: true,
      estado: true,
    },
  },
  organizacao: {
    select: {
      id: true,
      razaoSocial: true,
      cnpj: true,
      telefone: true,
      endereco: true,
      cidade: true,
      estado: true,
      responsavelNome: true,
      capacidadeMaxima: true,
    },
  },
  acolhedor: {
    select: {
      id: true,
      nomeCompleto: true,
      cpf: true,
      telefone: true,
      endereco: true,
      cidade: true,
      estado: true,
      capacidadeAtual: true,
    },
  },
} satisfies Prisma.UsuarioSelect;

type ProfileUser = Prisma.UsuarioGetPayload<{ select: typeof profileSelect }>;

function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
) {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  );
}

async function currentProfileUser(): Promise<
  { user: ProfileUser } | { response: NextResponse }
> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return {
      response: errorResponse(
        401,
        "UNAUTHENTICATED",
        "Autenticacao necessaria.",
      ),
    };
  }

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
  });

  if (!user?.ativo) {
    return {
      response: errorResponse(
        403,
        "INACTIVE_ACCOUNT",
        INACTIVE_ACCOUNT_MESSAGE,
      ),
    };
  }

  return { user };
}

function profileDTO(user: ProfileUser) {
  if (user.tipoPerfil === TipoPerfil.ADOTANTE && user.adotante) {
    return {
      tipoPerfil: user.tipoPerfil,
      email: user.email,
      ...user.adotante,
    };
  }
  if (user.tipoPerfil === TipoPerfil.ORGANIZACAO && user.organizacao) {
    return {
      tipoPerfil: user.tipoPerfil,
      email: user.email,
      ...user.organizacao,
    };
  }
  if (user.tipoPerfil === TipoPerfil.ACOLHEDOR && user.acolhedor) {
    return {
      tipoPerfil: user.tipoPerfil,
      email: user.email,
      ...user.acolhedor,
    };
  }
  return null;
}

export async function GET() {
  const current = await currentProfileUser();
  if ("response" in current) {
    return current.response;
  }

  const profile = profileDTO(current.user);
  if (!profile) {
    return errorResponse(404, "PROFILE_NOT_FOUND", "Perfil nao encontrado.");
  }

  return NextResponse.json({ profile });
}

async function parseBody(request: Request): Promise<
  { body: unknown } | { response: NextResponse }
> {
  try {
    return { body: await request.json() };
  } catch {
    return {
      response: errorResponse(400, "VALIDATION_ERROR", "JSON invalido."),
    };
  }
}

function validationResponse(error: z.ZodError) {
  return errorResponse(
    400,
    "VALIDATION_ERROR",
    "Revise os campos informados.",
    error.flatten().fieldErrors,
  );
}

export async function PATCH(request: Request) {
  const current = await currentProfileUser();
  if ("response" in current) {
    return current.response;
  }

  const parsedBody = await parseBody(request);
  if ("response" in parsedBody) {
    return parsedBody.response;
  }

  try {
    let updated: ProfileUser;

    if (current.user.tipoPerfil === TipoPerfil.ADOTANTE) {
      const parsed = adopterProfileUpdateSchema.safeParse(parsedBody.body);
      if (!parsed.success) return validationResponse(parsed.error);
      const { email, ...profile } = parsed.data;
      updated = await prisma.usuario.update({
        where: { id: current.user.id },
        data: {
          ...(email ? { email } : {}),
          adotante: { update: profile },
        },
        select: profileSelect,
      });
    } else if (current.user.tipoPerfil === TipoPerfil.ORGANIZACAO) {
      const parsed = organizationProfileUpdateSchema.safeParse(parsedBody.body);
      if (!parsed.success) return validationResponse(parsed.error);
      const { email, ...profile } = parsed.data;
      updated = await prisma.usuario.update({
        where: { id: current.user.id },
        data: {
          ...(email ? { email } : {}),
          organizacao: { update: profile },
        },
        select: profileSelect,
      });
    } else if (current.user.tipoPerfil === TipoPerfil.ACOLHEDOR) {
      const parsed = fosterProfileUpdateSchema.safeParse(parsedBody.body);
      if (!parsed.success) return validationResponse(parsed.error);
      const { email, ...profile } = parsed.data;
      updated = await prisma.usuario.update({
        where: { id: current.user.id },
        data: {
          ...(email ? { email } : {}),
          acolhedor: { update: profile },
        },
        select: profileSelect,
      });
    } else {
      return errorResponse(
        403,
        "ROLE_NOT_SUPPORTED",
        "Este perfil nao pode ser editado.",
      );
    }

    const profile = profileDTO(updated);
    if (!profile) {
      return errorResponse(404, "PROFILE_NOT_FOUND", "Perfil nao encontrado.");
    }

    return NextResponse.json({ profile });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        409,
        "EMAIL_ALREADY_EXISTS",
        "E-mail ja cadastrado.",
      );
    }
    throw error;
  }
}
