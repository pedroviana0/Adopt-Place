import type { TriagemInput } from "../schemas/triagem";
import type {
  CadastroAcolhedorInput,
  CadastroAdotanteInput,
  CadastroOrganizacaoInput,
} from "../schemas/cadastro";
import { login } from "./sessao";

// ============================================================================
// Issue #30 (T050/T051): real registration / profile / screening over /api.
// Consumes the backend contracts implemented in Issue #29 (backend ready). No
// localStorage/mock/session-forgery for these flows.
// ============================================================================

interface ApiError extends Error {
  code?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

async function apiFetch(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<unknown> {
  const { json, ...rest } = init;
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    ...rest,
  });
  const data = (await res.json().catch(() => null)) as
    | {
        error?: {
          code?: string;
          message?: string;
          fieldErrors?: Record<string, string[] | undefined>;
        };
      }
    | Record<string, unknown>
    | null;
  if (!res.ok) {
    const errObj = (
      data as {
        error?: {
          code?: string;
          message?: string;
          fieldErrors?: Record<string, string[] | undefined>;
        };
      }
    )?.error;
    const err: ApiError = new Error(errObj?.message ?? "Não foi possível concluir a operação");
    err.code = errObj?.code;
    err.fieldErrors = errObj?.fieldErrors;
    throw err;
  }
  return data;
}

// ---- Registration: POST /api/cadastro/{tipo}, then real login (no auto-session) ----

export async function cadastrarAdotante(input: CadastroAdotanteInput): Promise<void> {
  const { senha, instagram, ...rest } = input;
  await apiFetch("/api/cadastro/adotante", {
    method: "POST",
    json: { ...rest, password: senha, ...(instagram ? { instagram } : {}) },
  });
  await login(input.email, senha);
}

export async function cadastrarOrganizacao(input: CadastroOrganizacaoInput): Promise<void> {
  const { senha, ...rest } = input;
  await apiFetch("/api/cadastro/organizacao", {
    method: "POST",
    json: { ...rest, password: senha },
  });
  await login(input.email, senha);
}

export async function cadastrarAcolhedor(input: CadastroAcolhedorInput): Promise<void> {
  const { senha, ...rest } = input;
  await apiFetch("/api/cadastro/acolhedor", { method: "POST", json: { ...rest, password: senha } });
  await login(input.email, senha);
}

// ---- Profile: GET/PATCH /api/perfil (role inferred from session) ----

export interface PerfilDTO {
  id: string;
  tipoPerfil: "ADOTANTE" | "ORGANIZACAO" | "ACOLHEDOR" | "ADMIN";
  email: string;
  nomeCompleto?: string;
  cpf?: string;
  telefone?: string;
  instagram?: string | null;
  endereco?: string;
  cidade?: string;
  estado?: string;
  razaoSocial?: string;
  cnpj?: string;
  responsavelNome?: string;
  capacidadeMaxima?: number | null;
  capacidadeAtual?: number;
}

export async function fetchPerfil(): Promise<PerfilDTO> {
  const data = (await apiFetch("/api/perfil", { method: "GET" })) as { profile: PerfilDTO };
  return data.profile;
}

export async function atualizarPerfil(patch: Record<string, unknown>): Promise<PerfilDTO> {
  const data = (await apiFetch("/api/perfil", { method: "PATCH", json: patch })) as {
    profile: PerfilDTO;
  };
  return data.profile;
}

// ---- Screening: GET/PUT /api/triagem (adopter-only, session-scoped) ----

export interface ScreeningDTO extends Partial<Record<string, unknown>> {
  triagemConcluida: boolean;
}

export async function fetchTriagem(): Promise<ScreeningDTO> {
  const data = (await apiFetch("/api/triagem", { method: "GET" })) as { screening: ScreeningDTO };
  return data.screening;
}

// The backend Prisma columns carry two historical typos (todosConordamAdocao,
// ciendeNaoRepassar). The frontend keeps the correct spelling for UX and maps to
// the contract names only at this boundary — recorded, not "fixed" by guessing.
export async function salvarTriagem(input: TriagemInput): Promise<void> {
  const { todosConcordamAdocao, cienteNaoRepassar, ...rest } = input;
  await apiFetch("/api/triagem", {
    method: "PUT",
    json: {
      ...rest,
      todosConordamAdocao: todosConcordamAdocao,
      ciendeNaoRepassar: cienteNaoRepassar,
    },
  });
}

// ---- Admin users: GET /api/admin/usuarios, PATCH .../[id] (ADMIN-01, #61) ----

export interface AdminUserDTO {
  id: string;
  email: string;
  tipoPerfil: "ADOTANTE" | "ORGANIZACAO" | "ACOLHEDOR" | "ADMIN";
  ativo: boolean;
  criadoEm: string;
}

export async function fetchAdminUsuarios(): Promise<AdminUserDTO[]> {
  const data = (await apiFetch("/api/admin/usuarios", { method: "GET" })) as {
    users: AdminUserDTO[];
  };
  return data.users;
}

export async function setUsuarioAtivo(id: string, ativo: boolean): Promise<void> {
  await apiFetch(`/api/admin/usuarios/${id}`, { method: "PATCH", json: { ativo } });
}
