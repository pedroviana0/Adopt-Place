import { PrecisaoCoordenada } from "@prisma/client";

import { provedorCep } from "@/lib/cep";
import { prisma } from "@/lib/prisma";

/**
 * Localizacao pronta para gravar. A coordenada vem SEMPRE do centroide do
 * municipio, nunca do provedor de CEP: medimos e o campo de coordenada das
 * APIs gratuitas ja e o centroide do municipio, so que atras de uma chamada
 * de rede que pode falhar.
 */
export type LocalizacaoResolvida = {
  cep: string | null;
  municipioId: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  precisaoCoordenada: PrecisaoCoordenada;
  logradouro: string | null;
  bairro: string | null;
};

export type ResolucaoLocalizacao =
  | { situacao: "resolvida"; localizacao: LocalizacaoResolvida }
  | { situacao: "cep_invalido" }
  | { situacao: "municipio_desconhecido"; codigoIbge: string }
  | { situacao: "indisponivel"; motivo: string };

async function localizacaoDoMunicipio(
  codigoIbge: string,
  extras: { cep?: string | null; logradouro?: string | null; bairro?: string | null } = {},
): Promise<ResolucaoLocalizacao> {
  const municipio = await prisma.municipio.findUnique({
    where: { codigoIbge },
    select: { codigoIbge: true, nome: true, uf: true, latitude: true, longitude: true },
  });

  if (!municipio) {
    return { situacao: "municipio_desconhecido", codigoIbge };
  }

  return {
    situacao: "resolvida",
    localizacao: {
      cep: extras.cep ?? null,
      municipioId: municipio.codigoIbge,
      cidade: municipio.nome,
      estado: municipio.uf,
      latitude: municipio.latitude,
      longitude: municipio.longitude,
      precisaoCoordenada: PrecisaoCoordenada.MUNICIPIO,
      logradouro: extras.logradouro ?? null,
      bairro: extras.bairro ?? null,
    },
  };
}

/**
 * CEP -> provedor -> codigo IBGE -> centroide na nossa tabela.
 *
 * O provedor confirma que o CEP existe e diz qual e o municipio. A coordenada
 * sai da tabela local, entao a qualidade do dado gravado nao depende de qual
 * provedor esta ativo nem de ele estar no ar quando alguem se cadastra.
 */
export async function resolverLocalizacaoPorCep(
  cep: string,
): Promise<ResolucaoLocalizacao> {
  const resultado = await provedorCep().buscar(cep);

  if (resultado.situacao === "nao_encontrado") {
    return { situacao: "cep_invalido" };
  }
  if (resultado.situacao === "indisponivel") {
    return { situacao: "indisponivel", motivo: resultado.motivo };
  }

  return localizacaoDoMunicipio(resultado.endereco.codigoIbge, {
    cep: resultado.endereco.cep,
    logradouro: resultado.endereco.logradouro,
    bairro: resultado.endereco.bairro,
  });
}

/**
 * Caminho de escape quando o provedor esta fora do ar: a pessoa escolhe o
 * municipio numa lista vinda da nossa tabela. A coordenada resultante e
 * identica a que o caminho do CEP produziria — o provedor nunca foi a fonte.
 */
export async function resolverLocalizacaoPorMunicipio(
  codigoIbge: string,
  cep?: string | null,
): Promise<ResolucaoLocalizacao> {
  return localizacaoDoMunicipio(codigoIbge, { cep: cep ?? null });
}

/**
 * O que as rotas de cadastro e perfil usam: tenta pelo CEP e, se o provedor
 * estiver indisponivel, aceita o municipio que a pessoa escolheu na tela.
 * A escolha do navegador so vale para dizer QUAL municipio — a coordenada
 * continua saindo da tabela, entao nao da para forjar posicao.
 */
export async function resolverLocalizacaoDeEntrada(entrada: {
  cep: string;
  municipioId?: string | null;
}): Promise<ResolucaoLocalizacao> {
  const porCep = await resolverLocalizacaoPorCep(entrada.cep);

  if (porCep.situacao !== "indisponivel") {
    return porCep;
  }
  if (!entrada.municipioId) {
    return porCep;
  }

  return resolverLocalizacaoPorMunicipio(entrada.municipioId, entrada.cep);
}

/** Campos de localizacao prontos para o create/update do Prisma. */
export function camposDeLocalizacao(localizacao: LocalizacaoResolvida) {
  return {
    cep: localizacao.cep,
    cidade: localizacao.cidade,
    estado: localizacao.estado,
    municipioId: localizacao.municipioId,
    latitude: localizacao.latitude,
    longitude: localizacao.longitude,
    precisaoCoordenada: localizacao.precisaoCoordenada,
  };
}

export type LocationErrorCode =
  | "CEP_NOT_FOUND"
  | "CEP_SERVICE_UNAVAILABLE"
  | "MUNICIPALITY_NOT_FOUND";

export class LocationError extends Error {
  constructor(
    readonly code: LocationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LocationError";
  }
}

/**
 * Resolve a localizacao ou aborta a escrita. Cadastro e perfil compartilham
 * isto para que os dois falhem do mesmo jeito diante do mesmo problema.
 */
export async function resolverLocalizacaoOuFalhar(entrada: {
  cep: string;
  municipioId?: string | null;
}): Promise<LocalizacaoResolvida> {
  const resolucao = await resolverLocalizacaoDeEntrada(entrada);

  switch (resolucao.situacao) {
    case "resolvida":
      return resolucao.localizacao;
    case "cep_invalido":
      throw new LocationError("CEP_NOT_FOUND", "CEP nao encontrado.");
    case "municipio_desconhecido":
      throw new LocationError(
        "MUNICIPALITY_NOT_FOUND",
        "Municipio nao encontrado na base.",
      );
    case "indisponivel":
      throw new LocationError(
        "CEP_SERVICE_UNAVAILABLE",
        "Nao foi possivel consultar o CEP agora. Escolha o municipio para continuar.",
      );
  }
}

/**
 * Troca `cep`/`municipioId` de um patch de perfil pelos campos derivados.
 * Sem CEP no patch, a localizacao nao e tocada — trocar o telefone nao deve
 * exigir reinformar o endereco.
 */
export async function aplicarLocalizacaoNoPatch<
  T extends { cep?: string; municipioId?: string },
>(patch: T): Promise<Omit<T, "cep" | "municipioId"> & Record<string, unknown>> {
  const { cep, municipioId, ...resto } = patch;

  if (!cep) {
    // municipioId sozinho nao muda nada: sem CEP nao ha o que derivar.
    return resto;
  }

  return {
    ...resto,
    ...camposDeLocalizacao(await resolverLocalizacaoOuFalhar({ cep, municipioId })),
  };
}
