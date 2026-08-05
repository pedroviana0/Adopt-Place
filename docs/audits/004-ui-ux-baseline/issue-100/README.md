# Evidências da Issue #100 — tokens e foco

Data: 2026-08-05

Branch: `004-100-tokens-focus`

Base: `004-ui-ux-redesign` em `7b00cd8`

## Escopo verificado

As capturas em `after/` registram a fundação visual após a alteração, usando somente contas e dados de teste existentes. Nenhuma credencial, cookie ou token foi gravado. Cada perfil foi autenticado em sessão separada.

| Perfil | Rota | Controle/estado | Viewports | Teclado, foco e nome acessível | Resultado |
|---|---|---|---|---|---|
| Visitante | `/login` | campos e botão primário | 375, 1024, 1440 | Tab alcançou os campos; foco do input apresentou anel oliva de 2 px com offset de 2 px | aprovado para primitives alteradas |
| Adotante | `/meus-favoritos` | menu de conta e vazio orientado | 375, 1024, 1440 | Enter abriu o menu; Escape fechou e restaurou o foco ao botão da conta, que possui nome acessível | aprovado |
| Organização | `/dashboard/animais` | menu de conta, input de busca, select de status e lista | 375, 1024, 1440 | Tab manteve foco visível; Enter abriu menu e select; Escape fechou ambos e restaurou o foco ao disparador | aprovado; overflow preexistente em 375 px segue para T010–T014 |
| Acolhedor | `/dashboard/animais` | menu de conta, filtro e lista | 375, 1024, 1440 | Enter abriu o menu; Escape fechou e restaurou o foco ao botão da conta | aprovado; overflow preexistente em 375 px segue para T010–T014 |
| Administrador | `/dashboard/admin/usuarios` | menu de conta e lista | 375, 1024, 1440 | Enter abriu o menu; Escape fechou e restaurou o foco ao botão da conta | aprovado no escopo da fundação |

O fechamento de `dialog` e `sheet` recebeu alvo de 32 × 32 CSS px e nome acessível “Fechar”. A contenção/restauração de foco de um diálogo destrutivo consumidor será validada em T015–T019, quando esse consumidor existir, sem antecipar a Issue correspondente.

## Matriz de capturas

| Perfil | 375 px | 1024 px | 1440 px |
|---|---|---|---|
| Visitante | [`visitante-login-375.png`](after/visitante-login-375.png) | [`visitante-login-1024.png`](after/visitante-login-1024.png) | [`visitante-login-1440.png`](after/visitante-login-1440.png) |
| Adotante | [`adotante-favoritos-375.png`](after/adotante-favoritos-375.png) | [`adotante-favoritos-1024.png`](after/adotante-favoritos-1024.png) | [`adotante-favoritos-1440.png`](after/adotante-favoritos-1440.png) |
| Organização | [`organizacao-animais-375.png`](after/organizacao-animais-375.png) | [`organizacao-animais-1024.png`](after/organizacao-animais-1024.png) | [`organizacao-animais-1440.png`](after/organizacao-animais-1440.png) |
| Acolhedor | [`acolhedor-animais-375.png`](after/acolhedor-animais-375.png) | [`acolhedor-animais-1024.png`](after/acolhedor-animais-1024.png) | [`acolhedor-animais-1440.png`](after/acolhedor-animais-1440.png) |
| Administrador | [`admin-usuarios-375.png`](after/admin-usuarios-375.png) | [`admin-usuarios-1024.png`](after/admin-usuarios-1024.png) | [`admin-usuarios-1440.png`](after/admin-usuarios-1440.png) |

## Contraste calculado

Razões calculadas a partir dos valores OKLCH definidos em `frontend/src/styles.css`, convertidos para sRGB linear. O limite usado foi 4,5:1 para texto normal e 3:1 para componentes/indicadores não textuais.

| Combinação | Light | Dark | Resultado |
|---|---:|---:|---|
| foreground/background | 15,81:1 | 16,16:1 | aprovado |
| muted-foreground/muted | 7,35:1 | 5,51:1 | aprovado |
| primary-foreground/primary | 6,88:1 | 7,12:1 | aprovado |
| accent-foreground/accent | 10,10:1 | 6,97:1 | aprovado |
| destructive-foreground/destructive | 5,82:1 | 4,59:1 | aprovado |
| success-foreground/success | 7,74:1 | 7,92:1 | aprovado |
| warning-foreground/warning | 8,91:1 | 9,88:1 | aprovado |
| information-foreground/information | 6,45:1 | 7,70:1 | aprovado |
| selection-foreground/selection | 10,75:1 | 9,75:1 | aprovado |
| input/superfície | 3,38:1 | 7,31:1 | aprovado para limite de controle |
| focus/superfície do offset | 9,96:1 | 10,91:1 | aprovado para indicador de foco |

## Limitações e débito preservado

- A rota `/dashboard/animais` apresentou largura de conteúdo de 807 CSS px para viewport efetivo de 360 CSS px nos perfis organização e acolhedor. O problema já existia na baseline e será tratado pelo shell/navegação responsivos em T010–T014; não foi ampliado nesta Issue.
- O ambiente não ofereceu leitor de tela nem controle nativo de zoom; esses gates permanecem em T043–T047.
- O lint focado manteve apenas o aviso estrutural preexistente de exportação em `button.tsx`; não houve formatação massiva.
