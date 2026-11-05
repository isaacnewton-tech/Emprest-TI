## Quando
Ao iniciar qualquer funcionalidade nova do PRD.

## Procedimento
1. Crie docs/specs/<NNN-nome-curto>/ com spec.md.
2. Antes de escrever a spec, liste as perguntas que o PRD não
   responde. Espere as respostas.
3. plan.md sai da spec e cita os ADRs que o restringem.
4. tasks.md sai do plano. Cada tarefa cita um CA-xx e cabe
   num commit.
5. Uma tarefa por vez. Ao terminar, siga rules/checks.md.

## Não faça
- Não escreva código antes do plano aprovado.
- Não crie pasta de spec fora do padrão NNN-nome-curto.

## Antes de declarar uma spec pronta
- Delegue ao subagente verificador-spec (agents/verificador-spec.md),
  passando o caminho da spec e o intervalo de commits.
- A spec só é pronta com "Veredito: PRONTA". Qualquer outro resultado
  volta para as tarefas — quem corrige é o agente principal, nunca o
  verificador.
- A verificação de entrega usa `npm run verify:spec -- --spec
  docs/specs/<NNN-nome>/spec.md --commits <base>..<fim> --checks
  <resultados-locais.json>`. O launcher cria um snapshot do commit,
  sem configuração local, e abre uma sessão independente somente
  leitura, sem shell, apps/plugins nem escalada de permissões. As
  fontes versionadas são fornecidas por inteiro, com linhas, como
  entrada da auditoria; não se herda a conversa do agente principal.
- O agente principal executa os checks locais antes da auditoria e
  registra revisão, comando, código de saída e saída em JSON. Não
  marque uma spec pronta com resultados de outro commit.
- Guarde as tabelas reais em `docs/verificacoes/`, incluindo as
  reprovações. A referência do commit permite comparar as rodadas.
- Quando o pacote completo ultrapassar o limite do launcher, os checks
  podem declarar `sourceFiles` com um escopo textual explícito. O
  launcher exige todos os arquivos de código, testes, scripts, regras,
  contexto compartilhado, pasta da spec e arquivos alterados. Só
  documentos de outras specs e verificações anteriores podem ficar
  fora do texto, mantendo caminho e hash no inventário. Não truncar
  fontes nem omitir dependências necessárias à prova de um CA.
