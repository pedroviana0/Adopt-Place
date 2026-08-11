import { NextResponse } from "next/server";

import { resolverLocalizacaoPorCep } from "@/lib/localizacao";
import { cepSchema } from "@/lib/schemas/localizacao";

// Consulta de CEP para o formulario preencher o endereco (US1 / FR-002).
// Publica: o cadastro acontece antes de existir sessao. Nao devolve
// coordenada — ela e privada e nunca cruza a fronteira HTTP (FR-029).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cep: string }> },
) {
  const parsed = cepSchema.safeParse((await params).cep);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Informe um CEP com 8 digitos." } },
      { status: 400 },
    );
  }

  const resolucao = await resolverLocalizacaoPorCep(parsed.data);

  switch (resolucao.situacao) {
    case "resolvida":
      return NextResponse.json({
        endereco: {
          cep: resolucao.localizacao.cep,
          logradouro: resolucao.localizacao.logradouro,
          bairro: resolucao.localizacao.bairro,
          cidade: resolucao.localizacao.cidade,
          estado: resolucao.localizacao.estado,
          municipioId: resolucao.localizacao.municipioId,
        },
      });

    case "cep_invalido":
      return NextResponse.json(
        { error: { code: "CEP_NOT_FOUND", message: "CEP nao encontrado." } },
        { status: 404 },
      );

    case "municipio_desconhecido":
      return NextResponse.json(
        {
          error: {
            code: "MUNICIPALITY_NOT_FOUND",
            message: "Municipio deste CEP nao esta na base.",
          },
        },
        { status: 422 },
      );

    case "indisponivel":
      return NextResponse.json(
        {
          error: {
            code: "CEP_SERVICE_UNAVAILABLE",
            message: "Consulta de CEP indisponivel. Escolha o municipio.",
          },
        },
        { status: 503 },
      );
  }
}
