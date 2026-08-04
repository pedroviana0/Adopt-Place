import type { SessaoUsuario } from "../domain/types";

// Real session consumption for the auth flow (Issue #22 / tasks T027-T028).
//
// Session state now comes from the backend contract AUTH-SESSION-01
// (`GET /api/session`) over the same-origin/proxy boundary defined in T019.
// There is NO localStorage persistence for the auth flow anymore: the browser's
// secure, HTTP-only NextAuth cookie is the only source of truth and the session
// value is cached in memory for the current page life only.
//

const INACTIVE_MESSAGE =
  "Conta desativada. Entre em contato com o administrador";
const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos";

type SessionDTO = {
  user: {
    id: string;
    email: string;
    tipoPerfil: SessaoUsuario["tipoPerfil"];
    ativo: boolean;
    adotanteId: string | null;
    organizacaoId: string | null;
    acolhedorId: string | null;
  };
  expires: string;
};

const listeners = new Set<() => void>();
let cachedSessao: SessaoUsuario | null = null;
let bootstrapped = false;
let bootstrapPromise: Promise<SessaoUsuario | null> | null = null;

function emit(): void {
  for (const l of listeners) l();
}

function mapSession(dto: SessionDTO): SessaoUsuario {
  const u = dto.user;
  return {
    usuarioId: u.id,
    tipoPerfil: u.tipoPerfil,
    // SessionDTO intentionally excludes name/photo. Display name falls back to
    // the e-mail until the profile contract (Issue #30) provides a real name;
    // no name/photo endpoint is invented here.
    nome: u.email,
    email: u.email,
    fotoUrl: null,
    adotanteId: u.adotanteId ?? undefined,
    organizacaoId: u.organizacaoId ?? undefined,
    acolhedorId: u.acolhedorId ?? undefined,
  };
}

async function fetchSession(): Promise<SessaoUsuario | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/session", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (res.status === 200) {
      const dto = (await res.json()) as SessionDTO;
      return mapSession(dto);
    }
    // 401 UNAUTHENTICATED or 403 INACTIVE_ACCOUNT => no usable session.
    return null;
  } catch {
    // Network/parse failure: treat as no session rather than crashing the UI.
    return null;
  }
}

async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf", {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = (await res.json()) as { csrfToken?: string };
  if (!data.csrfToken) throw new Error(INVALID_CREDENTIALS_MESSAGE);
  return data.csrfToken;
}

export function subscribeSessao(l: () => void): () => void {
  listeners.add(l);
  // Lazy bootstrap on first subscription (mirrors the old lazy storage read,
  // now an async fetch of the real session).
  void ensureSessaoLoaded();
  return () => listeners.delete(l);
}

export function getSessao(): SessaoUsuario | null {
  return cachedSessao;
}

export function setSessao(s: SessaoUsuario | null): void {
  cachedSessao = s;
  bootstrapped = true;
  emit();
}

// Ensures the real session has been fetched at least once; returns the current
// value. Used by the protected-route guard and the reactive hook bootstrap.
export function ensureSessaoLoaded(): Promise<SessaoUsuario | null> {
  if (bootstrapped) return Promise.resolve(cachedSessao);
  if (!bootstrapPromise) {
    bootstrapPromise = fetchSession().then((s) => {
      cachedSessao = s;
      bootstrapped = true;
      bootstrapPromise = null;
      emit();
      return s;
    });
  }
  return bootstrapPromise;
}

// Forces a fresh read from the backend (e.g. right after login).
export async function refreshSessao(): Promise<SessaoUsuario | null> {
  const s = await fetchSession();
  setSessao(s);
  return s;
}

export async function login(
  email: string,
  senha: string,
): Promise<SessaoUsuario> {
  const csrfToken = await getCsrfToken();
  const callbackUrl = `${window.location.origin}/`;
  const body = new URLSearchParams({
    email,
    password: senha,
    csrfToken,
    callbackUrl,
  });
  const res = await fetch("/api/auth/callback/credentials", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
      Accept: "application/json",
    },
    body: body.toString(),
  });
  // NextAuth returns `{ url }` (200) even on failure; the error is encoded in the
  // URL query. Invalid credentials must not reveal whether the account exists.
  let url = "";
  try {
    const data = (await res.json()) as { url?: string };
    url = data.url ?? "";
  } catch {
    // ignore body parse errors; handled by the status/url checks below
  }
  if (!res.ok || /[?&]error=/.test(url)) {
    throw new Error(INVALID_CREDENTIALS_MESSAGE);
  }
  const s = await refreshSessao();
  if (!s) {
    // Cookie present but session unusable (e.g. account revalidated inactive).
    throw new Error(INACTIVE_MESSAGE);
  }
  return s;
}

export async function logout(): Promise<void> {
  try {
    const csrfToken = await getCsrfToken();
    const callbackUrl = `${window.location.origin}/`;
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
        Accept: "application/json",
      },
      body: new URLSearchParams({ csrfToken, callbackUrl }).toString(),
    });
  } catch {
    // Even if the network signout call fails, clear local session below.
  } finally {
    setSessao(null);
  }
}
