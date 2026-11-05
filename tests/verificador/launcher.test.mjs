import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { codexArguments, formatReport, isSecretPath, parseArguments, resolveVisualEvidence, safeEnvironment, saveReport, validateChecks } from "../../scripts/verificar-spec.mjs";

const checks = {
  revision: "a".repeat(40),
  commands: ["npm test", "npm run lint", "npm run build -- --webpack", "npm run test:e2e"].map((command) => ({ command, exitCode: 0, output: "passou" })),
};

describe("Acionamento do verificador", () => {
  it("test_ca_01_rejeita_checks_de_outra_revisao", () => {
    expect(() => validateChecks(checks, "b".repeat(40))).toThrow("commit verificado");
    expect(validateChecks(checks, checks.revision)).toBe(checks);
  });

  it("test_ca_01_exige_checks_e_preserva_falhas_para_a_auditoria", () => {
    expect(() => validateChecks({ ...checks, commands: [] }, checks.revision)).toThrow();
    const failed = { ...checks, commands: checks.commands.map((command) => ({ ...command, exitCode: 1 })) };
    expect(validateChecks(failed, failed.revision).commands.every((command) => command.exitCode === 1)).toBe(true);
    expect(() => validateChecks({ ...checks, commands: [{ command: "npm test", exitCode: 0, output: "" }] }, checks.revision)).toThrow("npm run lint");
  });

  it("test_ca_02_desabilita_escrita_escalacao_apps_plugins_e_busca", () => {
    const args = codexArguments("snapshot", "relatorio.md");
    for (const setting of ['default_permissions=":read-only"', 'approval_policy="never"', "features.shell_tool=false", "features.apps=false", "features.plugins=false", "features.request_permissions_tool=false", 'web_search="disabled"']) {
      expect(args).toContain(setting);
    }
    expect(args).toContain("--ignore-user-config");
    expect(args).toContain("--ephemeral");
    expect(args).not.toContain("--dangerously-bypass-approvals-and-sandbox");
  });

  it("test_ca_02_rejeita_arquivos_locais_e_permite_apenas_exemplo_de_env", () => {
    for (const file of [".env", ".env.local", ".env.production", ".codex/config.toml", ".aws/credentials", "pasta/.env", ".npmrc", ".ssh/id_rsa", ".config/gcloud/credentials.db", "client.p12"]) {
      expect(isSecretPath(file)).toBe(true);
    }
    expect(isSecretPath(".env.example")).toBe(false);
    expect(isSecretPath("src/app/page.tsx")).toBe(false);
  });

  it("test_ca_02_ca_03_anexa_apenas_imagens_versionadas_com_hash_conferido_sem_ampliar_permissoes", () => {
    const root = mkdtempSync(path.join(tmpdir(), "empresti-anexo-teste-"));
    const bytes = Buffer.from("fixture de bytes; o teste valida vínculo, não conteúdo visual");
    writeFileSync(path.join(root, "foto.jpg"), bytes);
    const entry = { path: "foto.jpg", sha256: createHash("sha256").update(bytes).digest("hex") };
    const resolved = resolveVisualEvidence(root, ["foto.jpg"], [entry]);
    const args = codexArguments(root, "report.md", resolved.map((image) => image.absolute));
    expect(args[args.indexOf("--image") + 1]).toBe(path.join(root, "foto.jpg"));
    expect(args).toContain('default_permissions=":read-only"');
    expect(args).toContain("features.shell_tool=false");
    expect(() => resolveVisualEvidence(root, [], [entry])).toThrow("versionado");
    expect(() => resolveVisualEvidence(root, ["foto.jpg"], [{ ...entry, sha256: "0".repeat(64) }])).toThrow("Hash");
    expect(() => resolveVisualEvidence(root, ["foto.jpg"], [entry, entry])).toThrow("único");
    expect(() => resolveVisualEvidence(root, ["../foto.jpg"], [{ ...entry, path: "../foto.jpg" }])).toThrow("snapshot");
  });

  it("test_ca_02_nao_herda_segredos_nem_urls_de_producao", () => {
    expect(safeEnvironment({ PATH: "tool-path", SystemRoot: "system", DATABASE_URL: "SENTINEL", DIRECT_URL: "SENTINEL", SUPABASE_SERVICE_ROLE_KEY: "SENTINEL", OPENAI_API_KEY: "SENTINEL", GITHUB_TOKEN: "SENTINEL" })).toEqual({ PATH: "tool-path", SystemRoot: "system" });
  });

  it("test_ca_03_exige_entradas_concretas_sem_comandos_no_intervalo", () => {
    expect(parseArguments(["--spec", "docs/specs/003-verificador-spec/spec.md", "--commits", "main..HEAD", "--checks", "checks.json"])["--commits"]).toBe("main..HEAD");
    expect(() => parseArguments([])).toThrow();
    expect(() => parseArguments(["--spec", "spec", "--commits", "main..HEAD;rm", "--checks", "checks"])).toThrow();
    expect(() => parseArguments(["--model", "outro"])).toThrow();
  });

  it("test_ca_03_preserva_tabela_e_identifica_revisao_base_e_hash_dos_checks", () => {
    const report = "| CA | evidência | status | observação |\n| CA-01 | teste:1 | SEM TESTE | falta |\nVeredito: NÃO PRONTA";
    const evidence = formatReport(report, { base: "b".repeat(40), revision: checks.revision, checksText: JSON.stringify(checks) });
    expect(evidence).toContain(`base=${"b".repeat(40)}`);
    expect(evidence).toContain(`commit=${checks.revision}`);
    expect(evidence).toMatch(/checks_sha256=[a-f0-9]{64}/);
    expect(evidence.endsWith(report)).toBe(true);
    const root = mkdtempSync(path.join(tmpdir(), "empresti-relatorio-teste-"));
    const file = saveReport(root, "docs/specs/003-verificador-spec/spec.md", report, { base: "b".repeat(40), revision: checks.revision, checksText: JSON.stringify(checks) });
    expect(readFileSync(file, "utf8")).toBe(evidence);
    expect(path.relative(root, file).replaceAll("\\", "/")).toMatch(/^docs\/verificacoes\/003-verificador-spec\//);
  });

  it("test_ca_02_ca_04_sandbox_real_bloqueia_escrita_sem_corrigir_fontes", () => {
    const probe = path.join(process.cwd(), `.verificador-prova-${randomUUID()}.tmp`);
    const code = `const fs=require("node:fs");try{fs.writeFileSync(${JSON.stringify(probe)},"probe",{flag:"wx"});console.log("PROBE_CREATED");process.exitCode=2;}catch(e){if(["EACCES","EPERM"].includes(e.code)){console.log("WRITE_DENIED");}else{console.log(e.code);process.exitCode=3;}}`;
    const result = spawnSync(process.platform === "win32" ? "codex.exe" : "codex", ["sandbox", "-P", ":read-only", "-C", process.cwd(), process.execPath, "-e", code], { encoding: "utf8", windowsHide: true, timeout: 20000 });
    // Só remove o arquivo único que a própria prova criou se a proteção falhar.
    if (result.stdout?.includes("PROBE_CREATED") && existsSync(probe)) unlinkSync(probe);
    expect(result.error, result.stderr).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("WRITE_DENIED");
    expect(existsSync(probe)).toBe(false);
  }, 25000);
});
