# Projeto: Migração para CSS Semântico 🚀

Este documento rastreia a conversão do projeto de classes utilitárias (Tailwind) para uma arquitetura de CSS Semântico, focada em componentes e manutenibilidade.

## 🛠 Metodologia de Conversão

Para cada arquivo, seguimos este processo:

1. **Análise de Estrutura**: Mapeamento de grupos de classes utilitárias em componentes lógicos.
2. **Sincronização de Design Tokens**: Garantir que todas as cores e espaçamentos usem as variáveis definidas em `global.css`.
3. **Extração de CSS**: Criação de um arquivo `.css` dedicado para a página/módulo.
4. **Refatoração do HTML**: Substituição das classes Tailwind por classes semânticas.
5. **Verificação de Responsividade**: Garantir que o comportamento mobile/desktop permaneça intacto.

## 📋 Status da Migração

| Arquivo HTML                | CSS Gerado                 | Status       | Notas                      |
| :-------------------------- | :------------------------- | :----------- | :------------------------- |
| `patient-dashboard.html`    | `patient-dashboard.css`    | ✅ Concluído | 100% Semântico (Auditado). |
| `admin-dashboard.html`      | `admin-dashboard.css`      | ✅ Concluído | 100% Semântico (Auditado). |
| `doctor-dashboard.html`     | `doctor-dashboard.css`     | ✅ Concluído | 100% Semântico (Auditado). |
| `reception-dashboard.html`  | `reception-dashboard.css`  | ✅ Concluído | 100% Semântico.            |
| `login.html`                | -                          | ⏳ Próximo   |                            |
| `register.html`             | -                          | 📅 Planejado |                            |
| `password-recovery.html`    | `auth.css`                 | ✅ Concluído | 100% Semântico.            |
| `my-appointments.html`      | `my-appointments.css`      | ✅ Concluído | 100% Semântico.            |
| `schedule-appointment.html` | `schedule-appointment.css` | ✅ Concluído | 100% Semântico.            |
| `exams.html`                | `exams.css`                | ✅ Concluído | 100% Semântico.            |
| `lab-dashboard.html`        | `lab-dashboard.css`        | ✅ Concluído | 100% Semântico.            |
| `manager-dashboard.html`    | `manager-dashboard.css`    | ✅ Concluído | 100% Semântico.            |
| `agenda.html`               | `agenda.css`               | ✅ Concluído | 100% Semântico.            |
| `pep.html`                  | `pep.css`                  | ✅ Concluído | 100% Semântico.            |
| `prescription.html`         | `prescription.css`         | ✅ Concluído | 100% Semântico.            |
| `doctors.html`              | `doctors.css`              | ✅ Concluído | 100% Semântico.            |
| `users.html`                | `users.css`                | ✅ Concluído | 100% Semântico.            |
| `financial.html`            | `financial.css`            | ✅ Concluído | 100% Semântico.            |
| `slots.html`                | `slots.css`                | ✅ Concluído | 100% Semântico.            |
| `checkout.html`             | `checkout.css`             | ✅ Concluído | 100% Semântico.            |
| `onboarding.html`           | `onboarding.css`           | ✅ Concluído | 100% Semântico.            |
| `login.html`                | `auth.css`                 | ✅ Concluído | 100% Semântico.            |
| `register.html`             | `auth.css`                 | ✅ Concluído | 100% Semântico.            |

## 🎨 Design Tokens (global.css)

As seguintes variáveis devem ser usadas preferencialmente:

- `--primary`: Cor principal do sistema.
- `--background-dark`: Fundo principal.
- `--surface-dark`: Fundo de cards/seções.
- `--border-dark`: Bordas e divisores.
- `--text-secondary`: Texto auxiliar.

---

## 🚀 Próximas Etapas (Fase de Consolidação)

Para alcançarmos o objetivo de deletar o `tailwind-built.css`, precisamos completar estas fases:

### 1. Refatoração de Arquivos TypeScript

Mapear todas as strings de HTML dentro dos arquivos `.ts` (ex: modais, tabelas dinâmicas, toasts) e substituir as classes Tailwind por nossas classes semânticas ou utilitários do `admin-common.css`.

### 2. Auditoria e Limpeza Geral

- **Revisão de Classes**: Revisar as páginas já migradas para garantir que não houve perda de estilo ou responsividade.
- **Caça ao Tailwind**: Busca global por qualquer resquício de classes `px-`, `mt-`, `flex-`, `bg-`, etc., que tenham passado despercebidos.

### 3. Otimização da Arquitetura CSS

- **Auditoria de Utilitários**: Revisar classes de utilitário (ex: `.u-text-red`, `.u-mb-10`) para verificar se estão sendo usadas. Se não estiverem, apagar; se estiverem, garantir que usem variáveis do `global.css` em vez de hexadecimais fixos.
- **Consolidação Global**: Analisar cada arquivo `.css` criado, identificar padrões repetidos e movê-los para o `global.css` ou `admin-common.css`.
- **Arquitetura de Pastas**: Repensar a organização dos arquivos CSS (ex: separar por `components/`, `layouts/`, `pages/`) para escalabilidade.
- **CSS Reset**: Integrar um reset robusto no `global.css` para substituir o "Preflight" do Tailwind.

---

_Atualizado em: 31/01/2026_
