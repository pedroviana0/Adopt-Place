import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";

import { normalizarNomeMunicipio } from "../lib/municipios";

type LinhaMunicipio = {
  codigoIbge: string;
  nome: string;
  nomeNormalizado: string;
  uf: string;
  latitude: number;
  longitude: number;
};

const CSV = join(__dirname, "data", "municipios.csv");
const LOTE = 500;

export function lerMunicipiosDoCsv(caminho = CSV): LinhaMunicipio[] {
  const linhas = readFileSync(caminho, "utf8").trim().split(/\r?\n/);
  const [cabecalho, ...corpo] = linhas;

  const esperado = "codigo_ibge,nome,uf,latitude,longitude";
  if (cabecalho.trim() !== esperado) {
    throw new Error(
      `Cabecalho inesperado em ${caminho}. Esperado "${esperado}", veio "${cabecalho}".`,
    );
  }

  return corpo.map((linha, indice) => {
    const [codigoIbge, nome, uf, latitude, longitude] = linha.split(",");
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!codigoIbge || !nome || !uf || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(`Linha ${indice + 2} invalida em ${caminho}: "${linha}"`);
    }

    return {
      codigoIbge,
      nome,
      nomeNormalizado: normalizarNomeMunicipio(nome),
      uf,
      latitude: lat,
      longitude: lng,
    };
  });
}

/**
 * Idempotente: insere o que falta e atualiza so o que mudou de verdade.
 * Rodar de novo num banco ja populado nao escreve nada e nao apaga nada — e
 * dado de referencia, nao dado de teste, entao nao entra no clearTestData.
 */
export async function seedMunicipios(prisma: PrismaClient): Promise<void> {
  const doArquivo = lerMunicipiosDoCsv();

  const existentes = new Map(
    (
      await prisma.municipio.findMany({
        select: {
          codigoIbge: true,
          nome: true,
          nomeNormalizado: true,
          uf: true,
          latitude: true,
          longitude: true,
        },
      })
    ).map((m) => [m.codigoIbge, m]),
  );

  const novos = doArquivo.filter((m) => !existentes.has(m.codigoIbge));
  const alterados = doArquivo.filter((m) => {
    const atual = existentes.get(m.codigoIbge);
    return (
      atual !== undefined &&
      (atual.nome !== m.nome ||
        atual.nomeNormalizado !== m.nomeNormalizado ||
        atual.uf !== m.uf ||
        atual.latitude !== m.latitude ||
        atual.longitude !== m.longitude)
    );
  });

  for (let i = 0; i < novos.length; i += LOTE) {
    await prisma.municipio.createMany({
      data: novos.slice(i, i + LOTE),
      skipDuplicates: true,
    });
  }

  for (const municipio of alterados) {
    await prisma.municipio.update({
      where: { codigoIbge: municipio.codigoIbge },
      data: municipio,
    });
  }

  console.log(
    `Municipios: ${doArquivo.length} no arquivo, ${novos.length} inseridos, ${alterados.length} atualizados.`,
  );
}

// Permite rodar isolado: npm run prisma:seed:municipios
if (require.main === module) {
  const prisma = new PrismaClient();
  seedMunicipios(prisma)
    .then(() => prisma.$disconnect())
    .catch(async (erro: unknown) => {
      console.error(erro);
      await prisma.$disconnect();
      process.exit(1);
    });
}
