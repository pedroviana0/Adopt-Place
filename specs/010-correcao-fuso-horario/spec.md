# Spec 010 — Correção de fuso horário nas datas de saúde

**Tipo:** correção (sem Spec-Kit completo; um prompt só, no estilo da 008)
**Origem:** erro notado ao tirar os prints para a documentação do TCC: a data/hora salva num
registro de saúde ou cuidado planejado aparece diferente no painel.

## Objetivo

Toda data e hora que o usuário digita no painel deve ser salva e exibida **no horário de Brasília**
(`America/Sao_Paulo`), igual ao que ele digitou, a qualquer hora do dia.

## Causa (diagnóstico prévio, a confirmar no código)

1. `<input type="date">` devolve `"AAAA-MM-DD"`. O código faz `new Date("AAAA-MM-DD")`, que o
   JavaScript interpreta como **meia-noite UTC** = 21h do dia anterior em Brasília. Ao exibir com
   `toLocaleDateString("pt-BR")`, a data aparece **um dia antes**.
   - `frontend/src/components/app/HealthPanel.tsx` → `toIso()` (~linha 24)
   - `frontend/src/routes/_authenticated.dashboard.saude.index.tsx` → `toIsoDate()` (~linha 53)
2. Limites calculados em UTC:
   - `min={new Date().toISOString().slice(0, 16)}` nos `datetime-local` (~linhas 311 e 488 de
     `dashboard.saude.index.tsx`): fica **3h adiantado**, bloqueando horários válidos à noite.
   - `hoje = new Date().toISOString().slice(0, 10)` e `max=...slice(0, 10)` (`HealthPanel.tsx` ~162 e
     ~408; `dashboard.saude.index.tsx` ~501 e ~617): depois das 21h vira **o dia seguinte**.
3. O backend já tem `lib/date-utils.ts` com `APPLICATION_TIME_ZONE`; o frontend não usa nada equivalente.

## Requisitos

- R1. Criar um utilitário único no frontend (ex.: `frontend/src/lib/date.ts`) com funções para:
  converter `"AAAA-MM-DD"` do input em ISO **ancorado no fuso de Brasília** (meio-dia local é aceitável
  para datas sem hora, para nunca virar o dia); converter `datetime-local` em ISO com offset correto;
  gerar `hoje` e `agora` locais para `min`/`max`; formatar datas para exibição com
  `timeZone: "America/Sao_Paulo"`.
- R2. Substituir todos os usos citados acima (e qualquer outro `toISOString().slice(` ou
  `new Date("AAAA-MM-DD")` encontrado no `frontend/src`) pelo utilitário.
- R3. Conferir no backend (`lib/schemas/registro-saude.ts`, `lib/schemas/cuidado-planejado.ts`,
  `lib/queries/health-dashboard.ts`, `lib/queries/operational-dashboard.ts`) se comparações de
  "hoje / atrasado / próximos 7 dias" usam `APPLICATION_TIME_ZONE`. Corrigir se não usarem.
- R4. Não mudar schema, migration nem formato do contrato da API (continua ISO).
- R5. Testes unitários do utilitário cobrindo: data digitada às 22h do Brasil não muda de dia;
  `min` do datetime-local às 22h é o horário local; ida e volta (salvar → exibir) preserva o valor.

## Fora de escopo

Dados já gravados errados no banco de validação (são poucos; se necessário, recadastrar à mão).

## Critérios de aceitação

- CA-01. Registrar uma vacina com data de hoje às 22h → aparece com a data de hoje no histórico e no painel.
- CA-02. Agendar um cuidado para hoje 23h30, às 22h → o campo aceita; o painel mostra 23h30.
- CA-03. Cuidado vencido há 1h aparece em "Atrasadas"; um para amanhã cedo, em "Próximos 7 dias", não em "Hoje".
- CA-04. `npm test`, `tsc` e lint passam.
