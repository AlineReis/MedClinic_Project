
import { authStore } from "../stores/authStore";
import { listProfessionals } from "../services/professionalsService";
import { listUsers } from "../services/usersService"; // Assuming this exists or we use professionalsService

document.addEventListener("DOMContentLoaded", () => {
    initTeamPage();
});

async function initTeamPage() {
    let session = authStore.getSession();

    if (!session) {
        session = await authStore.refreshSession();
    }

    if (!session || (session.role !== 'clinic_admin' && session.role !== 'system_admin')) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Setup Filters
    setupFilters();

    // Fetch Data
    await loadTeamData();
}

function setupFilters() {
    const filterSelect = document.querySelector('.admin-select') as HTMLSelectElement;
    if (filterSelect) {
        filterSelect.addEventListener('change', () => loadTeamData(filterSelect.value));
    }
}

async function loadTeamData(roleFilter = 'Todos os Níveis') {
    const tableBody = document.querySelector('.admin-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';

    try {
        // Just fetching professionals for now as per "Equipe" focus
        // If we want all users, we'd need listUsers()
        // Let's assume listProfessionals gives us doctors
        const response = await listProfessionals({ pageSize: 50 });

        if (response.success && response.data && response.data.data) {
            renderTeamTable(response.data.data, roleFilter);
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar equipe.</td></tr>';
        }
    } catch (error) {
        console.error("Error loading team:", error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Erro de conexão.</td></tr>';
    }
}

function renderTeamTable(professionals: any[], filter: string) {
    const tableBody = document.querySelector('.admin-table tbody');
    if (!tableBody) return;

    if (professionals.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum profissional encontrado.</td></tr>';
        return;
    }

    const html = professionals.map(pro => `
        <tr>
            <td>
                <div class="user-info-row">
                    <div class="user-avatar-initials">${getInitials(pro.name)}</div>
                    <div class="user-profile-data">
                        <p class="user-name">${pro.name}</p>
                        <p class="user-id">CRM: ${pro.crm || '--'}</p>
                    </div>
                </div>
            </td>
            <td class="cell-email">${pro.email || 'sem@email.com'}</td>
            <td>
                <span class="access-badge badge-med">${pro.specialty || 'MÉDICO'}</span>
            </td>
            <td>
                <span class="status-indicator">
                    <span class="dot dot-emerald"></span> Ativo
                </span>
            </td>
            <td class="cell-actions">
                <button class="btn-icon-action" title="Ver Agenda" onclick="window.location.href='agenda.html?professional_id=${pro.id}'">
                    <span class="material-symbols-outlined">calendar_month</span>
                </button>
                <button class="btn-icon-action" title="Editar">
                    <span class="material-symbols-outlined">edit_square</span>
                </button>
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = html;
}

function getInitials(name: string) {
    return name ? name.split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase() : 'U';
}
