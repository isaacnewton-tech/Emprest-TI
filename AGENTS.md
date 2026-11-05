# EmpresTI

Sistema que substitui a planilha de controle de empréstimo de equipamentos internos (notebooks, monitores, cabos, câmeras). Atende dois perfis: Colaborador — que consulta o catálogo, solicita itens e registra devolução — e Operações — que cadastra equipamentos e acompanha todos os empréstimos em aberto.

Negócio em `docs/PRD.md`. Stack decidida em `docs/adr/001-stack.md`.

---

## Onde olhar

- `docs/PRD.md` — problema, quem usa, escopo e regras de negócio da v1. Não é spec técnica.
- `docs/adr/` — decisões de arquitetura e stack já tomadas, com justificativa.
- `docs/specs/<NNN-funcionalidade>/` — spec, plano e tarefas de cada feature (ainda não existe).
- `layout.md` — especificação visual completa: cores, tipografia, espaçamento, componentes e as seis telas da v1. Design system Nocturne, somente modo escuro.
- `rules/` — como se trabalha aqui. Leia `rules/restrictions.md` sempre (ainda não existe).

---

## Comandos

- rodar o projeto: `<COMANDO-DEV>`
- rodar os testes: `<COMANDO-TESTES>`
- buildar: `npm run build` (gera o Prisma Client e executa o build do Next.js)

Build validado nesta máquina em 19/10/2026. Os comandos de desenvolvimento e testes ainda não foram validados.

---

## Ambiente

- Banco: Supabase (nuvem). O desenvolvimento acontece no projeto Supabase remoto.
- Deploy: Vercel, ligada ao repositório remoto. Push na branch principal publica.
- Variáveis de ambiente: ver `.env.example`. Nunca use prefixo `NEXT_PUBLIC_` para segredos; a `service_role` key do Supabase só pode aparecer em código de servidor.

---

## Arquitetura em uma linha

Next.js (App Router) · tRPC · Prisma · Supabase Auth + PostgreSQL · Tailwind · shadcn/ui — monolito, repositório único, deploy único na Vercel.

---

## Padrões que não se negocia

- **Camadas**: Router tRPC → Service → Prisma. Regra de negócio fica no Service; o Router cuida de entrada, contexto e permissão.
- **Validação**: Zod no `.input()` de todo procedimento tRPC, sem exceção.
- **Acesso a dado**: exclusivamente via tRPC. Não buscar dado direto pelo Prisma em Server Components nem pelo cliente do Supabase.
- **Mutação**: exclusivamente via tRPC. Não usar Server Actions.
- **Tenant**: sempre injetado pelo `tenantProcedure` a partir da sessão, nunca lido do input.
- **Schema**: Prisma Migrate é o único dono. Não rodar comandos do Supabase CLI que alterem schema.
- **Tipos**: `RouterInputs` e `RouterOutputs` inferidos do `AppRouter`; nunca declarar tipo de retorno de procedimento à mão.
- **TypeScript**: modo `strict`. Sem `any` implícito.
- **Autorização**: usar `protectedProcedure`, `tenantProcedure` ou `adminProcedure` conforme o caso. RLS existe como defesa adicional, não como autorização primária.

---

## Testes

- Runner: Vitest (servidor e componentes).
- Banco nos testes de integração: Testcontainers com Postgres real. Não mockar o Prisma.
- Procedimentos: testados via `createCaller` com contexto montado à mão.
- E2E: Playwright.
- Obrigatório por procedimento: um caso de isolamento de tenant (tenant A não enxerga dado de tenant B).
- Sem meta de cobertura por percentual; caminhos críticos são obrigatórios.

---
## Skills
- Ficam em skills/<nome>/SKILL.md.
- No início de cada tarefa, leia só o frontmatter (name e description)
  de cada skill. Carregue o corpo do SKILL.md apenas quando a tarefa
  casar com a description; abra references/ só quando o SKILL.md mandar.
- Em conflito, rules/ e docs/adr/ vencem qualquer skill.
---

## Precedência

Se dois artefatos discordarem sobre comportamento, a spec (`docs/specs/`) vence o código.
Se algo não estiver escrito em lugar nenhum, pergunte — não decida.

---

## Procedimentos

_(vazio por enquanto)_

## Subagentes
- Ficam em agents/<nome>.md. O frontmatter diz quando delegar; o
  corpo é a instrução completa do subagente.
- Subagente não herda esta conversa: ao delegar, passe tudo que o
  arquivo dele pede como entrada.
- Se o harness não tiver subagentes, abra uma sessão nova e comece
  com: "Aja conforme agents/<nome>.md." e as entradas pedidas.