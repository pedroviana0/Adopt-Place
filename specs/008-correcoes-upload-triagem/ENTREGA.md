# Entrega — Spec 008: Correções de upload, raças e confirmação da triagem

| | |
|---|---|
| **Período** | 2026-08-14 |
| **Branch** | `008-correcoes-upload-triagem` |
| **PRs** | não aberto |
| **Status** | **ENTREGUE COM PENDÊNCIA EXTERNA** |
| **Spec** | [`spec.md`](spec.md) |

## Diagnóstico factual

- Produção respondeu `Invalid token` numa autorização autenticada de `profileImage`: a variável
  `UPLOADTHING_TOKEN` da Vercel não contém um token V7 completo. Nenhum binário foi enviado para
  reproduzir o handshake.
- `UploadThingError` construído somente com texto usa `INTERNAL_SERVER_ERROR` por padrão; por isso
  validação e falta de autorização também apareciam como HTTP 500.
- `AnimalForm` reutilizava o catálogo filtrado da vitrine e, portanto, não conseguia criar o
  primeiro animal de uma raça ainda sem anúncio disponível.

## O que foi entregue

- Contratos separados de catálogo público e de gestão: a vitrine preserva o filtro por animal
  disponível, enquanto cadastro e edição recebem toda a taxonomia canônica.
- Erros UploadThing tipados, mensagens seguras e envio explícito de credenciais no upload de
  perfil.
- Modal obrigatório de declaração de veracidade antes da persistência da triagem, com retorno ao
  formulário sem perda de dados.
- Runbook e exemplo de ambiente corrigidos para explicitar o token V7 completo.

## Validação

- `npm test`: 65 arquivos e 367 testes aprovados.
- `npx tsc --noEmit`: backend e frontend aprovados.
- `npx prisma validate`: aprovado.
- `npm run build`: frontend aprovado.
- PostgreSQL local: 56 raças de cachorro e 27 raças de gato no catálogo de gestão.
- Handshakes autenticados locais de `profileImage` e PDF `healthDocument`: HTTP 200 e URL
  assinada; nenhum binário de teste foi enviado.
- Handshake anônimo de perfil: HTTP 403 com mensagem de autenticação, em vez de falso HTTP 500.

## Registro de implementação

- Commit: a registrar após a criação do commit desta entrega.

## Pendência externa

- Substituir na Vercel do backend o valor de `UPLOADTHING_TOKEN` pelo token completo da aba V7 do
  painel UploadThing e redeployar. Segredos não são lidos nem alterados pelo código ou pela IA.
