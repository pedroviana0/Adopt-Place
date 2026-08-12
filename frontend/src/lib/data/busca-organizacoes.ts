import { apiRequest } from "./api";
import { organizationSearchTermSchema } from "../schemas/public-profiles";

export type OrganizationSearchResult = {
  id: string;
  nome: string;
  municipio: string;
  uf: string;
};

export async function searchOrganizations(term: string): Promise<OrganizationSearchResult[]> {
  const parsed = organizationSearchTermSchema.safeParse(term);
  if (!parsed.success) return [];
  const data = await apiRequest<{ results: OrganizationSearchResult[] }>(
    `/api/busca/organizacoes?q=${encodeURIComponent(parsed.data)}`,
  );
  return data.results;
}
