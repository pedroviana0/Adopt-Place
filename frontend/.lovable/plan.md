
# AdoptPlace — Frontend (integração com backend final depois)

O backend real (Next.js + Prisma + NextAuth + Uploadthing) já tem plan/tasks próprios e está sendo revisado fora deste projeto. Aqui vamos construir **apenas o frontend completo** em TanStack Start + React 19 + Tailwind v4 + shadcn/ui, com uma camada de dados local desenhada para ser trocada por chamadas reais (fetch/Server Actions/tRPC — o que o backend final expuser) sem alterar componentes.

## Princípios

- **Contrato claro entre UI e dados**: toda leitura/escrita passa por funções em `src/lib/data/*` (assíncronas, tipadas). Componentes nunca tocam `localStorage` direto. Trocar mock → backend real = reescrever só esses arquivos.
- **Tipos fiéis ao schema Prisma da spec**: enums e entidades espelhadas em TS. Quando o backend final vier, os tipos ficam iguais (mesmos nomes, mesmos campos).
- **Regras de negócio duplicadas propositalmente**: validação Zod no cliente + regras em `lib/domain/rules.ts` para a UI se comportar corretamente já no mock (bloquear solicitação sem triagem, XOR responsável, recusa em cascata ao aprovar, etc.). No backend final essas mesmas regras rodam server-side como fonte de verdade.
- **Sem Lovable Cloud/Supabase nesta fase.** Nada de auth real, storage real ou RLS agora.

## Modelo de dados espelhado (TypeScript)

`src/lib/domain/`:
- Enums: `TipoPerfil`, `Porte`, `Sexo`, `StatusAnimal`, `StatusSolicitacao`, `TipoMoradia`, `TipoRegistroSaude`, `ResultadoTeste`.
- Tipos: `Usuario`, `Adotante` (triagem completa), `Organizacao`, `AcolhedorIndependente`, `Especie`, `Raca`, `Animal`, `AnimalRelacionado`, `FotoAnimal`, `VacinaCatalogo`, `DoencaCatalogo`, `RegistroSaude`, `Favorito`, `SolicitacaoAdocao`.
- `tags.ts` — cálculo derivado (Porte, Sexo, Castrado, Vacinado, Vermifugado, Testado).
- `rules.ts` — XOR responsável, triagem obrigatória, duplicidade de solicitação, cascata de recusa ao aprovar, bidirecionalidade e dedup de relacionados, validação de datas de saúde, isolamento por responsável.

Schemas Zod em `src/lib/schemas/` (adotante, triagem, animal, registroSaude com `dataProxima > dataRegistro` e `dataRegistro` não futura, solicitação, decisão).

## Camada de dados substituível

`src/lib/data/`: `animais.ts`, `saude.ts`, `solicitacoes.ts`, `favoritos.ts`, `usuarios.ts`, `catalogos.ts`, `sessao.ts`. Cada uma expõe `list/get/create/update/delete` async, persistindo em `localStorage` com seed (Cia Animal VR, SPA-VR, catálogos de vacinas/doenças da spec, ~15 animais em estados variados, adotantes de exemplo). Sessão simulada por seleção de perfil, guardada em `localStorage`.

Adaptador substituível na integração final: mesmas assinaturas passam a chamar o backend real.

## Rotas (TanStack Router, file-based em `src/routes/`)

Públicas:
- `index.tsx` — hero + métricas reais (do mock) + **vitrine integrada** (filtros: Espécie, Raça, Porte, Sexo, Cidade, Outros [Castrado, Vacinado, Vermifugado, Testado]; 12 por página; empty state).
- `vitrine.tsx` — vitrine em URL dedicada com filtros via search params.
- `animais.$animalId.tsx` — perfil público (galeria, atributos, tags, saúde pública, responsável só com nome público/cidade/tipo, relacionados, CTAs Solicitar/Favoritar que redirecionam ao login preservando `?next=`).
- `login.tsx`, `cadastro.tsx`, `cadastro.adotante.tsx`, `cadastro.organizacao.tsx`, `cadastro.acolhedor.tsx`.

Layout `_authenticated.tsx` (guarda de sessão mock + redirect com `?next=`):
- `_authenticated.triagem.tsx` (multi-step, salva parcial, marca `triagemConcluida`).
- `_authenticated.meu-perfil.tsx`, `_authenticated.minhas-solicitacoes.tsx`, `_authenticated.meus-favoritos.tsx`.
- `_authenticated.dashboard.tsx` (sidebar shadcn) + filhos:
  - `dashboard.index.tsx` (métricas do responsável).
  - `dashboard.animais.tsx`, `dashboard.animais.novo.tsx`, `dashboard.animais.$id.tsx` (editar, status, fotos ordenadas com principal obrigatória, saúde, relacionados, alertas 30 dias).
  - `dashboard.solicitacoes.tsx`, `dashboard.solicitacoes.$id.tsx` (ver triagem completa; aprovar → animal EM_PROCESSO_ADOCAO + demais EM_ANALISE do mesmo animal → RECUSADA; recusar mantém DISPONIVEL).
  - `dashboard.adotantes.tsx` (adoções CONCLUIDA + triagem readonly).
  - `dashboard.admin.usuarios.tsx` (só ADMIN — listar/ativar/desativar; conta desativada bloqueia com mensagem da spec).

Navbar por perfil (visitante / adotante / org-acolhedor / admin) em `components/app/Navbar.tsx`, no `__root.tsx`.

## Componentes (`src/components/app/`)

`AnimalCard`, `AnimalFilters`, `AnimalGallery`, `TagBadge`, `StatusBadge`, `HealthPanel` (público resumo + completo para responsáveis com resultado dos testes), `HealthRecordForm` (campos condicionais por tipo, autocomplete com catálogo + opção "Outra" marcando `ehVacinaCustomizada`/`ehDoencaCustomizada`), `RelatedAnimalsPicker` (bloqueia self-link e duplicatas), `AdopterScreeningForm` (multi-step + viewer readonly), `RequestActionsBar`, `AlertsList` (`dataProxima` ≤ 30 dias), `EmptyState`. shadcn/ui já instalado; adicionar via CLI o que faltar (sidebar, form, dialog, sonner/toast, tabs, command).

## Fotos no mock

Upload via `<input type="file">` → `URL.createObjectURL` + base64 no `localStorage` para persistência entre sessões. Uma foto marcada como `principal: true` obrigatoriamente; demais ordenáveis (drag ou botões up/down). Na integração final, esses blobs vão para o storage real (Uploadthing/Supabase Storage).

## Design system

Tokens semânticos em `src/styles.css` (nenhuma cor hardcoded). Paleta acolhedora (verde-oliva/terracota suave) coerente com o domínio; tipografia legível com serif discreta em títulos; sem gradiente roxo genérico. Modo claro apenas nesta fase.

## SEO

`head()` distinto por rota (title, description, og:title/description, twitter:card). `og:image` só em rotas-folha: no perfil do animal usa a foto principal. `__root.tsx` sem `og:image`.

## Mensagens fiéis à spec

"E-mail já cadastrado", "CPF já cadastrado", "Data de aplicação não pode ser futura", "Data próxima deve ser posterior ao registro", "Você já tem uma solicitação ativa para este animal", "Um animal não pode ser relacionado a si mesmo", "Conta desativada. Entre em contato com o administrador", "Nenhum animal encontrado com esses critérios".

## Verificação

Typecheck + build de produção ao final de cada fase, e um walkthrough (Playwright) do fluxo-chave: vitrine → perfil → Solicitar (redirect login) → cadastro → triagem → Solicitar → aprovar como org → animal muda status → concluir adoção → aparece em Adotantes.

## Fases (uma entrega contínua)

1. **Fundação** — tipos, enums, schemas Zod, seed, camada mock, sessão simulada, navbar por perfil, layout autenticado, tokens/design.
2. **P1 (US1/US2/US3)** — home + vitrine + perfil do animal + cadastro/login + triagem + solicitação + favoritos.
3. **P2 (US4/US5)** — dashboard + CRUD de animais + fotos + saúde + relacionados + alertas + análise/decisão de solicitações com isolamento.
4. **P3 (US6/US7)** — histórico de adoções + admin de usuários.
5. **Polimento** — empty states, mensagens, acessibilidade, responsividade, SEO.

## Ponto de integração futuro (documentado, mas não implementado agora)

Um `INTEGRATION.md` na raiz listando: (1) assinaturas de `src/lib/data/*` que o backend real precisa satisfazer, (2) formato esperado de `sessao.ts` (user, tipoPerfil, ids), (3) contratos das ações que hoje rodam client-side (aprovar/recusar em cascata, XOR, isolamento) para o time de backend implementar server-side como fonte de verdade.

## Perguntas em aberto (não bloqueiam início)

- Posso propor 3 direções visuais (prototype) antes de começar o P1, ou sigo com uma escolha minha alinhada ao tom acolhedor?
- Nome/logo — mantenho "AdoptPlace" com marca tipográfica simples até indicação contrária.
