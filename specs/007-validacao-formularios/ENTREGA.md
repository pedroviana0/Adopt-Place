# Entrega — Spec 007: Validação integral de formulários

| | |
|---|---|
| **Período** | 2026-08-14 |
| **Branch** | `007-validacao-formularios` |
| **PRs** | não aberto |
| **Status** | **ENTREGUE PARCIALMENTE** — código e gates concluídos; homologação manual exaustiva pendente |
| **Spec** | [`spec.md`](spec.md) |

## 1. O que a spec promete

| História | Prioridade | Estado |
|---|---:|---|
| Validação integral e acessível de entradas | P1 | Entregue no código e em testes |
| Validação autoritativa e erros por campo | P1 | Entregue |
| Raças limitadas a animais disponíveis | P1 | Entregue |
| Limites visíveis e coerentes | P2 | Entregue |

## 2. O que foi entregue

### Fatura 1 — inventário, identidades, triagem, animal e raças

- Inventário factual de entradas, schemas e endpoints em [`INVENTARIO.md`](INVENTARIO.md).
- CPF/CNPJ com verificadores, telefone brasileiro, nome, endereço, e-mail, senha e capacidades
  alinhados entre cadastro cliente/servidor.
- Triagem com máximos, mensagem PT-BR para tipo desejado, cinco dependências condicionais,
  campos condicionais visíveis e erros do servidor associados ao controle.
- Animal com máximos alinhados e contadores nos textos longos.
- Observação de decisão com limite visual de 1.000; mensagens permanecem em 2.000.
- Raças da vitrine consultadas somente quando algum animal está `DISPONIVEL`; perfis preservam o
  próprio escopo. Seleção incompatível é limpa e o estado sem raça fica explícito.
- Conflitos de e-mail/CPF/CNPJ agora retornam `fieldErrors` no campo correto.

### Fatura 2 — saúde, uploads, contratos estritos e homologação

- Central de Saúde, agenda, documentos, perfil e formulários administrativos receberam limites
  visuais e autoritativos coerentes, incluindo relações de datas.
- Uploads validam tamanho, MIME, extensão aparente e autorização antes de persistir; documentos
  de saúde continuam configurados em 16 MB na Uploadthing por limitação do tipo da biblioteca,
  mas o middleware autoritativo rejeita arquivos acima de 10 MB.
- Payloads mutáveis críticos passaram a rejeitar propriedades extras e o contrato de falhas foi
  consolidado em `fieldErrors`, preservando leitura legada apenas no cliente.
- Homologação no navegador cobriu cadastros públicos e ausência de overflow em 375, 1024 e
  1440 px. O banco local estava vazio, portanto o filtro de raças foi verificado por teste de
  integração com dados controlados.

Validação final em 2026-08-14: 65 arquivos e 364 testes verdes, Prisma válido, typecheck de backend
e frontend verdes e build de produção do frontend verde. O hash da implementação será registrado
nesta entrega no commit documental imediatamente posterior.

## 3. Decisões que não se reabrem

- Código real e contratos de backend são a fonte de verdade.
- Não haverá validação somente no navegador, lista de raças filtrada apenas no cliente nem exposição de animais indisponíveis.
- A arquitetura em dois aplicativos, autorização no servidor e DTOs públicos estreitos serão preservados.

## 4. O que a spec previa e não foi entregue

- A matriz manual exaustiva de FR-025 ainda não foi percorrida para todos os perfis autenticados,
  zoom de 200%, teclado, ambos os temas, rede lenta, repetição de envio e falhas simuladas do
  servidor. Os contratos e caminhos críticos estão cobertos por testes automatizados, mas essa
  homologação ampliada permanece como verificação operacional não bloqueante antes do merge.

## 5. Armadilhas descobertas

- `frontend/vercel.json` contém um placeholder versionado; ele não prova a configuração efetiva dos projetos publicados.
- A suíte inclui `organization-search-seed.test.ts`, que abre conexão real com PostgreSQL local;
  o banco precisa estar ativo para que o gate integral termine verde.

## 6. Onde o código vive

- Regras reutilizáveis: `lib/schemas/common.ts`, `frontend/src/lib/schemas/common.ts`.
- Cadastro e perfil: `lib/schemas/{adotante,perfil}.ts`, `frontend/src/lib/schemas/cadastro.ts`.
- Triagem: `lib/schemas/adotante.ts`, `frontend/src/lib/schemas/triagem.ts`, rota de triagem.
- Raças: `lib/queries/animal-showcase.ts`, `AnimalFilters.tsx`, `ProfileCatalog.tsx`.
- Testes: `__tests__/schemas/form-validation.test.ts`, testes de cadastro, triagem e vitrine.

## 7. Para quem vier depois

Leia o inventário desta spec antes de alterar qualquer formulário, schema ou endpoint.
