# Instruções para agentes

## Escopo e fontes de verdade

- O produto é o sistema interno de empréstimo de equipamentos descrito em `docs/PRD.md`.
- As decisões de arquitetura estão em `docs/adr/001-stack.md` e devem ser seguidas.
- `layout.md` define a interface, os fluxos, o idioma (português do Brasil) e o tom de copy seco e operacional. Pode ser alterado quando necessário.
- Arquivos existentes em `docs/` não podem ser modificados. É permitido adicionar novos conteúdos à pasta.

## Implementação

- Siga os padrões técnicos detalhados em `rules/implementation.md`.
- Siga `rules/secrets.md` ao lidar com variáveis de ambiente ou chaves.
- Siga `rules/migration.md` ao alterar o schema.

## Qualidade e validação

- Aplique os critérios de `rules/checks.md` antes de concluir uma tarefa.

## Entrega e operações

- Aplique o contrato de `rules/operacao.md` para commits e push.
- Migrations, seeds e deploys podem ser executados quando a tarefa exigir.
- Ao relatar a conclusão, informe as verificações executadas e quaisquer limitações.
