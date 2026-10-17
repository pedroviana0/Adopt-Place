import { SituacaoLT, StatusAnimal } from "@prisma/client";

import { prisma } from "../lib/prisma";

// Verificador read-only da spec 009. Roda depois de `prisma migrate deploy`
// no branch de ensaio e na producao: so le, nunca escreve.
async function main() {
  const [porStatus, porSituacao, totalLares, vinculados] = await Promise.all([
    prisma.animal.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.animal.groupBy({ by: ["situacaoLT"], _count: { _all: true } }),
    prisma.larTemporario.count(),
    prisma.animal.findMany({
      where: { larTemporarioId: { not: null } },
      select: {
        id: true,
        organizacaoId: true,
        larTemporario: { select: { organizacaoId: true } },
      },
    }),
  ]);

  const [i1, i2, i3] = await Promise.all([
    // I1: vinculo exige EM_LT.
    prisma.animal.count({
      where: {
        larTemporarioId: { not: null },
        situacaoLT: { not: SituacaoLT.EM_LT },
      },
    }),
    // I2: situacao de LT so existe em animal de organizacao.
    prisma.animal.count({
      where: {
        situacaoLT: { not: SituacaoLT.NAO_SE_APLICA },
        organizacaoId: null,
      },
    }),
    // I3: animal adotado nao tem situacao de LT.
    prisma.animal.count({
      where: {
        situacaoLT: { not: SituacaoLT.NAO_SE_APLICA },
        status: StatusAnimal.ADOTADO,
      },
    }),
  ]);
  // I4: o LT pertence a mesma organizacao do animal.
  const i4 = vinculados.filter(
    (animal) => animal.larTemporario?.organizacaoId !== animal.organizacaoId,
  );

  const total = porStatus.reduce((soma, linha) => soma + linha._count._all, 0);
  console.log(`Animais: ${total}`);
  for (const linha of porStatus) {
    console.log(`  status ${linha.status}: ${linha._count._all}`);
  }
  for (const linha of porSituacao) {
    console.log(`  situacaoLT ${linha.situacaoLT}: ${linha._count._all}`);
  }
  console.log(`Lares temporarios: ${totalLares}`);

  const violacoes = { I1: i1, I2: i2, I3: i3, I4: i4.length };
  console.log(`Violacoes: ${JSON.stringify(violacoes)}`);
  for (const animal of i4) {
    console.error(`I4 violada no animal ${animal.id}`);
  }

  const totalViolacoes = i1 + i2 + i3 + i4.length;
  if (totalViolacoes > 0) {
    throw new Error(`${totalViolacoes} violacao(oes) de invariante da spec 009.`);
  }
  console.log("Verificacao concluida: zero violacoes.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
