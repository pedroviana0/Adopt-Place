import type {
  AcolhedorIndependente,
  Adotante,
  Animal,
  AnimalRelacionado,
  DoencaCatalogo,
  Especie,
  Favorito,
  FotoAnimal,
  Organizacao,
  Raca,
  RegistroSaude,
  SolicitacaoAdocao,
  Usuario,
  VacinaCatalogo,
} from "../domain/types";

export interface DB {
  version: number;
  usuarios: Usuario[];
  senhas: Record<string, string>; // usuarioId -> senha (mock; nunca fazer isso real)
  adotantes: Adotante[];
  organizacoes: Organizacao[];
  acolhedores: AcolhedorIndependente[];
  especies: Especie[];
  racas: Raca[];
  animais: Animal[];
  fotos: FotoAnimal[];
  relacionados: AnimalRelacionado[];
  vacinas: VacinaCatalogo[];
  doencas: DoencaCatalogo[];
  registrosSaude: RegistroSaude[];
  favoritos: Favorito[];
  solicitacoes: SolicitacaoAdocao[];
}

const iso = (d: Date) => d.toISOString();
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

export function makeSeed(): DB {
  const now = iso(new Date());

  const usuarios: Usuario[] = [
    { id: "u_org_cia", email: "contato@ciaanimalvr.org", tipoPerfil: "ORGANIZACAO", ativo: true, criadoEm: now },
    { id: "u_org_spa", email: "contato@spavr.org", tipoPerfil: "ORGANIZACAO", ativo: true, criadoEm: now },
    { id: "u_aco_maria", email: "maria@acolhedor.com", tipoPerfil: "ACOLHEDOR", ativo: true, criadoEm: now },
    { id: "u_adot_ana", email: "ana@adotante.com", tipoPerfil: "ADOTANTE", ativo: true, criadoEm: now },
    { id: "u_adot_joao", email: "joao@adotante.com", tipoPerfil: "ADOTANTE", ativo: true, criadoEm: now },
    { id: "u_admin", email: "admin@adoptplace.com", tipoPerfil: "ADMIN", ativo: true, criadoEm: now },
  ];

  const senhas: Record<string, string> = {
    u_org_cia: "senha123",
    u_org_spa: "senha123",
    u_aco_maria: "senha123",
    u_adot_ana: "senha123",
    u_adot_joao: "senha123",
    u_admin: "senha123",
  };

  const organizacoes: Organizacao[] = [
    {
      id: "org_cia",
      usuarioId: "u_org_cia",
      razaoSocial: "Cia Animal VR",
      cnpj: "00000000000191",
      telefone: "(24) 99000-0001",
      endereco: "Rede de lares temporários",
      cidade: "Volta Redonda",
      estado: "RJ",
      responsavelNome: "Coordenação Cia Animal",
      capacidadeMaxima: null,
    },
    {
      id: "org_spa",
      usuarioId: "u_org_spa",
      razaoSocial: "SPA-VR",
      cnpj: "00000000000272",
      telefone: "(24) 99000-0002",
      endereco: "Abrigo SPA - Volta Redonda",
      cidade: "Volta Redonda",
      estado: "RJ",
      responsavelNome: "Diretoria SPA-VR",
      capacidadeMaxima: 120,
    },
  ];

  const acolhedores: AcolhedorIndependente[] = [
    {
      id: "aco_maria",
      usuarioId: "u_aco_maria",
      nomeCompleto: "Maria Silva",
      cpf: "11111111111",
      telefone: "(24) 99999-1111",
      endereco: "Rua das Flores, 100",
      cidade: "Volta Redonda",
      estado: "RJ",
      capacidadeAtual: 3,
    },
  ];

  const adotantes: Adotante[] = [
    {
      id: "adot_ana",
      usuarioId: "u_adot_ana",
      nomeCompleto: "Ana Souza",
      cpf: "22222222222",
      telefone: "(24) 98888-2222",
      endereco: "Av. Central, 200",
      cidade: "Volta Redonda",
      estado: "RJ",
      motivoAdocao: "Sempre quis ter um companheiro.",
      tipoAnimalDesejado: "Cachorro pequeno",
      podeArcarCustosVet: true,
      adocaoParaPresente: false,
      tipoMoradia: "APARTAMENTO",
      moradiaPropria: true,
      numAdultosCasa: 2,
      temCriancas: false,
      todosConcordamAdocao: true,
      janelasTeladas: true,
      acessoRua: "Portaria com controle",
      murosSeguros: true,
      horasSozinho: "4 horas",
      responsavelViagem: "Pet sitter conhecido",
      planoEmGravidez: "Manter o animal",
      alergicosNaCasa: false,
      planoMudanca: "Manter o animal",
      cienteLongevidade: true,
      permiteVisitaProtetor: true,
      cienteNaoRepassar: true,
      teveAnimaisAntes: true,
      animaisAnterioresDescricao: "Um gato por 12 anos",
      temOutrosAnimais: false,
      triagemConcluida: true,
    },
    {
      id: "adot_joao",
      usuarioId: "u_adot_joao",
      nomeCompleto: "João Pereira",
      cpf: "33333333333",
      telefone: "(24) 97777-3333",
      endereco: "Rua B, 300",
      cidade: "Volta Redonda",
      estado: "RJ",
      triagemConcluida: false,
    },
  ];

  const especies: Especie[] = [
    { id: "esp_cao", nome: "Cachorro" },
    { id: "esp_gato", nome: "Gato" },
  ];

  const racas: Raca[] = [
    { id: "r_srd_c", especieId: "esp_cao", nome: "SRD" },
    { id: "r_lab", especieId: "esp_cao", nome: "Labrador" },
    { id: "r_poodle", especieId: "esp_cao", nome: "Poodle" },
    { id: "r_srd_g", especieId: "esp_gato", nome: "SRD" },
    { id: "r_siames", especieId: "esp_gato", nome: "Siamês" },
  ];

  const vacinas: VacinaCatalogo[] = [
    { id: "v_v8", nome: "V8" },
    { id: "v_v10", nome: "V10" },
    { id: "v_antirrabica", nome: "Antirrábica" },
    { id: "v_gripe_felina", nome: "Gripe Felina" },
    { id: "v_felv", nome: "FeLV (vacina)" },
    { id: "v_giardia", nome: "Giárdia" },
  ];

  const doencas: DoencaCatalogo[] = [
    { id: "d_fiv", nome: "FIV" },
    { id: "d_felv", nome: "FeLV" },
    { id: "d_leish", nome: "Leishmaniose" },
    { id: "d_erli", nome: "Erliquiose (Doença do Carrapato)" },
    { id: "d_babe", nome: "Babesiose" },
    { id: "d_cino", nome: "Cinomose" },
    { id: "d_parvo", nome: "Parvovirose" },
  ];

  // Animais (mistura de organizações e acolhedor)
  const animais: Animal[] = [
    { id: "a1", nome: "Thor", especieId: "esp_cao", racaId: "r_lab", porte: "G", sexo: "M", cor: "Caramelo", idadeEstimada: "3 anos", castrado: true, descricao: "Dócil, ótimo com crianças.", status: "DISPONIVEL", organizacaoId: "org_spa", acolhedorId: null, criadoEm: now },
    { id: "a2", nome: "Luna", especieId: "esp_cao", racaId: "r_srd_c", porte: "M", sexo: "F", cor: "Preta", idadeEstimada: "2 anos", castrado: true, descricao: "Brincalhona e carinhosa.", status: "DISPONIVEL", organizacaoId: "org_spa", acolhedorId: null, criadoEm: now },
    { id: "a3", nome: "Mel", especieId: "esp_gato", racaId: "r_srd_g", porte: "P", sexo: "F", cor: "Tricolor", idadeEstimada: "1 ano", castrado: true, descricao: "Gatinha calma, adora colo.", status: "DISPONIVEL", organizacaoId: null, acolhedorId: "aco_maria", criadoEm: now },
    { id: "a4", nome: "Bidu", especieId: "esp_cao", racaId: "r_poodle", porte: "P", sexo: "M", cor: "Branco", idadeEstimada: "5 anos", castrado: false, descricao: "Companheiro fiel.", status: "DISPONIVEL", organizacaoId: "org_cia", acolhedorId: null, criadoEm: now },
    { id: "a5", nome: "Nina", especieId: "esp_gato", racaId: "r_siames", porte: "P", sexo: "F", cor: "Creme", idadeEstimada: "6 meses", castrado: false, descricao: "Filhote cheia de energia.", status: "DISPONIVEL", organizacaoId: null, acolhedorId: "aco_maria", criadoEm: now },
    { id: "a6", nome: "Rex", especieId: "esp_cao", racaId: "r_srd_c", porte: "M", sexo: "M", cor: "Marrom", idadeEstimada: "4 anos", castrado: true, descricao: "Ideal para família ativa.", status: "DISPONIVEL", organizacaoId: "org_spa", acolhedorId: null, criadoEm: now },
    { id: "a7", nome: "Maya", especieId: "esp_gato", racaId: "r_srd_g", porte: "P", sexo: "F", cor: "Cinza", idadeEstimada: "2 anos", castrado: true, descricao: "Sociável com outros gatos.", status: "EM_CUIDADOS", organizacaoId: "org_spa", acolhedorId: null, criadoEm: now },
    { id: "a8", nome: "Bento", especieId: "esp_cao", racaId: "r_srd_c", porte: "G", sexo: "M", cor: "Preto", idadeEstimada: "6 anos", castrado: true, descricao: "Idoso muito tranquilo.", status: "DISPONIVEL", organizacaoId: "org_cia", acolhedorId: null, criadoEm: now },
    { id: "a9", nome: "Dorinha", especieId: "esp_cao", racaId: "r_srd_c", porte: "P", sexo: "F", cor: "Caramelo", idadeEstimada: "1 ano", castrado: false, descricao: "Muito ativa.", status: "RESGATADO", organizacaoId: "org_cia", acolhedorId: null, criadoEm: now },
    { id: "a10", nome: "Simba", especieId: "esp_gato", racaId: "r_srd_g", porte: "P", sexo: "M", cor: "Laranja", idadeEstimada: "3 anos", castrado: true, descricao: "Adora janelas.", status: "DISPONIVEL", organizacaoId: "org_spa", acolhedorId: null, criadoEm: now },
    { id: "a11", nome: "Amora", especieId: "esp_cao", racaId: "r_srd_c", porte: "M", sexo: "F", cor: "Rajada", idadeEstimada: "2 anos", castrado: true, descricao: "Adora passeios.", status: "EM_PROCESSO_ADOCAO", organizacaoId: "org_spa", acolhedorId: null, criadoEm: now },
    { id: "a12", nome: "Toby", especieId: "esp_cao", racaId: "r_srd_c", porte: "P", sexo: "M", cor: "Branco e preto", idadeEstimada: "8 meses", castrado: false, descricao: "Filhote curioso.", status: "DISPONIVEL", organizacaoId: null, acolhedorId: "aco_maria", criadoEm: now },
    { id: "a13", nome: "Cacau", especieId: "esp_gato", racaId: "r_srd_g", porte: "P", sexo: "F", cor: "Preta", idadeEstimada: "4 anos", castrado: true, descricao: "Muito carinhosa.", status: "ADOTADO", organizacaoId: "org_spa", acolhedorId: null, criadoEm: now },
    { id: "a14", nome: "Pipoca", especieId: "esp_cao", racaId: "r_srd_c", porte: "P", sexo: "F", cor: "Branca", idadeEstimada: "3 anos", castrado: true, descricao: "Perfeita para apartamento.", status: "DISPONIVEL", organizacaoId: "org_cia", acolhedorId: null, criadoEm: now },
    { id: "a15", nome: "Zeus", especieId: "esp_cao", racaId: "r_lab", porte: "G", sexo: "M", cor: "Dourado", idadeEstimada: "5 anos", castrado: true, descricao: "Bom com outros cães.", status: "DISPONIVEL", organizacaoId: "org_spa", acolhedorId: null, criadoEm: now },
  ];

  const fotos: FotoAnimal[] = animais.map((a, i) => ({
    id: `f_${a.id}`,
    animalId: a.id,
    urlFoto: `https://images.unsplash.com/photo-${
      a.especieId === "esp_cao"
        ? ["1587300003388-59208cc962cb", "1552053831-71594a27632d", "1583337130417-3346a1be7dee", "1518717758536-85ae29035b6d", "1543466835-00a7907e9de1", "1477884213360-7e9d7dcc1e48"][i % 6]
        : ["1514888286974-6c03e2ca1dba", "1592194996308-7b43878e84a6", "1526336024174-e58f5cdd8e13", "1615789591457-74a63395c990", "1573865526739-10659fec78a5"][i % 5]
    }?w=800&h=800&fit=crop`,
    principal: true,
    ordem: 0,
    criadoEm: now,
  }));

  const registrosSaude: RegistroSaude[] = [
    { id: "rs1", animalId: "a1", tipo: "VACINA", dataRegistro: iso(new Date(Date.now() - 60 * 86400000)), dataProxima: daysFromNow(15), responsavelRegistro: "Dr. Carlos", nomeVacina: "V10", ehVacinaCustomizada: false },
    { id: "rs2", animalId: "a1", tipo: "CONTROLE_PARASITAS", dataRegistro: iso(new Date(Date.now() - 30 * 86400000)), dataProxima: daysFromNow(60), responsavelRegistro: "Dr. Carlos", tipoMedicamento: "Bravecto", frequencia: "A cada 3 meses" },
    { id: "rs3", animalId: "a1", tipo: "TESTE_DOENCA", dataRegistro: iso(new Date(Date.now() - 90 * 86400000)), responsavelRegistro: "Dr. Carlos", nomeDoenca: "Erliquiose (Doença do Carrapato)", ehDoencaCustomizada: false, resultado: "NEGATIVO" },
    { id: "rs4", animalId: "a2", tipo: "VACINA", dataRegistro: iso(new Date(Date.now() - 20 * 86400000)), dataProxima: daysFromNow(340), responsavelRegistro: "Clínica Amigo Fiel", nomeVacina: "Antirrábica", ehVacinaCustomizada: false },
    { id: "rs5", animalId: "a3", tipo: "VACINA", dataRegistro: iso(new Date(Date.now() - 40 * 86400000)), dataProxima: daysFromNow(25), responsavelRegistro: "Dra. Paula", nomeVacina: "Gripe Felina", ehVacinaCustomizada: false },
    { id: "rs6", animalId: "a3", tipo: "TESTE_DOENCA", dataRegistro: iso(new Date(Date.now() - 45 * 86400000)), responsavelRegistro: "Dra. Paula", nomeDoenca: "FIV", ehDoencaCustomizada: false, resultado: "NEGATIVO" },
    { id: "rs7", animalId: "a10", tipo: "VACINA", dataRegistro: iso(new Date(Date.now() - 100 * 86400000)), dataProxima: daysFromNow(10), responsavelRegistro: "Dr. Carlos", nomeVacina: "V10", ehVacinaCustomizada: false },
  ];

  const relacionados: AnimalRelacionado[] = [
    { animalId: "a3", animalRelacionadoId: "a5" },
    { animalId: "a5", animalRelacionadoId: "a3" },
  ];

  const solicitacoes: SolicitacaoAdocao[] = [
    { id: "s1", animalId: "a11", adotanteId: "adot_ana", status: "APROVADA", dataSolicitacao: iso(new Date(Date.now() - 10 * 86400000)), dataAtualizacao: iso(new Date(Date.now() - 2 * 86400000)), observacoes: "Aprovada após visita." },
    { id: "s2", animalId: "a13", adotanteId: "adot_ana", status: "CONCLUIDA", dataSolicitacao: iso(new Date(Date.now() - 60 * 86400000)), dataAtualizacao: iso(new Date(Date.now() - 30 * 86400000)), observacoes: "Adoção concluída com sucesso." },
  ];

  const favoritos: Favorito[] = [
    { adotanteId: "adot_ana", animalId: "a2", criadoEm: now },
  ];

  return {
    version: 1,
    usuarios,
    senhas,
    adotantes,
    organizacoes,
    acolhedores,
    especies,
    racas,
    animais,
    fotos,
    relacionados,
    vacinas,
    doencas,
    registrosSaude,
    favoritos,
    solicitacoes,
  };
}
