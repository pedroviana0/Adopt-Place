export const TipoPerfil = {
  ADOTANTE: "ADOTANTE",
  ORGANIZACAO: "ORGANIZACAO",
  ACOLHEDOR: "ACOLHEDOR",
  ADMIN: "ADMIN",
} as const;
export type TipoPerfil = (typeof TipoPerfil)[keyof typeof TipoPerfil];

export const Porte = { P: "P", M: "M", G: "G" } as const;
export type Porte = (typeof Porte)[keyof typeof Porte];

export const Sexo = { M: "M", F: "F" } as const;
export type Sexo = (typeof Sexo)[keyof typeof Sexo];

export const StatusAnimal = {
  RESGATADO: "RESGATADO",
  EM_CUIDADOS: "EM_CUIDADOS",
  DISPONIVEL: "DISPONIVEL",
  EM_PROCESSO_ADOCAO: "EM_PROCESSO_ADOCAO",
  ADOTADO: "ADOTADO",
} as const;
export type StatusAnimal = (typeof StatusAnimal)[keyof typeof StatusAnimal];

export const StatusSolicitacao = {
  EM_ANALISE: "EM_ANALISE",
  APROVADA: "APROVADA",
  RECUSADA: "RECUSADA",
  CONCLUIDA: "CONCLUIDA",
} as const;
export type StatusSolicitacao =
  (typeof StatusSolicitacao)[keyof typeof StatusSolicitacao];

export const TipoMoradia = {
  CASA: "CASA",
  APARTAMENTO: "APARTAMENTO",
  SITIO_FAZENDA: "SITIO_FAZENDA",
} as const;
export type TipoMoradia = (typeof TipoMoradia)[keyof typeof TipoMoradia];

export const TipoRegistroSaude = {
  VACINA: "VACINA",
  CONTROLE_PARASITAS: "CONTROLE_PARASITAS",
  TESTE_DOENCA: "TESTE_DOENCA",
} as const;
export type TipoRegistroSaude =
  (typeof TipoRegistroSaude)[keyof typeof TipoRegistroSaude];

export const ResultadoTeste = {
  POSITIVO: "POSITIVO",
  NEGATIVO: "NEGATIVO",
} as const;
export type ResultadoTeste = (typeof ResultadoTeste)[keyof typeof ResultadoTeste];

export const porteLabel: Record<Porte, string> = { P: "Pequeno", M: "Médio", G: "Grande" };
export const sexoLabel: Record<Sexo, string> = { M: "Macho", F: "Fêmea" };
export const statusAnimalLabel: Record<StatusAnimal, string> = {
  RESGATADO: "Resgatado",
  EM_CUIDADOS: "Em cuidados",
  DISPONIVEL: "Disponível",
  EM_PROCESSO_ADOCAO: "Em processo de adoção",
  ADOTADO: "Adotado",
};
export const statusSolicitacaoLabel: Record<StatusSolicitacao, string> = {
  EM_ANALISE: "Em análise",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  CONCLUIDA: "Concluída",
};
export const tipoRegistroSaudeLabel: Record<TipoRegistroSaude, string> = {
  VACINA: "Vacina",
  CONTROLE_PARASITAS: "Controle de parasitas",
  TESTE_DOENCA: "Teste de doença",
};
export const tipoMoradiaLabel: Record<TipoMoradia, string> = {
  CASA: "Casa",
  APARTAMENTO: "Apartamento",
  SITIO_FAZENDA: "Sítio/Fazenda",
};
