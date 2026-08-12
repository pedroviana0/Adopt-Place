import { apiRequest } from "./api";
import type { PublicAnimalTag } from "./animais";

export interface CartaoDoFeels {
  id: string;
  nome: string;
  porte: string;
  sexo: string;
  idadeEstimada: string | null;
  especie: string | null;
  raca: string | null;
  cidade: string | null;
  estado: string | null;
  distanciaKm: number | null;
  fotos: string[];
  tags: PublicAnimalTag[];
  responsavel: { tipo: "ORGANIZACAO" | "ACOLHEDOR"; nome: string | null };
  responsavelId: string;
  responsavelTipo: "ORGANIZACAO" | "ACOLHEDOR";
}

export interface CidadeNoAlcance {
  nome: string;
  estado: string;
  distanciaKm: number;
  animais: number;
}

export interface RespostaDoFeels {
  cartoes: CartaoDoFeels[];
  cidades: CidadeNoAlcance[];
  origem: { fonte: "navegador" | "municipio" | "cadastro"; cidade: string | null; estado: string | null };
}

export const RAIOS_KM = [25, 50, 100, 200] as const;
export type RaioKm = (typeof RAIOS_KM)[number];

export interface FiltrosDoFeels {
  raioKm?: RaioKm;
  especie: "cachorro" | "gato" | "todos";
  latitude?: number;
  longitude?: number;
  excluir: string[];
}

export async function fetchFeels(filtros: FiltrosDoFeels): Promise<RespostaDoFeels> {
  const params = new URLSearchParams();
  if (filtros.raioKm) params.set("raioKm", String(filtros.raioKm));
  if (filtros.especie !== "todos") params.set("especie", filtros.especie);
  if (filtros.latitude !== undefined && filtros.longitude !== undefined) {
    params.set("latitude", String(filtros.latitude));
    params.set("longitude", String(filtros.longitude));
  }
  if (filtros.excluir.length > 0) params.set("excluir", filtros.excluir.join(","));

  return apiRequest<RespostaDoFeels>(`/api/feels?${params.toString()}`, { method: "GET" });
}

// ---- Pulados: efêmeros por decisão de produto (FR-024) ----

const CHAVE_PULADOS = "adoptplace:feels:pulados";

/**
 * Rejeição não é armazenada no banco: some ao fechar a aba. Reencontrar um
 * animal semanas depois é desejável, e evita construir um histórico de
 * rejeição sobre animais.
 */
export function lerPulados(): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const bruto = sessionStorage.getItem(CHAVE_PULADOS);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista.filter((i): i is string => typeof i === "string") : [];
  } catch {
    return [];
  }
}

export function registrarPulado(animalId: string): string[] {
  const atual = lerPulados();
  if (atual.includes(animalId)) return atual;
  const proximo = [...atual, animalId];
  try {
    sessionStorage.setItem(CHAVE_PULADOS, JSON.stringify(proximo));
  } catch {
    // Sessão sem storage (aba anônima restrita): a pilha ainda funciona em memória.
  }
  return proximo;
}

/**
 * Posição do navegador, relida a cada abertura do Feels. O aviso de permissão
 * só aparece na primeira vez — depois o navegador resolve ou nega em silêncio,
 * e em ambos os casos o feed continua funcionando pelo cadastro.
 */
export function obterPosicao(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          // Arredondada antes de sair daqui: precisão de bairro basta para
          // ordenar, e não denuncia a residência de ninguém.
          latitude: Math.round(pos.coords.latitude * 100) / 100,
          longitude: Math.round(pos.coords.longitude * 100) / 100,
        }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60_000 },
    );
  });
}
