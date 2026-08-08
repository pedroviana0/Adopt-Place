import { z } from "zod";

/**
 * CEP aceito com ou sem mascara, guardado sempre com 8 digitos. A mascara e
 * assunto de apresentacao; o banco e as APIs falam em digitos.
 */
export const cepSchema = z
  .string()
  .trim()
  .transform((valor) => valor.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .regex(/^\d{8}$/, "Informe um CEP com 8 digitos."),
  );

/**
 * Codigo IBGE do municipio. So aceito quando o provedor de CEP estiver fora do
 * ar e a pessoa escolher o municipio na lista — a existencia e conferida contra
 * a nossa tabela antes de gravar, entao o navegador nao decide coordenada.
 */
export const municipioIdSchema = z
  .string()
  .trim()
  .regex(/^\d{7}$/, "Codigo de municipio invalido.");
