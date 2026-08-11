# Data Model: Perfis públicos e busca por nome

**Feature**: 006-perfis-publicos | **Source of truth**: `prisma/schema.prisma`

## Overview

Perfil público é uma projeção de leitura, não um novo model. A feature altera apenas
`Organizacao` e `AcolhedorIndependente`; `Adotante`, `Animal`, `SolicitacaoAdocao`, `Municipio` e
`Usuario` permanecem estruturalmente iguais e participam das projeções/autorização existentes.

## Persisted changes

### Organizacao

| Field | Prisma type | Required | Default/backfill | Validation and use |
|---|---|---:|---|---|
| `descricao` | `String?` | No | `null` | texto aparado, vazio vira `null`, máximo 500 caracteres |
| `fotoUrl` | `String?` | No | `null` | URL persistida somente pelo completion do Uploadthing autorizado |
| `razaoSocialNormalizada` | `String` | Yes | backfill da `razaoSocial` | saída de `normalizarNomeMunicipio(razaoSocial)`; nunca aceita do cliente |

Novo índice:

```prisma
@@index([razaoSocialNormalizada], map: "idx_organizacao_razao_social_normalizada")
```

Regras:

- cadastro grava `razaoSocial` e `razaoSocialNormalizada` juntos;
- PATCH que altera `razaoSocial` atualiza ambos na mesma operação;
- busca lê exclusivamente `razaoSocialNormalizada` e filtra `usuario.ativo: true`;
- a coluna não é retornada em DTO algum.

### AcolhedorIndependente

| Field | Prisma type | Required | Default | Validation and use |
|---|---|---:|---|---|
| `descricao` | `String?` | No | `null` | texto aparado, vazio vira `null`, máximo 500 caracteres |
| `fotoUrl` | `String?` | No | `null` | URL persistida somente pelo completion do Uploadthing autorizado |

O `nomeCompleto` continua privado. A identificação pública é derivada no servidor como primeiro
nome + inicial do último sobrenome e não precisa de campo persistido adicional.

## Existing entities used without schema changes

### Usuario

- Relação 1:1 com cada tipo de perfil.
- `ativo` participa de toda query pública: perfil ausente e perfil desativado produzem o mesmo 404.
- `tipoPerfil` limita busca a organização e autorização protegida a ADMIN/adotante/responsável.
- `email` nunca aparece nas novas respostas públicas.

### Adotante

Projeção pública permitida:

- `id` como identidade de rota;
- `nomeCompleto`;
- `cidade`, `estado`/relação `municipio` para exibição de município/UF;
- `triagemConcluida`.

Projeção restrita adiciona:

- `endereco`, `cep`, cidade/estado;
- allowlist de campos de triagem já existentes no model.

Exclusões obrigatórias do novo endpoint: `cpf`, `telefone`, `email`, `instagram`, latitude,
longitude, precisão, `usuarioId` e objetos Prisma amplos.

### SolicitacaoAdocao

É o vínculo de autorização entre `Adotante` e responsável:

```text
Adotante <- SolicitacaoAdocao -> Animal -> Organizacao | AcolhedorIndependente
```

Regra: a mera existência autoriza; `status` não participa do predicado. Portanto `EM_ANALISE`,
`APROVADA`, `RECUSADA` e `CONCLUIDA` têm o mesmo efeito para leitura restrita.

### Animal

- catálogo de organização: `organizacaoId = :profileId` e `status = DISPONIVEL`;
- catálogo de acolhedor: `acolhedorId = :profileId` e `status = DISPONIVEL`;
- filtros: `especieId`, `racaId`, `porte`, `sexo`;
- ordenação herdada: `criadoEm desc`, `nome asc`;
- paginação herdada: 30 itens/página;
- cada animal tem exatamente um responsável por regra já existente; a feature não adiciona relação.

### Municipio

Continua fonte do município/UF e das coordenadas internas. Nenhum perfil público retorna latitude ou
longitude. `normalizarNomeMunicipio()` é reutilizada para razão social, mas o model `Municipio` não
muda.

## Derived DTO entities

### PublicResponsibleReference

```ts
type PublicResponsibleReference = {
  responsavelId: string;
  responsavelTipo: "ORGANIZACAO" | "ACOLHEDOR";
  responsavel: string | null;
};
```

Para organização, `responsavel` é `razaoSocial`. Para acolhedor, é a identificação derivada
“Primeiro I.”; nome completo nunca cruza a fronteira pública.

### PublicProfileCatalog

```ts
type PublicProfileCatalog = {
  animals: PublicAnimalSummaryDTO[];
  filterOptions: {
    especies: { id: string; nome: string }[];
    racas: { id: string; nome: string; especieId: string }[];
  };
  pagination: { page: number; perPage: 30; total: number; totalPages: number };
};
```

`racas` fica vazio quando nenhum animal disponível daquele perfil possui raça; a UI então não
renderiza esse filtro.

### AdopterPublicProfileDTO

```ts
type AdopterPublicProfileDTO = {
  access: "PUBLIC";
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  triagemConcluida: boolean;
};
```

### AdopterRestrictedProfileDTO

```ts
type AdopterRestrictedProfileDTO = {
  access: "RESTRICTED";
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  triagemConcluida: boolean;
  enderecoAnalise: {
    endereco: string;
    cep: string | null;
    cidade: string;
    estado: string;
  };
  triagem: ScreeningAllowlistDTO;
};
```

O discriminador torna a forma explícita. `telefone` não pertence a nenhuma variante.

## Migration strategy

Uma única migration da Onda 0:

1. adiciona `descricao`/`fotoUrl` nullable aos dois perfis;
2. adiciona `razaoSocialNormalizada` temporariamente apta a backfill;
3. preenche todas as organizações existentes dentro da migration com uma expressão PostgreSQL
   explícita equivalente a `normalizarNomeMunicipio()` (`translate`, `lower`, compressão de espaços
   e `btrim`), sem criar função normalizadora de aplicação;
4. torna a coluna obrigatória;
5. cria `idx_organizacao_razao_social_normalizada`.

Após aplicar a migration em ambiente autorizado, uma verificação read-only percorre todas as
organizações e compara a coluna ao resultado do helper TypeScript. Qualquer divergência bloqueia a
Onda 0 antes do commit.

Não editar migration aplicada, não executar reset e não aplicar contra produção durante a feature.
O seed passa a sempre preencher a coluna usando o helper de aplicação.

## Validation rules

| Input | Rule |
|---|---|
| profile ID / adopter ID | CUID válido |
| `descricao` | opcional/nullable, trim, vazio → `null`, máximo 500 |
| search `q` | trim + normalização existente, mínimo 2 caracteres normalizados |
| search result | máximo 10, apenas organizações ativas |
| catalog `page` | inteiro ≥ 1 |
| catalog filters | enums Prisma/IDs válidos; unknown fields ignored/rejected per query schema |
| profile image | exatamente 1 arquivo, MIME `image/*`, máximo 4 MB |

## State and lifecycle

Não há novo enum ou máquina de estados. Os comportamentos relevantes são:

- `Usuario.ativo: true → false`: perfil deixa de ser encontrado na próxima leitura;
- `Animal.status → DISPONIVEL`: entra no catálogo; qualquer outro status sai;
- descrição preenchida → vazia: persiste `null` e ativa fallback visual;
- foto ausente → enviada/substituída: `fotoUrl` passa a apontar para o upload concluído;
- solicitação criada: responsável passa a receber a projeção restrita para sempre, independente das
  transições posteriores de status.

## Invariants and privacy

- nenhuma resposta nova contém CPF, CNPJ, e-mail, telefone, senha/hash ou coordenada;
- endereço público completo existe somente no perfil de organização;
- endereço de adotante existe somente na projeção restrita;
- endereço de acolhedor nunca é selecionado em consulta pública;
- busca nunca consulta Adotante/Acolhedor;
- autorização restrita ocorre antes da seleção/serialização sensível.
