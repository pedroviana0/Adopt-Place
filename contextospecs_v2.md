# AdoptPlace — Spec Central de Desenvolvimento
> Fonte de verdade para SDD via Spec-Kit + Codex CLI
> Versão: 2.0 | Projeto: TCC — IFRJ Campus Pinheiral | 2026
>
> ⚠️ Este arquivo alimenta o Spec-Kit. Não misturar com narrativa acadêmica.
> O contextov4.1.md cobre a documentação do ModeloProjetoInterdisciplinar.
> Toda decisão de implementação remonta a este arquivo.
>
> Changelog v2: RegistroSaude unificado (vacinas + parasitas + testes); catálogos VacinaCatalogo e DoencaCatalogo; tags derivadas; Favorito; página inicial com landing + vitrine integrada; navbar por perfil; painel do animal (público, somente leitura); área Adotantes na org (histórico de adoções concluídas); filtro por tags na vitrine; descrição dos cards da vitrine.

---

## CONSTITUIÇÃO DO PROJETO
> Regras invioláveis. O Codex deve verificar cada PR contra elas.

1. **Zero over-engineering.** Nenhuma abstração que não seja exigida por um RF existente. Sem factories, repositories, event buses, ou CQRS a menos que um requisito específico force isso.
2. **Schema first.** O schema Prisma é a fonte de verdade do banco. Nunca escrever SQL direto exceto em migrations com `$executeRaw` quando Prisma não suportar algo específico.
3. **Server-side por padrão.** Lógica de negócio fica em Server Actions ou API Routes — nunca no cliente.
4. **Segurança proativa.** Toda rota autenticada usa `getServerSession()` antes de qualquer acesso a dado. Nenhum dado sensível do adotante (CPF, endereço) é exposto em rotas públicas ou no painel público do animal.
5. **Validação em duas camadas.** Zod no cliente (UX imediata) + Zod no servidor (segurança real). O servidor nunca confia no cliente.
6. **Estado mínimo no cliente.** Preferir `useFormState` / Server Actions ao invés de useState + fetch manual.
7. **Sem dependências desnecessárias.** Antes de instalar um pacote, verificar se a funcionalidade existe no Next.js, Prisma, ou shadcn/ui nativamente.
8. **TypeScript strict.** `strict: true` no tsconfig. Nenhum `any` explícito. Tipos gerados pelo Prisma são a fonte de verdade das entidades.

---

## RESUMO DO PRODUTO

Sistema web para gestão do ciclo completo de animais resgatados — do acolhimento ao processo de adoção. Permite que organizações protetoras e acolhedores independentes cadastrem animais, registrem histórico de saúde e gerenciem solicitações de adoção com triagem estruturada de adotantes. Adotantes podem buscar animais disponíveis, favoritar, preencher formulário de triagem e acompanhar suas solicitações. Uma vitrine pública integrada à página inicial permite busca sem login.

**Contexto real:** dois clientes em Volta Redonda/RJ — Cia Animal VR (informal, sem sede, rede de lares temporários) e SPA-VR (ONG com CNPJ, abrigo físico com 100+ animais). O sistema deve funcionar para os dois modelos operacionais sem exigir adaptação de código.

---

## STACK TECNOLÓGICA

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.x | Full-stack em um repositório; Server Actions eliminam API boilerplate |
| Linguagem | TypeScript | 5.x | `strict: true`; tipos Prisma gerados automaticamente |
| ORM | Prisma | 5.x | Schema-first = spec viva do banco; migrations automáticas; client type-safe |
| Banco de dados | PostgreSQL | 16.x | Produção real (Docker local no dev) |
| Banco dev alternativo | SQLite (via Prisma) | — | Fallback para membros sem Docker; trocar apenas `provider` no schema |
| Autenticação | NextAuth.js | v5 (beta estável) | Integra com Prisma Adapter; suporte a roles nativo via `session.user` |
| Estilização | Tailwind CSS | v4 | Zero CSS custom; classes utilitárias ideais para geração por Codex |
| Componentes UI | shadcn/ui | latest | Componentes acessíveis e customizáveis; sem dependência de runtime |
| Validação | Zod | 3.x | Schema compartilhado cliente/servidor |
| Upload de arquivos | Uploadthing | latest | Upload para S3-compatible sem configurar bucket; free tier suficiente |
| IDE | VS Code | — | Extensions: Prisma, ESLint, Tailwind CSS IntelliSense, TypeScript |
| SDD | Spec-Kit (specify CLI) | latest | Integração nativa Codex CLI (skills mode); 4 fases gateadas |
| Codegen AI | Codex CLI | free | `$speckit-spec`, `$speckit-plan`, `$speckit-tasks`, `$speckit-implement` |
| Versionamento | Git + GitHub | — | Um repositório; branches por feature |

### Estrutura de Pastas (Next.js App Router)

```
adoptplace/
├── app/
│   ├── (auth)/           # Login, cadastro — layout sem navbar
│   ├── (public)/         # Página inicial, vitrine, perfil público do animal
│   ├── dashboard/        # Painéis autenticados (org, acolhedor, adotante, admin)
│   ├── api/              # Rotas API apenas quando Server Action não for suficiente
│   └── globals.css
├── components/
│   ├── ui/               # shadcn/ui (gerado, não editar manualmente)
│   └── app/              # Componentes do domínio AdoptPlace
├── lib/
│   ├── auth.ts           # Configuração NextAuth
│   ├── prisma.ts         # Singleton do Prisma Client
│   ├── schemas/          # Schemas Zod por domínio
│   └── actions/          # Server Actions por domínio
├── prisma/
│   ├── schema.prisma     # Fonte de verdade do banco
│   ├── migrations/
│   └── seed.ts
└── types/
    └── next-auth.d.ts    # Extensão de tipos da sessão
```

---

## MODELO DE DADOS (Schema Prisma — fonte de verdade)

> O Codex deve gerar este schema antes de qualquer código de aplicação.

```prisma
// Enums
enum TipoPerfil      { ADOTANTE ORGANIZACAO ACOLHEDOR ADMIN }
enum Porte           { P M G }
enum Sexo            { M F }
enum StatusAnimal    { RESGATADO EM_CUIDADOS DISPONIVEL EM_PROCESSO_ADOCAO ADOTADO }
enum StatusSolicitacao { EM_ANALISE APROVADA RECUSADA CONCLUIDA }
enum TipoMoradia     { CASA APARTAMENTO SITIO_FAZENDA }
enum TipoRegistroSaude { VACINA CONTROLE_PARASITAS TESTE_DOENCA }
enum ResultadoTeste  { POSITIVO NEGATIVO }

// Autenticação base
model Usuario {
  id          String      @id @default(cuid())
  email       String      @unique
  senhaHash   String
  tipoPerfil  TipoPerfil
  ativo       Boolean     @default(true)
  criadoEm   DateTime    @default(now())
  adotante    Adotante?
  organizacao Organizacao?
  acolhedor   AcolhedorIndependente?
  accounts    Account[]
  sessions    Session[]
}

model Adotante {
  id               String   @id @default(cuid())
  usuarioId        String   @unique
  usuario          Usuario  @relation(fields: [usuarioId], references: [id])
  nomeCompleto     String
  cpf              String   @unique
  telefone         String
  instagram        String?
  endereco         String
  cidade           String
  estado           String
  // Triagem — todos nullable, preenchidos após cadastro
  motivoAdocao                String?
  tipoAnimalDesejado          String?
  podeArcarCustosVet          Boolean?
  adocaoParaPresente          Boolean?
  adocaoParaPresenteDetalhe   String?
  tipoMoradia                 TipoMoradia?
  moradiaPropria              Boolean?
  numAdultosCasa              Int?
  temCriancas                 Boolean?
  criancasFaixaEtaria         String?
  todosConordamAdocao         Boolean?
  condominioPermiteAnimal     String?
  janelasTeladas              Boolean?
  acessoRua                   String?
  murosSeguros                Boolean?
  horasSozinho                String?
  responsavelViagem           String?
  planoEmGravidez             String?
  alergicosNaCasa             Boolean?
  alergicosNaCasaDetalhe      String?
  planoMudanca                String?
  historicoDevolucao          String?
  historicoPercaDescuido      String?
  cienteLongevidade           Boolean?
  permiteVisitaProtetor       Boolean?
  ciendeNaoRepassar           Boolean?
  teveAnimaisAntes            Boolean?
  animaisAnterioresDescricao  String?
  temOutrosAnimais            Boolean?
  outrosAnimaisDescricao      String?
  triagemConcluida            Boolean  @default(false)
  solicitacoes                SolicitacaoAdocao[]
  favoritos                   Favorito[]
}

model Organizacao {
  id              String   @id @default(cuid())
  usuarioId       String   @unique
  usuario         Usuario  @relation(fields: [usuarioId], references: [id])
  razaoSocial     String
  cnpj            String   @unique
  telefone        String
  endereco        String
  cidade          String
  estado          String
  responsavelNome String
  capacidadeMaxima Int?
  animais         Animal[]
}

model AcolhedorIndependente {
  id              String   @id @default(cuid())
  usuarioId       String   @unique
  usuario         Usuario  @relation(fields: [usuarioId], references: [id])
  nomeCompleto    String
  cpf             String   @unique
  telefone        String
  endereco        String
  cidade          String
  estado          String
  capacidadeAtual Int      @default(0)
  animais         Animal[]
}

model Especie {
  id      String   @id @default(cuid())
  nome    String   @unique
  racas   Raca[]
  animais Animal[]
}

model Raca {
  id        String  @id @default(cuid())
  especieId String
  especie   Especie @relation(fields: [especieId], references: [id])
  nome      String
  animais   Animal[]
  @@unique([especieId, nome])
}

model Animal {
  id              String       @id @default(cuid())
  nome            String
  especieId       String
  especie         Especie      @relation(fields: [especieId], references: [id])
  racaId          String?
  raca            Raca?        @relation(fields: [racaId], references: [id])
  porte           Porte
  sexo            Sexo
  cor             String
  idadeEstimada   String?
  castrado        Boolean      @default(false)
  descricao       String?
  status          StatusAnimal @default(RESGATADO)
  organizacaoId   String?
  organizacao     Organizacao? @relation(fields: [organizacaoId], references: [id])
  acolhedorId     String?
  acolhedor       AcolhedorIndependente? @relation(fields: [acolhedorId], references: [id])
  criadoEm        DateTime     @default(now())
  fotos           FotoAnimal[]
  registrosSaude  RegistroSaude[]
  solicitacoes    SolicitacaoAdocao[]
  favoritos       Favorito[]
  relacionadosA   AnimalRelacionado[] @relation("AnimalPrincipal")
  relacionadosB   AnimalRelacionado[] @relation("AnimalRelacionado")
  // REGRA XOR: organizacaoId OU acolhedorId — nunca os dois, nunca nenhum
  // Enforced em: lib/actions/animal.ts (createAnimal, updateAnimal)
}

model AnimalRelacionado {
  animalId            String
  animalRelacionadoId String
  animal              Animal @relation("AnimalPrincipal",    fields: [animalId],            references: [id])
  animalRelacionado   Animal @relation("AnimalRelacionado",  fields: [animalRelacionadoId], references: [id])
  @@id([animalId, animalRelacionadoId])
  // REGRA: inserir (A,B) e (B,A) atomicamente via prisma.$transaction
}

model FotoAnimal {
  id        String   @id @default(cuid())
  animalId  String
  animal    Animal   @relation(fields: [animalId], references: [id], onDelete: Cascade)
  urlFoto   String
  principal Boolean  @default(false)
  criadoEm DateTime  @default(now())
}

// Catálogos de referência para autocomplete no frontend
model VacinaCatalogo {
  id   String @id @default(cuid())
  nome String @unique
  // Seed: V8, V10, Antirrábica, Gripe Felina, FeLV (vacina), Giárdia
}

model DoencaCatalogo {
  id   String @id @default(cuid())
  nome String @unique
  // Seed: FIV, FeLV, Leishmaniose, Erliquiose (Doença do Carrapato), Babesiose, Cinomose, Parvovirose
}

// Registro de Saúde unificado — substitui Vacina + HistoricoVacinacao da v1
model RegistroSaude {
  id                  String             @id @default(cuid())
  animalId            String
  animal              Animal             @relation(fields: [animalId], references: [id], onDelete: Cascade)
  tipo                TipoRegistroSaude
  dataRegistro        DateTime
  dataProxima         DateTime?          // Próximo reforço (VACINA) ou próxima aplicação (CONTROLE_PARASITAS)
  responsavelRegistro String

  // Campos VACINA
  // nomeVacina: nome do catálogo OU texto livre (se "Outra")
  nomeVacina          String?
  ehVacinaCustomizada Boolean?           // true = nome digitado manualmente

  // Campos CONTROLE_PARASITAS (todos texto livre)
  tipoMedicamento     String?            // ex: "Bravecto", "Heartgard Plus"
  frequencia          String?            // ex: "A cada 3 meses"

  // Campos TESTE_DOENCA
  // nomeDoenca: nome do catálogo OU texto livre (se "Outra")
  nomeDoenca          String?
  ehDoencaCustomizada Boolean?           // true = nome digitado manualmente
  resultado           ResultadoTeste?    // POSITIVO ou NEGATIVO; nunca armazenar inconclusivo

  // REGRA: dataProxima > dataRegistro — enforced em Zod schema (lib/schemas/registroSaude.ts)
  // REGRA: resultado só presente quando tipo = TESTE_DOENCA
  // REGRA: campos de cada tipo são nullable; o que não se aplica fica NULL
}

model Favorito {
  adotanteId String
  animalId   String
  adotante   Adotante @relation(fields: [adotanteId], references: [id])
  animal     Animal   @relation(fields: [animalId],   references: [id])
  criadoEm  DateTime @default(now())
  @@id([adotanteId, animalId])
}

model SolicitacaoAdocao {
  id              String             @id @default(cuid())
  animalId        String
  animal          Animal             @relation(fields: [animalId], references: [id])
  adotanteId      String
  adotante        Adotante           @relation(fields: [adotanteId], references: [id])
  status          StatusSolicitacao  @default(EM_ANALISE)
  dataSolicitacao DateTime           @default(now())
  dataAtualizacao DateTime           @updatedAt
  observacoes     String?
  @@unique([animalId, adotanteId])
}

// NextAuth tables (geradas pelo Prisma Adapter — não editar manualmente)
model Account { ... }
model Session { ... }
model VerificationToken { ... }
```

### Regras de negócio críticas

**XOR Animal:** Um `Animal` deve ter `organizacaoId` OU `acolhedorId` preenchido, nunca os dois e nunca nenhum. Verificado no início de `createAnimal()` e `updateAnimal()` em `lib/actions/animal.ts`. Se violada: `throw new Error('Animal deve ter exatamente um responsável: Organização ou Acolhedor')`.

**AnimalRelacionado bidirecional:** Ao criar vínculo (A, B), criar também (B, A) na mesma `prisma.$transaction`. Ao deletar, deletar os dois pares.

**RegistroSaude — campos por tipo:**
- `VACINA`: obrigatório `nomeVacina`; opcional `dataProxima`; ignorar campos de parasita e doença.
- `CONTROLE_PARASITAS`: obrigatório `tipoMedicamento`; opcional `frequencia` e `dataProxima`; ignorar demais.
- `TESTE_DOENCA`: obrigatório `nomeDoenca` e `resultado`; `resultado` nunca recebe "inconclusivo" — registro simplesmente não é criado.

**Resultado de teste inconclusivo:** não registrar. A ausência de registro significa que o teste não foi feito ou foi inconclusivo — ambos têm o mesmo efeito para o adotante.

---

## TAGS DO ANIMAL (derivadas — sem coluna no banco)

Tags são calculadas no momento da renderização a partir de dados já existentes. Nenhuma coluna extra é criada no banco.

### Tags fixas (sempre exibidas)
| Tag | Fonte |
|---|---|
| Porte (P / M / G) | `Animal.porte` |
| Sexo (Macho / Fêmea) | `Animal.sexo` |

### Tags de saúde (exibidas quando condição verdadeira)
| Tag | Condição |
|---|---|
| Castrado | `Animal.castrado === true` |
| Vacinado | Tem ≥ 1 `RegistroSaude` com `tipo = VACINA` |
| Vermifugado | Tem ≥ 1 `RegistroSaude` com `tipo = CONTROLE_PARASITAS` |
| Testado | Tem ≥ 1 `RegistroSaude` com `tipo = TESTE_DOENCA` |

A tag "Testado" aparece independente do resultado (POSITIVO ou NEGATIVO). O resultado completo é visível apenas no painel de saúde detalhado da página do animal.

Tags usadas como filtro na vitrine: Castrado, Vacinado, Vermifugado, Testado (filtro opcional — "Outros").

---

## NAVEGAÇÃO POR PERFIL

### Visitante (deslogado)
- Logo "AdoptPlace" (link → `/`)
- Link "Adotar" (→ seção vitrine da página inicial ou `/vitrine`)
- Botão "Entrar" (→ `/login`) | Botão "Cadastrar" (→ `/cadastro`)

### Adotante logado
- Logo "AdoptPlace" (→ `/`)
- Link "Adotar" (→ vitrine)
- Avatar com iniciais do nome (sem foto: iniciais geradas pelo frontend, sem dependência externa) → menu dropdown: "Meu Perfil", "Minha Triagem", "Minhas Solicitações", "Meus Favoritos", "Sair"

### Organização / Acolhedor logado
- Tudo do Adotante logado +
- Botão "Meu Painel" (→ `/dashboard`) com submenu ou sidebar:
  - **Painel** — dashboard geral (métricas)
  - **Meus Animais** — ver e registrar animais
  - **Solicitações** — analisar, filtrar, aceitar e recusar
  - **Adotantes** — histórico de adoções concluídas

### Admin logado
- Logo + "Meu Painel" → `/dashboard/admin`

---

## PÁGINA INICIAL (`/`)

Página scrollável verticalmente. Duas seções principais:

### Seção 1 — Banner / Hero
- Headline: "Encontre seu parceiro ideal"
- Subtítulo: "O AdoptPlace conecta animais resgatados por organizações e acolhedores independentes a famílias prontas para dar um lar cheio de amor."
- Dois CTAs: "Ver animais disponíveis" (ancora para vitrine na mesma página) | "Sou uma organização" (→ `/cadastro/organizacao`)
- Três métricas em destaque (calculadas via query ao banco, sem tabela nova):
  - Animais disponíveis: `COUNT(Animal WHERE status = DISPONIVEL)`
  - Adoções realizadas: `COUNT(Animal WHERE status = ADOTADO)`
  - Acolhedores parceiros: `COUNT(AcolhedorIndependente)`

### Seção 2 — Vitrine integrada
- Sistema de filtros no topo: Espécie | Porte | Sexo | Localidade (cidade) | Outros (tags: Castrado, Vacinado, Vermifugado, Testado)
- Grid de cards de animais abaixo dos filtros
- Filtros via `searchParams` (URL state) — Server-rendered, sem JS adicional no cliente
- Paginação: máximo 12 animais por página
- Apenas animais com `status = DISPONIVEL`

---

## CARD DO ANIMAL (vitrine)

Cada card exibe:
- Foto principal (placeholder local se sem foto)
- Nome do animal
- Idade estimada
- Nome da organização ou acolhedor responsável (sem dados de contato — apenas nome)
- Tags (fixas + saúde aplicáveis)

Clique no card → `/animais/[id]` (página pública do animal)

---

## PÁGINA PÚBLICA DO ANIMAL (`/animais/[id]`)

Acessível sem login. Somente leitura. Nenhum dado sensível exposto.

**Conteúdo em ordem:**
1. Galeria de fotos (foto principal em destaque + miniaturas das demais)
2. Nome do animal + tags (fixas + saúde)
3. Nome e identificação da organização/acolhedor responsável (nome apenas, sem contato)
4. Tabela de atributos: Espécie | Raça | Porte | Sexo | Cor | Idade Estimada | Castrado | Status
5. Painel de Registro de Saúde (somente leitura) dividido em três abas/seções:
   - **Vacinas** — lista de registros com nome da vacina, data de aplicação, data do próximo reforço
   - **Controle de Parasitas** — lista com tipo de medicamento, frequência, datas
   - **Testes de Doenças** — lista com nome da doença e resultado (Positivo / Negativo)
   - Se uma seção não tiver registros → a aba/seção não é exibida
6. Animais Relacionados (cards clicáveis) — seção oculta se não houver vínculos
7. Ações:
   - Botão "Solicitar Adoção" (visível apenas se `status = DISPONIVEL`; requer login + triagem concluída)
   - Botão "Favoritar" / "Desfavoritar" (requer login como adotante; visitante → redireciona para login)

**Segurança:** nenhum campo de triagem do adotante, CPF, endereço ou dado interno da organização é exposto nesta página.

---

## PAINEL DA ORGANIZAÇÃO / ACOLHEDOR (`/dashboard`)

### Área: Painel (dashboard geral)
Métricas dos próprios animais:
- Total de animais cadastrados
- Animais disponíveis
- Solicitações pendentes (status = EM_ANALISE)
- Adoções realizadas (status = ADOTADO)
- Vacinas/procedimentos com `dataProxima` nos próximos 30 dias (alerta)

### Área: Meus Animais
- Listagem de animais com status e ações (editar, ver solicitações, gerenciar saúde, gerenciar fotos, gerenciar parentesco)
- Botão "Cadastrar novo animal"

### Área: Solicitações
- Listagem filtrável por status (EM_ANALISE / APROVADA / RECUSADA / CONCLUIDA)
- Ordenada por data, mais recente primeiro
- Clique em solicitação → exibe perfil completo de triagem do adotante + campo de observações + ações (Aprovar / Recusar)

### Área: Adotantes
- Histórico de adoções bem-sucedidas: solicitações com `status = CONCLUIDA` vinculadas aos animais da organização
- Cada entrada exibe: nome do adotante, nome do animal, data de conclusão
- Clique na entrada → perfil de triagem do adotante (somente leitura)
- Não exibe adotantes de outras organizações

---

## HISTÓRIAS DE USUÁRIO

### Visitante (sem login)
- VS01: Como visitante, quero ver a vitrine de animais disponíveis com filtros por espécie, raça, porte, sexo, cidade e tags para encontrar um animal compatível.
- VS02: Como visitante, quero ver o perfil completo de um animal (fotos, atributos, registros de saúde, animais relacionados) para decidir se quero solicitá-lo.
- VS03: Como visitante, quero clicar num animal relacionado e ser redirecionado para o perfil dele.
- VS04: Como visitante, quero ser redirecionado para login ao clicar em "Solicitar Adoção" ou "Favoritar".

### Adotante
- AD01: Como adotante, quero me cadastrar informando nome, CPF, e-mail, telefone e endereço.
- AD02: Logo após o cadastro, quero ser redirecionado automaticamente para o formulário de triagem obrigatório.
- AD03: Como adotante com triagem concluída, quero enviar uma solicitação de adoção para um animal disponível.
- AD04: Como adotante, quero acompanhar o status das minhas solicitações.
- AD05: Como adotante, quero editar meu formulário de triagem a qualquer momento.
- AD06: Como adotante sem triagem concluída, quero ser bloqueado de enviar solicitações e redirecionado para completar a triagem.
- AD07: Como adotante, quero favoritar um animal para salvá-lo e acessá-lo depois no meu painel.
- AD08: Como adotante, quero desfavoritar um animal que já não me interessa.

### Organização Protetora / Acolhedor Independente
- ORG01: Como organização/acolhedor, quero cadastrar um animal com nome, espécie, raça, porte, sexo, cor, castrado, descrição e fotos.
- ORG02: Como organização/acolhedor, quero alterar o status de um animal entre os estados do ciclo de vida.
- ORG03: Como organização/acolhedor, quero registrar vacinas no histórico de saúde de um animal, selecionando de um catálogo ou digitando um nome personalizado.
- ORG04: Como organização/acolhedor, quero registrar controle de parasitas com tipo de medicamento e frequência.
- ORG05: Como organização/acolhedor, quero registrar testes de doenças com o resultado (Positivo ou Negativo).
- ORG06: Como organização/acolhedor, quero vincular dois animais como relacionados de forma bidirecional.
- ORG07: Como organização/acolhedor, quero visualizar e analisar solicitações de adoção com o perfil completo de triagem do adotante.
- ORG08: Como organização/acolhedor, quero aprovar ou recusar uma solicitação com observações.
- ORG09: Como organização/acolhedor, quero ver o histórico de adoções concluídas com o perfil dos adotantes.
- ORG10: Como organização/acolhedor, quero ver alertas de vacinas/procedimentos com data próxima nos próximos 30 dias.

### Administrador
- ADM01: Como administrador, quero listar todos os usuários cadastrados com seu tipo e status.
- ADM02: Como administrador, quero ativar ou desativar qualquer conta.

---

## CRITÉRIOS DE ACEITAÇÃO

### CA-01 — Cadastro de Adotante e Triagem
- [ ] Adotante preenche campos obrigatórios → sistema cria conta e redireciona para `/dashboard/triagem`
- [ ] Adotante tenta acessar `/animais/[id]` e clicar em "Solicitar" sem triagem concluída → redirecionado para triagem com mensagem explicativa
- [ ] Adotante com triagem concluída → botão "Solicitar Adoção" disponível
- [ ] E-mail já existente → erro "E-mail já cadastrado"
- [ ] CPF já existente → erro "CPF já cadastrado"

### CA-02 — Vitrine e Filtros
- [ ] Vitrine exibe apenas animais com `status = DISPONIVEL`
- [ ] Filtro por espécie "Gato" → apenas gatos exibidos
- [ ] Filtro por tag "Vacinado" → apenas animais com ≥ 1 registro de vacina
- [ ] Filtro por tag "Castrado" → apenas animais com `castrado = true`
- [ ] Combinação de filtros funciona corretamente
- [ ] Nenhum resultado → "Nenhum animal encontrado com esses critérios" + botão "Limpar filtros"
- [ ] Paginação: máximo 12 animais por página
- [ ] Vitrine e página inicial acessíveis sem login

### CA-03 — Card e Página do Animal
- [ ] Card exibe: foto principal, nome, idade, responsável, tags
- [ ] Página do animal exibe: galeria, nome, tags, responsável (nome), tabela de atributos, painel de saúde, animais relacionados, ações
- [ ] Seção de saúde sem registros de um tipo → aba/seção daquele tipo não exibida
- [ ] Animais relacionados sem vínculos → seção não exibida
- [ ] Animal relacionado com status ≠ DISPONIVEL → exibido sem botão "Solicitar"
- [ ] Nenhum dado sensível do adotante ou dados internos da org na página pública

### CA-04 — Registro de Saúde
- [ ] Data de aplicação futura → erro "Data de aplicação não pode ser futura"
- [ ] `dataProxima` anterior ou igual a `dataRegistro` → erro "Data próxima deve ser posterior ao registro"
- [ ] Vacina com catálogo: selecionar item → `nomeVacina` preenchido, `ehVacinaCustomizada = false`
- [ ] Vacina "Outra": campo texto exibido → `ehVacinaCustomizada = true`
- [ ] Teste com resultado inconclusivo → não registrar; frontend não oferece a opção
- [ ] Registro válido aparece na seção correspondente do painel de saúde do animal
- [ ] Adotante/visitante não consegue criar, editar ou excluir registros de saúde → 403

### CA-05 — Solicitação de Adoção
- [ ] Adotante não logado clica em "Solicitar" → redirecionado para login com `callbackUrl`
- [ ] Adotante sem triagem → redirecionado para triagem
- [ ] Adotante com triagem envia solicitação → `SolicitacaoAdocao` criada com `status = EM_ANALISE`
- [ ] Adotante tenta solicitar o mesmo animal duas vezes → erro "Você já tem uma solicitação ativa para este animal"
- [ ] Animal com `status ≠ DISPONIVEL` → botão "Solicitar" não exibido

### CA-06 — Aprovação e Recusa
- [ ] Listagem de solicitações ordenada por data, mais recente primeiro
- [ ] Clique em solicitação → perfil completo de triagem do adotante exibido
- [ ] Aprovação → `status = APROVADA` + `Animal.status = EM_PROCESSO_ADOCAO`
- [ ] Recusa → `status = RECUSADA` + `Animal.status` permanece `DISPONIVEL`
- [ ] Observações salvas junto com a decisão
- [ ] Organização A não consegue ver/gerenciar solicitações da Organização B → 403

### CA-07 — Vínculo de Parentesco
- [ ] Registrar vínculo A→B → (A,B) e (B,A) criados na mesma transação
- [ ] Ambas as páginas exibem o outro animal como relacionado
- [ ] Remover vínculo → (A,B) e (B,A) deletados
- [ ] Vincular animal a si mesmo → erro "Um animal não pode ser relacionado a si mesmo"
- [ ] Vínculo já existente → ignorar silenciosamente

### CA-08 — Favoritar
- [ ] Adotante logado clica "Favoritar" → `Favorito` criado; botão muda para "Desfavoritar"
- [ ] Adotante clica "Desfavoritar" → `Favorito` deletado
- [ ] Visitante clica "Favoritar" → redirecionado para login
- [ ] Favoritos visíveis em "Meus Favoritos" no painel do adotante
- [ ] Org/Acolhedor/Admin não consegue favoritar → ação não disponível para esses perfis

### CA-09 — Controle de Acesso
- [ ] Rota `/dashboard/*` sem sessão → redirecionado para `/login`
- [ ] Adotante em rota de gestão de animais → 403
- [ ] Usuário desativado → "Conta desativada. Entre em contato com o administrador"
- [ ] Sessão expirada → redirect para `/login` com `callbackUrl`

### CA-10 — XOR Animal
- [ ] Criar animal sem `organizacaoId` nem `acolhedorId` → erro de validação
- [ ] Criar animal com ambos → erro de validação

### CA-11 — Área Adotantes (Org/Acolhedor)
- [ ] Lista apenas adoções concluídas (`status = CONCLUIDA`) dos próprios animais
- [ ] Exibe: nome do adotante, nome do animal, data de conclusão
- [ ] Clique → perfil de triagem do adotante (somente leitura)
- [ ] Não exibe adotantes de outras organizações → 403

### CA-12 — Página Inicial
- [ ] Métricas exibem valores reais do banco
- [ ] CTA "Ver animais disponíveis" ancora para a vitrine na mesma página
- [ ] CTA "Sou uma organização" → `/cadastro/organizacao`
- [ ] Vitrine integrada funciona com os mesmos filtros e paginação descritos em CA-02

---

## REQUISITOS FUNCIONAIS

| Código | Nome | Descrição | Rota(s) |
|---|---|---|---|
| RF01 | Autenticação | NextAuth Credentials; sessão com `tipoPerfil` e `entityId`; JWT strategy | `/login`, `/cadastro` |
| RF02 | Cadastro Adotante + Triagem | Cadastro → redirect obrigatório para triagem; flag `triagemConcluida` | `/cadastro/adotante`, `/dashboard/triagem` |
| RF03 | Cadastro Organização | Dados da pessoa jurídica | `/cadastro/organizacao` |
| RF04 | Cadastro Acolhedor | Dados de pessoa física | `/cadastro/acolhedor` |
| RF05 | Gestão de Animais | CRUD completo; validação XOR; controle de status | `/dashboard/animais` |
| RF06 | Galeria de Fotos | Upload via Uploadthing; max 10 fotos; definir principal; excluir | `/dashboard/animais/[id]/fotos` |
| RF07 | Registro de Saúde | Três categorias (Vacinas, Controle de Parasitas, Testes) com catálogos + opção "Outra"; validação de datas e resultado | `/dashboard/animais/[id]/saude` |
| RF08 | Vínculos de Parentesco | Busca por nome; insert/delete bidirecional em transação | `/dashboard/animais/[id]/relacionados` |
| RF09 | Página Inicial + Vitrine | Landing com métricas + vitrine integrada; filtros por espécie, porte, sexo, cidade, tags; paginação; Server-rendered | `/` |
| RF10 | Página Pública do Animal | Galeria, atributos, painel de saúde (leitura), relacionados, ações; sem dados sensíveis | `/animais/[id]` |
| RF11 | Solicitação de Adoção | Guard triagem + guard duplicata; criação com status EM_ANALISE | `/animais/[id]` |
| RF12 | Gestão de Solicitações | Listagem filtrável; ver triagem; aprovar/recusar com observações; cascade de status do animal | `/dashboard/solicitacoes` |
| RF13 | Favoritar Animal | Adotante favorita/desfavorita; lista de favoritos no painel | `/animais/[id]`, `/dashboard/favoritos` |
| RF14 | Painel Org/Acolhedor | Dashboard com métricas; Meus Animais; Solicitações; Adotantes (histórico de adoções concluídas) | `/dashboard` |
| RF15 | Painel Adotante | Triagem (ver/editar); Minhas Solicitações; Meus Favoritos; editar dados pessoais | `/dashboard` |
| RF16 | Gerenciamento de Usuários (Admin) | Listagem; ativar/desativar | `/dashboard/admin/usuarios` |

---

## REQUISITOS NÃO-FUNCIONAIS

| Código | Requisito | Implementação |
|---|---|---|
| RNF01 | Segurança de sessão | `getServerSession()` em toda Server Action e API Route autenticada |
| RNF02 | Senhas | bcryptjs, salt rounds = 12; `senhaHash` nunca retornado em query |
| RNF03 | Autorização por ownership | Toda escrita valida se o recurso pertence ao usuário autenticado |
| RNF04 | Validação Zod dupla | Schema em `lib/schemas/`; reutilizado no cliente e no servidor |
| RNF05 | Dados sensíveis | CPF, endereço, triagem: jamais expostos em rotas públicas |
| RNF06 | Performance | Paginação de 12 itens; índices Prisma em `Animal.status`, `Animal.especieId`, `RegistroSaude.animalId`, `SolicitacaoAdocao.adotanteId` |
| RNF07 | Responsividade | Mobile-first; vitrine e painel funcionais em 375px |
| RNF08 | Acessibilidade | Componentes shadcn/ui (Radix UI); labels em todos os inputs; não remover atributos ARIA |

---

## CASOS EXTREMOS E EDGE CASES

### Autenticação
- Usuário tenta rota de outro perfil → 403
- Usuário desativado tenta logar → "Conta desativada. Entre em contato com o administrador"
- Sessão expirada em ação → redirect para `/login` com `callbackUrl`

### Animal
- Deletar animal com solicitações `EM_ANALISE` → bloquear; exibir "Há solicitações pendentes. Recuse-as antes de remover o animal."
- Alterar status de `DISPONIVEL` com solicitações `EM_ANALISE` → bloquear mudança de status
- Upload de foto com formato inválido → Uploadthing rejeita; exibir erro amigável
- Animal sem foto → placeholder local (sem URL externa)

### Registro de Saúde
- Resultado inconclusivo → não registrar; frontend não oferece a opção
- Teste com resultado → aparece na aba "Testes" do painel do animal
- Org/Acolhedor A não consegue editar registros de saúde do animal da Org B → 403

### Triagem
- Adotante edita triagem após solicitação aprovada → triagem atualizada; decisões passadas não são afetadas
- Campo condicional em branco quando campo-pai é `false` → Zod: optional/nullable; banco: NULL

### Vínculo de Parentesco
- Vínculo já existente → ignorar silenciosamente
- Animal relacionado com `status ≠ DISPONIVEL` → exibido na seção sem botão "Solicitar"

### Solicitação
- Race condition (dois adotantes aprovados simultaneamente) → `@@unique([animalId, adotanteId])` previne; apenas o primeiro commit passa
- Animal volta a `DISPONIVEL` após cancelamento → solicitação `RECUSADA`; adotante pode submeter nova

### Favoritar
- Adotante favorita animal já favoritado → ignorar silenciosamente (idempotente)
- Animal é adotado (status = ADOTADO) → continua nos favoritos do adotante; exibido com badge "Adotado" na lista de favoritos

### Admin
- Desativar org com animais `DISPONIVEL` → animais permanecem; org não consegue logar; vitrine continua exibindo animais (aceitável para TCC)

---

## SEQUÊNCIA DE IMPLEMENTAÇÃO

### Fase 1 — Fundação (bloqueia tudo)
1. Setup Next.js 15 com TypeScript strict
2. Tailwind CSS v4 + shadcn/ui (init)
3. Schema Prisma completo (conforme seção Modelo de Dados)
4. Migration inicial + seed
5. NextAuth v5 com Prisma Adapter + Credentials provider

### Fase 2 — Autenticação e Cadastros
6. Página de login com Zod
7. Fluxo de cadastro com seleção de perfil → redirect
8. Middleware de proteção de rotas
9. Formulário de triagem do adotante
10. Flag `triagemConcluida` e guard na solicitação

### Fase 3 — Gestão de Animais e Saúde
11. CRUD de animais com validação XOR
12. Upload de fotos via Uploadthing + definição de principal
13. Painel de Registro de Saúde (três categorias, catálogos, "Outra")
14. Gestão de vínculos de parentesco (transação bidirecional)

### Fase 4 — Página Inicial, Vitrine e Página do Animal
15. Página inicial com banner, métricas e vitrine integrada
16. Filtros via searchParams + paginação (Server-rendered)
17. Tags derivadas (lógica de cálculo reutilizável no servidor)
18. Card do animal na vitrine
19. Página pública do animal (atributos + painel de saúde leitura + relacionados)
20. Favoritar/desfavoritar

### Fase 5 — Solicitações e Painéis
21. Fluxo de solicitação de adoção (guard triagem + guard duplicata)
22. Painel de solicitações org/acolhedor (listar, filtrar, ver triagem, aprovar/recusar)
23. Área Adotantes org (histórico de adoções concluídas)
24. Painel do adotante (triagem + solicitações + favoritos)
25. Dashboard geral org/acolhedor (métricas + alerta de procedimentos próximos)

### Fase 6 — Admin e Qualidade
26. Painel admin (listagem de usuários, ativar/desativar)
27. Testes de aceitação manuais (checar todos os CAs)
28. Seed realista com dados fictícios das duas organizações clientes
29. Revisão de segurança: ownership em todas as Server Actions

---

## SEED DE DESENVOLVIMENTO

```
Catálogos:
- VacinaCatalogo: V8, V10, Antirrábica, Gripe Felina, FeLV (vacina), Giárdia
- DoencaCatalogo: FIV, FeLV, Leishmaniose, Erliquiose, Babesiose, Cinomose, Parvovirose

Espécies e Raças:
- Cachorro: SRD, Labrador, Poodle, Pit Bull
- Gato: SRD, Siamês, Persa
- Coelho: SRD

Usuários de teste:
- org@ciaanimal.com / test1234 → Organizacao (Cia Animal VR)
- org@spavr.com / test1234 → Organizacao (SPA-VR)
- acolhedor@teste.com / test1234 → AcolhedorIndependente
- adotante@teste.com / test1234 → Adotante (triagem concluída)
- adotante2@teste.com / test1234 → Adotante (triagem não concluída)
- admin@adoptplace.com / test1234 → Admin

Animais: 10 animais variados com status DISPONIVEL
- 4 para Cia Animal VR, 4 para SPA-VR, 2 para acolhedor
- Mix de espécies, portes, sexos
Vínculos: 2 pares de irmãos
Registros de Saúde: pelo menos 1 de cada tipo em animais diferentes
1 solicitação EM_ANALISE
2 favoritos do adotante de teste
```

---

## VARIÁVEIS DE AMBIENTE

```env
DATABASE_URL="postgresql://user:password@localhost:5432/adoptplace"
# SQLite: DATABASE_URL="file:./dev.db"

NEXTAUTH_SECRET="gerar-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

UPLOADTHING_SECRET="obtido-no-uploadthing-dashboard"
UPLOADTHING_APP_ID="obtido-no-uploadthing-dashboard"
```

---

## INSTRUÇÕES PARA O SPEC-KIT

```bash
# Instalar CLI
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Inicializar com Codex CLI em skills mode
specify init adoptplace --integration codex --integration-options="--skills"

# Fluxo
$speckit-spec    # gera spec.md a partir deste arquivo
$speckit-plan    # gera plan.md com arquitetura detalhada
$speckit-tasks   # gera tasks.md com itens atômicos ordenados por dependência
$speckit-implement  # loop de implementação
$speckit-check   # verifica cobertura tasks vs spec
```

**Instrução ao Codex antes de cada `$speckit-implement`:**
> "Implemente apenas a task selecionada. Verifique os critérios de aceitação correspondentes ao final. Não crie abstrações além do necessário para a task atual. O schema Prisma em `prisma/schema.prisma` é a fonte de verdade — não altere sem instrução explícita."

---

## CHECKLIST PRÉ-IMPLEMENTAÇÃO

- [ ] Repositório GitHub criado com todos os membros
- [ ] VS Code com extensions: Prisma, ESLint, Tailwind CSS IntelliSense, TypeScript
- [ ] Node.js 20+ em todas as máquinas
- [ ] PostgreSQL via Docker: `docker run --name adoptplace-db -e POSTGRES_PASSWORD=test1234 -p 5432:5432 -d postgres:16` — OU SQLite configurado como fallback
- [ ] Conta Uploadthing criada (free tier) e credenciais salvas
- [ ] `.env.local` configurado
- [ ] `NEXTAUTH_SECRET` gerado: `openssl rand -base64 32`
- [ ] Spec-Kit instalado e `specify init` executado
- [ ] Codex CLI instalado e autenticado
