# Spec 005 — Dados iniciais da prática

## Estado

Plano aprovado pelo usuário em 05/11/2026 para a entrega 3. A implementação segue o login da spec 002; a publicação depende do conjunto completo de fotos da spec 004. Esta spec não declara dados publicados ou contas provisionadas.

## Fontes e decisões confirmadas

- A lista original dos 12 equipamentos está em `skills/imagens-equipamentos/assets/equipamentos.json`: quatro notebooks, três monitores, três cabos e duas câmeras.
- Por decisão explícita do usuário, TI-0004, TI-0007 e TI-0010 ficam em manutenção; os outros nove ficam disponíveis inicialmente.
- O tenant inicial é `suporte_ti`, conforme ADR-001.
- O professor, `marcelo.grilo@institutojef.org.br`, terá perfil Colaborador nesse tenant e começará com zero empréstimos.
- A conta `isaacmaifrinodias@gmail.com` será usada nos testes manuais. Sua senha não pertence à spec, ao seed, ao Git ou aos testes automatizados.
- O usuário confirmou que a conta de testes também será Colaborador em `suporte_ti`.
- Ao repetir o seed, preservar equipamentos que já tenham sido usados em empréstimos e atualizar apenas os que ainda não foram utilizados. Não remover histórico nem resetar banco.
- A prática exige a senha padrão da turma para o professor, mas proíbe segredos em código e Git. O usuário informa a senha somente durante o provisionamento manual no Supabase Auth; ela não é escrita no arquivo de seed.
- Migrations, provisionamento de contas, upload e seed do deploy são executados pelo usuário. O agente prepara e verifica a implementação somente no ambiente local.

## Comportamento

O seed cria o tenant e os equipamentos que faltarem, sem criar empréstimos. Cada equipamento guarda patrimônio, nome, categoria, situação, URL pública da foto e sua proveniência. A identidade do equipamento é o par tenant e patrimônio; rodar novamente não cria uma segunda linha para o mesmo item.

As fotos vêm exclusivamente do pacote completo e validado pela skill. O procedimento humano envia os arquivos ao bucket público `equipamentos`, nos caminhos estáveis `suporte_ti/TI-0001.jpg` até `suporte_ti/TI-0012.jpg`. O seed valida a correspondência dos 12 registros, formato, dimensões, hashes e proveniência do manifesto antes de escrever qualquer equipamento. Não aceita lote incompleto nem links temporários do Pixabay como URL definitiva.

Para equipamentos ainda não utilizados, repetir o seed sincroniza os dados da lista e do manifesto. Para equipamentos já utilizados, preserva todos os campos existentes e relata a preservação por patrimônio. Não altera empréstimos, datas ou histórico; uma execução repetida não devolve um item emprestado ao estado disponível.

O usuário provisiona a conta do professor no Supabase Auth e informa seu ID ao comando de seed. O seed cria o vínculo desse ID com `suporte_ti` no papel Colaborador. Não armazena senha em tabela de domínio, não cria login alternativo e não concede permissão de Operações. O procedimento humano confere se o ID informado corresponde ao e-mail do professor e valida o login real após o deploy. Repetir o seed não troca a senha da conta.

O comando também recebe o ID da conta de testes e cria sua membership Colaborador no mesmo tenant. Os IDs do professor e da conta de testes precisam ser distintos. O usuário confere ambos no Auth; o seed não troca senhas nem cria empréstimos para nenhuma das contas.

As novas tabelas têm RLS e política explícita na mesma migration. Um usuário sem vínculo não acessa os registros; o mesmo equipamento consultado por identidade de outro tenant não retorna. O seed administrativo não vira uma API pública para contornar essa proteção.

## Critérios de aceite

| ID | Critério |
|---|---|
| CA-01 | Um banco local limpo recebe o tenant `suporte_ti` e os 12 equipamentos exatos, com TI-0004, TI-0007 e TI-0010 em manutenção e os outros nove disponíveis, sem criar empréstimos. |
| CA-02 | Uma segunda execução não duplica tenant, equipamento ou membership; equipamentos não utilizados são sincronizados e equipamentos já utilizados mantêm seus campos e histórico. |
| CA-03 | Lote de imagens incompleto, manifesto inconsistente ou origem inadequada é rejeitado antes de escrever equipamentos; um lote válido grava URLs públicas estáveis e mantém os créditos individuais. |
| CA-04 | O vínculo do professor no tenant é Colaborador; senha e tokens não entram no seed, no log ou no Git. O procedimento humano cobre provisionamento, correspondência do ID, login real e confirmação de zero empréstimos. |
| CA-05 | Migrations aplicam do zero em PostgreSQL descartável local; as políticas impedem que uma identidade de outro tenant obtenha o mesmo equipamento. Nenhum teste usa o Supabase remoto. |
| CA-06 | A documentação separa a preparação e os testes locais dos comandos que o usuário executa em produção, incluindo upload, migrations, conta do professor, seed e verificações no link da Vercel. |

## Validação

Seguir `rules/tests.md`. Vitest e Testcontainers exercitam Prisma e migrations reais em PostgreSQL novo por suíte. Conferir contagens, campos, sincronização, preservação de itens usados e bloqueio por política. A fronteira com o provedor de identidade pode ser controlada apenas nos testes; isso não substitui a conferência humana do login real.

Playwright verifica a CLI em banco local e os erros de entrada. O catálogo e o fluxo de empréstimos terão E2E próprios na entrega 4. A simulação de identidade fica exclusivamente em `tests/`. Executar também lint, build e verificador independente com evidências da revisão correspondente.

## Fora de escopo

Catálogo visual, cadastro por interface, solicitação ou devolução de empréstimos, alteração de senhas existentes, importação de planilha, publicação pelo agente e considerar as cinco fotos já revisadas como um lote completo.
