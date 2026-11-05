# Plano — Skill de imagens de equipamentos

Infraestrutura da prática, autorizada pelo usuário como entrega 2. A fonte Pixabay foi explicitamente escolhida pelo professor. sharp é a biblioteca solicitada pela prática; Vitest e Playwright já pertencem ao ADR.

1. Criar `skills/imagens-equipamentos/SKILL.md`, referências curtas de API/revisão e publicação manual, lista dos equipamentos e scripts locais.
2. Usar chave em arquivo ignorado, sem adicionar configuração à aplicação ou carregar segredos do Supabase. Consultar e baixar por um cliente que só aceite GET nos hosts do Pixabay, com redirecionamentos verificados.
3. Cachear consultas por 24 horas e guardar candidatos localmente. Gerar prévias 800×600 para revisão visual e contato com seus hashes.
4. Exigir revisão explícita para cada seleção. Preparar manifesto e arquivos estáveis somente quando as 12 seleções passarem pelas validações e pela deduplicação.
5. Testar as invariantes com imagens locais geradas apenas como fixtures de teste; essas fixtures não entram no catálogo. Validar a skill e executar os checks do projeto.
6. Consultar a API real com a chave fornecida e inspecionar candidatos reais. Registrar as fotos recusadas e seus motivos. Não inventar aprovações para completar a quantidade.
7. Auditar a implementação com o verificador. O upload no bucket público fica como execução manual do usuário, sem comando remoto na skill.

Referências: https://pixabay.com/api/docs/ e https://pixabay.com/service/license-summary/. O crédito no catálogo é mantido pelo contrato da prática; a licença genérica não dispensa o registro de origem e a revisão de direitos de terceiros.

## Aditamento autorizado — recortes e conclusão do lote

O usuário autorizou recortes sem geração ou retoque de conteúdo e pediu concluir a entrega 2 antes de iniciar a 4. Implementar uma tarefa de recorte com sharp sobre a prévia inteira já obtida pela API. Guardar cada variante separadamente, vinculada ao hash e à geometria da origem. Recalcular o recorte no export para impedir alterações de conteúdo fora dessa operação. Uma mesma foto de origem continua proibida em dois equipamentos, mesmo com recortes diferentes.

Depois, revisar os sete itens restantes, mantendo as reprovações anteriores. Só concluir o lote local com 12 imagens distintas e revisão real de todos os arquivos finais, manifesto completo, repetição idempotente e auditoria visual independente. O usuário publica no Storage; essa confirmação permanece distinta da preparação local.
