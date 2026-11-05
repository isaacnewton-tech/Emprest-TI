# Tarefas — Skill de imagens de equipamentos

| Tarefa | Trabalho | Critérios | Estado |
|---|---|---|---|
| I01 | Definir skill, referências, lista exata, dependência sharp e arquivos locais ignorados. | CA-01, CA-04, CA-05 | Concluído para c4aad6b |
| I02 | Implementar e testar cliente com cache, processamento, revisão por hash, deduplicação e export idempotente. | CA-01 a CA-05 | Concluído para c4aad6b |
| I03 | Validar a skill, consultar a API real, registrar revisão e executar checks finais e auditoria. | CA-01 a CA-05 | Concluído para c4aad6b; veredito PRONTA |
| I04 | Implementar recortes autorizados com variantes, preservação da origem e verificação determinística dos bytes, com testes. | CA-02, CA-03, CA-04 | Em andamento |
| I05 | Completar as 12 fotos, revisar os arquivos finais, gerar o pacote idempotente e obter nova auditoria visual. | CA-01 a CA-05 | Pendente |

O usuário executa a publicação no Supabase. Ausência de imagem adequada ou de revisão não é preenchida por foto de outra fonte.

O lote real tem 5 fotos aprovadas e 7 equipamentos ainda sem foto aceita. Isso mantém a exportação bloqueada e a entrega de dados iniciais dependente da seleção restante; não equivale a um pacote pronto para publicação.

Os recortes foram autorizados pelo usuário em 05/11/2026. A implementação da primeira versão continua verificada para c4aad6b; I04 e I05 precisam de evidências e veredito novos. Não iniciar a entrega 4 antes da conclusão da entrega 2, conforme orientação do usuário.

Evidência: `docs/verificacoes/004-imagens-equipamentos/2026-11-05T14-04-38.314Z-c4aad6bb.md`. Passaram 21 testes Vitest, 7 E2E de CLI, lint e build com Webpack. As duas reprovações anteriores foram preservadas junto das correções.
