# REFATORAÇÃO CSS - Tailwind para CSS Puro

Este documento serve como contrato de design para migrar o estilo atual baseado em Tailwind para CSS puro, seguindo a abordagem GSD (RALPH Abstractions com foco em continuidade funcional).

## 1. Mapeamento de Tokens

### Cores (HEX/RGB repetidas)

- `#197fe6`, `#166cc4`, `#3b82f6`: ação/primária (botões, links). (variável `--color-primary`).
- `#111921`, `#111418`, `#1a1f26`: fundos escuros principais. (variável `--color-bg-dark`).
- `#1c242e`, `#1a1f26`: superfícies escuras (`--color-surface-dark`).
- `#2a3441`, `#2a3441`: bordas (`--color-border-dark`).
- `#9dabb8`, `#9dabb8`: texto secundário (`--color-text-secondary`).
- `#f6f7f8`, `#ffffff`: fundos claros/ texts default (`--color-bg-light`, `--color-text`).
- `rgba(0,0,0,0.7)`: overlay (`--color-overlay`).
- `#3c4753`: hover do scrollbar (`--color-border-dark-hover`).

### Espaçamentos repetidos

- `0.5rem`, `1rem`, `1.5rem`, `2rem`: gap padrão (mapear para `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`).
- `4px`, `6px`, `12px`: bordas e arrobas de padding. Use `--border-width-thin`.
- `0.25rem`, `0.75rem`, `2.5rem`: arredondamentos e paddings auxiliares (`--spacing-xxs`, `--spacing-md-plus`).

### Fontes

- `Manrope`, `sans-serif` usado globalmente; declare `--font-family-base` com fallback `sans-serif`.
- Pesos: 400, 500, 600, 700, 800. Predefina classes `.font-regular`, `.font-medium`, `.font-bold`, `.font-black` para manter consistência.

> Essas variáveis serão declaradas em `css/variables.css` (novo arquivo) e importadas em `css/global.css` antes do resto.

### Dicionário de Variáveis (:root)

```css
:root {
  --color-primary: #197fe6;
  --color-primary-hover: #166cc4;
  --color-primary-accent: #3b82f6;
  --color-bg-dark: #111921;
  --color-bg-dark-alt: #111418;
  --color-surface-dark: #1c242e;
  --color-surface-dark-alt: #1a1f26;
  --color-border-dark: #2a3441;
  --color-border-dark-hover: #3c4753;
  --color-text-secondary: #9dabb8;
  --color-bg-light: #f6f7f8;
  --color-text: #ffffff;
  --color-overlay: rgba(0, 0, 0, 0.7);

  --spacing-xxs: 0.25rem;
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-md-plus: 2.5rem;
  --border-width-thin: 1px;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --font-family-base: "Manrope", sans-serif;
}
```

## 2. Identificação de Componentes (Classes semânticas)

### Componentes reutilizáveis sugeridos

- `.dashboard-card`: reúne o container de cards nos dashboards (bordas, background, borda arredondada, shadow).
- `.nav-item` / `.nav-link`: layout de navegação principal/links (ex: header, sidebar). Mantém cores e transições.
- `.status-badge`: badges de status (green/pending). Incluir variantes `.status-badge--info`, `.status-badge--success`.
- `.auth-blocker`: overlay já implementado em CSS, para o futuro padronizar loadings ou modais.
- `.filters-panel`, `.filters-panel__section`: controle do sidebar de filtros.
- `.doctor-card` e `.doctor-card__slots`: contêineres de médico com grid/responsividade.
- `.toast-message`: reuso dos toasts do `uiStore`.
- `.form-field`: inputs com label e tratamento de foco.

Cada classe deve encapsular o conjunto de utilitários (background, border, padding, sombra) hoje expressos como strings inline. Crie macros no CSS e use no HTML/TS importando o CSS global.

## 2.1 Padrão de Nomenclatura

- Adotar **BEM (Block Element Modifier)** para todas as novas classes CSS.
- Exemplo: `.dashboard-card`, `.dashboard-card__title`, `.dashboard-card--highlight`.
- Essa convenção deve substituir strings longas de utilitários por blocos reutilizáveis.

## 3. Preservação Funcional (Hard Part)

### Seletores vinculados à lógica

- `#filters-container`, `#doctors-grid`, `#search-input`, `.filter-checkbox`, `input[name="location"]`: usados pelo JS em `js/pages/app.js` e devem continuar existindo exatamente com esses selectores.
- `.toast-container` e os toasts gerados com `.rounded-lg ...`: mantenha o id `toast-container`; o conteúdo pode trocar a classe para `.toast-message` mas preserve o container.
- `#auth-blocker`: overlay criada em `src/index.ts`; não remova este id nem as classes `.auth-blocker`, `.auth-blocker--hidden` nem `.auth-blocker__spinner` (usado diretamente no DOM).`
- `#login-form`, `#email`, `#password`, `#role`: campos referenciados no `src/pages/login.ts`. Qualquer transformação deve manter esses ids.
- `#doctors-grid` e `#filters-container` novamente são referenciados por scripts e não podem sumir.

### Impedimentos (Tailwind usado como seletor no JS)

- `.filter-checkbox` é usado no `js/pages/app.js` para filtros; não pode ser removido antes de atualizar a lógica.
- `.user-name`, `.user-role`, `.user-initials`, `.logout-btn`, `.back-btn` são usados em `js/components/navigation.js` como seletores de fallback; devem continuar existindo ou precisam ser substituídos por data-attributes equivalentes.

## 4. Plano de Ataque Incremental

1. **Variáveis e base global**
   - Crie `css/variables.css` com `:root` definindo todas as cores, espaçamentos e families listados acima.
   - Importe esse arquivo no topo de `css/global.css` e atualize o CSS para usar `var(--color-*)` etc.

2. **Componentes globais semânticos**
   - Crie blocos como `.card`, `.nav`, `.badge`, `.form-field`, `.toast-message` no CSS.
   - Atualize os arquivos HTML/TS para trocar strings de classes utilitárias por essas classes semânticas (ex: `class="dashboard-card"`).

3. **Estilos de páginas específicas**
   - Converta demais páginas (login, patient dashboard, etc.) usando as classes semânticas e adicionando regras específicas por página em CSS modular (ex: `css/pages/patient-dashboard.css`).
   - Garanta Padrões: header, main content, cards e footer encapsulados.

4. **Limpeza e validação**
   - Run `npm run build`/`dev` para garantir que CSS novo não quebre.
   - Remova classes com utilitários não utilizados após conversão completa.

## 5. Clean-up final (Tailwind Removal)

1. Excluir `tailwind.config.js` e `postcss`/`tailwindcss` e `autoprefixer` do `package.json` (dependências e scripts).
2. Atualizar o `webpack.config.js` para remover referências a `postcss-loader/tailwind` e garantir que `css/global.css` seja carregado via `MiniCssExtractPlugin` com `css-loader`.
3. Apagar importes de CDN do Tailwind (em `index.html`, `pages/login.html`, `pages/patient-dashboard.html` etc.) e substituir por `link rel="stylesheet" href="css/global.css"` padrão.
4. Verificar se o build continua passando e documentar o fim da dependência nos `docs/tasks.md`.

Cada fase deve ser entregue de forma que a aplicação continue funcionando (usar feature flags se necessário), respeitando o mantra GSD.

## Status de Conversão (Atual)

### Ainda com Tailwind (CDN + utilitários)

- `index.html`
- `pages/login.html`
- `pages/patient-dashboard.html`
- `pages/admin-dashboard.html`
- `pages/agenda.html`
- `pages/checkout.html`
- `pages/doctor-dashboard.html`
- `pages/dashboard.html`
- `pages/lab-dashboard.html`
- `pages/financial.html`
- `pages/manager-dashboard.html`
- `pages/my-appointments.html`
- `pages/exams.html`
- `pages/password-recovery.html`
- `pages/pep.html`
- `pages/prescription.html`
- `pages/reception-dashboard.html`
- `pages/register.html`
- `pages/slots.html`
- `pages/users.html`
- `pages/telemedicine.html`
- `pages/onboarding.html`
- `pages/doctors.html`

### Já em CSS Puro

- `css/global.css` (scrollbars + auth-blocker overlay)
- `js/pages/app.js` (lógica de filtros sem dependência de Tailwind, mas ainda exige `.filter-checkbox` no DOM)
