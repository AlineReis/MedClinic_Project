# MedClinic API Blueprint para o Frontend

## Objetivo
- Fornecer um plano executivo com rotas, validações básicas, autorização e autenticação para orientar o time de frontend no consumo da API.
- Sincronizar com o MVP em curso (Autenticação, Usuários, Profissionais, Agendamentos) e já preparar o comportamento esperado de erros, padrão de resposta e fluxos de autorização.

## Contexto Global da API
- **Base URL:** `http://localhost:3000/api/v1/:clinic_id` (por agora, use `:clinic_id` como placeholder de rota; cada cliente terá seu próprio identificador)
- **Formato de resposta padrão:**
  ```json
  {
    "success": true,
    "data": { /* payload */ },
    "pagination": { /* quando aplicável */ },
    "message": "Texto amigável"
  }
  ```
- **Erros:** sempre retornam `success:false` e objeto `error` com `code`, `message`, `statusCode` e `field` opcional.
- **Headers comuns:**
  - `Content-Type: application/json`
  - **Cookies:** JWT `token` em HttpOnly cookie. O navegador o envia automaticamente, então o frontend **não precisa incluir manualmente** em cada requisição.
- **Autorização:** Fluxo de roles com níveis previstos (`patient`, `receptionist`, `lab_tech`, `health_professional`, `clinic_admin`, `system_admin`). Combine o papel decodificado no JWT com a regra de cada rota.
- **Paginação:** use `page`, `pageSize`, limite padrão 20, limite máximo 100. O backend devolve `pagination` com `total`, `page`, `pageSize`, `totalPages`.
- **Datas e horários:** ISO 8601 UTC (ex: `2026-01-24T11:15:00Z`). Para filtros por data, usar `YYYY-MM-DD`.
- **Status HTTP esperados:** 200 (GET/PUT), 201 (POST criado), 400 (validação), 401 (não autenticado), 403 (sem permissão), 404 (não existe), 409 (conflito), 500 (erro servidor).

## Autenticação & Sessão
| Método | Rota | Autenticação | Payload | Retorno esperado | Observações |
| ------ | ---- | ------------ | ------- | ---------------- | ----------- |
| POST | `/auth/register` | ❌ | `{ name, email, password, role, cpf?, phone? }` | Usuário criado / 409 em duplicidade | MVP só libera registro direto de `patient`.
| POST | `/auth/login` | ❌ | `{ email, password }` | JWT no cookie, user com role | Token expira em 24h; lidamos com errors 401.
| GET | `/auth/profile` | ✅ JWT (cookie) | — | Dados do usuário + campos extras por role | Validar role para controlar UI (ex: mostrar dados profissionais).
| POST | `/auth/logout` | ✅ | — | Cookie limpo, sucesso com 200 | Chamadas posteriores devem tratar resposta como logout confirmado.

### Notas para Front
1. Guarde o `role` retornado em login/profile para condicionar rotas públicas/privadas.
2. Não armazene o JWT no `localStorage`; confie no cookie HttpOnly.
3. Em caso de `401`, redirecione para tela de login e exiba mensagem clara (token expirado/faltante).

## Recursos Principais

### Usuários (`/users`)
- **GET `/users`**: tokens obrigatórios. Roles com acesso: `clinic_admin`, `receptionist`, `system_admin`. Filtros: `role`, `search`, `page`, `pageSize`. Retorna `data[]` e `pagination`.
- **GET `/users/:id`**: pacientes conseguem só o próprio perfil; recepção/admin visualizam qualquer um. Resposta inclui dados profissionais quando aplicável.
- **PUT `/users/:id`**: cada role atualiza campos específicos (p.ex. paciente não altera `role`). Requisições enviam somente os campos permitidos.
- **DELETE `/users/:i`**: soft delete autorizado apenas para admins; front deve mostrar modal de confirmação e lidar com 409 caso existam registros pendentes.

### Profissionais (`/professionals`)
- **GET `/professionals`**: rota pública para listagem e filtros (`specialty`, `name`, `page`, `pageSize`). Ideal para landing page e agendamento público.
- **GET `/professionals/:id/availability`**: público, usa query `startDate`, `endDate`. Exibe `slots` e status `available` para alimentar picker de horários.
- **POST `/professionals/:id/availability`**: protegido por JWT; uso principal do painel (profissional/admin). Payload entrega intervalos por dia da semana.
- **GET `/professionals/:i/commissions`**: acessível para o próprio profissional ou admin. Use filtros `month`, `year`, `status` para construir dashboard de comissões.

### Agendamentos (`/appointments`)
- **GET `/appointments`**: lista com filtros avançados (`status`, `professional_id`, `patient_id`, `date`, `upcoming`). Use `pagination` para dashboards e histórico.
- **GET `/appointments/:id`**: detalhe completo, com pacotes de paciente, profissional, sala, notas e timestamps.
- **POST `/appointments`**: paciente cria sua própria consulta; recepcionista pode usar `patient_id` para terceiros. Após criação, a resposta indica `payment_required` com valor e provedor mock. Trate erros 409/400 com mensagens específicas.
- **DELETE `/appointments/:id`**: cancelamento. Caso o cancelamento gere reembolso, a resposta detalha `refund`. Velocidade de reembolso depende da antecedência (>=24h vs <24h).
- **POST `/appointments/:i/reschedule`**: mudanças obrigam novo horário válido; verifique disponibilidade antes de submeter. Reutilize as mesmas validações de criação.

## Fluxos de Autorização Relevantes
- **Paciente**: apenas vê/agenda seus próprios registros. Layouts devem filtrar automaticamente `patient_id` nas requisições.
- **Profissional**: acessa `availability`, `commissions`, os próprios agendamentos. Painel deles deve esconder botões `cancelar de outro paciente`.
- **Recepcionista**: pode ver todos usuários/agendamentos, mas não gerencia comissões.
- **Admin**: controle completo (GET/PUT/DELETE `/users`, `/professionals`, `/appointments`).

## Validações Importantes para o Front
1. **Agendamentos:** deve validar datas no frontend (sem deixar no passado, respeitando 2h para presencial, máximo 90 dias) antes de enviar.
2. **Horários:** converter `HH:MM`, validar minutos (intervalos de 10/15/50 conforme time slot). A API retorna `available: false` com `reason` quando embargado.
3. **Formulários:** reusar regex esperados (ex: CPF, phone, email). Use mensagens amigáveis alinhadas com `error.code`.

## Tratamento de Erros e UX
- Sempre exiba `error.message` ao receber `success:false`.
- Para `401`/`403`, defina fluxo de logout e novo login (centralizado num interceptor ou middleware de requests).
- Para `409`, detalhe por campo (ex: `EMAIL_ALREADY_EXISTS`, `SLOT_NOT_AVAILABLE`) e use `field` opcional para mostrar tooltip contextual.
- `500` deve acionar fallback genérico com opção de retry.

## Checklist para Integração Frontend
1. [ ] Configurar cliente HTTP base com `axios`/`fetch` apontando para `http://localhost:3000/api/v1/:clinic_id`.
2. [ ] Garantir envio automático de cookies (credenciais/include).
3. [ ] Criar helpers para interpretar `pagination`, `message`, `error`.
4. [ ] Mapear roles e permissões usando dados do endpoint `/auth/profile`.
5. [ ] Preparar componentes reativos para slots (`available`), filtros de agendamentos e dashboards de comissões.

## Próximos Passos para o Time
1. Confirmar `:clinic_id` efetivo que será usado em staging e produção.
2. Sincronizar o mock de pagamentos com o componente de agendamento (usar `payment_required` para habilitar modal de pagamento).
3. Documentar eventuais campos extras fornecidos por endpoints complementares (Exames, Prescrições) quando liberados.
