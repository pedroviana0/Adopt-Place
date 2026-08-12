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
