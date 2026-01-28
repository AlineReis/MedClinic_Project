# Fluxos de Dados e Estados Críticos

## 1. Login (base de tudo)

- **Dados de entrada:** `email`, `password`.
- **Endpoint:** `POST /api/v1/:clinic_id/auth/login`.
- **Estados:**
  - Idle → formulário aguardando input.
  - Loading → bloquear botões e mostrar spinner.
  - Success → armazenar `user`, chamar `GET /auth/profile`, redirecionar para `index.html` ou dashboard conforme role.
  - Error → exibir toast com `error.message` (ex: credenciais inválidas).
- **Regras:** limpar campos sensíveis ao navegar para fora.

## 2. Cadastro básico / onboarding

- **Dados de entrada:** `name`, `email`, `password`, `cpf`, `phone`.
- **Endpoint:** `POST /api/v1/:clinic_id/auth/register`.
- **Estados:** Idle → validação local (regex, CPF); Loading → envio; Success → mostrar mensagem e redirecionar; Error → erro específico por campo.

## 3. Dashboard do paciente

- **Dados carregados:** `auth/profile`, `appointments?patient_id`, `exams?patient_id`, `prescriptions?patient_id`.
- **Estados:**
  - Loading inicial: mostrar placeholders.
  - Success: renderizar cards com filtros por status e próximas consultas.
  - Empty: guias para “agendar consulta” ou “ver médicos”.
  - Error: banner persistente explicando problema (ex: falha de rede).
- **Interações:** cancelamento, reagendamento e visualização de recibos usam `POST /appointments/:id/cancel` e `POST /appointments/:id/reschedule`, cada uma com estados de confirmação.

## 4. Página do profissional (doctor dashboard)

- **Dados carregados:** `appointments?professional_id`, `professionals/:id/availability`, `professionals/:id/commissions`.
- **Estados:** carregamento em colunas: agenda, disponibilidade e comissões. Cada slot tem estado `available/not available` (RN-01). Mudar disponibilidade usa `POST /professionals/:id/availability`. Exibir erros de RBAC se exceder permissões.

## 5. Cadastro e Listagem de agendamentos (recepção/paciente)

- **Dados carregados:** `GET /appointments` com filtros; `GET /professionals/:id/availability` para slots.
- **Estados:** Loading → spinner em tabela; Success → exibir tabela com paginação; Empty → CTA para criar agendamento.
- **Ações:** Criar usa `POST /appointments`; antes de enviar verificar RN-02/03/04; em caso de conflito mostrar mensagem específica (`SLOT_NOT_AVAILABLE`, `DUPLICATE_APPOINTMENT`).

## 6. Pagamento e confirmação

- **Fluxo:** o backend retorna `payment_required` na criação; mostrar resumo e botão de confirmação automático (cloudwalk mock). Se falhar, exibir erro e permitir retry.

## 7. Estados globais recomendados

- `authStore` mantém `user`, `role`, `clinic_id` e `sessionValid`.
- `uiStore` pode registrar toasts e loaders globais.
- Cada página limpa timers e listeners ao sair para evitar vazamentos.

> Esses fluxos devem orientar o desenvolvimento das UIs, garantindo que os estados reflitam o contrato do backend e que cada erro esteja mapeado para um feedback controlado.
