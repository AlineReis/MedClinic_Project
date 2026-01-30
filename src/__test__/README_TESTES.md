# 📋 Guia dos Testes Unitários - UserService

## 🎯 O que são Testes Unitários?

Testes unitários são pequenos testes que verificam se uma função específica funciona corretamente de forma isolada. Eles testam **apenas uma coisa por vez** e usam **mocks** (simulações) das dependências.

## 🚀 Como Executar os Testes

```bash
# Executar todos os testes
npm test

# Executar apenas os testes do UserService
npm test user.service.test

# Executar com informações detalhadas
npm test -- --verbose

# Executar com coverage (mostra % de código testado)
npm test -- --coverage
```

## 🧪 Estrutura dos Testes

### 📁 Organização
```
describe("UserService")           // Grupo principal de testes
  └── describe("registerPatient") // Grupo de testes para um método específico
      ├── it("deve registrar...")  // Teste individual (cenário de sucesso)
      ├── it("deve rejeitar...")   // Teste individual (cenário de erro)
      └── ...
```

### 🎭 Padrão AAA (Arrange-Act-Assert)

Cada teste segue o padrão **AAA**:

```typescript
it("deve fazer algo específico", async () => {
  // 🔧 ARRANGE (Preparar)
  // Configura os mocks e dados de teste
  mockUserRepository.findByEmail.mockResolvedValue(null);

  // ⚡ ACT (Agir)
  // Executa a função que queremos testar
  const result = await userService.registerPatient(userData);

  // ✅ ASSERT (Verificar)
  // Verifica se o resultado é o esperado
  expect(result.user.email).toBe("teste@email.com");
});
```

## 🎭 O que são Mocks?

**Mocks** são "imitações" de dependências externas. Em vez de usar o banco de dados real, criamos uma versão falsa que retorna o que queremos para o teste.

### Exemplo de Mock:
```typescript
// ❌ SEM mock - usaria banco de dados real (lento e dependente)
const user = await realDatabase.findByEmail("test@email.com");

// ✅ COM mock - simula resposta instantânea
mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
```

## 📊 Cenários Testados

### ✅ Caminhos de Sucesso
- Usuário registrado com sucesso
- Login com credenciais corretas
- Admin acessando dados de outros usuários
- Atualizações permitidas

### ❌ Caminhos de Erro
- Validações de email, CPF, senha
- Usuários não encontrados
- Permissões negadas
- Dados duplicados

### 🔀 Todos os If/Else Cobertos

Para **cada condição** no código, temos testes:

```typescript
// No código:
if (requesterRole === "patient" && requesterId !== targetUserId) {
  throw new ForbiddenError("Você não tem permissão...");
}

// Nos testes:
it("deve permitir paciente acessar próprio perfil", ...)     // ✅ Condição falsa
it("deve rejeitar paciente acessar outro usuário", ...)      // ❌ Condição verdadeira
```

## 🛠️ Tipos de Mocks Usados

### 1. **Mock de Funções**
```typescript
mockUserRepository.findByEmail = jest.fn();
mockBcrypt.hash = jest.fn();
```

### 2. **Mock de Módulos Inteiros**
```typescript
jest.mock("bcrypt");                    // Mock todo o módulo bcrypt
jest.mock("../utils/validators.js");    // Mock validators
```

### 3. **Mock com Retornos Específicos**
```typescript
mockBcrypt.hash.mockResolvedValue("hashedPassword");     // Promise que resolve
mockValidators.isValidEmail.mockReturnValue(true);       // Retorno síncrono
```

## 📋 Checklist para Escrever Bons Testes

### ✅ Cada teste deve:
- [ ] Testar **uma coisa específica**
- [ ] Ter nome **descritivo** ("deve fazer X quando Y")
- [ ] Ser **independente** (não depender de outros testes)
- [ ] Usar **mocks** para dependências
- [ ] Verificar **resultados E comportamentos**

### ✅ Cobrir todos os cenários:
- [ ] **Happy Path** (sucesso)
- [ ] **Validações** (dados inválidos)
- [ ] **Autorizações** (permissões)
- [ ] **Não encontrado** (recursos inexistentes)
- [ ] **Conflitos** (dados duplicados)

## 🚨 Boas Práticas

### ✅ Faça:
```typescript
// ✅ Nome descritivo
it("deve rejeitar email inválido", ...)

// ✅ Mock limpo
mockUserRepository.findByEmail.mockResolvedValue(null);

// ✅ Verificação específica
expect(result.user).not.toHaveProperty("password");
```

### ❌ Evite:
```typescript
// ❌ Nome vago
it("deve funcionar", ...)

// ❌ Teste dependente de outros
const user = previousTestResult;

// ❌ Verificação vaga
expect(result).toBeTruthy();
```

## 🔍 Exemplos Práticos

### Testando Validações:
```typescript
it("deve rejeitar CPF inválido", async () => {
  // Configura validator para retornar false
  mockValidators.isValidCpfLogic.mockReturnValue(false);

  // Executa e verifica se lança erro correto
  await expect(userService.registerPatient(userData))
    .rejects
    .toThrow(new ValidationError("Invalid CPF"));
});
```

### Testando Permissões:
```typescript
it("deve permitir system_admin acessar qualquer clínica", async () => {
  const systemAdminInput = {
    requester: { role: "system_admin" },
    clinicId: 999 // Clínica diferente
  };

  const result = await userService.listUsers(systemAdminInput);
  expect(result).toBeDefined(); // Não lançou erro
});
```

## 🎓 Para Iniciantes

### 1. **Comece simples:**
- Leia um teste existente linha por linha
- Entenda o que cada `expect` está verificando
- Execute os testes e veja o que acontece

### 2. **Practice:**
- Modifique um teste existente
- Adicione um novo cenário simples
- Quebre propositalmente e veja o erro

### 3. **Evolua:**
- Escreva testes para novos métodos
- Cubra cenários edge cases
- Use coverage para ver o que está faltando

## 📚 Comandos Úteis

```bash
# Ver apenas testes que falharam
npm test -- --onlyFailures

# Executar testes em modo watch (re-executa quando código muda)
npm test -- --watch

# Ver coverage detalhado
npm test -- --coverage --coverageReporters=html
```

## 🏆 Benefícios dos Testes

- ✅ **Confiança:** Código funciona como esperado
- ✅ **Refactoring:** Mudanças sem medo de quebrar
- ✅ **Documentação:** Testes mostram como usar o código
- ✅ **Debugging:** Identifica problemas rapidamente
- ✅ **Qualidade:** Força código mais limpo e modular

---

**💡 Dica:** Comece executando os testes existentes e explore cada cenário. A prática é a melhor forma de aprender!