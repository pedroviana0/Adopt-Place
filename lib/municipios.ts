// Marcas diacriticas combinantes, escritas com escape: o caractere literal no
// fonte depende da codificacao do arquivo e quebra silenciosamente.
const ACENTOS = /[̀-ͯ]/g;

/**
 * Nome de municipio normalizado para busca: sem acento, sem caixa, sem espaco
 * duplicado. E o que permite casar "SAO PAULO", "Sao Paulo" e "São  Paulo" com
 * a mesma linha da tabela, ja que cidade veio como texto livre por muito tempo.
 *
 * O seed grava o resultado desta funcao em Municipio.nomeNormalizado, e a busca
 * usa a mesma funcao — se as duas divergirem, a busca para de encontrar.
 */
export function normalizarNomeMunicipio(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(ACENTOS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** CEP com apenas digitos, ou null quando nao tiver 8 digitos. */
export function normalizarCep(cep: string): string | null {
  const digitos = cep.replace(/\D/g, "");
  return digitos.length === 8 ? digitos : null;
}

/** 00000000 -> 00000-000, para exibicao. */
export function formatarCep(cep: string): string {
  const digitos = normalizarCep(cep);
  return digitos ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : cep;
}
