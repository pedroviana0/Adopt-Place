import type { Animal } from "./types";

export class RuleError extends Error {}

export function assertXorResponsavel(a: Pick<Animal, "organizacaoId" | "acolhedorId">): void {
  const hasOrg = !!a.organizacaoId;
  const hasAco = !!a.acolhedorId;
  if (hasOrg === hasAco) {
    throw new RuleError(
      "Animal deve ter exatamente um responsável: Organização ou Acolhedor"
    );
  }
}

export function assertNaoRelacionaSiMesmo(a: string, b: string): void {
  if (a === b) throw new RuleError("Um animal não pode ser relacionado a si mesmo");
}
