# Spec 006 — Solicitar empréstimo

Entrega 4 da prática SDD. O login da spec 002 funcionou no deploy com a conta do professor, conforme teste informado pelo usuário. O tenant inicial, os 12 equipamentos, as fotos e os dois vínculos de Colaborador já estão no Supabase pelas entregas 2 e 3.

## Decisões aplicadas

| Assunto | Regra para a entrega |
|---|---|
| Criação | Confirmar a solicitação cria um empréstimo imediatamente. O briefing da prática prevalece sobre a reserva e a aprovação de Operações definidas para o escopo anterior. |
| Limite e atraso | A pessoa pode ter até 5 empréstimos em aberto no tenant da sessão. Qualquer empréstimo próprio em atraso bloqueia uma nova solicitação. O limite de 5 prevalece sobre o de 3 do PRD e do layout. |
| Prazo | 14 dias úteis no fuso `America/Sao_Paulo`, excluindo a data da solicitação, sábados, domingos e feriados nacionais, estaduais de São Paulo e municipais da capital. O vencimento é às 23h59 do 14º dia útil. Pontos facultativos não são feriados para esta contagem. |
| Manutenção inicial | TI-0004, TI-0007 e TI-0010 ficam em manutenção. Os demais começam disponíveis, conforme a lista usada no seed. |
| Crédito | A exigência de atribuição da entrega 2 prevalece sobre a sugestão de omitir o crédito no briefing da entrega 4. Exibir “Fotos: Pixabay” como link junto às fotos e conservar autor, origem e licença dos arquivos. |

## Fluxo

1. Um Colaborador autenticado vê o catálogo do tenant do seu vínculo. Cada equipamento mostra foto, nome, categoria e situação. A página permite filtrar por categoria e disponibilidade. Em manutenção e emprestado aparecem como situações distintas, sem ação de solicitação.
2. Do catálogo, o Colaborador pode abrir o detalhe de um item do seu tenant, ver a previsão de devolução e confirmar “Solicitar empréstimo”. A confirmação na interface faz o pedido em nome da sessão.
3. O servidor verifica vínculo, item disponível, limite e atraso. Se o pedido for aceito, grava o empréstimo, muda a situação para emprestado e registra o primeiro uso, se for o primeiro, em uma transação. A interface exibe a data efetivamente gravada.
4. Uma solicitação bloqueada mostra o motivo. Um item de outro tenant é tratado como não encontrado. Se duas solicitações concorrem pelo mesmo item, só uma confirma. Pedidos concorrentes da mesma pessoa também respeitam o limite de cinco.
5. Em **Meus empréstimos**, a pessoa vê seus empréstimos em aberto no tenant atual, com nome, data prevista de devolução e indicação de atraso. A interface informa quando a lista está vazia.

Um empréstimo em aberto é aquele sem devolução registrada. Ele conta para o limite mesmo em atraso. O atraso começa quando o instante atual ultrapassa o vencimento gravado. Os prazos são mostrados no fuso de São Paulo. A confirmação usa o instante do servidor, então prevalece sobre a previsão mostrada se a data virar entre abrir o detalhe e confirmar.

O tenant e a identidade do solicitante vêm da sessão autenticada e de seu vínculo no servidor. As contas da prática têm um vínculo cada. A entrega não inclui seleção ou troca de tenant. Sem um vínculo resolvido de forma inequívoca, o fluxo recusa a operação.

## Critérios de aceite

| ID | Critério |
|---|---|
| CA-01 | Colaborador com vínculo vê os 12 itens iniciais do tenant com foto, nome, categoria e situação. TI-0004, TI-0007 e TI-0010 aparecem em manutenção. A tela com fotos exibe o link “Fotos: Pixabay”. |
| CA-02 | Só um item disponível pode ser solicitado. Manutenção, empréstimo em aberto e item inexistente são recusados pelo servidor sem criar outro empréstimo ou alterar o item. |
| CA-03 | Uma confirmação bem-sucedida grava o empréstimo em aberto e o evento de auditoria, muda a situação do item para emprestado e registra o primeiro uso se ele estiver vazio. A falha de qualquer escrita deixa o conjunto sem alterações parciais. |
| CA-04 | O vencimento é gravado às 23h59 em São Paulo no 14º dia útil após a data local da solicitação. A verificação cobre fins de semana, as três abrangências de feriado, data móvel, ponto facultativo e virada de ano. Por exemplo, uma solicitação em 05/11/2026 vence em 26/11/2026 às 23h59, considerando o feriado de 20/11. |
| CA-05 | Com quatro empréstimos em aberto, o Colaborador pode chegar a cinco. Com cinco, o próximo é recusado e o motivo aparece na interface. |
| CA-06 | Um empréstimo vencido bloqueia o pedido mesmo quando a pessoa está abaixo do limite. O motivo de atraso fica visível na interface. |
| CA-07 | Em solicitações concorrentes pelo mesmo equipamento, apenas um empréstimo confirma. Em solicitações concorrentes por itens diferentes para uma pessoa que já tem quatro, apenas uma pode elevar sua contagem a cinco. |
| CA-08 | Meus empréstimos mostra apenas os empréstimos em aberto da pessoa e do tenant atual, com prazo e estado de atraso. Outra pessoa do mesmo tenant não vê esses registros. |
| CA-09 | Sessão ausente, vínculo ausente ou ambíguo e acesso cruzado entre tenants são recusados. O tenant e o solicitante não são aceitos do cliente. Cada procedimento tem teste de isolamento. A política de banco também protege a leitura dos empréstimos. |
| CA-10 | O fluxo Catálogo → Detalhe → Confirmar → Meus empréstimos funciona em português no layout escuro, em desktop e mobile. A interface mostra estados de carregamento, lista vazia, erro e conflito e atualiza a disponibilidade após o pedido. |

## Fora de escopo

Devolução, histórico, renovação, aprovação de Operações, fila, reserva futura, e-mails, telas administrativas, mudança de tenant, nova fonte de fotos e inclusão de empréstimos no seed. A validação manual de empréstimo no deploy usa a conta de teste do usuário. A conta do professor deve chegar à correção com zero empréstimos.

O calendário segue as fontes oficiais consolidadas detalhadas no plano. O caso de 20/11 usa o feriado nacional instituído pela Lei 14.759/2023. [Câmara dos Deputados](https://www.camara.leg.br/noticias/1029291-lei-torna-feriado-nacional-o-dia-20-de-novembro-dia-nacional-de-zumbi-e-da-conscie)
