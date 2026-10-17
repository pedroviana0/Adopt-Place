# Spec 011 — Reforma visual do painel de gestão

**Branch (implementação):** `011-reforma-visual-painel`
**Criada em:** 2026-10-17
**Status:** Em especificação — aprovada na sabatina de 2026-10-17
**Execução:** Pedro (`pedroviana0`), sozinho, sem alinhamento com o Arthur (D10).
**Origem da sabatina:** [`GRILLING-BRIEF.md`](GRILLING-BRIEF.md)

## Objetivo

Reformar **só o visual** do painel `/dashboard` (Organização e Acolhedor): cor, ícone, hierarquia e
detalhe, **com as mesmas informações** e dentro da identidade teal e âmbar que o sistema já tem.

## Contexto e origem

O painel está "cru": nove caixas iguais com rótulo cinza e número, e listas sem marcação visual.
Foram desenhadas três direções (A — cards por categoria; B — pendências em primeiro plano;
C — gráficos). Pedro escolheu **B + A**. O prazo vem da documentação: os prints do painel na v21 e nos
slides precisam ser refeitos antes da banca final (02/12/2026).

## Fatos do código que condicionam o desenho (levantados em 2026-10-17)

- O painel é um componente só, dentro da rota `frontend/src/routes/_authenticated.dashboard.index.tsx`
  (`DashIndex` + `Dashboard` + `Mini`). Indicadores são `<a href>` com `Card`, passando por
  `resolveHref`. ADMIN vê outra tela.
- Contrato em `frontend/src/lib/data/dashboard.ts`: 7 indicadores fixos + 2 opcionais de LT (só
  chegam para Organização), `priorityItems` (4 `PriorityKind`), `adoptionFunnel` (3 números),
  `animalStatusCounts` (4 status), `recentActivity` (5 `ActivityKind`, `href` opcional) e
  `unreadMessages`.
- **`priorityItems` não tem limite** (`lib/queries/operational-dashboard.ts`): vem em blocos fixos,
  na ordem atrasados → hoje → solicitações em análise → aprovadas aguardando conclusão.
  `recentActivity` é cortada em 10.
- **Os títulos de `priorityItems` vêm sem acento** do backend ("Analisar solicitacao de…",
  "Concluir adocao de…").
- **Os três números do funil são contagens independentes** por estado, não etapas de uma mesma
  turma: pode haver mais concluídas que em análise.
- Tokens em `frontend/src/styles.css`: só `success`, `warning` e `information` têm par `-muted`.
  **Não existem** `--primary-muted`, `--destructive-muted` nem `--brand-muted`.
- `--destructive` no tema escuro dá **3,4:1** sobre o fundo (registrado na 009).
- A 009 já pintou o LT nos badges (`components/app/AnimalIndicators.tsx`): "Procurando LT" =
  `warning-muted`; "Em LT · …" = `success-muted`; "Em tratamento" = `information-muted`.
- `StatusBadge`: Disponível = `primary`, Em processo = `accent`, Adotado = `secondary`, Em cuidados =
  `bg-chart-4/20` (que, pelo §8 do `CLAUDE.md`, provavelmente não emite alpha).
- "Meus animais" aceita `?status=` com os 4 status no `validateSearch` (inválido vira "sem filtro").
- Layout do painel: `max-w-6xl` com barra lateral de 220px a partir de `lg` (~870px de conteúdo). As
  mensagens não lidas já aparecem como badge na barra lateral.
- `lucide-react@0.575.0` tem todos os ícones escolhidos nesta spec.
- `frontend/` não tem test runner próprio, mas o Vitest da raiz testa código do frontend em
  `__tests__/frontend/` (import relativo `../../frontend/src/...` e `renderToStaticMarkup`), sem
  dependência nova.

## Clarifications

### Session 2026-10-17

- Q: A faixa do topo é a lista de pendências ou um resumo em linha? → A: A própria lista "O que
  precisa de atenção", redesenhada e no topo, com 5 itens e "Mostrar todas (N)". Sem resumo em linha
  (repetiria os cards). Título mantido; "Para hoje" é só nome de trabalho.
- Q: `EM_CUIDADOS` é saúde ou adoção? → A: Adoção. Desde a 009 significa "ainda não anunciado". O
  rótulo continua "Em cuidados" (igual ao `statusAnimalLabel`), com uma linha de ajuda no grupo.
- Q: `--warning` e `--brand` são ambos âmbar: como não colidir? → A: Por função. `brand` só
  identifica o grupo LT (ícone do título); `warning` só marca estado (chip), sempre com texto e
  ícone. Cores de estado seguem os badges da 009.
- Q: Criar tokens `-muted` que faltam? → A: Sim, em `styles.css`, nos dois temas: `--primary-muted`,
  `--destructive-muted` e `--brand-muted` (reservado), cada um com `-foreground`.
- Q: A barra de status é clicável? → A: Os segmentos não; os itens da legenda são links para
  `/dashboard/animais?status=…`.
- Q: Como testar, se o `frontend/` não tem runner? → A: No padrão de `__tests__/frontend/`, com
  lógica pura em `frontend/src/lib/dashboard-visual.ts` e renderização estática do componente
  extraído para `frontend/src/components/app/dashboard/`.
- Q: (no `/speckit-plan`) O segmento "Em processo" não alcança 3:1 no tema claro: trocar a cor? → A:
  Não. O 3:1 vale para borda de "Requer ação" e foco; barras e segmentos têm equivalente em texto.

## Decisões

### Rodada 1 (aceitas por Pedro em 2026-10-17, antes da sabatina)

| # | Decisão | Justificativa |
|---|---|---|
| D1 | **Direção B + A.** De cima para baixo: (1) faixa de pendências em destaque; (2) indicadores agrupados por categoria com ícone e cor por grupo; (3) status como barra empilhada com legenda; (4) funil em barras horizontais simples; (5) atividade recente com ícone por tipo. | Escolha do Pedro entre as três direções desenhadas. |
| D2 | **Mesmas informações.** Nenhum número, lista ou campo novo. Sem card "Em LT" (o backend não envia a contagem). `unreadMessages` continua fora do painel. | Reforma estética; mudar dado exige mudar API. |
| D3 | **Só frontend.** Sem mudança em `lib/queries/operational-dashboard.ts`, na rota da API, no Prisma ou em migration. Sem dependência nova. | Escopo e prazo; sem migration, sem virada especial. |
| D4 | **Gráficos com CSS/Tailwind, sem Recharts.** Barra empilhada e funil são `div`s com largura proporcional. | Com 4 fatias e números pequenos, a barra informa mais que uma rosca, e evita o custo de tema escuro e acessibilidade de SVG a seis semanas da banca. |
| D5 | **Identidade visual existente.** Só tokens de `styles.css`, Poppins nos títulos (`font-serif`), `lucide-react`, componentes de `components/ui`. Nenhuma cor em hex no componente. | Coerência com a 004. |
| D6 | **Tema claro e escuro e responsivo**, sem regressão. | — |
| D7 | **Cards de LT só para Organização** (mesma condicional de hoje). O layout do Acolhedor não pode ficar com buraco. | Regra da 009 (D6 daquela spec). |
| D8 | **Indicadores clicáveis** com os mesmos `href` (via `resolveHref`). | Não quebrar o drill-down existente. |
| D9 | A grade de status passa a refletir **4 status** (fim do `sm:grid-cols-5`). | Resto da época do `RESGATADO`. |
| D10 | Pedro faz a spec sozinho. Entrega antes de **novembro**, para refazer os prints na v21 e nos slides antes de 02/12/2026. | Calendário do TCC. |

### Sabatina (2026-10-17)

| # | Pergunta | Decisão | Justificativa |
|---|---|---|---|
| C1 | Faixa do topo | A lista "O que precisa de atenção" vai para o topo. Mostra os **5 primeiros** na ordem do backend (já é ordem de urgência) e um botão **"Mostrar todas (N)"** que expande no cliente. Vazio: frase "Nada pendente no momento." com ícone `CheckCircle2` em `success`, sem emoji. | A lista não tem limite; um resumo em linha repetiria os cards. O título "Para hoje" seria impreciso (há atrasados e aprovadas). |
| C2 | Grupos | **Adoção:** Disponíveis, Em cuidados, Em processo de adoção, Solicitações aguardando análise. **Saúde:** Cuidados atrasados, Cuidados nos próximos 7 dias, Em tratamento. **Lar temporário** (só ONG): Procurando LT, Em LT sem registro. Ordem interna igual à de hoje. O grupo Adoção traz a ajuda "Em cuidados = ainda não anunciado". | `EM_CUIDADOS` é etapa da adoção desde a 009; "Em tratamento" vem da Central de Saúde. Renomear o status criaria dois nomes para a mesma coisa. |
| C3 | Cores | **Cor do grupo** só no ícone do título: Adoção `PawPrint`/`primary`; Saúde `HeartPulse`/`information`; LT `House`/`brand`. **Cor do estado** no chip de ícone de cada card (tabela em RF-IND-03). Criar `--primary-muted`, `--destructive-muted` e `--brand-muted` (+ `-foreground`) nos dois temas. | Resolve `warning` × `brand` por função; mantém o mesmo estado com a mesma cor do badge da lista; o par `destructive-muted` contorna o 3,4:1 do `--destructive` escuro. |
| C4 | "Requer ação" | Só **Cuidados atrasados**, **Solicitações aguardando análise** e **Em LT sem registro**, e só com número > 0: borda de 2px na cor do estado e etiqueta escrita **"Requer ação"**. Com 0, card neutro e número em `muted-foreground`. | Destacar demais apaga a hierarquia. "Em LT sem registro" é a única pendência que não aparece na lista do topo. |
| C5 | Marcação por tipo | Tabelas de RF-PEN-03 e RF-ATV-02. Ícones `aria-hidden`. Atividade com `href` vira link; sem `href`, texto. | A etiqueta escrita no frontend tem acento e não depende da cor. |
| C6 | Barra de status | Segmentos: Em cuidados `muted-foreground`, Disponível `primary`, Em processo `chart-2`, Adotado `success`, nessa ordem (ciclo), com 2px de espaço entre eles. Legenda com bolinha, rótulo, número e porcentagem; itens são links para `/dashboard/animais?status=…`. Status 0 fica só na legenda. Total 0: trilho `muted` vazio + "Nenhum animal cadastrado ainda." | Cores do badge são claras demais para fatias vizinhas. Segmento pequeno é alvo de clique ruim; a legenda dá o equivalente em texto. |
| C7 | Funil | Escala relativa ao **maior** dos três; valor > 0 com largura mínima de 4%; rótulo à esquerda, número à direita, barra sobre trilho `muted`. Em análise e Aprovadas em `primary`, Concluídas em `success`. Tudo zero: "Nenhuma solicitação nos últimos 30 dias." Não clicável. Título igual. | Os números são independentes; percentual da primeira barra seria falso. |
| C8 | Carregando e erro | `Skeleton` no formato do layout (pendências, **2** grupos de cards, barra, funil), `aria-busy` e texto `sr-only`. Erro em `Alert` com `CircleAlert`, a mensagem atual e botão **"Tentar de novo"** (`refetch`, desabilitado e "Tentando…" durante `isFetching`), no par `destructive-muted`. Cabeçalho sempre visível. Retries do React Query intactos. | Esqueleto com 2 grupos não "pisca" um bloco a mais no Acolhedor. Falha do painel é de servidor ou rede; insistir faz sentido. |
| C9 | Responsivo | Mesma ordem em todos os tamanhos (pendências primeiro). Cards: celular em 1 coluna, horizontais (chip, rótulo, número); `sm`+ verticais em `repeat(auto-fill, minmax(11rem, 1fr))`, uma grade por grupo. Status e funil empilhados até `lg`, lado a lado em `lg`. Pendências e atividade em largura total; no celular a data desce para baixo do subtítulo. | Grupos empilhados não deixam buraco no Acolhedor nem no grupo Saúde (3 cards). |
| C10 | Acessibilidade | Ver RF-A11Y. Os cards continuam `<a href>` (D8). | Trocar por `Link` muda comportamento (recarga), não só estética. |
| C11 | Testes | Lógica pura em `frontend/src/lib/dashboard-visual.ts` com testes unitários; `Dashboard` extraído da rota para `frontend/src/components/app/dashboard/` (arquivos por seção) e renderizado com `renderToStaticMarkup` em 3 cenários. Testes escritos antes e vistos vermelhos. | Padrão já existente em `__tests__/frontend/`; sem dependência nova (D3). |
| C12 | Fora de escopo | Lista da seção "Fora de escopo". | — |
| C13 | Aceitação | SC-01 a SC-06 e roteiro H1–H12. | — |
| C14 | (no `/speckit-plan`) "Em processo" (`chart-2`) dá 2,14:1 contra o card no tema claro | SC-05 ajustado: 3:1 vale para borda de "Requer ação" e foco; segmentos da barra e barras do funil ficam dispensados, porque são `aria-hidden` e a legenda e os números escritos carregam a informação. Paleta da C6 mantida. | WCAG 1.4.11 cobre gráfico **necessário** para entender o conteúdo; aqui não é. Evita token novo e mantém o âmbar do badge. Medição em `research.md` R3. |

## Requisitos funcionais

### Estrutura

- **RF-EST-01** De cima para baixo: cabeçalho ("Painel" / "Olá, {nome}!") → pendências → indicadores
  por grupo → status e funil → atividade recente.
- **RF-EST-02** O componente `Dashboard` sai da rota e vai para `frontend/src/components/app/dashboard/`.
  A rota fica com sessão, query, carregando e erro. Sem rota nova; `routeTree.gen.ts` não muda.
- **RF-EST-03** Nenhum fundo por seção (`page-canvas` é do layout, §8 do `CLAUDE.md`, T069 da 009).

### Pendências ("O que precisa de atenção")

- **RF-PEN-01** Mostra os 5 primeiros itens de `priorityItems`, na ordem recebida. Com mais de 5, botão
  "Mostrar todas (N)" expande no cliente (e "Mostrar menos" recolhe).
- **RF-PEN-02** Cada item: chip com ícone, etiqueta escrita, título, subtítulo e data (`formatarData`,
  se houver `dueAt`). O item inteiro é link para `resolveHref(item.href)`.
- **RF-PEN-03** Marcação por `PriorityKind`:

  | `PriorityKind` | Ícone | Chip | Etiqueta |
  |---|---|---|---|
  | `SAUDE_ATRASADA` | `AlertTriangle` | `destructive-muted` | Atrasado |
  | `SAUDE_HOJE` | `CalendarClock` | `warning-muted` | Hoje |
  | `SOLICITACAO_ANALISE` | `Inbox` | `primary-muted` | Solicitação |
  | `ADOCAO_APROVADA_CONCLUSAO` | `HandHeart` | `success-muted` | Concluir adoção |

- **RF-PEN-04** Vazio: `CheckCircle2` em `success` + "Nada pendente no momento." (sem emoji).

### Indicadores

- **RF-IND-01** Três grupos (C2), cada um com `h3`, ícone e cor do grupo (C3). O grupo LT só existe
  quando os campos opcionais chegam no JSON (D7).
- **RF-IND-02** Cada card é `<a href={resolveHref(href)}>` (D8) com chip de ícone, rótulo e número.
- **RF-IND-03** Cor do chip por card:

  | Card | Ícone | Chip |
  |---|---|---|
  | Disponíveis | `PawPrint` | `primary-muted` |
  | Em cuidados | `EyeOff` | `muted` (neutro) |
  | Em processo de adoção | `Hourglass` | `accent` |
  | Solicitações aguardando análise | `Inbox` | `primary-muted` |
  | Cuidados atrasados | `AlertTriangle` | `destructive-muted` |
  | Cuidados nos próximos 7 dias | `CalendarClock` | `warning-muted` |
  | Em tratamento | `Pill` | `information-muted` |
  | Procurando LT | `Search` | `warning-muted` |
  | Em LT sem registro | `House` | `success-muted` |

  Os ícones dos cards são sugestão de implementação, desde que existam no `lucide-react` instalado; as
  cores são decisão.
- **RF-IND-04** "Requer ação" (C4): Cuidados atrasados (borda `destructive`), Solicitações (borda
  `primary`), Em LT sem registro (borda `success`), só com número > 0. Com 0, número em
  `muted-foreground`.

### Status dos animais

- **RF-STA-01** Barra empilhada `aria-hidden`, segmentos na ordem Em cuidados → Disponível → Em
  processo → Adotado, cores de C6, 2px entre segmentos, largura proporcional ao total.
- **RF-STA-02** Legenda (`ul`) com os 4 status sempre, inclusive os 0: bolinha, rótulo
  (`statusAnimalLabel`), número e porcentagem inteira. Cada item é link para
  `/dashboard/animais?status=<STATUS>`.
- **RF-STA-03** Total 0: trilho `muted` vazio e "Nenhum animal cadastrado ainda."

### Funil

- **RF-FUN-01** Três linhas: Em análise, Aprovadas / em processo, Concluídas no período. Rótulo à
  esquerda, número à direita, barra (`aria-hidden`) sobre trilho `muted`.
- **RF-FUN-02** Largura = valor / maior valor; valor > 0 tem no mínimo 4%. Cores de C7.
- **RF-FUN-03** Tudo zero: trilhos vazios e "Nenhuma solicitação nos últimos 30 dias."

### Atividade recente

- **RF-ATV-01** Some quando vazia (como hoje). Itens com chip de ícone, texto do backend e data.
  Item com `href` é link; sem `href`, texto.
- **RF-ATV-02** Ícone por `ActivityKind`:

  | `ActivityKind` | Ícone | Chip |
  |---|---|---|
  | `ANIMAL_CADASTRADO` | `PawPrint` | `primary-muted` |
  | `SAUDE_REGISTRADA` | `Stethoscope` | `information-muted` |
  | `SOLICITACAO_RECEBIDA` | `Inbox` | `muted` |
  | `SOLICITACAO_APROVADA` | `ThumbsUp` | `primary-muted` |
  | `ADOCAO_CONCLUIDA` | `Heart` | `success-muted` |

### Carregando e erro

- **RF-EST-04** Carregando e erro conforme C8.

### Tokens

- **RF-TOK-01** `styles.css` ganha, em `:root` e `.dark`, `--primary-muted`,
  `--primary-muted-foreground`, `--destructive-muted`, `--destructive-muted-foreground`,
  `--brand-muted` e `--brand-muted-foreground`, mapeados no `@theme` como os pares existentes. Nenhum
  token existente muda de valor.

### Acessibilidade (RF-A11Y)

- **RF-A11Y-01** Texto ≥ 4,5:1 nos dois temas; borda de "Requer ação" e anel de foco ≥ 3:1 contra o
  fundo (WCAG 1.4.11). Segmentos da barra e barras do funil são dispensados: são `aria-hidden` e a
  legenda e os números escritos são o equivalente em texto (C14).
- **RF-A11Y-02** Foco visível (`focus-visible:ring-2 ring-ring ring-offset-2`) em cards, itens de
  pendência e atividade, links da legenda, "Mostrar todas" e "Tentar de novo".
- **RF-A11Y-03** Nome acessível pelo texto visível, em ordem de leitura (rótulo, número, "Requer
  ação"); sem `aria-label` que divirja do texto. Números com `tabular-nums`.
- **RF-A11Y-04** Hierarquia `h1` Painel → `h2` por seção → `h3` por grupo. Listas como `ul/li`.
- **RF-A11Y-05** Cor nunca sozinha: sempre ícone ou texto junto. Ícones `aria-hidden`.
- **RF-A11Y-06** Transições com `motion-reduce:transition-none`.

## Testes

- `__tests__/frontend/dashboard-visual.test.ts`: porcentagens de status (total 0 sem divisão por
  zero), larguras do funil (relativa ao maior, mínimo 4%, tudo zero), "Requer ação" (3 cards, só > 0),
  corte em 5 e contagem do "Mostrar todas", montagem dos grupos sem LT quando os opcionais faltam.
- `__tests__/frontend/dashboard-render.test.ts` (`renderToStaticMarkup`): Organização com LT (3
  grupos), Acolhedor (2 grupos, nenhum texto de LT), painel vazio (estados vazios das pendências, do
  status e do funil; sem atividade).
- Escritos antes da implementação e vistos **vermelhos**.

## Fora de escopo

1. Card "Em LT" (o backend não envia a contagem).
2. `unreadMessages` no painel (já está no badge da barra lateral).
3. Qualquer mudança de API, query, Prisma ou migration, incluindo os **acentos que faltam nos títulos
   de `priorityItems`** e **LT sem registro na lista de pendências**.
4. Comparação mês a mês, tendências, séries temporais e qualquer número novo.
5. Gráficos com Recharts ou SVG de gráfico.
6. Painel do ADMIN.
7. Trocar `<a href>` por `Link` nos cards (recarga de página inteira hoje; melhoria futura).
8. Defeitos anteriores à 011 que o painel não usa: `bg-chart-4/20` do `StatusBadge`; `--destructive`
   global com 3,4:1 no escuro; rota autenticada sem sessão em "Carregando…" (F3 da ROUTES-01).
9. Renomear "Em cuidados" para "Não anunciado" no sistema.
10. Mudar os retries do React Query no painel.
11. Levar o visual novo a outras telas da gestão (Meus animais, Saúde, LT).

## Critérios de aceitação

- **SC-01** Nenhum número, lista ou campo novo: só os campos do contrato atual que o painel já usa. Os
  links da legenda só levam à lista filtrada existente.
- **SC-02** O diff não toca `app/`, `lib/` da raiz, `prisma/`, `package.json` nem lockfiles.
- **SC-03** Nenhuma cor hardcoded no componente; só tokens, inclusive os 3 pares novos.
- **SC-04** Portão verde: `tsc` dos dois apps, `npm test` (com os testes novos vistos vermelhos antes) e
  build do frontend; `routeTree.gen.ts` inalterado.
- **SC-05** Contraste medido nos dois temas: texto ≥ 4,5:1; borda de "Requer ação" e foco ≥ 3:1;
  segmentos e barras dispensados por terem equivalente em texto (C14).
- **SC-06** Entregue antes de 01/11/2026.

### Roteiro de homologação

No navegador embutido, servidores locais contra o branch Neon do `.env`. Antes de começar, conferir
que **não** é a produção (`prisma migrate status` e host), como na 009.

| H | O quê |
|---|---|
| H1 | `organizacao.teste` (cheio, com LT): 3 grupos, cores e ícones conforme C3; todos os `href` (D8) abrem a lista filtrada certa. |
| H2 | `acolhedor.teste`: 2 grupos, sem buraco e sem texto de LT. |
| H3 | Painel vazio: conta de ONG nova criada pela interface **no ambiente local**; estados vazios de C1, C6, C7; sem atividade. |
| H4 | "Requer ação" aparece com > 0 e some com 0. |
| H5 | Pendências: corte em 5 e "Mostrar todas (N)" (se o seed não gerar mais de 5, criar pendências pela interface, no local). |
| H6 | Legenda da barra leva a `/dashboard/animais?status=…`. |
| H7 | Esqueleto ao carregar e erro com "Tentar de novo" (backend parado). |
| H8 | Tema claro e escuro, sem regressão. |
| H9 | 375px, `sm`, `lg` e zoom 200% sem rolagem horizontal. |
| H10 | Teclado: ordem de Tab, foco visível, "Mostrar todas" operável. |
| H11 | Contraste medido na página real, depois de `document.getAnimations()` terminar. |
| H12 | Prints finais (claro e escuro, ONG) salvos para a v21 e os slides. |

## Critério de prazo

Entregue antes de 01/11/2026 (D10). Sem migration: merge normal, sem branch de ensaio no Neon.
Depois do merge, refazer os prints do painel na documentação do TCC e nos slides da banca.
