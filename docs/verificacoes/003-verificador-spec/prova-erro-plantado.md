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
- Os checks posteriores à restauração estão em `checks-29f8b1c-restaurado.json`, vinculados à revisão `29f8b1c8dd9ed95df3adb09466c8ab6ac3891e73`: 8 testes unitários e 3 E2E passaram, assim como lint e build com Webpack.
- A auditoria `2026-11-05T12-42-23.478Z-29f8b1c8.md` ainda reprovou CA-04 por faltar o histórico verificável, embora os checks estivessem verdes. Seu arquivo de resultados anterior aos diffs foi preservado como `checks-29f8b1c-sem-diffs.json`.
- Os diffs reais de `git show` e os blobs idênticos dos testes antes/depois foram anexados aos checks, sem alterar código ou testes. A nova auditoria `2026-11-05T12-43-52.471Z-29f8b1c8.md` devolveu PRONTA, com todos os quatro critérios atendidos.

## Isolamento observado

- Codex CLI instalado: `0.164.0-alpha.11.1`.
- `codex sandbox -P :read-only` negou a tentativa de criar um arquivo temporário no workspace: `ESCRITA_BLOQUEADA`. Nenhum arquivo foi criado.
- No mesmo perfil, a tentativa TCP sem credenciais a `example.com:443` retornou `REDE_BLOQUEADA`, código `EACCES`.
- As duas primeiras auditorias foram inconclusivas por bloqueio de leitura via shell; os relatórios foram preservados. Não foram consideradas aprovação.
- A auditoria sem ferramentas conseguiu examinar as fontes e identificou falhas reais nos testes do launcher. As correções foram realizadas no agente principal.

## Limites desta prova

Esta prova cobre a infraestrutura de verificação, não o login ou os empréstimos. Não cria usuário, migration, dado ou imagem no Supabase. Nenhum push foi executado durante a prova, portanto a revisão com falha não foi enviada para deploy.

A conta do professor não foi utilizada. Os E2E desta etapa usam somente Git e arquivos temporários locais; não há identidade de teste no código da aplicação nem mock de Prisma.
