# Publicação manual pelo usuário

O agente prepara `.image-work/export/`, mas não escreve no Storage ou banco do deploy. O preparador só faz GET em hosts do Pixabay e não carrega `.env`, SDK ou chave de serviço do Supabase. Esse limite do programa não substitui os controles de permissão do harness: não conceder ao agente ferramentas de escrita em produção.

Quando houver 12 fotos aprovadas e um manifesto validado:

1. O usuário cria ou escolhe o bucket público `equipamentos` no Supabase.
2. O usuário envia os JPEG aos caminhos `suporte_ti/TI-0001.jpg` até `suporte_ti/TI-0012.jpg`, conforme `storageKey` do manifesto. Ao repetir, substituir o mesmo objeto, em vez de criar outro nome.
3. Conferir, sem autenticação, se cada URL pública abre a foto correta. Não considerar a existência do arquivo local como prova de upload.
4. A etapa de dados iniciais registra as URLs públicas dos objetos enviados, não os links temporários do Pixabay. Seed e migrations de produção também são executados pelo usuário.

O pacote não leva a chave do Pixabay, arquivo de ambiente ou credencial Supabase. Não implementar opção `upload` nesta skill. Quando o catálogo existir, mostrar “Fotos: Pixabay” com link para https://pixabay.com/; preservar origem, autor e licença de cada foto no manifesto.
