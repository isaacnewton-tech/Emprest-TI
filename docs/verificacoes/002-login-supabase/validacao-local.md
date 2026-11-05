# Validação local do login

## Ambiente e limites

Os testes de navegador iniciam um build Next em porta local descartável e um provedor HTTP de identidade definido exclusivamente em `tests/helpers/auth-harness.ts`. As variáveis do processo de teste apontam para esse provedor e URLs PostgreSQL locais não utilizadas nesta spec. Não há modo de teste, senha especial, usuário fictício ou caminho alternativo de autenticação no código da aplicação.

A conta real informada pelo usuário não foi usada em testes automatizados. Não foram alterados `.env`, contas ou configurações do Supabase, nem configurações da Vercel. O login real no deploy permanece uma conferência humana posterior.

## Falhas encontradas e correções

- O cenário de indisponibilidade durante a saída provou que verificar a identidade antes de executar o logout impedia a limpeza local dos cookies. A identidade passou a ser resolvida sob demanda pelo procedimento protegido. A saída, que só limpa a sessão do próprio navegador, continua exigindo entrada Zod e origem válida; tenta revogar a sessão local no provedor e limpa os cookies mesmo se a revogação falhar.
- O primeiro E2E completo recebeu HTTP 403. Os cabeçalhos do navegador indicavam `127.0.0.1`, enquanto a URL interna do Next usava `localhost`. A comparação agora usa o Host público e um protocolo encaminhado válido. Origem ausente, origem de outro site, Host inválido e tentativa de usar `x-forwarded-host` para trocar a origem são recusados. O teste também detectou e corrigiu a preservação indevida de uma porta interna ao reconstruir a origem.
- O seletor inicial do alerta do formulário também encontrava o anunciador de rotas do Next. O E2E passou a selecionar o alerta dentro do formulário, mantendo a exigência da mensagem exata de credenciais recusadas.
- O lint React interpretou o callback `use` de uma fixture do Playwright como um Hook. O parâmetro foi renomeado para `provide`; a execução e as asserções da fixture foram preservadas.
- A primeira checagem de tipos após iniciar a atualização de dependências ocorreu antes do término da instalação. Ela não foi aceita como validação. Após a instalação, os tipos foram verificados novamente; o UUID da requisição fictícia foi ajustado ao tipo declarado pelo ambiente atualizado.
- A indisponibilidade do provedor na área protegida usa uma página sem dados de conta no mesmo Nocturne, mantendo HTTP 503 e uma opção de tentar novamente. Os testes de navegador conferem status, mensagem e o fundo escuro.
- A configuração pública obrigatória do Auth é validada com Zod ao carregar o módulo do servidor. O Vitest fornece somente valores locais de fixture e esvazia as credenciais privilegiadas; os testes específicos podem substituir esses valores por outros locais.

## Dependências

A auditoria anterior tinha alertas de produção em Next.js, Zod e fast-uri. Foram instalados Next.js e eslint-config-next 16.4.5, Zod 4.6.7 e a correção transitiva de fast-uri, sem `npm audit fix --force`. `npm audit --omit=dev` passou a informar zero alertas de produção. O instalador ainda informou oito alertas moderados no conjunto que inclui ferramentas de desenvolvimento.

Referências primárias: [advisory do Next.js](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), metadados de advisories retornados pelo registro npm e [comparação de origem e Host no Next](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions). A aplicação continua usando tRPC; a última referência explica o problema de origem atrás de proxy, sem introduzir Server Actions.

## Auditoria independente

O pacote de todas as fontes ultrapassou o limite de 300.000 caracteres do launcher. Foi acrescentado `sourceFiles` opcional nos checks, validado contra o snapshot. Todo código, teste, script, regra, contexto compartilhado, pasta da spec e arquivo alterado continua obrigatório. Documentos de outras specs e verificações anteriores podem ser delimitados explicitamente como inventário/hash; as fontes selecionadas continuam completas, com linhas. O modo somente leitura e a proibição de ferramentas e escalada não foram ampliados.

Os resultados finais e o veredito devem ser consultados nos arquivos de checks e no relatório da revisão correspondente. Este registro de trabalho não substitui a auditoria nem declara uma conferência em produção.
