# Plano — Acionamento restrito do verificador

Entrega de infraestrutura solicitada pelo usuário ao autorizar as cinco etapas da prática, uma por vez. Não é funcionalidade nova do PRD.

1. Adicionar a regra de testes fornecida pelo usuário e registrar as decisões da prática, sem alterar o texto do enunciado.
2. Separar os checks locais da sessão de leitura. O agente principal registra os resultados e o SHA; o verificador examina fontes e evidências, sem rodar build que escreve em .next.
3. Usar o Codex CLI instalado em sessão independente e efêmera. Selecionar explicitamente o perfil :read-only, impedir pedidos de escalada e desabilitar apps/plugins. Não alterar permissões globais do usuário.
4. Preparar o snapshot com git archive, sem .git ou arquivos não versionados. Rejeitar segredos conhecidos, symlinks e submódulos antes da execução. Herdar somente o ambiente mínimo necessário ao launcher.
5. Testar as validações do launcher com Vitest, já previsto no ADR. Conferir também uma negação de escrita real pelo sandbox.
6. Fazer a prova de erro plantado no controle de revisão dos checks, obter a tabela e desfazer a falha em outro commit local. Não fazer push da falha para não acionar a Vercel.

O protocolo de entrada e saída continua em agents/verificador-spec.md. Relatórios versionáveis ficam em docs/verificacoes/. Configuração local e .env não são enviados para a auditoria.

Referências técnicas consultadas: https://learn.chatgpt.com/docs/agent-configuration/subagents e https://learn.chatgpt.com/docs/permissions. Instrução textual de somente leitura não cria isolamento; o perfil precisa ser aplicado à sessão.
