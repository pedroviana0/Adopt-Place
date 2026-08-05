# Checklist de qualidade dos requisitos — UI/UX

**Propósito**: avaliar clareza, completude, mensurabilidade, consistência e rastreabilidade da especificação da feature 004; não avalia a implementação.
**Criado**: 2026-08-05
**Feature**: [spec.md](../spec.md) · [auditoria](../../../docs/audits/004-ui-ux-audit.md) · [plano](../plan.md) · [tarefas](../tasks.md)

## Completude e rastreabilidade

- [ ] CHK001 A especificação mantém um requisito rastreável para cada achado UX-01 a UX-10, sem converter achado visual em mudança de regra de negócio? [Completude, Spec §Traceability to Audit]
- [ ] CHK002 Cada FR, NFR e CR possui ao menos um cenário de aceitação, critério de sucesso ou tarefa que permita avaliar sua conclusão? [Rastreabilidade, Spec §Requirements; §Success Criteria]
- [ ] CHK003 As jornadas pública, adotante, responsável e administração estão delimitadas por rotas e papéis reais, em vez de nomes genéricos de tela? [Clareza, Spec §User Stories 1–4; Audit §4]
- [ ] CHK004 A lista de “jornadas afetadas” de FR-006 e FR-007 é suficientemente explícita para evitar que uma rota operacional fique fora do padrão de estados? [Gap, Completude, Spec §FR-006–FR-007]
- [ ] CHK005 A expressão “telas principais” usada em NFR-001 e NFR-002 está vinculada à matriz de rotas da baseline, com critério para inclusões futuras? [Ambiguidade, Spec §NFR-001–NFR-002; §Dependencies]
- [ ] CHK006 Os requisitos separam de modo inequívoco padrões compartilhados necessários de polimento opcional de uma tela específica? [Consistência, Spec §CR-001; Plan §Inventário]

## Identidade visual e linguagem

- [ ] CHK007 O papel do verde oliva como assinatura primária está definido sem exigir tonalidade exata prematura, mas com vínculo aos estados e ações em que pode ser usado? [Clareza, Spec §FR-013; §Assumptions]
- [ ] CHK008 Os termos “neutros quentes” e “terracota discreto” possuem limite observável suficiente para evitar concorrência com a ação primária? [Ambiguidade, Spec §FR-013]
- [ ] CHK009 Há alguma exigência restante que use “moderno”, “agradável”, “melhor”, “profissional” ou termo subjetivo equivalente sem comportamento, evidência ou critério mensurável associado? [Ambiguidade, Spec inteira]
- [ ] CHK010 Os requisitos de identidade evitam estilos explicitamente excluídos pela auditoria — visual infantil, gamificado, decorativo e excesso de efeitos — sem criar requisitos de implementação? [Consistência, Audit §3; Spec §Out of Scope]

## Responsividade, navegação e densidade

- [ ] CHK011 As larguras 375 px, 1024 px e 1440 px são exigidas de forma consistente para navegação, descoberta, jornadas autenticadas, baseline e homologação? [Consistência, Spec §FR-001, FR-003, FR-011; §SC-001–SC-002]
- [ ] CHK012 O requisito de ausência de rolagem horizontal define exceções legítimas, se houver, para conteúdo que não pode ser reestruturado sem comprometer os contratos atuais? [Edge Case, Spec §NFR-001]
- [ ] CHK013 O menu mobile por papel define todos os destinos preservados e exclui claramente a barra inferior nesta feature? [Clareza, Spec §FR-001; §Clarifications]
- [ ] CHK014 A indicação de destino atual por dois sinais perceptíveis define exemplos não exclusivos que possam ser avaliados sem depender somente de cor? [Clareza, Spec §FR-002]
- [ ] CHK015 O critério “quando a tabela não couber adequadamente” possui parâmetro de decisão ou evidência de overflow para orientar a mudança para cards/linhas estruturadas? [Ambiguidade, Spec §FR-011]
- [ ] CHK016 As áreas densas citadas em FR-012 incluem explicitamente documentos, usuários e as demais listas operacionais presentes no inventário, ou há uma fronteira de escopo documentada? [Completude, Spec §FR-012; Audit §4]

## Teclado, foco e WCAG 2.2 AA

- [ ] CHK017 Os requisitos definem foco visível, ordem/continuidade e restauração para navegação, diálogos, filtros, cards acionáveis e upload, conforme achado UX-10? [Cobertura, Spec §FR-005, FR-014; Audit UX-10]
- [ ] CHK018 A expressão “área acionável adequada ao contexto de toque e ponteiro” tem medida mínima, referência WCAG ou regra de exceção verificável? [Ambiguidade, Spec §FR-014]
- [ ] CHK019 As combinações “relevantes” para contraste AA estão enumeradas ou possuem uma matriz que determine texto, ícone, borda, foco e estados críticos a avaliar? [Ambiguidade, Spec §FR-015; §SC-007]
- [ ] CHK020 Os requisitos definem uma pista além da cor para sucesso, aviso, erro, informação, seleção, indisponibilidade e estado ativo de navegação? [Completude, Spec §FR-002, FR-012–FR-015; US5]
- [ ] CHK021 O requisito de zoom 200% esclarece como conteúdos muito longos, menus e diálogos mantêm informação e ação essencial sem exigir uma solução técnica específica? [Cobertura, Edge Case, Spec §NFR-002; §Edge Cases]
- [ ] CHK022 A validação por leitor de tela é corretamente tratada como evidência quando disponível, com limitação documentável quando o ambiente não permitir a inspeção? [Clareza, Plan §Validation; Audit §8]

## Formulários, feedback e ações seguras

- [ ] CHK023 A especificação contém requisitos suficientes para erros de campo, ajuda contextual, agrupamento e progressão nos formulários de login, cadastro, perfil, triagem e gestão de animais? [Gap, Completude, Audit §7; Spec §US4]
- [ ] CHK024 Os requisitos de loading, sucesso, erro e recuperação distinguem consulta, mutação pendente e operação concluída sem contradizer os contratos da feature 003? [Clareza, Spec §FR-006; §Edge Cases; §FR-016]
- [ ] CHK025 O estado de sucesso está definido com mensagem, persistência temporal ou anúncio acessível suficiente para não ficar implícito na expressão “compatíveis com a ação”? [Ambiguidade, Spec §FR-006]
- [ ] CHK026 Os estados vazios definem quando uma próxima ação deve ser omitida por falta de autorização, inexistência de ação válida ou privacidade? [Clareza, Spec §FR-007; US4]
- [ ] CHK027 A confirmação destrutiva identifica consequência, item afetado, cancelamento, prevenção de mutação prévia e restauração de foco para todas as ações destrutivas no escopo? [Completude, Spec §FR-004–FR-005; §SC-004]
- [ ] CHK028 O requisito de submissão pendente trata duplicação visual e preserva explicitamente a proteção autoritativa já existente no servidor? [Consistência, Spec §Edge Cases; §CR-003]

## Descoberta pública, imagens e estados

- [ ] CHK029 O skeleton público define preservação de estrutura da grade e filtros sem prescrever biblioteca, componente ou quantidade fixa de cards? [Independência de implementação, Spec §FR-008; §SC-005]
- [ ] CHK030 O requisito de filtro vazio esclarece a recuperação por limpar/ajustar filtros sem exigir memorização de valores anteriores? [Clareza, Spec §FR-009; US3]
- [ ] CHK031 A origem de imagem permite apenas fotos reais associadas e um placeholder neutro, excluindo banco de imagens e conteúdo fictício de modo inequívoco? [Consistência, Spec §FR-010; §Clarifications]
- [ ] CHK032 A especificação define conteúdo alternativo e comportamento de falha de imagem distinto da ausência conhecida de foto principal? [Gap, Acessibilidade, Spec §FR-010; Audit UX-05]

## Preservação funcional, privacidade e segurança

- [ ] CHK033 Os requisitos preservam explicitamente rotas, permissões, dados por papel, contratos HTTP e regras homologadas da feature 003, sem introduzir alteração indireta de domínio? [Consistência, Spec §FR-016–FR-017; §CR-003–CR-006]
- [ ] CHK034 A baseline e a comparação visual definem a proibição de credenciais, tokens, cookies e dados privados nas evidências? [Completude, Privacidade, Spec §NFR-004; §Assumptions]
- [ ] CHK035 O requisito sobre busca ou filtros administrativos limita claramente a reforma aos contratos existentes e descreve como registrar uma necessidade que exigiria backend? [Clareza, Spec §FR-012, FR-017; §Clarifications]
- [ ] CHK036 A ausência de mudanças em banco, Prisma, autenticação, autorização, contratos e regras de negócio é repetida de forma consistente em requisitos, escopo e critérios de sucesso? [Consistência, Spec §FR-016–FR-017; §CR-002–CR-006; §Out of Scope]

## Homologação, responsabilidades e prontidão

- [ ] CHK037 Os percentuais de SC-001 e SC-003 definem população, papéis, rotas e critério de amostragem de controles suficiente para sustentar “100%”? [Ambiguidade, Mensurabilidade, Spec §SC-001, SC-003]
- [ ] CHK038 SC-006 e SC-007 identificam quais estados e combinações são críticos/afetados, de forma consistente com os achados UX-03, UX-06, UX-07 e UX-10? [Clareza, Spec §SC-006–SC-007; §Traceability to Audit]
- [ ] CHK039 A estratégia de baseline e comparação posterior define evidência comparável por rota, papel, viewport e estado, sem transformar o checklist em roteiro de execução? [Completude, Spec §FR-003; §Dependencies]
- [ ] CHK040 A divisão Pedro × Arthur atribui um dono único aos arquivos compartilhados — tokens, Navbar, shell e primitives — e define revisão sem edição simultânea? [Consistência, Plan §Ownership; Tasks §Regra de propriedade]
- [ ] CHK041 As dependências de ambiente renderizado e contas autorizadas possuem gate ou condição de bloqueio explícita antes de critérios visuais serem declarados atendidos? [Dependência, Spec §Dependencies; §NFR-004]
- [ ] CHK042 A especificação, plano e tarefas não deixam decisão material implícita sobre navegação mobile, densidade, imagens, administração, arquitetura, baseline ou paleta? [Prontidão, Spec §Clarifications; Plan; Tasks]

## Notas

- Marque cada item após revisar a redação dos artefatos, registrando a lacuna ou a referência que a resolve.
- Itens com `[Gap]` ou `[Ambiguidade]` são falhas de qualidade até que a especificação seja complementada ou uma decisão seja formalmente registrada.
