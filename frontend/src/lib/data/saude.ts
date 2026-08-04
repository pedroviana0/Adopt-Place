import type { ResultadoTeste } from "../domain/enums";
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
