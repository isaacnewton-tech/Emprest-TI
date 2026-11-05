# Lote de 12 fotos — entrega 2

Preparado em 05/11/2026, após a autorização para recortar sem gerar ou retocar conteúdo. As cinco aprovações anteriores foram preservadas. Os sete recortes passaram por nova inspeção do JPEG final 800×600; o programa recalcula os bytes pela prévia original e geometria antes de exportar.

Pacote: `entregas/02-imagens-equipamentos.zip`. Contém somente `manifest.json` e os 12 JPEG em `suporte_ti/`. O manifesto preserva autor, página de origem, licença, busca, revisão, hashes, geometria e todas as recusas. As imagens em `lote-final/` são cópias idênticas dos arquivos do ZIP para auditoria visual.

| Patrimônio | ID Pixabay | Arquivo inspecionado | Enquadramento |
|---|---|---|---|
| TI-0001 | 6856557 | lote-final/TI-0001.jpg | Notebook aberto de lado, tela preta; corte 0,35,600,500. |
| TI-0002 | 3036166 | lote-final/TI-0002.jpg | Notebook aberto isolado, tela branca; integral. |
| TI-0003 | 593327 | lote-final/TI-0003.jpg | Notebook aberto; caneta com inscrição fora do corte 0,30,620,290. |
| TI-0004 | 958882 | lote-final/TI-0004.jpg | Notebook fechado de lado; mão e logo fora do corte 185,155,590,160. |
| TI-0005 | 17894 | lote-final/TI-0005.jpg | Monitor com suporte e tela branca; integral. |
| TI-0006 | 1868496 | lote-final/TI-0006.jpg | Painel frontal do monitor, tela branca; corte 230,145,320,190 acima do logo. |
| TI-0007 | 820277 | lote-final/TI-0007.jpg | Painel frontal do monitor, tela escura; corte 135,115,490,295 acima do logo. |
| TI-0008 | 643728 | lote-final/TI-0008.jpg | Conector e cabo HDMI; integral. |
| TI-0009 | 4498745 | lote-final/TI-0009.jpg | Conector USB-C; integral. |
| TI-0010 | 494649 | lote-final/TI-0010.jpg | Conectores RJ45; integral. |
| TI-0011 | 1163880 | lote-final/TI-0011.jpg | Webcam de videoconferência, lente, articulação e base; corte 95,112,610,425 sem a marca acima da lente. |
| TI-0012 | 6917213 | lote-final/TI-0012.jpg | Frente da câmera compacta, flash e lente retrátil; corte 310,169,163,153 sem mão ou marca. |

As fotos representam as categorias. Polegadas, resolução e metragem pertencem aos dados da lista; não são inferidas das fotos. Os recortes dos monitores mostram o painel, sem suporte. A câmera compacta fica ampliada pelo recorte. Esses limites de enquadramento foram considerados na revisão e permanecem visíveis para a auditoria.

## Recusas preservadas

O histórico passou de 46 para 67 revisões vinculadas a patrimônio e hash: 12 aprovadas e 55 recusadas. A contagem inclui versões integrais e recortes, não 67 fotos distintas. O registro anterior continua em `api-real.json`; o manifesto do ZIP traz o histórico completo.

Nesta rodada, foram recusadas 11 imagens integrais: 3737334 (Primebook/Intel e teclas), 958882 (mão e Apple), 8594571 (smartphone), 2179058 (mão e lentes avulsas), 6759179 (lente intercambiável e inscrições), 6917213 (mão e Kodak), 3174729 (composição com conteúdo de tela), 1362419 (Fujifilm e inscrições), 819359 (Canon e lente, não compacta), 1163878 (Hikvision, vigilância) e 820277 para TI-0007 (Apple, periféricos e teclado). As recusas das integrais continuam ligadas aos hashes originais mesmo quando um recorte diferente foi aceito.

Também foram recusados três recortes: 4607652 fechado demais na lente; 551287 reduzido quase só ao LCD; primeira variante de 820277 sem borda inferior completa. Nenhuma recusa foi apagada para liberar a exportação.

## Publicação e limite da entrega

O pacote é preparado localmente. O usuário extrai o ZIP e envia somente os JPEG ao bucket público `equipamentos`, com objetos `suporte_ti/TI-0001.jpg` a `suporte_ti/TI-0012.jpg`. Repetir o envio substituindo os mesmos nomes. Conferir cada URL pública sem autenticação. O manifesto é documentação de origem e não precisa ser publicado no bucket.

Não houve alteração de `.env`, Vercel, banco ou Storage remoto. A chave do Pixabay permanece no arquivo local ignorado. A publicação humana é um passo separado e não foi declarada realizada. Antes da entrega 4, este lote precisa do veredito da auditoria independente.
