---
description: Contrato de operacao entre mim e o agente neste projeto
globs: []
alwaysApply: true
---

# Contrato de operação

## Git
> leitor: agente

- Commit: O agente commita cada tarefa
- Branch: trabalhar diretamente na `main`, conforme `AGENTS.md`
- Push: fazer push na `main` quando necessário, conforme `AGENTS.md`
- A mensagem de commit cita a tarefa e o critério de aceitação.
- Um commit por tarefa. Nunca junte código e mudança de regra
  no mesmo commit.

## Autorização por tipo de ação
> leitor: agente

| Ação                              | Regra |
|-----------------------------------|-------|
| Editar arquivo no escopo          | Livre |
| Criar arquivo novo                | Avise na conclusão |
| Deletar ou renomear arquivo       | Avise na conclusão |
| Instalar ou atualizar dependência | Livre quando necessário à tarefa |
| Criar ou alterar migration        | Siga `rules/migration.md` |
| Alterar variável de ambiente      | Siga `rules/secrets.md` |

## Configuração do operador
> leitor: humano — isto não é instrução para o agente

| fase                              | modelo / raciocínio |
|-----------------------------------|---------------------|
| Escrever a spec                   | raciocínio alto     |
| Planejar e quebrar em tarefas     | raciocínio alto     |
| Executar uma tarefa já decidida   | rápido              |
| Debugar algo que quebrou          | raciocínio alto     |
| Revisar o diff antes do commit    | padrão              |

- Revisão de diff acontece em sessão limpa, de preferência com
  modelo diferente do que escreveu o código.
- Sessão longa não se corrige com regra mais enfática: encerre
  seguindo rules/handoff.md e abra outra.
