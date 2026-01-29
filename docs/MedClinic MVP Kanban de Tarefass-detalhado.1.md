# 🎯 MedClinic MVP - Kanban Detalhado

Este documento expande cada tarefa da coluna "TODO" do Kanban original, mantendo o nível profissional solicitado e oferecendo contexto suficiente para que desenvolvedores iniciantes consigam seguir sem perder o foco. Cada cartão descreve rotas impactadas, camadas envolvidas, arquivos que provavelmente serão alterados, apoio documental e uma definição clara de pronto.

### 1.1.1 | Configurar repositório Git com .gitignore (Node + TypeScript)

**Rota afetada:** nenhuma
**Service / Repository / Controller:** ciclo de DevOps
**Arquivos provavelmente afetados:** `.gitignore`, `.github/workflows` (quando houver), scripts de setup
**Descrição:** inicializar o repositório com o `.gitignore` adequado para Node/TypeScript, garantindo que `node_modules`, builds e arquivos sensíveis sejam ignorados.
**Ponto de apoio:** boas práticas Git e o padrão do projeto (ver `.clinerules`)
**Definition of Done:** `.gitignore` cobre dependências, builds e arquivos temporários; `git status` limpo após install.
**Dependências:** nenhuma
**Atenção:** mantenha consistência com `.gitignore` global do projeto (ver `.clineignore`).

---

### 1.1.2 | Instalar dependências: express, typescript, sqlite3, jsonwebtoken, bcrypt

**Rota afetada:** nenhuma
**Service / Repository / Controller:** ambiente de execução Node
**Arquivos provavelmente afetados:** `package.json`, `package-lock.json`, `tsconfig.json`
**Descrição:** adicionar dependências essenciais (Express para servidor, SQLite para DB, JWT para auth, bcrypt para hashes) e registrar as versões.
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md` para alinhamento de versões
**Definition of Done:** `npm install` atualiza `package-lock` automaticamente e projeto passa a compilar com `tsc`.
**Dependências:** Node/NPM corretos instalados
**Atenção:** use `npm install --save` (sem `-g`), documentar versões fixas para reprodutibilidade.

---

### 1.1.3 | Configurar tsconfig.json com strict mode

**Rota afetada:** build TypeScript
**Service / Repository / Controller:** toolchain TypeScript
**Arquivos provavelmente afetados:** `tsconfig.json`
**Descrição:** ativar `strict`, incluir `esModuleInterop`, apontar para `src` e `build` corretamente e habilitar `sourceMap` para debugging.
**Ponto de apoio:** TypeScript Handbook recomendado
**Definition of Done:** `tsc --noEmit` roda sem erros e detecta qualquer tipagem fraca.
**Dependências:** dependências de tipo (`@types/express`, etc.) quando necessário
**Atenção:** verifique `exclude`/`include` para evitar compilar `node_modules`.

---

### 1.1.4 | Criar arquivo package.json com scripts (dev, build, test, seed)

**Rota afetada:** scripts npm
**Service / Repository / Controller:** package scripts
**Arquivos provavelmente afetados:** `package.json`
**Descrição:** definir metadata (name, version), dependências e scripts `npm run dev`, `npm run build`, `npm run test`, `npm run seed` conforme convenções do projeto.
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md` para nomenclatura de scripts
**Definition of Done:** comandos `npm run dev`, `npm run build`, `npm run test`, `npm run seed` executáveis localmente.
**Dependências:** dependências instaladas (1.1.2)
**Atenção:** scripts devem usar `ts-node`/`ts-node/register` quando rodar em TS e `cross-env` se precisar de env cross-platform.

---

### 1.1.5 | Estruturar pastas do projeto (src/, tests/, frontend_src/)

**Rota afetada:** organização do repo
**Service / Repository / Controller:** estrutura de pastas
**Arquivos provavelmente afetados:** `package.json`, `.gitignore`, `tsconfig.json`
**Descrição:** criar diretórios principais com inicializadores (`src/app.ts`, `src/server.ts`, `frontend_src/`, `tests/`), garantindo consistência de convenções (controller/service/repository).
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md`
**Definition of Done:** pastas existem, `tsconfig` referencia `src`, e `tests` aparece no `tsconfig`/`mocharc` para runner.
**Dependências:** `tsconfig` (1.1.3), `package.json` (1.1.4)
**Atenção:** mantê-las no controle de versão e documentar em README.

---

### 1.2.1 | Criar `schema.sql` com tabela `users`

**Rota afetada:** estrutura do banco
**Service / Repository / Controller:** migrations/DB schema
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/medclinic.db`
**Descrição:** definir tabela `users` com colunas id, name, email, password_hash, role, cpf, phone, created_at, deleted_at e constraints `UNIQUE(email)`.
**Ponto de apoio:** `docs/Diagrama DER - MedClinic.pdf`
**Definition of Done:** tabela criada sem erros e indexes aplicados, seeds referenciam os campos.
**Dependências:** script de seed (1.3.\*) e `config/database.ts`
**Atenção:** defina default role e timestamps com `CURRENT_TIMESTAMP`.

---

### 1.2.2 | Criar tabela `professional_details`

**Rota afetada:** dados de profissionais
**Service / Repository / Controller:** schema
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/medclinic.db`
**Descrição:** criar tabela com fk para `users`, campos `specialty`, `registration_number`, `council`, `consultation_price`, `commission_percentage` com checks para valores positivos.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** constraints garantem que `professional_details` só existam para `health_professional` e que price/commission sejam positivos.
**Dependências:** `users` (1.2.1)
**Atenção:** use `ON DELETE CASCADE` se fizer sentido para manter integridade.

---

### 1.2.3 | Criar tabela `professional_availabilities`

**Rota afetada:** disponibilidade
**Service / Repository / Controller:** schema
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/medclinic.db`
**Descrição:** definir tabela com campos `professional_id`, `day_of_week`, `start_time`, `end_time`, `is_active`, índices em `professional_id`.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** constraints garantem `day_of_week` 0-6, `end_time > start_time`, `is_active` default true.
**Dependências:** `professional_details` (1.2.2)
**Atenção:** use `CHECK` para `day_of_week` e `start_time < end_time`.

---

### 1.2.4 | Criar tabela `appointments`

**Rota afetada:** agendamentos
**Service / Repository / Controller:** schema
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/medclinic.db`
**Descrição:** schema com colunas `patient_id`, `professional_id`, `date`, `time`, `duration_minutes`, `type`, `status`, `payment_status`, `price`, `room_number`, `notes`, `created_at`, `updated_at` e foreign keys.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** constraints garantem integridade referencial com `users`, `professional_details` e `transaction_logs`.
**Dependências:** `users`, `professional_details`
**Atenção:** use `status` enums e `payment_status` (scheduled/pending/paid/cancelled).

---

### 1.2.5 | Criar tabela `transaction_logs`

**Rota afetada:** pagamentos
**Service / Repository / Controller:** schema
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/medclinic.db`
**Descrição:** registrar `appointment_id`, `amount_gross`, `mdr_amount`, `amount_net`, `status`, `created_at` para auditoria.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** log criado com `status` enumerado (e.g., `pending`, `paid`) e `amount_net` calculado.
**Dependências:** `appointments` (1.2.4)
**Atenção:** mdr (3.79%) deve ser persistido com 2 casas.

---

### 1.2.6 | Criar tabela `commission_splits`

**Rota afetada:** comissões
**Service / Repository / Controller:** schema
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/medclinic.db`
**Descrição:** associar `transaction_id`, `professional_id`, `clinic_id`, `system_id`, `amount`, `status`.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** cada transação gera três splits (60/35/5) gravados.
**Dependências:** `transaction_logs` (1.2.5)
**Atenção:** status `pending`/`paid` deve acompanhar cada split.

---

### 1.2.7 | Implementar indexes essenciais

**Rota afetada:** performance das consultas
**Service / Repository / Controller:** schema
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/medclinic.db`
**Descrição:** criar índices em `users(email)`, `appointments(patient_id, professional_id, date)`, `professional_availabilities(professional_id)` e qualquer outro necessário.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** consultas com filtros `email`, range de `appointments` e `availabilities` usam índices e tabela `sqlite_master` mostra os índices.
**Dependências:** tabelas criadas (1.2.1-1.2.4)
**Atenção:** evite indexes redundantes que penalizam inserts.

---

### 1.3.1 | Criar `config/database.ts` com Singleton pattern para SQLite3

**Rota afetada:** inicialização do app
**Service / Repository / Controller:** `src/config/database.ts`
**Arquivos provavelmente afetados:** `src/config/database.ts`, `src/app.ts`
**Descrição:** exportar instância única do DB, lidando com `PRAGMA foreign_keys=ON`, caching e path do banco.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** importações reutilizam o mesmo pool e o DB não abre múltiplas conexões concorrentes.
**Dependências:** `schema.sql` (1.2.\*)
**Atenção:** habilitar logger condicional (logs apenas `NODE_ENV !== production`).

---

### 1.3.2 | Implementar `database/seed.ts` com perfis iniciais

**Rota afetada:**
**Service / Repository / Controller:** seed
**Arquivos provavelmente afetados:** `database/seed.ts`, `src/config/database.ts`, `database/medclinic.db`
**Descrição:** popular DB com 1 system_admin, 1 clinic_admin, 1 receptionist, 3 health_professionals, 5 patients + registros relacionados (professional_details, availabilities).
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md`
**Definition of Done:** `npm run seed` limpa e reinicia DB com dados consistentes.
**Dependências:** `schema.sql` + `config/database`
**Atenção:** garantir senhas hashed e roles corretos, e evite inserir duplicados ao reexecutar.

---

### 1.3.3 | Criar script npm para rodar migrations e seed no startup

**Rota afetada:** pipeline local e scripts de desenvolvimento
**Service / Repository / Controller:** scripts npm (`package.json`)
**Arquivos provavelmente afetados:** `package.json`, `database/seed.ts`, `src/database/schema.sql`, `scripts/generate_insomnia.js`
**Descrição:** criar script idempotente (`npm run db:setup` ou similar) que prepara o schema e popula dados iniciais antes de executar o servidor em ambientes de desenvolvimento e CI.
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** comando roda `ts-node src/database/schema.sql`/`database/seed.ts`, respeita `NODE_ENV`, e documenta o fluxo no README.
**Dependências:** `tsconfig` com `ts-node/register` e dependências instaladas (1.1.2)
**Atenção:** não sobrescrever dados em produção; use variáveis para identificar ambientes.

---

### 1.3.4 | Validar integridade referencial e constraints

**Rota afetada:** nenhuma diretamente, mas impacta todas as operações CRUD
**Service / Repository / Controller:** `src/database/schema.sql`, `src/config/database.ts`
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/seed.ts`, `src/repositories/*`
**Descrição:** adicionar scripts/rotinas que verificam `PRAGMA foreign_keys=ON`, `CHECK`, e `UNIQUE`, garantindo que tabelas recém-criadas seguem o DER descrito em `docs/MedclinicDB_Implementacao.md` antes de rodar seeds ou tests.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`, `docs/Diagrama DER - MedClinic.md`
**Definition of Done:** rotina detecta violações de FK/constraints e impede deploys old schema; logs indicam inconsistências para revisão.
**Dependências:** `config/database.ts` (1.3.1), `schema.sql` (1.2.\*)
**Atenção:** use transações ao reaplicar schema para evitar metadados quebrados.

---

### 2.1.1 | Criar `services/AuthService.ts` com método `registerPatient(name, email, password, cpf, phone)`

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `AuthService`
**Arquivos provavelmente afetados:** `src/services/AuthService.ts`, `src/repositories/UserRepository.ts`, `src/utils/validators.ts`
**Descrição:** implementar lógica de cadastro, validações básicas, hash de password e persistência do paciente.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** método expõe `registerPatient`, retorna user sem senha e chama validators e hash corretamente.
**Dependências:** `validators` (7.2.1), `UserRepository` (3.1.1)
**Atenção:** impedir duplicação de email e CPF antes de persistir.

---

### 2.1.2 | Implementar hash bcrypt para passwords (10 rounds)

**Rota afetada:** segurança do login/register
**Service / Repository / Controller:** `AuthService`
**Arquivos provavelmente afetados:** `src/services/AuthService.ts`
**Descrição:** usar `bcrypt.hash(password, 10)` ao criar usuário e `bcrypt.compare` no login.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** senhas persistidas não expõem o texto plano e comparações retornam verdadeiro/false.
**Dependências:** `bcrypt` já instalado (1.1.2)
**Atenção:** captura erros do bcrypt (ex: hashing falha) e responde `500`.

---

### 2.1.3 | Implementar validação: email único no banco

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `AuthService`, `UserRepository`
**Arquivos provavelmente afetados:** `src/services/AuthService.ts`, `src/repositories/UserRepository.ts`
**Descrição:** verificar se já existe usuário com o email informado antes de cadastrar.
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md`
**Definition of Done:** duplicação retorna `409` com código `EMAIL_DUPLICATE` e não insere usuário.
**Dependências:** índice UNIQUE em `users(email)` (1.2.7)
**Atenção:** use transações ou locks se necessário.

---

### 2.1.4 | Implementar validação: CPF formato XXX.XXX.XXX-XX (regex)

**Rota afetada:** register
**Service / Repository / Controller:** `AuthService`, `utils/validators.ts`
**Arquivos provavelmente afetados:** `src/services/AuthService.ts`, `src/utils/validators.ts`
**Descrição:** garantir CPF segue máscara (sem calc digitos) usando regex.
**Ponto de apoio:** `docs/REGRAS_DE_NEGOCIO_MINI_DESAFIO.txt`
**Definition of Done:** CPF fora do formato retorna 400 `INVALID_CPF` sem persistir.
**Dependências:** validators (7.2.1)
**Atenção:** logar um warning se CPF contiver apenas números repetidos.

---

### 2.1.5 | Implementar validação: senha 8+, 1 maiúscula, 1 minúscula, 1 número

**Rota afetada:** register
**Service / Repository / Controller:** `AuthService`, `utils/validators.ts`
**Arquivos provavelmente afetados:** `src/services/AuthService.ts`, `src/utils/validators.ts`
**Descrição:** criar regra no validator para verificar tamanho e composição de senha antes de registrar.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** senha fraca retorna 400 `WEAK_PASSWORD` e registro é rejeitado.
**Dependências:** validators (7.2.1)
**Atenção:** atualize testes para cobrir cada regra.

---

### 2.1.6 | Criar método `login(email, password)` que retorna JWT

**Rota afetada:** `POST /api/v1/:clinic_id/auth/login`
**Service / Repository / Controller:** `AuthService`, `AuthController`
**Arquivos provavelmente afetados:** `src/services/AuthService.ts`, `src/controllers/AuthController.ts`, `src/config/gsd-framework.md`
**Descrição:** validar credenciais, comparar hashes e gerar JWT com payload `{id, email, role}`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** login retorna JWT no cookie e `success: true` com user.
**Dependências:** `bcrypt` (2.1.2), JWT secret env var.
**Atenção:** invalid credentials devem responder 401 sem revelar se email existe.

---

### 2.1.7 | Implementar JWT com expiração 24h, payload {id, email, role, iat, exp}

**Rota afetada:** login + profile
**Service / Repository / Controller:** `AuthService`, `authMiddleware`
**Arquivos provavelmente afetados:** `src/services/AuthService.ts`, `src/middlewares/authMiddleware.ts`
**Descrição:** configurar `jsonwebtoken.sign(payload, secret, { expiresIn: '24h' })` e verificar no middleware.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** token contém claims, expira em 24h e middleware respeita expiração.
**Dependências:** `.env` com JWT_SECRET
**Atenção:** manter `iat` e `exp` na resposta para debugging.

---

### 2.2.1 | Criar `controllers/AuthController.ts` com método `register`

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `AuthController`
**Arquivos provavelmente afetados:** `src/controllers/AuthController.ts`, `src/services/AuthService.ts`
**Descrição:** receber payload, chamar `AuthService.registerPatient`, tratar erros e retornar response com cookie.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** controller responde 201 com user e seta cookie HttpOnly.
**Dependências:** `AuthService` e validators
**Atenção:** sanitize input e use try/catch para erros do service.

---

### 2.2.2 | Criar rota `POST /api/v1/:clinic_id/auth/register` com validações

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `AuthController`, `routes/auth.routes.ts`
**Arquivos provavelmente afetados:** `src/routes/auth.routes.ts`, `src/controllers/AuthController.ts`, `src/middlewares/validatorsMiddleware.ts` (se existir)
**Descrição:** montar rota no router `auth.routes.ts`, aplicar middlewares de validação e chamar controller.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota aceita POST, aplica validacoes e devolve `success` com JWT cookie.
**Dependências:** controllers rotas e validators (7.2.1)
**Atenção:** preserve o `clinic_id` param e use router param `mergeParams`.

---

### 2.2.3 | Criar `controllers/AuthController.ts` método `login`

**Rota afetada:** `POST /api/v1/:clinic_id/auth/login`
**Service / Repository / Controller:** `AuthController`, `AuthService`
**Arquivos provavelmente afetados:** `src/controllers/AuthController.ts`, `src/services/AuthService.ts`
**Descrição:** receber credenciais, chamar `AuthService.login`, lidar com JWT e resposta 200.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** login retorna JWT cookie e body com user.
**Dependências:** `AuthService` (2.1.6), middlewares (2.3.\*)
**Atenção:** usar `HttpOnly` cookie e expor refresh token se necessário futuro.

---

### 2.2.4 | Criar rota `POST /api/v1/:clinic_id/auth/login` (set HttpOnly Cookie)

**Rota afetada:** `POST /api/v1/:clinic_id/auth/login`
**Service / Repository / Controller:** `AuthController`, `routes/auth.routes.ts`
**Arquivos provavelmente afetados:** `src/routes/auth.routes.ts`, `src/controllers/AuthController.ts`
**Descrição:** montar rota no router, aplicar validações e delegar ao controller.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota responde com status 200 e cookie `jwt` HttpOnly.
**Dependências:** controller 2.2.3, validators 7.2.1
**Atenção:** configure `sameSite` e `secure` conforme ENV.

---

### 2.2.5 | Criar rota `GET /api/v1/:clinic_id/auth/profile` (requer JWT)

**Rota afetada:** `GET /api/v1/:clinic_id/auth/profile`
**Service / Repository / Controller:** `AuthController`, `authMiddleware`
**Arquivos provavelmente afetados:** `src/routes/auth.routes.ts`, `src/controllers/AuthController.ts`, `src/middlewares/authMiddleware.ts`
**Descrição:** rota protegida retorna dados do `req.user` populado pelo middleware.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** middleware valida JWT e controller retorna perfil sem senha.
**Dependências:** middleware (2.3.1)
**Atenção:** respeite RBAC (users only own data or admin).

---

### 2.2.6 | Criar rota `POST /api/v1/:clinic_id/auth/logout` (limpa cookie)

**Rota afetada:** `POST /api/v1/:clinic_id/auth/logout`
**Service / Repository / Controller:** `AuthController`
**Arquivos provavelmente afetados:** `src/routes/auth.routes.ts`, `src/controllers/AuthController.ts`
**Descrição:** invalidar cookie JWT (set empty, expires now) e retornar success.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota responde 200 e cookie neutralizado.
**Dependências:** nenhuma além do controller
**Atenção:** use `res.clearCookie('jwt', { httpOnly: true, secure })`.

**Rota afetada:** pipeline de desenvolvimento
**Service / Repository / Controller:** npm scripts
**Arquivos provavelmente afetados:** `package.json`, `scripts/` se existir
**Descrição:** script `npm run seed` (ou `npm run migrate`) executa `ts-node database/seed.ts` após rodar `schema.sql`.
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md`
**Definition of Done:** comando documentado, roda `schema.sql` e `seed.ts` em sequência.
**Dependências:** `tsconfig`, `database/seed.ts`
**Atenção:** script idempotente, use `DROP TABLE IF EXISTS` com cuidado ou `DELETE FROM`.

**Rota afetada:** nenhuma (infraestrutura de banco de dados)
**Service / Repository / Controller:** config/database.ts + migrations e seeds (sem controlador específico)
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `src/config/database.ts`, `database/medclinic.db`, `database/seed.ts`
**Descrição:** consolidar as constraints mencionadas em `MedclinicDB_Implementacao.md` e garantir que os relacionamentos em `schema.sql` imponham integridade referencial (FK, UNIQUE, CHECK) antes de executar seeds.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** o schema roda sem erros, as constraints impedem referências inválidas, e os seeds não quebram por falta de integridade.
**Dependências:** schema.sql deve refletir exatamente o DER e a seed deve rodar com essas constraints.
**Atenção:** altere as constraints com cuidado, pois SQLite ignora `ALTER TABLE` para FK em versões antigas—recrie tabelas / use PRAGMA `foreign_keys=ON`.

---

### 2.3.1 | Middleware de autenticação JWT

**Rota afetada:** todas as rotas sob `/api/v1/:clinic_id` protegidas
**Service / Repository / Controller:** `middlewares/authMiddleware.ts`
**Arquivos provavelmente afetados:** `src/middlewares/authMiddleware.ts`, `src/controllers/*`, `src/routes/*.ts`
**Descrição:** verificar cookie JWT, validar expiração, anexar `req.user` e propagar erros para handlers.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedClinic MVP - Code Style Guide.md`
**Definition of Done:** requests sem token recebem 401, token expirado retorna 401 e `req.user` contém id/email/role ao continuar.
**Dependências:** esquemas de tokens definidos em AuthService e .env (JWT_SECRET).
**Atenção:** evite bloquear rotas públicas; use `next()` nos casos permitidos e sanitize tokens invalidos para não vazar stack.

---

### 2.3.2 | Middleware RBAC

**Rota afetada:** rotas de usuários, profissionais, appointments, exames, prescrições
**Service / Repository / Controller:** `middlewares/rbacMiddleware.ts`, `controllers/*`
**Arquivos provavelmente afetados:** `src/middlewares/rbacMiddleware.ts`, `src/controllers/UserController.ts`, `src/routes/*.ts`
**Descrição:** ler role do `req.user`, comparar com roles permitidas definidas na rota, rejeitar com 403 caso não autorizado.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** cada rota define allowed roles e a middleware bloqueia acessos indevidos com mensagem padronizada.
**Dependências:** depende do middleware de autenticação (2.3.1) e do populate correto de `req.user.role`.
**Atenção:** mantenha lista pequena de roles permitidos e evite string hard-coded replicada em vários arquivos.

---

### 2.3.3 | CORS configurado para frontend (localhost:3001)

**Rota afetada:** todas as APIs (headers)
**Service / Repository / Controller:** `src/app.ts`
**Arquivos provavelmente afetados:** `src/app.ts`, `src/middlewares/errorHandler.ts`
**Descrição:** permitir origem `http://localhost:3001`, métodos GET/POST/PUT/DELETE e credentials para cookies.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** browser local ao rodar frontend consegue consumir API sem CORS, header `Access-Control-Allow-Origin` presente.
**Dependências:** middleware deve rodar antes das rotas e respeitar `NODE_ENV` em produção.
**Atenção:** atualizar quando frontend for deployado (nova origem) e garantir não abrir wildcard em produção.

---

### 3.1.1 | Criar `repositories/UserRepository.ts` com CRUD básico

**Rota afetada:** todas as operações de usuários
**Service / Repository / Controller:** `UserRepository`
**Arquivos provavelmente afetados:** `src/repositories/UserRepository.ts`, `src/models/User.ts`
**Descrição:** definir métodos `create`, `findById`, `findByEmail`, `update`, `softDelete`, `list` com filtros e paginação.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** repositório expõe assinaturas usadas por services, usa prepared statements e trata erros do SQLite.
**Dependências:** `config/database.ts`, `schema.sql` (1.2)
**Atenção:** a soft delete deve setar `deleted_at` e os selects devem ignorar registros deletados.

---

### 3.1.2 | Criar `services/UserService.ts` com lógica de negócio

**Rota afetada:** `GET /api/v1/:clinic_id/users`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`
**Service / Repository / Controller:** `UserService`
**Arquivos provavelmente afetados:** `src/services/UserService.ts`, `src/repositories/UserRepository.ts`, `src/utils/validators.ts`
**Descrição:** implementar listagem, criação, atualização e soft delete respeitando RBAC e validando dados.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** service expõe métodos usados pelos controllers e respeita regras de permissão/validação.
**Dependências:** `UserRepository` (3.1.1) e validators (7.2.1)
**Atenção:** evite leaking de senhas e normalize textos (trim).

---

### 3.1.3 | Garantir getUserById retorna `professional_details`

**Rota afetada:** todas as rotas
**Service / Repository / Controller:** `src/app.ts`
**Arquivos provavelmente afetados:** `src/app.ts`, `package.json`
**Descrição:** aplicar `helmet()` para `X-Frame-Options`, `XSS Protection`, `Strict-Transport-Security` e similar.
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md`
**Definition of Done:** requests retornam headers de segurança, logs mostram helmet inicializado.
**Dependências:** nenhum (apenas adicionar middleware antes das rotas).
**Atenção:** não use `helmet.hidePoweredBy()` se quiser manter o header por compliance? documentar escolha.

---

### 2.4.1 | Teste: registrar paciente válido retorna 201

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `AuthController` / `AuthService`
**Arquivos provavelmente afetados:** `src/__tests__/auth.routes.test.ts`, `src/controllers/AuthController.ts`, `src/services/AuthService.ts`
**Descrição:** enviar payload completo para registro, garantir hash bcrypt salvo e cookie retornado.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `.mocharc.json`
**Definition of Done:** response 201, JSON com user (sem password) e cookie `jwt` no header.
**Dependências:** database seeded (Fase 1) e validators (7.2.1).
**Atenção:** limpar usuários duplicados entre testes para evitar 409.

---

### 2.4.2 | Teste: email duplicado retorna 409 CONFLICT

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `AuthController` / `AuthService`
**Arquivos provavelmente afetados:** `src/__tests__/auth.routes.test.ts`, `src/services/AuthService.ts`
**Descrição:** tentar registrar com email já existente e certificar-se de que a resposta inclui erro `EMAIL_DUPLICATE`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** status 409, mensagem clara e sem alteração no banco.
**Dependências:** constraints de unique email no banco (Fase 1.2.1).
**Atenção:** use transação ou database reset pois teste deve rodar repetidas vezes.

---

### 2.4.3 | Teste: senha fraca retorna 400

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `AuthController` / `AuthService`
**Arquivos provavelmente afetados:** `src/__tests__/auth.routes.test.ts`, `src/utils/validators.ts`
**Descrição:** enviar senha sem requisitos, verificar erro de validação e que senha não é persistida.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** status 400, payload com código `WEAK_PASSWORD` e body intacto.
**Dependências:** validator (7.2.1) e hashing (2.1.2).
**Atenção:** tests devem cobrir vários padrões de senha (sem maiúscula, sem número).

---

### 2.4.4 | Teste: CPF inválido retorna 400

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `AuthController` / `AuthService`
**Arquivos provavelmente afetados:** `src/__tests__/auth.routes.test.ts`, `src/utils/validators.ts`
**Descrição:** enviar CPF fora do formato esperado e garantir 400 com `INVALID_CPF`.
**Ponto de apoio:** `docs/REGRAS_DE_NEGOCIO_MINI_DESAFIO.txt`
**Definition of Done:** response 400 e registro não criado.
**Dependências:** validator 7.2.1.
**Atenção:** não confundir formatação com validação numérica (MVP só formatação).

---

### 2.4.5 | Teste: login com credenciais corretas retorna 200 + cookie

**Rota afetada:** `POST /api/v1/:clinic_id/auth/login`
**Service / Repository / Controller:** `AuthController` / `AuthService`
**Arquivos provavelmente afetados:** `src/__tests__/auth.routes.test.ts`, `src/controllers/AuthController.ts`, `src/services/AuthService.ts`
**Descrição:** autenticar usuário registrado, verificar JWT cookie, status 200 e payload com user.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** 200 OK, cookie `jwt`, e user payload sem senha.
**Dependências:** usuário já registrado (2.4.1) e hashing red (2.1.2).
**Atenção:** tests devem limpar cookies entre execuções.

---

### 3.1.3 | Garantir getUserById retorna `professional_details`

**Rota afetada:** `GET /api/v1/:clinic_id/users/:id`
**Service / Repository / Controller:** `UserService.getUserById` / `UserRepository` / `UserController`
**Arquivos provavelmente afetados:** `src/services/UserService.ts`, `src/repositories/UserRepository.ts`, `src/controllers/UserController.ts`
**Descrição:** carregar os detalhes profissionais sempre que o usuário for `health_professional`, joindando `professional_details` e mantendo os filtros de RBAC descritos em `DOC_API_ROTAS.md`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** resposta inclui `professional_details` completos para médicos, tests de unidade confirmam o comportamento e o controller ignora o campo para outros roles.

---

### 3.2.1 | Criar `controllers/UserController.ts`

**Rota afetada:** `/api/v1/:clinic_id/users` todos verbos
**Service / Repository / Controller:** `UserController`
**Arquivos provavelmente afetados:** `src/controllers/UserController.ts`, `src/services/UserService.ts`, `src/routes/users.routes.ts`
**Descrição:** validar permissões, delegar para o serviço e retornar respostas padronizadas.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** endpoints `GET`, `POST`, `PUT`, `DELETE` chamam `UserService`, respondem `success`/`errors` e usam o error handler.
**Dependências:** `UserService` (3.1.2), middlewares (2.3)
**Atenção:** o `clinic_id` precisa ser carregado do `req.params` e as rotas devem aplicar RBAC.

---

### 3.2.2 | Criar rota `GET /api/v1/:clinic_id/users` (clinic_admin, receptionist, system_admin apenas)

**Rota afetada:** `GET /api/v1/:clinic_id/users`
**Service / Repository / Controller:** `UserController`, `routes/users.routes.ts`, `rbacMiddleware`
**Arquivos provavelmente afetados:** `src/routes/users.routes.ts`, `src/controllers/UserController.ts`, `src/middlewares/rbacMiddleware.ts`
**Descrição:** só pessoas com roles permitidas acessam a lista de usuários; paginar e filtrar.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** rota registrada, aplica rbac e devolve `data` com users.
**Dependências:** controller 3.2.1, rbac middleware 2.3.2
**Atenção:** use middleware antes do controller e documente roles.

---

### 3.2.3 | Implementar filtros: role, search (name), page, pageSize

**Rota afetada:** `GET /api/v1/:clinic_id/users`
**Service / Repository / Controller:** `UserService`, `UserController`
**Arquivos provavelmente afetados:** `src/services/UserService.ts`, `src/controllers/UserController.ts`
**Descrição:** parsear query params e repassar para repository com defaults (page=1, pageSize=20).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** filters respected and paginated results returned.
**Dependências:** `UserRepository` list method
**Atenção:** sanitizar `search` para evitar SQL injection.

---

### 3.2.4 | Criar rota `GET /api/v1/:clinic_id/users/:id` (próprio ou admin)

**Rota afetada:** `GET /api/v1/:clinic_id/users/:id`
**Service / Repository / Controller:** `UserController`, `UserService`
**Arquivos provavelmente afetados:** `src/controllers/UserController.ts`, `src/services/UserService.ts`
**Descrição:** checar se o usuário é o próprio ou admin antes de retornar dados com professional_details.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** RBAC aplicado, response 200 com user ou 403 se negado.
**Dependências:** `UserService.getUserById` (3.1.3)
**Atenção:** respeitar `clinic_id` e `user_id` do JWT.

---

### 3.2.5 | Criar rota `PUT /api/v1/:clinic_id/users/:id` (próprio: nome/email/telefone, admin: tudo exceto role/password)

**Rota afetada:** `PUT /api/v1/:clinic_id/users/:id`
**Service / Repository / Controller:** `UserController`, `UserService`
**Arquivos provavelmente afetados:** `src/controllers/UserController.ts`, `src/services/UserService.ts`, `src/routes/users.routes.ts`
**Descrição:** diferenciar campos editáveis para patient vs admin e chamar service para atualização.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** atualizações permitidas são aplicadas; campos restritos são ignorados.
**Dependências:** validators (7.2.1)
**Atenção:** não permita alteração de role por pacientes.

---

### 3.2.6 | Criar rota `DELETE /api/v1/:clinic_id/users/:id` (soft delete, apenas system_admin + clinic_admin)

**Rota afetada:** `DELETE /api/v1/:clinic_id/users/:id`
**Service / Repository / Controller:** `UserController`, `UserService`, `rbacMiddleware`
**Arquivos provavelmente afetados:** `src/controllers/UserController.ts`, `src/services/UserService.ts`, `src/routes/users.routes.ts`
**Descrição:** permitir apenas admins para soft delete e verificar dependências (appointments pendentes).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** `deleted_at` preenchido e 409 retornado se existem pendências.
**Dependências:** `AppointmentRepository` (para pendências) e `UserService.softDelete` (3.3.3)
**Atenção:** documentar status 409 e counts pendentes.

---

### 3.3.1 | Implementar verificação de permissão: paciente não acessa dados de outro

**Rota afetada:** `GET /api/v1/:clinic_id/users/:id`
**Service / Repository / Controller:** `UserService`, `UserController`
**Arquivos provavelmente afetados:** `src/services/UserService.ts`, `src/controllers/UserController.ts`
**Descrição:** checar se `req.user.id === target_id` ou admin antes de devolver dados.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** pacientes recebem 403 ao tentar acessar outros.
**Dependências:** middleware (2.3.1), controllers (3.2)
**Atenção:** logs de tentativas devem ser discretos.

---

### 3.3.2 | Implementar verificação: recepcionista não pode deletar usuário

**Rota afetada:** `DELETE /api/v1/:clinic_id/users/:id`
**Service / Repository / Controller:** `UserService`, `rbacMiddleware`
**Arquivos provavelmente afetados:** `src/services/UserService.ts`, `src/middlewares/rbacMiddleware.ts`
**Descrição:** garantir que apenas system_admin/clinic_admin possam executar soft delete.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** recepcionistas recebem 403 ao tentar deletar.
**Dependências:** RBAC middleware 2.3.2
**Atenção:** manter whitelist de roles configurável.

---

### 3.3.3 | Validar integridade referencial em soft delete (consultas pendentes)

**Rota afetada:** `DELETE /api/v1/:clinic_id/users/:id`
**Service / Repository / Controller:** `UserService.softDelete` / `UserRepository` / `UserController`
**Arquivos provavelmente afetados:** `src/services/UserService.ts`, `src/repositories/UserRepository.ts`, `src/controllers/UserController.ts`
**Descrição:** bloquear remoção (soft delete) quando existirem consultas ou transações pendentes, conforme regra de neg ́ocio, antes de marcar `deleted_at`.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`, `src/repositories/AppointmentRepository.ts`
**Definition of Done:** soft delete exige verificação de pendências, responde 409 com `pending` counts quando não é possível deletar e atualiza `deleted_at` nos casos válidos.

---

### 3.4.1 | Teste: GET /users retorna lista com paginação

**Rota afetada:** `GET /api/v1/:clinic_id/users`
**Service / Repository / Controller:** `UserController`, `UserService`
**Arquivos provavelmente afetados:** `src/__tests__/user.routes.test.ts`, `src/services/UserService.ts`
**Descrição:** validar retorno paginado e `success` true.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** response inclui `data`, `page`, `pageSize` e `total`.
**Dependências:** filtros (3.2.3)
**Atenção:** teste precisa configurar `pageSize` e `page` customizados.

---

### 3.4.2 | Teste: GET /users?role=health_professional filtra corretamente

**Rota afetada:** `GET /api/v1/:clinic_id/users`
**Service / Repository / Controller:** `UserController` / `UserService` / `UserRepository`
**Arquivos provavelmente afetados:** `src/__tests__/user.routes.test.ts`, `src/controllers/UserController.ts`, `src/services/UserService.ts`
**Descrição:** cobrir na suíte de testes que o query param `role=health_professional` retorna apenas profissionais de saúde e respeita paginação.
**Ponto de apoio:** `docs/MedClinic MVP Kanban de Tarefas Atômicas.md`, `DOC_API_ROTAS.md`
**Definition of Done:** teste automatizado enviado via supertest e Mocha valida filtros + `success: true` com dados esperados.

---

### 3.4.5 | Teste: DELETE /users/:id sem permissão retorna 403

**Rota afetada:** `DELETE /api/v1/:clinic_id/users/:id`
**Service / Repository / Controller:** `UserController` / `UserService`
**Arquivos provavelmente afetados:** `src/__tests__/user.routes.test.ts`, `src/middlewares/authMiddleware.ts`, `src/controllers/UserController.ts`
**Descrição:** garantir que pacientes e recepcionistas sejam rejeitados ao tentar deletar outro usuário, conforme RBAC.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** teste confirma 403 `FORBIDDEN` e mensagem padronizada.

---

### 3.4.6 | Teste: soft delete mascara deleted_at

**Rota afetada:** `GET /api/v1/:clinic_id/users` e `DELETE /...`
**Service / Repository / Controller:** `UserService` / `UserRepository`
**Arquivos provavelmente afetados:** `src/__tests__/user.routes.test.ts`, `src/repositories/UserRepository.ts`
**Descrição:** checar se `deleted_at` é preenchido e se as listagens ignoram usuários inativos.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** teste confirma `deleted_at` não nulo após delete e que o campo não aparece nas lists.

---

### 4.1.1 | Criar `ProfessionalRepository`

**Rota afetada:** nenhuma (infraestruturas de dados)
**Service / Repository / Controller:** `ProfessionalRepository`
**Arquivos provavelmente afetados:** `src/repositories/ProfessionalRepository.ts`, `src/models/Professional.ts`
**Descrição:** implementar CRUD básico, métodos `findBySpecialty`, `findById`, `create`, `update` e `list` com filtros de nome/especialidade.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`, `src/database/schema.sql`
**Definition of Done:** repositório exporta métodos reutilizados pelos services e respeita transações quando necessário.
**Dependências:** esquema de tabelas pronto (1.2.
**Atenção:** mantenha o mapping de campos igual ao schema para evitar column mismatches.

---

### 4.1.2 | Criar `AvailabilityRepository`

**Rota afetada:** nenhuma (infraestruturas de dados)
**Service / Repository / Controller:** `AvailabilityRepository`
**Arquivos provavelmente afetados:** `src/repositories/AvailabilityRepository.ts`, `src/models/Availability.ts`
**Descrição:** lidar com cadastros/listagens de horários, incluindo consulta por profissional e dia da semana.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** expõe métodos `findByProfessional`, `create`, `validateOverlap` e fonte para `ProfessionalService`.
**Dependências:** tabela `professional_availabilities` deve existir (1.2.3).
**Atenção:** enumere `is_active` e evite usar strings de status soltas.

---

### 4.1.3 | Criar `ProfessionalService`

**Rota afetada:** `GET /api/v1/:clinic_id/professionals` e sub-rotas de availability/commissions
**Service / Repository / Controller:** `ProfessionalService`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/repositories/ProfessionalRepository.ts`, `src/repositories/AvailabilityRepository.ts`
**Descrição:** orquestrar dados de professionals + disponibilidades + comissões, aplicar filtros e mapear responses.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** methods `listProfessionals`, `getAvailability`, `getCommissions` são disponibilizados ao controller com lógica de domínios centralizada.
**Dependências:** Repositórios devem existir (4.1.1/4.1.2).
**Atenção:** mantenha separação clara entre dados públicos (listar) e privados (comissões).

---

### 4.1.4 | Implementar listagem pública de profissionais com filtros

**Rota afetada:** `GET /api/v1/:clinic_id/professionals`
**Service / Repository / Controller:** `ProfessionalService` / `ProfessionalRepository` / `ProfessionalController`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/controllers/ProfessionalController.ts`, `src/routes/professionals.routes.ts`
**Descrição:** aceitar filtros de specialty/name/page/pageSize e retornar dados básicos (id, name, specialty, price).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** endpoint público responde com lista filtrada + paginação padrão.
**Dependências:** repositório implementado (4.1.1) e controller conectado às rotas.
**Atenção:** paginar com default 20 e não expor dados sensíveis como CPF.

---

### 4.2.1 | Criar `ProfessionalController`

**Rota afetada:** rotas públicas de profissionais/availabilities/commissions
**Service / Repository / Controller:** `ProfessionalController`
**Arquivos provavelmente afetados:** `src/controllers/ProfessionalController.ts`, `src/services/ProfessionalService.ts`, `src/routes/professionals.routes.ts`
**Descrição:** agir como camada HTTP, injetar `ProfessionalService`, validar params e centralizar status responses.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** endpoints `GET /professionals`, `GET /professionals/:id/availability`, `POST /professionals/:id/availability`, `GET /professionals/:id/commissions` expõem dados via service.
**Dependências:** services 4.1.3 já injetados.
**Atenção:** trate erros com o error handler e documente cada rota no controller.

---

### 4.2.2 | Criar rota `GET /api/v1/:clinic_id/professionals` pública

**Rota afetada:** `GET /api/v1/:clinic_id/professionals`
**Service / Repository / Controller:** `ProfessionalController` / `ProfessionalService`
**Arquivos provavelmente afetados:** `src/routes/professionals.routes.ts`, `src/controllers/ProfessionalController.ts`
**Descrição:** ligar endpoint público ao controller, habilitar parâmetros de query e usar middleware `express.Router()`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota registrada em `professionals.routes.ts` e responde JSON `data` com `success: true`.
**Dependências:** controller deve existir (4.2.1).
**Atenção:** mantenha o router modular (export default router) para facilitar testes.

---

### 4.2.3 | Implementar filtros `specialty`, `name`, `page`, `pageSize`

**Rota afetada:** `GET /api/v1/:clinic_id/professionals`
**Service / Repository / Controller:** `ProfessionalService` / `ProfessionalController`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/controllers/ProfessionalController.ts`
**Descrição:** pegar query params e reenviá-los para repositório, padronizando valores default (page=1, pageSize=20).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** filtros aplicados e served data respeita `specialty` e `name` (LIKE no repo) e pagination.
**Dependências:** repository query builder com `WHERE` e `LIMIT` novas.
**Atenção:** sanitize inputs para evitar SQL injection (use parametrização do sqlite3).

---

### 4.2.4 | Retornar campos `id, name, specialty, consultation_price`

**Rota afetada:** `GET /api/v1/:clinic_id/professionals`
**Service / Repository / Controller:** `ProfessionalService`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/repositories/ProfessionalRepository.ts`
**Descrição:** mapear resultados para JSON limpo contendo apenas os campos permitidos e o valor da consulta.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** payload inclui `data: [{id, name, specialty, consultation_price}]`.
**Dependências:** repositório deve retornar as colunas pedidas.
**Atenção:** não exponha `cpf`, `password_hash` ou `commission_percentage` aqui.

---

### 4.3.1 | Criar rota `GET /api/v1/:clinic_id/professionals/:id/availability`

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalController`, `ProfessionalService`
**Arquivos provavelmente afetados:** `src/routes/professionals.routes.ts`, `src/controllers/ProfessionalController.ts`, `src/services/ProfessionalService.ts`
**Descrição:** definir rota pública que destrincha o `professional_id` e delega para o serviço retornar horários disponíveis.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota registrada, retorna 200 e passa `professional_id` corretamente e respeita `days_ahead`/`clinic_id`.
**Dependências:** `ProfessionalService` (4.1.3)
**Atenção:** mantenha rota sem autenticação e use `mergeParams` se o router estiver em sub-rotas.

---

### 4.3.2 | `days_ahead` default 7 e máximo 90

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalService` / `AvailabilityRepository` / `ProfessionalController`
**Arquivos provavelmente afetados:** `src/controllers/ProfessionalController.ts`, `src/services/ProfessionalService.ts`, `src/repositories/AvailabilityRepository.ts`
**Descrição:** aceitar query param `days_ahead`, limitar range [1,90] usando defaults baseados em `DOC_API_ROTAS.md`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** se nenhum param enviado, 7 dias retornados; valores >90 são truncados e >0 validados.

---

### 4.3.3 | Retornar slots de 50 minutos no availability endpoint

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalService` / `AvailabilityRepository`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/controllers/ProfessionalController.ts`
**Descrição:** montar slots de 50min baseados em `availabilities` e preencher `is_available` true/false.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** resposta `slots` traz `duration_minutes: 50`, entries por dia, e testes cobrem data/hora.

---

### 4.3.4 | Lógica que desconta agendamentos já feitos

**Rota afetada:** `GET /professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalService` / `AppointmentRepository`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/repositories/AppointmentRepository.ts`
**Descrição:** remover slots já ocupados verificando `appointments` confirmados e agendados no mesmo horário.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`, `src/repositories/AppointmentRepository.ts`
**Definition of Done:** horários duplicados aparecem como `available: false` e casos de conflito cobertos por testes.

---

### 4.4.5 | Calcular 60% do líquido para comissões

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/commissions`
**Service / Repository / Controller:** `ProfessionalService` / `CommissionSplitRepository`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/repositories/CommissionSplitRepository.ts`, `src/controllers/ProfessionalController.ts`
**Descrição:** retornar `amount = amount_net * 0.6` para profissionais, garantindo arredondamento monetário.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** summary & details mostram valores corretos e há teste que compara com transações mockadas.

---

### 4.5.2 | Teste: GET /professionals filtra por `specialty`

**Rota afetada:** `GET /api/v1/:clinic_id/professionals`
**Service / Repository / Controller:** `ProfessionalController` / `ProfessionalService`
**Arquivos provavelmente afetados:** `src/__tests__/professional.routes.test.ts`, `src/services/ProfessionalService.ts`
**Descrição:** cobrir query param `specialty=cardiologia` e validar a lista de retorno.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** o teste garante que somente cardiologistas aparecem na resposta.

---

### 4.5.3 | Teste: availability retorna 7 dias por padrão

**Rota afetada:** `GET /professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalController`
**Arquivos provavelmente afetados:** `src/__tests__/professional.routes.test.ts`, `src/controllers/ProfessionalController.ts`
**Descrição:** confirmar que a resposta traz exatamente 7 dias se `days_ahead` não enviado.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** teste inspeciona array `data`, checa datas incrementais e `slots` vazios quando necessário.

---

### 4.5.4 | Teste: POST /professionals/:id/availability rejeita sobreposição (409)

**Rota afetada:** `POST /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalService` / `AvailabilityRepository`
**Arquivos provavelmente afetados:** `src/__tests__/professional.routes.test.ts`, `src/services/ProfessionalService.ts`
**Descrição:** enviar horário que conflita com uma entrada existente e checar 409 com código `OVERLAPPING_TIMES`.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** teste recusa as solicitações conflitantes e a rota mantém comportamento idempotente.

---

### 4.5.5 | Teste: GET /professionals/:id/commissions sem permissão retorna 403

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/commissions`
**Service / Repository / Controller:** `ProfessionalController` / `ProfessionalService`
**Arquivos provavelmente afetados:** `src/__tests__/professional.routes.test.ts`, `src/middlewares/authMiddleware.ts`
**Descrição:** simular profissional diferente do `id` e validar `FORBIDDEN`.
**Ponto de apoio:** `DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** teste garante 403 e o middleware não vaza dados.

---

### 4.5.6 | Teste: Comissão calcula 60% corretamente

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/commissions`
**Service / Repository / Controller:** `ProfessionalService`
**Arquivos provavelmente afetados:** `src/__tests__/professional.routes.test.ts`
**Descrição:** criar transação, executar endpoint e verificar `amount` na árvore `details` corresponda a `amount_net * 0.6`.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** teste compara esperados com os valores retornados e falha se o cálculo estiver errado.

**Dependências:** precisa dos splits calculados pelo `PaymentMockService` (Sprint 5.4) e das transações já salvas.
**Atenção:** arredondamento de centavos pode causar 1 ou 2 centavos de diferença; deixar claro nos testes e evitar truncamento prematuro.

---

### 5.1.1 | Criar `repositories/AppointmentRepository.ts`

**Rota afetada:** todas as rotas de agendamento e cancelamento
**Service / Repository / Controller:** `AppointmentRepository`
**Arquivos provavelmente afetados:** `src/repositories/AppointmentRepository.ts`, `src/config/database.ts`
**Descrição:** implementar CRUD e queries parametrizadas que respeitem `clinic_id`, utilizado por services para separar RBAC.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** repository expõe métodos reutilizáveis, usa prepared statements, e trata `deleted_at`/`status`.
**Dependências:** `config/database` (Fase 1.3) e `services` da fase 5.
**Atenção:** considerar querys com `status` e `date` para os filtros de `upcoming` e `professional_id`.

---

### 5.1.2 | Criar `services/AppointmentService.ts`

**Rota afetada:** `POST/GET/DELETE /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/repositories/AppointmentRepository.ts`, `src/services/PaymentMockService.ts`
**Descrição:** coordenar regras de negócio, validações, cálculos e integrações de pagamento para criar/listar/cancelar/reagendar agendamentos.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** service encapsula RN-01..RN-07, disponibiliza métodos list/get/create/cancel/reschedule e orquestra o `PaymentMockService`.
**Dependências:** `PaymentMockService`, `AvailabilityRepository`, `UserService` (para RBAC).
**Atenção:** manter os checks em ordem e devolver erros com códigos (e.g., `SLOT_NOT_AVAILABLE`).

---

### 5.1.3 | Implementar `listAppointments(filters, pagination)` com RBAC

**Rota afetada:** `GET /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService`, `AppointmentRepository`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/repositories/AppointmentRepository.ts`, `src/controllers/AppointmentController.ts`
**Descrição:** aplicar filtros (`status`, `professionals`, `patient`, `date`, `upcoming`) e regras de RBAC (paciente só vê os seus, profissional os seus, admin/recepção todos).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** response paginada respeita roles, `upcoming=true` usa timezone do servidor, `pagination` default e `clinic_id` fixo.
**Dependências:** middleware de autenticação, `UserService` e `ProfessionalService`.
**Atenção:** sanitizar query params para evitar injeções e log de tentativas maliciosas.

---

### 4.3.5 | Criar rota `POST /api/v1/:clinic_id/professionals/:id/availability`

**Rota afetada:** envio de disponibilidade dos profissionais
**Service / Repository / Controller:** `ProfessionalController`, `ProfessionalService`
**Arquivos provavelmente afetados:** `src/routes/professionals.routes.ts`, `src/controllers/ProfessionalController.ts`, `src/services/ProfessionalService.ts`, `src/repositories/AvailabilityRepository.ts`
**Descrição:** permitir que médicos e administradores cadastrem horários via POST, chamando validações de sobreposição.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** rota exige autenticação + RBAC, chama service e retorna `201` com registro criado.
**Dependências:** `AvailabilityRepository` (4.1.2)
**Atenção:** aplique middleware para impedir pacientes de criar disponibilidade.

---

### 4.3.6 | Implementar cadastro de horários (day_of_week 0-6, start_time, end_time)

**Rota afetada:** `POST /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalService`, `AvailabilityRepository`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/repositories/AvailabilityRepository.ts`
**Descrição:** garantir que os campos sejam recebidos, convertidos (horas) e persistidos com `is_active` default true.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** novos registros gravam `day_of_week`, times e `is_active` true com timestamps.
**Dependências:** validações (4.3.7/4.3.8)
**Atenção:** normalize `start_time`/`end_time` para `HH:MM`.

---

### 4.3.7 | Validar: start_time < end_time

**Rota afetada:** `POST /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalService`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`
**Descrição:** rejeitar cadastros com `start_time` igual ou posterior ao `end_time` e retornar erro 400 com código `INVALID_TIME_RANGE`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** request inválida não persiste dados e mensagens informam o motivo.
**Dependências:** rotas (4.3.5)
**Atenção:** valide considerando timezone do servidor (não do cliente).

---

### 4.3.8 | Validar: sem sobreposição com horários existentes

**Rota afetada:** `POST /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `ProfessionalService`, `AvailabilityRepository`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/repositories/AvailabilityRepository.ts`
**Descrição:** verificar `day_of_week` e intervalos já cadastrados e retornar 409 `OVERLAPPING_TIMES` quando houver conflito.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** cadastros conflitantes são rejeitados, sem alterar registros existentes.
**Dependências:** logging para auxiliar testes (4.5.4)
**Atenção:** considere `is_active` para definir se horário bloqueia novos slots.

---

### 4.4.1 | Criar rota `GET /api/v1/:clinic_id/professionals/:id/commissions` (médico vê suas, admin qualquer)

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/commissions`
**Service / Repository / Controller:** `ProfessionalController`, `ProfessionalService`
**Arquivos provavelmente afetados:** `src/controllers/ProfessionalController.ts`, `src/services/ProfessionalService.ts`, `src/repositories/CommissionRepository.ts`, `src/repositories/CommissionSplitRepository.ts`
**Descrição:** endpoint protegido que retorna comissões resumidas para o profissional logado e qualquer profissional para admins.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota respeita RBAC, extrai dados de commission splits e devolve `summary` + `details`.
**Dependências:** `authMiddleware`, `rbacMiddleware`
**Atenção:** esconda dados sensíveis de outros profissionais.

---

### 4.4.2 | Implementar query params: month, year, status (pending|paid)

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/commissions`
**Service / Repository / Controller:** `ProfessionalService`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`
**Descrição:** aceitar filtros temporais e de status, aplicando defaults para o mês/ano correntes.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** response inclui apenas registros compatíveis com query params.
**Dependências:** o repositório deve suportar filtros por `created_at` e `status`.
**Atenção:** sanitize `status` para evitar injections.

---

### 4.4.3 | Retornar summary: pending, paid, total

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/commissions`
**Service / Repository / Controller:** `ProfessionalService`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`
**Descrição:** calcular bytes `pending`, `paid` e `total` somando valores nos splits e transactions.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** objeto `summary` com as três somas e `status` breakdown.
**Dependências:** comissões gravadas (5.4)
**Atenção:** use `BigInt`/`Decimal` se necessário para evitar rounding errors.

---

### 4.4.4 | Retornar details: appointment_id, amount, status, created_at, paid_at

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/commissions`
**Service / Repository / Controller:** `ProfessionalService`, `CommissionSplitRepository`
**Arquivos provavelmente afetados:** `src/services/ProfessionalService.ts`, `src/repositories/CommissionSplitRepository.ts`
**Descrição:** listar cada split com metadados (appointment_id, amount, status, datas).
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** `details` array contém campos solicitados e não expõe dados sensíveis.
**Dependências:** tables `commission_splits` e `transactions`
**Atenção:** combine com `AppointmentRepository` para incluir info adicional se necessário.

---

### 4.5.1 | Teste: GET /professionals retorna lista pública

**Rota afetada:** `GET /api/v1/:clinic_id/professionals`
**Service / Repository / Controller:** `ProfessionalController`, `ProfessionalService`
**Arquivos provavelmente afetados:** `src/__tests__/professional.routes.test.ts`, `src/services/ProfessionalService.ts`
**Descrição:** garantir que a rota pública responde com 200 e `success: true`, listando profissionais.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** teste confirma `data` não vazio e `pagination` aplicada.
**Dependências:** base de dados seeded com profissionais
**Atenção:** isolar dependências de autenticação nesse teste público.

### 5.1.4 | Habilitar listagem RBAC para agendamentos

**Rota afetada:** `GET /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService` / `AppointmentRepository` / `AppointmentController`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/controllers/AppointmentController.ts`, `src/repositories/AppointmentRepository.ts`
**Descrição:** garantir que pacientes vejam só seus agendamentos, médicos só seus, recepcionistas/admins todos, e que filtros (status, professional_id, patient_id, date, upcoming) atuem corretamente.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** endpoint retorna lista paginada respeitando RBAC e filtros.

**Dependências:** exige autenticação (Fase 2) e usuários existentes (Fase 3).
**Atenção:** validar `upcoming=true` comparando `date` com agora do servidor para evitar gaps de timezone.

---

### 5.2.1 | Criar `controllers/AppointmentController.ts`

**Rota afetada:** `/api/v1/:clinic_id/appointments` (GET, POST, DELETE, POST reschedule)
**Service / Repository / Controller:** `AppointmentController`, `AppointmentService`
**Arquivos provavelmente afetados:** `src/controllers/AppointmentController.ts`, `src/services/AppointmentService.ts`, `src/routes/appointments.routes.ts`
**Descrição:** expor endpoints list, create, cancel, detail e reschedule, aplicar middlewares (auth, RBAC) e formatar respostas com `success`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** cada endpoint chama o service correto, captura exceções e retorna payloads padronizados.
**Dependências:** services (5.1.2) e middlewares (2.3).
**Atenção:** preserve `clinic_id` e responda com `success:false` e `error` quando necessário.

---

### 5.2.2 | Criar rota `GET /api/v1/:clinic_id/appointments`

**Rota afetada:** `GET /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentController`, `AppointmentService`, `AppointmentRepository`
**Arquivos provavelmente afetados:** `src/routes/appointments.routes.ts`, `src/controllers/AppointmentController.ts`
**Descrição:** cadastrar rota com middleware de autenticação, RBAC e query params (`status`, `professional_id`, `patient_id`, `date`, `upcoming`, `page`, `pageSize`).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota registrada, middleware aplicado e response paginada com `data`, `pagination`.
**Dependências:** service 5.2.1 e repository 5.1.1.
**Atenção:** limite `pageSize` a 100 e valide `upcoming` boolean.

---

### 5.2.3 | Implementar filtros: status, professional_id, patient_id, date, upcoming

**Rota afetada:** `GET /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService`, `AppointmentRepository`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/repositories/AppointmentRepository.ts`
**Descrição:** extrair e validar todos os filtros, convertendo `upcoming` em comparação com `now`, aplicando `status` binário e garantindo `clinic_id` fixo.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** apenas registros que satisfazem filtros chegam ao cliente e `appointmentRepository.list` recebe os params corretos.
**Dependências:** `Date` utils, `moment` se usado (ou Date nativo).
**Atenção:** sanitize os valores (ex: `status` enumerado) antes de montar query string.

---

### 5.2.4 | Implementar paginação: page, pageSize

**Rota afetada:** `GET /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService`, `AppointmentRepository`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/repositories/AppointmentRepository.ts`
**Descrição:** definir defaults (`page=1`, `pageSize=20`), limitar a 100 e retornar `pagination` com `total`, `page`, `pageSize`, `totalPages`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** response inclui `data` e `pagination`, e repository usa `LIMIT`/`OFFSET`.
**Dependências:** `AppointmentRepository.listWithPagination`
**Atenção:** evite `pageSize` zero ou negativo.

---

### 5.2.5 | Criar rota `GET /api/v1/:clinic_id/appointments/:id`

**Rota afetada:** `GET /api/v1/:clinic_id/appointments/:id`
**Service / Repository / Controller:** `AppointmentController`, `AppointmentService`
**Arquivos provavelmente afetados:** `src/routes/appointments.routes.ts`, `src/controllers/AppointmentController.ts`
**Descrição:** registrar rota com RBAC (paciente/profissional/admin) e devolver evento detalhado.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota devolve `appointment`, 403 quando acesso indevido e 404 se não existe.
**Dependências:** `AppointmentService.getAppointmentById`.
**Atenção:** normalize `clinic_id` e trate `status` consistentemente.

---

### 5.3.1 | Implementar RN-01: horário deve estar em `professional_availabilities`

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService`, `AvailabilityRepository`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/repositories/AvailabilityRepository.ts`
**Descrição:** verificar se o slot solicitado corresponde a um availability ativo do profissional antes de gerar o agendamento.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** requisições com slot inválido retornam 409 `SLOT_NOT_AVAILABLE`, e slot válido segue para criação.
**Dependências:** `AvailabilityRepository` e normalização de `day_of_week`.
**Atenção:** considerar `start_time`/`end_time` e `day_of_week` baseados no timezone do servidor.

---

### 5.4.1 | Criar `services/PaymentMockService.ts`

**Rota afetada:** fluxo de criação de agendamento
**Service / Repository / Controller:** `PaymentMockService`
**Arquivos provavelmente afetados:** `src/services/PaymentMockService.ts`, `src/services/AppointmentService.ts`
**Descrição:** simular pagamento com 80% de sucesso e 20% de falha, retornando invoice e valores para splits.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** serviço expõe `processPayment`, faz logging de falhas e retorna `amount_gross`, `mdr`, `amount_net`.
**Dependências:** regras RN-01..RN-04 para validar slot antes de processar.
**Atenção:** mantenha a aleatoriedade testável via injeção de um seed ou stub.

---

### 5.4.2 | Implementar `processPayment(appointment)` com splits 60/35/5

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService`, `PaymentMockService`
**Arquivos provavelmente afetados:** `src/services/PaymentMockService.ts`, `src/repositories/TransactionRepository.ts`, `src/repositories/CommissionSplitRepository.ts`
**Descrição:** calcular `mdr` (3.79%), salvar `transaction_logs` e `commission_splits` com 3 partes, retornando invoice completo.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** transação persiste com status `paid` ou `failed`, splits criados e invoice devolvido.
**Dependências:** `transactions` e `commission_splits` definidos (Fase 1).
**Atenção:** use arredondamento consistente (ex: milésimos) para evitar distorções.

---

### 5.4.3 | Calcular `amount_gross`, `mdr` e `amount_net`

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `PaymentMockService`, `TransactionRepository`
**Arquivos provavelmente afetados:** `src/services/PaymentMockService.ts`, `src/repositories/TransactionRepository.ts`
**Descrição:** derivar `amount_net = amount_gross - mdr`, onde `mdr = 3.79%` e `amount_gross` equivale ao preço da consulta.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** campos populados no log e no invoice, com `status` refletindo sucesso/falha.
**Dependências:** `Appointment` possui `price` válido.
**Atenção:** registrar `mdr` em centavos, não truncar antes da soma final.

---

### 5.4.4 | Criar split 60% / 35% / 5% em `commission_splits`

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `CommissionSplitRepository`, `PaymentMockService`
**Arquivos provavelmente afetados:** `src/repositories/CommissionSplitRepository.ts`, `src/services/PaymentMockService.ts`
**Descrição:** gerar três registros indicando `professional`, `clinic`, `system`, com valores arredondados.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** `commission_splits` contém splits esperados, usados depois em `GET /professionals/:id/commissions`.
**Dependências:** transação `amount_net` calculado.
**Atenção:** verifique `status` (pending/paid) e `created_at`.

---

### 5.4.5 | Salvar `transactions` e `commission_splits`

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `TransactionRepository`, `CommissionSplitRepository`
**Arquivos provavelmente afetados:** `src/repositories/TransactionRepository.ts`, `src/repositories/CommissionSplitRepository.ts`
**Descrição:** persistir registro mestre com payload do pagamento e dividir os splits.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** transação criada com `status` correto, splits ligados ao `transaction_id`.
**Dependências:** `PaymentMockService` e `Appointment` criados com `payment_status` adequado.
**Atenção:** use transação (BEGIN/COMMIT) para garantir atomicidade.

---

### 5.4.6 | Retornar invoice mock no response do agendamento

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService`, `PaymentMockService`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/controllers/AppointmentController.ts`
**Descrição:** incluir `invoice.amount`, `invoice.mdr`, `invoice.net`, `invoice.split` na resposta de criação.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** cliente recebe `invoice` e pode exibir os valores de cada stakeholder.
**Dependências:** `PaymentMockService` calculou os valores.
**Atenção:** documentar que o invoice é mockado e não representa pagamento real.

---

### 5.5.1 | Criar agendamento com validações de regras de negócio

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `AppointmentService` / `PaymentMockService` / `AppointmentController`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/services/PaymentMockService.ts`, `src/controllers/AppointmentController.ts`, `src/repositories/AppointmentRepository.ts`
**Descrição:** aplicar RN-01 a RN-07 antes de criar o `appointment`, processar o pagamento mockado, atualizar `payment_status` e retornar invoice.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`, `src/services/PaymentMockService.ts`
**Definition of Done:** consulta criada com status `scheduled`, pagamento tratado e resposta inclui invoice + `payment_status`.

**Dependências:** precisa de disponibilidades cadastradas (Fase 4) e usuários/roles validados (Fase 3).
**Atenção:** a falha do PaymentMock deve deixar o status `failed` e não bloquear o slot (liberar horário em confirmação de falha).

---

### 5.6.1 | Cancelamento com cálculo de reembolso

**Rota afetada:** `DELETE /api/v1/:clinic_id/appointments/:id`
**Service / Repository / Controller:** `AppointmentService` / `RefundRepository` / `AppointmentController`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/repositories/RefundRepository.ts`, `src/controllers/AppointmentController.ts`
**Descrição:** aplicar RN-21 a RN-25, atualizar status (`cancelled_by_patient` ou `_clinic`), calcular percentuais (100% ou 70%), criar refund record.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** endpoint marca status correto, gera refund e informa valor + prazos.

**Dependências:** exige transação existente e pagamento com status `paid` ou `processing`.
**Atenção:** atenção aos no-shows e não permitir cancelamentos após `completed` - devolução custosa se mal aplicada.

---

### 5.7.1 | Reagendamento sem taxa (mantendo pagamento)

**Rota afetada:** `POST /api/v1/:clinic_id/appointments/:id/reschedule`
**Service / Repository / Controller:** `AppointmentService` / `AppointmentController`
**Arquivos provavelmente afetados:** `src/services/AppointmentService.ts`, `src/controllers/AppointmentController.ts`, `src/repositories/AppointmentRepository.ts`
**Descrição:** validar novo slot (RN-01, RN-02, RN-03, RN-04), manter `payment_status` original e atualizar `date/time`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** reagendamento concluído sem alterar `payment_status`, com resposta 200 e `updated_at` atualizado.

**Dependências:** depende do fluxo de criação (5.5.1) e do inventário de slots (4.3.\*).
**Atenção:** garantir o `payment_status=f` reembolsado? o mesmo do original, e não recalcular splits.

---

### 6.1.1 | Criar tabela `exams`

**Rota afetada:** infra do módulo de exames
**Service / Repository / Controller:** schema migrations
**Arquivos provavelmente afetados:** `src/database/schema.sql`, `database/medclinic.db`, `src/repositories/ExamRepository.ts`
**Descrição:** definir tabela `exams` com `patient_id`, `professional_id`, `exam_name`, `status`, `appointment_id`, `clinical_indication`, `created_at`, `updated_at`, restrições de FK e índices por patient/professional.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** migrations executadas sem erro, tabela pronta para CRUD e indices para consultas frequentes.
**Dependências:** table `users` (fase 1)
**Atenção:** status deve suportar `pending_payment`, `paid`, `completed`.

---

### 6.1.2 | Criar `repositories/ExamRepository.ts`

**Rota afetada:** `GET/POST /api/v1/:clinic_id/exams`
**Service / Repository / Controller:** `ExamRepository`
**Arquivos provavelmente afetados:** `src/repositories/ExamRepository.ts`, `src/config/database.ts`
**Descrição:** implementar métodos `create`, `findById`, `listByPatient`, `listByProfessional`, `updateStatus`, com prepared statements e mapeamento para status e relações.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** repository expõe métodos reutilizados pelos services e aplica `clinic_id` nos selects.
**Dependências:** tabela `exams` criada (6.1.1)
**Atenção:** considere `status` default `pending_payment`.

---

### 6.1.3 | Criar `services/ExamService.ts`

**Rota afetada:** `GET/POST /api/v1/:clinic_id/exams`
**Service / Repository / Controller:** `ExamService`
**Arquivos provavelmente afetados:** `src/services/ExamService.ts`, `src/repositories/ExamRepository.ts`, `src/controllers/ExamController.ts`
**Descrição:** orquestrar lógica de criação (validar appointment e professional), listar exames com filtros (patient/join) e devolver pena to status.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** service expõe `list`, `getById`, `create` e garante RBAC (patient,médico,labs), encapsulando status transitions.
**Dependências:** `ExamRepository`, `AppointmentRepository`
**Atenção:** sanitize `clinic_id` e log acessos de lab_tech para auditoria.

---

### 6.1.4 | Criar rota GET /exams (RBAC simplificado)

**Rota afetada:** `GET /api/v1/:clinic_id/exams`
**Service / Repository / Controller:** `ExamService` / `ExamRepository` / `ExamController`
**Arquivos provavelmente afetados:** `src/services/ExamService.ts`, `src/repositories/ExamRepository.ts`, `src/controllers/ExamController.ts`
**Descrição:** listar exames do paciente, do médico solicitante ou todos (lab_tech, admin). Incluir filtros por status.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** seção retorna exames visíveis ao papel correto com paginação.

**Dependências:** baseia-se em roles definidas (Fase 2) e nos `exam_requests` cadastrados (Fase 6.1).
**Atenção:** pacientes não devem ver exames de outros, verifique `requesting_professional_id`.

---

### 6.1.5 | Criar rota GET /exams/:id (detalhes)

**Rota afetada:** `GET /api/v1/:clinic_id/exams/:id`
**Service / Repository / Controller:** `ExamController`, `ExamService`
**Arquivos provavelmente afetados:** `src/routes/exams.routes.ts`, `src/controllers/ExamController.ts`
**Descrição:** retornar exame específico com detalhes e garantir RBAC (proprietário, médico solicitante, lab admin, admin).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** rota responde 200 com `exam`, 403 ou 404 conforme RBAC e existencia do exame.
**Dependências:** `ExamService.getById` e `authMiddleware`
**Atenção:** evitar revelar dados sensíveis de pacientes de outros médicos.

---

### 6.1.6 | Criar rota POST /exams (médico solicita)

**Rota afetada:** `POST /api/v1/:clinic_id/exams`
**Service / Repository / Controller:** `ExamService` / `ExamController`
**Arquivos provavelmente afetados:** `src/services/ExamService.ts`, `src/controllers/ExamController.ts`, `src/repositories/ExamRepository.ts`
**Descrição:** aceitar `exam_name`, `clinical_indication`, vincular à consulta e salvar com status `pending_payment`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedclinicDB_Implementacao.md`
**Definition of Done:** exame criado com justificativa, resposta 201 e `created_at` salvo.

**Dependências:** requer que `appointment_id` exista e o profissional esteja autenticado.
**Atenção:** RN-09 exige justificativa; reprove se faltar `clinical_indication`.

---

### 6.2.5 | Prescrição criada por médico (simplificada)

**Rota afetada:** `POST /api/v1/:clinic_id/prescriptions`
**Service / Repository / Controller:** `PrescriptionService` / `PrescriptionController`
**Arquivos provavelmente afetados:** `src/services/PrescriptionService.ts`, `src/controllers/PrescriptionController.ts`, `src/repositories/PrescriptionRepository.ts`
**Descrição:** aceitar `medication_name`, vincular a `appointment_id` e `patient_id`, tolerando campos opcionais.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** prescrição salva, retornar 201 e link para download (mesmo que fictício).

**Dependências:** precisa do `appointment` concluído (status `scheduled` ou `completed`).
**Atenção:** ambulância de prescrições controladas deve acionar `is_controlled: true` e possivelmente exigir assinatura digital futura.

---

### 7.1.1 | Implementar error handler global

**Rota afetada:** todas as rotas protegidas e públicas
**Service / Repository / Controller:** `middlewares/errorHandler.ts`
**Arquivos provavelmente afetados:** `src/middlewares/errorHandler.ts`, `src/app.ts`, `src/controllers/*`
**Descrição:** centralizar erros, mapear `ValidationError`, `UnauthorizedError`, `ConflictError` e retornar payload padronizado.
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md`
**Definition of Done:** erros comuns retornam JSON `{ success:false, error:{ code, message } }` e console loga stack.

**Dependências:** todos os serviços devem lançar as exceções customizadas descritas nos guias.
**Atenção:** nunca vazar stack completo em produção; use `NODE_ENV` para decidir.

---

### 7.2.1 | Criar validators reutilizáveis

**Rota afetada:** controllers que validam entrada (auth, users, appointments)
**Service / Repository / Controller:** `utils/validators.ts`, `controllers/*`
**Arquivos provavelmente afetados:** `src/utils/validators.ts`, `src/controllers/AuthController.ts`, `src/controllers/UserController.ts`
**Descrição:** funções `isValidEmail`, `isValidCPF`, `isValidPassword`, `isValidPhone`, reusadas em todas as rotas.
**Ponto de apoio:** `docs/REGRAS_DE_NEGOCIO_MINI_DESAFIO.txt`
**Definition of Done:** validators exportados e importados nas controllers, cobrindo formatos exigidos.

**Dependências:** `AuthService` e `UserService` devem chamá-los antes de persistir dados.
**Atenção:** validar `CPF` apenas no formato (sem dígitos verif.) para o MVP.

### 8.1.1 | Criar `frontend_src/index.html`

**Rota afetada:** páginas do frontend (assets estáticos)
**Service / Repository / Controller:** frontend entrypoint
**Arquivos provavelmente afetados:** `frontend_src/index.html`, `frontend_src/main.ts`, `frontend_src/styles/global.css`
**Descrição:** criar boilerplate com `<div id="app">`, links para CSS/JS, meta tags e loading progressivo.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`, `docs/DOC_API_ROTAS.md`
**Definition of Done:** HTML minimalista carregado, referenciando o bundle e exibindo placeholder de carregamento.

---

### 8.1.2 | Criar `frontend_src/main.ts`

**Rota afetada:** todas as páginas do frontend
**Service / Repository / Controller:** frontend bootstrap
**Arquivos provavelmente afetados:** `frontend_src/main.ts`, `frontend_src/services/api.ts`, `frontend_src/styles/global.css`
**Descrição:** montar inicialização do app, importar estilos e renderizar components básicos; configurar `fetch` padrão com cookies.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** `main.ts` instancia routers/pages e exporta helpers reutilizáveis.

---

### 8.1.3 | Criar `frontend_src/styles/global.css`

**Rota afetada:** toda aplicação frontend
**Service / Repository / Controller:** CSS global
**Arquivos provavelmente afetados:** `frontend_src/styles/global.css`, `frontend_src/styles/forms.css`, `frontend_src/components/*.ts`
**Descrição:** incluir reset + variáveis de cor, tipografia base e grid de containers.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** arquivo aplicado ao `index.html`, estilos globais carregam sem erros.

---

### 8.1.4 | Configurar bundler (webpack/vite)

**Rota afetada:** pipeline de build frontend
**Service / Repository / Controller:** scripts npm (`package.json`) e config de bundler
**Arquivos provavelmente afetados:** `package.json`, `scripts/build-frontend`, `frontend_src/tsconfig.json`
**Descrição:** adicionar configuração para compilar TypeScript => JS (por exemplo Vite) garantindo suporte a `jsx` simples.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** comando `npm run build:frontend` gera `/dist` funcional e `main.ts` é transpilado.

---

### 8.2.1 | Criar `frontend_src/types/api.ts`

**Rota afetada:** todos os handlers de API
**Service / Repository / Controller:** frontend typed contracts
**Arquivos provavelmente afetados:** `frontend_src/types/api.ts`, `frontend_src/services/api.ts`
**Descrição:** definir interfaces como `User`, `Appointment`, `Professional`, `ApiResponse<T>` seguindo modelos do backend.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `src/models` (referência)
**Definition of Done:** tipos exportados, utilizados no service e compila sem erros.

---

### 8.2.2 | Criar `frontend_src/services/api.ts`

**Rota afetada:** todas as requisições HTTP (`fetch` helpers)
**Service / Repository / Controller:** frontend API helper
**Arquivos provavelmente afetados:** `frontend_src/services/api.ts`, `frontend_src/types/api.ts`, `frontend_src/pages/*.ts`
**Descrição:** implementar função `apiRequest(method, url, body?)` que envia cookies, parseia JSON e trata erros padronizados.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** helper centralizado usado por pages e que reusa headers `Content-Type` `application/json`.

---

### 8.2.3 | Implementar métodos GET/POST/PUT/DELETE no frontend

**Rota afetada:** todos os endpoints utilizados no MVP
**Service / Repository / Controller:** `frontend_src/services/api.ts`
**Arquivos provavelmente afetados:** `frontend_src/services/api.ts`, `frontend_src/pages/*` (endoors)
**Descrição:** expor funções helpers como `apiGet`, `apiPost` etc. que chamam `apiRequest` com verbos corretos.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** cada método está disponível para consumo e coberto com tests (se aplicável).

---

### 8.2.4 | Tratar erros e retornar respostas tipadas

**Rota afetada:** toda interface com APIs
**Service / Repository / Controller:** `frontend_src/services/api.ts`
**Arquivos provavelmente afetados:** `frontend_src/services/api.ts`, `frontend_src/components/Toast.ts`
**Descrição:** parsear payloads `{ success: false, error: { code, message } }`, lançar exceções customizadas para renderização de toasts.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** erros são capturados, retornam objetos tipados e `Toast` recebe código/mensagem.

---

### 8.3.1 | Criar componente `Modal`

**Rota afetada:** confirmações de cancelamento/reagendamento
**Service / Repository / Controller:** UI components frontend
**Arquivos provavelmente afetados:** `frontend_src/components/Modal.ts`, `frontend_src/pages/*.ts`
**Descrição:** modal controlado com `open/close`, slot para `title`, `body` e `actions`.
**Ponto de apoio:** guidelines internas e `MedClinic MVP - Especificação Consolidada`
**Definition of Done:** componente exportado, reutilizado em pelo menos uma página.

---

### 8.3.2 | Criar componente `Toast`

**Rota afetada:** feedback global (formulários)
**Service / Repository / Controller:** UI notification
**Arquivos provavelmente afetados:** `frontend_src/components/Toast.ts`, `frontend_src/styles/components.css`
**Descrição:** exibir mensagens de sucesso/erro com ícone, timeline e autoclose.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** toast pode ser disparado pelo `api` service após requisições e exibe mensagens padronizadas.

---

### 8.3.3 | Criar componente `Form`

**Rota afetada:** todos os formulários de registro/login/agendamento
**Service / Repository / Controller:** formulário reutilizável
**Arquivos provavelmente afetados:** `frontend_src/components/Form.ts`, `frontend_src/pages/*.ts`
**Descrição:** encapsular validações client-side simples, states `isSubmitting`, `errors` e `onSubmit`.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** componente usado em ao menos uma página, emitindo campos e validando.

---

### 8.3.4 | Criar `frontend_src/styles/components.css`

**Rota afetada:** toda interface
**Service / Repository / Controller:** CSS de components
**Arquivos provavelmente afetados:** `frontend_src/styles/components.css`, `frontend_src/components/*.ts`
**Descrição:** definir estilos para modais, toasts e formulários com classes reutilizáveis.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** arquivo importado, estiliza os components mencionados e respeita design tokens.

---

### 8.4.1 | Criar `frontend_src/pages/Login.ts`

**Rota afetada:** `POST /api/v1/:clinic_id/auth/login`
**Service / Repository / Controller:** page + api service
**Arquivos provavelmente afetados:** `frontend_src/pages/Login.ts`, `frontend_src/services/api.ts`, `frontend_src/components/Form.ts`, `frontend_src/styles/global.css`
**Descrição:** montar formulário com campos `email` e `password`, chamado ao clicar em Entrar.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** credenciais enviadas, cookie JWT armazenado automaticamente e redirect para dashboard.

---

### 8.4.2 | Implementar validação client-side no login

**Rota afetada:** `POST /api/v1/:clinic_id/auth/login`
**Service / Repository / Controller:** `Form` + `validators`
**Arquivos provavelmente afetados:** `frontend_src/pages/Login.ts`, `frontend_src/components/Form.ts`
**Descrição:** checar email válido e senha não vazias antes de chamar API.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`, `docs/DOC_API_ROTAS.md`
**Definition of Done:** formulário previne submit inválido e mostra mensagens.

---

### 8.4.3 | Feedback visual no login

**Rota afetada:** `POST /api/v1/:clinic_id/auth/login`
**Service / Repository / Controller:** `Toast`, `Form`
**Arquivos provavelmente afetados:** `frontend_src/pages/Login.ts`, `frontend_src/components/Toast.ts`, `frontend_src/styles/components.css`
**Descrição:** exibir estados de carregando e erro (com `Toast`) ao fazer login.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** spinner aparece durante a requisição e `Toast` mostra mensagem em falhas.

---

### 8.4.4 | Criar `frontend_src/pages/RegisterPatient.ts`

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** page + api helper
**Arquivos provavelmente afetados:** `frontend_src/pages/RegisterPatient.ts`, `frontend_src/components/Form.ts`, `frontend_src/services/api.ts`
**Descrição:** formulário com campos nome/email/senha/cpf/telefone, chamado pelo `apiPost`.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** registra paciente, exibe mensagem de sucesso e redireciona para login.

---

### 8.4.5 | Validação client-side no cadastro

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `Form` + validators
**Arquivos provavelmente afetados:** `frontend_src/pages/RegisterPatient.ts`, `frontend_src/components/Form.ts`
**Descrição:** validar CPF (formato), senha (força), email e telefone antes de enviar.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`, `docs/DOC_API_ROTAS.md`
**Definition of Done:** campos inválidos exibem mensagens e o formulário bloqueia envio.

---

### 8.4.6 | Redirecionar para login após sucesso

**Rota afetada:** `POST /api/v1/:clinic_id/auth/register`
**Service / Repository / Controller:** `RegisterPatient` page
**Arquivos provavelmente afetados:** `frontend_src/pages/RegisterPatient.ts`
**Descrição:** após resposta positiva, limpar form, exibir toast de sucesso e navegar para login.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** redirect acontece e a página exibe mensagem sem reload manual.

---

### 8.5.1 | Criar `frontend_src/pages/DashboardPatient.ts`

**Rota afetada:** diversas (`appointments`, `profiles`, etc.)
**Service / Repository / Controller:** patient dashboard page
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardPatient.ts`, `frontend_src/services/api.ts`, `frontend_src/components/Modal.ts`, `frontend_src/components/Toast.ts`
**Descrição:** estrutura básica com sidebar, placeholders para agendamentos e ações.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** layout responsivo renderiza seções vazias e chama API para preencher dados.

---

### 8.5.2 | Seção “Meus Agendamentos” na dashboard paciente

**Rota afetada:** `GET /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `DashboardPatient` + `apiGet`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardPatient.ts`, `frontend_src/services/api.ts`
**Descrição:** listagem de agendamentos do paciente com filtragem por status e botões de cancelamento.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** tabela/populares exibem consultas e respondem a filtros.

---

### 8.5.3 | Seção “Agendar Consulta” com seleção de profissional/data/hora

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `DashboardPatient` + `apiPost`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardPatient.ts`, `frontend_src/services/api.ts`, `frontend_src/components/Form.ts`
**Descrição:** formulário com selects (profissional, data, hora), mostra preço, chama API.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`, `DOC_API_ROTAS.md`
**Definition of Done:** agendamento enviado com sucesso, resposta exibida e invoice mockado mostra divisão.

---

### 8.5.4 | Modal de confirmação com preço + detalhes

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `Modal`, `DashboardPatient`
**Arquivos provavelmente afetados:** `frontend_src/components/Modal.ts`, `frontend_src/pages/DashboardPatient.ts`
**Descrição:** antes de confirmar, abrir modal que lista paciente, profissional, data, valor e split.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** modal aparece, confirma e fecha após API success.

---

### 8.5.5 | Cancelar agendamento com confirmação

**Rota afetada:** `DELETE /api/v1/:clinic_id/appointments/:id`
**Service / Repository / Controller:** `DashboardPatient`, `Modal`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardPatient.ts`, `frontend_src/components/Modal.ts`, `frontend_src/services/api.ts`
**Descrição:** botão “Cancelar” abre modal, chama DELETE e atualiza lista mostrada.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** cancelamento dispara toast e remove item do componente.

---

### 8.5.6 | Reagendar agendamento (mudar data/hora)

**Rota afetada:** `POST /api/v1/:clinic_id/appointments/:id/reschedule`
**Service / Repository / Controller:** `DashboardPatient`, `Modal`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardPatient.ts`, `frontend_src/services/api.ts`
**Descrição:** botão “Reagendar” abre form, envia nova data/hora e atualiza timeline.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** reschedule mostra mensagem de sucesso e a lista reflete novo horário.

---

### 8.5.7 | Exibir comissão/invoice após criação

**Rota afetada:** `POST /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `DashboardPatient` + `PaymentMock response`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardPatient.ts`, `frontend_src/components/Toast.ts`
**Descrição:** mostrar valores de split (60/35/5) com base no invoice retornado pelo backend.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** invoice aparece e explica destinadores, sem precisar recarregar.

---

### 8.6.1 | Criar `frontend_src/pages/DashboardDoctor.ts`

**Rota afetada:** múltiplas (`appointments`, `professionals`, `availability`)
**Service / Repository / Controller:** dashboard médico
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardDoctor.ts`, `frontend_src/services/api.ts`, `frontend_src/components/Modal.ts`
**Descrição:** layout com seções principais vazias para preenchimento posterior.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** estrutura renderiza e se integra com styles globais.

---

### 8.6.2 | Seção “Meus Agendamentos” do médico

**Rota afetada:** `GET /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `DashboardDoctor`, API helper HTTP
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardDoctor.ts`, `frontend_src/services/api.ts`
**Descrição:** listar agendamentos atribuídos ao médico, com filtros e highlights (status, patient).
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** cards exibem info, filtros acionam nova chamada.

---

### 8.6.3 | Seção “Meus Horários Disponíveis” com edição

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `DashboardDoctor`, `apiGet`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardDoctor.ts`, `frontend_src/services/api.ts`
**Descrição:** mostrar blocos semanais e permitir navegar para cadastrar novos horários.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** exibe dias/slots, botão leva ao modal de cadastro.

---

### 8.6.4 | Modal “Cadastrar Horário” (day_of_week / time)

**Rota afetada:** `POST /api/v1/:clinic_id/professionals/:id/availability`
**Service / Repository / Controller:** `Modal`, `DashboardDoctor`
**Arquivos provavelmente afetados:** `frontend_src/components/Modal.ts`, `frontend_src/pages/DashboardDoctor.ts`, `frontend_src/services/api.ts`
**Descrição:** formulário com day_of_week, start_time, end_time, `is_active`.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** submete disponibilidade sem recarregar, cobra default `is_active = true`.

---

### 8.6.5 | Seção “Minhas Comissões” (sumário mensal)

**Rota afetada:** `GET /api/v1/:clinic_id/professionals/:id/commissions`
**Service / Repository / Controller:** `DashboardDoctor`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardDoctor.ts`, `frontend_src/services/api.ts`
**Descrição:** mostrar resumo `pending/paid/total` e detalhes (appointment_id, amount).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** a seção consome o endpoint com filtros (month/year) e exibe os valores.

---

### 8.6.6 | Seção “Solicitar Exame” (modal com `exam_name`)

**Rota afetada:** `POST /api/v1/:clinic_id/exams`
**Service / Repository / Controller:** `DashboardDoctor`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardDoctor.ts`, `frontend_src/components/Modal.ts`, `frontend_src/services/api.ts`
**Descrição:** modal com textarea para `exam_name`, `clinical_indication` e botões de envio.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** submissão cria exame no backend e notifica com toast.

---

### 8.6.7 | Seção “Escrever Prescrição” (modal com `medication_name`)

**Rota afetada:** `POST /api/v1/:clinic_id/prescriptions`
**Service / Repository / Controller:** `DashboardDoctor`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardDoctor.ts`, `frontend_src/components/Modal.ts`, `frontend_src/services/api.ts`
**Descrição:** modal com campo `medication_name` (texto livre) e envio do formulário.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** prescrição criada e `Toast` confirma sucesso.

---

### 8.7.1 | Criar `frontend_src/pages/DashboardAdmin.ts`

**Rota afetada:** admin workflows (users, professionals, appointments)
**Service / Repository / Controller:** dashboard admin
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardAdmin.ts`, `frontend_src/services/api.ts`
**Descrição:** layout com abas para usuários, profissionais, agendamentos, exames.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** layout renderiza com placeholders nas seções listadas.

---

### 8.7.2 | Seção “Usuários” (listar + filtros + editar/deletar)

**Rota afetada:** `GET /api/v1/:clinic_id/users`, `PUT`, `DELETE`
**Service / Repository / Controller:** `DashboardAdmin`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardAdmin.ts`, `frontend_src/services/api.ts`
**Descrição:** tabela com filtros por `role`, botões para editar (abrir modal) e deletar com confirmação.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** filtros funcionam e botones chamam endpoints certos.

---

### 8.7.3 | Seção “Profissionais” (listar + comissões)

**Rota afetada:** `GET /api/v1/:clinic_id/professionals`, `GET /commissions`
**Service / Repository / Controller:** `DashboardAdmin`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardAdmin.ts`, `frontend_src/services/api.ts`
**Descrição:** exibir lista com especialidades, disponibilidade e link para comissões.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** cards/profissionais mostram dados corretos e call-to-action abre resumo.

---

### 8.7.4 | Seção “Agendamentos” (listar todos)

**Rota afetada:** `GET /api/v1/:clinic_id/appointments`
**Service / Repository / Controller:** `DashboardAdmin`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardAdmin.ts`, `frontend_src/services/api.ts`
**Descrição:** tabela com filtros (status, profissional, paciente) e detalhes rápidos.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** listagem reflete roles e statuses e exibe invoice/resumo.

---

### 8.7.5 | Seção “Exames” (listar todos)

**Rota afetada:** `GET /api/v1/:clinic_id/exams`
**Service / Repository / Controller:** `DashboardAdmin`
**Arquivos provavelmente afetados:** `frontend_src/pages/DashboardAdmin.ts`, `frontend_src/services/api.ts`
**Descrição:** seção gerencia exames, mostra status e permite abrir detalhe.
**Ponto de apoio:** `DOC_API_ROTAS.md`
**Definition of Done:** atalho para visualizar/filtrar exames completados vs pendentes.

---

### 8.7.6 | Modal “Criar Usuário” (nome, email, role, CPF)

**Rota afetada:** `POST /api/v1/:clinic_id/users`
**Service / Repository / Controller:** `DashboardAdmin`
**Arquivos provavelmente afetados:** `frontend_src/components/Modal.ts`, `frontend_src/pages/DashboardAdmin.ts`, `frontend_src/services/api.ts`
**Descrição:** modal com campos obrigatórios e seleção de role, chama API para criar user.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** submissão cria usuário e seções aparecem offline.

---

### 8.8.1 | Criar `frontend_src/styles/forms.css`

**Rota afetada:** todos os formulários frontend
**Service / Repository / Controller:** CSS de forms
**Arquivos provavelmente afetados:** `frontend_src/styles/forms.css`, `frontend_src/pages/*`, `frontend_src/components/Form.ts`
**Descrição:** definir estilos para inputs, labels, botões e mensagens de erro.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** classes aplicadas e forms seguem o visual desejado.

---

### 8.8.2 | Feedback visual (borda vermelha + mensagem)

**Rota afetada:** formulários (autenticação/agendamentos)
**Service / Repository / Controller:** `Form`, `styles/forms.css`
**Arquivos provavelmente afetados:** `frontend_src/styles/forms.css`, `frontend_src/components/Form.ts`
**Descrição:** inputs inválidos recebem border red e message text.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`
**Definition of Done:** ao invalidar, o campo muda de cor e mensagem aparece.

---

### 8.8.3 | Loading states (botões disabled, spinner)

**Rota afetada:** ações que disparam requests (login/cadastro/agendamento)
**Service / Repository / Controller:** `Form`, `components/Toast`
**Arquivos provavelmente afetados:** `frontend_src/components/Form.ts`, `frontend_src/components/Toast.ts`, `frontend_src/styles/components.css`
**Descrição:** deixar botões `disabled` e mostrar spinner durante a requisição.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** UI bloqueia nova ação até o request terminar.

---

### 8.8.4 | Responsive design (mobile-first)

**Rota afetada:** toda interface frontend
**Service / Repository / Controller:** CSS global + components
**Arquivos provavelmente afetados:** `frontend_src/styles/global.css`, `frontend_src/styles/components.css`
**Descrição:** adicionar media queries para telas menores (cards empilhados, menu colapsado).
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** páginas reorganizam conteúdos sem quebrar e atenção para `max-width` e `flex-wrap`.

---

### 9.1.1 | Instalar Mocha, Chai e Sinon

**Rota afetada:** comandos de teste (npm)
**Service / Repository / Controller:** toolchain (scripts `package.json`)
**Arquivos provavelmente afetados:** `package.json`, `.mocharc.json`, `tsconfig.json`
**Descrição:** adicionar dependências e garantir `npm test` as executa.
**Ponto de apoio:** `docs/test-coverage-steps.md`
**Definition of Done:** pacotes instalados, Mocha + Chai + Sinon aparecem em `package.json` e `npm test` roda com `ts-node/register`.

---

### 9.7.1 | Rodar `npm test` com cobertura (nyc)

**Rota afetada:** pipeline de testes
**Service / Repository / Controller:** `package.json` scripts, `nyc`
**Arquivos provavelmente afetados:** `package.json`, `.mocharc.json`, `nyc.config.js` (se existir)
**Descrição:** executar testes com `nyc` para gerar coverage.
**Ponto de apoio:** `docs/test-coverage-steps.md`
**Definition of Done:** coverage report criado e exibido no terminal.

---

### 9.7.2 | Garantir >80% coverage no backend

**Rota afetada:** qualidade de testes
**Service / Repository / Controller:** todos os serviços/repositórios com testes
**Arquivos provavelmente afetados:** `src/__tests__/*`, `package.json`
**Descrição:** identificar gaps (repositórios, ExamService, controllers) e adicionar testes para chegar em 80%+.
**Ponto de apoio:** `docs/test-coverage-steps.md`
**Definition of Done:** relatório mostra ≥80% statements/lines e branches importantes cobertas.

---

### 9.7.3 | Gerar relatório HTML de coverage

**Rota afetada:** QA/processo de revisão
**Service / Repository / Controller:** `nyc` integration
**Arquivos provavelmente afetados:** scripts de teste, `coverage/` folder
**Descrição:** configurar `nyc` para exportar HTML em `coverage/index.html`.
**Ponto de apoio:** docs/test-coverage-steps.md
**Definition of Done:** abrir `coverage/index.html` após `npm test` e visualizar HTML.

---

### 9.7.4 | Documentar testes no README

**Rota afetada:** documentação do repositório
**Service / Repository / Controller:** README e seção de testes
**Arquivos provavelmente afetados:** `README.md`
**Descrição:** adicionar instruções para rodar testes/cobertura (comandos e dependências).
**Ponto de apoio:** `docs/test-coverage-steps.md`
**Definition of Done:** README descreve `npm test`, `npm run coverage` e interpretando relatórios.

---

### 10.1.1 | Criar `Procfile` para deploy (Railway/Heroku)

**Rota afetada:** deploy backend
**Service / Repository / Controller:** config de infraestrutura
**Arquivos provavelmente afetados:** `Procfile`, `package.json`
**Descrição:** apontar `web: npm run start:prod` ou comando equivalente.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** Railway/Heroku identifica o `Procfile` e inicia dyno com sucesso.

---

### 10.1.2 | Configurar variáveis de ambiente (.env.example)

**Rota afetada:** backend (configura JWT, DB, payment etc.)
**Service / Repository / Controller:** `src/config/database.ts`, `src/app.ts`
**Arquivos provavelmente afetados:** `.env.example`, `src/config/database.ts`, `src/app.ts`
**Descrição:** listar todas as variáveis usadas (PORT, JWT, BD, CloudWalk, splits) e documentar defaults.
**Ponto de apoio:** `docs/MedclinicDB_Implementacao.md`, `.env.example` existente no repo
**Definition of Done:** `.env.example` atualizado com comentários e `README` cross ref.

---

### 10.1.3 | `npm run build` (backend)

**Rota afetada:** pipeline CI/CD
**Service / Repository / Controller:** `tsc`/build scripts
**Arquivos provavelmente afetados:** `package.json`, `tsconfig.json`, `dist/`
**Descrição:** garantir script `build` transpila TS para JS em `dist` e roda sem erros.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** `npm run build` cria `dist/` e `node dist/server.js` inicia localmente.

---

### 10.1.4 | Deploy backend em Railway/Render (staging)

**Rota afetada:** ambiente de staging
**Service / Repository / Controller:** infra (config e scripts)
**Arquivos provavelmente afetados:** `README.md`, `Procfile`, `.env.example`
**Descrição:** subir código, configurar env vars e garantir a API responde no staging.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** endpoints acessíveis em staging, logs sem erros.

---

### 10.1.5 | Validar CORS em produção

**Rota afetada:** headers CORS (backend)
**Service / Repository / Controller:** `src/app.ts`, middlewares
**Arquivos provavelmente afetados:** `src/app.ts`, `src/middlewares/errorHandler.ts`
**Descrição:** permitir origens de frontend em staging/prod (ex: `http://localhost:3001` e domínios finais).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** cabeçalhos `Access-Control-Allow-Origin` corretos no staging.

---

### 10.1.6 | Testar endpoints em staging

**Rota afetada:** todos os endpoints relevantes
**Service / Repository / Controller:** QA manual + scripts (pode usar Insomnia collection)
**Arquivos provavelmente afetados:** `scripts/api-collection.json`, `README.md`
**Descrição:** executar fluxos principais (auth, appointments, professionals) no staging e registrar observações.
**Ponto de apoio:** `docs/MedClinic MVP Kanban de Tarefas Atômicas.md` (coleção Insomnia)
**Definition of Done:** checklist manual concluído e slack/README anotado.

---

### 10.2.1 | Build frontend (`npm run build:frontend`)

**Rota afetada:** pipeline frontend
**Service / Repository / Controller:** bundler (Vite/webpack)
**Arquivos provavelmente afetados:** `frontend_src/`, `package.json`, `scripts/`
**Descrição:** compilar frontend para produção, garantindo assets minificados.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** comando gera pasta `dist` e `index.html` pronto para servir.

---

### 10.2.2 | Deploy frontend no GitHub Pages

**Rota afetada:** hospedagem frontend
**Service / Repository / Controller:** GH Pages workflow
**Arquivos provavelmente afetados:** `package.json`, `frontend_src/`, `.github/workflows`
**Descrição:** configurar export e subir `dist` para GH Pages com base URL correto.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`
**Definition of Done:** aplicação acessível em `https://<user>.github.io/soluong3` (exemplo).

---

### 10.2.3 | Configurar CORS para staging frontend consumir API

**Rota afetada:** `Access-Control-Allow-Origin`
**Service / Repository / Controller:** backend CORS config
**Arquivos provavelmente afetados:** `src/app.ts`, `src/middlewares/errorHandler.ts`
**Descrição:** liberar front-end hospedado no GitHub Pages no backend em staging.
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`, `.env.example`
**Definition of Done:** requests do frontend deployado passam sem erros CORS.

---

### 10.2.4 | Testar fluxos completos (auth/agendamento/exames)

**Rota afetada:** auth + appointments + exams + prescriptions
**Service / Repository / Controller:** stack completa (frontend + backend)
**Arquivos provavelmente afetados:** `README.md`, `scripts/api-collection.json`
**Descrição:** validar login, registro, agendamento e requests de exames/prescrições no ambiente final.
**Ponto de apoio:** `docs/MedClinic MVP Kanban de Tarefas Atômicas.md`, Insomnia collection.
**Definition of Done:** cada fluxo testado sem falhas e resultados documentados.

---

### 10.3.1 | Criar README com setup local, comandos e variáveis

**Rota afetada:** onboarding de devs
**Service / Repository / Controller:** documentação
**Arquivos provavelmente afetados:** `README.md`
**Descrição:** detalhar instalação, scripts (`dev`, `build`, `test`, `seed`) e env vars exigidas.
**Ponto de apoio:** `docs/MedClinic MVP - Especificação Consolidada.md`, `.env.example`
**Definition of Done:** README atualizado e referenciado em PRs.

---

### 10.3.2 | Documentar rotas da API (OpenAPI/Swagger opcional)

**Rota afetada:** todas as rotas do backend
**Service / Repository / Controller:** documentação / openapi
**Arquivos provavelmente afetados:** `docs/`, `README.md`, `scripts/api-collection.json`
**Descrição:** resumir endpoints, métodos e payloads em novo arquivo (ou atualização do `api-collection` existente).
**Ponto de apoio:** `docs/DOC_API_ROTAS.md`
**Definition of Done:** documentação clara, linkada no README e revisada.

---

### 10.3.3 | Documentar estrutura de código e padrões

**Rota afetada:** contributors
**Service / Repository / Controller:** docs/codestyle
**Arquivos provavelmente afetados:** `README.md`, `docs/MedClinic MVP - Code Style Guide.md`
**Descrição:** adicionar seção explicando pastas `src/`, `frontend_src/`, convenções de nomes e patterns (service/repository/controller).
**Ponto de apoio:** `docs/MedClinic MVP - Code Style Guide.md`
**Definition of Done:** novo trecho no README descreve a arquitetura e referencia os guias existentes.

---

### 10.3.4 | Criar guia de troubleshooting

**Rota afetada:** suporte de devs/testers
**Service / Repository / Controller:** docs
**Arquivos provavelmente afetados:** `README.md`, `docs/`
**Descrição:** listar problemas comuns (DB locked, tokens expirados, CORS) e como solucioná-los.
**Ponto de apoio:** `docs/DOCS_REGRAS_NEGOCIO.md`, issues anteriores
**Definition of Done:** guia anexo ao README com passos de solução e links para logs.
