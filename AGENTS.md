# Instruções para agentes

## Escopo e fontes de verdade

- O produto é o sistema interno de empréstimo de equipamentos descrito em `docs/PRD.md`.
- As decisões de arquitetura estão em `docs/adr/001-stack.md` e devem ser seguidas.
- `layout.md` define a interface, os fluxos, o idioma (português do Brasil) e o tom de copy seco e operacional. Pode ser alterado quando necessário.
- Arquivos existentes em `docs/` não podem ser modificados. É permitido adicionar novos conteúdos à pasta.

## Implementação

- Trabalhe diretamente na branch `main`.
- Use npm como gerenciador de pacotes.
- Mantenha TypeScript em modo `strict`.
- O projeto é um monolito Next.js com App Router. Use tRPC como caminho de dados; não introduza Server Actions nem um segundo caminho de acesso ao banco.
- Organize a API por domínio em `src/server/api/routers/<dominio>.ts` e preserve a sequência Router → Service → Prisma.
- Valide a entrada de todos os procedimentos tRPC com Zod e use os tipos inferidos do `AppRouter` no cliente.
- Use Prisma Migrate como dono único do schema. Inclua RLS, policies e triggers como SQL bruto nas migrations do Prisma.
- Preserve o isolamento multi-tenant: o `tenant_id` vem da sessão no contexto, nunca do input; toda tabela de domínio possui `tenant_id`; procedimentos devem aplicar o filtro de tenant.
- Use os middlewares de autorização previstos (`protectedProcedure`, `tenantProcedure` e `adminProcedure`) e mantenha segredos, incluindo a chave `service_role`, apenas no código de servidor.
- Para interface, use Tailwind CSS, shadcn/ui, React Hook Form com `zodResolver` e o design especificado em `layout.md`.

## Qualidade e validação

- Mantenha scripts npm para lint e build.
- Antes de concluir uma tarefa, execute obrigatoriamente `npm run lint` e `npm run build`.
- Execute os testes aplicáveis quando possível. Testes incluem Vitest, Testing Library, Testcontainers/Postgres real e Playwright conforme o ADR; o isolamento entre tenants deve ter um caso por procedimento.
- Se testes não puderem ser executados, isso não bloqueia a entrega, mas registre claramente o motivo e o que deixou de ser verificado.
- Não introduza uma meta percentual de cobertura; cubra os caminhos críticos.

## Entrega e operações

- Crie commits e faça push na `main` quando necessário.
- Migrations, seeds e deploys podem ser executados quando a tarefa exigir.
- Ao relatar a conclusão, informe as verificações executadas e quaisquer limitações.
