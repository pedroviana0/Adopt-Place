# AdoptPlace — Harness do Projeto (contexto canônico p/ IA)

> **Este é o arquivo-fonte de contexto do projeto.** Leia-o inteiro antes de qualquer tarefa.
> Ele define o produto, a arquitetura, as fronteiras de escopo e os guardrails que a IA
> deve respeitar. Substitui o modelo de governança antigo (`ARTHUR-CONTEXT.md`, histórico).
> _Atualizado: 2026-08-09._

---

## 1. O produto

**AdoptPlace** conecta animais resgatados a famílias que querem adotar, na região de
**Volta Redonda/RJ**. Três públicos: **adotantes**, **ONGs/organizações** e **acolhedores
independentes**. Funções já prontas: vitrine pública de animais, cadastro/triagem do adotante,
favoritos, solicitações de adoção, gestão de animais (CRUD + fotos), central de saúde,
documentos, dashboard e chat. É um **TCC (IFRJ Pinheiral, 2026)** — apresentação em ~dez/2026.

**Meta de produto:** sistema **funcionando e no ar** (deploy real), não só rodando local.

---

## 2. Papel, dono e governança

- **Dono único: o mantenedor** (conta GitHub `thurreis7`). O antigo split "Arthur=frontend /
  Pedro=backend" **acabou** — o Pedro saiu (sem acesso ao Codex, viajando). A IA agora atua em
  **frontend e backend**, sempre sob direção do mantenedor no chat.
- **Fluxo de merge: commit direto na `main`** (sem PR obrigatório) — decisão do mantenedor para
  agilidade, já que é dev solo. **Em troca, o portão automático da seção 5 é obrigatório** e faz
  o papel da revisão perdida: nada vai pra `main` sem `tsc` + `build` limpos.
- **Ações "pra fora" (deploy, publicar, mexer em conta/segredo) exigem confirmação** do mantenedor
  no chat. A IA **não cria contas nem digita credenciais/segredos** — prepara tudo e o mantenedor
  executa essa parte.
- **Autoria:** commits como `thurreis7`, com trailer `Co-Authored-By: Claude`.

---

## 3. Arquitetura (mantida — sem refactor durante o TCC)

Dois apps no mesmo repositório, com fronteira clara:

| Camada | Onde | Stack |
|---|---|---|
| **Backend** | `app/api/**`, `lib/` (queries/schemas Zod), `prisma/` | Next.js App Router, NextAuth, uploadthing, Prisma/PostgreSQL |
| **Frontend** | `frontend/` (app próprio, `package.json` próprio) | Vite + TanStack Start (SSR via nitro, alvo **Cloudflare**), Tailwind v4, shadcn |

- **Contrato entre eles:** o frontend chama `/api/*`; em dev, `frontend/vite.config.ts` faz
  **proxy** de `/api` → `http://localhost:3000` (backend), pra cookie de auth ficar first-party.
- **O backend é a fonte da verdade dos contratos.** Antes de consumir um endpoint no frontend,
  leia o `route.ts` + schema/queries reais em `lib/`. Nunca inventar endpoint/campo/enum.
- **`legacy/`** = frontend antigo. **Não usar, não editar.**
- **Decisão registrada:** manter o split e **manter o Prisma** (é só o ORM; não é o que gera
  custo). Convergir num app só é refactor "pós-TCC", fora de escopo agora.

---

## 4. Mapa de pastas (e o que NÃO tocar)

```
app/                 Backend Next.js (rotas de API, páginas legadas do backend)
  api/**             Endpoints — fonte da verdade dos contratos
lib/                 Queries, schemas (Zod), auth, integrações            [backend]
prisma/              schema.prisma (23 models), migrations, data/municipios.csv [backend]
__tests__/           Testes de backend (Vitest, mockam o Prisma)          [backend]
frontend/            App de UI (Vite + TanStack Start)
  src/routes/        Rotas/páginas (file-based). routeTree.gen.ts é GERADO
  src/components/ui/ Componentes shadcn (button, input, glass-card, …)
  src/components/app/ Componentes de produto (Navbar, cards, mensagens…)
  src/lib/data/      Camada que fala com /api (sessao, animais, favoritos…)
  src/styles.css     Tokens de tema (Teal & Amber) + @font-face
  public/fonts/      Fontes self-hospedadas (Inter, Poppins)
specs/               Spec-kit (spec→plan→tasks) das features 001–006
CLAUDE.md            ESTE arquivo (harness canônico)
```

**Nunca editar sem pedido explícito:** `legacy/`, `frontend/src/routeTree.gen.ts` (gerado),
arquivos `.env` / segredos, migrations já aplicadas.

---

## 5. Portão de qualidade (OBRIGATÓRIO antes de todo commit)

Como não há PR/revisão, isto é a rede de segurança. Rodar em `frontend/` para mudanças de UI:

```bash
cd frontend
npx tsc --noEmit          # type-check — precisa passar
npm run build             # build — precisa passar
```

- **`routeTree.gen.ts`:** se o build regenerar **e você NÃO adicionou rota nova**, **reverter**
  (`git checkout -- frontend/src/routeTree.gen.ts`). Se **adicionou** rota, **commitar** o arquivo.
- **ESLint/CRLF:** o `eslint` local acusa `Delete ␍` em quase todo arquivo por causa do
  `core.autocrlf=true` (Windows). É artefato do working tree — o conteúdo versionado é LF/limpo.
  Não "consertar" isso em massa; focar só em erros reais de código.
- Backend: testes com `npm test` (Vitest mocka o Prisma, roda sem banco).

---

## 6. Dados & Prisma

- PostgreSQL via Prisma (`DATABASE_URL`). Provider-agnóstico: funciona com qualquer Postgres.
- **Host recomendado (custo zero):** **Neon** — grátis e **acorda sozinho** ao conectar (evita o
  problema do Supabase free, que **pausa após ~7 dias** parado e exige despausar no painel).
- Migrar host = trocar `DATABASE_URL` (sem mexer em código).
- **Nunca** rodar seed/reset/migration destrutivo contra o banco de produção. Dados de teste só
  em ambiente de homologação/local.

---

## 7. Deploy (requisito: sistema no ar, custo zero)

Stack alvo, tudo em plano grátis:

**Decisão (2026-08-07): tudo na Vercel** (backend + frontend na mesma plataforma/origem).

| Peça | Serviço grátis | Observação |
|---|---|---|
| Banco | **Neon** (provisionado, sa-east-1) | Postgres, auto-resume; mesma URL serve local e prod |
| Backend (Next) | **Vercel** (Hobby) | roda API + NextAuth + Prisma |
| Frontend (Vite/TanStack) | **Vercel** (preset nitro `vercel`) | rewrite `/api/*` → backend, mesma origem |

- **Mesma origem resolve o auth:** front e back em origens diferentes quebram o cookie
  first-party (em dev é o proxy do Vite). Em produção, o rewrite `/api` da Vercel faz esse papel.
- **Rodar o stack completo local (SEM Docker):** o banco é o Neon (nuvem), então bastam 2 terminais:
  `npm run dev` (backend :3000) e `npm --prefix frontend run dev` (front :8080). O `.env` (git-ignored)
  guarda `DATABASE_URL` do Neon + `NEXTAUTH_SECRET`. Setup do banco (uma vez): `npm run prisma:generate`
  → `npx prisma migrate deploy` → `npm run prisma:seed` (cria as 7 contas de teste **e** 36 animais com 2 fotos).
- **A IA não cria contas nem cola segredos.** Fluxo: a IA prepara config + runbook; o mantenedor
  cria as contas grátis, define `DATABASE_URL`/`NEXTAUTH_SECRET`/`NEXTAUTH_URL`/`UPLOADTHING_TOKEN`
  e dispara o deploy. `NEXTAUTH_SECRET`: `openssl rand -base64 32`.

---

## 8. Identidade visual & design

**Norte estético:** **teal & âmbar** + linguagem **"liquid glass" inspirada na Apple** —
translucidez, blur, profundidade, densidade de função com elegância. **Com disciplina:** vidro é
o acento (cards/overlays/topbar sobre imagem ou profundidade), nunca em tudo; texto sempre legível
(contraste **WCAG AA**). Direção atual = **refinar** o teal/âmbar, não repensar.

- **Cores:** tokens em `frontend/src/styles.css` (`:root` claro + `.dark`). Primária **teal**
  `oklch(0.511 0.086 186.4)`, acento **âmbar** `oklch(0.769 0.165 70.1)`; tokens semânticos
  (success/warning/info/selection), foco acessível e sombras já existem. **Usar tokens semânticos**
  (`bg-primary`, `text-accent`…), nunca cor hardcoded.
- **Tipografia:** corpo **Inter**, títulos **Poppins** (self-hospedadas em `public/fonts`).
- **Fundo de página (padrão `page-canvas`):** o fundo é **da página**, nunca por seção — aplique
  `page-canvas` no container raiz da rota e deixe as seções **transparentes, sem `border-b`**.
  Fundo por seção cria degrau/emenda entre blocos (erro corrigido em `c94e37b`).
- **Navbar:** sólida no topo, **vidro após o primeiro scroll**. O blur fica sempre aplicado e só a
  opacidade do fundo transiciona (`--navbar-glass`); animar `backdrop-filter` a partir de `none`
  trava em `blur(0px)`.
- **Alpha em cor:** o modificador `/opacidade` do Tailwind sobre token em `var()`
  (ex.: `bg-background/60`) **não emite alpha** aqui. Crie um token explícito com alpha
  (padrão dos `--canvas-wash-*` e `--navbar-glass`).
- **Componentes:** shadcn em `components/ui`. `glass-card.tsx` é a base do visual Glass (usado na
  tela de login). Acessibilidade que o projeto já tem (foco visível, skip-link) deve ser mantida.
- **Logo oficial:** wordmark **"AP"** (gato no A, cachorro no P; preto + laranja) em
  `frontend/public/logo.png` e `frontend/public/favicon.png`. Usada na navbar, rodapé e login
  (num "chip" branco arredondado, pra funcionar no claro e no escuro). Fonte da arte:
  `arthur-hideo-tcc-main/logo tcc.jpeg` (fora do repo).
- **A definir com o mantenedor:** tom em 3–5 palavras, público nº 1, voz PT-BR.

---

## 9. Fluxo por tarefa

1. Sincronizar: `git checkout main && git fetch origin && git reset --hard origin/main`.
2. Ler contratos reais (backend) antes de consumir no frontend.
3. Implementar (usar tokens/semântica; não mover/criar/remover função sem pedido).
4. **Portão da seção 5** (`tsc` + `build`; regra do `routeTree`).
5. Commit direto na `main` (msg convencional PT + `Co-Authored-By: Claude`), push.
6. Registrar decisões relevantes na memória do projeto.

---

## 9.1 Armadilha conhecida: actions vs. rotas HTTP

`lib/actions/*.ts` (Server Actions, legado) e `app/api/**/route.ts` (o que o frontend
realmente chama) **às vezes duplicam a mesma regra**. Ex.: `POST /api/solicitacoes`
reimplementa `createAdoptionRequest` em vez de chamá-la. Ao adicionar efeito colateral
(notificação, log, etc.), **instrumente a rota HTTP** — ou os dois — e **valide E2E**;
só mexer na action pode não ter efeito nenhum em produção.

## 10. Estado atual (handoff) — atualizado 2026-08-09

**`main` = `acfd789`.** Tudo abaixo já está mergeado e validado (`tsc` + `build`; backend com
**294 testes** passando).

### O que existe e funciona
- **Jornada de adoção completa:** vitrine pública (filtros + paginação), cadastro (3 tipos),
  login/sessão, triagem, favoritos, solicitação + acompanhamento, chat pós-aprovação.
- **Gestão:** CRUD de animais + fotos + relacionamentos, Central de Saúde (agenda/cuidados/
  registros/alertas), documentos internos, dashboard operacional, análise/decisão de solicitações,
  admin de contas.
- **Adoções concluídas:** `/dashboard/adotados` (fecha US6/FR-048-050).
- **Notificações in-app:** model `Notificacao`, `GET/POST /api/notificacoes`, sino na navbar.
  Eventos: solicitação recebida (responsável), aprovada/recusada e adoção concluída (adotante).
- **Identidade:** teal + âmbar-de-marca (`--brand` = laranja da logo), Inter/Poppins/Fredoka
  self-hospedadas, logo oficial (navbar/rodapé/login/favicon), login e navbar em Glass,
  home com hero estilo landing que **cabe na viewport**, fundo contínuo `page-canvas`.
- **Feels — descoberta por swipe (spec 005, concluída):** `/feels`, exclusiva de adotante.
  Curtir grava favorito e **não** abre solicitação nem notifica ninguém; pular vive em
  `sessionStorage` e some ao fechar a aba. Ordena por distância real; raio opcional de
  25/50/100/200 km, padrão **qualquer distância**. O feed nomeia as cidades alcançadas.
  Cartão com carrossel (arraste vertical, duplo clique, espaço, ↑ ↓, botões) e setas ← →
  decidindo sem exigir clique antes. Componente base em `components/ui/tinder-like-swipe.tsx`.
- **Localização por município:** model `Municipio` com os 5.571 municípios do IBGE e centroide
  (`prisma/data/municipios.csv`, seed idempotente à parte do `clearTestData`). **A coordenada de
  todo mundo vem do centroide do município.** O provedor de CEP (`lib/cep/`) serve só para validar
  o CEP e devolver o código IBGE — ver seção 11.
- **Cadastro por CEP:** cidade e UF são **derivadas pelo servidor**, não digitadas. Cadastro e
  perfil aceitam `cep` (+ `municipioId` só quando o provedor está fora do ar).
- **Regra de publicação:** animal só vai para `DISPONIVEL` com **no mínimo 2 fotos**. Imposta na
  transição, e a exclusão de foto é barrada enquanto o animal está anunciado.

### Ambiente (roda sem Docker)
Banco **Neon** (nuvem) — hoje com **7 contas de teste e 36 animais** DISPONIVEL, espalhados por
Volta Redonda, Barra Mansa, Resende e Angra dos Reis (0, 8, 37 e 58 km do adotante de teste), com
2 fotos cada. Dois terminais na raiz — **PowerShell usa `;`, não `&&`**:

```
cd "…\adopt-place-git"; npm run dev                    # backend :3000
cd "…\adopt-place-git"; npm --prefix frontend run dev  # front   :8080
```

`.env` local é git-ignored. Senha de todas: `AdoptPlace@2026`.
`adotante.aprovado@` · `adotante.pendente@` · `organizacao.teste@` · `organizacao.resende@` ·
`acolhedor.teste@` · `acolhedor.angra@` · `admin.teste@` (`example.com`).

> **Rodar `npm run prisma:seed` recria as contas e desloga a sessão do navegador.** Tela em
> "Carregando…" logo após um seed é isso, não defeito.
>
> **Não rode `npm run build` no frontend com o `vite dev` de pé:** o build recria `.output` embaixo
> do watcher e derruba o dev server.

### Próximo passo combinado
1. **Spec 006 — perfis públicos e busca por nome** (`specs/006-perfis-publicos/spec.md`): escrita e
   aprovada, **sem código**. Perfil de ONG com ícone, descrição, endereço e catálogo filtrável;
   acolhedor e adotante sem endereço público; busca só de organizações; triagem **e endereço do
   adotante** apenas para quem tem solicitação dele.
2. **Deploy** (requisito: sistema no ar) — config e runbook prontos em `DEPLOY.md`; falta o
   mantenedor criar os 2 projetos na Vercel e colar as env vars, e então trocar o host em
   `frontend/vercel.json`. **Lembrar de `CEP_PROVIDER`** (opcional; padrão `brasilapi`).
3. **Desfazer no Feels** (US6 da spec 005, P3): reverter a última decisão. Ficou mais relevante
   depois que a seta passou a funcionar sem clique.
4. **Pendências de design que o mantenedor vai enviar:** barra/desenho dos botões
   **Entrar/Cadastrar** e o **menu do usuário** (achou as opções atuais genéricas).

### Lacunas conhecidas (abertas por decisão ou por fazer)
- Homologação manual da feature 004: teclado, zoom 200%, contraste AA.
- `fotoUrl` de organização/acolhedor ainda não existe no schema; a **spec 006 reverte** essa
  decisão, porque o perfil público precisa de imagem.
- Papel errado: resolvido em `/feels` (explica em vez de redirecionar); **as demais rotas seguem
  com o defeito F3 da ROUTES-01**.
- SSR real de sessão e chat em tempo real: **fora de escopo** por decisão (chat usa polling).
- Precisão de rua (Nominatim) fora de escopo: dentro de uma mesma cidade todos os animais ficam
  equidistantes. Ver seção 11.
- **PR #116 está aberto e obsoleto** (substituído pelo #117, já mergeado) — pode ser fechado.
- **PR #119** é artefato de revisão desta rodada; seu merge move só o branch de referência.

---

## 11. Armadilha conhecida: a API de CEP não é fonte de coordenada

Medido em 2026-08-08, antes de construir a localização. **As APIs de CEP gratuitas não
geocodificam endereço.** Quatro CEPs de zonas opostas de São Paulo — Bela Vista, Santana, Capão
Redondo e Itaquera, separados por dezenas de quilômetros — devolvem a coordenada **idêntica**
`-23.5475, -46.63611`. O mesmo entre bairros de Volta Redonda. O campo `location` da BrasilAPI é o
centroide do município.

O centroide da nossa tabela diverge do que a API devolve em **0,5 a 1,9 km**, medido em cinco
cidades de portes diferentes — ruído diante de raios de 25 km ou mais.

**Consequência de desenho, que não deve ser revertida sem nova medição:**

- A coordenada vem **sempre** de `Municipio`, offline. Nenhum caminho de leitura chama serviço
  externo, e o custo de API por swipe é zero.
- O provedor de CEP existe para **validar o CEP, preencher o endereço e devolver o código IBGE**,
  que é a chave de junção com a tabela.
- A interface `lib/cep/provider.ts` tem duas implementações reais porque as semânticas de erro são
  **opostas**: BrasilAPI responde **404** para CEP inexistente, ViaCEP responde **HTTP 200** com
  `{"erro":"true"}` no corpo. Tratar só o status faria CEP digitado errado virar "serviço fora do
  ar" — que pede a ação contrária.
- Precisão de rua exigiria Nominatim (política de uso restritiva) ou provedor pago. Fora de escopo.
  Enquanto for assim, **animais da mesma cidade ficam equidistantes**.

### Corolário para dados de teste

Se todos os responsáveis estiverem na mesma cidade, **todos os cartões mostram a mesma distância** e
a ordenação some da tela. O seed espalha os responsáveis de propósito. Pelo mesmo motivo, ao gerar
dados de teste, mantenha **espécie, sexo e cidade em ciclos que não se alinham** — com períodos
alinhados, uma cidade acaba só com machos, ou só com gatos, e o filtro parece quebrado.
