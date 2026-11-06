# Plano — Dados iniciais

## Estado

Aprovado pelo usuário em 05/11/2026. Executar após o login da spec 002, uma tarefa por vez. As respostas sobre papel do professor, conta de testes e preservação do seed já estão na spec.

## Dependências e limites

Seguir ADR-001: Prisma Migrate, PostgreSQL, tenant discriminado por coluna, memberships e Supabase Auth. Não introduzir biblioteca fora da stack. Testcontainers exige Docker em execução; não substituir PostgreSQL por mocks nem executar testes no banco remoto.

O login da spec 002 é pré-requisito para a aceitação em produção. O lote da spec 004 foi concluído e auditado. Após o envio pelo usuário, a leitura pública dos 12 JPEG retornou HTTP 200 com SHA-256 idêntico ao manifesto.

## DDL da primeira migração

- `tenants`: identificador UUID e slug único. O seed cria `suporte_ti`.
- `memberships`: par usuário UUID do Supabase Auth e tenant como chave primária, índice por tenant e papel do vínculo. O vínculo referencia o tenant local. A conferência da identidade do Auth é parte do procedimento de publicação.
- `equipment`: UUID, FK de tenant, patrimônio único por tenant, nome, categoria, situação, URL pública, proveniência em JSON e data opcional do primeiro uso. Chaves estrangeiras restringem a remoção de um tenant que ainda tenha vínculos ou equipamentos.
- RLS de leitura nas três tabelas. O papel `authenticated` vê os próprios vínculos e só lê tenants e equipamentos correspondentes. A política usa o `sub` da sessão encaminhada pelo gateway do Supabase. O papel `anon` não recebe acesso, e a escrita pelo gateway fica bloqueada. A migração também aplica em PostgreSQL vazio sem papéis do Supabase.
- As três tabelas são novas. A migração não altera tabelas existentes, contas Auth ou objetos do Storage.

## Implementação proposta

1. Criar o schema Prisma e a migration de tenants, memberships e equipamentos. Equipamentos e vínculos pertencem a um tenant; o patrimônio é único dentro dele. Descrever DDL, índices, RLS e políticas antes de gerar a migration e aplicá-la somente no banco local.
2. Registrar tecnicamente o primeiro uso do equipamento para distinguir os itens que o seed pode sincronizar dos que precisa preservar. A futura transação de empréstimo marcará esse primeiro uso; o seed nunca limpa esse registro. Esse campo não cria empréstimos nem muda o fluxo de negócio.
3. Implementar o seed idempotente em `prisma/seed.ts`, validando entradas e o pacote da skill antes da transação. Criar os itens ausentes, sincronizar somente os nunca usados e relatar preservações. Não incluir senha, reset, limpeza de histórico ou credenciais de upload.
4. Receber os IDs distintos das contas do professor e de testes como entradas administrativas, sem transformá-los em segredo ou variável do navegador. Criar uma única membership Colaborador por conta em `suporte_ti`, conforme confirmação do usuário. A criação das contas e a conferência dos e-mails ficam no procedimento humano do Supabase Auth.
5. Testar migrations do zero, repetição, sincronização, preservação, manifesto inválido e bloqueio entre tenants em PostgreSQL real via Testcontainers. Exercitar a CLI com Playwright somente no ambiente local.
6. Preparar um roteiro de publicação manual com os arquivos e caminhos exatos, obtenção dos IDs, execução das migrations e do seed, conferência das 12 URLs e login no deploy. Não executar esse roteiro remoto pelo agente.
7. Rodar os checks e auditar a revisão com o verificador. Relatar separadamente o que passou localmente e o que ainda depende de fotos, provisionamento ou conferência humana em produção.

## Resultado esperado

Código local verificável e um roteiro reproduzível para o usuário publicar. Nenhum resultado futuro de produção será registrado como se já tivesse ocorrido.
