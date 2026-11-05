# Spec 002 — Login com Supabase Auth

## Objetivo

Conectar o formulário existente aos usuários de e-mail e senha do projeto Supabase configurado, com sessão mantida pelo servidor.

## Fontes e decisões existentes

- `docs/PRD.md`: login individual para Colaborador e Operações.
- `docs/adr/001-stack.md`: Supabase Auth com e-mail e senha, cadastro fechado, `@supabase/ssr`, cookies `httpOnly`, renovação de sessão e acesso pela API tRPC.
- `docs/specs/001-login-front.md`: formulário e validação existentes; o aviso de indisponibilidade vale apenas enquanto não houver integração.
- `layout.md`: identidade Nocturne, textos em português e destino `/catalogo` após o login.

## Perguntas de negócio

Não há decisão de negócio adicional necessária para autenticar as contas já existentes com e-mail e senha. Provisionamento de tenant, criação de convites e concessão de papéis ficam fora desta spec. Autenticar uma conta não concede acesso a dados de domínio nem cria vínculo de tenant.

## Escopo

- `/` e `/login` continuam exibindo o formulário existente para visitantes.
- O formulário envia e-mail e senha a um procedimento tRPC validado por Zod.
- O service usa Supabase Auth para verificar as credenciais; o navegador não recebe tokens na resposta da API.
- O servidor grava e renova a sessão por `@supabase/ssr`, em cookies `httpOnly`, `SameSite=Lax` e `Secure` em produção.
- O login válido redireciona para `/catalogo`. Como o catálogo ainda não foi implementado, essa rota oferece somente uma área autenticada mínima, com confirmação da sessão e opção de sair. Não apresenta inventário ou empréstimos fictícios.
- Visitantes não acessam a área autenticada. Usuários autenticados são encaminhados da tela de login para a área autenticada.
- A renovação verifica a identidade no Supabase; cookies ou dados enviados pelo cliente não são prova suficiente de autenticação.
- A saída encerra a sessão do navegador atual, limpa os cookies correspondentes e retorna ao login.
- Erros de credenciais, indisponibilidade e envio em andamento aparecem em português, sem revelar existência de contas, detalhes internos ou segredos.
- Requisições de mutação devem respeitar a mesma origem. Senhas e tokens não são registrados em logs.
- São usadas as variáveis existentes de URL do Supabase e chave pública. A chave `service_role` não participa da autenticação do formulário.
- Esta etapa não cria nem altera tabelas, contas, senhas ou configurações do Supabase remoto.

## Critérios de aceite

| ID | Critério |
|---|---|
| CA-01 | Credenciais válidas de uma conta existente autenticam pelo procedimento tRPC e encaminham para `/catalogo`, com cookies de sessão protegidos e sem tokens no retorno da API. |
| CA-02 | E-mail inválido ou senha vazia são rejeitados no formulário e no procedimento; credenciais recusadas exibem mensagem genérica e não criam sessão. |
| CA-03 | A área autenticada rejeita sessão ausente ou inválida e impede o acesso direto de visitantes; uma sessão válida encaminha o usuário que abrir o login para `/catalogo`. |
| CA-04 | A renovação usa o provedor de identidade, atualiza os cookies com as mesmas proteções e trata sessão expirada sem liberar conteúdo protegido. |
| CA-05 | Sair encerra a sessão do navegador atual e limpa seus cookies; o acesso seguinte à área autenticada volta ao login. |
| CA-06 | A interface mantém o layout responsivo existente, bloqueia envios duplicados enquanto aguarda a API e apresenta estados de erro acessíveis em português. |
| CA-07 | Nenhum token ou segredo é incluído no retorno da API ou no bundle do cliente; mutações de outra origem são rejeitadas; autenticação não aceita tenant ou papel fornecido pelo cliente nem concede acesso a dados de domínio. |

## Fora de escopo

- Cadastro público, convite de usuários, primeiro acesso por convite e recuperação ou troca de senha.
- Modelagem de `memberships`, escolha de tenant, concessão de papéis e migrations.
- Implementação do catálogo, dos empréstimos e das telas de Operações.
- Alteração de variáveis na Vercel, publicação automática ou mudanças no projeto Supabase remoto.
- Testes automatizados que criem contas ou usem credenciais de usuários reais no Supabase remoto.

## Validação

- Testes Vitest, com os IDs dos CAs nos nomes, para os procedimentos via `createCaller`, o service e a manipulação de cookies.
- Testing Library para validação, envio em andamento e mensagens do formulário.
- Verificação do fluxo de navegação com Playwright usando o provedor de identidade controlado no ambiente de teste, sem criar acesso alternativo em produção.
- O provedor externo pode ser substituído nos testes na fronteira do service. Prisma não é simulado: esta spec não acessa tabelas de domínio.
- `npm run lint`, build e revisão de exposição de segredos. Falta de credenciais de uma conta de teste deve ser registrada como limitação do teste real de ponta a ponta.
