# Tarefas — Skill de imagens de equipamentos

| Tarefa | Trabalho | Critérios | Estado |
|---|---|---|---|
| I01 | Definir skill, referências, lista exata, dependência sharp e arquivos locais ignorados. | CA-01, CA-04, CA-05 | Concluído para c4aad6b |
| I02 | Implementar e testar cliente com cache, processamento, revisão por hash, deduplicação e export idempotente. | CA-01 a CA-05 | Concluído para c4aad6b |
| I03 | Validar a skill, consultar a API real, registrar revisão e executar checks finais e auditoria. | CA-01 a CA-05 | Concluído para c4aad6b; veredito PRONTA |
| I04 | Implementar recortes autorizados com variantes, preservação da origem e verificação determinística dos bytes, com testes. | CA-02, CA-03, CA-04 | Concluído para 09bf0ed |
| I05 | Completar as 12 fotos, revisar os arquivos finais, gerar o pacote idempotente e obter nova auditoria visual. | CA-01 a CA-05 | Concluído para 09bf0ed com veredito PRONTA |

O usuário executa a publicação no Supabase. Ausência de imagem adequada ou de revisão não é preenchida por foto de outra fonte.

O lote real tem 12 fotos aprovadas, cinco integrais e sete recortes. O ZIP `entregas/02-imagens-equipamentos.zip` contém o manifesto e os 12 JPEG. O manifesto preserva as 55 recusas e a revisão de cada foto aprovada. O verificador inspecionou as 12 fotos finais e confirmou todos os critérios.

Os recortes foram autorizados pelo usuário em 05/11/2026. A revisão `09bf0ed37c46a071a5e09770f20d2dbcb77e762c` passou em 48 testes Vitest, 13 Playwright, lint, build com Webpack, validação da skill e conferência do pacote. O relatório `docs/verificacoes/004-imagens-equipamentos/2026-11-05T23-15-45.597Z-09bf0ed3.md` registra o veredito PRONTA.

A primeira versão foi verificada em `docs/verificacoes/004-imagens-equipamentos/2026-11-05T14-04-38.314Z-c4aad6bb.md`, com 21 testes Vitest, 7 E2E de CLI, lint e build com Webpack. As reprovações anteriores continuam registradas junto das correções.
