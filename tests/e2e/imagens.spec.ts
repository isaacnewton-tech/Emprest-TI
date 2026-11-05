import { expect, test } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const script = path.resolve("skills/imagens-equipamentos/scripts/imagens.mjs");
const fixture = () => mkdtempSync(path.join(tmpdir(), "empresti-imagens-e2e-"));
const run = (root: string, ...args: string[]) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8", windowsHide: true });

test("test_ca_01_ca_05_cli_sem_chave_falha_sem_api_ou_env_do_supabase", () => {
  const root = fixture();
  const state = run(root, "estado");
  expect(state.status).toBe(0);
  expect(JSON.parse(state.stdout)).toEqual({ provider: "pixabay", keyConfigured: false, reviewPresent: false });
  const result = run(root, "buscar", "TI-0001");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Configure a chave local");
  expect(result.stderr).not.toContain("https://pixabay.com/api/?");
});

test("test_ca_03_cli_bloqueia_export_sem_revisao_e_nao_cria_pacote", () => {
  const root = fixture();
  const result = run(root, "preparar");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Falta a revisão visual");
  expect(existsSync(path.join(root, ".image-work/export"))).toBe(false);
});

test("test_ca_05_cli_nao_oferece_upload_de_producao", () => {
  const result = run(fixture(), "upload");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Não existe comando de upload");
});

test("test_ca_03_ca_04_cli_bloqueia_lote_incompleto_sem_fabricar_fotos", () => {
  const root = fixture();
  mkdirSync(path.join(root, ".image-work"));
  writeFileSync(path.join(root, ".image-work/revisoes.json"), JSON.stringify({ approved: [{ patrimonio: "TI-0001" }], rejected: [] }));
  const result = run(root, "preparar");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("exatamente 12 revisões aprovadas");
  expect(existsSync(path.join(root, ".image-work/export"))).toBe(false);
});
