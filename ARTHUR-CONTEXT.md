> ⚠️ **HISTÓRICO / SUPERSEDIDO (2026-08-07).** A governança mudou para **dono único** e o
> contexto canônico agora é o [`CLAUDE.md`](./CLAUDE.md). Mantido apenas como registro do
> período em que o trabalho era dividido (Arthur=frontend / Pedro=backend).

# AdoptPlace — Contexto de Continuação (Arthur/Claude · Frontend · Feature 003)

> Documento de handoff para retomar o trabalho **da parte do Arthur (frontend)**
> em outro computador, no mesmo Claude Code, **do ponto em que paramos**.
> Feature: `003-backend-frontend-integration`. Repo: `github.com/pedroviana0/Adopt-Place`.
> _Última atualização: após o merge das Issues #40/#41 (gestão de animais)._

---

## 1. Papel e identidade

- **Sou Arthur/Claude** — executo **somente tarefas `Owner: Arthur` (frontend)**.
- Conta GitHub usada em todos os PRs: **`thurreis7`**.
- O outro membro é **Pedro/Codex** — dono do backend (`lib/`, `app/`, `prisma/`,
  `contracts/`), dos testes de backend, da matriz de integração e do `tasks.md`.

## 2. Setup no computador novo (passo CRÍTICO)

⚠️ **Não trabalhe na pasta baixada/descompactada do projeto.** No setup original,
a pasta baixada NÃO era um repositório git válido (git órfão, sem remote). Todo o
trabalho real acontece em um **clone limpo** do repositório:

```bash
git clone https://github.com/pedroviana0/Adopt-Place.git adopt-place-git
cd adopt-place-git
git checkout 003-backend-frontend-integration
cd frontend && npm install    # deps do frontend (o backend é do Pedro)
```

- **Branch de trabalho: `003-backend-frontend-integration`.** Todo commit do Arthur
  vai para essa branch; cada PR é aberto **`003-backend-frontend-integration → main`**.
- Autenticação: se o `git push` retornar **403 "Permission ... denied"**, a conta
  ativa do `gh` provavelmente trocou. Corrija com:
  ```bash
  gh auth switch --user thurreis7
  ```
  (há duas contas logadas na máquina original: `thurreis7` = Arthur, e `nexclin`
  = sem acesso ao repo.)

## 3. Governança (regras invioláveis)

1. **Só tarefas `Owner: Arthur`.** Se a Issue for `Owner: Pedro`, **pare e reporte**
   sem alterar nada. (Exceção pontual: #25/#26 foram feitas por Arthur sob
   **autorização explícita** do mantenedor no chat — registrado nos commits.)
2. **Portão de backend:** substituir mock/consumir contrato no frontend exige a
   linha do fluxo em **`backend ready`** na matriz (task de promoção do Pedro
   concluída) — e, para fluxos protegidos, **AUTH-01 `flow complete`**. Sem o
   status exigido: **pare e reporte** (consumir contrato inexistente = inventar
   endpoint = proibido).
3. **Nunca editar:** `specs/003-backend-frontend-integration/tasks.md`,
   a `integration-matrix.md` (status é do Pedro), backend (`lib/`, `app/`,
   `prisma/`, `contracts/`, `__tests__/`), `legacy/frontend-antigo/`, nem a
   `specs/001-.../tasks.md` (T104 permanece intocada).
4. **Sem presumir contrato:** ler os endpoints/schemas reais do backend antes de
   escrever. Divergência de campo/enum → **alinhar ao contrato** (o backend é a
   fonte da verdade), nunca resolver por suposição.
5. **Remoção de mock:** só do fluxo concluído pela própria Issue, nunca em massa.
6. **Sem banco:** o frontend não acessa Prisma/`DATABASE_URL`. Nunca rodar
   seed/reset/migration contra o banco original; testes de dados só em homologação.
7. **Sem merge automático. Sem PR sem revisão do outro membro.** Marcar tasks no
   `tasks.md` e promover status é sempre do **Pedro/Codex**.

## 4. Fluxo padrão por Issue (o que seguimos em toda Issue)

1. **Atualizar o local pela última versão do GitHub** (SEMPRE primeiro):
   ```bash
   git fetch --all --prune && git checkout 003-backend-frontend-integration \
     && git reset --hard origin/003-backend-frontend-integration
   ```
2. **Verificar o portão:** Issue é `Owner: Arthur`? Dependências (backend) estão
   `backend ready`/CLOSED? (checar `tasks.md` e `gh issue view`.) Se não → parar.
3. **Ler os contratos reais** (`app/api/.../route.ts` + `lib/schemas/...` +
   `lib/queries/...`) — DTOs, métodos, `.strict()`, erros/códigos.
4. **Mapear os consumidores do frontend** (às vezes com um subagente Explore).
5. **Implementar** (padrões na seção 7).
6. **Validar** (seção 9): `tsc --noEmit`, `build`, `eslint` dos arquivos alterados.
7. **Commit na branch 003 + push**; reverter `routeTree.gen.ts` se o build regenerar.
8. **Abrir PR `003 → main`** com corpo completo (resumo PT, `Closes #NN`, antes/
   depois, arquivos, testes, teste manual de homologação, impacto no banco,
   riscos). **Não mergear.**

## 5. Estado atual — CONCLUÍDO (tudo mergeado)

| Issue | Tarefa | Status |
|-------|--------|--------|
| #17 | Auditar mocks e rotas (T004/T005) | ✅ merged |
| #19 | Revisar lacunas frontend (T014) | ✅ merged |
| #22 | Consumir sessão real (T023/T027-T029) | ✅ merged |
| #24 | Corrigir 1ª rota / F1 (T031/T033) | ✅ merged |
| #25/#26 | Raiz service-only / vitrine backend (Pedro, feito sob autorização) | ✅ merged |
| #27 | Integrar vitrine pública (T040-T042) | ✅ merged |
| #30 | Cadastro, perfil, triagem (T050/T051) | ✅ merged |
| #33 | Jornada do adotante: favoritos/solicitações (T058/T059) | ✅ merged |
| #40/#41 | Gestão de animais: CRUD/fotos/relações/busca (T071/T072) | ✅ merged |

- **Sessão real:** `frontend/src/lib/data/sessao.ts` consome `GET /api/session`;
  login via NextAuth `POST /api/auth/callback/credentials` (+CSRF); logout via
  `POST /api/auth/signout`. Guard em `_authenticated.tsx` (loading em vez de branco).
- **Proxy dev:** `frontend/vite.config.ts` faz proxy `/api` → `http://localhost:3000`.
- **Upload de fotos (uploadthing):** eu havia **adiado**; o Pedro já implementou
  (ver `AnimalPhotosPanel.tsx` + `frontend/src/lib/data/animal-photo-upload.ts`).
  Não é mais lacuna.

## 6. Próximas frentes do Arthur (verificar o portão ao retomar!)

| Issue | O que é | Portão (task de `backend ready`) | Situação provável |
|-------|---------|----------------------------------|-------------------|
| **#45** | Solicitações do responsável | **T079 `[X]`** | provavelmente **liberada** |
| **#46** | Saúde básica | **T079 `[X]`** | provavelmente **liberada** |
| #54 | Auditar UI + tipos feature 002 | T095 `[ ]` (+ #53) | **bloqueada** |
| #55/#56/#57/#58 | Central de saúde / dashboard / documentos / chat | depende de #54 | bloqueadas |
| #61 | Administração | T110 `[ ]` (+ #60) | **bloqueada** |
| #63 | Remover infra final de mocks (db.ts/seed.ts) | todos os fluxos `flow complete` | fim de linha |
| #67 | Validar build do frontend | T118 (checklist homolog., Pedro) | fim de linha |

**Recomendação ao retomar:** rodar o fluxo da seção 4 para **#45** e/ou **#46**
(endpoints prováveis: `/api/solicitacoes/...` do lado responsável, `/api/saude/...`
ou `/api/animais/gerenciados/[id]/saude`). Confirmar os endpoints reais antes.

## 7. Padrões técnicos (aprendidos nesta feature)

- **react-query já está montado** (`__root.tsx` tem `QueryClientProvider`). Padrão:
  `useQuery({ queryKey, queryFn })` + estados `isLoading`/`isError`/vazio;
  mutações via handler async + `queryClient.invalidateQueries`.
- **Helper HTTP:** `frontend/src/lib/data/api.ts` exporta `apiRequest<T>(path, {method, json})`
  — usa `credentials: "include"` e desembrulha o envelope de erro
  `{ error: { code, message, fieldErrors } }`. Reusar em todo fetcher novo.
- **Schemas `.strict()`:** enviar **exatamente** os campos do contrato. Cuidados
  já encontrados: `senha`→`password` (cadastro); `optionalTextSchema` aceita string
  ("" → undefined) mas **não `null`**; typos de coluna no Prisma da triagem
  (`todosConordamAdocao`, `ciendeNaoRepassar`) — o frontend mantém a grafia certa
  e **mapeia no boundary** (em `usuarios.ts`).
- **Camada de dados:** fetchers reais convivem com funções mock no mesmo módulo;
  removo mock só do fluxo concluído. `AnimalCard.tsx` está **órfão** (não importado);
  a remoção final do mock (`db.ts`/`seed.ts`) é a Issue #63 (T114/T115).
- **`fotoUrl` de organização/acolhedor:** sem campo no Prisma e fora do contrato de
  perfil → **decisão de produto pendente**; o form de perfil **não envia foto**.
- **Não dá para validar round-trip ao vivo** aqui (exige 2 servidores + banco de
  homologação; proibido rodar contra o banco original). Validação executável =
  `tsc`/`build`/`eslint`; o round-trip vira **teste manual de homologação** no PR.

## 8. Comandos de validação (rodar em `frontend/`)

```bash
npx tsc --noEmit          # type-check REAL (o build do vite usa esbuild e NÃO checa tipos)
npm run build             # build (regenera routeTree.gen.ts — reverter depois)
npx eslint <arquivos>     # lint dos arquivos alterados (repo tem débito de CRLF/prettier alheio)
npx prettier --write <arquivos>   # formatar (padrão do repo)
```

## 9. Gotchas operacionais

- **`routeTree.gen.ts`** é regenerado pelo `npm run build`. Reverter antes do commit:
  `git checkout -- frontend/src/routeTree.gen.ts`.
- **CRLF:** o checkout usa `autocrlf`; normalizar LF antes de lint/commit:
  `sed -i 's/\r$//' <arquivos>`.
- **`npm run lint` do repo inteiro** falha por débito pré-existente (CRLF + prettier
  alheios ao PR) — por isso lintamos só os **arquivos alterados**.
- **Push 403** → `gh auth switch --user thurreis7` (ver seção 2).
- **Não commitar** `frontend/package-lock.json` gerado pelo `npm install` (fica como
  untracked; não adicionar).

## 10. Para o próximo Claude Code (resumo de 1 parágrafo)

Você é **Arthur/Claude**, frontend do AdoptPlace, feature `003`. Trabalhe no **clone**
`adopt-place-git`, branch `003-backend-frontend-integration`, conta `thurreis7`.
Faça **só issues `Owner: Arthur`** e só quando o backend do fluxo estiver
`backend ready`. Concluídas: #17,#19,#22,#24,#27,#30,#33,#40,#41 (e #25/#26 sob
autorização). **Próximo provável: #45 e #46** (portão T079 já `[X]`). Sempre:
atualizar local → checar portão → ler contrato real → implementar (react-query +
`api.ts`, schemas `.strict()`) → `tsc`/`build`/`eslint` → commit na 003 → PR
`003→main` → **não mergear**. Nunca tocar `tasks.md`, matriz, backend ou `legacy/`.
