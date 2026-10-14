import { SituacaoLT, StatusAnimal } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FOSTER_RESET_ON_ADOPTION,
  resolveFosterState,
} from "@/lib/lar-temporario";
import { prisma } from "@/lib/prisma";

const organizacaoId = "cm00000000000000000000002";
const larTemporarioId = "cm00000000000000000000010";
const outroLarTemporarioId = "cm00000000000000000000011";

const findFosterHome = vi.mocked(prisma.larTemporario.findFirst);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveFosterState", () => {
  it("mantem os valores atuais quando a entrada nao traz campos de LT", async () => {
    const result = await resolveFosterState({
      current: {
        status: StatusAnimal.DISPONIVEL,
        situacaoLT: SituacaoLT.EM_LT,
        larTemporarioId,
      },
      input: { status: StatusAnimal.DISPONIVEL },
      organizacaoId,
    });

    expect(result).toEqual({
      data: { situacaoLT: SituacaoLT.EM_LT, larTemporarioId },
    });
    expect(findFosterHome).not.toHaveBeenCalled();
  });

  it("trata estado atual sem campos de LT como NAO_SE_APLICA e sem vinculo", async () => {
    const result = await resolveFosterState({
      current: { status: StatusAnimal.EM_CUIDADOS },
      input: { status: StatusAnimal.EM_CUIDADOS },
      organizacaoId,
    });

    expect(result).toEqual({
      data: { situacaoLT: SituacaoLT.NAO_SE_APLICA, larTemporarioId: null },
    });
  });

  it("no create sem campos de LT gera NAO_SE_APLICA e sem vinculo", async () => {
    const result = await resolveFosterState({
      current: null,
      input: { status: StatusAnimal.EM_CUIDADOS },
      organizacaoId,
    });

    expect(result).toEqual({
      data: { situacaoLT: SituacaoLT.NAO_SE_APLICA, larTemporarioId: null },
    });
  });

  it("recusa situacao de LT em animal de acolhedor", async () => {
    const result = await resolveFosterState({
      current: null,
      input: { status: StatusAnimal.EM_CUIDADOS, situacaoLT: SituacaoLT.PROCURANDO },
      organizacaoId: null,
    });

    expect(result).toMatchObject({ code: "FOSTER_STATE_NOT_ALLOWED" });
  });

  it("recusa vinculo a LT em animal de acolhedor", async () => {
    const result = await resolveFosterState({
      current: { status: StatusAnimal.EM_CUIDADOS },
      input: { status: StatusAnimal.EM_CUIDADOS, larTemporarioId },
      organizacaoId: null,
    });

    expect(result).toMatchObject({ code: "FOSTER_STATE_NOT_ALLOWED" });
    expect(findFosterHome).not.toHaveBeenCalled();
  });

  it("aceita NAO_SE_APLICA explicito em animal de acolhedor", async () => {
    const result = await resolveFosterState({
      current: null,
      input: {
        status: StatusAnimal.EM_CUIDADOS,
        situacaoLT: SituacaoLT.NAO_SE_APLICA,
        larTemporarioId: null,
      },
      organizacaoId: null,
    });

    expect(result).toEqual({
      data: { situacaoLT: SituacaoLT.NAO_SE_APLICA, larTemporarioId: null },
    });
  });

  it("reseta LT quando o status final e ADOTADO sem campos de LT", async () => {
    const result = await resolveFosterState({
      current: {
        status: StatusAnimal.EM_PROCESSO_ADOCAO,
        situacaoLT: SituacaoLT.EM_LT,
        larTemporarioId,
      },
      input: { status: StatusAnimal.ADOTADO },
      organizacaoId,
    });

    expect(result).toEqual({ data: FOSTER_RESET_ON_ADOPTION });
  });

  it("recusa situacao de LT explicita com status final ADOTADO", async () => {
    const result = await resolveFosterState({
      current: { status: StatusAnimal.DISPONIVEL },
      input: { status: StatusAnimal.ADOTADO, situacaoLT: SituacaoLT.PROCURANDO },
      organizacaoId,
    });

    expect(result).toMatchObject({ code: "FOSTER_STATE_NOT_ALLOWED" });
  });

  it("recusa vinculo explicito com status final ADOTADO", async () => {
    const result = await resolveFosterState({
      current: { status: StatusAnimal.DISPONIVEL },
      input: { status: StatusAnimal.ADOTADO, larTemporarioId },
      organizacaoId,
    });

    expect(result).toMatchObject({ code: "FOSTER_STATE_NOT_ALLOWED" });
  });

  it("zera o vinculo ao sair de EM_LT", async () => {
    const result = await resolveFosterState({
      current: {
        status: StatusAnimal.DISPONIVEL,
        situacaoLT: SituacaoLT.EM_LT,
        larTemporarioId,
      },
      input: { status: StatusAnimal.DISPONIVEL, situacaoLT: SituacaoLT.PROCURANDO },
      organizacaoId,
    });

    expect(result).toEqual({
      data: { situacaoLT: SituacaoLT.PROCURANDO, larTemporarioId: null },
    });
  });

  it("aceita sair de EM_LT quando o formulario envia larTemporarioId null", async () => {
    const result = await resolveFosterState({
      current: {
        status: StatusAnimal.DISPONIVEL,
        situacaoLT: SituacaoLT.EM_LT,
        larTemporarioId,
      },
      input: {
        status: StatusAnimal.DISPONIVEL,
        situacaoLT: SituacaoLT.PROCURANDO,
        larTemporarioId: null,
      },
      organizacaoId,
    });

    expect(result).toEqual({
      data: { situacaoLT: SituacaoLT.PROCURANDO, larTemporarioId: null },
    });
  });

  it("recusa vinculo junto com situacao explicita diferente de EM_LT", async () => {
    const result = await resolveFosterState({
      current: { status: StatusAnimal.DISPONIVEL },
      input: {
        status: StatusAnimal.DISPONIVEL,
        situacaoLT: SituacaoLT.PROCURANDO,
        larTemporarioId,
      },
      organizacaoId,
    });

    expect(result).toMatchObject({ code: "INVALID_FOSTER_LINK" });
    expect(findFosterHome).not.toHaveBeenCalled();
  });

  it("recusa vinculo quando a situacao mantida nao e EM_LT", async () => {
    const result = await resolveFosterState({
      current: {
        status: StatusAnimal.DISPONIVEL,
        situacaoLT: SituacaoLT.PROCURANDO,
        larTemporarioId: null,
      },
      input: { status: StatusAnimal.DISPONIVEL, larTemporarioId },
      organizacaoId,
    });

    expect(result).toMatchObject({ code: "INVALID_FOSTER_LINK" });
  });

  it("recusa LT de outra organizacao ou inexistente", async () => {
    findFosterHome.mockResolvedValue(null);

    const result = await resolveFosterState({
      current: { status: StatusAnimal.DISPONIVEL },
      input: {
        status: StatusAnimal.DISPONIVEL,
        situacaoLT: SituacaoLT.EM_LT,
        larTemporarioId: outroLarTemporarioId,
      },
      organizacaoId,
    });

    expect(result).toMatchObject({ code: "INVALID_FOSTER_LINK" });
    expect(findFosterHome).toHaveBeenCalledWith({
      where: { id: outroLarTemporarioId, organizacaoId },
      select: { id: true },
    });
  });

  it("aceita vinculo a LT da propria organizacao", async () => {
    findFosterHome.mockResolvedValue({ id: larTemporarioId } as never);

    const result = await resolveFosterState({
      current: { status: StatusAnimal.DISPONIVEL },
      input: {
        status: StatusAnimal.DISPONIVEL,
        situacaoLT: SituacaoLT.EM_LT,
        larTemporarioId,
      },
      organizacaoId,
    });

    expect(result).toEqual({
      data: { situacaoLT: SituacaoLT.EM_LT, larTemporarioId },
    });
  });

  it("aceita EM_LT sem LT registrado", async () => {
    const result = await resolveFosterState({
      current: { status: StatusAnimal.EM_CUIDADOS },
      input: { status: StatusAnimal.EM_CUIDADOS, situacaoLT: SituacaoLT.EM_LT },
      organizacaoId,
    });

    expect(result).toEqual({
      data: { situacaoLT: SituacaoLT.EM_LT, larTemporarioId: null },
    });
  });
});
