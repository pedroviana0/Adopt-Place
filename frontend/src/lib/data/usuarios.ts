import type { AcolhedorIndependente, Adotante, Organizacao, Usuario } from "../domain/types";
import { loadDB, mutate, uid } from "./db";
import type { TriagemInput } from "../schemas/triagem";
import type { CadastroAcolhedorInput, CadastroAdotanteInput, CadastroOrganizacaoInput } from "../schemas/cadastro";
import { buildSessao, setSessao } from "./sessao";

export function listUsuarios(): Usuario[] {
  const db = loadDB();
  return db.usuarios.slice().sort((a, b) => a.email.localeCompare(b.email));
}

export function nomeDoUsuario(u: Usuario): string {
  const db = loadDB();
  return (
    db.adotantes.find((a) => a.usuarioId === u.id)?.nomeCompleto ??
    db.organizacoes.find((o) => o.usuarioId === u.id)?.razaoSocial ??
    db.acolhedores.find((a) => a.usuarioId === u.id)?.nomeCompleto ??
    u.email
  );
}

export function setAtivo(usuarioId: string, ativo: boolean): void {
  mutate((db) => {
    const u = db.usuarios.find((x) => x.id === usuarioId);
    if (u) u.ativo = ativo;
  });
}

export function getAdotante(id: string): Adotante | undefined {
  return loadDB().adotantes.find((a) => a.id === id);
}
export function getOrganizacao(id: string): Organizacao | undefined {
  return loadDB().organizacoes.find((o) => o.id === id);
}
export function getAcolhedor(id: string): AcolhedorIndependente | undefined {
  return loadDB().acolhedores.find((a) => a.id === id);
}
export function listOrganizacoes(): Organizacao[] {
  return loadDB().organizacoes;
}
export function listAcolhedores(): AcolhedorIndependente[] {
  return loadDB().acolhedores;
}

function checkUnique(email: string, cpf?: string, cnpj?: string): void {
  const db = loadDB();
  if (db.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    throw new Error("E-mail já cadastrado");
  if (cpf) {
    if (
      db.adotantes.some((a) => a.cpf === cpf) ||
      db.acolhedores.some((a) => a.cpf === cpf)
    )
      throw new Error("CPF já cadastrado");
  }
  if (cnpj && db.organizacoes.some((o) => o.cnpj === cnpj))
    throw new Error("CNPJ já cadastrado");
}

export function cadastrarAdotante(input: CadastroAdotanteInput): Adotante {
  checkUnique(input.email, input.cpf);
  const a = mutate((db) => {
    const uId = uid("u");
    db.usuarios.push({ id: uId, email: input.email, tipoPerfil: "ADOTANTE", ativo: true, criadoEm: new Date().toISOString() });
    db.senhas[uId] = input.senha;
    const adot: Adotante = {
      id: uid("adot"),
      usuarioId: uId,
      nomeCompleto: input.nomeCompleto,
      cpf: input.cpf,
      telefone: input.telefone,
      instagram: input.instagram || null,
      endereco: input.endereco,
      cidade: input.cidade,
      estado: input.estado,
      triagemConcluida: false,
    };
    db.adotantes.push(adot);
    return adot;
  });
  setSessao(buildSessao(a.usuarioId));
  return a;
}

export function cadastrarOrganizacao(input: CadastroOrganizacaoInput): Organizacao {
  checkUnique(input.email, undefined, input.cnpj);
  const o = mutate((db) => {
    const uId = uid("u");
    db.usuarios.push({ id: uId, email: input.email, tipoPerfil: "ORGANIZACAO", ativo: true, criadoEm: new Date().toISOString() });
    db.senhas[uId] = input.senha;
    const org: Organizacao = {
      id: uid("org"),
      usuarioId: uId,
      razaoSocial: input.razaoSocial,
      cnpj: input.cnpj,
      telefone: input.telefone,
      endereco: input.endereco,
      cidade: input.cidade,
      estado: input.estado,
      responsavelNome: input.responsavelNome,
      capacidadeMaxima: input.capacidadeMaxima ?? null,
    };
    db.organizacoes.push(org);
    return org;
  });
  setSessao(buildSessao(o.usuarioId));
  return o;
}

export function cadastrarAcolhedor(input: CadastroAcolhedorInput): AcolhedorIndependente {
  checkUnique(input.email, input.cpf);
  const a = mutate((db) => {
    const uId = uid("u");
    db.usuarios.push({ id: uId, email: input.email, tipoPerfil: "ACOLHEDOR", ativo: true, criadoEm: new Date().toISOString() });
    db.senhas[uId] = input.senha;
    const aco: AcolhedorIndependente = {
      id: uid("aco"),
      usuarioId: uId,
      nomeCompleto: input.nomeCompleto,
      cpf: input.cpf,
      telefone: input.telefone,
      endereco: input.endereco,
      cidade: input.cidade,
      estado: input.estado,
      capacidadeAtual: 0,
    };
    db.acolhedores.push(aco);
    return aco;
  });
  setSessao(buildSessao(a.usuarioId));
  return a;
}

export function salvarTriagem(adotanteId: string, input: TriagemInput): void {
  mutate((db) => {
    const idx = db.adotantes.findIndex((a) => a.id === adotanteId);
    if (idx < 0) throw new Error("Adotante não encontrado");
    db.adotantes[idx] = { ...db.adotantes[idx], ...input, triagemConcluida: true };
  });
}

function ensureEmailUnique(email: string, exceptUsuarioId: string): void {
  const db = loadDB();
  if (
    db.usuarios.some(
      (u) => u.id !== exceptUsuarioId && u.email.toLowerCase() === email.toLowerCase(),
    )
  ) {
    throw new Error("E-mail já cadastrado");
  }
}

export type OrganizacaoUpdate = Partial<
  Pick<
    Organizacao,
    | "razaoSocial"
    | "telefone"
    | "endereco"
    | "cidade"
    | "estado"
    | "responsavelNome"
    | "capacidadeMaxima"
    | "fotoUrl"
  >
> & { email?: string };

export function atualizarOrganizacao(orgId: string, patch: OrganizacaoUpdate): Organizacao {
  return mutate((db) => {
    const idx = db.organizacoes.findIndex((o) => o.id === orgId);
    if (idx < 0) throw new Error("Organização não encontrada");
    const org = db.organizacoes[idx];
    if (patch.email && patch.email !== db.usuarios.find((u) => u.id === org.usuarioId)?.email) {
      ensureEmailUnique(patch.email, org.usuarioId);
      const u = db.usuarios.find((x) => x.id === org.usuarioId);
      if (u) u.email = patch.email;
    }
    const { email: _e, ...rest } = patch;
    db.organizacoes[idx] = { ...org, ...rest };
    return db.organizacoes[idx];
  });
}

export type AcolhedorUpdate = Partial<
  Pick<
    AcolhedorIndependente,
    | "nomeCompleto"
    | "telefone"
    | "endereco"
    | "cidade"
    | "estado"
    | "capacidadeAtual"
    | "fotoUrl"
  >
> & { email?: string };

export function atualizarAcolhedor(acoId: string, patch: AcolhedorUpdate): AcolhedorIndependente {
  return mutate((db) => {
    const idx = db.acolhedores.findIndex((a) => a.id === acoId);
    if (idx < 0) throw new Error("Acolhedor não encontrado");
    const aco = db.acolhedores[idx];
    if (patch.email && patch.email !== db.usuarios.find((u) => u.id === aco.usuarioId)?.email) {
      ensureEmailUnique(patch.email, aco.usuarioId);
      const u = db.usuarios.find((x) => x.id === aco.usuarioId);
      if (u) u.email = patch.email;
    }
    const { email: _e, ...rest } = patch;
    db.acolhedores[idx] = { ...aco, ...rest };
    return db.acolhedores[idx];
  });
}
