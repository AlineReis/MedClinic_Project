# 📚 MedClinic API - Documentação de Rotas (MVP)

**Versão:** 1.0 | **Data:** Janeiro 2026 | **Base URL:** `http://localhost:3000/api/v1/:clinic_id`

---

## 📋 Índice

1. [Autenticação](#bloco-1-autenticação)
2. [Usuários](#bloco-2-usuários)
3. [Profissionais](#bloco-3-profissionais)
4. [Agendamentos](#bloco-4-agendamentos)
5. [Padrões Globais](#padrões-globais)

---

## 🔐 BLOCO 1: AUTENTICAÇÃO

### Endpoint: POST `/api/v1/:clinic_id/auth/register`

**Descrição:** Registra um novo usuário no sistema (apenas pacientes e admin pode criar outros)

**Autenticação:** ❌ Não requerida

**Body Request:**

```json
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "password": "Senha@123",
  "role": "patient",
  "cpf": "12345678901",
  "phone": "11987654321"
}
```

**Validações:**

- ✅ `name` - Obrigatório, string (mín. 2 caracteres)
- ✅ `email` - Obrigatório, único, válido (regex)
- ✅ `password` - Obrigatório, 8+ caracteres, 1 maiúscula, 1 minúscula, 1 número
- ✅ `role` - Enum: `patient` | `receptionist` | `lab_tech` | `health_professional` | `clinic_admin` | `system_admin`
  - _MVP: Apenas `patient` consegue se auto-registrar_
  - _Outros roles criados por `clinic_admin` ou `system_admin`_
- ✅ `cpf` - Obrigatório para pacientes, único, apenas formato (XXX.XXX.XXX-XX)
- ✅ `phone` - Opcional, formato (XX) XXXXX-XXXX

**Response: 201 Created**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Maria Silva",
    "email": "maria@email.com",
    "role": "patient",
    "cpf": "12345678901",
    "phone": "11987654321",
    "created_at": "2026-01-24T11:14:00Z"
  },
  "message": "Usuário registrado com sucesso"
}
```

**Response: 409 Conflict (Email duplicado)**

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Este email já está registrado",
    "statusCode": 409
  }
}
```

**Response: 400 Bad Request (Validação falhou)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Senha deve ter no mínimo 8 caracteres",
    "statusCode": 400,
    "field": "password"
  }
}
```

---

### Endpoint: POST `/api/v1/:clinic_id/auth/login`

**Descrição:** Autentica um usuário e retorna um token JWT (armazenado em Cookie)

**Autenticação:** ❌ Não requerida

**Body Request:**

```json
{
  "email": "maria@email.com",
  "password": "Senha@123"
}
```

**Validações:**

- ✅ `email` - Obrigatório, válido
- ✅ `password` - Obrigatório

**Response: 200 OK**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Maria Silva",
    "email": "maria@email.com",
    "role": "patient"
  },
  "message": "Login realizado com sucesso"
}
```

**Cookies Set:**

```
Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

**Response: 401 Unauthorized (Credenciais inválidas)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha inválidos",
    "statusCode": 401
  }
}
```

**Notas JWT:**

- Token expira em **24h**
- Armazenado em **HttpOnly Cookie** (seguro contra XSS)
- Payload contém: `{ id, email, role, iat, exp }`

---

### Endpoint: GET `/api/v1/:clinic_id/auth/profile`

**Descrição:** Retorna dados do usuário logado

**Autenticação:** ✅ JWT obrigatório (cookie)

**Query Parameters:** Nenhum

**Response: 200 OK (Paciente)**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Maria Silva",
    "email": "maria@email.com",
    "role": "patient",
    "cpf": "12345678901",
    "phone": "11987654321",
    "created_at": "2026-01-23T10:30:00Z",
    "updated_at": "2026-01-24T11:00:00Z"
  }
}
```

**Response: 200 OK (Health Professional)**

```json
{
  "success": true,
  "user": {
    "id": 2,
    "name": "Dr. João Cardiologista",
    "email": "joao@clinica.com",
    "role": "health_professional",
    "cpf": "98765432100",
    "phone": "1133334444",
    "professional_details": {
      "specialty": "cardiologia",
      "registration_number": "CRM123456/SP",
      "council": "CFM",
      "consultation_price": 350.0,
      "commission_percentage": 60.0
    },
    "created_at": "2026-01-23T10:30:00Z"
  }
}
```

**Response: 401 Unauthorized (Token inválido/expirado)**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido ou expirado",
    "statusCode": 401
  }
}
```

---

### Endpoint: POST `/api/v1/:clinic_id/auth/logout`

**Descrição:** Faz logout do usuário (limpa o cookie)

**Autenticação:** ✅ JWT obrigatório (cookie)

**Response: 200 OK**

```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

**Cookies Set:**

```
Set-Cookie: token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

---

## 👥 BLOCO 2: USUÁRIOS

### Endpoint: GET `/api/v1/:clinic_id/users`

**Descrição:** Lista usuários do sistema com filtros

**Autenticação:** ✅ JWT obrigatório

**Permissões:** `clinic_admin` | `receptionist` (vê apenas pacientes + profissionais) | `system_admin`

**Query Parameters:**

```
GET /api/v1/:clinic_id/users?role=health_professional&search=João&page=1&pageSize=20
```

- `role` (opcional) - Filtrar por role: `patient` | `receptionist` | `lab_tech` | `health_professional` | `clinic_admin` | `system_admin`
- `search` (opcional) - Buscar por nome (case-insensitive)
- `page` (opcional, default=1) - Número da página
- `pageSize` (opcional, default=20) - Itens por página (máx. 100)

**Response: 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Maria Silva",
      "email": "maria@email.com",
      "role": "patient",
      "cpf": "12345678901",
      "phone": "11987654321",
      "created_at": "2026-01-23T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Dr. João Cardiologista",
      "email": "joao@clinica.com",
      "role": "health_professional",
      "cpf": "98765432100",
      "professional_details": {
        "specialty": "cardiologia",
        "consultation_price": 350.0
      }
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

**Response: 403 Forbidden (Sem permissão)**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Você não tem permissão para listar usuários",
    "statusCode": 403
  }
}
```

---

### Endpoint: GET `/api/v1/:clinic_id/users/:id`

**Descrição:** Obtém dados de um usuário específico

**Autenticação:** ✅ JWT obrigatório

**Permissões:**

- Paciente vê apenas seus dados
- Médico vê seus dados + dados dos pacientes que atendeu
- Recepcionista vê dados de qualquer paciente/profissional
- Admin vê todos

**Path Parameters:**

- `id` (obrigatório) - ID do usuário

**Response: 200 OK**

```json
{
  "success": true,
  "user": {
    "id": 2,
    "name": "Dr. João Cardiologista",
    "email": "joao@clinica.com",
    "role": "health_professional",
    "cpf": "98765432100",
    "phone": "1133334444",
    "professional_details": {
      "id": 1,
      "specialty": "cardiologia",
      "registration_number": "CRM123456/SP",
      "council": "CFM",
      "consultation_price": 350.0,
      "commission_percentage": 60.0
    },
    "created_at": "2026-01-23T10:30:00Z",
    "updated_at": "2026-01-24T11:00:00Z"
  }
}
```

**Response: 404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Usuário não encontrado",
    "statusCode": 404
  }
}
```

**Response: 403 Forbidden (Tentando acessar dados de outro usuário)**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Você não tem permissão para acessar este usuário",
    "statusCode": 403
  }
}
```

---

### Endpoint: PUT `/api/v1/:clinic_id/users/:id`

**Descrição:** Atualiza dados de um usuário

**Autenticação:** ✅ JWT obrigatório

**Permissões:**

- Paciente pode atualizar seus dados (nome, email, telefone)
- Admin pode atualizar qualquer usuário
- Profissional não pode atualizar especialidade/preço (dados profissionais)

**Body Request (Paciente):**

```json
{
  "name": "Maria Silva Santos",
  "email": "maria.silva@email.com",
  "phone": "11987654322"
}
```

**Body Request (Admin - criar/atualizar outros):**

```json
{
  "name": "Dr. João Atualizado",
  "email": "joao.novo@clinica.com",
  "phone": "1133334445"
}
```

**Validações:**

- ✅ `name` - String, mín. 2 caracteres (opcional)
- ✅ `email` - Email válido, único (opcional)
- ✅ `phone` - Formato (XX) XXXXX-XXXX (opcional)
- ⚠️ Não permite alterar `role` ou `password` aqui (endpoints separados)

**Response: 200 OK**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Maria Silva Santos",
    "email": "maria.silva@email.com",
    "role": "patient",
    "phone": "11987654322",
    "updated_at": "2026-01-24T11:15:00Z"
  },
  "message": "Usuário atualizado com sucesso"
}
```

**Response: 409 Conflict (Email já existe)**

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Este email já está registrado",
    "statusCode": 409
  }
}
```

**Response: 403 Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Você não tem permissão para atualizar este usuário",
    "statusCode": 403
  }
}
```

---

### Endpoint: DELETE `/api/v1/:clinic_id/users/:id`

**Descrição:** Desativa um usuário (soft delete - não remove do banco)

**Autenticação:** ✅ JWT obrigatório

**Permissões:** `system_admin` | `clinic_admin`

**Path Parameters:**

- `id` (obrigatório) - ID do usuário

**Response: 200 OK**

```json
{
  "success": true,
  "message": "Usuário desativado com sucesso"
}
```

**Response: 409 Conflict (Tem consultas/transações pendentes)**

```json
{
  "success": false,
  "error": {
    "code": "USER_HAS_PENDING_RECORDS",
    "message": "Usuário não pode ser desativado. Existem 3 consultas pendentes.",
    "statusCode": 409,
    "pending": {
      "appointments": 3,
      "transactions": 0
    }
  }
}
```

**Response: 403 Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Apenas admin pode deletar usuários",
    "statusCode": 403
  }
}
```

---

## 👨‍⚕️ BLOCO 3: PROFISSIONAIS

### Endpoint: GET `/api/v1/:clinic_id/professionals`

**Descrição:** Lista profissionais disponíveis (visualização pública)

**Autenticação:** ❌ Não requerida

**Query Parameters:**

```
GET /api/v1/:clinic_id/professionals?specialty=cardiologia&name=João&page=1&pageSize=10
```

- `specialty` (opcional) - Filtrar por especialidade
- `name` (opcional) - Buscar por nome
- `page` (opcional, default=1)
- `pageSize` (opcional, default=10)

**Response: 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Dr. João Cardiologista",
      "specialty": "cardiologia",
      "consultation_price": 350.0,
      "registration_number": "CRM123456/SP",
      "council": "CFM"
    },
    {
      "id": 3,
      "name": "Dra. Ana Psicóloga",
      "specialty": "psicologia",
      "consultation_price": 120.0,
      "registration_number": "CRP123456/SP",
      "council": "CFP"
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### Endpoint: GET `/api/v1/:clinic_id/professionals/:id/availability`

**Descrição:** Obtém slots disponíveis para agendamento

**Autenticação:** ❌ Não requerida

**Path Parameters:**

- `id` (obrigatório) - ID do profissional

**Query Parameters:**

```
GET /api/v1/:clinic_id/professionals/2/availability?startDate=2026-01-25&endDate=2026-02-01
```

- `startDate` (opcional, default=hoje) - Data inicial (YYYY-MM-DD)
- `endDate` (opcional, default=hoje+7dias) - Data final (YYYY-MM-DD)

**Validações:**

- ✅ `startDate` e `endDate` devem ser datas futuras
- ✅ Máximo 90 dias de antecedência
- ✅ Mínimo 2h para presencial, 1h para online

**Response: 200 OK**

```json
{
  "success": true,
  "professional": {
    "id": 2,
    "name": "Dr. João Cardiologista",
    "specialty": "cardiologia",
    "consultation_price": 350.0
  },
  "data": [
    {
      "date": "2026-01-25",
      "dayOfWeek": "sábado",
      "slots": [
        {
          "time": "09:00",
          "available": true,
          "duration_minutes": 50
        },
        {
          "time": "09:50",
          "available": true,
          "duration_minutes": 50
        },
        {
          "time": "10:40",
          "available": false,
          "duration_minutes": 50,
          "reason": "Já agendado"
        }
      ]
    },
    {
      "date": "2026-01-26",
      "dayOfWeek": "domingo",
      "slots": []
    }
  ]
}
```

**Response: 404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "PROFESSIONAL_NOT_FOUND",
    "message": "Profissional não encontrado",
    "statusCode": 404
  }
}
```

---

### Endpoint: POST `/api/v1/:clinic_id/professionals/:id/availability`

**Descrição:** Cadastra horários de disponibilidade (apenas para o profissional)

**Autenticação:** ✅ JWT obrigatório

**Permissões:** Profissional (pode editar seus próprios horários) | Admin

**Path Parameters:**

- `id` (obrigatório) - ID do profissional

**Body Request:**

```json
{
  "availabilities": [
    {
      "day_of_week": 1,
      "start_time": "09:00",
      "end_time": "12:00",
      "is_active": true
    },
    {
      "day_of_week": 1,
      "start_time": "14:00",
      "end_time": "18:00",
      "is_active": true
    }
  ]
}
```

**Validações:**

- ✅ `day_of_week` - 0-6 (domingo-sábado)
- ✅ `start_time` / `end_time` - Formato HH:MM
- ✅ `start_time` < `end_time`
- ✅ Não sobrepor com outros horários

**Response: 201 Created**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "professional_id": 2,
      "day_of_week": 1,
      "start_time": "09:00",
      "end_time": "12:00",
      "is_active": true
    },
    {
      "id": 2,
      "professional_id": 2,
      "day_of_week": 1,
      "start_time": "14:00",
      "end_time": "18:00",
      "is_active": true
    }
  ],
  "message": "Horários cadastrados com sucesso"
}
```

**Response: 409 Conflict (Horários sobrepostos)**

```json
{
  "success": false,
  "error": {
    "code": "OVERLAPPING_TIMES",
    "message": "Os horários 09:00-10:00 e 09:30-10:30 se sobrepõem no dia 1",
    "statusCode": 409
  }
}
```

---

### Endpoint: GET `/api/v1/:clinic_id/professionals/:id/commissions`

**Descrição:** Obtém comissões do profissional (apenas próprias)

**Autenticação:** ✅ JWT obrigatório

**Permissões:** Profissional (próprias) | Admin (qualquer um)

**Path Parameters:**

- `id` (obrigatório) - ID do profissional

**Query Parameters:**

```
GET /api/v1/:clinic_id/professionals/2/commissions?month=1&year=2026&status=pending
```

- `month` (opcional) - Mês (1-12)
- `year` (opcional) - Ano
- `status` (opcional) - `pending` | `paid` (padrão: todos)

**Response: 200 OK**

```json
{
  "success": true,
  "professional": {
    "id": 2,
    "name": "Dr. João Cardiologista"
  },
  "summary": {
    "month": 1,
    "year": 2026,
    "pending": 1250.5,
    "paid": 5000.0,
    "total": 6250.5
  },
  "details": [
    {
      "id": 1,
      "appointment_id": 5,
      "amount": 202.04,
      "status": "pending",
      "created_at": "2026-01-23T10:30:00Z"
    },
    {
      "id": 2,
      "appointment_id": 6,
      "amount": 210.0,
      "status": "paid",
      "paid_at": "2026-01-10T15:00:00Z"
    }
  ]
}
```

**Response: 403 Forbidden (Acessar comissão de outro profissional)**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Você só pode ver suas próprias comissões",
    "statusCode": 403
  }
}
```

---

## 📅 BLOCO 4: AGENDAMENTOS

### Endpoint: GET `/api/v1/:clinic_id/appointments`

**Descrição:** Lista agendamentos (filtros por role)

**Autenticação:** ✅ JWT obrigatório

**Permissões:**

- Paciente vê seus agendamentos
- Profissional vê seus agendamentos
- Recepcionista vê todos
- Admin vê todos

**Query Parameters:**

```
GET /api/v1/:clinic_id/appointments?status=scheduled&professional_id=2&patient_id=1&date=2026-01-25&upcoming=true&page=1&pageSize=20
```

- `status` (opcional) - `scheduled` | `confirmed` | `completed` | `cancelled_by_patient` | `cancelled_by_clinic` | `no_show`
- `professional_id` (opcional) - Filtrar por profissional
- `patient_id` (opcional) - Filtrar por paciente
- `date` (opcional) - Data específica (YYYY-MM-DD)
- `upcoming` (opcional, boolean) - `true` = apenas futuras
- `page` (opcional, default=1)
- `pageSize` (opcional, default=20)

**Response: 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patient": {
        "id": 1,
        "name": "Maria Silva"
      },
      "professional": {
        "id": 2,
        "name": "Dr. João Cardiologista",
        "specialty": "cardiologia"
      },
      "date": "2026-01-25",
      "time": "09:00",
      "duration_minutes": 50,
      "type": "presencial",
      "status": "scheduled",
      "payment_status": "paid",
      "price": 350.0,
      "room_number": "101",
      "notes": null,
      "created_at": "2026-01-23T10:30:00Z",
      "updated_at": "2026-01-24T11:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### Endpoint: GET `/api/v1/:clinic_id/appointments/:id`

**Descrição:** Obtém detalhes de um agendamento específico

**Autenticação:** ✅ JWT obrigatório

**Permissões:** Paciente (seu agendamento) | Profissional (seu agendamento) | Recepcionista | Admin

**Path Parameters:**

- `id` (obrigatório) - ID do agendamento

**Response: 200 OK**

```json
{
  "success": true,
  "appointment": {
    "id": 1,
    "patient": {
      "id": 1,
      "name": "Maria Silva",
      "email": "maria@email.com",
      "phone": "11987654321"
    },
    "professional": {
      "id": 2,
      "name": "Dr. João Cardiologista",
      "specialty": "cardiologia",
      "registration_number": "CRM123456/SP"
    },
    "date": "2026-01-25",
    "time": "09:00",
    "duration_minutes": 50,
    "type": "presencial",
    "status": "scheduled",
    "payment_status": "paid",
    "price": 350.0,
    "room_number": "101",
    "notes": null,
    "created_at": "2026-01-23T10:30:00Z",
    "updated_at": "2026-01-24T11:00:00Z"
  }
}
```

**Response: 404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "APPOINTMENT_NOT_FOUND",
    "message": "Agendamento não encontrado",
    "statusCode": 404
  }
}
```

---

### Endpoint: POST `/api/v1/:clinic_id/appointments`

**Descrição:** Cria um novo agendamento

**Autenticação:** ✅ JWT obrigatório

**Permissões:** Paciente (criar para si) | Recepcionista (criar para qualquer paciente)

**Body Request:**

```json
{
  "patient_id": 1,
  "professional_id": 2,
  "date": "2026-01-25",
  "time": "09:00",
  "type": "presencial"
}
```

**Validações (Backend):**

- ✅ Horário disponível (verificar `availabilities`)
- ✅ Sem duplicação: paciente NÃO pode ter 2 consultas com mesmo profissional no mesmo dia (RN-04)
- ✅ Antecedência mínima: 2h para presencial (RN-02)
- ✅ Antecedência máxima: 90 dias (RN-03)
- ✅ Data não pode ser no passado
- ✅ Profissional deve existir e ter essa especialidade

**Response: 201 Created**

```json
{
  "success": true,
  "appointment": {
    "id": 1,
    "patient_id": 1,
    "professional_id": 2,
    "date": "2026-01-25",
    "time": "09:00",
    "duration_minutes": 50,
    "type": "presencial",
    "status": "scheduled",
    "payment_status": "pending",
    "price": 350.0,
    "room_number": null,
    "created_at": "2026-01-24T11:15:00Z"
  },
  "payment_required": {
    "amount": 350.0,
    "method": "online_payment_mock"
  },
  "message": "Agendamento criado com sucesso. Proceda com o pagamento."
}
```

**Response: 409 Conflict (Horário indisponível)**

```json
{
  "success": false,
  "error": {
    "code": "SLOT_NOT_AVAILABLE",
    "message": "Horário indisponível. Escolha outro.",
    "statusCode": 409
  }
}
```

**Response: 409 Conflict (Duplicação de agendamento)**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_APPOINTMENT",
    "message": "Você já tem uma consulta com este profissional em 2026-01-25",
    "statusCode": 409
  }
}
```

**Response: 400 Bad Request (Antecedência insuficiente)**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_NOTICE",
    "message": "Antecedência mínima não atingida. Presencial requer 2 horas de antecedência.",
    "statusCode": 400
  }
}
```

---

### Endpoint: DELETE `/api/v1/:clinic_id/appointments/:id`

**Descrição:** Cancela um agendamento

**Autenticação:** ✅ JWT obrigatório

**Permissões:** Paciente (seu agendamento) | Recepcionista | Admin

**Path Parameters:**

- `id` (obrigatório) - ID do agendamento

**Body Request (Opcional):**

```json
{
  "reason": "Compromisso surgiu no trabalho"
}
```

**Validações:**

- ✅ Agendamento deve estar no status `scheduled` ou `confirmed`
- ✅ Cálculo de reembolso: >24h = 100%, <24h = 70%

**Response: 200 OK**

```json
{
  "success": true,
  "appointment": {
    "id": 1,
    "status": "cancelled_by_patient",
    "payment_status": "refunded"
  },
  "refund": {
    "amount": 245.0,
    "percentage": 70,
    "reason": "Cancelamento com menos de 24h",
    "processing": "2-7 dias úteis"
  },
  "message": "Agendamento cancelado com sucesso"
}
```

**Response: 400 Bad Request (Não consegue cancelar)**

```json
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL",
    "message": "Não é possível cancelar uma consulta já realizada",
    "statusCode": 400
  }
}
```

---

### Endpoint: POST `/api/v1/:clinic_id/appointments/:id/reschedule`

**Descrição:** Reagenda um agendamento para outro horário

**Autenticação:** ✅ JWT obrigatório

**Permissões:** Paciente (seu agendamento) | Recepcionista | Admin

**Path Parameters:**

- `id` (obrigatório) - ID do agendamento

**Body Request:**

```json
{
  "new_date": "2026-01-26",
  "new_time": "10:00"
}
```

**Validações:**

- ✅ Novo horário deve estar disponível
- ✅ Não pode duplicar (mesma regra de criação)
- ✅ Antecedência mínima: 2h para presencial
- ✅ Antecedência máxima: 90 dias

**Response: 200 OK**

```json
{
  "success": true,
  "appointment": {
    "id": 1,
    "date": "2026-01-26",
    "time": "10:00",
    "status": "scheduled",
    "payment_status": "paid",
    "updated_at": "2026-01-24T11:20:00Z"
  },
  "message": "Agendamento reagendado com sucesso"
}
```

**Response: 409 Conflict (Novo horário indisponível)**

```json
{
  "success": false,
  "error": {
    "code": "NEW_SLOT_NOT_AVAILABLE",
    "message": "O novo horário não está disponível",
    "statusCode": 409
  }
}
```

---

### Endpoint: POST `/api/v1/:clinic_id/appointments/:id/complete`

**Descrição:** ⚠️ **FORA DO MVP** - Será implementado na versão final

---

## 💳 PAGAMENTOS - MVP (Simplificado)

### ⚠️ Nota Importante

**No MVP, o pagamento é processado AUTOMATICAMENTE quando:**

1. Paciente clica "Confirmar Agendamento"
2. Sistema chama mock do CloudWalk (80% sucesso, 20% falha)
3. Se aprovado → status = `paid`
4. Se falhou → status = `failed` (usuário pode tentar novamente)

**Não há endpoints de pagamento separados no MVP.** O fluxo é integrado no `POST /api/v1/:clinic_id/appointments`.

---

## 🌐 PADRÕES GLOBAIS

### Autenticação

**Método:** JWT armazenado em HttpOnly Cookie

**Header esperado:**

```
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Não é necessário adicionar manualmente em cada requisição** (o navegador faz automaticamente)

**Payload do Token:**

```json
{
  "id": 1,
  "email": "maria@email.com",
  "role": "patient",
  "iat": 1705937640,
  "exp": 1706024040
}
```

**Expiração:** 24 horas

---

### Response Padrão (Sucesso)

```json
{
  "success": true,
  "data": {
    /* payload */
  },
  "pagination": {
    /* se aplicável */
  },
  "message": "Descrição do que aconteceu"
}
```

---

### Response Padrão (Erro)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem legível para o usuário",
    "statusCode": 400,
    "field": "nome_do_campo" // opcional
  }
}
```

---

### Status HTTP Esperados

| Status  | Quando                  | Exemplo                                 |
| ------- | ----------------------- | --------------------------------------- |
| **200** | Requisição bem-sucedida | GET, PUT de sucesso                     |
| **201** | Recurso criado          | POST de sucesso                         |
| **400** | Validação falhou        | Email inválido, senha fraca             |
| **401** | Não autenticado         | Token expirado, faltando JWT            |
| **403** | Não autorizado          | Paciente tentando deletar outro usuário |
| **404** | Recurso não encontrado  | GET em ID inexistente                   |
| **409** | Conflito                | Email duplicado, horário ocupado        |
| **500** | Erro do servidor        | Exceção não tratada                     |

---

### CORS

**Origem permitida:**

```
http://localhost:3001
```

**Headers habilitados:**

```
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

### Rate Limiting (Futuro)

⚠️ **Não implementado no MVP**, mas planejado para versão final:

- Login: 5 tentativas por 15 minutos
- API Geral: 100 requisições por minuto

---

### Timestamps

**Formato:** ISO 8601 com UTC

```
2026-01-24T11:15:00Z
```

---

## 📝 Endpoints que Faltam para MVP Completo

Essas rotas estão FORA do escopo MVP e serão implementadas na **Fase 2**:

### Exames (`/api/v1/:clinic_id/exams`)

- _Implementado no MVP (Sprint 6.1):_ `GET /exams`, `GET /exams/:id`, `POST /exams`
- _Body do POST /exams:_ `appointment_id`, `patient_id`, `exam_name`, `exam_price`, `clinical_indication`

- `GET /api/v1/:clinic_id/exams`
- `GET /api/v1/:clinic_id/exams/:id`
- `POST /api/v1/:clinic_id/exams`
- `POST /api/v1/:clinic_id/exams/:id/result`
- `POST /api/v1/:clinic_id/exams/:id/release`

### Prescrições (`/api/v1/:clinic_id/prescriptions`)

- _Implementado no MVP (Sprint 6.2):_ `GET /prescriptions`, `GET /prescriptions/:id`, `POST /prescriptions`
- _Body do POST /prescriptions:_ `appointment_id`, `patient_id`, `medication_name`

- `GET /api/v1/:clinic_id/prescriptions`
- `GET /api/v1/:clinic_id/prescriptions/:id`
- `POST /api/v1/:clinic_id/prescriptions`

### Pagamentos Completos (`/api/v1/:clinic_id/payments`)

- `GET /api/v1/:clinic_id/payments`
- `GET /api/v1/:clinic_id/payments/:id`
- `POST /api/v1/:clinic_id/payments/:id/refund`

### Relatórios (`/api/v1/:clinic_id/reports`)

- `GET /api/v1/:clinic_id/reports/dashboard`
- `GET /api/v1/:clinic_id/reports/commissions`

### Atendimento (`/api/v1/:clinic_id/appointments`)

- `POST /api/v1/:clinic_id/appointments/:id/checkin`
- `POST /api/v1/:clinic_id/appointments/:id/start`
- `POST /api/v1/:clinic_id/appointments/:id/complete` (com prescrição)
- `POST /api/v1/:clinic_id/appointments/:id/no-show`

---

## 🚀 Próximo Passo

Implementaremos as rotas do MVP nesta ordem:

1. **Autenticação** (Bloco 1) - Base para tudo
2. **Usuários** (Bloco 2) - Cadastro e Gestão
3. **Profissionais** (Bloco 3) - Listagem e Disponibilidade
4. **Agendamentos** (Bloco 4) - Core do negócio + Pagamento Mock

**Status:** Pronto para implementação! ✅
