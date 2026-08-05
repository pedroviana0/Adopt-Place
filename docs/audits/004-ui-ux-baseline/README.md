# Baseline visual anterior à feature 004

**Data:** 2026-08-05

**Branch de captura:** `004-99-baseline-visual`

**Base funcional:** `004-ui-ux-redesign` em `cbdb939`

**Ambiente:** frontend TanStack em `http://127.0.0.1:8080`, backend Next.js em `http://127.0.0.1:3000` e banco de teste já existente, sem seed, reset ou mutação de preparação.

## Protocolo

- Foram registradas 102 capturas PNG antes de qualquer mudança visual.
- Viewports: 375 × 812, 1024 × 768 e 1440 × 900 CSS px.
- Cada arquivo termina em `--375.png`, `--1024.png` ou `--1440.png`.
- Visitante e adotante foram capturados em página completa. As áreas de organização, acolhedor e administrador usam o viewport visível, pois a captura de página completa do dashboard excedeu o limite do navegador interno. A comparação posterior deve repetir o modo indicado por grupo.
- O zoom nativo permaneceu em 100%. O navegador interno disponibilizou controle de viewport, mas não controle de zoom do navegador; 200% permanece uma validação manual obrigatória em T044 e não é apresentado como concluído nesta baseline.
- As sessões foram separadas para visitante, adotante, organização, acolhedor independente e administrador. Nenhuma senha, cookie, token ou segredo foi gravado.
- Foram usados somente registros que já existiam no ambiente de teste. Nenhum conteúdo fictício foi criado para preencher estados ausentes.

## Matriz de evidências

Em cada linha, o prefixo identifica três arquivos irmãos no diretório `before/`, um por viewport.

| Perfil | Rota real | Estado registrado | Prefixo da evidência | Zoom |
|---|---|---|---|---|
| Visitante | `/` | dados públicos existentes | `home` | 100%; 200% pendente T044 |
| Visitante | `/vitrine` | grade e filtros com dados | `vitrine` | 100%; 200% pendente T044 |
| Visitante | `/animais/cmsfiak2n00xc74a3vcax79p5` | detalhe público com foto real | `animal-brad` | 100%; 200% pendente T044 |
| Visitante | `/login` | formulário padrão | `login` | 100%; 200% pendente T044 |
| Visitante | `/cadastro` | seleção de perfil | `cadastro` | 100%; 200% pendente T044 |
| Visitante | `/cadastro/adotante` | formulário padrão | `cadastro-adotante` | 100%; 200% pendente T044 |
| Visitante | `/cadastro/organizacao` | formulário padrão | `cadastro-organizacao` | 100%; 200% pendente T044 |
| Visitante | `/cadastro/acolhedor` | formulário padrão | `cadastro-acolhedor` | 100%; 200% pendente T044 |
| Adotante | `/meu-perfil` | perfil e triagem concluída | `adotante-meu-perfil` | 100%; 200% pendente T044 |
| Adotante | `/triagem` | formulário preenchido existente | `adotante-triagem` | 100%; 200% pendente T044 |
| Adotante | `/meus-favoritos` | estado atual da conta | `adotante-meus-favoritos` | 100%; 200% pendente T044 |
| Adotante | `/minhas-solicitacoes` | estado atual da conta | `adotante-minhas-solicitacoes` | 100%; 200% pendente T044 |
| Adotante | `/mensagens` | vazio: nenhuma conversa | `adotante-mensagens` | 100%; 200% pendente T044 |
| Organização | `/dashboard` | indicadores com dados | `organizacao-dashboard` | 100%; 200% pendente T044 |
| Organização | `/dashboard/perfil` | formulário com dados existentes | `organizacao-dashboard-perfil` | 100%; 200% pendente T044 |
| Organização | `/dashboard/animais` | lista com dois animais | `organizacao-dashboard-animais` | 100%; 200% pendente T044 |
| Organização | `/dashboard/animais/novo` | formulário vazio | `organizacao-dashboard-animais-novo` | 100%; 200% pendente T044 |
| Organização | `/dashboard/animais/cmsfiak2n00xc74a3vcax79p5` | edição de animal existente | `organizacao-dashboard-animal-detalhe` | 100%; 200% pendente T044 |
| Organização | `/dashboard/solicitacoes` | lista com solicitação existente | `organizacao-dashboard-solicitacoes` | 100%; 200% pendente T044 |
| Organização | `/dashboard/solicitacoes/cmsfivzb4035r74a3w37724ta` | revisão concluída existente | `organizacao-dashboard-solicitacao-detalhe` | 100%; 200% pendente T044 |
| Organização | `/dashboard/saude` | estado operacional atual | `organizacao-dashboard-saude` | 100%; 200% pendente T044 |
| Organização | `/dashboard/documentos` | estado operacional atual | `organizacao-dashboard-documentos` | 100%; 200% pendente T044 |
| Organização | `/dashboard/mensagens` | lista com conversa arquivada | `organizacao-dashboard-mensagens` | 100%; 200% pendente T044 |
| Organização | `/dashboard/mensagens/cmsfix3nt03ak74a34j45xgc2` | conversa arquivada existente | `organizacao-dashboard-mensagem-detalhe` | 100%; 200% pendente T044 |
| Acolhedor independente | `/dashboard` | indicadores da sessão própria | `acolhedor-dashboard` | 100%; 200% pendente T044 |
| Acolhedor independente | `/dashboard/perfil` | formulário da sessão própria | `acolhedor-dashboard-perfil` | 100%; 200% pendente T044 |
| Acolhedor independente | `/dashboard/animais` | estado atual da sessão própria | `acolhedor-dashboard-animais` | 100%; 200% pendente T044 |
| Acolhedor independente | `/dashboard/animais/novo` | formulário vazio | `acolhedor-dashboard-animais-novo` | 100%; 200% pendente T044 |
| Acolhedor independente | `/dashboard/solicitacoes` | estado atual da sessão própria | `acolhedor-dashboard-solicitacoes` | 100%; 200% pendente T044 |
| Acolhedor independente | `/dashboard/saude` | estado atual da sessão própria | `acolhedor-dashboard-saude` | 100%; 200% pendente T044 |
| Acolhedor independente | `/dashboard/documentos` | estado atual da sessão própria | `acolhedor-dashboard-documentos` | 100%; 200% pendente T044 |
| Acolhedor independente | `/dashboard/mensagens` | estado atual da sessão própria | `acolhedor-dashboard-mensagens` | 100%; 200% pendente T044 |
| Administrador | `/` | sessão autenticada e destino Admin | `administrador-home-autenticada` | 100%; 200% pendente T044 |
| Administrador | `/dashboard/admin/usuarios` | lista densa com contas de teste | `administrador-usuarios` | 100%; 200% pendente T044 |

## Limitações preservadas

- `/mensagens/$conversaId` não possui instância alcançável para o adotante aprovado usado na baseline; a lista retornou “Nenhuma conversa”. A rota não foi fabricada e deverá ser homologada quando houver conversa autorizada existente.
- A sessão do acolhedor não ofereceu registros dinâmicos próprios alcançáveis para detalhe de animal, solicitação ou conversa. Os destinos estáticos e seus estados vazios foram registrados separadamente da organização.
- Loading transitório, falha de rede, falha de imagem, hover, focus-visible, selected, disabled e zoom 200% são estados de validação das ondas consumidoras, não estados artificialmente produzidos nesta captura inicial.
- Os identificadores dinâmicos acima pertencem exclusivamente ao ambiente de teste e servem para repetibilidade local; nenhuma informação de autenticação foi armazenada.

## Regra de comparação posterior

Para cada rota alterada, produzir o arquivo correspondente em `after/` com o mesmo prefixo, viewport, papel, dado autorizado, estado e enquadramento. Divergências de dados devem ser registradas antes da comparação e nunca corrigidas por seed ou edição direta do banco.
