import {
  Prisma,
  SituacaoLT,
  StatusAnimal,
  StatusCuidadoPlanejado,
  TipoCuidadoPlanejado,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const FOSTER_STATE_NOT_ALLOWED = "FOSTER_STATE_NOT_ALLOWED";
export const INVALID_FOSTER_LINK = "INVALID_FOSTER_LINK";

export type FosterState = {
  situacaoLT: SituacaoLT;
  larTemporarioId: string | null;
};

// Todo caminho que leva o animal a ADOTADO grava isto junto com o status
// (spec 009, RF-013): adotado nao tem LT nem procura LT.
export const FOSTER_RESET_ON_ADOPTION = {
  situacaoLT: SituacaoLT.NAO_SE_APLICA,
  larTemporarioId: null,
} as const satisfies FosterState;

// "Em tratamento" e derivado, sem coluna (D3, C8): cuidado de medicamento ou
// tratamento ainda pendente, de qualquer data, em animal que nao foi adotado.
// Badge, filtro e card do painel usam esta mesma definicao.
export const pendingTreatmentCareWhere = {
  tipo: TipoCuidadoPlanejado.MEDICAMENTO_TRATAMENTO,
  status: StatusCuidadoPlanejado.PENDENTE,
} satisfies Prisma.CuidadoPlanejadoWhereInput;

export const inTreatmentWhere = {
  status: { not: StatusAnimal.ADOTADO },
  cuidadosPlanejados: { some: pendingTreatmentCareWhere },
} satisfies Prisma.AnimalWhereInput;

type FosterCurrent = {
  status: StatusAnimal;
  situacaoLT?: SituacaoLT | null;
  larTemporarioId?: string | null;
};

type FosterInput = {
  status: StatusAnimal;
  situacaoLT?: SituacaoLT;
  larTemporarioId?: string | null;
};

type FosterResult =
  | { data: FosterState }
  | { error: string; code: typeof FOSTER_STATE_NOT_ALLOWED | typeof INVALID_FOSTER_LINK };

const notAllowed = {
  error: "Situacao de lar temporario nao permitida para este animal",
  code: FOSTER_STATE_NOT_ALLOWED,
} as const;

const invalidLink = {
  error: "Lar temporario invalido para este animal",
  code: INVALID_FOSTER_LINK,
} as const;

/**
 * Decide o estado final de LT de um animal numa gravacao (research R4).
 *
 * Campo ausente na entrada mantem o valor atual (RF-013a); `current` nulo e o
 * create. `organizacaoId` e o dono do animal: nulo significa acolhedor, que nao
 * tem LT (D6). LT de outra organizacao e LT inexistente dao o mesmo erro, para
 * nao revelar o que existe em outra ONG.
 */
export async function resolveFosterState({
  current,
  input,
  organizacaoId,
}: {
  current: FosterCurrent | null;
  input: FosterInput;
  organizacaoId: string | null;
}): Promise<FosterResult> {
  const explicitSituacao = input.situacaoLT;
  const explicitLink = input.larTemporarioId;
  const asksForFoster =
    (explicitSituacao !== undefined && explicitSituacao !== SituacaoLT.NAO_SE_APLICA) ||
    (explicitLink !== undefined && explicitLink !== null);

  if (organizacaoId === null || input.status === StatusAnimal.ADOTADO) {
    return asksForFoster ? notAllowed : { data: { ...FOSTER_RESET_ON_ADOPTION } };
  }

  const situacaoLT =
    explicitSituacao ?? current?.situacaoLT ?? SituacaoLT.NAO_SE_APLICA;

  if (explicitLink !== undefined && explicitLink !== null) {
    if (situacaoLT !== SituacaoLT.EM_LT) return invalidLink;

    const fosterHome = await prisma.larTemporario.findFirst({
      where: { id: explicitLink, organizacaoId },
      select: { id: true },
    });
    if (!fosterHome) return invalidLink;

    return { data: { situacaoLT, larTemporarioId: explicitLink } };
  }

  const larTemporarioId =
    situacaoLT === SituacaoLT.EM_LT
      ? explicitLink === null
        ? null
        : (current?.larTemporarioId ?? null)
      : null;

  return { data: { situacaoLT, larTemporarioId } };
}
