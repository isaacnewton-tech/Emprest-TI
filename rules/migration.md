---
description: Procedimento para qualquer mudança de schema
globs: ["prisma/migrations/**", "prisma/schema.prisma", "src/server/**"]
alwaysApply: false
---

# Mudança de schema
> leitor: agente

## Quando
Qualquer tarefa que precise criar, alterar ou remover tabela, coluna,
índice, constraint ou política de acesso — inclusive quando a mudança
parecer trivial.

## Procedimento
1. Descreva o DDL e seus efeitos como parte da tarefa antes de aplicá-lo.
2. Use Prisma Migrate como dono do schema e gere uma migration por tarefa
   com `npx prisma migrate dev --name <nome>`.
3. Toda tabela nova nasce com Row Level Security habilitada e pelo
   menos uma policy explícita na mesma migration. Tabela sem policy
   não entra no repositório.
4. Se a tabela já tem dado, diga o que acontece com as linhas
   existentes. Coluna obrigatória nova precisa de default ou de um
   passo de preenchimento.
5. Aplique e verifique a migration somente no banco local. Confirme que
   `DATABASE_URL` aponta para o banco local antes de executar comandos que
   alterem schema ou dados. Rode os testes aplicáveis.

## Verificação
As migrations do Prisma aplicam do zero em banco local limpo, sem erro e
sem passo manual.

## Não faça
- Não altere schema pelo Studio nem por SQL avulso. O que não está em
  migration não existe.
- Não edite migration que já foi para o repositório remoto. Escreva
  a próxima.
- Não toque no projeto Supabase remoto. Tudo acontece no local.
