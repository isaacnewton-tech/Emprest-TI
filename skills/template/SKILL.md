---
name: <nome-em-kebab-case>          # igual ao nome da pasta
description: <o que faz>. Use quando <situação 1>, <situação 2> ou quando
  o usuário falar em <palavra que ele usaria>. Não use para <vizinho
  que pode confundir>.
paths: "<glob opcional>"            # extensão: nem todo harness lê
# disable-model-invocation: true    # extensão: só roda chamada pelo nome
---

<!-- Modelo: copie esta pasta para skills/<nome>/ e substitua os placeholders.
Remova campos opcionais e pastas de apoio que não forem necessários.
Este arquivo é um template, não uma skill pronta para execução. -->

# <nome legível>

## Antes de começar
<o que precisa existir: spec, critérios de aceitação (CA), ADR. Se faltar, pare.>

Em conflito, `rules/` e `docs/adr/` vencem esta skill.

## Procedimento
1. <passo verificável>
2. <passo verificável — aponte para references/ quando o detalhe for longo e diga quando ler>

## Verificação
<o comando, o script ou a saída que prova que foi bem feito>

## Não faça
- <o erro concreto que esta skill existe para evitar>
