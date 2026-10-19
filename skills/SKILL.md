---
name: <nome-em-kebab-case>          # igual ao nome da pasta
description: <o que faz>. Use quando <situação 1>, <situação 2> ou quando
  o usuário falar em <palavra que ele usaria>. Não use para <vizinho
  que pode confundir>.
paths: "<glob opcional>"            # extensão: nem todo harness lê
# disable-model-invocation: true    # extensão: só roda chamada pelo nome
---

# <nome legível>

## Antes de começar
<o que precisa existir: spec, CA, ADR. Se faltar, pare.>

## Procedimento
1. <passo verificável>
2. <passo verificável — aponte para references/ quando o detalhe for longo>

## Verificação
<o comando, o script ou a saída que prova que foi bem feito>

## Não faça
- <o erro concreto que esta skill existe para evitar>