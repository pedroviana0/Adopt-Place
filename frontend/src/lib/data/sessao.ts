import type { SessaoUsuario } from "../domain/types";
import { loadDB, SESSION_KEY } from "./db";

const listeners = new Set<() => void>();
let cachedSessao: SessaoUsuario | null = null;
let cachedRaw: string | null = null;
let initialized = false;

function readFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw === cachedRaw) return;
    cachedRaw = raw;
    cachedSessao = raw ? (JSON.parse(raw) as SessaoUsuario) : null;
  } catch {
    // ignore
  }
}

function emit() {
  for (const l of listeners) l();
}

export function subscribeSessao(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getSessao(): SessaoUsuario | null {
  if (!initialized) {
    initialized = true;
    readFromStorage();
  }
  return cachedSessao;
}

export function setSessao(s: SessaoUsuario | null): void {
  if (typeof window === "undefined") return;
  if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else window.localStorage.removeItem(SESSION_KEY);
  cachedSessao = s;
  cachedRaw = s ? JSON.stringify(s) : null;
  initialized = true;
  emit();
}

export function login(email: string, senha: string): SessaoUsuario {
  const db = loadDB();
  const u = db.usuarios.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u) throw new Error("E-mail ou senha inválidos");
  if (db.senhas[u.id] !== senha) throw new Error("E-mail ou senha inválidos");
  if (!u.ativo)
    throw new Error("Conta desativada. Entre em contato com o administrador");
  const s = buildSessao(u.id);
  setSessao(s);
  return s;
}

export function logout(): void {
  setSessao(null);
}

export function buildSessao(usuarioId: string): SessaoUsuario {
  const db = loadDB();
  const u = db.usuarios.find((x) => x.id === usuarioId);
  if (!u) throw new Error("Usuário não encontrado");
  const adot = db.adotantes.find((a) => a.usuarioId === u.id);
  const org = db.organizacoes.find((o) => o.usuarioId === u.id);
  const aco = db.acolhedores.find((a) => a.usuarioId === u.id);
  const nome =
    adot?.nomeCompleto ?? org?.razaoSocial ?? aco?.nomeCompleto ?? "Admin";
  return {
    usuarioId: u.id,
    tipoPerfil: u.tipoPerfil,
    nome,
    email: u.email,
    fotoUrl: org?.fotoUrl ?? aco?.fotoUrl ?? null,
    adotanteId: adot?.id,
    organizacaoId: org?.id,
    acolhedorId: aco?.id,
  };
}
