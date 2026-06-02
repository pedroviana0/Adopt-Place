import type { Animal, RegistroSaude } from "@prisma/client";

type AnimalTagSource = Pick<Animal, "porte" | "sexo" | "castrado"> & {
  registrosSaude?: Pick<RegistroSaude, "tipo">[];
};

export type AnimalTag = {
  key: string;
  label: string;
};

const porteLabels: Record<AnimalTagSource["porte"], string> = {
  P: "Pequeno",
  M: "Medio",
  G: "Grande",
};

const sexoLabels: Record<AnimalTagSource["sexo"], string> = {
  M: "Macho",
  F: "Femea",
};

export function getAnimalTags(animal: AnimalTagSource): AnimalTag[] {
  const healthTypes = new Set(animal.registrosSaude?.map((record) => record.tipo) ?? []);

  return [
    { key: `porte-${animal.porte}`, label: porteLabels[animal.porte] },
    { key: `sexo-${animal.sexo}`, label: sexoLabels[animal.sexo] },
    ...(animal.castrado ? [{ key: "castrado", label: "Castrado" }] : []),
    ...(healthTypes.has("VACINA") ? [{ key: "vacinado", label: "Vacinado" }] : []),
    ...(healthTypes.has("CONTROLE_PARASITAS")
      ? [{ key: "vermifugado", label: "Vermifugado" }]
      : []),
    ...(healthTypes.has("TESTE_DOENCA") ? [{ key: "testado", label: "Testado" }] : []),
  ];
}
