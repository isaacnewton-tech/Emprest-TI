# Tarefas — Dados iniciais

Executar após aprovação de `plan.md`, uma tarefa por vez.

| Tarefa | Trabalho | Critérios | Estado |
|---|---|---|---|
| D01 | Descrever e criar schema e migration com unicidade, primeiro uso, RLS e políticas; provar aplicação em banco limpo e bloqueio entre tenants. | CA-01, CA-02, CA-05 | Migração aplicada em PostgreSQL descartável, com dois testes de RLS aprovados |
| D02 | Implementar validação do pacote e seed transacional idempotente com preservação de itens usados e membership Colaborador. | CA-01 a CA-04 | Seed implementado, com três testes de integração aprovados |
| D03 | Testar a CLI e preparar roteiro humano de Auth, upload, migrations, seed e conferência do deploy. | CA-03 a CA-06 | Três cenários Playwright aprovados e roteiro em publicacao.md |
| D04 | Executar os checks, submeter ao verificador e registrar limitações reais de produção. | CA-01 a CA-06 | PRONTA para b99a17d com os seis critérios atendidos |

Dependências: login da spec 002, lote completo da spec 004 e Docker ativo para os testes. A etapa de solicitar empréstimo deverá marcar o primeiro uso na mesma transação que cria o empréstimo.

O relatório de b99a17d está em docs/verificacoes/005-dados-iniciais/2026-11-06T00-20-56.858Z-b99a17d2.md. A migração e o seed no Supabase ainda são etapas do responsável pelo projeto. O roteiro está em publicacao.md.
