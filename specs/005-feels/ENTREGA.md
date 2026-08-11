# Entrega — Spec 005: Feels (descoberta por swipe com proximidade real)

| | |
|---|---|
| **Período** | 2026-08-07 → 2026-08-08 |
| **Branch** | trabalho direto na `main` (governança anterior ao fluxo de branch+PR) |
| **Status** | **Entregue**, exceto US6 (§4) |
| **Spec** | [`spec.md`](spec.md) — única spec da pasta; não houve `plan.md`/`tasks.md` |

> **A spec 005 contém a decisão técnica mais cara de reverter deste projeto.** A estratégia de
> geolocalização foi trocada inteira **depois de medir** que o pressuposto original estava errado.
> A medição e sua consequência estão no `CLAUDE.md`, **§11 — leia antes de tocar em localização.**

---

## 1. O que a spec prometia

Duas camadas de uma vez, e a separação em duas specs foi **avaliada e recusada** pelo mantenedor:
a camada de localização sozinha não entrega nada demonstrável para a banca, e o swipe sem
coordenada abandona o "a X km de você", que é o coração da ideia.

| | História | Prioridade | Entregue? |
|---|---|---|---|
| US1 | Cadastrar-se com localização confiável | P1 | sim |
| US2 | Descobrir animais deslizando um por vez | P1 | sim |
| US3 | Curtir para salvar nos favoritos | P1 | sim |
| US4 | Ver primeiro quem está perto | P2 | sim |
| US5 | Conhecer o animal pelas fotos reais | P2 | sim |
| US6 | Desfazer o último cartão | P3 | **não** |

Critérios que moldaram a arquitetura: **0 chamadas a serviço externo de geocoding** ao montar,
paginar ou filtrar o feed (SC-002); **0 respostas do feed contêm latitude ou longitude** de
responsável (SC-004); e o feed permanece utilizável com o provedor de geocoding desligado (SC-010).

## 2. O que foi entregue

- **Feed** — `/feels`, exclusiva de adotante autenticado e ativo (`1efadbf`). Componente base
  `SwipeableCardStack` (`b34dbea`), conteúdo em hierarquia de decisão (`f42cabc`), setas ← →
  decidindo **sem exigir clique antes**.
- **Fotos no cartão** — carrossel (`1b3120b`), arraste vertical como num feed de vídeo (`f5a43f2`),
  duplo clique e barra de espaço (`b341b91`).
- **Localização por município** (`69804b7`) — model `Municipio` com os **5.571 municípios do IBGE**
  e centroide (`prisma/data/municipios.csv`), seed idempotente à parte do `clearTestData`.
- **CEP como única entrada** — obrigatório no cadastro, cidade e UF **derivadas pelo servidor**
  (`5917f28`), formulários alinhados (`ff4a13a`).
- **Papel errado explicado** em vez de redirecionar em silêncio (`113ac43`) — corrige o defeito F3
  da 003, **mas só em `/feels`**.
- **Fora do escopo original, na mesma rodada:** vitrine com 30 por página em grade de 5 colunas
  (`1bcc72c`) e **mínimo de 2 fotos** para anunciar o animal (`9205b3d`).

## 3. Decisões que não se reabrem

1. **A coordenada de todo mundo vem do centroide do `Municipio`, offline.** Nenhum caminho de
   leitura chama serviço externo; o custo de API por swipe é zero.
2. **O provedor de CEP (`lib/cep/`) serve só para validar o CEP, preencher o endereço e devolver o
   código IBGE** — que é a chave de junção com a tabela de municípios. **Não é fonte de
   coordenada.**
3. **A interface `lib/cep/provider.ts` tem duas implementações reais** porque as semânticas de erro
   são **opostas**: BrasilAPI responde **404** para CEP inexistente; ViaCEP responde **HTTP 200**
   com `{"erro":"true"}` no corpo. Tratar só o status faria CEP digitado errado virar "serviço fora
   do ar" — que pede a ação contrária do usuário.
4. **Curtir grava favorito e pronto.** Não abre solicitação e não notifica ninguém.
5. **Pular é efêmero:** vive em `sessionStorage` e some ao fechar a aba.
6. **Precisão de rua está fora de escopo.** Exigiria Nominatim (política de uso restritiva) ou
   provedor pago. Enquanto for assim, **animais da mesma cidade ficam equidistantes**.

## 4. O que a spec previa e não foi entregue

- **US6 — desfazer o último cartão (P3).** Não implementado. Ficou **mais** relevante depois que a
  seta passou a decidir sem exigir clique: hoje um toque acidental é irreversível.

## 5. Armadilhas que nasceram aqui

- **§11 do `CLAUDE.md`: a API de CEP não geocodifica endereço.** Medido em 2026-08-08: quatro CEPs
  de zonas opostas de São Paulo — Bela Vista, Santana, Capão Redondo, Itaquera, separados por
  dezenas de quilômetros — devolvem a coordenada **idêntica** `-23.5475, -46.63611`. O campo
  `location` da BrasilAPI é o centroide do município. O centroide da nossa tabela diverge do da API
  em 0,5 a 1,9 km, ruído diante de raios de 25 km ou mais.
- **Corolário para dados de teste:** se todos os responsáveis estiverem na mesma cidade, todos os
  cartões mostram a mesma distância e a ordenação some da tela. O seed espalha os responsáveis de
  propósito (Volta Redonda, Barra Mansa, Resende, Angra dos Reis — 0, 8, 37 e 58 km do adotante de
  teste). Pelo mesmo motivo, **mantenha espécie, sexo e cidade em ciclos que não se alinham**: com
  períodos alinhados, uma cidade acaba só com machos, ou só com gatos, e o filtro parece quebrado.
- **A janela de `main` quebrada.** Entre `5917f28` (20:04) e `ff4a13a` (20:14) o backend já recusava
  `cidade`/`estado` e os formulários ainda os enviavam: cadastro quebrado por 10 minutos, **com o
  portão verde nos dois commits**. Cada metade estava correta sozinha; o que quebra é a fronteira.
  É a razão registrada da mudança para **branch + PR** (`CLAUDE.md`, §2).

## 6. Onde o código vive

`lib/queries/feels.ts` · `lib/schemas/feels.ts` · `lib/geo.ts` · `lib/localizacao.ts` ·
`lib/municipios.ts` · `lib/cep/` · `app/api/feels/route.ts` · `app/api/cep/[cep]/route.ts` ·
`app/api/municipios/route.ts` · `prisma/data/municipios.csv` ·
`frontend/src/routes/_authenticated.feels.tsx` · `frontend/src/components/ui/tinder-like-swipe.tsx` ·
`frontend/src/components/app/AnimalSwipeCard.tsx` · `frontend/src/components/app/CampoLocalizacao.tsx`

## 7. Para quem vier depois

Duas coisas da 005 conectam diretamente na **006**:

- O commit `0b50462` diz "quem cadastrou o animal aparece no cartão, **com link para o perfil**".
  O chip existe e é clicável — mas o `Link` aponta para `/animais/$animalId`, a página do
  **animal**. **A promessa está na tela e entrega outro destino.** A 006 conserta o destino; o
  componente já está pronto.
- `Municipio` é a fonte do município exibido em todo perfil da 006. Não reimplemente localização.
