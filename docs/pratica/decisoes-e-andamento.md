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
| Crédito das imagens | A tela deve exibir “Fotos: Pexels” com link. O pedido de catálogo sem crédito contraria o contrato da skill na própria prática. | Contrato de imagens-equipamentos. |
| Escritas em produção | Banco e Storage do deploy são alterados pelo usuário. O agente prepara artefatos e instruções locais. | Regras gerais da prática. |
| Testes | Seguir `rules/tests.md`, fornecido pelo usuário, inclusive PostgreSQL local real e identidade simulada apenas em tests/. | Instrução direta do usuário. |

## Entrega 1 — verificador

Em andamento; não declarada concluída.

- Já existem `agents/verificador-spec.md` e o gatilho em `rules/spec-flow.md`.
- `rules/tests.md` foi fornecido pelo usuário e adicionado ao projeto.
- Os checks locais foram separados da auditoria sem ferramentas. O verificador recebe as fontes do commit com caminho e linha, sem herdar a conversa.
- O perfil somente leitura negou escrita e rede nos testes reais. A auditoria não tem shell, apps, plugins, busca web ou escalada.
- O erro foi plantado em `9f81aaa`, reprovado pelo verificador e desfeito em `4f7c5b6`, sem alterar os testes.
- As rodadas e resultados reais estão em `docs/verificacoes/003-verificador-spec/`.
- Falta concluir os checks após a restauração e obter a auditoria final; a entrega ainda não está declarada pronta.

## Dependências de intervenção humana

- Fornecer a chave do Pexels em configuração local, sem colá-la em código ou versioná-la, para a entrega de imagens.
- Executar em produção os comandos preparados para migrations, dados iniciais e upload de imagens.
- Manter a conta do professor com zero empréstimos; usar outra conta nos testes.
- Aprovar os planos de funcionalidade antes da implementação, conforme o ciclo SDD do projeto.

## Lacunas a resolver na etapa correspondente

- Definir o calendário dos 14 dias úteis: finais de semana, feriados e fuso horário.
- Definir papel e vínculo de tenant da conta do professor e da conta usada nos testes.
- Definir como repetir o seed preservando dados que já tenham sido usados em empréstimos.

## Estado das demais entregas

- Entrega 2: skill imagens-equipamentos ainda não criada.
- Entrega 3: spec de dados iniciais ainda não elaborada.
- Entrega 4: spec de solicitar empréstimo ainda não elaborada.
- Entrega 5: ENTREGA.md deve refletir decisões e evidências reais, sem preencher resultados futuros.
- Pré-requisito adicional: a integração de login tem documentos propostos em `docs/specs/002-login-supabase/`, mas ainda não tem código implementado.
