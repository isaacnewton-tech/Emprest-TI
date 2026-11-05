# Tarefas — Login com Supabase Auth

Executar após aprovação de `plan.md`, uma tarefa por vez.

| Tarefa | Trabalho | Critérios | Situação |
|---|---|---|---|
| T01 | Configurar tRPC, provider do cliente, serialização e configuração de servidor validada, com testes de entrada e proteção de origem. | CA-02, CA-07 | Concluído; 25 testes, 7 E2E, lint, tipos e build passaram |
| T02 | Implementar service de autenticação e router `auth`, com cookies protegidos, identidade verificada e testes via `createCaller`. | CA-01, CA-02, CA-05, CA-07 | Pendente |
| T03 | Implementar renovação e guardas de sessão com testes de sessão ausente, inválida, expirada e renovada. | CA-03, CA-04 | Pendente |
| T04 | Conectar o formulário e a área autenticada mínima, com saída, redirecionamentos e testes de estados acessíveis. | CA-01, CA-03, CA-05, CA-06 | Pendente |
| T05 | Executar os testes do fluxo e os checks, revisar exposição de segredos e obter o veredito do subagente verificador. | CA-01 a CA-07 | Pendente |

Não atribuir tenant ou papel automaticamente a uma conta autenticada. Não implementar acesso ao catálogo de equipamentos nesta spec.
