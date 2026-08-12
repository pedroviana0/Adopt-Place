import { Prisma, TipoPerfil } from "@prisma/client";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";

import { errorState, validationErrorState } from "@/lib/actions/form-state";
import { signIn } from "@/lib/auth";
import {
  camposDeLocalizacao,
  resolverLocalizacaoOuFalhar,
} from "@/lib/localizacao";
import { normalizarNomeMunicipio } from "@/lib/municipios";
import { prisma } from "@/lib/prisma";
import {
  adopterRegistrationSchema,
  type AdopterRegistrationInput,
} from "@/lib/schemas/adotante";
import type { FormState } from "@/lib/schemas/common";
import type {
  FosterRegistrationInput,
  OrganizationRegistrationInput,
} from "@/lib/schemas/perfil";

export type RegistrationConflictCode =
  | "EMAIL_ALREADY_EXISTS"
  | "CPF_ALREADY_EXISTS"
  | "CNPJ_ALREADY_EXISTS";

export class RegistrationConflictError extends Error {
  constructor(readonly code: RegistrationConflictCode) {
    super(code);
    this.name = "RegistrationConflictError";
  }
}

// Resolve a localizacao antes de qualquer escrita: cidade, UF e coordenada sao
// derivadas do CEP pelo servidor, nunca aceitas prontas do navegador.
const resolverOuFalhar = resolverLocalizacaoOuFalhar;

export type RegisteredUserDTO = {
  id: string;
  email: string;
  tipoPerfil: TipoPerfil;
  ativo: boolean;
  profileId: string;
};

async function assertEmailAvailable(email: string): Promise<void> {
  const existing = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new RegistrationConflictError("EMAIL_ALREADY_EXISTS");
  }
}

async function assertCpfAvailable(cpf: string): Promise<void> {
  const [adopter, foster] = await Promise.all([
    prisma.adotante.findUnique({ where: { cpf }, select: { id: true } }),
    prisma.acolhedorIndependente.findUnique({
      where: { cpf },
      select: { id: true },
    }),
  ]);

  if (adopter || foster) {
    throw new RegistrationConflictError("CPF_ALREADY_EXISTS");
  }
}

function mapCreatedUser(
  user: {
    id: string;
    email: string;
    tipoPerfil: TipoPerfil;
    ativo: boolean;
    adotante?: { id: string } | null;
    organizacao?: { id: string } | null;
    acolhedor?: { id: string } | null;
  },
): RegisteredUserDTO {
  const profileId =
    user.adotante?.id ?? user.organizacao?.id ?? user.acolhedor?.id;

  if (!profileId) {
    throw new Error("Perfil criado nao encontrado.");
  }

  return {
    id: user.id,
    email: user.email,
    tipoPerfil: user.tipoPerfil,
    ativo: user.ativo,
    profileId,
  };
}

function mapUniqueConstraint(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(",")
      : String(error.meta?.target ?? "");

    if (target.includes("cpf")) {
      throw new RegistrationConflictError("CPF_ALREADY_EXISTS");
    }
    if (target.includes("cnpj")) {
      throw new RegistrationConflictError("CNPJ_ALREADY_EXISTS");
    }
    throw new RegistrationConflictError("EMAIL_ALREADY_EXISTS");
  }

  throw error;
}

export async function createAdopterAccount(
  input: AdopterRegistrationInput,
): Promise<RegisteredUserDTO> {
  await assertEmailAvailable(input.email);
  await assertCpfAvailable(input.cpf);
  const localizacao = await resolverOuFalhar(input);
  const senhaHash = await hash(input.password, 12);

  try {
    const user = await prisma.usuario.create({
      data: {
        email: input.email,
        senhaHash,
        tipoPerfil: TipoPerfil.ADOTANTE,
        adotante: {
          create: {
            nomeCompleto: input.nomeCompleto,
            cpf: input.cpf,
            telefone: input.telefone,
            instagram: input.instagram,
            endereco: input.endereco,
            ...camposDeLocalizacao(localizacao),
          },
        },
      },
      select: {
        id: true,
        email: true,
        tipoPerfil: true,
        ativo: true,
        adotante: { select: { id: true } },
      },
    });

    return mapCreatedUser(user);
  } catch (error) {
    return mapUniqueConstraint(error);
  }
}

export async function createOrganizationAccount(
  input: OrganizationRegistrationInput,
): Promise<RegisteredUserDTO> {
  await assertEmailAvailable(input.email);
  const existingCnpj = await prisma.organizacao.findUnique({
    where: { cnpj: input.cnpj },
    select: { id: true },
  });

  if (existingCnpj) {
    throw new RegistrationConflictError("CNPJ_ALREADY_EXISTS");
  }

  const localizacao = await resolverOuFalhar(input);
  const senhaHash = await hash(input.password, 12);

  try {
    const user = await prisma.usuario.create({
      data: {
        email: input.email,
        senhaHash,
        tipoPerfil: TipoPerfil.ORGANIZACAO,
        organizacao: {
          create: {
            razaoSocial: input.razaoSocial,
            razaoSocialNormalizada: normalizarNomeMunicipio(input.razaoSocial),
            cnpj: input.cnpj,
            telefone: input.telefone,
            endereco: input.endereco,
            ...camposDeLocalizacao(localizacao),
            responsavelNome: input.responsavelNome,
            capacidadeMaxima: input.capacidadeMaxima,
          },
        },
      },
      select: {
        id: true,
        email: true,
        tipoPerfil: true,
        ativo: true,
        organizacao: { select: { id: true } },
      },
    });

    return mapCreatedUser(user);
  } catch (error) {
    return mapUniqueConstraint(error);
  }
}

export async function createFosterAccount(
  input: FosterRegistrationInput,
): Promise<RegisteredUserDTO> {
  await assertEmailAvailable(input.email);
  await assertCpfAvailable(input.cpf);
  const localizacao = await resolverOuFalhar(input);
  const senhaHash = await hash(input.password, 12);

  try {
    const user = await prisma.usuario.create({
      data: {
        email: input.email,
        senhaHash,
        tipoPerfil: TipoPerfil.ACOLHEDOR,
        acolhedor: {
          create: {
            nomeCompleto: input.nomeCompleto,
            cpf: input.cpf,
            telefone: input.telefone,
            endereco: input.endereco,
            ...camposDeLocalizacao(localizacao),
          },
        },
      },
      select: {
        id: true,
        email: true,
        tipoPerfil: true,
        ativo: true,
        acolhedor: { select: { id: true } },
      },
    });

    return mapCreatedUser(user);
  } catch (error) {
    return mapUniqueConstraint(error);
  }
}

export async function registerAdopter(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  "use server";

  const parsed = adopterRegistrationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  try {
    await createAdopterAccount(parsed.data);
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      const messages: Record<RegistrationConflictCode, string> = {
        EMAIL_ALREADY_EXISTS: "E-mail ja cadastrado.",
        CPF_ALREADY_EXISTS: "CPF ja cadastrado.",
        CNPJ_ALREADY_EXISTS: "CNPJ ja cadastrado.",
      };
      return errorState(messages[error.code]);
    }
    throw error;
  }

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
