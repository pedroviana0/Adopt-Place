# Checklist de qualidade dos requisitos — UI/UX

**Propósito**: avaliar clareza, completude, mensurabilidade, consistência e rastreabilidade da especificação da feature 004; não avalia a implementação.
**Criado**: 2026-08-05
**Reavaliado**: 2026-08-05 após correções documentais, sem afirmar execução da baseline ou da implementação.
**Feature**: [spec.md](../spec.md) · [auditoria](../../../docs/audits/004-ui-ux-audit.md) · [plano](../plan.md) · [tarefas](../tasks.md)

## Completude e rastreabilidade

- [x] CHK001 Cada achado UX-01 a UX-10 possui requisito, critério, onda, tarefa e validação sem alterar regra de negócio? [Completude] — Evidência: `spec.md` §Traceability to Audit; `tasks.md` §UX → requisito → critério → plano → tarefa → validação.
- [x] CHK002 Cada FR, NFR e CR possui cenário, critério ou tarefa que permita avaliar sua conclusão? [Rastreabilidade] — Evidência: `spec.md` §§Requirements/Success Criteria; `tasks.md` T001–T053, incluindo CR-001 em T005 e CR-008 em T048.
- [x] CHK003 As jornadas e os cinco papéis estão delimitados por rotas reais? [Clareza] — Evidência: `spec.md` §§User Stories/População de homologação; `quickstart.md` §População principal.
- [x] CHK004 As jornadas sujeitas a estados assíncronos estão enumeradas sem deixar rota operacional implícita? [Completude] — Evidência: `spec.md` FR-006 e §Cobertura de estados e formulários.
- [x] CHK005 A população de rotas da baseline está nomeada e possui regra para inclusão posterior? [Clareza] — Evidência: `spec.md` NFR-001–NFR-002 e §População de homologação.
- [x] CHK006 Padrões compartilhados necessários estão separados de polimento opcional? [Consistência] — Evidência: `spec.md` CR-001; `plan.md` §Constitution Check; `tasks.md` T005/T047.

## Identidade visual e linguagem

- [x] CHK007 O papel do verde oliva está vinculado a marca, ação primária, seleção e navegação ativa sem fixar token prematuramente? [Clareza] — Evidência: `spec.md` §Direção visual verificável e FR-013.
- [x] CHK008 Neutros quentes e terracota possuem usos e proibições observáveis? [Clareza] — Evidência: `spec.md` §Direção visual verificável; `research.md` §Neutros quentes e terracota.
- [x] CHK009 Termos subjetivos normativos possuem comportamento, população, métrica ou evidência verificável? [Mensurabilidade] — Evidência: `spec.md` FR-001–FR-019, NFR-001–NFR-004 e SC-001–SC-009; termos conceituais da auditoria permanecem contexto, não aceite.
- [x] CHK010 Estilos visuais excluídos estão documentados sem prescrever implementação? [Consistência] — Evidência: `spec.md` §Direção visual verificável; `docs/audits/004-ui-ux-audit.md` §3.

## Responsividade, navegação e densidade

- [x] CHK011 375 px, 1024 px e 1440 px são exigidos de forma consistente para baseline, rotas alteradas e homologação? [Consistência] — Evidência: `spec.md` FR-001/FR-003/FR-011, NFR-001 e SC-001–SC-002; `quickstart.md` §População principal.
- [x] CHK012 A ausência de rolagem horizontal possui regra explícita e tratamento para eventual exceção essencial? [Edge Case] — Evidência: `spec.md` NFR-001 declara nenhuma exceção planejada e bloqueio documental para exceção essencial.
- [x] CHK013 O menu mobile preserva destinos por papel e exclui barra inferior? [Clareza] — Evidência: `spec.md` Clarifications e FR-001.
- [x] CHK014 O destino atual possui dois sinais avaliáveis além do uso isolado de cor? [Clareza] — Evidência: `spec.md` FR-002 define texto/`aria-current` e marcador visual adicional.
- [x] CHK015 A transformação de tabela em cards/linhas possui gatilho objetivo? [Mensurabilidade] — Evidência: `spec.md` Clarifications, US4 cenário 2 e FR-011.
- [x] CHK016 As listas densas no escopo estão enumeradas? [Completude] — Evidência: `spec.md` FR-012 e §Cobertura de estados e formulários.

## Teclado, foco e WCAG 2.2 AA

- [x] CHK017 Foco visível, ordem, contenção e restauração cobrem navegação, diálogos, filtros, cards e upload? [Cobertura] — Evidência: `spec.md` FR-001, FR-004–FR-005 e FR-014; `quickstart.md` §Procedimentos manuais.
- [x] CHK018 Áreas acionáveis possuem medida e exceções WCAG verificáveis? [Mensurabilidade] — Evidência: `spec.md` FR-014 (24 × 24 CSS px e exceções WCAG 2.5.8).
- [x] CHK019 As combinações e razões de contraste AA estão enumeradas? [Mensurabilidade] — Evidência: `spec.md` FR-015/SC-007; `quickstart.md` §População principal.
- [x] CHK020 Estados semânticos e navegação ativa exigem pista adicional à cor? [Completude] — Evidência: `spec.md` FR-002, FR-012–FR-015 e US5 cenário 2.
- [x] CHK021 Zoom 200% cobre texto longo, menus e diálogos sem solução técnica prescrita? [Edge Case] — Evidência: `spec.md` NFR-002 e §Edge Cases.
- [x] CHK022 Leitor de tela possui fluxos nomeados e alternativa documental quando indisponível? [Clareza] — Evidência: `plan.md` §Validation Strategy; `quickstart.md` procedimento “Leitor de tela”.

## Formulários, feedback e ações seguras

- [x] CHK023 Formulários de login, cadastro, perfil, triagem e animais possuem requisitos de rótulo, ajuda, erro, agrupamento e progressão? [Completude] — Evidência: `spec.md` FR-018–FR-019 e §Cobertura de estados e formulários.
- [x] CHK024 Consulta, mutação pendente, erro, recuperação e sucesso estão distinguidos sem contradizer contratos? [Clareza] — Evidência: `spec.md` FR-006/FR-016 e §Edge Cases; `contracts/ui-patterns.md` §Estado assíncrono.
- [x] CHK025 Sucesso possui persistência contextual ou anúncio acessível definido? [Clareza] — Evidência: `spec.md` FR-006 e FR-019.
- [x] CHK026 A omissão de próxima ação em vazio considera autorização, inexistência de ação e privacidade? [Clareza] — Evidência: `spec.md` FR-007.
- [x] CHK027 Confirmação destrutiva cobre consequência, item, cancelar, foco inicial/contido/restaurado e ausência de mutação prévia? [Completude] — Evidência: `spec.md` FR-004–FR-005 e SC-004; `quickstart.md` procedimento correspondente.
- [x] CHK028 Submissão pendente impede duplicação visual e preserva autoridade do servidor? [Consistência] — Evidência: `spec.md` FR-006, §Edge Cases e CR-003.

## Descoberta pública, imagens e estados

- [x] CHK029 Skeleton preserva estrutura sem prescrever biblioteca ou quantidade fixa? [Independência de implementação] — Evidência: `spec.md` FR-008/SC-005 e US3 cenário 1.
- [x] CHK030 Resultado vazio de filtro possui limpeza/ajuste sem memorização? [Clareza] — Evidência: `spec.md` FR-009/FR-012 e US3 cenário 2.
- [x] CHK031 Fotos reais, placeholder neutro e proibição de conteúdo fictício estão inequívocos? [Consistência] — Evidência: `spec.md` Clarifications e FR-010.
- [x] CHK032 Texto alternativo, ausência de foto e falha de carregamento estão diferenciados? [Acessibilidade] — Evidência: `spec.md` FR-010 e §Edge Cases; `quickstart.md` procedimento “Imagens”.

## Preservação funcional, privacidade e segurança

- [x] CHK033 Rotas, permissões, dados por papel, HTTP e regras da feature 003 são preservados? [Consistência] — Evidência: `spec.md` FR-016–FR-017 e CR-003–CR-006.
- [x] CHK034 Evidências proíbem credenciais, tokens, cookies e dados privados? [Privacidade] — Evidência: `spec.md` NFR-004/Assumptions; `quickstart.md` §Pré-condições.
- [x] CHK035 Filtros administrativos estão limitados aos contratos e dependência de backend vira bloqueio fora do escopo? [Clareza] — Evidência: `spec.md` FR-012/FR-017 e Clarifications.
- [x] CHK036 Banco, Prisma, migration, seed, autenticação, autorização, contratos, Uploadthing e regras permanecem fora de alteração? [Consistência] — Evidência: `spec.md` FR-016–FR-017, CR-002–CR-006 e Out of Scope; `tasks.md` T052.

## Homologação, responsabilidades e prontidão

- [x] CHK037 SC-001 e SC-003 definem população, cinco papéis, rotas e total de controles para sustentar 100%? [Mensurabilidade] — Evidência: `spec.md` SC-001/SC-003 e §População de homologação; `quickstart.md` matriz.
- [x] CHK038 SC-006 e SC-007 apontam estados e combinações enumerados? [Clareza] — Evidência: `spec.md` §Cobertura de estados e formulários, FR-015, SC-006–SC-007.
- [x] CHK039 Baseline e pós-comparação exigem mesma rota, papel, viewport, zoom, estado e evidência sem afirmar captura já realizada? [Completude] — Evidência: `spec.md` FR-003/Dependencies; `quickstart.md` §Pré-condições.
- [x] CHK040 Pedro × Arthur têm propriedade única e proibição de edição simultânea em arquivos compartilhados? [Consistência] — Evidência: `plan.md` §Ownership Matrix; `tasks.md` §Regra de propriedade/Dependencies.
- [x] CHK041 Ambiente e contas autorizadas bloqueiam mudanças visuais quando baseline não puder ser obtida? [Dependência] — Evidência: `plan.md` onda 0; `quickstart.md` §Pré-condições; `spec.md` Dependencies/NFR-004.
- [x] CHK042 Navegação, densidade, imagens, administração, arquitetura, baseline, paleta e validação não deixam decisão material implícita? [Prontidão] — Evidência: `spec.md` Clarifications/Direção visual; `plan.md` Gates; `research.md`; `tasks.md` Dependencies.

## Resultado da reavaliação

## Revisao pos-integracao — 2026-08-06

Este checklist avalia a qualidade dos requisitos, nao a execucao. O merge de #113 nao alterou seus 42 itens de qualidade nem resolve os gates de homologacao manual. A prontidao para merge continua dependente das tarefas abertas registradas em `tasks.md` e das limitacoes registradas em `quickstart.md`.

- Itens atendidos antes desta rodada: CHK001, CHK002, CHK005, CHK006, CHK008, CHK011, CHK013, CHK015, CHK018, CHK020, CHK022, CHK028–CHK031, CHK033–CHK034, CHK036 e CHK039–CHK042.
- Itens completados após correção documental: CHK003–CHK004, CHK007, CHK009–CHK010, CHK012, CHK014, CHK016–CHK017, CHK019, CHK021, CHK023–CHK027, CHK032, CHK035 e CHK037–CHK038.
- Itens não aplicáveis: nenhum.
- Evidência visual: apenas planejada; nenhuma baseline foi declarada como capturada nesta revisão.
