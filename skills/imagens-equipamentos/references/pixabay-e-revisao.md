# API e revisão das fotos

Fonte: https://pixabay.com/api/docs/ (consultada em 05/11/2026).

Consultar GET https://pixabay.com/api/ com a chave local, q, image_type=photo, safesearch=true, orientation=horizontal, min_width=800, min_height=600 e per_page=10. Cachear resultados por 24 horas. Respeitar 429 e os cabeçalhos de limite; não repetir em laço nem baixar uma coleção inteira. URLs do provedor servem para busca/prévia; o uso definitivo exige download e hospedagem própria.

Guardar ID, pageURL, user, user_id, largeImageURL e dimensões dos candidatos. Nunca guardar a URL da requisição com key. Licença de referência: Pixabay Content License, https://pixabay.com/service/terms/; resumo: https://pixabay.com/service/license-summary/.

Se os resultados da busca original forem inadequados, usar uma consulta alternativa pontual, como `buscar TI-0001 laptop`. A lista original não é alterada; a consulta efetiva fica em `queryUsed`. Não ampliar para download em massa ou outra fonte.

## Revisão vinculada ao arquivo

A prévia processada é o arquivo final: JPEG 800×600, com ajuste contain. Inspecionar o arquivo inteiro. Não confundir personagem, mão ou reflexo de pessoa com fundo neutro; verificar logos na tampa, borda, suporte e lente, texto e qualquer conteúdo de tela.

Em `.image-work/revisoes.json`, usar um objeto com `approved` e `rejected`:

```json
{
  "approved": [
    {
      "patrimonio": "TI-0001",
      "photoId": 123,
      "imageSha256": "HASH_DA_PREVIA_INSPECIONADA",
      "reviewer": "responsável pela inspeção",
      "reviewedAt": "data ISO da revisão",
      "notes": "observações concretas da imagem",
      "noPeople": true,
      "noReadableBrands": true,
      "noText": true,
      "noScreenContent": true,
      "correctEquipment": true
    }
  ],
  "rejected": [
    { "patrimonio": "TI-0001", "photoId": 456, "reason": "logo legível na tampa" }
  ]
}
```

Esses valores são exemplo de formato, não revisão real. O script valida a estrutura e o hash, mas não enxerga pessoas, marcas ou texto. Quem faz a inspeção responde por essa avaliação. Hash diferente exige nova inspeção; `false` ou campo ausente bloqueia o export. Manter as reprovações, com seus motivos, para o ENTREGA.md.

Uma imagem não pode constar como aprovada e reprovada para o mesmo patrimônio e hash. Reprovação sem hash bloqueia o ID inteiro para aquele patrimônio. Isso preserva as reprovações das fotos integrais quando um recorte diferente foi inspecionado e aprovado. Cada nova execução valida o conjunto atual: se ele deixou de ser válido, o pacote anterior sai de `export/` e é preservado em `.image-work/quarentena/`. Arquivos extras também retiram o pacote anterior da área de publicação; um novo pacote completo o substitui. A quarentena é histórico local, nunca material para upload.

## Recortes autorizados

Somente corte retangular e redimensionamento contain, sem conteúdo gerado ou retocado. O equipamento deve continuar reconhecível. As coordenadas left/top/width/height são inteiras, positivas nas dimensões e limitadas à prévia integral 800×600. Exemplo de comando: `recortar TI-0001 123 20 40 600 400`. Não existe modo de máscara, remoção, blur ou retoque.

O comando preserva a prévia integral, salva `ID-crop-HASH.jpg` e uma seleção separada com geometria, hash da base e proveniência. Inspecionar o novo JPEG inteiro; incluir na nova aprovação o campo `variant` exatamente como impresso pelo comando, além do novo `imageSha256`. O hash antigo não aprova o recorte. Não apagar o histórico de reprovações. O manifesto registra a transformação, e a preparação recalcula a imagem para provar que somente a geometria autorizada foi aplicada. Mesmo com recortes distintos, um ID do Pixabay só pode atender um equipamento.
