# Research: Perfis públicos e busca por nome

**Feature**: 006-perfis-publicos | **Date**: 2026-08-10

Este documento consolida pesquisa já medida no `HANDOFF.md` e a valida contra o código atual. Não
substitui a spec nem prescreve detalhes de UI além do necessário para fechar o design.

## R1 — Busca sem acento no PostgreSQL via Prisma

**Decision**: persistir `Organizacao.razaoSocialNormalizada`, indexá-la e consultar `contains` sobre
essa coluna. Tanto escrita quanto termo de busca usam exclusivamente
`normalizarNomeMunicipio()` de `lib/municipios.ts`.

**Rationale**: medição no Neon provou que `mode: "insensitive"` ignora caixa, mas não diacríticos:
`nome contains "sao paulo"` retornou 0 enquanto a coluna normalizada retornou 4. A função existente
já remove diacríticos, reduz caixa, comprime espaços e aplica `trim`, cumprindo FR-012 sem SQL cru e
sem filtrar a tabela em memória.

**Alternatives considered**:

- `mode: "insensitive"`: rejeitado pela medição.
- extensão `unaccent`/SQL cru: rejeitada por CR-002 e portabilidade.
- normalizar em memória depois de carregar organizações: rejeitada por NFR-002.
- criar `normalizarRazaoSocial()`: rejeitada porque dois algoritmos poderiam divergir.

## R2 — Sincronização e backfill do nome normalizado

**Decision**: tornar a coluna obrigatória depois do backfill na migration Prisma. O SQL da migration
usa uma expressão PostgreSQL explícita equivalente ao helper (`translate` para os diacríticos
suportados, `lower`, compressão de whitespace e `btrim`) e uma verificação read-only posterior
compara todas as linhas ao resultado real de `normalizarNomeMunicipio()`. Depois disso, cadastro e
PATCH usam somente o helper TypeScript.

**Rationale**: `lib/actions/auth-register.ts` e `app/api/perfil/route.ts` são os dois caminhos reais
de escrita da razão social. Sincronização na mesma operação evita resultados obsoletos.

**Alternatives considered**:

- preencher apenas no seed: rejeitado para contas reais.
- calcular apenas na consulta: rejeitado por desempenho e pela limitação de acento.
- campo nullable permanente: rejeitado porque criaria organizações invisíveis na busca.
- criar outra função normalizadora de aplicação: rejeitado; a expressão existe apenas no artefato
  histórico de migration e sua equivalência é verificada contra o único helper compartilhado.

## R3 — Identidade navegável do responsável nos DTOs de animal

**Decision**: ampliar vitrine, detalhe, favoritos e Feels com `responsavelId` e
`responsavelTipo: "ORGANIZACAO" | "ACOLHEDOR"`, mantendo o nome/identificação pública existente.

**Rationale**: o código real seleciona somente nomes (`animal-showcase.ts`, `public-animal.ts`,
`favorites.ts`, `feels.ts`). Sem o CUID do perfil e o discriminador, o frontend não consegue montar
uma URL estável. O ID do perfil é opaco e não revela contato ou credencial.

**Alternatives considered**:

- localizar perfil pelo nome: rejeitado por colisão, renomeação e privacidade.
- usar `Usuario.id`: rejeitado porque a URL representa o perfil de domínio e exporia uma identidade
  interna desnecessária.
- criar slug agora: rejeitado por não ser requisito e adicionar unicidade/migração extra.

## R4 — Catálogo por perfil

**Decision**: extrair/reutilizar o padrão de `animal-showcase.ts` para adicionar predicado obrigatório
do responsável, status `DISPONIVEL`, filtros espécie/raça/porte/sexo e paginação de 30 itens.

**Rationale**: o showcase atual já executa filtro, count, ordenação e paginação no banco. Trinta
itens fecham as grades existentes de 1/2/3/5 colunas e evitam carregar tudo. O filtro de raça só é
oferecido quando a consulta de opções encontra raça usada naquele catálogo.

**Alternatives considered**:

- carregar animais e filtrar no navegador: rejeitado por FR-011/NFR-002.
- novo mecanismo de cursor: rejeitado por não haver necessidade atual e por divergir do produto.
- duplicar integralmente a vitrine: rejeitado por risco de drift nos DTOs e filtros.

## R5 — Projeções pública e restrita do adotante

**Decision**: autenticar/revalidar o chamador e determinar se há autorização antes de escolher a
query. O caminho público seleciona somente nome, município/UF e `triagemConcluida`; o restrito
seleciona endereço e allowlist completa de triagem. Telefone não é selecionado em nenhuma projeção
deste endpoint.

**Rationale**: ocultar dados depois de carregar ou serializar viola FR-017/CR-003. O precedente
`owner-request-detail.ts` combina posse no `where` antes da seleção. A forma restrita autoriza o
próprio adotante, ADMIN ou responsável cujo animal tenha qualquer `SolicitacaoAdocao` daquele
adotante, sem filtro de status.

**Alternatives considered**:

- DTO amplo filtrado na rota/tela: rejeitado por risco de vazamento.
- confiar em `tipoPerfil` ou IDs enviados pelo navegador: rejeitado pela constituição.
- reutilizar o detalhe de solicitação: rejeitado porque exige `solicitacaoId`, contém telefone e
  representa outra jornada.

## R6 — Perfil público e conta desativada

**Decision**: queries públicas combinam ID do perfil e `usuario.ativo: true`; ausência e conta
desativada retornam o mesmo 404 `PROFILE_NOT_FOUND`.

**Rationale**: cumpre FR-005 sem revelar existência ou estado da conta e impede que dados de uma
conta recém-desativada continuem públicos.

**Alternatives considered**:

- 403 para desativada: rejeitado porque distingue o recurso.
- confiar na sessão/cache: rejeitado porque os perfis são públicos e o estado pode mudar.

## R7 — Imagem de perfil

**Decision**: adicionar endpoint `profileImage` ao `uploadRouter`: uma imagem, 4 MB, somente
organização/acolhedor ativos, sem ID de alvo vindo do cliente; persistir `fotoUrl` no perfil derivado
da sessão e revalidar autorização no completion.

**Rationale**: replica limites homologados de foto animal e elimina edição cruzada. Uploadthing já
está configurado em `/api/uploadthing`; nenhuma dependência nova é necessária.

**Alternatives considered**:

- aceitar `profileId` do navegador: rejeitado por ownership spoofing.
- URL digitada manualmente: rejeitada por FR-022.
- novo provedor de mídia: rejeitado por dependência e operação desnecessárias.

## R8 — Testes de privacidade que detectam regressão

**Decision**: escrever testes test-first que verificam não apenas status, mas também predicados
Prisma/ordem da consulta, forma exata do DTO e varredura recursiva por chaves proibidas.

**Rationale**: CR-007 exige que os testes falhem quando a proteção é removida. O padrão de
`public-animais.test.ts` já coleta chaves recursivamente. Para FR-016, os mocks devem provar que a
query sensível nem é chamada sem autorização; para FR-013, a consulta deve carregar predicado de
organização ativa; para FR-020, qualquer campo proibido inserido na resposta quebra o teste.

**Alternatives considered**:

- snapshot amplo: rejeitado por ruído e baixa intenção.
- teste apenas de 200/403: rejeitado porque dados podem vazar com status correto.
- teste somente de UI: rejeitado porque a proteção precisa existir na API.

## R9 — Arquitetura e validação do frontend

**Decision**: manter chamadas relativas `/api/*` em `frontend/src/lib/data`, React Query para dados
remotos e React Hook Form/Zod para edição. Usar `page-canvas`, tokens semânticos e padrões existentes
de loading/vazio/erro.

**Rationale**: é a arquitetura entregue pelas specs 003/004; a 005 determina que município vem de
`Municipio` e que leitura não chama provedor de CEP. Acessibilidade em 375/1024/1440 e 200% continua
dívida explícita e entra na homologação desta feature.

**Alternatives considered**:

- mover regras ao frontend: rejeitado pela constituição.
- editar `legacy/`: rejeitado por governança.
- introduzir nova biblioteca de estado/design: rejeitado por ausência de necessidade.

## R10 — Falhas, concorrência e consistência

**Decision**: validação rejeita entradas inválidas antes de escrever; renomeação atualiza razão e
normalizado atomicamente; upload revalida conta/papel no início e na conclusão; catálogo e busca
aceitam consistência de leitura normal e refletem mudanças no próximo reload.

**Rationale**: não há transição de estado nova. O risco concreto é coluna derivada obsoleta ou
upload terminar após desativação/mudança de papel; ambos são evitados na mesma fronteira confiável.

**Alternatives considered**:

- lock distribuído ou versionamento otimista: rejeitado por complexidade sem requisito concorrente.
- cache público novo: rejeitado porque invalidação de conta/animal complicaria FR-005/FR-008.
