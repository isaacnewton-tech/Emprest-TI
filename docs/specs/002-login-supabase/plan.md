# Plano — Login com Supabase Auth

## Estado

Aprovado pelo usuário em 05/11/2026, junto com o plano de dados iniciais. Executar antes da spec 005, uma tarefa por vez.

## Restrições de arquitetura

Seguir ADR-001: Next.js App Router, TypeScript strict, tRPC, Zod, superjson, React Query, Supabase Auth e `@supabase/ssr`. Sem Server Actions, autenticação no `localStorage`, acesso direto a tabelas pelo navegador ou uso da chave de serviço no login.

A cadeia de autenticação será Router tRPC → Service → Supabase Auth. Prisma será usado quando houver acesso a dados de domínio; não serão criados schema ou tabelas apenas para verificar identidade no provedor.

## Etapas

1. Adicionar as dependências da stack já decidida e a infraestrutura tRPC de servidor e cliente, com tipos inferidos do `AppRouter`, serialização superjson e tratamento de erro.
2. Criar configuração de servidor validada com Zod, aproveitando as variáveis existentes sem expor chaves no cliente. Criar o adaptador de cookies do `@supabase/ssr` e o contexto de identidade verificada.
3. Implementar procedimentos de autenticação, consulta de identidade e saída em `src/server/api/routers/auth.ts`, com entradas Zod e service separado. O procedimento de identidade usa `protectedProcedure`; nenhum procedimento aceita tenant ou papel no input.
4. Integrar a renovação de sessão ao interceptor de requisições do Next, com guardas para as rotas implementadas. No Next 16, usar a convenção de arquivo suportada para essa função, preservando o comportamento de middleware previsto no ADR.
5. Conectar o formulário atual ao cliente tRPC e criar a área autenticada mínima em `/catalogo`, com identidade verificada e saída. O catálogo de equipamentos continua fora do escopo.
6. Implementar os testes dos CAs, verificar lint e build e revisar cookies, proteção de origem e ausência de segredos no cliente.
7. Submeter o intervalo de commits ao `agents/verificador-spec.md`, com contexto limpo. Corrigir os itens apontados antes de declarar a spec pronta.

## Segurança e limites

- O cliente recebe apenas os dados mínimos de identidade necessários à interface, nunca a sessão bruta ou tokens.
- Cookies de autenticação são manipulados exclusivamente no servidor.
- A identidade autenticada não substitui `tenantProcedure` ou `adminProcedure` nas futuras funcionalidades de domínio.
- A área autenticada desta spec não lê dados de inventário, empréstimos ou tenants.
- Não executar testes contra banco de produção nem alterar configurações remotas.
- Se algum comportamento necessário contrariar o ADR, registrar o conflito antes de implementar.

## Ambiente

As variáveis públicas já existentes podem ser lidas apenas no servidor nesta implementação. A `SUPABASE_SERVICE_ROLE_KEY` não é necessária. A autenticação usa a API HTTPS do Supabase, não as URLs PostgreSQL ajustadas anteriormente.

## Verificação e entrega

Cada tarefa referencia os CAs e recebe um commit próprio. O plano não inclui push ou deploy automático. Após a verificação final, informar resultados dos testes, limitações de teste com contas reais e eventuais necessidades de configuração na Vercel.
