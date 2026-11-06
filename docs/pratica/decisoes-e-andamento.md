# Prática SDD — decisões e andamento

## Escopo autorizado

Executar as cinco entregas da prática, uma de cada vez: verificador de specs, skill de imagens, dados iniciais, solicitar empréstimo e `ENTREGA.md`.

O usuário determinou que os requisitos da prática prevaleçam nos conflitos com decisões anteriores do projeto. As decisões abaixo vieram dessa orientação e devem aparecer também nas specs correspondentes antes da implementação.

## Decisões confirmadas

| Assunto | Regra para a prática | Origem |
|---|---|---|
| Solicitação | Cria o empréstimo imediatamente; não há aprovação de Operações nem fila. | Briefing de solicitar empréstimo, priorizado pelo usuário. |
| Limite | Quem já tem 5 empréstimos em aberto não pode solicitar outro. | Briefing de solicitar empréstimo, priorizado pelo usuário. |
| Prazo | Devolução prevista em 14 dias úteis. | Briefing de solicitar empréstimo, priorizado pelo usuário. |
| Manutenção | TI-0004, TI-0007 e TI-0010 estão em manutenção; os outros 9 estão disponíveis. | O usuário corrigiu a orientação anterior e escolheu explicitamente a lista, não o briefing, para TI-0010. |
| Senhas e chaves | Não colocar valores em código ou no histórico do Git. O pedido de senha escrita no seed contraria essa regra geral da própria prática. | Regras gerais da prática. |
| Verificador | Aponta falhas; o agente principal corrige. Não corrigir testes no verificador. | Independência exigida pela prática. |
| Fonte das imagens | Usar exclusivamente a API do Pixabay, substituindo Pexels. | O usuário informou a alteração autorizada pelo professor e forneceu a chave. |
| Crédito das imagens | A tela deve exibir “Fotos: Pixabay” com link; registrar também autor, página de origem e licença de cada foto. | Contrato da prática adaptado à fonte autorizada pelo professor e documentação da API. |
| Escritas em produção | Banco e Storage do deploy são alterados pelo usuário. O agente prepara artefatos e instruções locais. | Regras gerais da prática. |
| Testes | Seguir `rules/tests.md`, fornecido pelo usuário, inclusive PostgreSQL local real e identidade simulada apenas em tests/. | Instrução direta do usuário. |
| Conta do professor | Colaborador no tenant `suporte_ti`. | Resposta do usuário em 05/11/2026. |
| Conta de teste manual | `isaacmaifrinodias@gmail.com`; preservar a conta do professor com zero empréstimos. | Resposta do usuário em 05/11/2026. |
| Repetição do seed | Preservar equipamentos já usados em empréstimos; sincronizar apenas os nunca utilizados. | Resposta do usuário em 05/11/2026. |
| Papel da conta de testes | `isaacmaifrinodias@gmail.com` também será Colaborador em `suporte_ti`. | Resposta do usuário em 05/11/2026. |
| Recortes | Permitir recortes geométricos que mantenham o equipamento reconhecível; sem gerar ou retocar conteúdo. Revisar novamente o JPEG final 800×600, com hash e variante próprios. | Autorização explícita do usuário em 05/11/2026. |
| Calendário | Contar segunda a sexta, excluindo feriados nacionais, estaduais de São Paulo e municipais da capital. Dia da solicitação fica fora da contagem; vencimento às 23h59 do 14º dia útil, no fuso de São Paulo. | Respostas explícitas do usuário em 05/11/2026. |
| Ordem | Após fechar o login, retomar e finalizar a entrega 2 antes de iniciar a entrega 4. | Última orientação do usuário em 05/11/2026. |

## Entrega 1 — verificador

Concluída para a revisão `29f8b1c8dd9ed95df3adb09466c8ab6ac3891e73`. O relatório `docs/verificacoes/003-verificador-spec/2026-11-05T12-43-52.471Z-29f8b1c8.md` devolveu **PRONTA**, com CA-01 a CA-04 atendidos.

- Já existem `agents/verificador-spec.md` e o gatilho em `rules/spec-flow.md`.
- `rules/tests.md` foi fornecido pelo usuário e adicionado ao projeto.
- Os checks locais foram separados da auditoria sem ferramentas. O verificador recebe as fontes do commit com caminho e linha, sem herdar a conversa.
- O perfil somente leitura negou escrita e rede nos testes reais. A auditoria não tem shell, apps, plugins, busca web ou escalada.
- O erro foi plantado em `9f81aaa`, reprovado pelo verificador e desfeito em `4f7c5b6`, sem alterar os testes.
- As rodadas e resultados reais estão em `docs/verificacoes/003-verificador-spec/`.
- Após a restauração, passaram 8 testes Vitest, 3 E2E de CLI com Playwright, lint e build com Webpack. A auditoria final conferiu o SHA exato, os diffs dos commits da prova e os mesmos blobs dos testes antes/depois.
- A primeira auditoria final ainda reprovou a prova por falta dos diffs no pacote. Eles foram anexados como evidência real; nenhum código ou teste foi alterado entre essa reprovação e a aprovação.
- Não houve push nesta etapa nem escrita em produção.

## Dependências de intervenção humana

- A chave do Pixabay foi fornecida pelo usuário. Ela fica em `.local-secrets/pixabay.key`, ignorada pelo Git. É credencial apenas do preparador local de imagens, não variável da aplicação ou do deploy. O preparador não lê o .env do Supabase nem recebe credenciais de upload.
- Executar em produção os comandos preparados para migrations e dados iniciais. O usuário já enviou as fotos ao bucket público e os 12 arquivos foram conferidos.
- Manter a conta do professor com zero empréstimos; usar outra conta nos testes.
- Os planos de login (002) e dados iniciais (005) foram aprovados pelo usuário em 05/11/2026. A entrega 4 ainda requer spec e plano próprios com o calendário confirmado.

## Estado das demais entregas

- Entrega 2 concluída para a revisão `09bf0ed37c46a071a5e09770f20d2dbcb77e762c`. O verificador marcou CA-01 a CA-05 como ATENDIDO e examinou os 12 JPEG finais. O pacote `entregas/02-imagens-equipamentos.zip` tem cinco fotos integrais, sete recortes e um manifesto com 55 recusas preservadas. Passaram 48 testes Vitest, 13 Playwright, lint e build. O usuário enviou os 12 arquivos ao bucket público `equipamentos`. Cada URL respondeu com o mesmo SHA-256 do pacote aprovado. O relatório está em `docs/verificacoes/004-imagens-equipamentos/2026-11-05T23-15-45.597Z-09bf0ed3.md`.
- Entrega 3 pronta para aplicação no Supabase. O verificador marcou CA-01 a CA-06 como ATENDIDO na revisão `b99a17d28281d7eda622e587449385708fe3def9`. Passaram 53 testes Vitest, 16 Playwright, lint e build. O seed com o pacote real criou um tenant, 12 equipamentos e dois vínculos Colaborador em PostgreSQL descartável. Repetir a execução manteve essas contagens. O responsável confere os UIDs, aplica a migração e roda o seed conforme `docs/specs/005-dados-iniciais/publicacao.md`.
- Entrega 4: spec de solicitar empréstimo ainda não elaborada.
- Entrega 5: ENTREGA.md deve refletir decisões e evidências reais, sem preencher resultados futuros.
- Pré-requisito adicional: login implementado e PRONTO na revisão `89f6c0f898e44cf617218fb2d385341efc565920`, com 45 testes, 13 E2E, lint, build e auditoria independente. A validação da conta real no deploy continua humana; nenhuma conta remota foi usada nos testes automatizados.

## Limitações e pendências técnicas

- O launcher foi exercitado com Codex CLI `0.164.0-alpha.11.1` no Windows. Outros ambientes precisam ter Git, tar, Node e Codex disponíveis e controles de permissão compatíveis; falhas não geram aprovação automática.
- Os E2E desta entrega exercitam a infraestrutura de CLI, não o login ou páginas do produto. Não houve banco de dados nesta etapa. As features com Prisma exigirão PostgreSQL real via Testcontainers conforme rules/tests.md.
- O pacote de fontes traz lockfile e binários somente por hash. CAs que dependam de inspecioná-los precisam de evidência adicional; não devem ser aprovados apenas pelo hash.
- `npm audit`, após instalar as ferramentas de teste, apontou 12 alertas nas dependências existentes: 9 moderados, 2 altos e 1 crítico. O relatório inclui Next.js, Zod, sharp transitivo e a cadeia de lint. Não foi executado `npm audit fix --force`. A atualização deve ser tratada antes da publicação final; esta etapa não corrigiu esses alertas.
- A instalação explícita de sharp para a entrega 2 atualizou essa dependência e o instalador passou a informar 11 alertas: 9 moderados, 1 alto e 1 crítico. As demais atualizações continuam pendentes.
- Na T05 do login foram atualizados Next.js e eslint-config-next para 16.4.5, Zod para 4.6.7 e fast-uri transitivo. A auditoria de produção ficou com zero alertas; restam oito moderados no conjunto de desenvolvimento. Os números anteriores registram o histórico das rodadas, não o estado atual.
