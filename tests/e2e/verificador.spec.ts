import { expect, test } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const launcher = path.resolve("scripts/verificar-spec.mjs");
const spec = "docs/specs/fixture/spec.md";

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "empresti-verificador-e2e-"));
  const git = (...args: string[]) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  };
  git("init", "-b", "main");
  mkdirSync(path.join(root, "docs/specs/fixture"), { recursive: true });
  writeFileSync(path.join(root, spec), "# Fixture local de infraestrutura\nCA-01: rejeitar pacote inseguro.\n");
  const commit = () => {
    git("add", "--all");
    git("-c", "user.name=Teste local", "-c", "user.email=teste@example.invalid", "commit", "-m", "fixture");
    return git("rev-parse", "HEAD");
  };
  return { root, git, commit };
}

function invoke(root: string, revision: string, checksRevision = revision) {
  const checks = path.join(root, "checks.json");
  writeFileSync(checks, JSON.stringify({ revision: checksRevision, commands: ["npm test", "npm run lint", "npm run build", "npm run test:e2e"].map((command) => ({ command, exitCode: 0, output: "fixture, não são checks de entrega" })) }));
  return spawnSync(process.execPath, [launcher, "--spec", spec, "--commits", `${revision}..${revision}`, "--checks", checks], { cwd: root, encoding: "utf8", windowsHide: true });
}

test("test_ca_01_ca_03_launcher_real_rejeita_checks_de_outro_commit", () => {
  const { root, commit } = fixture();
  const revision = commit();
  const result = invoke(root, revision, "0".repeat(40));
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("não pertencem ao commit verificado");
});

test("test_ca_02_launcher_real_rejeita_env_versionado_sem_imprimir_valores", () => {
  const { root, commit } = fixture();
  writeFileSync(path.join(root, ".env"), "EXEMPLO=sentinela-apenas-da-fixture\n");
  const result = invoke(root, commit());
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("arquivo de segredo");
  expect(result.stdout + result.stderr).not.toContain("sentinela-apenas-da-fixture");
});

test("test_ca_02_launcher_real_rejeita_symlink_antes_de_extrair_snapshot", () => {
  const { root, git } = fixture();
  const blob = spawnSync("git", ["hash-object", "-w", "--stdin"], { cwd: root, input: "alvo-fora-da-fixture", encoding: "utf8", windowsHide: true });
  expect(blob.status).toBe(0);
  git("update-index", "--add", "--cacheinfo", `120000,${blob.stdout.trim()},atalho`);
  git("add", spec);
  git("-c", "user.name=Teste local", "-c", "user.email=teste@example.invalid", "commit", "-m", "fixture symlink");
  const revision = git("rev-parse", "HEAD");
  // Não cria link no sistema de arquivos do Windows: somente uma entrada no Git descartável.
  const result = invoke(root, revision);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("symlinks ou submódulos");
});
