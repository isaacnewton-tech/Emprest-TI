# Revisão real das imagens — rodada de 05/11/2026

Foram inspecionados os arquivos JPEG 800×600 de 46 candidatas da API do Pixabay. Cinco foram aprovadas e 41 recusadas. O registro completo em `api-real.json` contém página da fonte, autor, licença, consulta efetiva, hash, responsável, data e motivo de cada avaliação. Os arquivos locais ficam em `.image-work/candidates/`, fora do Git.

| Patrimônio | ID aprovado | Observação |
|---|---|---|
| TI-0002 | 3036166 | Notebook de perfil, tela vazia e nenhuma inscrição legível no arquivo final. |
| TI-0005 | 17894 | Monitor com tela vazia sobre fundo branco. |
| TI-0008 | 643728 | Cabo e conector HDMI sem inscrições legíveis. |
| TI-0009 | 4498745 | Conector USB-C em primeiro plano, sem inscrições legíveis. |
| TI-0010 | 494649 | Conectores RJ45 coloridos sobre fundo branco. |

As fotos representam os tipos dos equipamentos. Polegadas, metragem e resolução não são inferidas da imagem.

Ainda faltam fotos aprovadas e distintas para TI-0001, TI-0003, TI-0004, TI-0006, TI-0007, TI-0011 e TI-0012. Entre as recusas há mãos e pessoas, logos na tampa ou moldura, inscrições em lentes e conectores, texto em objetos da cena, telas com conteúdo e categoria incorreta. Resultados classificados como `photo` pela API também exigiram recusa visual por serem ilustrações ou mockups inadequados.

O comando real `node skills/imagens-equipamentos/scripts/imagens.mjs preparar` terminou com código 1 e a mensagem “O export exige exatamente 12 revisões aprovadas, uma por equipamento.” Nenhum diretório de export foi gerado. As imagens sintéticas dos testes ficam em diretórios temporários e não substituem fotos da lista.

O validador da skill retornou `Skill is valid!` usando Python em UTF-8. A primeira execução com a codificação padrão do Windows falhou ao decodificar acentos; o arquivo da skill foi preservado em UTF-8. O PyYAML usado pelo validador fica apenas no diretório local ignorado, sem acrescentar dependência Python à aplicação.

Não houve upload nem alteração no Supabase remoto, no `.env` ou na Vercel. A integração do catálogo com as URLs do Storage pertence às próximas etapas. A implementação da skill pode ser auditada, mas o conjunto real de 12 fotos e a publicação ainda estão pendentes.
