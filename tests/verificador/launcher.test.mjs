import { describe, expect, it } from "vitest";
import { codexArguments, isSecretPath, parseArguments, validateChecks } from "../../scripts/verificar-spec.mjs";

const checks = {
  revision: "a".repeat(40),
  commands: ["npm test", "npm run lint", "npm run build -- --webpack"].map((command) => ({ command, exitCode: 0, output: "passou" })),
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
    for (const setting of ['default_permissions=":read-only"', 'approval_policy="never"', "features.apps=false", "features.plugins=false", "features.request_permissions_tool=false", 'web_search="disabled"']) {
      expect(args).toContain(setting);
    }
    expect(args).toContain("--ignore-user-config");
    expect(args).toContain("--ephemeral");
    expect(args).not.toContain("--dangerously-bypass-approvals-and-sandbox");
  });

  it("test_ca_02_rejeita_arquivos_locais_e_permite_apenas_exemplo_de_env", () => {
    for (const file of [".env", ".env.local", ".env.production", ".codex/config.toml", ".aws/credentials", "pasta/.env", ".npmrc"]) {
      expect(isSecretPath(file)).toBe(true);
    }
    expect(isSecretPath(".env.example")).toBe(false);
    expect(isSecretPath("src/app/page.tsx")).toBe(false);
  });

  it("test_ca_03_exige_entradas_concretas_sem_comandos_no_intervalo", () => {
    expect(parseArguments(["--spec", "docs/specs/003-verificador-spec/spec.md", "--commits", "main..HEAD", "--checks", "checks.json"])["--commits"]).toBe("main..HEAD");
    expect(() => parseArguments([])).toThrow();
    expect(() => parseArguments(["--spec", "spec", "--commits", "main..HEAD;rm", "--checks", "checks"])).toThrow();
    expect(() => parseArguments(["--model", "outro"])).toThrow();
  });
});
