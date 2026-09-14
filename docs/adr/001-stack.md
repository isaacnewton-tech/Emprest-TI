# ADR-001 — Stack

## Decisões

| Item | Escolha |
|---|---|
| Arquitetura | Monolito |
| Aplicação | Next.js (App Router), front e servidor no mesmo projeto |
| Repositório | Único |
| Deploy | Um projeto na Vercel |
| Camada de servidor | Route Handlers do Next, sem servidor separado |
| Linguagem | TypeScript em modo `strict` |
| Renderização | Client Components como padrão para telas com dados |
| Estado de servidor | TanStack Query via `@trpc/react-query` |
| Estado de cliente | `useState` e Context; sem biblioteca de store |
| Formulários | React Hook Form + `zodResolver` |
| Estilização | Tailwind CSS |
| Componentes | shadcn/ui |
| Padrão de API | tRPC |
| Endpoint | Route Handler em `app/api/trpc/[trpc]/route.ts` |
| Organização | `src/server/api/routers/<dominio>.ts`, um router por domínio |
| Camadas | Router (procedimento) → Service → Prisma |
| Validação de entrada | Zod no `.input()` de todo procedimento |
| Serialização | superjson |
| Contexto de request | Sessão, `tenant_id`, `role` e cliente Prisma montados no `createContext` |
| Server Actions | Não usadas |
| Fonte da verdade | O `AppRouter` do tRPC |
| Consumo no cliente | `RouterInputs` e `RouterOutputs` inferidos, sem tipo escrito à mão |
| Versionamento | Nenhum |
| Formato de erro | `TRPCError` com código, tratado por `errorFormatter` |
| Paginação de listas | Cursor, via `useInfiniteQuery` |
| Consumidor externo | Fora de escopo |
| Tempo real | Fora de escopo |
| Banco | PostgreSQL gerenciado pelo Supabase |
| ORM | Prisma |
| Dono do schema | Prisma Migrate (único) |
| RLS, policies e triggers | SQL bruto dentro das migrations do Prisma |
| Instância do Prisma | Singleton global, para sobreviver ao hot reload |
| Conexão de runtime | Supavisor, porta 6543, `?pgbouncer=true&connection_limit=1` |
| Conexão de migration | `directUrl`, porta 5432 |
| Seed | `prisma/seed.ts`, idempotente, cria o tenant `suporte_ti` |
| Modelo de multi-tenancy | Tenant discriminado por coluna, banco único |
| Coluna de tenant | `tenant_id` em toda tabela de domínio |
| Vínculo usuário–tenant | Tabela `memberships (user_id, tenant_id, role)` |
| Primeiro tenant | `suporte_ti`, criado no seed |
| Origem do tenant | Resolvido no `createContext` a partir da sessão, nunca do input |
| Aplicação do filtro | `tenantProcedure` injeta o `tenant_id` no service |
| Provedor de identidade | Supabase Auth, e-mail e senha |
| Cadastro | Fechado, somente por convite de administrador |
| Integração com o Next | `@supabase/ssr` |
| Sessão no navegador | Cookie `httpOnly`, escrito pelo `@supabase/ssr` |
| Renovação de sessão | Middleware do Next em toda rota |
| Autorização | Middlewares do tRPC: `protectedProcedure`, `tenantProcedure`, `adminProcedure` |
| RLS | Habilitado em todas as tabelas, deny by default |
| Papel do RLS | Defesa em profundidade, não autorização primária |
| Runner | Vitest, único para servidor e componentes |
| Componentes — testes | Testing Library |
| Integração de banco | Testcontainers com Postgres real |
| Teste de procedimento | `createCaller` do tRPC, chamando o router direto |
| E2E de interface | Playwright |
| Teste obrigatório de isolamento | Um caso por procedimento: tenant A não enxerga dado de tenant B |
| Meta de cobertura | Sem percentual; caminhos críticos obrigatórios |
| Hospedagem | Vercel, um projeto |
| Plano | Hobby |
| Região das functions | Padrão do Hobby (Estados Unidos) |
| Região do Supabase | `sa-east-1` (São Paulo) |
| Limite de execução | 60s por request |
| Fila e agendamento | Fora de escopo; tudo roda dentro do request |
| Configuração | Variáveis de ambiente validadas com Zod no boot |
| Log | Log estruturado em JSON, com `request_id` e `tenant_id` |
| Rastreamento de erro | Sentry |
| CI | GitHub Actions |
| Migration em deploy | `prisma migrate deploy` em job do GitHub Actions, antes do deploy |
| Cabeçalhos HTTP | Configurados em `next.config.js` |
| CSP | Restritiva, sem `unsafe-inline` |
| Rate limit | Por IP e por usuário, com contador no Postgres |
| Segredos | Environment variables da Vercel; nada com prefixo `NEXT_PUBLIC_` |
| `service_role` key do Supabase | Somente em código de servidor |
| Auditoria | Tabela append-only com ator, tenant, ação e recurso |
| Lint e formatação | ESLint + Prettier |
| Hook de pré-commit | lint-staged + husky, apenas lint e formatação |
| Convenção de commit | Nenhuma automação; mensagem escrita pela pessoa |

## Justificativas

- **Arquitetura** — não há equipe separada para front e back nem necessidade de escalar as partes de forma independente; separar criaria dois deploys, dois CI e uma fronteira HTTP para manter sem ganho.
- **Aplicação** — o servidor mora dentro do mesmo projeto do front, então a chamada de dados não atravessa domínio nem exige CORS.
- **Repositório** — o tipo do procedimento e o tipo consumido na tela são o mesmo símbolo TypeScript; em repositórios separados isso viraria arquivo gerado.
- **Deploy** — na Vercel cada rota vira uma function; o que é único é o codebase e o deploy, não o runtime.
- **Camada de servidor** — sem servidor separado, o front e o servidor ficam no mesmo projeto.
- **Linguagem** — sem `strict` o tipo que vem do tRPC não pega os casos de nulo, que são exatamente os que quebram em produção.
- **Renderização** — buscar dados direto no Prisma e também por tRPC cria dois caminhos de acesso a dado, com duas checagens de permissão para manter em sincronia.
- **Estado de servidor** — cache, revalidação e estado de loading já vêm resolvidos e tipados a partir do procedimento; escrever isso por tela é fonte de bug repetido.
- **Estado de cliente** — depois do TanStack Query sobra pouco estado de cliente (filtro, modal, wizard), e isso cabe em `useState`.
- **Formulários** — o mesmo schema Zod que valida a entrada do procedimento valida o formulário, então a regra é escrita uma vez.
- **Estilização** — o design vem do Figma e precisa ser reproduzido de perto; biblioteca com visual próprio brigaria com isso.
- **Componentes** — o componente fica dentro do repositório, então customizar não vira luta contra a dependência.
- **Padrão de API** — front e servidor no mesmo TypeScript fazem o tipo do retorno chegar na tela sem geração de código nem contrato escrito à mão.
- **Endpoint** — não decidido.
- **Organização** — por domínio, a feature inteira fica junta; por camada técnica, cada feature nova espalharia arquivo em pastas distantes.
- **Camadas** — o procedimento cuida de entrada, contexto e permissão; a regra de negócio no service dá para testar sem montar contexto de tRPC.
- **Validação de entrada** — sem Zod o procedimento aceita `unknown` e a validação vira `if` manual.
- **Serialização** — sem transformer, `Date` e `Decimal` chegam como string na tela e cada componente refaz a conversão.
- **Contexto de request** — resolver sessão e tenant uma vez evita repetir a leitura do cookie, que é onde alguém esquece e abre buraco.
- **Server Actions** — seriam um segundo caminho de mutação, com outra forma de validar e outra de checar permissão.
- **Fonte da verdade** — mudar o retorno de um procedimento quebra o build da tela que o consome, sem passo de geração.
- **Consumo no cliente** — declarar interface de resposta à mão recria a duplicação que o tRPC existe para eliminar.
- **Versionamento** — cliente e servidor sobem no mesmo deploy, então nunca existem duas versões em produção ao mesmo tempo.
- **Formato de erro** — dá formato único de erro para a tela tratar sem ler string de mensagem.
- **Paginação de listas** — offset fica lento e duplica registro quando a lista recebe escrita concorrente; `useInfiniteQuery` já espera cursor.
- **Consumidor externo** — se aparecer app mobile ou integração de terceiro, será preciso expor REST ao lado.
- **Tempo real** — function serverless não mantém conexão aberta; atualização de tela é polling do TanStack Query.
- **Banco** — traz Auth e Storage sem operar servidor de banco.
- **ORM** — a tipagem gerada a partir do schema evita divergência entre modelo e código e alimenta o tipo que o tRPC devolve.
- **Dono do schema** — dois donos de schema no mesmo banco se sobrescrevem e o ambiente diverge de produção sem ninguém notar.
- **RLS, policies e triggers** — o Prisma não modela esses objetos; eles entram na mesma linha do tempo versionada, não como script solto aplicado à mão.
- **Instância do Prisma** — sem singleton, cada hot reload abre cliente novo até esgotar a conexão.
- **Conexão de runtime** — em serverless cada instância abrindo pool próprio esgota a conexão do projeto.
- **Conexão de migration** — não decidido.
- **Seed** — seed que só funciona em banco vazio não serve para ambiente de teste que roda várias vezes.
- **Modelo de multi-tenancy** — schema por tenant multiplicaria cada migration pelo número de tenants sem exigência que justifique.
- **Coluna de tenant** — tabela sem `tenant_id` não tem como ser protegida por policy e vira buraco por onde o dado vaza.
- **Vínculo usuário–tenant** — a mesma pessoa pode atuar em mais de uma área com papel diferente em cada.
- **Primeiro tenant** — não decidido.
- **Origem do tenant** — se o cliente manda o tenant no input, trocar o valor é toda a exploração necessária.
- **Aplicação do filtro** — depender de cada service lembrar do filtro é depender de ninguém esquecer nunca.
- **Provedor de identidade** — não há domínio corporativo para federar, então SSO fica fora de escopo.
- **Cadastro** — sem domínio de e-mail para filtrar, cadastro aberto deixa qualquer pessoa com a URL criar conta num sistema que guarda inventário de infraestrutura.
- **Integração com o Next** — mesma origem permite cookie `httpOnly` mesmo em `*.vercel.app`, sem token legível por JavaScript.
- **Sessão no navegador** — mesma origem permite cookie `httpOnly` sem o token ficar legível por JavaScript.
- **Renovação de sessão** — sem middleware o token expira no meio da navegação e o usuário é deslogado sem motivo aparente.
- **Autorização** — as regras são estar logado, pertencer ao tenant e ser administrador; três middlewares cobrem isso.
- **RLS** — se uma credencial vazar ou um procedimento esquecer o middleware, a policy é a última barreira entre tenants.
- **Papel do RLS** — o Prisma conecta com role dono das tabelas, que bypassa RLS por padrão; fazer as policies valerem exigiria transação com `SET LOCAL` a cada request.
- **Runner** — um projeto só usa um runner para servidor e tela, com a mesma config do build.
- **Componentes — testes** — não decidido.
- **Integração de banco** — mockar o Prisma testa o mock; constraint, cascade, transação e policy só falham contra Postgres de verdade.
- **Teste de procedimento** — testa o procedimento com contexto montado à mão, incluindo middleware de sessão e tenant, sem subir HTTP.
- **E2E de interface** — login, abertura de chamado e cadastro de ativo precisam ser testados no navegador.
- **Teste obrigatório de isolamento** — vazamento entre tenants precisa ser verificado por teste, não por revisão.
- **Meta de cobertura** — meta de cobertura produz teste escrito para subir número; caminho crítico é critério verificável.
- **Hospedagem** — build, preview e roteamento funcionam sem adapter nem configuração extra.
- **Plano** — cobre uso pessoal não-comercial; se o sistema sair do contexto acadêmico, o plano precisa mudar antes.
- **Região das functions** — no Hobby as functions rodam nos EUA e cada query paga ida e volta transatlântica.
- **Região do Supabase** — não decidido.
- **Limite de execução** — importação de planilha de ativos e relatório grande precisam caber em lotes nesse tempo.
- **Fila e agendamento** — não há volume assíncrono conhecido; envio de e-mail e integração externa rodam dentro do request.
- **Configuração** — falhar na subida é melhor que `undefined` virando comportamento silencioso em produção.
- **Log** — investigar incidente multi-tenant sem filtrar por tenant é procurar no escuro.
- **Rastreamento de erro** — não decidido.
- **CI** — não decidido.
- **Migration em deploy** — em serverless várias instâncias sobem em paralelo e tentariam migrar ao mesmo tempo.
- **Cabeçalhos HTTP** — cabeçalho de segurança ausente é achado previsível e barato de evitar.
- **CSP** — um XSS ainda faz request autenticado em nome do usuário; a CSP é o que impede.
- **Rate limit** — contador em memória não funciona em serverless, porque cada instância tem o seu e o limite nunca é atingido.
- **Segredos** — `NEXT_PUBLIC_` vai para o bundle.
- **`service_role` key do Supabase** — essa chave ignora RLS; no bundle do cliente, dá acesso total ao banco para qualquer visitante.
- **Auditoria** — sistema de TI precisa responder quem mudou o quê; retrofitar log de auditoria depois não recupera o passado.
- **Lint e formatação** — uma config só vale para tudo.
- **Hook de pré-commit** — barra o erro trivial antes do CI sem interferir na mensagem de commit.
- **Convenção de commit** — a mensagem é responsabilidade de quem commita; validação automática seria cerimônia sem changelog gerado para justificar.

## Alternativas descartadas

- **Front e API em projetos separados** — criaria fronteira HTTP, CORS e dois deploys sem equipe separada para justificar.
- **REST com OpenAPI gerado** — passo de geração e cliente versionado que o tRPC dispensa dentro de um projeto só.
- **GraphQL** — custo de schema, resolver e cache não se paga no volume de telas atual.
- **Server Actions para mutação** — segundo caminho de mutação, com outra validação e outra checagem de permissão.
- **Server Components buscando dado direto no Prisma** — segundo caminho de leitura, com a checagem de tenant duplicada em outro lugar.
- **RLS como autorização primária** — o Prisma bypassa RLS por padrão; fazer valer exigiria transação com `SET LOCAL` a cada request.
- **Acesso a dado pelo cliente do Supabase em vez do Prisma** — espalharia o acesso a dado em dois caminhos e tiraria o tipo do Prisma de dentro do tRPC.
- **Cadastro aberto por e-mail** — sem domínio corporativo para filtrar, qualquer pessoa com a URL criaria conta.
- **SSO corporativo (OIDC/SAML)** — não há e-mail corporativo para federar.
- **Sessão em `localStorage` pelo `supabase-js`** — legível por XSS e desnecessário: mesma origem permite cookie `httpOnly`.
- **Supabase CLI como dono das migrations** — dois donos de schema no mesmo banco se sobrescrevem.
- **CASL ou biblioteca de política** — as regras cabem em três middlewares de tRPC; a camada extra seria conceito a mais para aprender.
- **Zustand ou Redux** — o estado de cliente que sobra depois do TanStack Query é pequeno demais.
- **Biblioteca de componentes fechada (MUI, Mantine)** — o design vem do Figma e precisaria ser imposto por cima do visual da biblioteca.
- **Fila (BullMQ, pg-boss)** — sem volume assíncrono conhecido, e worker de vida longa não roda na Vercel.
- **Schema ou banco por tenant** — multiplicaria cada migration pelo número de tenants sem exigência que justifique.
- **Prisma mockado nos testes** — testa o mock; constraint, transação e policy não são exercitadas.

## Consequências

### Fica mais fácil

- Mudar o retorno de um procedimento quebra o build da tela que o consome, na hora, sem passo de geração.
- Sessão segura sem esforço: mesma origem permite cookie `httpOnly` sem domínio próprio e sem CORS.
- Uma feature inteira cabe em um PR, num repositório só.
- Menos infraestrutura para montar: um projeto na Vercel, um CI, um runner de teste.
- Deploy atômico: tela e servidor sobem juntos, então nunca há versão do cliente falando com servidor de outra versão.

### Fica mais difícil

- Escalar as partes de forma independente: front e servidor sobem sempre juntos.
- Segurar a fronteira servidor/cliente: um import errado leva chave secreta para o bundle, e o compilador não avisa em todos os casos.
- Aproveitar Server Components: a decisão de buscar tudo por tRPC descarta o principal recurso do App Router.
- Latência: com as functions nos EUA e o banco em São Paulo, cada query paga a travessia.
- Cold start: a primeira invocação depois de ociosidade paga a inicialização.
- Qualquer operação precisa caber em 60s, o que obriga a desenhar importação e relatório em lotes.
- Envio de e-mail e integração externa seguram a resposta do request.
- Manter middlewares e RLS coerentes exige disciplina — policy desatualizada dá falsa sensação de proteção.

### O que isso impede de fazer depois sem custo

- Atender consumidor não-TypeScript (app mobile nativo, integração de terceiro, webhook tipado): tRPC não serve e seria preciso expor REST ao lado.
- Qualquer funcionalidade com conexão aberta (notificação em tempo real, streaming de log): a Vercel não suporta WebSocket.
- Processamento longo (importação grande, varredura de rede): estoura o limite de execução.
- Trabalho agendado ou assíncrono: exige fila e um lugar para o worker rodar, que não é a Vercel.
- Separar o servidor do front depois: o acoplamento de tipo entre tela e router torna a separação trabalhosa.
- Trocar Prisma por outro ORM: as migrations e o SQL de RLS estão dentro do Prisma Migrate.
- Sair do Supabase: Auth, banco e políticas estão acoplados ao projeto.
- Adicionar `tenant_id` a uma tabela criada sem ele: exige backfill e revisão de toda query que a toca.
- Federar com identidade corporativa depois: exige migrar os usuários já cadastrados por e-mail e senha.
- O plano Hobby só vale no contexto acadêmico; se a empresa passar a usar o sistema, é preciso migrar para Pro antes.

## O que este ADR NÃO decide

- Modelagem de domínio, entidades e relacionamentos.
- Design system, tokens e identidade visual.
- Papéis e matriz de permissão dentro de cada tenant.
- Provisionamento de tenant: quem cria, como se convida usuário.
- Provedor de e-mail transacional e demais integrações.
- Estratégia de backup, retenção e plano de recuperação.
- Ambientes (quantos, como são promovidos) e política de branch.
- Feature flags.
- Observabilidade além de log e erro (métrica, tracing distribuído).
- LGPD: base legal, política de retenção e fluxo de exclusão de dados.
- SLO, meta de latência e orçamento de custo.
