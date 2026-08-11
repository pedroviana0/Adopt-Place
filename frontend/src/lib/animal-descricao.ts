// Segundo nível do card do Feels: uma frase curta que diz espécie e porte de
// uma vez ("Gata pequena"), no lugar da raça — que é opcional no schema e hoje
// está vazia em todos os animais. Concordância feita à mão porque só existem
// duas espécies canônicas no catálogo.

const NOMES_POR_ESPECIE: Record<string, { M: string; F: string }> = {
  Gato: { M: "Gato", F: "Gata" },
  Cachorro: { M: "Cachorro", F: "Cachorra" },
};

const PORTE_POR_GENERO: Record<string, { M: string; F: string }> = {
  P: { M: "pequeno", F: "pequena" },
  M: { M: "médio", F: "média" },
  G: { M: "grande", F: "grande" },
};

/**
 * "Gata pequena", "Cachorro grande". Espécie fora do catálogo canônico mantém o
 * nome como veio e concorda no masculino, que é o padrão da língua para termo
 * desconhecido. Sem espécie, devolve só o porte.
 */
export function descreverAnimal(
  especie: string | null | undefined,
  sexo: string,
  porte: string,
): string {
  const genero = sexo === "F" ? "F" : "M";
  const porteAdjetivo = PORTE_POR_GENERO[porte];

  if (!especie) {
    return porteAdjetivo ? capitalizar(porteAdjetivo[genero]) : "";
  }

  const conhecida = NOMES_POR_ESPECIE[especie];
  const substantivo = conhecida ? conhecida[genero] : especie;
  // Espécie desconhecida não tem gênero garantido; concorda no masculino.
  const adjetivo = porteAdjetivo?.[conhecida ? genero : "M"];

  return adjetivo ? `${substantivo} ${adjetivo}` : substantivo;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
