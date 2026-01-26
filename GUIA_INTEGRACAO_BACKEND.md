# Guia de Integração Frontend-Backend - MedClinic

## 📋 Visão Geral

Este documento explica como integrar o frontend TypeScript com o backend que está sendo desenvolvido pela equipe. O processo é simples e **não requer alterações no backend** - apenas no frontend.

---

## 🎯 Contratos de API Esperados

O frontend espera que o backend exponha os seguintes endpoints REST:

### 1. Autenticação

#### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "user@example.com",
    "role": "medico",
    "cpf": "123.456.789-00",
    "phone": "(11) 98765-4321",
    "avatar": "J",
    "created_at": "2026-01-26T10:00:00Z"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Credenciais inválidas"
}
```

---

#### POST `/api/auth/register`
**Request:**
```json
{
  "name": "Maria Santos",
  "email": "maria@example.com",
  "password": "Senha@123",
  "cpf": "987.654.321-00",
  "phone": "(11) 91234-5678",
  "role": "paciente"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": 5,
    "name": "Maria Santos",
    "email": "maria@example.com",
    "role": "paciente",
    "cpf": "987.654.321-00",
    "phone": "(11) 91234-5678",
    "created_at": "2026-01-26T15:30:00Z"
  }
}
```

---

#### POST `/api/auth/logout`
**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

#### GET `/api/auth/me`
**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "user@example.com",
    "role": "medico"
  }
}
```

---

### 2. Agendamentos

#### GET `/api/appointments`
**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (opcional): `scheduled`, `confirmed`, `completed`, `cancelled`
- `date` (opcional): `2026-01-26`
- `patientId` (opcional): `5`
- `doctorId` (opcional): `2`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patientId": 5,
      "patientName": "Maria Santos",
      "doctorId": 2,
      "doctorName": "Dr. João Silva",
      "specialty": "Cardiologia",
      "date": "2026-01-27",
      "time": "14:30",
      "status": "scheduled",
      "type": "consulta",
      "notes": "Primeira consulta",
      "created_at": "2026-01-26T10:00:00Z"
    }
  ]
}
```

---

#### POST `/api/appointments`
**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "patientId": 5,
  "doctorId": 2,
  "date": "2026-01-27",
  "time": "14:30",
  "type": "consulta",
  "notes": "Primeira consulta"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "patientId": 5,
    "doctorId": 2,
    "date": "2026-01-27",
    "time": "14:30",
    "status": "scheduled",
    "type": "consulta",
    "created_at": "2026-01-26T15:35:00Z"
  }
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Horário já ocupado"
}
```

---

#### DELETE `/api/appointments/:id`
**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Agendamento cancelado com sucesso"
}
```

---

#### PUT `/api/appointments/:id`
**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "date": "2026-01-28",
  "time": "10:00",
  "status": "confirmed"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "date": "2026-01-28",
    "time": "10:00",
    "status": "confirmed"
  }
}
```

---

### 3. Usuários

#### GET `/api/users`
**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `role` (opcional): `admin`, `medico`, `paciente`, `recepcionista`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Dr. João Silva",
      "email": "joao@medclinic.com",
      "role": "medico",
      "cpf": "111.111.111-11",
      "phone": "(11) 91111-1111"
    }
  ]
}
```

---

#### GET `/api/users/:id`
**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Dr. João Silva",
    "email": "joao@medclinic.com",
    "role": "medico",
    "cpf": "111.111.111-11",
    "phone": "(11) 91111-1111",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### 4. Disponibilidade

#### GET `/api/professionals/:id/availability`
**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `date` (obrigatório): `2026-01-27`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "professionalId": 2,
    "date": "2026-01-27",
    "availableSlots": [
      "08:00",
      "08:30",
      "09:00",
      "14:00",
      "14:30",
      "15:00"
    ]
  }
}
```

---

#### POST `/api/availability`
**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "professional_id": 2,
  "day_of_week": 1,
  "start_time": "08:00",
  "end_time": "12:00"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "professional_id": 2,
    "day_of_week": 1,
    "start_time": "08:00",
    "end_time": "12:00",
    "is_active": true
  }
}
```

---

## 🔧 Como Integrar no Frontend

### Passo 1: Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_DATA=false
```

---

### Passo 2: Criar Cliente HTTP

Crie o arquivo `frontend_src/services/api-client.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class ApiClient {
    private getHeaders(): HeadersInit {
        const token = localStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    async request<T>(endpoint: string, method: string, body?: unknown): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers: this.getHeaders(),
                body: body ? JSON.stringify(body) : undefined
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    get<T>(endpoint: string) {
        return this.request<T>(endpoint, 'GET');
    }

    post<T>(endpoint: string, body: unknown) {
        return this.request<T>(endpoint, 'POST', body);
    }

    put<T>(endpoint: string, body: unknown) {
        return this.request<T>(endpoint, 'PUT', body);
    }

    delete<T>(endpoint: string) {
        return this.request<T>(endpoint, 'DELETE');
    }
}

export default new ApiClient();
```

---

### Passo 3: Atualizar `services/auth.ts`

**Antes (LocalStorage):**
```typescript
async login(email: string, password: string) {
    const user = DB.users.findByEmail(email);
    if (!user) throw new Error('Usuário não encontrado');
    return { user };
}
```

**Depois (API):**
```typescript
import apiClient from './api-client';

async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    
    if (response.success && response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('medclinic_user', JSON.stringify(response.user));
        return response;
    }
    
    throw new Error(response.error || 'Erro ao fazer login');
}
```

---

### Passo 4: Atualizar `services/schedule.ts`

**Antes (LocalStorage):**
```typescript
async createAppointment(data: AppointmentFormData) {
    const newAppt = DB.appointments.create(data);
    return newAppt;
}
```

**Depois (API):**
```typescript
import apiClient from './api-client';

async createAppointment(data: AppointmentFormData) {
    const response = await apiClient.post('/appointments', data);
    
    if (response.success) {
        return response.data;
    }
    
    throw new Error(response.error || 'Erro ao criar agendamento');
}
```

---

## 🧪 Testando a Integração

### 1. Com Backend Real
```bash
# No terminal do backend
npm run dev  # Backend roda em http://localhost:3000

# No terminal do frontend
VITE_API_BASE_URL=http://localhost:3000/api npm run dev
```

### 2. Com Mock (Desenvolvimento)
```bash
# .env
VITE_USE_MOCK_DATA=true

# Frontend continua usando LocalStorage
npm run dev
```

---

## 📝 Checklist de Integração

- [ ] Backend expõe endpoints conforme especificado
- [ ] Backend retorna JSON no formato esperado
- [ ] Backend aceita `Authorization: Bearer {token}` nos headers
- [ ] CORS configurado no backend para aceitar requisições do frontend
- [ ] Criar arquivo `.env` no frontend com `VITE_API_BASE_URL`
- [ ] Criar `api-client.ts` no frontend
- [ ] Atualizar `auth.ts` para usar API
- [ ] Atualizar `schedule.ts` para usar API
- [ ] Testar login
- [ ] Testar criação de agendamento
- [ ] Testar listagem de dados

---

## 🔒 Segurança

### Headers Necessários no Backend

```javascript
// Express.js exemplo
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});
```

### Validação de Token JWT

O backend deve validar o token em todas as rotas protegidas:

```javascript
// Middleware de autenticação
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}
```

---

## 🐛 Troubleshooting

### Erro: CORS blocked
**Solução:** Configurar CORS no backend para aceitar origem do frontend

### Erro: 401 Unauthorized
**Solução:** Verificar se o token está sendo enviado corretamente no header

### Erro: Network request failed
**Solução:** Verificar se o backend está rodando e se a URL está correta

---

## 📞 Contato

Para dúvidas sobre integração, consulte:
- Documentação da API do backend
- Arquivo `types.ts` no frontend (contratos de dados)
- Este guia

---

**Última atualização:** 26/01/2026
