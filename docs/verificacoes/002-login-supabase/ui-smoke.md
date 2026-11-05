# Conferência visual inicial do login

Rodada de 05/11/2026. Build de produção local, Chromium headless e conexões configuradas exclusivamente para endereços locais de fixture. Não foram usadas contas remotas, nem houve envio de credenciais nessa conferência visual.

| Tela | Viewport | Documento | Resultado |
|---|---|---|---|
| Login desktop | 1280×720 | 1280×720 | Sem rolagem horizontal ou vertical. |
| Login celular | 390×844 | 390×844 | Sem rolagem horizontal ou vertical nessa dimensão. |

Os arquivos `login-desktop.png` e `login-mobile.png` foram examinados após a captura. Mantêm a composição e os tokens Nocturne existentes. A indicação de limite e prazo passou a refletir a prática já priorizada pelo usuário: cinco itens e 14 dias úteis. O cálculo do prazo pertence à entrega de empréstimos.

Os três testes de componente verificaram campos inválidos, mensagens acessíveis, envio único durante a espera, navegação e limpeza do cache após sucesso, recusa genérica e nova tentativa. A suíte tinha 42 testes Vitest e sete E2E de CLI passando nesta rodada, além de tipos, lint e build. O fluxo completo no navegador e a auditoria da spec ainda pertencem à T05; essas capturas não comprovam login com uma conta real do Supabase.
