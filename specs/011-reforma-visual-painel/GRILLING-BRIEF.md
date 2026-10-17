# Spec 011 — Reforma visual do painel de gestão: brief para a sabatina (grilling)

Este arquivo é o ponto de partida da sessão de `grilling`. Ele traz o que **já foi decidido**
(rodada 1, aceita por Pedro em 17/10/2026), o que **ainda está aberto** e as **restrições**.
A sabatina não reabre o que está em "Decidido", a não ser que encontre uma contradição concreta
no código. Nesse caso, aponte a contradição e pergunte.

Antes de começar, leia: `specs/README.md` (regra de continuidade), `specs/009-lar-temporario-status/ENTREGA.md`
(principalmente §5 Armadilhas), `CLAUDE.md`, `frontend/src/routes/_authenticated.dashboard.index.tsx`,
`frontend/src/lib/data/dashboard.ts` (contrato do painel), `frontend/src/styles.css` (tokens) e
`frontend/src/components/ui/{card,badge,skeleton,progress}.tsx`.

---

## Origem

O painel (`/dashboard`) está "cru": nove caixas iguais com um rótulo cinza e um número, e listas sem
nenhuma marcação visual. Pedro quer **só uma reforma estética** (cor, ícone, hierarquia, detalhe),
**com as mesmas informações**, seguindo a identidade visual que o sistema já tem. Foram desenhadas
três direções (A — cards por categoria; B — pendências em primeiro plano; C — gráficos). Pedro escolheu
**uma mistura de B com A**.

## Estado atual (main, depois da 009 e da 010)

- Cabeçalho "Painel" + "Olá, {nome}!". ADMIN vê outra tela (fora do escopo).
- Indicadores clicáveis (`<a>` com `Card`), numa grade de 3 colunas: Disponíveis, Em cuidados,
  Em processo de adoção, Solicitações aguardando análise, Cuidados atrasados, Cuidados nos próximos
  7 dias, Em tratamento e, **só para Organização**, Procurando LT e Em LT sem registro (chegam como
  campos opcionais no JSON).
- "O que precisa de atenção": lista de `priorityItems` com `kind` (`SAUDE_ATRASADA`, `SAUDE_HOJE`,
  `SOLICITACAO_ANALISE`, `ADOCAO_APROVADA_CONCLUSAO`), título, subtítulo e data opcional. Vazio mostra
  "Nada pendente no momento. 🎉".
- Funil de adoção (30 dias): três `Mini` cards (em análise, aprovadas/em processo, concluídas).
- Meus animais por status: `Mini` cards numa grade `sm:grid-cols-5` (resto da época do RESGATADO; hoje são 4 status).
- Atividade recente: lista de `recentActivity` com `kind` (5 tipos), texto e data; some se estiver vazia.
- Carregando: texto "Carregando painel…". Erro: texto em `text-destructive`.
- `unreadMessages` existe no contrato e **não** aparece hoje no painel.

## Decidido (rodada 1)

| # | Decisão |
|---|---|
| D1 | **Direção B + A.** De cima para baixo: (1) **faixa "Para hoje"** em destaque, com o que exige ação; (2) **indicadores agrupados por categoria** com ícone e cor por grupo (A); (3) **status como barra empilhada** com legenda (B); (4) **funil em barras horizontais simples**; (5) **atividade recente** com ícone por tipo. |
| D2 | **Mesmas informações.** Nenhum número, lista ou campo novo. Não entra card "Em LT": o backend não envia essa contagem, e incluí-la exigiria mudar a API. Vai para "fora de escopo". `unreadMessages` continua fora do painel. |
| D3 | **Só frontend.** Sem mudança em `lib/queries/operational-dashboard.ts`, na rota da API, no Prisma ou em migration. Sem dependência nova. |
| D4 | **Gráficos com CSS/Tailwind, sem Recharts.** A barra empilhada e o funil são `div`s com largura proporcional. Motivo: com 4 fatias e números pequenos, a barra informa mais que uma rosca, e evita o custo de tema escuro e acessibilidade de SVG de gráfico a seis semanas da banca. |
| D5 | **Identidade visual existente.** Só tokens de `styles.css` (`--primary`, `--brand`, `--accent`, `--success`, `--warning`, `--destructive`, `--information` e variantes `-muted`, `--chart-1..5`), fontes atuais (Poppins nos títulos via `font-serif`), `lucide-react` para ícones, componentes de `components/ui`. Nenhuma cor em hex no componente. |
| D6 | **Tema claro e escuro e responsivo** continuam valendo; nenhuma regressão em nenhum dos dois. |
| D7 | **Cards de LT continuam só para Organização** (mesma condicional de hoje). O layout do Acolhedor (sem o grupo LT) não pode ficar com buraco. |
| D8 | **Indicadores continuam clicáveis** com os mesmos `href` (passando por `resolveHref`). |
| D9 | A grade de status passa a refletir **4 status** (correção do `sm:grid-cols-5`). |
| D10 | Pedro faz a spec sozinho, sem alinhamento com o Arthur. Prazo: entregue antes de **novembro**, para refazer os prints do painel na documentação (v21) e nos slides antes da banca final (02/12/2026). |

## Aberto — a sabatina deve resolver

Ordem sugerida (o grilling recalcula a fronteira a cada rodada). Onde houver proposta, ela é só ponto de partida.

1. **Faixa "Para hoje".** É a própria lista "O que precisa de atenção" redesenhada e levada ao topo, ou
   um resumo em uma linha ("2 cuidados atrasados · 4 solicitações…") com a lista logo abaixo? Se for
   resumo, ele é derivado das contagens já existentes (não é dado novo, mas confirme que não fere D2).
   Quantos itens mostrar? Estado vazio: manter a frase, trocar o emoji 🎉 por ícone?
2. **Grupos de indicadores.** Proposta: **Adoção** (Disponíveis, Em cuidados, Em processo, Solicitações),
   **Saúde** (Cuidados atrasados, Próximos 7 dias, Em tratamento), **Lar temporário** (Procurando LT,
   Em LT sem registro). Atenção: pela 009 (D2), `EM_CUIDADOS` significa "ainda não anunciado", ou seja,
   é etapa da adoção, não saúde. Confirmar.
3. **Cor de cada grupo e de cada estado.** Proposta: Adoção = `--primary` (teal); Saúde com cor por
   urgência (atrasados = `--destructive`, 7 dias = `--warning`, tratamento = `--information`);
   LT = `--brand` (âmbar da logo). **Conflito a resolver:** `--warning` e `--brand` são ambos âmbar.
   Escolher outra cor para um dos dois, ou diferenciar por intensidade/ícone.
4. **Destaque de "precisa de ação".** Cards que pedem ação (atrasados, solicitações, LT sem registro)
   ganham borda/etiqueta quando o número é > 0 e ficam neutros quando é 0? Qual texto ("Precisa de ação")?
5. **Pendências e atividade com marcação por tipo.** Etiqueta colorida por `PriorityKind` e ícone por
   `ActivityKind`: definir a tabela tipo → ícone lucide → cor → texto da etiqueta.
6. **Barra de status.** Cor de cada status (alinhar com o `StatusBadge` que já existe, se ele tiver cores),
   legenda com números em texto, estado com total 0, se os segmentos são clicáveis (hoje não há `href`
   para status; se não houver, não são).
7. **Funil.** Escala das barras (relativa ao maior valor), rótulos, estado com tudo zero.
8. **Carregando e erro.** Trocar o texto por `Skeleton` no formato do layout final? Erro com ícone e
   botão "Tentar de novo" (`refetch`)?
9. **Responsivo.** Ordem e colunas por breakpoint (celular, `sm`, `lg`). No celular a faixa "Para hoje"
   continua primeiro?
10. **Acessibilidade.** Contraste ≥ 4,5:1 nos dois temas (texto sobre `-muted` e sobre `--warning`/`--brand`
    é o ponto de risco); foco visível nos cards clicáveis (hoje o `<a>` não tem estilo de foco); cor
    nunca sozinha (sempre ícone ou texto junto); nome acessível dos cards ("12 animais disponíveis");
    ícones decorativos com `aria-hidden`; barra de status com equivalente em texto.
11. **Testes.** Existe teste do painel no frontend? Se existir, o que precisa mudar; se não, vale um teste
    de renderização simples (Organização com LT, Acolhedor sem LT, vazio)?
12. **Fora de escopo explícito.** Listar (ex.: card "Em LT", mensagens não lidas, comparação mês a mês,
    painel do ADMIN, qualquer mudança de API, gráficos com Recharts).
13. **Critérios de aceitação e homologação.** Incluir: Organização e Acolhedor, tema claro e escuro,
    celular e desktop, painel vazio (conta nova) e painel cheio, contraste medido.

## Restrições e armadilhas conhecidas

- Windows + PowerShell; `rg` não existe, use `git grep`. Commits com `git commit -F <arquivo>`.
- O Claude Code costuma abrir worktree em `.claude\worktrees\...`: arquivos não commitados e o `.env`
  da pasta principal não aparecem lá.
- O agente pode montar e marcar o `tasks.md`, gravando em UTF-8 sem BOM e conferindo caracteres nulos.
- Da 009: **screenshot logo depois de navegar engana** (`defaultViewTransition`); para medir contraste,
  espere as animações (`document.getAnimations()`) e meça a página real, não um iframe oculto.
- Sem migration ⇒ sem branch de Neon de ensaio. Homologação visual no navegador; merge normal.
- Depois da 011: refazer os prints do painel na documentação do TCC e nos slides da banca.
