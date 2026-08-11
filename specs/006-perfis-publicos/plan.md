# Implementation Plan: Perfis públicos e busca por nome

**Branch**: `006-perfis-publicos` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: requisitos aprovados em `spec.md`, medições de `HANDOFF.md`, entregas factuais das
features 004/005 e contratos/caminhos confirmados no código real.

## Summary

Entregar perfis endereçáveis de organização e acolhedor, catálogo paginado e filtrável, navegação
do anúncio ao responsável, manutenção da descrição/imagem, busca pública somente de organizações e
perfil de adotante cuja forma varia conforme autorização. O backend Next.js permanece autoridade:
aplica Zod, sessão, papel e vínculo antes de selecionar dados; o frontend TanStack consome DTOs
estreitos por `/api/*`. A busca usa `Organizacao.razaoSocialNormalizada`, gravada com a função já
existente `normalizarNomeMunicipio()`; não haverá SQL cru, nova dependência ou normalizador paralelo.

## Technical Context

**Language/Version**: TypeScript 5.x strict; Next.js 15 App Router no backend; React/TanStack
Start/Router + Vite no frontend.

**Primary Dependencies**: NextAuth v5, Prisma 5.x, PostgreSQL 16, Zod 3.x, Uploadthing 7.x,
React Query, React Hook Form, Tailwind CSS v4 e shadcn/ui já instalados.

**Storage**: PostgreSQL via Prisma. Uma migration adiciona `descricao`, `fotoUrl` e
`razaoSocialNormalizada` conforme `data-model.md`; nenhum acesso direto ao banco.

**Testing**: backend `npx tsc --noEmit`, `npm test`, `npm run prisma:validate`; frontend
`npm --prefix frontend exec tsc -- --noEmit` e `npm --prefix frontend run build`; Vitest para
FR-016, FR-013, FR-020 e regressões dos DTOs ampliados; homologação manual em 375/1024/1440 px e
zoom 200%.

**Target Platform**: navegadores modernos; backend e frontend publicados na mesma origem Vercel,
com Neon PostgreSQL e chamadas relativas `/api/*`.

**Project Type**: duas aplicações no mesmo repositório: backend/service Next.js na raiz e frontend
oficial TanStack em `frontend/`.

**Performance Goals**: busca e filtros executados no banco; busca limitada a 10 resultados; catálogo
paginado com 30 itens por página, reutilizando `SHOWCASE_PAGE_SIZE`; nenhuma leitura pública carrega
tabela inteira; nenhuma chamada externa de geocodificação em leitura.

**Constraints**: busca mínima de 2 caracteres, sem acento/caixa/espaços repetidos; descrição
opcional até 500 caracteres; upload de uma imagem de perfil, somente imagem e até 4 MB; DTOs sem
CPF/CNPJ/e-mail/telefone/coordenadas; endereço público apenas de organização; endereço e triagem do
adotante somente para próprio adotante, ADMIN ou responsável com solicitação histórica; sem `any`,
SQL cru, nova dependência, edição de `legacy/` ou decisão de autorização no navegador.

**Scale/Scope**: 3 modelos de perfil, 4 DTOs de animal ampliados, 5 contratos HTTP novos/ampliados,
6 histórias, 8 ondas, catálogo de 30 itens/página e busca de no máximo 10 organizações.

## Constitution Check

### Pré-pesquisa — PASS

- **Zero over-engineering**: consultas, schemas, handlers e adaptadores frontend são específicos dos
  FRs. Reutilizam `normalizarNomeMunicipio`, filtros da vitrine, contextos de sessão e Uploadthing.
- **Schema first**: todos os campos persistidos começam em `prisma/schema.prisma` e migration
  Prisma. O backfill fica na migration gerada/revisada; aplicação não usa SQL cru.
- **Server-side by default**: queries, autorização, normalização confiável e DTOs ficam na raiz.
  `frontend/` mantém somente formulário, filtros, paginação, loading e navegação.
- **Proactive security**: rotas protegidas chamam `getServerSession()` e revalidam conta/papel. A
  consulta do adotante determina autorização antes de selecionar triagem/endereço.
- **Two-layer validation**: Zod de servidor é a fronteira; schemas equivalentes no frontend dão
  feedback para descrição, busca e filtros.
- **Minimal client state**: React Query mantém dados remotos; estado local cobre filtros, página,
  seleção de arquivo e feedback. Mutações usam o cliente HTTP existente, conforme a arquitetura
  TanStack aprovada pela constituição.
- **No unnecessary dependencies**: Prisma, Zod, Uploadthing e componentes atuais cobrem tudo.
- **TypeScript strict**: ambos `tsconfig.json` mantêm `strict: true`; tipos são Prisma ou DTOs
  estreitos, sem `any` explícito.
- **Test-first critical paths**: FR-016, FR-013 e FR-020 recebem testes que ficam vermelhos quando
  vínculo, papel ou allowlist são removidos.

## Project Structure

### Documentation (this feature)

```text
specs/006-perfis-publicos/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- http-contracts.md
`-- tasks.md                 # gerado somente por /speckit-tasks
```

### Source Code (planned implementation surfaces)

```text
app/api/
|-- animais/{route.ts,[id]/route.ts}             # DTOs ampliados
|-- favoritos/route.ts                           # DTO ampliado
|-- feels/route.ts                               # DTO ampliado
|-- perfil/route.ts                              # manutenção do próprio perfil
|-- perfis/{organizacao,acolhedor,adotante}/[id]/route.ts
`-- busca/organizacoes/route.ts
lib/
|-- actions/auth-register.ts
|-- api/{adopter-context,responsible-context}.ts
|-- queries/{animal-showcase,public-animal,favorites,feels}.ts
|-- queries/public-profiles.ts                    # consultas estreitas da 006
|-- schemas/{perfil,public-profiles}.ts
|-- municipios.ts                                # único normalizador reutilizado
`-- upload-router.ts
prisma/
|-- schema.prisma
|-- migrations/<timestamp>_perfis_publicos/migration.sql
`-- seed.ts
scripts/
`-- verify-razao-social-normalizada.ts          # verificação read-only pós-migration
__tests__/
|-- api/public-profiles.test.ts
|-- api/adopter-profile-access.test.ts
|-- api/organization-search.test.ts
|-- api/public-animais.test.ts
`-- actions/profile-image-upload.test.ts
frontend/src/
|-- lib/data/{animais,favoritos,feels,perfis,busca-organizacoes}.ts
|-- lib/schemas/public-profiles.ts               # Zod cliente para filtros e busca
|-- components/app/{PublicAnimalCard,AnimalSwipeCard,ProfileCatalog}.tsx
`-- routes/{organizacoes.$organizacaoId,acolhedores.$acolhedorId,busca}.tsx
```

**Structure Decision**: manter o split homologado. As rotas HTTP e consultas confiáveis vivem na
raiz; o frontend adiciona somente consumidores e telas. `frontend/src/routeTree.gen.ts` é gerado e
só entra no diff quando as novas rotas forem criadas.

## Design and Execution Waves

### Onda 0 — fundação de dados e migration

- Adicionar campos e índice descritos em `data-model.md` numa única migration.
- Backfill de `razaoSocialNormalizada` na própria migration com expressão PostgreSQL explícita
  equivalente ao helper (decomposição de acentos coberta por `translate`, `lower`, compressão de
  espaços e `trim`), seguido de verificação read-only de todas as linhas contra
  `normalizarNomeMunicipio()`; sem função normalizadora nova em código, reset ou seed.
- Gravar o normalizado no cadastro e sempre que `razaoSocial` mudar no PATCH próprio, usando
  `normalizarNomeMunicipio()`.
- Validar descrição `null`/string aparada com máximo 500; testar normalização e escrita coerente.

### Onda 1 — perfil público de organização e catálogo

- Implementar contrato `PROFILE-ORG-01` com 404 idêntico para ausente/desativada.
- Selecionar somente identidade institucional permitida e catálogo `DISPONIVEL` da organização.
- Reutilizar espécie/raça/porte/sexo, ordenação e paginação de `animal-showcase`; raça só aparece
  nas opções quando houver dado no catálogo daquela organização.
- Criar rota frontend pública com `page-canvas`, estados loading/erro/vazio e filtros reversíveis.

### Onda 2 — navegação pelo responsável nos anúncios

- Ampliar vitrine, detalhe, favoritos e Feels com `responsavelId` e `responsavelTipo`.
- Não expor `usuarioId`, relações Prisma ou contatos. Para acolhedor, substituir nome completo pela
  identificação pública definida na spec.
- Atualizar tipos/links em `PublicAnimalCard`, detalhe e `AnimalSwipeCard`; relacionados seguem a
  mesma forma segura quando exibirem responsável.

### Onda 3 — manutenção do próprio perfil

- Ampliar `PATCH /api/perfil` com `descricao` e manter `razaoSocialNormalizada` sincronizada.
- Adicionar endpoint Uploadthing `profileImage`: uma imagem, 4 MB, sessão ativa, organização ou
  acolhedor, persistência apenas no próprio perfil e rechecagem no completion.
- Exibir edição e estados de fallback em `/dashboard/perfil`; remoção de descrição grava `null`.

### Onda 4 — triagem e endereço restritos

- Implementar `PROFILE-ADOPTER-01` com duas projeções: pública e restrita.
- Resolver sessão/papel/vínculo primeiro. Somente depois executar a seleção restrita contendo
  triagem e endereço; o caminho público nunca seleciona esses campos.
- O vínculo é qualquer `SolicitacaoAdocao` entre adotante e animal do responsável, sem filtro de
  status. ADMIN e próprio adotante têm autorização direta. Telefone nunca entra neste endpoint.
- Criar testes test-first para visitante, outro adotante, responsável sem vínculo, responsável com
  cada status histórico, próprio adotante e ADMIN, incluindo varredura recursiva de chaves.

### Onda 5 — busca por nome

- Implementar `ORG-SEARCH-01` sobre `razaoSocialNormalizada`, com termo normalizado pelo mesmo
  helper, mínimo 2, máximo 10, apenas `Usuario.ativo` + `TipoPerfil.ORGANIZACAO` por construção.
- Retornar somente id, razão social, município e UF; testar que remover o predicado de organização
  ou a allowlist faz o teste falhar.
- Criar `/busca` e entrada na navbar, com estado vazio e caminho para a vitrine; o resultado contém
  somente id, razão social e município/UF, sem imagem ou dado adicional não pedido.

### Onda 6 — perfil do acolhedor

- Implementar `PROFILE-FOSTER-01` com primeiro nome + inicial do último sobrenome, município/UF e
  catálogo disponível.
- O query select não inclui nome completo no DTO, endereço, CPF, telefone, e-mail ou coordenadas.
- Reutilizar catálogo/filtros/paginação da Onda 1 e criar rota pública responsiva.

### Onda 7 — seed com acentos e homologação completa

- Ajustar somente dados de teste autorizados: ao menos uma razão social acentuada e descrições;
  popular também `razaoSocialNormalizada` pelo helper.
- Executar portões completos e a matriz de `quickstart.md`; rodar seed antes de abrir sessões.
- Homologar US1, US2 e US5 em 375/1024/1440 px e 200%, além de busca acentuada, privacidade,
  teclado, foco, filtros, paginação, estados vazios e regressão das features 003–005.

## Constitution Check — Pós-design

**PASS.** O design mantém a arquitetura em duas aplicações; não adiciona dependência ou abstração
genérica; limita a migration aos campos exigidos; usa Prisma/Zod/NextAuth/Uploadthing existentes;
define allowlists por público; decide autorização antes da seleção sensível; mantém normalização
única; e transforma FR-016, FR-013 e FR-020 em testes negativos removíveis. Não há exceção a
registrar em Complexity Tracking.

## Quality Gates and Rollback

Cada onda termina com typecheck e testes do backend; ondas frontend também exigem typecheck/build.
Onda 0 exige `prisma validate` e revisão do SQL gerado antes de aplicar localmente. Rollback é por
commit da onda: código e migration ainda não aplicada podem ser revertidos juntos; migration já
aplicada nunca é editada e exige migration corretiva. Não rodar reset, seed ou migration contra
produção. Não executar build com servidor dev concorrente.

## Complexity Tracking

Nenhuma violação constitucional identificada.
