# Handoff — Spec 006 (perfis públicos e busca por nome)

> **Para quem pega o serviço daqui.** Escrito em 2026-08-09, ao fim da sessão de levantamento
> da 006. A spec já estava aprovada; esta sessão **não escreveu código de produção** — ela
> mediu o terreno, achou três coisas que mudam o desenho e fechou o plano de execução.
> Branch de trabalho já criada: **`006-perfis-publicos`**, a partir de `c2394b2`.
>
> Leia nesta ordem: `CLAUDE.md` (raiz) → `specs/006-perfis-publicos/spec.md` → este arquivo.

---

## 1. Onde buscar cada informação

A regra que evita 90% dos erros nesta base: **o backend é a fonte da verdade dos contratos.**
Antes de consumir qualquer endpoint no frontend, abra o `route.ts` e o schema real. Nunca
inventar campo, endpoint ou enum.

| Preciso saber… | Onde está | Observação |
|---|---|---|
| Produto, governança, arquitetura, portão | `CLAUDE.md` (raiz) | Contexto canônico. Leia inteiro. Seções 2, 10 e 11 são as que mais custam se ignoradas |
| O que a 006 exige, e por quê | `specs/006-perfis-publicos/spec.md` | Aprovada pelo mantenedor. As justificativas de privacidade estão em "Clarifications" |
| O plano de execução | §6 deste arquivo | Ondas 0 a 7, em ordem de prioridade |
| Contrato real de um endpoint | `app/api/**/route.ts` | Um arquivo por rota |
| Consulta ao banco / DTO | `lib/queries/*.ts` | Uma função por caso de uso |
| Validação de entrada (Zod) | `lib/schemas/*.ts` | Fronteira obrigatória (CR-005) |
| Quem pode o quê | `lib/permissions.ts`, `lib/api/adopter-context.ts`, `lib/api/responsible-context.ts` | Autorização é **sempre** no servidor (CR-003) |
| Modelo de dados | `prisma/schema.prisma` | 23 models. Mudança entra por migration (CR-001) |
| Dados de teste | `prisma/seed.ts` | 7 contas + 36 animais + os 5.571 municípios |
| Testes de backend | `__tests__/` (Vitest, mocka o Prisma) | Roda sem banco |
| Rotas/páginas do frontend | `frontend/src/routes/` | File-based. `routeTree.gen.ts` é **gerado** |
| Camada que fala com a API | `frontend/src/lib/data/*.ts` | Tipos do lado do cliente |
| Componentes de produto | `frontend/src/components/app/` | `components/ui/` é shadcn |
| Cores, fontes, tokens | `frontend/src/styles.css` | Usar token semântico, nunca cor hardcoded |
| Deploy | `DEPLOY.md` | Alvo: tudo na Vercel, banco Neon |

### Precedentes para copiar em vez de inventar

Cada item da 006 já tem um análogo pronto nesta base. Use-os como molde:

| Para fazer… | Copie o padrão de |
|---|---|
| DTO estreito com autorização **antes** de selecionar campo sensível | `lib/queries/owner-request-detail.ts` — o `where` de posse vem antes de qualquer campo de triagem |
| Coluna normalizada para busca sem acento | `Municipio.nomeNormalizado` no schema + `normalizarNomeMunicipio()` em `lib/municipios.ts` |
| Paginação e filtros de catálogo | `lib/queries/animal-showcase.ts` (+ `SHOWCASE_PAGE_SIZE`) e `lib/schemas/showcase.ts` |
| Rota exclusiva de um papel | `requireActiveAdopter()` em `lib/api/adopter-context.ts`, usada por `app/api/feels/route.ts` |
| Upload autorizado com limite de tipo/tamanho | `authorizeAnimalPhotoUpload()` em `lib/upload-router.ts` (4 MB, só imagem) |
| Teste que prova que dado privado não vaza | `__tests__/api/public-animais.test.ts` e `__tests__/api/profile-screening.test.ts` |
| Tela que exibe triagem em leitura | `frontend/src/components/app/TriagemReadOnly.tsx` |

---

## 2. Como retomar em cinco minutos

Sem Docker: o banco é o **Neon**, na nuvem. Dois terminais na raiz do clone.
**PowerShell 5.1 — o separador é `;`, nunca `&&`.**

```
cd "…\adopt-place-git"; npm run dev                    # backend  :3000
cd "…\adopt-place-git"; npm --prefix frontend run dev  # frontend :8080
```

O `.env` local é git-ignored e já está configurado. Contas de teste, senha `AdoptPlace@2026`:

```
adotante.aprovado@example.com     adotante.pendente@example.com
organizacao.teste@example.com     organizacao.resende@example.com
acolhedor.teste@example.com       acolhedor.angra@example.com
admin.teste@example.com
```

---

## 3. Estado verificado nesta sessão (2026-08-09)

Não é "deve estar assim" — foi medido:

- `main` = `c2394b2`, idêntica a `origin/main`.
- Backend: `npx tsc --noEmit` limpo; `npm test` = **294 testes, 52 arquivos, todos passando**.
- Frontend: `npx tsc --noEmit` limpo; `npm run build` completo; `routeTree.gen.ts` **não** foi
  regenerado (nenhuma rota nova ainda).
- Sistema no ar e íntegro: 36 animais DISPONIVEL, 4 parceiros, todas as chamadas `/api` em 200,
  zero erro de console.
- GitHub: nenhuma issue aberta. PR **#119** aberto (artefato de revisão da rodada anterior).
  PR #116 está **fechado** — o `CLAUDE.md` dizia "aberto e obsoleto"; já não está.

---

## 4. Os três achados que mudam o desenho

### 4.1 `mode: "insensitive"` do Prisma **não** ignora acento — medido

FR-012 exige que a busca por nome ignore acentuação. Medido contra o Neon, na tabela real de
municípios, que tem coluna acentuada e coluna normalizada lado a lado:

| consulta | resultados |
|---|---|
| `nome contains "sao paulo"` (insensitive) | **0** |
| `nome contains "São Paulo"` (insensitive) | 4 |
| `nome contains "SÃO PAULO"` (insensitive) | 4 |
| `nomeNormalizado contains "sao paulo"` | **4** |
| `nome contains "assuncao"` (insensitive) | **0** |
| `nomeNormalizado contains "assuncao"` | **2** |

`insensitive` resolve caixa, e só caixa. Quem digitar "protecao" jamais acha "Proteção" — que é
justamente o tipo de nome que uma ONG tem.

**Consequência:** FR-012 exige uma **coluna normalizada em `Organizacao`**, escrita no cadastro e
no PATCH de perfil, com índice. Reaproveite `normalizarNomeMunicipio()` de `lib/municipios.ts`
— **não escreva uma segunda função de normalização.** Se as duas divergirem em um único detalhe,
a busca silenciosamente para de achar. Isso mantém CR-002 (sem SQL cru na busca) e NFR-002
(filtro e limite no banco, nunca em memória).

### 4.2 O nome do responsável é uma string sem identificador

`GET /api/animais`, `GET /api/animais/[id]` e `GET /api/favoritos` devolvem `responsavel` como
texto puro. `GET /api/feels` devolve `{ tipo, nome }`. **Nenhum deles devolve `id`.** Verificado
ao vivo — os campos do DTO público de animal são exatamente:

```
id, nome, porte, sexo, idadeEstimada, castrado, status,
fotoPrincipal, especie, raca, cidade, responsavel, tags
```

Ou seja: hoje o nome da organização aparece em todo cartão da vitrine **como texto morto**. A US2
("clicar no nome e chegar ao perfil") é impossível com o contrato atual.

**Pior: no Feels a promessa já está na tela e entrega outra coisa.** O commit `0b50462` diz "quem
cadastrou o animal aparece no cartão, com link para o perfil", e o `AnimalSwipeCard` de fato
renderiza um chip clicável com as iniciais e o nome do responsável — mas o `to` desse `Link` é
`/animais/$animalId`, a página do **animal**. Quem clica no nome da ONG volta para o animal de
onde saiu. A afordância existe, o destino é que está errado.

**Consequência:** acrescentar `responsavelId` + `responsavelTipo` a esses quatro DTOs. É ampliação
do contrato público, mas de dado não sensível: um cuid opaco e o papel. Sem isso a US2 não existe.
**O componente visual do Feels já está pronto** — a Onda 2 troca o destino do `Link`, não desenha
um controle novo.

### 4.3 Tensão interna da spec: telefone

SC-002 diz "0 respostas desta feature contêm CPF, CNPJ, **telefone**, e-mail ou coordenada". Mas
FR-016a manda entregar o pacote de análise ao responsável — e a tela de solicitação **já mostra o
telefone do adotante hoje** (`lib/queries/owner-request-detail.ts`, campo `telefone`).

**Decisão tomada, não reaberta:** seguir SC-002 ao pé da letra. O **novo** endpoint de perfil do
adotante **não devolve telefone**. Quem tem vínculo continua vendo o telefone onde ele sempre
esteve — no detalhe da solicitação. Se o mantenedor preferir o contrário, é uma linha no DTO.

---

## 5. Decisões da spec que **não** devem ser reabertas

Estão na spec com a justificativa completa. Repetidas aqui porque são o coração da feature:

1. **A triagem do adotante não é pública.** Vai apenas para: o próprio adotante, o responsável que
   tem **ou teve** solicitação daquele adotante, e a administração. Para quem não se enquadra, a
   triagem **não pode sair da API** — não basta esconder na tela (FR-017). O motivo: ela contém
   composição familiar, idade das crianças, horas que a casa fica vazia e segurança de muros e
   janelas. Publicada, descreve a vulnerabilidade de uma residência com menores.
2. **O endereço do adotante é exibido**, mas só a esse mesmo público restrito, como dado de análise
   da solicitação, identificado como tal. Nunca no perfil público.
3. **Endereço no perfil público só de ORGANIZAÇÃO.** Acolhedor e adotante mostram apenas o
   município. Acolhedor é pessoa física; o endereço dele é a casa dele.
4. **A busca por nome retorna somente organizações.** Adotantes e acolhedores não são pesquisáveis.

**CR-007 é obrigatório:** toda regra de FR-016, FR-013 e FR-020 precisa de teste Vitest que
**falhe se a proteção for removida**. Teste que passa com e sem a proteção não vale.

---

## 6. Plano de execução, em ondas

Cada onda é fechada: passa no portão, vira um ou dois commits pequenos, e só ao fim de tudo a
branch vira PR. Ordem por prioridade da spec (P1 antes de P2 antes de P3).

**Onda 0 — fundação de dados** *(uma migration só, para não fatiar o schema)*
`descricao` e `fotoUrl` em `Organizacao` e `AcolhedorIndependente`; `razaoSocialNormalizada` +
índice em `Organizacao`, com backfill na própria migration. Escrever a coluna normalizada no
cadastro e no PATCH de perfil. Testes de schema e de normalização.
*Isso reverte de propósito a decisão antiga de não ter `fotoUrl` no schema — o perfil público
precisa de imagem. Está registrado na spec, em "Impacto em dados".*

**Onda 1 — perfil público de organização + catálogo (US1, P1)**
`GET /api/perfis/organizacao/[id]` com DTO estreito (nome, município/UF, endereço, descrição,
imagem) e o catálogo com filtros de espécie/sexo/porte, raça **só quando houver raça registrada**,
e paginação. Rota `/organizacoes/$organizacaoId`. Conta desativada e conta inexistente devolvem o
**mesmo** 404 (FR-005). Testes: DTO sem CNPJ/telefone/e-mail/coordenada; desativada indistinguível.

**Onda 2 — chegar pelo anúncio (US2, P1)**
`responsavelId`/`responsavelTipo` nos quatro DTOs do achado 4.2; o nome vira link na página do
animal, no `PublicAnimalCard` e no `AnimalSwipeCard` do Feels.

**Onda 3 — manter o próprio perfil (US4, P1)**
`descricao` no PATCH de perfil; rota uploadthing `profileImage` com os mesmos limites da foto de
animal (4 MB, só imagem) e autorização de dono; UI em `/dashboard/perfil`. Teste que falha se uma
conta conseguir editar o perfil de outra.

**Onda 4 — triagem e endereço no público restrito (US5, P1)** — *o núcleo de CR-007*
`GET /api/perfis/adotante/[id]` com DTO que **muda de forma** conforme o vínculo: público (nome,
município, selo de triagem) versus análise (triagem completa + endereço), decidido no servidor.
O vínculo é a **existência** da solicitação, em qualquer status — análise, aprovada, recusada ou
concluída (FR-018). Admin entra na autorização, sem tela dedicada (perfil de administração é Out
of Scope). Aviso ao próprio adotante sobre quem mais pode ver (FR-019).
Testes: não autenticado, outro adotante, e organização **sem** solicitação daquele adotante —
nenhum recebe a triagem **na resposta**, não apenas na tela.

**Onda 5 — busca por nome (US3, P2)**
`GET /api/busca/organizacoes` sobre a coluna normalizada, com mínimo de caracteres e limite
aplicados no banco; rota `/busca` e campo na navbar. Testes: acento e caixa; só organizações;
termo de um caractere ou só espaços não varre a base.

**Onda 6 — perfil do acolhedor (US6, P3)**
`GET /api/perfis/acolhedor/[id]`: identificação curta (proposta: primeiro nome + inicial, ex.
"Marina S."), município e catálogo. Teste que varre a resposta inteira procurando endereço, CPF,
telefone, e-mail e coordenada.

**Onda 7 — dados de teste e homologação na tela**
O seed hoje só tem nomes **sem acento** — "Organizacao de Teste AdoptPlace", "Abrigo Serra da
Bocaina", "Acolhedora da Ilha". Com esses dados, FR-012 nunca é exercitado de verdade: a busca
passaria mesmo quebrada. Dar nome acentuado e descrição a pelo menos uma organização. Depois,
navegador de verdade: 375, 1024 e 1440 px e 200% de zoom, nos caminhos de US1, US2 e US5.
*Rodar o seed **antes** de abrir o navegador — ele desloga a sessão.*

---

## 7. Fluxo de trabalho e portão

**Fluxo (mudou em 2026-08-09):** todo trabalho nasce em branch própria, nunca direto na `main`, e
entra por PR. Uma branch por feature, não por commit; dentro dela, commits pequenos. Não há
revisor externo — o PR existe como ponto de parada e registro.

**Portão obrigatório, antes de cada commit:**

```
# backend
npx tsc --noEmit
npm test

# frontend
cd frontend; npx tsc --noEmit; npm run build
```

- `routeTree.gen.ts`: se o build regenerar e você **não** adicionou rota, reverta
  (`git checkout -- frontend/src/routeTree.gen.ts`). Se **adicionou** rota — e as ondas 1, 5 e 6
  adicionam — **commite o arquivo**.
- ESLint acusa `Delete ␍` em quase todo arquivo por causa do `autocrlf` no Windows. É artefato do
  working tree, não erro real. Não "consertar" isso em massa.
- Commits em português, explicando o **porquê**, com trailer `Co-Authored-By: Claude`.

---

## 8. Armadilhas que já custaram tempo

1. **A API de CEP não é fonte de coordenada.** Medido em 2026-08-08: quatro CEPs de zonas opostas
   de São Paulo devolvem a coordenada **idêntica**. As APIs gratuitas não geocodificam endereço; o
   `location` da BrasilAPI é o centroide do município. Por isso a coordenada de todo mundo vem de
   `Municipio`, offline, e o provedor de CEP serve só para validar o CEP e devolver o código IBGE.
   **Leia a seção 11 do `CLAUDE.md` inteira antes de encostar nisso.**
2. **`lib/actions/*.ts` versus `app/api/**/route.ts` duplicam regra.** Ex.: `POST /api/solicitacoes`
   reimplementa `createAdoptionRequest` em vez de chamá-la. Ao adicionar efeito colateral,
   instrumente a **rota HTTP** — mexer só na action pode não ter efeito nenhum.
3. **`npm run prisma:seed` recria as contas e desloga o navegador.** Tela em "Carregando…" logo
   depois de um seed é isso, não defeito.
4. **Não rode `npm run build` no frontend com o `vite dev` de pé** — o build recria `.output`
   embaixo do watcher e derruba o dev server.
5. **Servidor de dev órfão de sessão anterior** *(novo, visto em 2026-08-09)*. Se `:3000` ou `:8080`
   já estiverem ocupados, o Next e o Vite **não falham** — sobem deslocados para `:3002` e `:8081`
   e avisam só numa linha do log. Com dois `next dev` escrevendo no mesmo `.next`, o manifesto
   corrompe e a API passa a devolver **HTTP 500** com `SyntaxError: Unexpected end of JSON input`
   em `loadManifest`. Parece defeito de código e não é. Diagnóstico e cura:

   ```powershell
   Get-NetTCPConnection -State Listen -LocalPort 3000,8080 | Select-Object LocalPort, OwningProcess
   Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
     Where-Object { $_.CommandLine -like "*adopt-place-git*" } |
     ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
   Remove-Item -Recurse -Force .next
   ```

   Depois suba o backend, **espere ele responder**, e só então suba o frontend.

---

## 9. O que esta sessão deliberadamente não fez

- Não escreveu código de produção. A branch `006-perfis-publicos` carrega este handoff e a
  atualização do `CLAUDE.md`, nada mais.
- Não rodou o seed (evitando deslogar a sessão do mantenedor, que estava analisando o sistema).
- Não abriu PR — a branch é o ponto de partida da execução, não o fim dela.
- Não mexeu no PR #119, que segue aberto.
