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
export type StatusSolicitacao = (typeof StatusSolicitacao)[keyof typeof StatusSolicitacao];

export const TipoMoradia = {
  CASA: "CASA",
  APARTAMENTO: "APARTAMENTO",
  SITIO_FAZENDA: "SITIO_FAZENDA",
} as const;
export type TipoMoradia = (typeof TipoMoradia)[keyof typeof TipoMoradia];

// Aligned to prisma/schema.prisma `TipoRegistroSaude` (feature 002 audit, #54/T097):
// the five real clinical-history categories.
export const TipoRegistroSaude = {
  VACINA: "VACINA",
  CONTROLE_PARASITAS: "CONTROLE_PARASITAS",
  TESTE_DOENCA: "TESTE_DOENCA",
  MEDICAMENTO_TRATAMENTO: "MEDICAMENTO_TRATAMENTO",
  PROCEDIMENTO: "PROCEDIMENTO",
} as const;
export type TipoRegistroSaude = (typeof TipoRegistroSaude)[keyof typeof TipoRegistroSaude];

export const ResultadoTeste = {
  POSITIVO: "POSITIVO",
  NEGATIVO: "NEGATIVO",
} as const;
export type ResultadoTeste = (typeof ResultadoTeste)[keyof typeof ResultadoTeste];

// Feature 002 agenda: planned care can be any of the five history categories or
// a manual CONSULTA (agenda-only, never clinical history). Aligned to prisma
// `TipoCuidadoPlanejado` / `StatusCuidadoPlanejado` (#54/T097).
export const TipoCuidadoPlanejado = {
  VACINA: "VACINA",
  CONTROLE_PARASITAS: "CONTROLE_PARASITAS",
  TESTE_DOENCA: "TESTE_DOENCA",
  MEDICAMENTO_TRATAMENTO: "MEDICAMENTO_TRATAMENTO",
  PROCEDIMENTO: "PROCEDIMENTO",
  CONSULTA: "CONSULTA",
} as const;
export type TipoCuidadoPlanejado = (typeof TipoCuidadoPlanejado)[keyof typeof TipoCuidadoPlanejado];

export const StatusCuidadoPlanejado = {
  PENDENTE: "PENDENTE",
  CONCLUIDO: "CONCLUIDO",
  CANCELADO: "CANCELADO",
} as const;
export type StatusCuidadoPlanejado =
  (typeof StatusCuidadoPlanejado)[keyof typeof StatusCuidadoPlanejado];

// Feature 002 health documents — aligned to prisma `TipoDocumentoSaude` (#54/T097).
export const TipoDocumentoSaude = {
  EXAME: "EXAME",
  RECEITA: "RECEITA",
  LAUDO: "LAUDO",
  COMPROVANTE_VACINACAO: "COMPROVANTE_VACINACAO",
  OUTRO: "OUTRO",
} as const;
export type TipoDocumentoSaude = (typeof TipoDocumentoSaude)[keyof typeof TipoDocumentoSaude];

// Feature 002 adoption chat — aligned to prisma `StatusConversaAdocao` (#54/T097).
export const StatusConversaAdocao = {
  ATIVA: "ATIVA",
  ARQUIVADA: "ARQUIVADA",
} as const;
export type StatusConversaAdocao = (typeof StatusConversaAdocao)[keyof typeof StatusConversaAdocao];

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
  MEDICAMENTO_TRATAMENTO: "Medicamento / tratamento",
  PROCEDIMENTO: "Procedimento",
};
export const tipoCuidadoPlanejadoLabel: Record<TipoCuidadoPlanejado, string> = {
  VACINA: "Vacina",
  CONTROLE_PARASITAS: "Controle de parasitas",
  TESTE_DOENCA: "Teste de doença",
  MEDICAMENTO_TRATAMENTO: "Medicamento / tratamento",
  PROCEDIMENTO: "Procedimento",
  CONSULTA: "Consulta",
};
export const statusCuidadoPlanejadoLabel: Record<StatusCuidadoPlanejado, string> = {
  PENDENTE: "Pendente",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};
export const tipoDocumentoSaudeLabel: Record<TipoDocumentoSaude, string> = {
  EXAME: "Exame",
  RECEITA: "Receita",
  LAUDO: "Laudo",
  COMPROVANTE_VACINACAO: "Comprovante de vacinação",
  OUTRO: "Outro",
};
export const statusConversaAdocaoLabel: Record<StatusConversaAdocao, string> = {
  ATIVA: "Ativa",
  ARQUIVADA: "Arquivada",
};
export const tipoMoradiaLabel: Record<TipoMoradia, string> = {
  CASA: "Casa",
  APARTAMENTO: "Apartamento",
  SITIO_FAZENDA: "Sítio/Fazenda",
};
