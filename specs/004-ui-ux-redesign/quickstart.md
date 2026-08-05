# Quickstart de validação e homologação

## Pré-condições e baseline

1. Iniciar o backend raiz e o frontend oficial somente contra ambiente e contas de teste autorizados.
2. Obter uma sessão distinta para **visitante**, **adotante**, **organização**, **acolhedor independente** e **administrador**. Se uma credencial ainda não estiver disponível, registrar apenas o identificador descritivo do perfil e bloquear a homologação daquele perfil; nunca registrar senha, token, cookie ou dado privado.
3. Antes da primeira alteração visual, capturar baseline em `docs/audits/004-ui-ux-baseline/` para 375, 1024 e 1440 px, registrando perfil, rota, estado, data e caminho do arquivo. Organização e acolhedor devem ter capturas, destinos disponíveis e evidências separados, mesmo quando o comportamento esperado for idêntico.
4. Repetir a mesma matriz após cada onda e no aceite final, usando o mesmo papel, dado de teste, viewport, zoom e estado quando aplicável.

## População principal e matriz de homologação

Todas as rotas abaixo pertencem à população principal: `/`, `/vitrine`, `/animais/$animalId`, `/login`, `/cadastro`, `/meu-perfil`, `/triagem`, `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens`, `/dashboard`, `/dashboard/animais`, `/dashboard/solicitacoes`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens` e `/dashboard/admin/usuarios`. As rotas afetadas por responsividade devem ser registradas em 375, 1024 e 1440 px; em cada uma, validar também 200% de zoom quando houver conteúdo ou ação essencial.

| Perfil | Rota(s) | Controle/estado | Requisito | Método e resultado esperado | Evidência |
|---|---|---|---|---|---|
| Visitante | `/`, `/vitrine`, `/animais/$animalId`, `/login`, `/cadastro` | Navbar, filtro, card, detalhe, loading, vazio, erro | FR-001–FR-003, FR-006, FR-008–FR-010, FR-014–FR-015 | Teclado e comparação visual nos três viewports; destinos públicos, foco, skeleton e recuperação permanecem claros | Captura antes/depois e roteiro preenchido |
| Adotante | `/meu-perfil`, `/triagem`, `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens` | Formulário, lista, chat ativo/arquivado, vazio/erro | FR-001, FR-006–FR-007, FR-011, FR-014–FR-016 | Teclado, zoom e regressão de jornada nos três viewports; dados e permissões atuais preservados | Captura e resultado de regressão |
| Organização | `/dashboard`, `/dashboard/animais`, `/dashboard/solicitacoes`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens` | Shell, animal/foto, solicitação, saúde, documento, chat | FR-001, FR-004–FR-007, FR-011, FR-014–FR-016 | Sessão própria; registrar destinos, teclado, confirmação e jornada operacional separadamente | Captura, roteiro e resultado por rota |
| Acolhedor independente | `/dashboard`, `/dashboard/animais`, `/dashboard/solicitacoes`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens` | Mesmos controles da organização, conforme permissão atual | FR-001, FR-004–FR-007, FR-011, FR-014–FR-016 | Sessão própria; registrar separadamente os mesmos resultados esperados ou divergência de permissão real | Captura, roteiro e resultado por rota |
| Administrador | `/dashboard/admin/usuarios` | Lista densa, estado da conta, toggle e confirmação | FR-004–FR-007, FR-011–FR-012, FR-014–FR-016 | Teclado, responsividade, cancelamento e foco nos três viewports | Captura e resultado de regressão |

Para cada componente compartilhado modificado, registrar os estados aplicáveis: padrão, hover, focus-visible, selected, disabled, loading, erro e sucesso. Para contraste, registrar texto/superfície, ação primária, foco, erro, aviso, sucesso, informação e estado desabilitado aplicável. Alvos não inline devem atingir 24 × 24 CSS px ou a exceção WCAG 2.5.8 deve ser identificada e justificada na evidência.

## Procedimentos manuais obrigatórios

| Procedimento | Papel | Rota | Preparação/controle | Viewport | Ação | Resultado esperado | Evidência |
|---|---|---|---|---|---|---|---|
| Primitives e foco | Visitante | `/vitrine` | Botão, input, select, card acionável e menu mobile quando aplicável | 375, 1024, 1440 | Percorrer com Tab/Shift+Tab e inspecionar hover, focus-visible, disabled e selected aplicáveis | Foco contínuo e perceptível; alvo e estados atendem FR-014–FR-015 | Sequência de foco e capturas |
| Confirmação destrutiva | Organização e administrador, separadamente | `/dashboard/documentos`; `/dashboard/admin/usuarios` | Documento e conta de teste que ofereçam ação destrutiva | 1024 e 375 | Abrir diálogo por teclado, cancelar e confirmar em execução separada | Contexto/item são identificáveis; cancelamento faz 0 mutações; foco retorna ao gatilho | Captura, registro da ação e resultado |
| Descoberta pública | Visitante | `/`, `/vitrine`, `/animais/$animalId` | Loading, filtro com resultado, vazio e animal sem foto | 375, 1024, 1440 | Aguardar, aplicar/limpar filtro e abrir card | Estrutura preservada, recuperação clara e placeholder neutro | Capturas antes/depois por estado |
| Leitor de tela | Visitante, adotante e administrador | `/vitrine`, `/mensagens`, `/dashboard/admin/usuarios` | Menu, filtro, card, diálogo e controle de lista | 375 e 1024 | Percorrer os controles com leitor disponível | Nome, papel, estado e mudança de foco são compreensíveis sem cor exclusiva | Registro do leitor e rota; se indisponível, registrar indisponibilidade, revisão de semântica/ARIA no código e pendência de homologação assistiva |

## Validação técnica compatível com a infraestrutura existente

**Automatizada existente:** `npm test` coleta somente `__tests__/**/*.test.ts` em ambiente Node; usá-lo apenas para contratos, schemas, regras de servidor e lógica pura já suportada. Não há infraestrutura reutilizável para renderização React, CSS, viewport, teclado ou diálogos; testes de componente não são validação oficial desta feature.

**Estática e build:** executar `npm run typecheck`, `npm run lint`, `npm run prisma:validate`, `npm run build`, `npm --prefix frontend run build` e lint focado nos arquivos frontend alterados. O lint integral do frontend possui débito CRLF/Prettier preexistente; registrar o resultado sem reformatação massiva.

**Manual/visual:** aplicar a matriz e os procedimentos acima. Nova infraestrutura de UI somente pode ser proposta depois de demonstrar insuficiência dos procedimentos, com custo, benefício, dependências e aprovação explícita; ela não é parte desta feature.

## Aceite final

Após integrar as jornadas, comparar baseline e resultado final por perfil, rota, viewport e estado; confirmar SC-001 a SC-008, cobertura separada dos cinco perfis, contratos preservados e ausência de alteração em banco, backend, autenticação, autorização ou HTTP. Pedro revisa acessibilidade, regressão e evidências; Arthur revisa fidelidade visual e consistência. Registrar rollback aplicado, limitações e evidências finais.
