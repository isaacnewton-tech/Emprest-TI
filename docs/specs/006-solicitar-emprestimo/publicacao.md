# Publicação — Solicitar empréstimo

Depois do veredito **PRONTA**, siga esta ordem.

1. Em **Settings → Environment Variables** da Vercel, confirme que `DATABASE_URL` está definida em **Production** com o pooler de transações do mesmo projeto Supabase, na porta `6543`. Siga os parâmetros de TLS e pooling de [`.env.example`](../../../.env.example). A API do catálogo e dos empréstimos usa essa variável no servidor. As duas variáveis públicas de autenticação usadas pelo login continuam com os valores atuais.
2. No checkout local que contém a [nova migração](../../../prisma/migrations/20261106024731_solicitar_emprestimo/migration.sql), confira se `DIRECT_URL` em `.env` é a conexão direta ou o pooler de sessão na porta `5432` do projeto de produção. O responsável pelo Supabase executa `npm run db:migrate` na raiz do repositório. O comando deve informar que aplicou `20261106024731_solicitar_emprestimo` ou que a revisão já estava aplicada. A migração acrescenta as tabelas vazias de empréstimos e auditoria e preserva o inventário e os vínculos já inseridos.
3. Após a migração, publique a revisão verificada na branch `main` e aguarde a implantação da Vercel.
4. Entre com a conta de teste. Confira os 12 itens com fotos, o crédito e os três itens em manutenção (`TI-0004`, `TI-0007` e `TI-0010`). Abra um item disponível, confirme e confira a data em **Meus empréstimos**. O item deve aparecer como **Emprestado** no catálogo.
5. Entre com a conta do professor apenas para conferência de login, catálogo e lista vazia de empréstimos. A solicitação do passo anterior fica restrita à conta de teste.
