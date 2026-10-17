// Campos <input type="date"> trabalham com "AAAA-MM-DD" sem fuso. `new Date("AAAA-MM-DD")`
// le essa string como meia-noite em UTC, que em Volta Redonda (UTC-3) cai no dia anterior:
// o registro aparecia com um dia a menos e o cuidado vencia um dia antes. Achado na
// homologacao da spec 009.

function doisDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

// Data de hoje no fuso do navegador, no formato do <input type="date">.
export function hojeLocal(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
}

// Converte a data do campo para ISO ao meio-dia local, longe da virada do dia em qualquer
// fuso do Brasil. Com `ateAgora`, nunca passa do instante atual: o backend recusa data de
// aplicacao futura, e meio-dia de hoje ainda e futuro antes do meio-dia.
export function dataLocalParaIso(data: string, { ateAgora = false } = {}): string {
  const meioDia = new Date(`${data}T12:00:00`);
  const agora = new Date();
  return (ateAgora && meioDia > agora ? agora : meioDia).toISOString();
}
