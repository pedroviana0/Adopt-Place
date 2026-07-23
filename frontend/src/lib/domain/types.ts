import type {
  Porte,
  ResultadoTeste,
  Sexo,
  StatusAnimal,
  StatusSolicitacao,
  TipoMoradia,
  TipoPerfil,
  TipoRegistroSaude,
} from "./enums";

export interface Usuario {
  id: string;
  email: string;
  tipoPerfil: TipoPerfil;
  ativo: boolean;
  criadoEm: string;
}

export interface Adotante {
  id: string;
  usuarioId: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  instagram?: string | null;
  endereco: string;
  cidade: string;
  estado: string;
  // Triagem (todos opcionais até concluir)
  motivoAdocao?: string | null;
  tipoAnimalDesejado?: string | null;
  podeArcarCustosVet?: boolean | null;
  adocaoParaPresente?: boolean | null;
  adocaoParaPresenteDetalhe?: string | null;
  tipoMoradia?: TipoMoradia | null;
  moradiaPropria?: boolean | null;
  numAdultosCasa?: number | null;
  temCriancas?: boolean | null;
  criancasFaixaEtaria?: string | null;
  todosConcordamAdocao?: boolean | null;
  condominioPermiteAnimal?: string | null;
  janelasTeladas?: boolean | null;
  acessoRua?: string | null;
  murosSeguros?: boolean | null;
  horasSozinho?: string | null;
  responsavelViagem?: string | null;
  planoEmGravidez?: string | null;
  alergicosNaCasa?: boolean | null;
  alergicosNaCasaDetalhe?: string | null;
  planoMudanca?: string | null;
  historicoDevolucao?: string | null;
  historicoPercaDescuido?: string | null;
  cienteLongevidade?: boolean | null;
  permiteVisitaProtetor?: boolean | null;
  cienteNaoRepassar?: boolean | null;
  teveAnimaisAntes?: boolean | null;
  animaisAnterioresDescricao?: string | null;
  temOutrosAnimais?: boolean | null;
  outrosAnimaisDescricao?: string | null;
  triagemConcluida: boolean;
}

export interface Organizacao {
  id: string;
  usuarioId: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  responsavelNome: string;
  capacidadeMaxima?: number | null;
  fotoUrl?: string | null;
}

export interface AcolhedorIndependente {
  id: string;
  usuarioId: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  capacidadeAtual: number;
  fotoUrl?: string | null;
}

export interface Especie {
  id: string;
  nome: string;
}
export interface Raca {
  id: string;
  especieId: string;
  nome: string;
}

export interface FotoAnimal {
  id: string;
  animalId: string;
  urlFoto: string;
  principal: boolean;
  ordem: number;
  criadoEm: string;
}

export interface Animal {
  id: string;
  nome: string;
  especieId: string;
  racaId?: string | null;
  porte: Porte;
  sexo: Sexo;
  cor: string;
  idadeEstimada?: string | null;
  castrado: boolean;
  descricao?: string | null;
  status: StatusAnimal;
  organizacaoId?: string | null;
  acolhedorId?: string | null;
  criadoEm: string;
}

export interface AnimalRelacionado {
  animalId: string;
  animalRelacionadoId: string;
}

export interface VacinaCatalogo { id: string; nome: string }
export interface DoencaCatalogo { id: string; nome: string }

export interface RegistroSaude {
  id: string;
  animalId: string;
  tipo: TipoRegistroSaude;
  dataRegistro: string; // ISO date
  dataProxima?: string | null;
  responsavelRegistro: string;
  nomeVacina?: string | null;
  ehVacinaCustomizada?: boolean | null;
  tipoMedicamento?: string | null;
  frequencia?: string | null;
  nomeDoenca?: string | null;
  ehDoencaCustomizada?: boolean | null;
  resultado?: ResultadoTeste | null;
}

export interface Favorito {
  adotanteId: string;
  animalId: string;
  criadoEm: string;
}

export interface SolicitacaoAdocao {
  id: string;
  animalId: string;
  adotanteId: string;
  status: StatusSolicitacao;
  dataSolicitacao: string;
  dataAtualizacao: string;
  observacoes?: string | null;
}

export interface SessaoUsuario {
  usuarioId: string;
  tipoPerfil: TipoPerfil;
  nome: string;
  email: string;
  fotoUrl?: string | null;
  adotanteId?: string;
  organizacaoId?: string;
  acolhedorId?: string;
}
