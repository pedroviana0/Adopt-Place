# Data Model: Animal Adoption Management

## Enums

- **TipoPerfil**: `ADOTANTE`, `ORGANIZACAO`, `ACOLHEDOR`, `ADMIN`
- **Porte**: `P`, `M`, `G`
- **Sexo**: `M`, `F`
- **StatusAnimal**: `RESGATADO`, `EM_CUIDADOS`, `DISPONIVEL`, `EM_PROCESSO_ADOCAO`, `ADOTADO`
- **StatusSolicitacao**: `EM_ANALISE`, `APROVADA`, `RECUSADA`, `CONCLUIDA`
- **TipoMoradia**: `CASA`, `APARTAMENTO`, `SITIO_FAZENDA`
- **TipoRegistroSaude**: `VACINA`, `CONTROLE_PARASITAS`, `TESTE_DOENCA`
- **ResultadoTeste**: `POSITIVO`, `NEGATIVO`

## Entities

### Usuario

Base authentication account.

**Fields**: `id`, `email` unique, `senhaHash`, `tipoPerfil`, `ativo`,
`criadoEm`.

**Relationships**: Optional one-to-one `Adotante`, `Organizacao`, or
`AcolhedorIndependente`; NextAuth `Account[]` and `Session[]`.

**Validation**: Active users only may access protected areas. `senhaHash` is
never returned by public or dashboard queries.

### Adotante

Adopter profile and standardized screening answers.

**Fields**: `id`, `usuarioId` unique, `nomeCompleto`, `cpf` unique, `telefone`,
`instagram`, `endereco`, `cidade`, `estado`, all standardized screening fields,
`triagemConcluida`.

**Relationships**: One `Usuario`; many `SolicitacaoAdocao`; many `Favorito`.

**Validation**: CPF and e-mail uniqueness produce the specified user-facing
errors. Adoption requests require `triagemConcluida = true`.

### Organizacao

Formal protective organization profile.

**Fields**: `id`, `usuarioId` unique, `razaoSocial`, `cnpj` unique, `telefone`,
`endereco`, `cidade`, `estado`, `responsavelNome`, `capacidadeMaxima`.

**Relationships**: One `Usuario`; many `Animal`.

### AcolhedorIndependente

Independent foster responsible for animals without organization structure.

**Fields**: `id`, `usuarioId` unique, `nomeCompleto`, `cpf` unique, `telefone`,
`endereco`, `cidade`, `estado`, `capacidadeAtual`.

**Relationships**: One `Usuario`; many `Animal`.

### Especie

Animal species catalog.

**Fields**: `id`, `nome` unique.

**Relationships**: Many `Raca`; many `Animal`.

### Raca

Breed catalog scoped by species.

**Fields**: `id`, `especieId`, `nome`.

**Relationships**: One `Especie`; many `Animal`.

**Validation**: Unique by `(especieId, nome)`.

### Animal

Rescued animal.

**Fields**: `id`, `nome`, `especieId`, `racaId`, `porte`, `sexo`, `cor`,
`idadeEstimada`, `castrado`, `descricao`, `status`, `organizacaoId`,
`acolhedorId`, `criadoEm`.

**Relationships**: One `Especie`; optional `Raca`; exactly one `Organizacao` or
`AcolhedorIndependente`; many `FotoAnimal`, `RegistroSaude`,
`SolicitacaoAdocao`, `Favorito`, and bidirectional `AnimalRelacionado`.

**Validation**: XOR ownership: exactly one of `organizacaoId` or `acolhedorId`.
Public showcase includes only `status = DISPONIVEL`.

### FotoAnimal

Animal photo.

**Fields**: `id`, `animalId`, `urlFoto`, `principal`, `ordem`, `criadoEm`.

**Relationships**: One `Animal`.

**Validation**: Each animal must have exactly one primary photo and may have up
to 10 ordered photos. Deleting an animal cascades photos.

### VacinaCatalogo

Reference vaccine catalog for autocomplete.

**Fields**: `id`, `nome` unique.

**Seed values**: V8, V10, Antirrábica, Gripe Felina, FeLV (vacina), Giárdia.

### DoencaCatalogo

Reference disease catalog for autocomplete.

**Fields**: `id`, `nome` unique.

**Seed values**: FIV, FeLV, Leishmaniose, Erliquiose, Babesiose, Cinomose,
Parvovirose.

### RegistroSaude

Unified health history entry.

**Fields**: `id`, `animalId`, `tipo`, `dataRegistro`, `dataProxima`,
`responsavelRegistro`, `nomeVacina`, `ehVacinaCustomizada`, `tipoMedicamento`,
`frequencia`, `nomeDoenca`, `ehDoencaCustomizada`, `resultado`.

**Relationships**: One `Animal`.

**Validation**: `dataRegistro` cannot be future. `dataProxima`, when provided,
must be later than `dataRegistro`. `resultado` is present only for
`TESTE_DOENCA` and is only positive or negative. Visitors and adopters cannot
create, edit, or delete health records.

### AnimalRelacionado

Bidirectional relationship between two animals.

**Fields**: `animalId`, `animalRelacionadoId`.

**Relationships**: Two references to `Animal`.

**Validation**: Composite primary key. Self-relationship is rejected. Creating
or removing a relationship writes/removes `(A,B)` and `(B,A)` in one
transaction. Duplicate relationships are ignored.

### Favorito

Animal saved by an adopter.

**Fields**: `adotanteId`, `animalId`, `criadoEm`.

**Relationships**: One `Adotante`; one `Animal`.

**Validation**: Composite primary key prevents duplicates. Only adopters may
favorite animals.

### SolicitacaoAdocao

Adoption request.

**Fields**: `id`, `animalId`, `adotanteId`, `status`, `dataSolicitacao`,
`dataAtualizacao`, `observacoes`.

**Relationships**: One `Animal`; one `Adotante`.

**Validation**: Unique `(animalId, adotanteId)`. Creation requires active
adopter, completed screening, and available animal. Approval sets the request to
`APROVADA`, animal to `EM_PROCESSO_ADOCAO`, and competing in-analysis requests
for the same animal to `RECUSADA`. Refusal keeps the animal `DISPONIVEL`.

## State Transitions

### Animal

`RESGATADO -> EM_CUIDADOS -> DISPONIVEL -> EM_PROCESSO_ADOCAO -> ADOTADO`

Responsible users may update status as operationally needed. Public showcase
uses only `DISPONIVEL`.

### Solicitação de Adoção

`EM_ANALISE -> APROVADA -> CONCLUIDA`

`EM_ANALISE -> RECUSADA`

Approval also refuses other in-analysis requests for the same animal.

## Derived Tags

Tags are calculated at render/query time and are not stored:

- Porte: from `Animal.porte`
- Sexo: from `Animal.sexo`
- Castrado: `Animal.castrado = true`
- Vacinado: at least one `RegistroSaude` with `tipo = VACINA`
- Vermifugado: at least one `RegistroSaude` with `tipo = CONTROLE_PARASITAS`
- Testado: at least one `RegistroSaude` with `tipo = TESTE_DOENCA`

## Indexing Guidance

Use Prisma indexes for high-use filters and ownership checks:

- `Animal.status`
- `Animal.especieId`
- `Animal.porte`
- `Animal.sexo`
- `RegistroSaude.animalId`
- `RegistroSaude.tipo`
- `SolicitacaoAdocao.adotanteId`
- `SolicitacaoAdocao.animalId`
- ownership fields `Animal.organizacaoId` and `Animal.acolhedorId`
