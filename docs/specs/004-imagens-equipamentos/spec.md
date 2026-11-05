# Spec 004 — Skill de imagens de equipamentos

## Objetivo

Entrega 2 da prática: preparar localmente fotos dos 12 equipamentos, com a API do Pixabay no lugar do Pexels, conforme autorização do professor comunicada pelo usuário. Não implementar catálogo, seed ou upload em produção nesta etapa.

## Contrato

- Fonte exclusiva: API HTTPS do Pixabay e URLs de imagem retornadas por ela. Somente fotos, sem outras fontes, scraping ou geração de imagens.
- Preservar os 12 registros e buscas da lista da prática. TI-0004, TI-0007 e TI-0010 ficam em manutenção; os outros nove disponíveis.
- Gerar JPEG de exatamente 800×600, sem distorcer a foto. Preservar a imagem com ajuste contain e fundo branco; remover metadados da foto processada.
- Não usar a mesma foto em dois equipamentos. Verificar ID do provedor e SHA-256 do arquivo processado.
- Pessoas, marcas ou logos legíveis, texto e tela com conteúdo exigem reprovação visual. Também reprovar foto que não represente a categoria solicitada. A API safesearch não garante esses requisitos.
- A revisão deve registrar responsável, data, observações e hash do arquivo visualizado. Não aprovar imagem sem examiná-la. Aprovação textual sem correspondência de hash não libera o export.
- Registrar ID, página da foto, autor, perfil do autor, licença, consulta, dimensões, hash e crédito para cada equipamento. A futura interface deverá mostrar “Fotos: Pixabay” com link.
- Respeitar cache de consultas por 24 horas, limite de requisições, timeout e limites de tamanho. Não usar hotlink permanente no produto.
- Guardar a chave somente em arquivo local ignorado `.local-secrets/pixabay.key`. Não criar variável de aplicação ou de Vercel para uma credencial usada apenas na preparação local. A chave não aparece em argumentos, mensagens, cache ou manifesto.
- Os scripts só consultam Pixabay por GET e preparam arquivos locais. Não carregam .env, chaves do Supabase, SDK de upload ou comandos de publicação. O usuário faz o upload para bucket público e usa nomes de objetos estáveis.

## Critérios de aceite

| ID | Critério |
|---|---|
| CA-01 | O cliente consulta apenas a API do Pixabay e baixa apenas URLs HTTPS do provedor retornadas pela API; usa cache de 24 horas, métodos GET e erros que não exponham a chave. |
| CA-02 | O processamento verifica JPEG 800×600 e rejeita ID ou hash repetido; repetir a preparação não duplica arquivos nem registros. |
| CA-03 | O export rejeita revisão ausente, reprovada, incompleta ou vinculada a outro hash. Aprovação depende da revisão visual real, não de safesearch ou metadados. |
| CA-04 | Um export bem-sucedido contém manifesto com os 12 patrimônios da lista, as três situações de manutenção corretas e a proveniência e licença de cada imagem. Um lote real incompleto permanece bloqueado, sem preencher fotos faltantes. |
| CA-05 | A preparação não usa credenciais do Supabase nem oferece upload. O pacote traz somente fotos aprovadas e manifesto; a publicação pública e idempotente é executada pelo usuário. |

## Validação

Vitest testa processamento real com sharp, cache, cliente HTTP controlado e invariantes do manifesto. Playwright testa a CLI sem chave e o bloqueio de export incompleto. Os testes não chamam APIs externas nem banco remoto. O uso real do Pixabay fica registrado separadamente, com revisão das fotos e limites honestos de conclusão.

## Fora de escopo

Mudanças em produção, cadastro de contas, empréstimos, catálogo, escolha de fotos sem inspeção e garantia automática de ausência de pessoas ou marcas.
