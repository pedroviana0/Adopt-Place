# UI Pattern Contracts

Estes contratos são de apresentação, não HTTP e não modificam os contratos da feature 003.

| Padrão | Garantia de interface | Limite |
|---|---|---|
| Navegação | destinos separados por papel; item atual por texto/`aria-current` e segundo sinal; foco inicial, contido e restaurado | não decide permissão nem cria barra inferior |
| Confirmação | item, consequência, ação/cancelamento, foco inicial na ação segura, contenção e restauração | não altera semântica nem antecipa mutação |
| Estado assíncrono | consulta: loading/skeleton, conteúdo, vazio e erro; mutação: pending sem duplicação, erro preservando dados e sucesso anunciado | não muda query, DTO ou erro de backend |
| Formulário | rótulo, ajuda e erro associados; valores válidos preservados; foco no primeiro erro | não muda schema Zod, progressão ou regra existente |
| Lista responsiva | identificação, estado e ação simultâneos; compacto no desktop; card/linha em 375 px diante de overflow/perda desses campos | não cria filtro/coluna sem contrato |
| Filtro | estado ativo identificável, limpeza e vazio recuperável | não cria endpoint nem capacidade administrativa |
| Mídia animal | foto real com texto alternativo; ausência conhecida e falha de carregamento distintas | não cria conteúdo fictício nem muda Uploadthing |
| Identidade | oliva primário; neutros quentes para superfícies; terracota opcional não crítico; semânticas AA | não fixa token antes da baseline nem usa cor como pista única |

Cada padrão deve comunicar estado por mais de uma pista, seguir os contrastes de FR-015, os alvos de FR-014 e os estados aplicáveis definidos na matriz de `quickstart.md`.

## Inventário e contrato da fundação visual (Issue #100)

O inventário confirmou que a fundação compartilhada está concentrada em `frontend/src/styles.css` e nas primitives de `frontend/src/components/ui/`. As rotas consumidoras continuam responsáveis apenas por composição e conteúdo; não devem declarar novas cores de estado quando houver token semântico equivalente.

| Decisão | Fonte canônica | Contrato de uso |
|---|---|---|
| Cor de assinatura | `--primary` / `--primary-foreground` | Verde oliva permanece na ação e identificação primárias; não representa sucesso isoladamente. |
| Superfícies | `--background`, `--card`, `--popover`, `--muted` e aliases `--surface*` | Neutros quentes diferenciam fundo, painel e conteúdo elevado sem depender de sombra intensa. |
| Estados semânticos | `--success*`, `--warning*`, `--information*`, `--destructive*` | Texto/ícone ou rótulo acompanha a cor; pares de primeiro plano e fundo são indivisíveis. |
| Seleção | `--selection` / `--selection-foreground` | Estado selecionado usa contraste próprio e uma pista adicional, como ícone, peso ou `aria-pressed`/`data-state`. |
| Foco | `--focus`, com `--ring` e `--sidebar-ring` como aliases | Todo controle interativo recebe indicador de 2 CSS px e afastamento de 2 CSS px; o anel é medido contra a superfície do offset. |
| Bordas e controles | `--border`, `--input`, `--radius` | Bordas de controles devem permanecer perceptíveis; raio base de `0.75rem` é derivado pelas utilities existentes. |
| Elevação | `--shadow-panel`, `--shadow-floating` | Painéis usam elevação discreta; menus e diálogos podem usar elevação flutuante. Não substituir hierarquia por sombra excessiva. |
| Tipografia | `--font-sans`, `--font-serif` | Texto operacional permanece sans-serif; títulos `h1`–`h3` preservam serif para acolhimento e identidade. |

### Primitives cobertas pela fundação

- `button.tsx`: foco, estado desabilitado e seleção por `aria-pressed`.
- `input.tsx` e `select.tsx`: superfície, foco, inválido e desabilitado; opções selecionadas mantêm cor e peso.
- `dropdown-menu.tsx`: foco/seleção e altura mínima consistente nos itens.
- `dialog.tsx` e `sheet.tsx`: fechamento com alvo de 32 × 32 CSS px, nome acessível em português e foco visível.

Esses contratos não modificam comportamento do Radix, ordem de foco, DTO, validação Zod ou autorização. A confirmação destrutiva reutilizável e a validação de contenção de foco em um diálogo consumidor pertencem às tarefas T015–T019.
