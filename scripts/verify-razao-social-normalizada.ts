import { normalizarNomeMunicipio } from "../lib/municipios";
import { prisma } from "../lib/prisma";

async function main() {
  const organizacoes = await prisma.organizacao.findMany({
    select: {
      id: true,
      razaoSocial: true,
      razaoSocialNormalizada: true,
    },
  });

  const divergencias = organizacoes.filter(
    (organizacao) =>
      organizacao.razaoSocialNormalizada !==
      normalizarNomeMunicipio(organizacao.razaoSocial),
  );

  if (divergencias.length > 0) {
    for (const organizacao of divergencias) {
      console.error(
        `Divergencia em ${organizacao.id}: persistido=${JSON.stringify(organizacao.razaoSocialNormalizada)} esperado=${JSON.stringify(normalizarNomeMunicipio(organizacao.razaoSocial))}`,
      );
    }
    throw new Error(
      `${divergencias.length} organizacao(oes) com razaoSocialNormalizada divergente.`,
    );
  }

  console.log(
    `Verificacao concluida: ${organizacoes.length} organizacao(oes), zero divergencias.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
