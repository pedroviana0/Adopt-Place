# Inventário de entradas — Spec 007

Levantamento factual do frontend oficial em 2026-08-14. O inventário inclui React Hook Form,
estado manual, filtros, uploads, diálogos e parâmetros de busca. `legacy/` foi excluído por regra.

## Jornadas e contratos

| Área / entrada | Frontend | Validação cliente | Backend / schema autoritativo |
|---|---|---|---|
| Login | `routes/login.tsx` | `lib/schemas/cadastro.ts` | autenticação credentials; `lib/schemas/adotante.ts::loginSchema` no caminho legado |
| Cadastro de adotante | `routes/cadastro.adotante.tsx`, `CampoLocalizacao.tsx` | `cadastroAdotanteSchema` | `POST /api/cadastro/adotante`; `adopterRegistrationSchema` |
| Cadastro de organização | `routes/cadastro.organizacao.tsx`, `CampoLocalizacao.tsx` | `cadastroOrganizacaoSchema` | `POST /api/cadastro/organizacao`; `organizationRegistrationSchema` |
| Cadastro de acolhedor | `routes/cadastro.acolhedor.tsx`, `CampoLocalizacao.tsx` | `cadastroAcolhedorSchema` | `POST /api/cadastro/acolhedor`; `fosterRegistrationSchema` |
| Triagem | `routes/_authenticated.triagem.tsx` | `triagemSchema` | `PUT /api/triagem`; `adopterScreeningSchema`; fronteira mapeia os typos persistidos |
| Edição de perfil e imagem | `routes/_authenticated.dashboard.perfil.tsx` | schemas locais da rota + `validateProfileImage` | `PATCH /api/perfil`; schemas `*ProfileUpdateSchema`; Uploadthing `profileImage` |
| Cadastro/edição de animal | `components/app/AnimalForm.tsx` | `animalSchema`, `animal-taxonomy` | `POST/PATCH /api/animais/gerenciados`; `animalInputSchema` |
| Fotos do animal | `AnimalPhotoInput.tsx`, `AnimalPhotosPanel.tsx` | `validateAnimalPhoto`, quantidade e tamanho | Uploadthing `animalPhoto`; rotas de foto; `foto-animal.ts` |
| Relacionamentos | `RelatedAnimalsPanel.tsx` | busca local e seleção | rotas `/relacionamentos`; `relatedAnimalRequestSchema` |
| Solicitação de adoção | detalhe público do animal | ID derivado do animal exibido | `POST /api/solicitacoes`; `adoptionRequestSchema` + sessão |
| Decisão de solicitação | `routes/_authenticated.dashboard.solicitacoes.$solicitacaoId.tsx` | decisão fechada e observação até 1.000 | `PATCH /api/solicitacoes/gerenciadas/[id]`; `requestDecisionSchema` |
| Mensagens | `messages/ConversationDetailPage.tsx` | trim visual, contador 2.000 | `POST /api/conversas/[id]/mensagens`; `mensagemSchema` |
| Filtro de conversas | `ConversationListPage.tsx` | enum fechado | query de conversas; `conversationFilterSchema` em `dashboard-filters.ts` |
| Registros de saúde | `HealthPanel.tsx` | estado manual + datas/enum | rotas `/animais/gerenciados/[id]/saude`; `registroSaudeHttpSchema` |
| Agenda e cuidados | `routes/_authenticated.dashboard.saude.index.tsx` | estado manual | `/api/saude/cuidados*`; `cuidado-planejado.ts` |
| Documentos | `routes/_authenticated.dashboard.documentos.index.tsx` | arquivo/tipo/animal | `/api/saude/documentos*`; `documento-saude.ts` + Uploadthing |
| Administração | dashboard de usuários | booleano e ID da linha | `PATCH /api/admin/usuarios/[id]`; `setUserActiveSchema` + papel ADMIN |
| Vitrine | `AnimalFilters.tsx` | estado transitório | `GET /api/animais`; `showcaseFilterSchema`; opções em `GET /api/catalogos` |
| Catálogos públicos | `ProfileCatalog.tsx` | `profileCatalogFilterSchema` | perfis públicos; `publicProfileCatalogFilterSchema` |
| Busca de organizações | `routes/busca.tsx` | `organizationSearchTermSchema` | `GET /api/busca/organizacoes`; `organizationSearchSchema` |
| Busca de animal relacionado | `RelatedAnimalsPanel.tsx` | texto local | lista de animais gerenciados; filtro `search` em `ownedAnimalFilterSchema` |
| Feels | filtros da rota + `lib/data/feels.ts` | enums/raio | `GET /api/feels`; `feelsFilterSchema` |

## Regras consolidadas nesta spec

| Campo / família | Regra alinhada |
|---|---|
| E-mail | trim, caixa baixa, formato e máximo 254 |
| Senha nova | 8–128; login preserva compatibilidade e limita 128 |
| Nome de pessoa | trim, 3–120, letras reais com acentos/hífen/apóstrofo, sem números |
| Razão social | trim, conteúdo obrigatório, 3–160; sem regra artificial de nome pessoal |
| CPF | aceita máscara, normaliza 11 dígitos, valida verificadores e repetição |
| CNPJ | aceita máscara, normaliza 14 dígitos, valida verificadores e repetição |
| Telefone | normaliza dígitos, DDD e 10/11 dígitos brasileiros plausíveis |
| CEP | máscara visual, 8 dígitos e resolução de município preservada |
| Endereço | trim, conteúdo significativo, 3–200 |
| Instagram | opcional, trim, máximo 120 |
| Capacidades | inteiro finito, 0–10.000 |
| Triagem | textos obrigatórios até 500; tipo desejado até 120; adultos 1–30; cinco detalhes condicionais |
| Animal | nome/cor 80, idade 50, descrição 2.000; taxonomia e enums fechados |
| Mensagem | trim, 1–2.000, contador existente |
| Observação de decisão | máximo 1.000 e contador |
| IDs | CUID nas fronteiras que usam IDs de domínio |
| Payloads mutáveis | objetos estritos nos contratos críticos; papel e dono derivados da sessão |
| Raças da vitrine | consulta única no banco, somente animais `DISPONIVEL`, espécie dependente e ordem alfabética |
| Raças de perfil | escopo do responsável + `DISPONIVEL`, sem compartilhar universo com a vitrine |

## Inconsistências encontradas

- Cliente aceitava senha com 6 caracteres e servidor exigia 8.
- CPF/CNPJ eram validados apenas por comprimento/regex e aceitavam dígitos inválidos ou repetidos.
- Telefone aceitava qualquer texto com 8 caracteres.
- `tipoAnimalDesejado` deixava escapar a mensagem padrão do Zod.
- Os detalhes condicionais da triagem existiam no contrato, mas não eram renderizados pela tela.
- `todosConcordamAdocao` e `cienteNaoRepassar` têm grafias persistidas históricas; a correção fica
  exclusivamente no adaptador de fronteira (`todosConordamAdocao` / `ciendeNaoRepassar`).
- A vitrine obtinha todas as raças canônicas, mesmo sem animal disponível; perfis públicos já
  tinham a consulta correta por escopo.
- Conflitos de unicidade de cadastro não traziam `fieldErrors` para e-mail/CPF/CNPJ.

## Escopo de homologação manual ainda necessário

As superfícies acima devem ser percorridas em 375, 1024 e 1440 px e zoom 200%, claro/escuro,
teclado, foco, colagem de valores enormes, rede lenta e falha do servidor. Esta matriz depende de
servidores locais ou Preview sem processos concorrentes e será registrada separadamente.
