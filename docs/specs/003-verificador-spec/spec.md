# Spec 003 — Acionamento restrito do verificador

## Escopo

Entrega 1 da prática SDD. Tornar a verificação independente do histórico da conversa e separada da execução dos checks que geram arquivos. Não alterar funcionalidades do produto.

## Critérios de aceite

| ID | Critério |
|---|---|
| CA-01 | O acionamento exige checks locais vinculados ao SHA exato sob revisão, incluindo testes, lint e build. Falhas são encaminhadas ao verificador e não descartadas. |
| CA-02 | O verificador recebe um snapshot versionado sem .env, configuração de credenciais ou symlinks. A sessão é somente leitura, sem apps, plugins, busca web, escalada ou credenciais de produção no ambiente herdado. |
| CA-03 | Spec e intervalo concretos são obrigatórios. A tabela é guardada com a revisão, a base e o hash dos checks para comparar rodadas. |
| CA-04 | O verificador aponta erros sem corrigir fontes ou testes. Uma prova controlada mostra reprovação de erro plantado, seguida de correção em outro commit, sem enviar a falha para produção. |

## Fora de escopo

Login, seed, dados de produção, imagens de equipamentos e regras de empréstimos. A prova usa a infraestrutura do verificador; as tabelas finais das specs de dados e empréstimos serão produzidas depois que essas features existirem.

## Restrições

Checks de integração usam somente PostgreSQL descartável local, conforme `rules/tests.md`. O launcher não executa migrations ou comandos remotos. Se a versão do Codex não aceitar os controles de permissão, a execução falha sem declarar aprovação.
