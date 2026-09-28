# Spec 001 — Tela inicial de login

## Escopo

- A rota `/` e a rota `/login` exibem a mesma tela inicial.
- A interface é em português do Brasil e somente no modo escuro.
- O layout segue a tela 01 de `layout.md`: painel de marca à esquerda e formulário à direita.
- O formulário contém e-mail e senha, com validação de campos obrigatórios e formato de e-mail.
- O acesso depende de autenticação por convite de Operações; a integração com Supabase Auth será tratada junto da camada de autenticação.
- Enquanto a integração não existe, o formulário informa ao usuário que o acesso está indisponível e não cria sessão.

## Critério de aceitação

- **CA-14 — Interface:** as duas rotas mostram a tela de login responsiva, acessível por teclado e alinhada ao design em `layout.md`.
