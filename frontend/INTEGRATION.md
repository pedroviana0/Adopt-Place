# Integração com o backend final

Este frontend usa uma camada mock em `src/lib/data/*.ts` (persistindo em `localStorage`).
Para plugar o backend real (Next.js + Prisma + NextAuth + Uploadthing), substitua **apenas**
os módulos abaixo — nenhum componente ou rota precisa mudar.

## Contratos a preservar

- `src/lib/data/sessao.ts` — `getSessao()`, `login()`, `logout()`, `subscribeSessao()`.
  Deve retornar `SessaoUsuario` (ver `src/lib/domain/types.ts`).
- `src/lib/data/animais.ts` — `listAnimais(filters)`, `getAnimal(id)`, `listFotos`,
  `fotoPrincipal`, `createAnimal`, `updateAnimal`, `replaceFotos`, `listRelacionados`,
  `addRelacionamento`, `removeRelacionamento`.
- `src/lib/data/saude.ts` — `listRegistros`, `createRegistro`, `deleteRegistro`,
  `alertasProximos`.
- `src/lib/data/solicitacoes.ts` — `listSolicitacoes*`, `createSolicitacao`,
  `aprovarSolicitacao`, `recusarSolicitacao`, `concluirAdocao`.
- `src/lib/data/favoritos.ts`, `catalogos.ts`, `usuarios.ts` idem.

## Regras que devem rodar server-side (fonte de verdade)

Hoje aplicadas no cliente para a UI se comportar corretamente; o backend deve replicar:

- XOR responsável do animal (organização OU acolhedor).
- Triagem obrigatória antes de solicitar.
- Impedir solicitação duplicada ativa (mesmo adotante × animal).
- Ao aprovar: animal → `EM_PROCESSO_ADOCAO`; demais `EM_ANALISE` do mesmo animal → `RECUSADA`.
- Ao concluir: animal → `ADOTADO`; solicitação → `CONCLUIDA`.
- Bidirecionalidade e deduplicação de `AnimalRelacionado`; bloqueio de self-link.
- Validação de datas de saúde (`dataRegistro` não futura, `dataProxima > dataRegistro`).
- Isolamento por responsável em queries e mutações.
- Nunca expor dados sensíveis do adotante em rotas públicas.

## Enums e tipos

`src/lib/domain/enums.ts` e `src/lib/domain/types.ts` espelham o schema Prisma da spec.
Ao gerar tipos do Prisma no backend, mantenha os mesmos nomes de campos e enums.

## Dados de teste

Contas seed (senha `senha123`):
- `ana@adotante.com` (triagem concluída)
- `joao@adotante.com` (sem triagem)
- `contato@spavr.org`, `contato@ciaanimalvr.org` (organizações)
- `maria@acolhedor.com` (acolhedor)
- `admin@adoptplace.com` (admin)

## Perfil da Organização / Acolhedor (dashboard/perfil)

Novos campos e operações usados pela tela `/dashboard/perfil`:

- `Organizacao.fotoUrl?: string | null` — logotipo (data URL / futura URL S3).
- `AcolhedorIndependente.fotoUrl?: string | null` — foto de perfil.

Operações esperadas do backend real (equivalentes a `atualizarOrganizacao` /
`atualizarAcolhedor` em `src/lib/data/usuarios.ts`):

- `PATCH /me/organizacao` — corpo parcial com `razaoSocial`, `responsavelNome`,
  `telefone`, `endereco`, `cidade`, `estado`, `capacidadeMaxima`, `fotoUrl` e
  opcionalmente `email`. Deve validar unicidade de e-mail (erro literal
  "E-mail já cadastrado") e **rejeitar** alterações em `cnpj`.
- `PATCH /me/acolhedor` — mesmos campos aplicáveis + `nomeCompleto`,
  `capacidadeAtual`. Rejeitar alterações em `cpf`.

Regras:
- CNPJ / CPF nunca são editáveis pela interface (somente leitura).
- E-mail deve ser único entre todos os usuários.
- Compressão de imagem já ocorre no cliente via `compressImageToDataUrl`
  (`src/lib/upload.ts`); o backend pode receber o data URL ou a versão
  upload‑direct (Uploadthing/S3) sem mudar o contrato do formulário.
