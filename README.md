# MedClinic - Frontend

Sistema de Gerenciamento de Clínicas Médicas - Interface Web

## 🚀 Tecnologias

- **TypeScript** - Linguagem principal
- **Vite** - Build tool e dev server
- **Vanilla JS/TS** - Sem frameworks pesados
- **LocalStorage** - Persistência de dados (desenvolvimento)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🏗️ Estrutura do Projeto

```
frontend_src/
├── components/      # Componentes reutilizáveis (Modal, Toast, Form)
├── pages/          # Páginas da aplicação
├── services/       # Serviços (Auth, DB LocalStorage, Schedule)
├── styles/         # Arquivos CSS
├── types/          # Definições TypeScript
├── utils/          # Utilitários e validadores
├── index.html      # HTML principal
└── main.ts         # Entry point da aplicação
```

## 💾 Dados de Desenvolvimento

A aplicação usa **LocalStorage** para simular um banco de dados durante o desenvolvimento. Os dados são inicializados automaticamente na primeira execução.

### Usuários de Teste

- **Admin:** admin@medclinic.dev / Admin@123
- **Médico:** joao@medclinic.com / Medico@123
- **Recepcionista:** recepcao@medclinic.com / Recep@123

## 🔌 Integração com API (Futuro)

Este projeto está preparado para integração futura com uma API backend. A camada de serviços (`services/`) pode ser facilmente adaptada para fazer chamadas HTTP em vez de usar LocalStorage.

## 📝 Licença

ISC
