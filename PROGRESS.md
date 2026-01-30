# PROGRESS SUMMARY

## Arquitetura de Segurança

- `authStore.refreshSession()` chama `/auth/profile`, define `isCheckingAuth` e mantém o `#auth-blocker` visível enquanto aguarda a resposta. Quando a sessão é positiva, o evento `auth-ready` é disparado e o overlay é escondido. Em erros 401 a sessão é limpa e o usuário é redirecionado para o login.
- `authStore` expõe `isCheckingAuth` para que qualquer componente (ex: `src/index.ts`) posssa reagir ao estado do bloqueio.
- `src/index.ts` também expõe `authReadyPromise` e usa `roleRoutes` para validar que `window.location.pathname` corresponde ao `session.role` antes de permitir que `js/pages/app.js` renderize.

## Estado da Refatoração CSS

- _CSS Puro_: `css/global.css` já controla a barra de rolagem personalizada e o overlay do `auth-blocker`. Em breve migramos o overlay para usar as variáveis planejadas.
- _Tailwind ainda presente_: `pages/login.html`, `pages/patient-dashboard.html` e o restante da UI base dependem das classes utilitárias do CDN. Precisamos transformar os estilos para `.dashboard-card`, `.nav-item`, `.status-badge` etc., conforme descrito em `REFATORACAO_CSS.md`.
- Variáveis planejadas (a declarar em `css/variables.css`): `--color-primary`, `--color-bg-dark`, `--color-surface-dark`, `--color-border-dark`, `--color-text-secondary`, `--color-bg-light`, `--color-text`, `--color-overlay`, `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--border-width-thin`, `--font-family-base`.
- Dicionário completo das variáveis foi adicionado em `REFATORACAO_CSS.md` (incluindo `--color-primary-hover`, `--color-border-dark-hover`, `--spacing-xxs`, `--spacing-md-plus`, `--radius-*`).

## Contrato de Roteamento

- `roleRoutes` mapeia cada `UserRole` para seu dashboard correspondente. O entrypoint (`src/index.ts`) usa esse objeto para redirecionamentos imediatos quando a rota atual não combina com o papel do usuário.
- O `auth-ready` somente é emitido após esse redirecionamento, garantindo que `js/pages/app.js` só vea o evento depois de estar no caminho correto.

## Padrão de Nomenclatura CSS

- Adotado BEM (Block Element Modifier) como padrão oficial para as novas classes.

## Impedimentos (seletores críticos)

- `.filter-checkbox` permanece obrigatório enquanto o JS de filtros (`js/pages/app.js`) usar este seletor.
- `.user-name`, `.user-role`, `.user-initials`, `.logout-btn`, `.back-btn` são usados em `js/components/navigation.js` como fallback e precisam existir ou serem substituídos por `data-*` equivalentes.

## Status de Conversão (Tailwind)

- Todos os HTMLs listados em `REFATORACAO_CSS.md` ainda carregam o CDN do Tailwind (`index.html`, `pages/login.html`, `pages/patient-dashboard.html`, etc.). Nenhum HTML foi migrado para CSS puro ainda.

## Próxima Task Imediata

- Executar a Fase 1 da migração CSS: criar `css/variables.css`, importar em `css/global.css`, declarar as variáveis listadas acima e refatorar o overlay/scrollbar para usá-las, mantendo o Tailwind ativo até a fase 2.
