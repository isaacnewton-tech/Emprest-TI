# Testes
> leitor: agente

## Quando
Ao escrever, alterar ou remover qualquer teste.

## Procedimento
1. Testes rodam contra o banco local. Nunca contra o remoto.
2. O nome do teste cita o critério que ele prova: test_ca_03_...
3. Teste de endpoint verifica status E corpo.
4. Tabela com política de acesso tem um teste que prova o bloqueio:
   o mesmo dado, com outro usuário, não retorna.

## Verificação
`npm test` e `npm run test:e2e` passam. Testcontainers aplica as migrations em PostgreSQL descartável novo em cada suíte.

## Não faça
- Não substitua Prisma/PostgreSQL por mocks nos testes de integração.
- Não rode reset ou testes contra o Supabase remoto.
- A simulação de identidade nos E2E fica somente em tests/: nunca crie login de teste no código da aplicação.
