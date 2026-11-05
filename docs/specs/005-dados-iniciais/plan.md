# Plano — Dados iniciais

## Estado

Aprovado pelo usuário em 05/11/2026. Executar após o login da spec 002, uma tarefa por vez. As respostas sobre papel do professor, conta de testes e preservação do seed já estão na spec.

## Dependências e limites

Seguir ADR-001: Prisma Migrate, PostgreSQL, tenant discriminado por coluna, memberships e Supabase Auth. Não introduzir biblioteca fora da stack. Testcontainers exige Docker em execução; não substituir PostgreSQL por mocks nem executar testes no banco remoto.

O login da spec 002 é pré-requisito para a aceitação em produção. A spec 004 já prepara e valida imagens, mas o lote real ainda tem sete fotos pendentes. Não criar dados definitivos com fotos de teste, links fictícios ou placeholder.

## Implementação proposta

1. Criar o schema Prisma e a migration de tenants, memberships e equipamentos. Equipamentos e vínculos pertencem a um tenant; o patrimônio é único dentro dele. Descrever DDL, índices, RLS e políticas antes de gerar a migration e aplicá-la somente no banco local.
2. Registrar tecnicamente o primeiro uso do equipamento para distinguir os itens que o seed pode sincronizar dos que precisa preservar. A futura transação de empréstimo marcará esse primeiro uso; o seed nunca limpa esse registro. Esse campo não cria empréstimos nem muda o fluxo de negócio.
3. Implementar o seed idempotente em `prisma/seed.ts`, validando entradas e o pacote da skill antes da transação. Criar os itens ausentes, sincronizar somente os nunca usados e relatar preservações. Não incluir senha, reset, limpeza de histórico ou credenciais de upload.
4. Receber o ID da conta do professor como entrada administrativa do comando, sem transformá-lo em segredo ou variável do navegador. Criar uma única membership Colaborador em `suporte_ti`. A criação da conta e a conferência do e-mail ficam no procedimento humano do Supabase Auth.
5. Testar migrations do zero, repetição, sincronização, preservação, manifesto inválido e bloqueio entre tenants em PostgreSQL real via Testcontainers. Exercitar a CLI com Playwright somente no ambiente local.
6. Preparar um roteiro de publicação manual com os arquivos e caminhos exatos, obtenção dos IDs, execução das migrations e do seed, conferência das 12 URLs e login no deploy. Não executar esse roteiro remoto pelo agente.
7. Rodar os checks e auditar a revisão com o verificador. Relatar separadamente o que passou localmente e o que ainda depende de fotos, provisionamento ou conferência humana em produção.

## Resultado esperado

Código local verificável e um roteiro reproduzível para o usuário publicar. Nenhum resultado futuro de produção será registrado como se já tivesse ocorrido.
