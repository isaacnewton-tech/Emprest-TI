import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function validateChecks(checks, revision) {
  if (checks.revision !== revision) {
    throw new Error("Os checks não pertencem ao commit verificado.");
  }
  if (!Array.isArray(checks.commands) || checks.commands.length === 0) {
    throw new Error("Informe os comandos e resultados dos checks locais.");
  }
  for (const check of checks.commands) {
    if (typeof check.command !== "string" || !Number.isInteger(check.exitCode) || typeof check.output !== "string") {
      throw new Error("Cada check precisa de command, exitCode e output.");
    }
  }
  for (const command of ["npm test", "npm run lint", "npm run build"]) {
    if (!checks.commands.some((check) => check.command === command || check.command.startsWith(`${command} --`))) {
      throw new Error(`Falta o resultado de ${command}.`);
    }
  }
  // Falhas são encaminhadas ao verificador, nunca escondidas pelo launcher.
  return checks;
}

export function codexArguments(snapshot, outputFile) {
  return [
    "exec", "--ignore-user-config", "--strict-config", "--ephemeral", "--skip-git-repo-check",
    "-C", snapshot, "--output-last-message", outputFile,
    "-c", 'default_permissions=":read-only"',
    "-c", 'approval_policy="never"',
    "-c", "features.apps=false",
    "-c", "features.plugins=false",
    "-c", "features.memories=false",
    "-c", "features.request_permissions_tool=false",
    "-c", "agents.enabled=false",
    "-c", 'web_search="disabled"',
    "-c", "allow_login_shell=false",
    "-",
  ];
}

export function isSecretPath(file) {
  const parts = file.replaceAll("\\", "/").split("/");
  return parts.some((part) =>
    /^\.env(?:\..*)?$/.test(part) && part !== ".env.example"
    || [".codex", ".agents", ".git", ".aws", ".npmrc"].includes(part),
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8", windowsHide: true, shell: false, maxBuffer: 32 * 1024 * 1024, ...options,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Falha em ${command}. ${result.error?.message ?? result.stderr ?? ""}`);
  }
  return result.stdout;
}

export function parseArguments(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (!["--spec", "--commits", "--checks"].includes(key) || !args[index + 1] || values[key]) {
      throw new Error("Use --spec <caminho> --commits <base>..<fim> --checks <checks.json>.");
    }
    values[key] = args[index + 1];
  }
  if (!["--spec", "--commits", "--checks"].every((key) => values[key])) {
    throw new Error("Spec, intervalo de commits e checks são obrigatórios.");
  }
  if (!/^[A-Za-z0-9_/-]+(?:\.[A-Za-z0-9_/-]+)*\.\.[A-Za-z0-9_/-]+(?:\.[A-Za-z0-9_/-]+)*$/.test(values["--commits"])) {
    throw new Error("Intervalo inválido: informe base..fim, sem opções ou comandos.");
  }
  return values;
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  const root = run("git", ["rev-parse", "--show-toplevel"]).trim();
  const [baseRef, headRef] = args["--commits"].split("..");
  const git = (values, options) => run("git", values, { cwd: root, ...options });
  const base = git(["rev-parse", "--verify", `${baseRef}^{commit}`]).trim();
  const revision = git(["rev-parse", "--verify", `${headRef}^{commit}`]).trim();
  git(["merge-base", "--is-ancestor", base, revision]);
  const specPath = args["--spec"].replaceAll("\\", "/");
  if (path.isAbsolute(specPath) || specPath.split("/").includes("..") || !specPath.startsWith("docs/specs/")) {
    throw new Error("A spec precisa estar dentro de docs/specs/.");
  }
  git(["cat-file", "-e", `${revision}:${specPath}`]);
  if (isSecretPath(args["--checks"])) {
    throw new Error("O arquivo de checks não pode ser configuração local ou segredo.");
  }
  const checksText = readFileSync(path.resolve(args["--checks"]), "utf8");
  let parsedChecks;
  try { parsedChecks = JSON.parse(checksText); } catch {
    throw new Error("O arquivo de checks não é JSON válido; conteúdo omitido.");
  }
  const checks = validateChecks(parsedChecks, revision);

  const entries = git(["ls-tree", "-rz", revision]).split("\0").filter(Boolean);
  for (const entry of entries) {
    const file = entry.slice(entry.indexOf("\t") + 1);
    if (entry.startsWith("120000") || entry.startsWith("160000")) {
      throw new Error("A auditoria isolada não aceita symlinks ou submódulos.");
    }
    if (isSecretPath(file)) {
      throw new Error("O commit contém configuração local ou arquivo de segredo. Auditoria cancelada.");
    }
  }

  const packet = mkdtempSync(path.join(tmpdir(), "empresti-verificador-"));
  const snapshot = path.join(packet, "snapshot");
  mkdirSync(snapshot);
  const archive = git(["archive", "--format=tar", revision], { encoding: null });
  run("tar", ["-xf", "-", "-C", snapshot], { input: archive });
  writeFileSync(path.join(snapshot, "checks-verificacao.json"), JSON.stringify(checks, null, 2));
  writeFileSync(path.join(snapshot, "alteracoes-verificadas.diff"), git(["diff", base, revision, "--"]));
  const instructions = readFileSync(path.join(snapshot, "agents/verificador-spec.md"), "utf8");
  const outputFile = path.join(packet, "relatorio.md");
  const prompt = `${instructions}\n\nEntradas desta execução:\nSpec: ${specPath}\nBase: ${base}\nCommit: ${revision}\nChecks: checks-verificacao.json\nDiff: alteracoes-verificadas.diff\nEsta pasta é um snapshot do commit, não o checkout original. Leia as fontes novamente. Os checks já foram executados pelo agente principal; não execute scripts que escrevam arquivos. Não há configuração de produção neste pacote.\n`;
  const safeEnvNames = ["PATH", "Path", "SystemRoot", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "CODEX_HOME"];
  const env = Object.fromEntries(safeEnvNames.filter((name) => process.env[name]).map((name) => [name, process.env[name]]));
  const result = spawnSync("codex", codexArguments(snapshot, outputFile), {
    cwd: snapshot, env, input: prompt, encoding: "utf8", windowsHide: true, shell: false,
    timeout: 10 * 60 * 1000, maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || !existsSync(outputFile)) {
    console.error("A execução restrita do verificador falhou. Nenhum veredito foi aprovado.");
    console.error(result.error?.message ?? result.stderr ?? "Sem relatório.");
    process.exitCode = 1;
    return;
  }
  const report = readFileSync(outputFile, "utf8");
  const reportDirectory = path.join(root, "docs", "verificacoes", path.basename(path.dirname(specPath)));
  mkdirSync(reportDirectory, { recursive: true });
  const date = new Date().toISOString().replaceAll(":", "-");
  const evidence = `<!-- base=${base}; commit=${revision}; checks_sha256=${createHash("sha256").update(checksText).digest("hex")} -->\n${report}`;
  const savedReport = path.join(reportDirectory, `${date}-${revision.slice(0, 8)}.md`);
  writeFileSync(savedReport, evidence);
  console.log(report);
  console.log(`Relatório salvo: ${path.relative(root, savedReport)}`);
  if (!/^Veredito: PRONTA(?:\s|$)/m.test(report)) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
