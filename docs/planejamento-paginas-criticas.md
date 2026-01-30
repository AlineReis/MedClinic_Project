# Base do Frontend e Planejamento das Páginas Críticas

## 1. Fundamentos da arquitetura

- **Entry point**: `src/index.js` importa `css/global.css` e os módulos JS atuais (`navigation`, `mock_db`, `app`). Webpack já empacota o build na pasta `/dist`.
- **Estado global**: criar `authStore` (sessão, role, tokens) e `uiStore` (toasts, loaders) consumindo `apiService` para inicializar via `GET /auth/profile`.
- **Padrões UX**: todos os formulários devem validar localmente (`js/utils/validation.js`) antes de chamar o backend, exibindo feedback de erro e carregamento.

## 2. Página 1 – Login (`pages/login.html`)

- **Objetivo**: autenticar para liberar dashboards e persistir cookie HttpOnly.
- **Fluxo**:
  1. Usuário insere `email` + `password`, valida localmente com regex.
  2. Chama `POST /api/v1/:clinic_id/auth/login` via `apiService`.
  3. Em sucesso, chama `GET /auth/profile`, atualiza `authStore` e redireciona para o dashboard base (ex: `index.html`).
  4. Em erro 401, mostra toast específico (`INVALID_CREDENTIALS`).
- **Estados**: idle (input), submitting (spinner), unauthorized (erro). Incluir botão para registro e link de recuperação.

## 3. Página 2 – Dashboard do paciente (`pages/patient-dashboard.html`)

- **Objetivo**: mostrar agendamentos, exames e prescrições do paciente.
- **Dados**: `GET /auth/profile` (para patient_id), `GET /appointments?patient_id`, `GET /exams?patient_id`, `GET /prescriptions?patient_id`.
- **Componentes**: cards de agendamento (com status), lista de exames com status e botões para reagendar/cancelar (chamando `POST /appointments/:id/cancel` e `POST /appointments/:id/reschedule`).
- **Estados**: placeholders de carregamento, mensagens de empty state, banners de erro global (ex: falha ao carregar exames).

## 4. Página 3 – Agendamento/Seleção de slots (`pages/slots.html` ou seções em `index.html`)

- **Objetivo**: permitir buscar profissionais, ver disponibilidade e criar consulta.
- **Dados**: `GET /professionals` (filtros), `GET /professionals/:id/availability` (slots atualizados), `POST /appointments` para criar.
- **Regras do backend**: aplicar RN-01 a RN-04 antes de enviar; utilizar dados de `docs/REGRAS_DE_NEGOCIO_MINI_DESAFIO.txt` para validar; exibir mensagens específicas para `SLOT_NOT_AVAILABLE`/`DUPLICATE_APPOINTMENT`/`INSUFFICIENT_NOTICE`/`CANNOT_CANCEL`.
- **Estados**: loading na busca, detalhes do slot (disponível x ocupado), resumo de pagamento com `payment_required` (RN-05) e feedback em caso de falha de pagamento/mock.

## 5. Próximos passos imediatos

1. Criar módulo `apiService` com fetch wrapper e stores.
2. Substituir formulários existentes para usar `apiService` + validar localmente.
3. Implementar os toasts/carregadores descritos em `docs/estabelecimento-de-tarefas-frontend.md`.

## 6. Aplicando o framework RALPH

- **Abstractions:** transforme cartões (profissionais, consultas, exames), componentes de listagem (DataTable), formulários (`FormField` + validação), modais de confirmação e toasts em componentes globais reutilizáveis. Isso facilita reaproveitar os mesmos padrões nas páginas críticas e reduzir duplicação.
- **Lifecycle:** mantenha o estado de sessão, cache de profissionais e loaders em stores do lado do cliente (`authStore`, `uiStore`), mas sincronize sempre com o backend (fonte da verdade) via `apiService`. Use ciclos de vida do TypeScript para limpar dados ao navegar entre páginas.
- **Hard Parts:** autenticação/JWT + cookies HttpOnly, aplicação das regras RN-01 a RN-05 (disponibilidade, antecedência, duplicidade), e o pagamento CloudWalk mock (status `pending/failed/paid` e `payment_required`). Documentar e testar cada um evita regressões e garante feedback claro ao usuário.

> Esta base garante que o login é o gatilho da sessão, seguido pelo dashboard do paciente e o fluxo de agendamento; assim o backend pode ser consumido com segurança e previsibilidade.
