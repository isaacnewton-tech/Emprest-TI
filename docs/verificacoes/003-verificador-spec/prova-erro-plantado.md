# Prova controlada do verificador

## Falha plantada

- Revisão: `9f81aaadf8666fa04b7a3dbab4c4a02995367f90`.
- O controle de `validateChecks` foi alterado para aceitar revisão divergente quando não vazia. Isso permitiria associar resultados de testes de um commit a outro.
- Os testes não foram alterados. `test_ca_01_rejeita_checks_de_outra_revisao` falhou e o E2E `test_ca_01_ca_03_launcher_real_rejeita_checks_de_outro_commit` também falhou.
- Os resultados reais estão em `checks-9f81aaa-erro-plantado.json`: 1 teste unitário falhou, 7 passaram; 1 E2E falhou, 2 passaram. Lint e build passaram.
- O verificador apontou CA-01 REPROVADO e devolveu NÃO PRONTA. Tabela completa: `2026-11-05T12-36-57.123Z-9f81aaad.md`.
- O verificador não corrigiu código ou testes. A auditoria rodou sem shell, apps ou plugins, recebendo as fontes versionadas com linhas.

## Restauração

- Revisão: `4f7c5b66ad6366d404b4f830f56db28ed582a139`.
- O commit restaura somente a condição original de comparação do SHA. Nenhum teste foi removido ou afrouxado.
- Comparação verificável: `git diff 9f81aaa..4f7c5b6 -- scripts/verificar-spec.mjs`.
- Os checks posteriores à restauração serão anexados à auditoria final com o SHA exato. Esta nota não substitui os resultados dos testes nem antecipa o veredito final.

## Isolamento observado

- Codex CLI instalado: `0.164.0-alpha.11.1`.
- `codex sandbox -P :read-only` negou a tentativa de criar um arquivo temporário no workspace: `ESCRITA_BLOQUEADA`. Nenhum arquivo foi criado.
- No mesmo perfil, a tentativa TCP sem credenciais a `example.com:443` retornou `REDE_BLOQUEADA`, código `EACCES`.
- As duas primeiras auditorias foram inconclusivas por bloqueio de leitura via shell; os relatórios foram preservados. Não foram consideradas aprovação.
- A auditoria sem ferramentas conseguiu examinar as fontes e identificou falhas reais nos testes do launcher. As correções foram realizadas no agente principal.

## Limites desta prova

Esta prova cobre a infraestrutura de verificação, não o login ou os empréstimos. Não cria usuário, migration, dado ou imagem no Supabase. Nenhum push foi executado durante a prova, portanto a revisão com falha não foi enviada para deploy.

A conta do professor não foi utilizada. Os E2E desta etapa usam somente Git e arquivos temporários locais; não há identidade de teste no código da aplicação nem mock de Prisma.
