export const SAO_PAULO = "America/Sao_Paulo";
const businessDays = 14;
const dayMs = 86_400_000;
const localClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: SAO_PAULO, calendar: "gregory", numberingSystem: "latn", hourCycle: "h23",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});
const fixed = new Set([
  "01-01", "01-25", "04-21", "05-01", "07-09", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25",
]);

// Computus gregoriano de J.-M. Oudin. https://aa.usno.navy.mil/faq/easter
function easter(year: number) {
  const century = Math.floor(year / 100);
  const leapCenturies = Math.floor(century / 4);
  const goldenIndex = year % 19;
  const lunarCorrection = Math.floor((century - 17) / 25);
  const epact = (century - leapCenturies - Math.floor((century - lunarCorrection) / 3) + 19 * goldenIndex + 15) % 30;
  const exceptionalEpact = Math.floor(epact / 28);
  const moon = epact - exceptionalEpact * (1 - exceptionalEpact * Math.floor(29 / (epact + 1)) * Math.floor((21 - goldenIndex) / 11));
  const weekday = (year + Math.floor(year / 4) + moon + 2 - century + leapCenturies) % 7;
  const offset = moon - weekday;
  const month = 3 + Math.floor((offset + 40) / 44);
  return Date.UTC(year, month - 1, offset + 28 - 31 * Math.floor(month / 4));
}

function clockParts(date: Date) {
  return Object.fromEntries(localClock.formatToParts(date).filter(({ type }) => type !== "literal")
    .map(({ type, value }) => [type, Number(value)]));
}

// Os números UTC aqui representam uma data civil, sem fuso. A conversão para
// um instante real só ocorre depois que o último dia útil foi encontrado.
function fromSaoPauloCivil(target: number) {
  let guess = target;
  for (let i = 0; i < 4; i++) {
    const parts = clockParts(new Date(guess));
    const civil = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    if (civil === target) return new Date(guess);
    guess += target - civil;
  }
  throw new RangeError("O horário de devolução não existe no fuso de São Paulo.");
}

export function loanDeadline(createdAt: Date) {
  const parts = clockParts(createdAt);
  let civil = Date.UTC(parts.year, parts.month - 1, parts.day);
  let count = 0;
  const movable = new Map<number, number>();
  while (count < businessDays) {
    civil += dayMs;
    const date = new Date(civil);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6 || fixed.has(date.toISOString().slice(5, 10))) continue;
    const year = date.getUTCFullYear();
    if (!movable.has(year)) movable.set(year, easter(year));
    const offset = (civil - movable.get(year)!) / dayMs;
    if (offset !== -2 && offset !== 60) count++;
  }
  return fromSaoPauloCivil(civil + (23 * 60 + 59) * 60_000);
}

export function isOverdue(dueAt: Date, now: Date) {
  return now > dueAt;
}
