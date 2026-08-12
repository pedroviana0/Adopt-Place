import type { PublicAnimalSummary } from "./animais";
import { apiRequest } from "./api";
import {
  profileCatalogFilterSchema,
  type ProfileCatalogFilters,
} from "../schemas/public-profiles";

export interface PublicOrganizationProfile {
  id: string;
  tipo: "ORGANIZACAO";
  nome: string;
  descricao: string | null;
  fotoUrl: string | null;
  municipio: string;
  uf: string;
  endereco: string;
}

export interface PublicProfileCatalog {
  animals: PublicAnimalSummary[];
  filterOptions: {
    especies: { id: string; nome: string }[];
    racas: { id: string; nome: string; especieId: string }[];
  };
  pagination: {
    page: number;
    perPage: 30;
    total: number;
    totalPages: number;
  };
}

export interface PublicOrganizationProfileResponse {
  profile: PublicOrganizationProfile;
  catalog: PublicProfileCatalog;
}

export interface PublicFosterProfile {
  id: string;
  tipo: "ACOLHEDOR";
  nome: string;
  descricao: string | null;
  fotoUrl: string | null;
  municipio: string;
  uf: string;
}

export interface PublicFosterProfileResponse {
  profile: PublicFosterProfile;
  catalog: PublicProfileCatalog;
}

export async function fetchPublicOrganizationProfile(
  id: string,
  filters: ProfileCatalogFilters,
): Promise<PublicOrganizationProfileResponse> {
  const parsed = profileCatalogFilterSchema.parse(filters);
  const query = new URLSearchParams();
  if (parsed.especieId) query.set("especieId", parsed.especieId);
  if (parsed.racaId) query.set("racaId", parsed.racaId);
  if (parsed.porte) query.set("porte", parsed.porte);
  if (parsed.sexo) query.set("sexo", parsed.sexo);
  query.set("page", String(parsed.page));

  return apiRequest<PublicOrganizationProfileResponse>(
    `/api/perfis/organizacao/${encodeURIComponent(id)}?${query.toString()}`,
    { method: "GET" },
  );
}

export async function fetchPublicFosterProfile(
  id: string,
  filters: ProfileCatalogFilters,
): Promise<PublicFosterProfileResponse> {
  const parsed = profileCatalogFilterSchema.parse(filters);
  const query = new URLSearchParams();
  if (parsed.especieId) query.set("especieId", parsed.especieId);
  if (parsed.racaId) query.set("racaId", parsed.racaId);
  if (parsed.porte) query.set("porte", parsed.porte);
  if (parsed.sexo) query.set("sexo", parsed.sexo);
  query.set("page", String(parsed.page));

  return apiRequest<PublicFosterProfileResponse>(
    `/api/perfis/acolhedor/${encodeURIComponent(id)}?${query.toString()}`,
    { method: "GET" },
  );
}

export interface PublicAdopterProfile {
  access: "PUBLIC";
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  triagemConcluida: boolean;
}

export interface RestrictedAdopterProfile extends Omit<PublicAdopterProfile, "access"> {
  access: "RESTRICTED";
  enderecoAnalise: { endereco: string; cep: string | null; cidade: string; estado: string };
  triagem: Record<string, string | number | boolean | null>;
}

export type AdopterProfile = PublicAdopterProfile | RestrictedAdopterProfile;

export async function fetchAdopterProfile(id: string): Promise<AdopterProfile> {
  const data = await apiRequest<{ profile: AdopterProfile }>(
    `/api/perfis/adotante/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
  return data.profile;
}
