# Tarefas — Dados iniciais

Executar após aprovação de `plan.md`, uma tarefa por vez. Nenhuma tarefa foi implementada.

| Tarefa | Trabalho | Critérios | Estado |
|---|---|---|---|
| D01 | Descrever e criar schema e migration com unicidade, primeiro uso, RLS e políticas; provar aplicação em banco limpo e bloqueio entre tenants. | CA-01, CA-02, CA-05 | Pendente |
| D02 | Implementar validação do pacote e seed transacional idempotente com preservação de itens usados e membership Colaborador. | CA-01 a CA-04 | Pendente |
| D03 | Testar a CLI e preparar roteiro humano de Auth, upload, migrations, seed e conferência do deploy. | CA-03 a CA-06 | Pendente |
| D04 | Executar os checks, submeter ao verificador e registrar limitações reais de produção. | CA-01 a CA-06 | Pendente |

Dependências: login da spec 002, lote completo da spec 004 e Docker ativo para os testes. A etapa de solicitar empréstimo deverá marcar o primeiro uso na mesma transação que cria o empréstimo.
