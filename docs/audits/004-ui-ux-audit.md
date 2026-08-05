# Auditoria UI/UX — Feature 004

**Base auditada:** `main` em `2600f03` (PR #96 já integrado) · **Frontend oficial:** `frontend/` · **Data:** 05-08-2026

## 1. Resumo executivo

O produto tem uma base visual coerente e funcional: verde oliva, paleta quente, tipografia legível e componentes reutilizáveis. A experiência ainda parece uma composição de telas de entrega incremental, sobretudo nas áreas operacionais: estados de lista variam entre textos soltos e o `EmptyState`, ações destrutivas usam `confirm()` nativo e a navegação de desktop simplesmente desaparece no mobile. A reforma deve consolidar padrões existentes, não substituir arquitetura, contratos ou fluxos homologados.

Principais oportunidades: fundação de tokens semânticos, navegação responsiva, padrões de feedback/formulário/listas densas e tratamento sistemático de foco, loading, vazio, erro e confirmação. Direção: sistema de gestão sereno e confiável, com acolhimento discreto nas superfícies públicas; não “pet shop”, gamificado, excessivamente arredondado ou decorativo.

## 2. Escopo e metodologia

Fontes em ordem aplicada: código da `main`, `frontend/src/routeTree.gen.ts` e rotas fonte, contratos e testes da feature 003, `specs/003-backend-frontend-integration/{spec,plan,tasks,integration-matrix}.md`, e `.specify/memory/constitution.md`. `frontend/AGENTS.md` foi lido integralmente. A feature 003 foi confirmada pela integração do PR #94 e pela conclusão registrada em `tasks.md`; PR #96 foi integrado antes desta auditoria.

Foram inventariadas rotas públicas e protegidas para visitante, adotante, organização/acolhedor e administrador. Foram executadas `npm run typecheck`, `npm run lint`, `npm run prisma:validate`, `npm run build` e `npm --prefix frontend run build`; a build do frontend passou. O navegador visual indisponível nesta sessão impediu renderização autenticada, screenshots, teclado, zoom 200%, leitores de tela e comparação 1440/1024/375. Assim, achados visuais/operacionais abaixo são estáticos e citam arquivo/componente; nenhuma alegação de teste visual é feita.

## 3. Identidade visual recomendada

**Atributos:** confiável, humano, claro, calmo e operacional. O verde oliva continua a assinatura para ação principal, seleção e marca; use tons neutros quentes para superfícies e uma cor terracota apenas como acento pontual, nunca como segundo CTA concorrente. A atmosfera deve equilibrar cards de descoberta arejados com dados administrativos compactos, legíveis e previsíveis. Evitar ilustrações infantis, sombras fortes, gradientes chamativos, badges coloridos sem semântica e excesso de raios grandes.

## 4. Inventário da interface atual

| Rota/tela | Perfil | Finalidade/componentes | Estados evidenciados | Situação |
|---|---|---|---|---|
| `/`, `/vitrine`, `/animais/$animalId` | visitante | hero, filtros, `PublicAnimalCard`, detalhe | loading, erro, vazio, paginação | funcional; feedback desigual |
| `/login`, `/cadastro/*` | visitante | autenticação e três cadastros | validação/erro por formulário | requer auditoria visual posterior |
| `/meu-perfil`, `/triagem`, `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens/*` | adotante | perfil, triagem, favoritos, solicitações e chat | guard, loading/erro por query | rotas reais protegidas |
| `/dashboard` e `/dashboard/animais/*` | organização/acolhedor | painel, lista, formulário, fotos e relações | query, toast, vazio | operacional, com padrões fragmentados |
| `/dashboard/solicitacoes/*`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens/*` | organização/acolhedor | revisão, saúde, documentos e conversa | loading/erro; `confirm()` em documentos | risco de consistência |
| `/dashboard/admin/usuarios` | admin | lista e ativação de contas | loading/erro/vazio em texto | funcional; área densa simples |

Evidência de rotas: `frontend/src/routes/*.tsx` e `frontend/src/routeTree.gen.ts`; navegação: `frontend/src/components/app/Navbar.tsx` e `_authenticated.dashboard.tsx`.

## 5. Diagnóstico do sistema visual

`frontend/src/styles.css` concentra tokens OKLCH, raios (`0.75rem`), fontes Inter/Fraunces, cores primária, semântica destrutiva, gráficos e sidebar. Isto é uma fundação adequada e preserva o verde oliva (`--primary: oklch(0.45 0.08 145)`). Há, porém, lacunas: não há tokens explícitos para foco, superfícies densas, estado selecionado, sucesso/aviso/informação e camadas de elevação. A aparência é baseada em `border`, `rounded-xl/2xl` e `bg-card` repetidos em rotas; isso permite divergência. Ícones Lucide e primitives shadcn/Radix são consistentes, mas tabelas/listas, badges, confirmação e upload não usam uma gramática de estado comum.

## 6. Problemas detalhados

| ID | Rota/elemento/evidência | Problema e impacto | Princípio | Sev. | Recomendação e critério observável | Esforço / dono |
|---|---|---|---|---|---|---|
| UX-01 | `Navbar.tsx`: `nav className="hidden ... md:flex"` | Navegação principal some abaixo de `md`; não há menu substituto no componente. Visitantes e perfis autenticados perdem descoberta de destinos. | IA, WCAG 2.4.5/2.4.11 | P1 | Criar menu móvel acessível com destinos por papel, foco preso e item ativo. Em 375 px todos os destinos disponíveis no desktop são alcançáveis por teclado. | M / Arthur; depende de padrão nav |
| UX-02 | `dashboard/documentos.index.tsx`, `DocumentRow.onDelete` | Exclusão depende de `confirm()` do navegador; sem contexto visual, sem padrão compartilhado e sem confirmação explícita do item. | Prevenção de erros; WCAG 3.3.4 | P1 | Dialog de confirmação reutilizável com título, consequência, item e foco/restauração. A exclusão só ocorre após confirmação e anuncia êxito/erro. | M / Arthur, revisão Pedro |
| UX-03 | `documentos.index.tsx`, `admin.usuarios.tsx` | Vazio/erro são apenas `<p>`; já existe `EmptyState.tsx` com próxima ação. A orientação varia entre jornadas. | Nielsen: ajudar recuperação | P2 | Padronizar `AsyncState`/`EmptyState` para listas, com CTA quando aplicável. Todo vazio explica causa e próximo passo. | M / Arthur |
| UX-04 | `index.tsx` e `vitrine.tsx` | Loading público é texto isolado (`Carregando animais…`), enquanto conteúdo posterior é grade de cards; há salto de layout e percepção de protótipo. | Visibilidade de estado | P2 | Skeleton de card/filtro reutilizável com dimensões finais. Carregamento preserva estrutura em desktop e mobile. | M / Arthur |
| UX-05 | `PublicAnimalCard.tsx` | Quando não há `fotoPrincipal`, o quadrado fica sem alternativa textual/visual. A vitrine perde identificação e qualidade. | Reconhecimento; conteúdo alternativo | P2 | Placeholder de marca neutro com ícone, texto não redundante e contraste; `alt` descreve imagem quando existir. | P / Arthur |
| UX-06 | `styles.css` e classes repetidas nas rotas | Tokens não cobrem sucesso, aviso, informação, seleção, elevação e superfícies de dados; rotas escolhem classes localmente. | Consistência | P2 | Definir tokens semânticos e recipes de card/lista/painel, mantendo primária oliva. Mesmos estados têm mesmas cores, foco e contraste AA. | M / Arthur + Pedro |
| UX-07 | `AnimalFilters.tsx` | Filtros têm labels, mas não comunicam carregamento/erro do catálogo e a ação “limpar” aparece apenas quando há filtro. | Feedback, WCAG 4.1.3 | P2 | Estado de catálogo no bloco de filtros, resultado anunciado e botão limpar previsível. Mudanças atualizam contagem e estado sem depender só de cor. | M / Arthur |
| UX-08 | `_authenticated.dashboard.tsx` | Sidebar vira faixa horizontal com `overflow-x-auto`; o estado ativo e o conteúdo podem exigir rolagem lateral, sem indicação nem atalho. | Eficiência e responsividade | P2 | Definir navegação responsiva: menu/disclosure ou abas com overflow sinalizado e foco visível. Em 375 px não há item operacional oculto. | M / Arthur |
| UX-09 | `dashboard/admin.usuarios.tsx` | Lista de usuários não oferece cabeçalho/contagem/filtro e mistura estado de conta e ação em linhas compactas. Cresce mal para gestão. | UX de listas administrativas | P2 | Padrão de tabela/lista responsiva com cabeçalho, busca/filtros quando contrato permitir e confirmação de desativação. Estado não depende só de badge/cor. | M / Arthur; contrato preservado |
| UX-10 | `styles.css`/primitives e `AnimalPhotoInput.tsx` | Foco usa `ring`, mas não há auditoria de contraste e espessura/offset como requisito compartilhado; muitas interações dependem de hover. | WCAG 2.4.7, 2.4.11 | P1 | Token de foco AA, aplicado a links, botões, selects, menu, cards clicáveis e upload. Teste de teclado demonstra foco contínuo e visível. | M / Pedro QA + Arthur |

## 7. Análise por jornada

**Descoberta e adoção:** hero, métricas, filtros e cards existem em `index.tsx`; duplicação entre home e vitrine torna essencial extrair layout/estados compartilhados. Prioridade é tornar filtros, cards sem foto, resultados e detalhe claramente orientados à adoção.

**Cadastro e triagem:** rotas `cadastro.*`, `login.tsx`, `_authenticated.triagem.tsx` usam contratos reais. A reforma deve padronizar agrupamento de campos, ajuda contextual, erro de campo e progressão, sem alterar validação Zod ou regras de triagem.

**Gestão de animais e solicitações:** `AnimalForm.tsx`, `AnimalPhotosPanel.tsx` e rotas de solicitações são a maior oportunidade para layouts administrativos, ações primárias claras e confirmações. O upload recém integrado deve ser reutilizado como padrão, não refeito.

**Saúde e documentos:** saúde combina agenda, formulários e ações destrutivas; documentos confirma a necessidade de feedback e confirmação compartilhados. Privacidade e contratos permanecem intactos.

**Comunicação/administração:** chat exige estado ativo/arquivado inequivocamente além de cor; administração exige lista escalável e ação de alto impacto com confirmação.

## 8. Responsividade e acessibilidade

Verificável estaticamente: `lang="pt-BR"`, labels em filtros/formulários, `aria-label` em excluir documento e upload associado por `htmlFor`; Radix fornece base semântica. Não verificável sem navegador: ordem real de tabulação, foco em menus/dialogs, contraste renderizado, leitores de tela, 200% e breakpoints solicitados. O `hidden md:flex` da Navbar é evidência objetiva de lacuna mobile (UX-01). A futura execução deve testar 375, 1024 e 1440 px, teclado completo, 200% e contraste de token/estado.

## 9. Estados da experiência

Há React Query e toasts em diversas rotas, `EmptyState` reutilizável, botões `disabled` e `AnimalPhotoInput` com seleção/disabled/foco. Faltam skeletons, padrão único de erro/vazio, confirmação modal, modelos de sucesso persistente e estados selected/focus documentados. Hover não pode ser o único indicador; ações destrutivas precisam confirmação contextual.

## 10. Recomendações sistêmicas

**Sistêmicas:** tokens semânticos e foco; `AppShell`/navegação por papel; `AsyncState`; skeleton; `ConfirmDialog`; receitas de formulário; `DataList`/tabela responsiva; convenções de breakpoints e toque mínimo. **Específicas:** placeholder de foto de card, filtro da vitrine, documentos e lista de usuários. Implementar primeiro padrões e depois migrar telas em ondas, mantendo contratos HTTP e testes de regressão.

## 11. Roadmap recomendado

1. Fundação: tokens, foco, tipografia/spacing e recipes. 2. Shell: Navbar móvel, dashboard e cabeçalhos. 3. Estados/componentes: async state, confirmação, listas/tabelas, formulários. 4. Público: home, vitrine, cards e detalhe. 5. Adotante: perfil, triagem, favoritos, solicitações e chat. 6. Responsável: animais, fotos, solicitações, saúde/documentos e mensagens. 7. Administração/dados densos. 8. Auditoria AA, responsividade, regressão e polimento. Cada onda é validável e não altera regra de negócio.

## 12. Proposta de divisão Pedro × Arthur

| Frente | Principal | Revisor | Dependência/paralelo | Risco de conflito |
|---|---|---|---|---|
| Spec, aceite, WCAG, regressão e homologação | Pedro | Arthur | base para todas | baixo; não editar componentes |
| Tokens, primitives e shell | Arthur | Pedro | primeiro; serializar `styles.css`/Navbar | alto: dono único Arthur |
| Estados, formulários e listas compartilhadas | Arthur | Pedro | após tokens; paralelo por componente | médio; dividir por diretório |
| Jornadas públicas e adotante | Arthur | Pedro | após shell/componentes | médio |
| Responsável/admin | Arthur | Pedro | paralelo por rota após padrão | médio |
| Evidência, Issues e integração | Pedro | Arthur | contínuo | baixo |

Estratégia: uma pessoa é dona de cada arquivo compartilhado por PR; migradores consomem componente publicado, sem editar simultaneamente `styles.css`, Navbar ou primitives.

## 13. Itens fora do escopo

Novas regras de negócio, banco/Prisma/migrations/seeds, autenticação/NextAuth, contratos HTTP, troca de arquitetura, reescrita de `frontend/`, retorno ao legado, remoção de mocks fora de fluxos homologados e dependências novas sem justificativa.

## 14. Perguntas para o `/speckit.clarify`

1. **Navegação móvel:** menu lateral/modal ou barra inferior para destinos principais? Impacto: informação e alcance por polegar. **Recomendação:** menu modal por papel, porque os destinos variam por perfil.
2. **Densidade operacional:** priorizar listas compactas ou cards em mobile? Impacto: produtividade vs. leitura. **Recomendação:** tabela/lista compacta no desktop e cards estruturados no mobile.
3. **Ilustração/fotografia institucional:** haverá acervo aprovado? Impacto: placeholder, hero e tom humano. **Recomendação:** usar fotografia real com consentimento; até lá, arte abstrata neutra, nunca imagens genéricas de banco como prova de animais disponíveis.

## 15. Insumos para o Spec Kit

`spec.md`: preservar todos os fluxos 003 e definir sucesso por acessibilidade AA, alcance mobile, feedback e consistência. `plan.md`: tokens/shell/componentes antes das jornadas. `tasks.md`: tarefas por padrão e rota, com dono único de arquivo compartilhado. Issues: uma por frente/onda, anexando UX-01…UX-10 e critérios observáveis da tabela. Homologação: matriz de perfis × rotas × 375/1024/1440 × teclado × zoom 200%, incluindo contraste, foco, erros, loading, vazios, confirmações e regressão funcional.

**Contagem:** P0 0 · P1 3 · P2 7 · P3 0. Nenhuma implementação visual foi realizada nesta feature.
