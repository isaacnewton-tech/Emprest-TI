import { expect, test } from "vitest";
import { isOverdue, loanDeadline } from "@/server/services/calendario";

test.each([
  ["feriado nacional e data local diferente da UTC", "2026-11-06T02:00:00Z", "2026-11-27T02:59:00.000Z"],
  ["feriado estadual de 9 de julho", "2026-07-08T15:00:00Z", "2026-07-30T02:59:00.000Z"],
  ["aniversário da capital e Carnaval facultativo", "2027-01-22T15:00:00Z", "2027-02-13T02:59:00.000Z"],
  ["Corpus Christi e ponto facultativo no dia seguinte", "2026-06-03T15:00:00Z", "2026-06-25T02:59:00.000Z"],
  ["Sexta-feira da Paixão e Tiradentes", "2026-04-02T15:00:00Z", "2026-04-25T02:59:00.000Z"],
  ["virada de ano com Natal e Ano Novo", "2026-12-23T15:00:00Z", "2027-01-15T02:59:00.000Z"],
])("test_ca_04_prazo_respeita_%s", (_case, createdAt, dueAt) => {
  expect(loanDeadline(new Date(createdAt)).toISOString()).toBe(dueAt);
});

test("test_ca_06_atraso_comeca_depois_do_instante_gravado", () => {
  const dueAt = loanDeadline(new Date("2026-11-05T15:00:00Z"));
  expect(isOverdue(dueAt, dueAt)).toBe(false);
  expect(isOverdue(dueAt, new Date(dueAt.getTime() + 1))).toBe(true);
});
