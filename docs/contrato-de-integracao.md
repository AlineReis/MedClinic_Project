# Contrato de Integração Frontend ↔ Backend

## 1. Visão geral

- O frontend consumirá a API `http://localhost:3000/api/v1/:clinic_id` (substituir `:clinic_id` pelo valor ativo). Todas as requisições protegidas dependem do cookie HttpOnly `token` gerado pelo backend.
- O navegador envia automaticamente esse cookie em chamadas dentro do mesmo domínio. Não é necessário incluir o header `Authorization` manualmente.
- As respostas seguem o padrão `{ success: boolean, data?, pagination?, message?, error? }`. Validar campo `success` antes de renderizar.

## 2. Estratégia de comunicação

- Criar um módulo `apiService` (fetch wrapper) que:
  1. Adiciona `credentials: 'include'` para incluir cookies.
  2. Trata status HTTP 401/403 redirecionando para login.

3.  Normaliza `error` payloads para exibir mensagens amigáveis.

- Tipos de requisição principais:
  - `POST /auth/login`: envia `{ email, password }`, recebe `{ user, message }` tipo `authPayload`.
  - `POST /auth/register`: `{ name, email, password, role, cpf, phone }` (pacientes) e retorna usuário criado.
  - `GET /auth/profile`: valida token e retorna usuário com `professional_details` quando aplicável.
  - `GET /professionals`: recebe filtros `specialty`, `name`, paginação e retorna lista pública com `consultation_price` e `availability` summary.
  - `POST /appointments`: payload `{ patient_id, professional_id, date, time, type }`, resposta inclui `appointment`, `payment_required`.
  - `GET /appointments`: filtros `status`, `professional_id`, `patient_id`, `upcoming`, paginação; resposta padronizada com `pagination`.

## 3. Tratamento de erros

- Para erros 4xx e 5xx, o backend devolve `{ success: false, error: { code, message, statusCode, field? } }`.
- O `apiService` deverá:
  - Gerar um toast/modal com `error.message` para o usuário.
  - Logar `code` para debug.
  - Em 401/403, limpar estado de autenticação e redirecionar para `/login.html`.

## 4. Fluxo de atualizações e cache

- O estado da sessão deve ser inicializado com `GET /auth/profile` logo depois do login e mantido em um singleton (ex: `authStore`).
- Cada página pode reutilizar `apiService` para refazer chamadas com cache simples (ex: `profissionais` guardados por 30 segundos). Evitar chamadas duplicadas durante navegação.

## 5. Headers e configurações adicionais

- `Content-Type: application/json` para POST/PUT.
- Incluir `Accept: application/json` em todos requests.
- Para uploads futuros (exames ou prescrições), usar `FormData` e remover `Content-Type` para que o browser defina corretamente.

> Este documento serve como referência única para frontend e backend manterem um contrato limpo, reduzindo retrabalho e assegurando que validações/segurança do backend sejam respeitadas.
