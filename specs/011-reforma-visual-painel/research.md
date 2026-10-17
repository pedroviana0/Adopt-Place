# Research — Spec 011: Reforma visual do painel

Fase 0 do `/speckit-plan`, em 2026-10-17. Cada item foi **medido ou conferido no código**, não suposto.

## R1 — Renderizar componentes do frontend no Vitest da raiz

- **Pergunta:** a raiz mapeia `@/*` para `./*` (raiz) e exclui `frontend` do `tsconfig.json`. Os
  componentes shadcn do frontend (`card`, `skeleton`, `alert`, `badge`, `button`) importam
  `@/lib/utils`, que não existe na raiz. O teste de renderização da C11 quebraria?
- **Medição:** teste descartável em `__tests__/frontend/` importando `Card`, `CardContent`, `Skeleton`,
  `Alert` e um ícone `lucide-react`, renderizados com `renderToStaticMarkup`. **Passou** (Vitest
  4.1.9, 3,7 s). Arquivo apagado em seguida.
- **Por quê:** o `vitest.config.ts` usa `resolve.tsconfigPaths: true`, que resolve o alias pelo
  `tsconfig` **mais próximo do arquivo que importa**. Para arquivos em `frontend/src/**`, vale o
  `frontend/tsconfig.json`, em que `@/` é `frontend/src/`. Pacotes (`clsx`, `lucide-react`) resolvem a
  partir de `frontend/node_modules`.
- **Decisão:** os componentes novos podem usar `@/` normalmente, como o resto do frontend. Nenhuma
  mudança em `vitest.config.ts`.
- **Alternativas descartadas:** plugin de resolução no `vitest.config.ts` (desnecessário); imports
  relativos obrigatórios nos componentes novos (destoaria do resto do frontend).
- **Limite:** o render estático não executa efeitos nem `useQuery`. Por isso o componente testado
  recebe `data` por prop, e a rota (sessão, query, carregando, erro) fica fora do render test.

## R2 — Tokens `-muted` que faltam

- **Fato:** `styles.css` tem pares `-muted` só para `success`, `warning` e `information`, em `:root`,
  `.dark` e no `@theme inline` (`--color-*-muted`, `--color-*-muted-foreground`).
- **Decisão:** criar `--primary-muted`, `--destructive-muted` e `--brand-muted`, cada um com
  `-foreground`, seguindo o padrão de luminosidade dos pares existentes (fundo L 0,94/0,29–0,31;
  texto L 0,30–0,38/0,86–0,88), com o matiz de cada cor:

  | Token | Claro | Escuro |
  |---|---|---|
  | `--primary-muted` | `oklch(0.94 0.03 186)` | `oklch(0.29 0.04 186)` |
  | `--primary-muted-foreground` | `oklch(0.32 0.06 186)` | `oklch(0.86 0.07 186)` |
  | `--destructive-muted` | `oklch(0.94 0.03 27)` | `oklch(0.29 0.05 27)` |
  | `--destructive-muted-foreground` | `oklch(0.38 0.13 27)` | `oklch(0.86 0.07 27)` |
  | `--brand-muted` | `oklch(0.95 0.04 57)` | `oklch(0.31 0.05 57)` |
  | `--brand-muted-foreground` | `oklch(0.34 0.08 55)` | `oklch(0.88 0.08 60)` |

- Mapear no `@theme inline` como os pares existentes. Nenhum token existente muda.
- Valores são o ponto de partida medido (R3); a homologação H11 confere na página real.

## R3 — Contraste (WCAG), calculado a partir dos oklch de `styles.css`

Conversão oklch → sRGB linear → luminância relativa, contra `--card` (claro `oklch(1 0 0)`, escuro
`oklch(0.25 0.022 189)`). Script descartável no scratchpad.

**Texto (≥ 4,5:1):**

| Par | Claro | Escuro |
|---|---|---|
| `primary-muted-foreground` / `primary-muted` (novo) | 10,41 | 9,33 |
| `destructive-muted-foreground` / `destructive-muted` (novo) | 8,86 | 9,17 |
| `brand-muted-foreground` / `brand-muted` (novo) | 10,22 | 9,13 |
| `success-muted` (existente) | 11,28 | 9,30 |
| `warning-muted` (existente) | 11,08 | 9,18 |
| `information-muted` (existente) | 11,33 | 9,29 |
| `accent-foreground` / `accent` | 9,70 | 4,92 |
| `muted-foreground` / `muted` | 6,57 | 6,06 |
| `muted-foreground` / `card` | 7,36 | 7,13 |
| `destructive` / `card` (texto vermelho direto) | 6,08 | **3,08** ✗ |

**Não texto contra o card (≥ 3:1):**

| Cor | Claro | Escuro | Uso |
|---|---|---|---|
| `muted-foreground` | 7,36 | 7,13 | segmento Em cuidados |
| `primary` | 5,47 | 8,54 | segmento Disponível, barras do funil, borda Solicitações |
| `chart-2` | **2,14** | 9,52 | segmento Em processo |
| `success` | 8,08 | 6,72 | segmento Adotado, Concluídas, borda LT sem registro |
| `destructive` | 6,08 | 3,08 | borda Cuidados atrasados |
| `brand` | 2,66 | 6,58 | ícone decorativo do grupo LT |
| `information` | 6,73 | 6,52 | ícone do grupo Saúde |

**Segmentos vizinhos entre si:** 1,1 a 3,8 — por isso o espaço de 2px entre segmentos (C6).

**Consequências:**
- Texto vermelho direto (`text-destructive`) **não** é usado no painel: falha no escuro. Estados de
  erro e "Atrasado" usam o par `destructive-muted`.
- `chart-2` no claro abriu a **C14**: o 3:1 passou a valer para borda de "Requer ação" e foco;
  segmentos e barras ficam dispensados por serem `aria-hidden` com legenda e números escritos.
- A borda `destructive` no escuro passa por pouco (3,08). Se H11 medir abaixo de 3:1 (o render real
  sobre `--card` pode variar com o vidro/fundo), usar `destructive-muted-foreground` na borda.
- O ícone `brand` é decorativo, ao lado do `h3` escrito: fora do critério.

## R4 — Ícones

- **Fato:** `lucide-react@0.575.0` instalado no frontend. Conferidos por `node -e`: `PawPrint`,
  `HeartPulse`, `House`, `AlertTriangle`, `CalendarClock`, `Inbox`, `HandHeart`, `Stethoscope`,
  `ThumbsUp`, `Heart`, `CheckCircle2`, `CircleAlert`, `RefreshCw`, `EyeOff`, `Hourglass`, `Pill`,
  `Search` — todos existem.
- **Decisão:** usar os nomes da spec. Nenhuma dependência nova.

## R5 — Drill-down da legenda de status

- **Fato:** `_authenticated.dashboard.animais.index.tsx` aceita `status` em
  `z.enum([EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO, ADOTADO]).optional().catch(undefined)`.
- **Decisão:** a legenda usa `<a href="/dashboard/animais?status=<STATUS>">`, igual aos cards (D8),
  sem mexer na lista.

## R6 — Ordem e volume dos dados

- **Fato:** `priorityItems` sem limite, em blocos atrasados → hoje → solicitações → aprovadas;
  `recentActivity` cortada em 10 no backend; funil com três contagens independentes.
- **Decisão:** cortar pendências no cliente (5 + "Mostrar todas (N)") sem reordenar; escala do funil
  pelo maior valor; atividade mostrada inteira (até 10).

## R7 — Estado de expansão das pendências

- **Decisão:** `useState` local no componente de pendências (estado de UI transitório, permitido pelo
  princípio VI). Não persiste em URL nem `localStorage`: ao voltar ao painel, recolhido.
