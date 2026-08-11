# HTTP Contracts: Perfis públicos e busca por nome

**Feature**: 006-perfis-publicos | **Status**: design, endpoints ainda não implementados

## Common rules

- O frontend oficial usa caminhos relativos `/api/*` pela mesma origem/proxy.
- Endpoints públicos não exigem cookie; endpoints protegidos usam cookie NextAuth e revalidam a
  conta atual no servidor.
- Entradas são validadas com Zod no servidor. Erro padrão:
  `{ "error": { "code": string, "message": string, "fieldErrors"?: object } }`.
- Respostas são allowlists construídas; nenhum model Prisma é serializado diretamente.
- IDs de rota são CUIDs. Datas, quando presentes, são ISO 8601.
- Campos proibidos em todas as novas respostas públicas: `cpf`, `cnpj`, `email`, `telefone`,
  `senhaHash`, `endereco` de pessoa física, `cep` de pessoa física, `latitude`, `longitude`,
  `precisaoCoordenada`, tokens e IDs de usuário.
- `responsavelId` é o ID opaco do perfil de organização/acolhedor, não `Usuario.id`.

## PROFILE-ORG-01 — perfil público de organização e catálogo

**Method/path**: `GET /api/perfis/organizacao/[id]` (novo)

**Auth**: público

**Backend sources**: `Usuario`, `Organizacao`, `Animal`, `Especie`, `Raca`, padrão de
`lib/queries/animal-showcase.ts` e schema novo em `lib/schemas/public-profiles.ts`.

### Query

| Field | Type | Default | Rule |
|---|---|---|---|
| `especieId` | string? | — | ID de espécie |
| `racaId` | string? | — | ID de raça |
| `porte` | `P \| M \| G`? | — | enum Prisma |
| `sexo` | `M \| F`? | — | enum Prisma |
| `page` | integer | 1 | mínimo 1 |

### 200 response

```json
{
  "profile": {
    "id": "org-cuid",
    "tipo": "ORGANIZACAO",
    "nome": "Proteção Animal",
    "descricao": "Atuação regional...",
    "fotoUrl": "https://.../profile.jpg",
    "municipio": "Volta Redonda",
    "uf": "RJ",
    "endereco": "Rua Exemplo, 10"
  },
  "catalog": {
    "animals": ["PublicAnimalSummaryDTO"],
    "filterOptions": {
      "especies": [{ "id": "...", "nome": "Cachorro" }],
      "racas": [{ "id": "...", "nome": "SRD", "especieId": "..." }]
    },
    "pagination": { "page": 1, "perPage": 30, "total": 1, "totalPages": 1 }
  }
}
```

`descricao` e `fotoUrl` são nullable. `animals` contém apenas `DISPONIVEL` com
`organizacaoId = [id]`. `filterOptions.racas` fica vazio quando não há raça registrada nesse
catálogo.

### Errors and tests

- 400 `VALIDATION_ERROR`: ID/filtro/página inválido.
- 404 `PROFILE_NOT_FOUND`: ID inexistente **ou conta desativada**, mesma forma/mensagem.
- Testes: catálogo não mistura responsáveis/status; paginação/filtros; desativada indistinguível;
  varredura da resposta sem CNPJ, contato ou coordenada.

## PROFILE-FOSTER-01 — perfil público de acolhedor

**Method/path**: `GET /api/perfis/acolhedor/[id]` (novo)

**Auth**: público

**Query/catalog**: mesmos filtros, paginação e forma de catálogo de `PROFILE-ORG-01`, substituindo o
predicado por `acolhedorId = [id]`.

### 200 response

```json
{
  "profile": {
    "id": "foster-cuid",
    "tipo": "ACOLHEDOR",
    "nome": "Marina S.",
    "descricao": null,
    "fotoUrl": null,
    "municipio": "Barra Mansa",
    "uf": "RJ"
  },
  "catalog": {
    "animals": [],
    "filterOptions": { "especies": [], "racas": [] },
    "pagination": { "page": 1, "perPage": 30, "total": 0, "totalPages": 1 }
  }
}
```

O nome é derivado de primeiro nome + inicial do último sobrenome. A seleção pública não inclui
`nomeCompleto`, endereço, CEP, CPF, telefone, e-mail ou coordenada.

### Errors and tests

Mesmos 400/404 de organização. Um teste percorre recursivamente toda a resposta e falha para
qualquer chave sensível ou nome completo.

## PROFILE-ADOPTER-01 — perfil de adotante com projeção autorizada

**Method/path**: `GET /api/perfis/adotante/[id]` (novo)

**Auth**: endpoint acessível publicamente, mas o cookie opcional determina a projeção. Conta do
alvo precisa estar ativa.

**Backend sources**: `getServerSession()`, `Usuario`, `Adotante`, `SolicitacaoAdocao`, `Animal`,
`lib/permissions.ts` e precedente `lib/queries/owner-request-detail.ts`.

### Authorization order

1. Validar o ID.
2. Ler sessão opcional e, se houver, revalidar conta/papel/IDs do chamador.
3. Autorizar projeção restrita quando chamador é o próprio adotante, ADMIN, ou responsável com
   `SolicitacaoAdocao` do alvo ligada a animal próprio. Não filtrar status.
4. Somente então executar **uma** das duas queries: pública sem campos sensíveis ou restrita com
   endereço/triagem.

### 200 public response

```json
{
  "profile": {
    "access": "PUBLIC",
    "id": "adopter-cuid",
    "nome": "Pessoa Adotante",
    "municipio": "Volta Redonda",
    "uf": "RJ",
    "triagemConcluida": true
  }
}
```

### 200 restricted response

```json
{
  "profile": {
    "access": "RESTRICTED",
    "id": "adopter-cuid",
    "nome": "Pessoa Adotante",
    "municipio": "Volta Redonda",
    "uf": "RJ",
    "triagemConcluida": true,
    "enderecoAnalise": {
      "endereco": "Rua Exemplo, 20",
      "cep": "27200-000",
      "cidade": "Volta Redonda",
      "estado": "RJ"
    },
    "triagem": {
      "motivoAdocao": "...",
      "tipoAnimalDesejado": "...",
      "podeArcarCustosVet": true,
      "adocaoParaPresente": false,
      "adocaoParaPresenteDetalhe": null,
      "tipoMoradia": "CASA",
      "moradiaPropria": true,
      "numAdultosCasa": 2,
      "temCriancas": false,
      "criancasFaixaEtaria": null,
      "todosConcordamAdocao": true,
      "condominioPermiteAnimal": null,
      "janelasTeladas": true,
      "acessoRua": "Somente com guia",
      "murosSeguros": true,
      "horasSozinho": "4 horas",
      "responsavelViagem": "Família",
      "planoEmGravidez": "Manter o animal",
      "alergicosNaCasa": false,
      "alergicosNaCasaDetalhe": null,
      "planoMudanca": "Levar o animal",
      "historicoDevolucao": "Nunca",
      "historicoPercaDescuido": "Nunca",
      "cienteLongevidade": true,
      "permiteVisitaProtetor": true,
      "cienteNaoRepassar": true,
      "teveAnimaisAntes": true,
      "animaisAnterioresDescricao": null,
      "temOutrosAnimais": false,
      "outrosAnimaisDescricao": null
    }
  }
}
```

`telefone` é proibido nas duas respostas. CPF, e-mail, Instagram, coordenadas e IDs internos também.

### Errors and tests

- 400 `VALIDATION_ERROR`: ID inválido.
- 404 `PROFILE_NOT_FOUND`: ausente/desativado, indistinguível.
- Visitante, outro adotante e responsável sem vínculo recebem 200 público, nunca triagem/endereço.
- Testes CR-007 provam que a query sensível não roda sem autorização; cada status de solicitação
  autoriza; ADMIN/próprio autorizam; telefone nunca aparece.

## ORG-SEARCH-01 — busca pública de organizações

**Method/path**: `GET /api/busca/organizacoes?q=<term>` (novo)

**Auth**: público

**Backend sources**: `Organizacao.razaoSocialNormalizada`, `normalizarNomeMunicipio()` e schema Zod.

### Request

- `q`: string obrigatória; trim/normalização no servidor; mínimo de 2 caracteres após normalizar.
- Sem body. Parâmetros desconhecidos não alteram o predicado.

### 200 response

```json
{
  "results": [
    {
      "id": "org-cuid",
      "nome": "Proteção Animal",
      "municipio": "Volta Redonda",
      "uf": "RJ"
    }
  ]
}
```

Máximo 10, ordenados por razão social ascendente. A resposta não inclui imagem: a necessidade
aprovada para busca é somente id, nome e município/UF. A query nasce de `prisma.organizacao.findMany`,
combina `usuario.ativo: true` e `razaoSocialNormalizada contains termo`, e nunca consulta pessoas
físicas.

### Errors and tests

- 400 `VALIDATION_ERROR`: vazio, espaços ou menos de 2 caracteres normalizados; nenhuma query de
  tabela é executada.
- Testes CR-007: acento/caixa/espaços; limite 10; conta desativada ausente; shape exato; consulta e
  resposta incapazes de conter adotante/acolhedor ou dados privados.

## PROFILE-SELF-01 — ampliação da manutenção própria

**Method/path**: `PATCH /api/perfil` (ampliado)

**Auth**: conta ativa; organização/acolhedor editam somente o perfil derivado da sessão.

**Request**: contrato atual mais `descricao?: string | null`; organização também pode enviar
`razaoSocial`, cuja forma normalizada é calculada pelo servidor. Unknown fields continuam
rejeitados.

### Rules

- `descricao`: trim, máximo 500; `""`/somente espaços vira `null`.
- `fotoUrl` não é aceito neste PATCH; só Uploadthing pode persistir.
- Quando `razaoSocial` muda, `razaoSocialNormalizada` muda na mesma escrita.
- 200 mantém o envelope `{ profile }` atual e inclui `descricao`/`fotoUrl` para organização e
  acolhedor autenticados.

### Errors

Mantém 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403 `INACTIVE_ACCOUNT`/
`ROLE_NOT_SUPPORTED`, 409 `EMAIL_ALREADY_EXISTS`.

## PROFILE-IMAGE-01 — Uploadthing `profileImage`

**Transport**: `POST /api/uploadthing`, endpoint `profileImage` (ampliado no router existente)

**Auth**: organização ou acolhedor ativo

**Input**: objeto vazio estrito; nenhum `profileId`/`usuarioId` aceito.

**File**: exatamente uma imagem, máximo 4 MB.

Middleware deriva `{ userId, tipoPerfil, responsavelId }` da sessão. Completion revalida conta,
papel e perfil, atualiza somente o `fotoUrl` correspondente e retorna:

```json
{ "profileImage": { "fotoUrl": "https://..." } }
```

Erros do transporte: `Unauthorized`, `Forbidden`, `Bad Request`, tipo inválido ou tamanho acima de
4 MB. Testes falham se um ID de alvo for aceito ou se outra conta puder ser alterada.

## ANIMAL-RESPONSIBLE-01 — DTOs públicos ampliados

**Existing endpoints**:

- `GET /api/animais` (vitrine);
- `GET /api/animais/[id]` (detalhe; e resumos relacionados quando aplicável);
- `GET /api/favoritos` (adotante ativo);
- `GET /api/feels` (adotante ativo).

Cada resumo/cartão passa a incluir:

```json
{
  "responsavel": "Proteção Animal | Marina S. | null",
  "responsavelId": "profile-cuid",
  "responsavelTipo": "ORGANIZACAO | ACOLHEDOR"
}
```

As demais formas, filtros, autenticação e erros permanecem compatíveis. Os selects Prisma passam a
ler `organizacao.id` ou `acolhedor.id`; não leem `Usuario.id`. Para acolhedor, nunca serializam
`nomeCompleto` integral.

Testes de regressão cobrem os quatro fluxos e continuam varrendo CPF/CNPJ/e-mail/telefone/endereço,
coordenadas e IDs internos proibidos. `responsavelId` é uma exceção pública intencional apenas para
o ID opaco do perfil.
