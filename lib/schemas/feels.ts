import { z } from "zod";

/**
 * Raios oferecidos. "qualquer" e o padrao: num sistema nacional, raio rigido
 * por padrao deixaria a maioria das pessoas com a tela vazia.
 */
export const RAIOS_KM = [25, 50, 100, 200] as const;

export const feelsFilterSchema = z.object({
  raioKm: z
    .preprocess(
      (valor) => (valor === "" || valor === null ? undefined : valor),
      z.coerce.number().int().positive().optional(),
    )
    .refine(
      (valor) => valor === undefined || RAIOS_KM.includes(valor as (typeof RAIOS_KM)[number]),
      { message: `Raio deve ser um de: ${RAIOS_KM.join(", ")}.` },
    ),
  especie: z.enum(["cachorro", "gato", "todos"]).default("todos"),
  /**
   * Coordenada do navegador, ja arredondada pelo cliente por privacidade.
   * Ausente significa "usar a do meu cadastro".
   */
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  /** Municipio escolhido a mao, quando a pessoa quer ver outra regiao. */
  municipioId: z.string().regex(/^\d{7}$/).optional(),
  /** Animais ja decididos nesta sessao de navegacao, para nao reaparecerem. */
  excluir: z
    .preprocess(
      (valor) =>
        typeof valor === "string" && valor.length > 0 ? valor.split(",").filter(Boolean) : [],
      z.array(z.string()).max(500),
    )
    .default([]),
  limite: z.coerce.number().int().min(1).max(30).default(10),
});

export type FeelsFilters = z.infer<typeof feelsFilterSchema>;
