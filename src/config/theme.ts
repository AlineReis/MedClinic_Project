import './global-styles';

type Theme = 'light' | 'dark';

const sunIcon: string = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>`;
const moonIcon: string = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>`;

const STORAGE_KEY = 'medclinic-theme';

// --- 1. EXECUÇÃO IMEDIATA ---
// Isso roda assim que o JS é baixado, aplicando o tema antes da página aparecer
const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
const themeToApply: Theme = savedTheme || 'dark';
document.documentElement.setAttribute('data-theme', themeToApply);

// --- 2. LÓGICA DO BOTÃO ---
function updateToggleIcon(theme: Theme, btn: HTMLButtonElement): void {
	btn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
}

function toggleTheme(): void {
	const currentTheme = document.documentElement.getAttribute('data-theme') as Theme;
	const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

	document.documentElement.setAttribute('data-theme', newTheme);
	localStorage.setItem(STORAGE_KEY, newTheme);

	// Buscamos o botão novamente caso ele não tenha sido capturado no init
	const btn = document.getElementById('theme-toggle') as HTMLButtonElement | null;
	if (btn) updateToggleIcon(newTheme, btn);
}

// Esta função será chamada pelo Webpack em cada página
export function initTheme(): void {
	// Buscamos o elemento aqui dentro, pois o initTheme roda quando o DOM está pronto
	const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement | null;

	if (themeToggleBtn) {
		updateToggleIcon(themeToApply, themeToggleBtn);
		themeToggleBtn.onclick = toggleTheme; // Usar onclick ou addEventListener
	}
}

// Inicializa automaticamente
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initTheme);
} else {
	initTheme();
}
