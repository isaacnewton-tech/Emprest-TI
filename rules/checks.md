---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa
> leitor: agente

## Quando
Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento
1. Rode os testes aplicáveis e registre o resultado.
2. Se a tarefa tocou em migration, valide-a em banco local limpo seguindo
   `rules/migration.md`.
3. Rode `npm run lint` e `npm run build` antes de concluir e antes de
   qualquer push.
4. Rode `git status --short`. Só podem aparecer arquivos do escopo
   da tarefa.
5. Diga qual critério de aceitação (CA-xx) esta tarefa atende.

Os testes aplicáveis incluem Vitest, Testing Library, Testcontainers com
Postgres real e Playwright, conforme o ADR. Cada procedimento tRPC deve
ter um teste de isolamento em que o tenant A não acessa dados do tenant B.
Se os testes não puderem ser executados, registre o motivo e o que ficou
sem verificação. Não estabeleça meta percentual de cobertura; cubra os
caminhos críticos.

## Verificação
Pronto = os checks aplicáveis terminaram sem falha e `git status --short`
mostra somente arquivos do escopo.

## Não faça
- Não relate sucesso parcial. Teste vermelho é tarefa não terminada,
  mesmo que o código "esteja certo".
- Não tente consertar a mesma falha duas vezes seguidas sem me mostrar
  a saída do erro.
- Não rode teste contra o banco remoto.
