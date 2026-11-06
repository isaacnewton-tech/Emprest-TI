# Verificação das fotos e do seed

Em 05/11/2026, depois do upload do usuário, 12 GETs sem autenticação no bucket equipamentos retornaram HTTP 200 e image/jpeg. O SHA-256 de cada resposta coincidiu com o manifesto da entrega 2. Os hashes da cópia extraída também coincidiram com os registrados na auditoria da entrega 2.

O comando de seed recebeu o pacote real e dois UUIDs fictícios em um PostgreSQL 17 descartável. A primeira execução criou suporte_ti, os 12 equipamentos e dois vínculos Colaborador. A segunda sincronizou os 12 itens sem duplicação. TI-0004, TI-0007 e TI-0010 estavam em manutenção nas duas rodadas. A integração com fixtures testou separadamente a preservação de todos os campos de um equipamento usado e o bloqueio de dados entre tenants.

O Docker Desktop 4.90.0 falhou ao iniciar porque o Windows não deixou renomear dois sockets antigos. Depois do encerramento da janela de erro, as pastas temporárias foram preservadas com os nomes run-reserva-20261105-205924 e docker-secrets-engine-reserva-20261105-205924. Uma primeira tentativa também preservou run-reserva-20261105-205651. O daemon voltou na versão 29.7.2 e executou os contêineres dos testes. [Relato do mesmo erro no repositório do Docker Desktop](https://github.com/docker/desktop-feedback/issues/666)

Os resultados de banco são locais. A conferência da conta do professor, o login de produção e a aplicação de migração e seed no Supabase fazem parte do roteiro humano em docs/specs/005-dados-iniciais/publicacao.md.

Na revisão b99a17d, passaram 53 testes Vitest, 16 Playwright, lint, build com Webpack e a repetição da CLI com o lote real. O verificador aprovou os seis critérios. O arquivo checks-b99a17d.json preserva os resultados e as correções das primeiras tentativas.

A auditoria de produção do npm ficou sem alertas após fixar deepmerge-ts em 8.0.0 na dependência indireta do Prisma. A instalação completa ainda informou 14 alertas moderados em dependências de desenvolvimento. [Advisory de deepmerge-ts](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)
