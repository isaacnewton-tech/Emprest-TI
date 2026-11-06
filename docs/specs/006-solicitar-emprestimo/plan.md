# Plano — Solicitar empréstimo

**Aprovado pelo usuário.** A spec 006 usa as decisões já registradas em `docs/pratica/decisoes-e-andamento.md`.

## Contratos e arquitetura

Seguir o [ADR 001](../../adr/001-stack.md), as specs 002, 004 e 005 e a referência visual `layout.md`. Manter Next.js App Router, tRPC com Zod, camada de serviço e Prisma Migrate. A API é a única fonte dos dados de domínio para as telas. Autenticação reaproveita Supabase Auth, cookies protegidos e a checagem de origem nas mutações.

- Introduzir o singleton Prisma no servidor e resolver o vínculo no contexto a partir do usuário verificado. O `tenantProcedure` injeta o identificador do tenant e o papel. A resolução pode ser sob demanda para o login continuar independente das consultas de catálogo. Os procedimentos de domínio recebem e aplicam o filtro de tenant. Listagem dos próprios empréstimos também filtra pelo identificador da sessão.
- Expor `catalogo.listar`, `catalogo.detalhe`, `emprestimos.solicitar` e `emprestimos.meusAbertos`. Listagem do catálogo usa cursor estável e uma primeira página que acomoda os 12 itens iniciais. Detalhe e solicitação identificam o equipamento por patrimônio no tenant resolvido. Entradas Zod estritas rejeitam campos extras. A resposta pública de catálogo contém dados do item, sem dados pessoais do tomador atual.
- Proteger também `/meus-emprestimos` com o fluxo de sessão existente. Usar tipos inferidos do AppRouter. Continuar com logs estruturados por requisição e tenant, sem dados de autenticação.

## DDL previsto

Criar uma migração nova após a inicial. Adicionar `emprestado` ao enum de situação, sem alterar a situação das linhas existentes. Criar `loans` com identificador, tenant, vínculo do tomador, equipamento, criação, vencimento e data de devolução inicialmente nula. O fechamento fica disponível para o modelo de dados futuro. Esta entrega não expõe uma ação de devolução.

- Chaves compostas ligam o equipamento e o tomador ao mesmo tenant da linha. Adicionar unicidade em `(tenant_id, id)` no equipamento para a referência e um índice parcial único para o mesmo equipamento em aberto. Indexar consultas de empréstimos em aberto por tenant, tomador e vencimento.
- Aplicar RLS na mesma migração. A política de leitura permite apenas o empréstimo da identidade autenticada com vínculo no tenant. O papel anônimo e a escrita pelo gateway ficam bloqueados. O backend aplica autorização e filtro antes de gravar.
- Registrar a ação bem-sucedida em tabela de auditoria append-only, com tenant, ator, ação, recurso e instante, como prevê o ADR. A tabela tem RLS e política de negação no gateway. Uma proteção no banco impede alterações e exclusões comuns do histórico. A auditoria é gravada na mesma transação da solicitação.
- As novas tabelas começam vazias. Não modificar a migração aplicada, equipamentos existentes, histórico ou contas Auth. Validar aplicação desde o zero e também após o seed da spec 005, em bancos descartáveis locais.

## Concorrência e prazo

Na transação de solicitação, validar vínculo, situação, contagem de abertos e atraso no banco. Usar isolamento serializável com retentativas limitadas em conflito de serialização, relendo o estado a cada nova tentativa. Combinar a atualização condicional do item disponível com o índice parcial único. A regra de contagem por pessoa precisa valer mesmo para pedidos simultâneos de itens diferentes. Se a regra passar, gravar empréstimo, primeiro uso (se vazio), situação e auditoria juntos. Traduzir recusas em códigos tRPC e mensagens em português.

Contar datas civis de São Paulo no servidor. Usar os feriados recorrentes confirmados nas fontes oficiais, com datas móveis e deduplicação. Converter a data civil final e as 23h59 para um instante com o fuso IANA `America/Sao_Paulo`. Usar recursos nativos de data e fuso ou a conversão do PostgreSQL pelo Prisma, sem depender do fuso da máquina ou de API externa de feriados. Gravar o vencimento em `timestamptz`. Atraso é derivado desse instante.

- Os feriados nacionais fixos vêm das Leis 662, 6.802 e 14.759. [Lei 662 atualizada](https://www2.camara.leg.br/legin/fed/lei/1940-1949/lei-662-6-abril-1949-347136-normaatualizada-pl.html), [Lei 6.802](https://www2.camara.leg.br/legin/fed/lei/1980-1987/lei-6802-30-junho-1980-357065-publicacaooriginal-1-pl.html), [Lei 14.759](https://www.camara.leg.br/noticias/1029291-lei-torna-feriado-nacional-o-dia-20-de-novembro-dia-nacional-de-zumbi-e-da-conscie).
- Em São Paulo, incluir 9 de julho pela Lei Estadual 9.497. Usar o art. 10 da Lei Municipal 14.485 para 25 de janeiro, Sexta-feira da Paixão, Corpus Christi e as datas que também são nacionais. Conferir o resultado contra o calendário da capital para 2026. [Lei estadual](https://www.al.sp.gov.br/repositorio/legislacao/lei/1997/compilacao-lei-9497-05.03.1997.html), [lei municipal](https://legislacao.prefeitura.sp.gov.br/lei-20000-de-19-de-julho-de-2007/consolidado), [decreto municipal para 2026](https://legislacao.prefeitura.sp.gov.br/decreto-64862-de-22-de-dezembro-de-2025).
- Manter as fontes e os casos de data no repositório. Mudanças futuras no calendário legal exigem revisão do calendário da aplicação. O cálculo deve atravessar dezembro e janeiro com as datas recorrentes.

## Interface e validação

Reproduzir as telas de Catálogo, Detalhe e Meus empréstimos do Nocturne no recorte da prática. Substituir os exemplos estáticos do layout pelos dados reais, limite de cinco e prazo em dias úteis. Usar as URLs do bucket do Supabase já publicadas e o crédito em posição discreta junto às fotos. Refletir a disponibilidade e os empréstimos por invalidação das consultas tRPC depois da confirmação. Não usar credenciais de upload no front.

Vitest cobre calendário, serviço e procedimentos com PostgreSQL real via Testcontainers. Os testes exercitam os dois tipos de concorrência, os limites, os filtros de tenant, a privacidade entre pessoas e RLS. Playwright cobre a jornada e os erros visíveis com servidor e banco local descartável. A simulação de identidade fica em `tests/`. Para testes de endpoint, verificar status e corpo. Rodar lint, build e as duas suítes. Guardar os checks da revisão exata e submeter os dez critérios ao verificador da prática.

Após veredito **PRONTA**, o responsável aplica a nova migração no Supabase antes do deploy que usa as tabelas. Conferir na Vercel o login, as 12 fotos e os estados iniciais. Usar a conta de teste para a solicitação e conferir que a conta do professor segue com zero empréstimos. O registro final e a tag da prática pertencem à entrega 5.
