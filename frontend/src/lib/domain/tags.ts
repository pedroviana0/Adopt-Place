import { TipoRegistroSaude, porteLabel, sexoLabel, type Porte, type Sexo } from "./enums";
import type { Animal, RegistroSaude } from "./types";

export type Tag = {
  label: string;
  kind: "porte" | "sexo" | "castrado" | "vacinado" | "vermifugado" | "testado";
};

export function computeTags(animal: Animal, registros: RegistroSaude[]): Tag[] {
  const tags: Tag[] = [
    { label: porteLabel[animal.porte as Porte], kind: "porte" },
    { label: sexoLabel[animal.sexo as Sexo], kind: "sexo" },
  ];
  if (animal.castrado) tags.push({ label: "Castrado", kind: "castrado" });
  const meus = registros.filter((r) => r.animalId === animal.id);
  if (meus.some((r) => r.tipo === TipoRegistroSaude.VACINA))
    tags.push({ label: "Vacinado", kind: "vacinado" });
  if (meus.some((r) => r.tipo === TipoRegistroSaude.CONTROLE_PARASITAS))
    tags.push({ label: "Vermifugado", kind: "vermifugado" });
  if (meus.some((r) => r.tipo === TipoRegistroSaude.TESTE_DOENCA))
    tags.push({ label: "Testado", kind: "testado" });
  return tags;
}
