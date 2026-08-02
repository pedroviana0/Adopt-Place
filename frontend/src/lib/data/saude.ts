import type { RegistroSaude } from "../domain/types";
import type { ResultadoTeste } from "../domain/enums";
import { loadDB } from "./db";
import { apiRequest } from "./api";

// ============================================================================
// Issue #46 (T080/T081): real basic-health flows over
// /api/animais/gerenciados/:id/saude. Ownership, date validation and the
// visitor/adopter mutation block are enforced by the backend; the frontend
// only consumes the documented contracts.
//
// Contract notes (backend is the source of truth — see lib/actions/registro-saude.ts):
//  - The create body is `.strict()`: send exactly the fields below.
//  - `responsavelRegistro` is NOT an input — the backend stores "Sistema".
//  - For VACINA/TESTE_DOENCA the backend persists only `nomeCustom` (the
//    `vacinaId`/`doencaId` catalog path is accepted but not stored), so we send
//    the chosen name as `nomeCustom`.
//  - Dates go as ISO datetime with offset.
// ============================================================================

export interface HealthRecordDTO {
  id: string;
  tipoRegistro: string;
  dataAplicacao: string;
  dataProxima: string | null;
  responsavelRegistro: string;
  titulo: string | null;
  observacoes: string | null;
  profissionalClinica: string | null;
  nomeVacina: string | null;
  ehVacinaCustomizada: boolean | null;
  tipoMedicamento: string | null;
  frequencia: string | null;
  nomeDoenca: string | null;
  ehDoencaCustomizada: boolean | null;
  resultado: ResultadoTeste | null;
  medicamentoTratamento: string | null;
  procedimento: string | null;
}

interface BaseHealthDetails {
  titulo?: string;
  observacoes?: string;
  profissionalClinica?: string;
}

export type NovoRegistroSaude =
  | (BaseHealthDetails & {
      tipoRegistro: "VACINA";
      nomeCustom: string;
      dataAplicacao: string;
      dataProximaDose?: string;
    })
  | (BaseHealthDetails & {
      tipoRegistro: "CONTROLE_PARASITAS";
      tipoMedicacao: string;
      frequencia: string;
      dataAplicacao: string;
      dataProxima?: string;
    })
  | (BaseHealthDetails & {
      tipoRegistro: "TESTE_DOENCA";
      nomeCustom: string;
      resultado: "POSITIVO" | "NEGATIVO";
      dataAplicacao: string;
      dataProxima?: string;
    });

export async function fetchRegistrosSaude(animalId: string): Promise<HealthRecordDTO[]> {
  const data = await apiRequest<{ records: HealthRecordDTO[] }>(
    `/api/animais/gerenciados/${animalId}/saude`,
    { method: "GET" },
  );
  return data.records;
}

export async function criarRegistroSaude(
  animalId: string,
  input: NovoRegistroSaude,
): Promise<HealthRecordDTO> {
  const data = await apiRequest<{ record: HealthRecordDTO }>(
    `/api/animais/gerenciados/${animalId}/saude`,
    { method: "POST", json: input },
  );
  return data.record;
}

export async function excluirRegistroSaude(animalId: string, registroId: string): Promise<void> {
  await apiRequest(`/api/animais/gerenciados/${animalId}/saude/${registroId}`, {
    method: "DELETE",
  });
}

// ---- Mock helpers kept for OTHER still-mock flows (out of #46 scope) --------
// `listRegistros` feeds the orphan `AnimalCard.tsx`; `alertasProximos` feeds the
// dashboard summary (`dashboard.index.tsx`). Removed in mass only when those
// flows are integrated.

export function listRegistros(animalId: string): RegistroSaude[] {
  return loadDB()
    .registrosSaude.filter((r) => r.animalId === animalId)
    .sort((a, b) => b.dataRegistro.localeCompare(a.dataRegistro));
}

export function alertasProximos(
  animaisIds: string[],
  dias = 30,
): { registro: RegistroSaude; animalId: string; diasRestantes: number }[] {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  return loadDB()
    .registrosSaude.filter((r) => animaisIds.includes(r.animalId) && !!r.dataProxima)
    .map((r) => ({
      registro: r,
      animalId: r.animalId,
      diasRestantes: Math.ceil((new Date(r.dataProxima!).getTime() - hoje.getTime()) / 86400000),
    }))
    .filter((x) => x.diasRestantes >= 0 && x.diasRestantes <= dias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}
