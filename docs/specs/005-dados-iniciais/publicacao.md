# Publicação dos dados iniciais

O responsável pelo projeto executa os comandos de produção abaixo. O agente conferiu as imagens com leitura pública e valida a migração e o seed em PostgreSQL descartável local.

## 1. Conferir as fotos e o pacote

As 12 fotos do bucket público equipamentos foram conferidas após o upload. Cada GET de TI-0001 a TI-0012 retornou HTTP 200, JPEG e o mesmo SHA-256 do manifesto aprovado.

Use a pasta extraída de entregas/02-imagens-equipamentos.zip que contém manifest.json e suporte_ti/. Os objetos no Supabase ficam como suporte_ti/TI-0001.jpg até suporte_ti/TI-0012.jpg. Se precisar verificar um deles de novo, abra a URL pública em janela anônima. [Formato de URL pública no Supabase](https://supabase.com/docs/guides/storage/serving/downloads)

Para ver o resultado no navegador, abra a [foto pública do TI-0001](https://hhzamdyvwatmgmllapyo.supabase.co/storage/v1/object/public/equipamentos/suporte_ti/TI-0001.jpg).

## 2. Conferir as contas no Auth

No projeto Supabase correto, abra **Authentication → Users**.

- Procure marcelo.grilo@institutojef.org.br. Se estiver ausente, use **Add user → Create new user**, informe a senha combinada pela turma no campo do painel e confirme o e-mail conforme o procedimento da prática. Copie o **User UID** exibido para esse e-mail.
- Procure isaacmaifrinodias@gmail.com e copie seu **User UID**. Confira que é diferente do UID do professor.

O comando abaixo lê só os dois UIDs. Use o painel para administrar senhas. Os dois vínculos da aplicação serão Colaborador em suporte_ti. [Gerenciamento de usuários no Supabase](https://supabase.com/docs/guides/auth/managing-user-data)

## 3. Aplicar a migração e rodar o seed

Use Node.js 22 e execute na raiz do repositório. Antes de aplicar a migração, confira que DIRECT_URL em .env é a conexão do mesmo projeto na porta 5432, com TLS e sem pgbouncer=true. A URL NEXT_PUBLIC_SUPABASE_URL deve ser a do projeto das fotos. DATABASE_URL continua sendo a URL de runtime da aplicação.

~~~powershell
npm ci
npm run db:generate
npm run db:migrate
~~~

Continue após db:migrate concluir com sucesso. Esse script executa Prisma Migrate Deploy. [Aplicação de migrações em produção no Prisma](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/development-and-production)

~~~powershell
$professorUid = Read-Host 'User UID do professor no Supabase Auth'
$contaTesteUid = Read-Host 'User UID da conta de teste no Supabase Auth'
npm run db:seed -- --pacote '.\entregas\02-imagens-equipamentos' --professor-id $professorUid --teste-id $contaTesteUid --confirmar-producao
~~~

Ajuste --pacote se extraiu o ZIP em outra pasta. A primeira execução em banco limpo deve listar 12 patrimônios criados, dois vínculos Colaborador e zero empréstimos criados. Em nova execução, os itens aparecem como sincronizados ou preservados. Um papel preexistente diferente de Colaborador cancela a transação e pede conferência dos UIDs.

## 4. Verificar os dados e o login

1. No **Table Editor** do Supabase, confirme o tenant suporte_ti em tenants e os 12 registros correspondentes em equipment. TI-0004, TI-0007 e TI-0010 devem começar em manutenção. Os outros nove devem começar disponíveis.
2. Em memberships, confira os dois UIDs e o papel colaborador no mesmo tenant.
3. Com a revisão que inclui o login publicada, abra o endereço de produção pelo painel **Deployments** da Vercel. Em janela anônima, teste o login do professor e confirme que chega à área autenticada. Depois, faça os testes manuais de empréstimo com a sua conta.
4. O seed cria zero empréstimos. Quando a entrega 4 habilitar **Meus empréstimos**, confirme na conta do professor que a lista está vazia. Até lá, a área autenticada informa que o catálogo está em preparação.

Para repetir a carga, execute o mesmo comando com os mesmos UIDs e o pacote validado. O seed preserva os campos de equipamentos com first_used_at preenchido.
