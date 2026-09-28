---
description: Padrões técnicos para implementar o produto
globs: []
alwaysApply: true
---

# Padrões de implementação

- Use npm como gerenciador de pacotes e mantenha TypeScript em modo `strict`.
- O projeto é um monolito Next.js com App Router. Use tRPC como caminho de dados; não introduza Server Actions nem um segundo caminho de acesso ao banco.
- Organize a API por domínio em `src/server/api/routers/<dominio>.ts` e preserve a sequência Router → Service → Prisma.
- Valide a entrada de todos os procedimentos tRPC com Zod e use os tipos inferidos do `AppRouter` no cliente.
- Siga `rules/migration.md` para migrations, RLS, policies e triggers.
- Preserve o isolamento multi-tenant: o `tenant_id` vem da sessão no contexto, nunca do input; toda tabela de domínio possui `tenant_id`; procedimentos devem aplicar o filtro de tenant.
- Use os middlewares de autorização previstos (`protectedProcedure`, `tenantProcedure` e `adminProcedure`).
- Para interface, use Tailwind CSS, shadcn/ui, React Hook Form com `zodResolver` e o design especificado em `layout.md`.
