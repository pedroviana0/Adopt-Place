# Spec 008 — Correções de upload, raças e confirmação da triagem

**Branch:** `008-correcoes-upload-triagem`
**Criada em:** 2026-08-14
**Status:** Entregue com pendência externa em 2026-08-14

## Objetivo

Corrigir regressões observadas após o deploy da spec 007: uploads que retornam erro interno,
seletor de raça vazio no cadastro de animal e ausência de uma declaração explícita de veracidade
antes do envio da triagem.

## Requisitos

- A vitrine deve continuar oferecendo somente raças com animal `DISPONIVEL`.
- Cadastro e edição de animal devem oferecer toda a taxonomia canônica, inclusive raças ainda sem
  anúncio disponível.
- Falhas esperadas de upload devem usar status coerentes e mensagens seguras, sem falso `500`.
- O deploy deve documentar que `UPLOADTHING_TOKEN` precisa ser o token V7 completo.
- Uma triagem válida só pode ser persistida depois de um modal explícito em que o adotante declare
  que as respostas são verdadeiras, completas, atualizadas e prestadas de boa-fé.
- Cancelar o modal deve preservar todas as respostas e não produzir requisição.

## Critérios de sucesso

- Testes distinguem catálogo público e catálogo de gestão.
- Testes confirmam códigos de erro de upload não internos para validação e autorização.
- Typecheck, testes, Prisma e build do frontend passam.
- Consulta com o PostgreSQL local confirma que o catálogo de gestão possui raças para as espécies.
