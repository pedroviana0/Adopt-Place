// Datas do painel no fuso da aplicação (spec 010).
//
// `<input type="date">` devolve "AAAA-MM-DD" e `<input type="datetime-local">`
// devolve "AAAA-MM-DDTHH:mm", ambos sem fuso. `new Date("AAAA-MM-DD")` lê a
// string como meia-noite UTC (21h do dia anterior em Brasília), e
// `toISOString().slice(...)` calcula "hoje"/"agora" em UTC — 3h adiantado.
// Tudo aqui ancora em America/Sao_Paulo, independente do fuso do navegador ou
// do servidor de SSR. Espelha `lib/date-utils.ts` do backend.

export const FUSO_APLICACAO = "America/Sao_Paulo";

type Partes = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partesFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_APLICACAO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const dataFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_APLICACAO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const horaFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_APLICACAO,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partesNoFuso(instante: Date): Partes {
  const valores = new Map(
    partesFormatter
      .formatToParts(instante)
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, Number(parte.value)]),
  );
  return {
    year: valores.get("year") ?? 0,
    month: valores.get("month") ?? 0,
    day: valores.get("day") ?? 0,
    hour: valores.get("hour") ?? 0,
    minute: valores.get("minute") ?? 0,
    second: valores.get("second") ?? 0,
  };
}

function partesComoUtc(p: Partes): number {
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** Instante em que o relógio de Brasília marca exatamente `p`. */
function instanteNoFuso(p: Partes): Date {
  const desejado = partesComoUtc(p);
  let timestamp = desejado;
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const diferenca = desejado - partesComoUtc(partesNoFuso(new Date(timestamp)));
    if (diferenca === 0) break;
    timestamp += diferenca;
  }
  return new Date(timestamp);
}

const pad = (n: number) => String(n).padStart(2, "0");

function comoDataInput(p: Partes): string {
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "AAAA-MM-DD" de hoje em Brasília — para `value`/`max` de `<input type="date">`. */
export function hojeLocal(referencia: Date = new Date()): string {
  return comoDataInput(partesNoFuso(referencia));
}

/** "AAAA-MM-DDTHH:mm" de agora em Brasília — para `min` de `<input type="datetime-local">`. */
export function agoraLocal(referencia: Date = new Date()): string {
  const p = partesNoFuso(referencia);
  return `${comoDataInput(p)}T${pad(p.hour)}:${pad(p.minute)}`;
}

const DATA_INPUT = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATA_HORA_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * "AAAA-MM-DD" → ISO da **meia-noite de Brasília** daquele dia.
 *
 * Meia-noite, e não meio-dia: o backend recusa `dataAplicacao` posterior a
 * agora (`pastOrTodayDateSchema`), e meio-dia faria o registro de "hoje" feito
 * de manhã ser rejeitado como data futura. Como toda exibição e toda
 * classificação usam o mesmo fuso, a meia-noite local não troca de dia.
 */
export function dataInputParaIso(valor: string): string {
  const m = DATA_INPUT.exec(valor);
  if (!m) throw new RangeError(`Data inválida: "${valor}"`);
  return instanteNoFuso({
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: 0,
    minute: 0,
    second: 0,
  }).toISOString();
}

/** "AAAA-MM-DDTHH:mm" digitado em horário de Brasília → ISO do mesmo instante. */
export function dataHoraInputParaIso(valor: string): string {
  const m = DATA_HORA_INPUT.exec(valor);
  if (!m) throw new RangeError(`Data e hora inválidas: "${valor}"`);
  return instanteNoFuso({
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4]),
    minute: Number(m[5]),
    second: Number(m[6] ?? 0),
  }).toISOString();
}

/** ISO → "dd/mm/aaaa" em Brasília. */
export function formatarData(iso: string | Date): string {
  return dataFormatter.format(new Date(iso));
}

/** ISO → "dd/mm/aaaa às HH:mm" em Brasília. */
export function formatarDataHora(iso: string | Date): string {
  const instante = new Date(iso);
  return `${dataFormatter.format(instante)} às ${horaFormatter.format(instante)}`;
}

/** ISO → "14 de outubro de 2026" em Brasília. */
export function formatarDataExtenso(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: FUSO_APLICACAO,
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
