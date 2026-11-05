---
name: imagens-equipamentos
description: Buscar, revisar e preparar fotos dos equipamentos do EmpresTI pela API do Pixabay, com tamanho e proveniência verificados. Use para imagens do catálogo ou do seed; não use para logos, landing pages ou upload em produção.
---

# Imagens de equipamentos

Seguir rules/, o ADR e a spec aprovada. Pixabay substitui Pexels por decisão do professor comunicada pelo usuário. A lista em assets/equipamentos.json é a fonte dos 12 itens; não trocar patrimônio, nome, categoria ou situação para facilitar a busca.

## Preparar e revisar

Antes de consultar a API ou revisar fotos, ler [references/pixabay-e-revisao.md](references/pixabay-e-revisao.md).

Executar a partir da raiz do projeto:

```sh
node skills/imagens-equipamentos/scripts/imagens.mjs buscar
node skills/imagens-equipamentos/scripts/imagens.mjs previa TI-0001 ID_DA_FOTO
node skills/imagens-equipamentos/scripts/imagens.mjs preparar
```

Buscar consulta os termos da lista, com cache de 24 horas. Previa só aceita ID presente nos resultados desse equipamento. Examinar a prévia em tamanho integral, não apenas a miniatura. Registrar em `.image-work/revisoes.json` o hash da prévia, responsável, data, observação e cada condição visual. O formato está na referência.

Reprovar pessoas, marca/logo legível, texto, tela com conteúdo ou categoria errada. Não transformar safesearch em aprovação visual. Registrar cada reprovação com motivo; procurar outro candidato do próprio Pixabay. Não fabricar aprovações para fechar os 12 itens.

Preparar só libera o conjunto completo com revisões válidas, JPEG 800×600, IDs e hashes únicos. Resultados ficam em `.image-work/export/`, com manifesto de origem, licença e nomes estáveis. Nenhum resultado com revisão pendente é foto pronta para o seed.

## Chave e publicação

A credencial fica em `.local-secrets/pixabay.key`, ignorada pelo Git. Não imprimi-la, passá-la em argumento, colocá-la em código/cache/manifesto ou usar prefixo público. O preparador não lê `.env` nem recebe credenciais do Supabase.

Antes de entregar um pacote pronto, ler [references/publicacao-manual.md](references/publicacao-manual.md). Os scripts não têm modo de upload. Publicar no banco ou Storage do deploy é execução do usuário, conforme a prática. Não substituir isso por browser, SDK, curl ou outro caminho de publicação.

## Conferir a entrega

Executar os testes e checks aplicáveis e a validação da skill. Apresentar o que foi validado por código, quais imagens foram inspecionadas, quais foram recusadas e o que depende da execução manual. Para a futura interface, manter “Fotos: Pixabay” com link e preservar os créditos individuais no manifesto.
