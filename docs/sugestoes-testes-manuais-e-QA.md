# Sugestões de Testes Manuais & QA

> Baseado em `docs/fluto-de-dados-e-estados.md` e no estado atual da integração.

## 1. Login (fluxo principal)

- **Cenário:** login com credenciais válidas.
  - **Pré-condição:** backend disponível.
  - **Passos:** abrir `pages/login.html`, inserir credenciais válidas, clicar em entrar.
  - **Resultado esperado:** mostrar loading, chamar `/auth/profile`, redirecionar para a dashboard correta pela role.
- **Cenário:** credenciais inválidas.
  - **Resultado esperado:** toast com `error.message` e formulário permanece editável.
- **Cenário:** falha de rede durante login.
  - **Resultado esperado:** toast de erro genérico + botão de login habilitado novamente.

## 2. Cadastro / Onboarding

- **Cenário:** cadastro com dados válidos (nome, email, senha, CPF, telefone).
  - **Resultado esperado:** validação local OK, loading e mensagem de sucesso/redirecionamento.
- **Cenário:** CPF inválido ou e-mail inválido.
  - **Resultado esperado:** mensagem de erro antes do POST.

## 3. Dashboard do paciente

- **Cenário:** carregar dashboard com dados existentes.
  - **Resultado esperado:** placeholders enquanto carrega; cards populados com agendamentos e prescrições.
- **Cenário:** usuário sem agendamentos.
  - **Resultado esperado:** estado empty com CTA para agendar consulta.
- **Cenário:** falha de rede ao carregar dados.
  - **Resultado esperado:** banner persistente e toast de erro.

## 4. Schedule appointment (lista de profissionais)

- **Cenário:** carregar lista de profissionais com filtros.
  - **Resultado esperado:** lista renderizada, filtros atualizam a lista.
- **Cenário:** lista vazia.
  - **Resultado esperado:** empty state com mensagem amigável.
- **Cenário:** falha no `/professionals`.
  - **Resultado esperado:** toast de erro + empty state de falha.

## 5. Disponibilidade do profissional

- **Cenário:** abrir “Ver calendário”.
  - **Resultado esperado:** carrega slots e exibe botões de horários disponíveis.
- **Cenário:** sem horários disponíveis.
  - **Resultado esperado:** mensagem “Sem horários disponíveis”.
- **Cenário:** falha de rede ao buscar disponibilidade.
  - **Resultado esperado:** toast de erro + botão reabilitado.

## 6. Pagamento e confirmação (mock)

- **Cenário:** abrir modal de checkout.
  - **Resultado esperado:** modal com resumo, preço e forma de pagamento.
- **Cenário:** fechar modal.
  - **Resultado esperado:** modal removido sem erros no console.

## 7. Logout e sessão

- **Cenário:** logout com backend disponível.
  - **Resultado esperado:** sessão limpa e redirecionamento para login.
- **Cenário:** logout com backend offline.
  - **Resultado esperado:** confirmar comportamento com backend (pendência de alinhamento).

## 8. Validação de RBAC

- **Cenário:** paciente tentando acessar dashboard de admin.
  - **Resultado esperado:** redirecionar para dashboard correto e evitar renderização do conteúdo.

## 9. Checks gerais

- Confirmar que nenhum endpoint é chamado fora de `src/services/*`.
- Verificar estados `loading`, `empty`, `error` conforme cada fluxo acima.
- Registrar prints/console logs quando houver inconsistência com o contrato.
