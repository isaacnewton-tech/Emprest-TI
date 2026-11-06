# Tarefas — Solicitar empréstimo

Executar em ordem após aprovação do plano. Cada tarefa tem um commit próprio.

| Tarefa | Trabalho | Critérios | Estado |
|---|---|---|---|
| E01 | Criar a migração de empréstimos, estado emprestado, índices, FKs e auditoria. Exercitar RLS e migração em banco descartável novo e após o seed. | CA-02, CA-03, CA-07, CA-09 | Migração validada em banco novo e após o seed |
| E02 | Injetar Prisma e vínculo no contexto, proteger as rotas e implementar leitura de catálogo, detalhe e empréstimos próprios via tRPC. Testar autorização, filtros e isolamento por procedimento. | CA-01, CA-08, CA-09 | Pendente |
| E03 | Implementar calendário de São Paulo e cálculo de prazo. Provar as três abrangências de feriado, datas móveis, virada de ano e o limite entre no prazo e em atraso. | CA-04, CA-06 | Pendente |
| E04 | Criar a mutação transacional, registrar o primeiro uso e auditoria e provar recusas e concorrência com PostgreSQL real. | CA-02 a CA-07, CA-09 | Pendente |
| E05 | Conectar Catálogo, Detalhe, confirmação e Meus empréstimos, com fotos, crédito, estados e erros acessíveis. Verificar a jornada em desktop e mobile com Playwright local. | CA-01 a CA-10 | Pendente |
| E06 | Rodar checks, obter a auditoria independente e preparar os passos de migração e conferência no deploy. | CA-01 a CA-10 | Pendente |
