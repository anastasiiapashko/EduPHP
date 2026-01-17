import { showGlobalError, getUserDataFromStorage } from './utils.js';
import {isAdmin} from './permissions.js' 
let allUsers = [];
let currentPage = 1;
const usersPerPage = 10;
let currentFilter = 'all';
let currentSearch = '';

export function setupAdminUsersPage() {
    if (!document.querySelector('.admin-users-container')) {
        return;
    }

    console.log('Inicjalizacja strony zarządzania użytkownikami...');
    
    // Sprawdź uprawnienia administratora
    if (!isAdmin()) {
        showGlobalError('Brak uprawnień administratora');
        window.location.href = 'user_main.html';
        return;
    }

    new UserManagementManager();
}

class UserManagementManager {
    constructor() {
        this.users = [];
        this.init();
    }

    async init() {
        await this.loadUsers();
        this.setupEventListeners();
        this.updateStatistics();
    }

    // Ładowanie użytkowników
    async loadUsers() {
        try {
            const response = await fetch('http://localhost:8082/api/admin/users', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.users = await response.json();
                console.log('Załadowani użytkownicy:', this.users);
                this.applyFilters();
                this.displayUsers();
            } else {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Błąd podczas ładowania użytkowników:', error);
            this.showError('Nie udało się załadować listy użytkowników');
        }
    }

    // Filtrowanie użytkowników
    applyFilters() {
        let filteredUsers = [...this.users];

        // Filtrowanie po wyszukiwaniu
        if (currentSearch) {
            filteredUsers = filteredUsers.filter(user => 
                user.firstName.toLowerCase().includes(currentSearch) ||
                user.lastName.toLowerCase().includes(currentSearch) ||
                user.login.toLowerCase().includes(currentSearch) ||
                user.role.toLowerCase().includes(currentSearch)
            );
        }

        // Filtrowanie po statusie
        if (currentFilter !== 'all') {
            if (currentFilter === 'active') {
                filteredUsers = filteredUsers.filter(user => user.active);
            } else if (currentFilter === 'blocked') {
                filteredUsers = filteredUsers.filter(user => !user.active);
            } else if (currentFilter === 'admin') {
                filteredUsers = filteredUsers.filter(user => user.role === 'admin');
            } else if (currentFilter === 'user') {
                filteredUsers = filteredUsers.filter(user => user.role === 'user');
            }
        }

        this.filteredUsers = filteredUsers;
    }

    // Wyświetlanie użytkowników
    displayUsers() {
        const usersList = document.getElementById('usersList');
        const usersCount = document.getElementById('usersCount');
        
        if (!usersList) return;

        if (this.filteredUsers.length === 0) {
            usersList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users fa-3x"></i>
                    <h3>Brak użytkowników</h3>
                    <p>Nie znaleziono użytkowników spełniających kryteria wyszukiwania.</p>
                </div>
            `;
            return;
        }

        if (usersCount) {
            usersCount.textContent = `Znaleziono ${this.filteredUsers.length} użytkowników`;
        }

        // Paginacja
        const totalPages = Math.ceil(this.filteredUsers.length / usersPerPage);
        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);

        usersList.innerHTML = paginatedUsers.map(user => this.createUserCard(user)).join('');
        this.generatePagination(totalPages);
    }

    // Tworzenie karty użytkownika
    createUserCard(user) {
        const currentUser = getUserDataFromStorage();
        const isCurrentUser = currentUser.id === user.id;
        
        return `
            <div class="user-management-item" data-user-id="${user.id}">
                <div class="user-management-header">
                    <div class="user-main-info">
                        <h3>${this.escapeHtml(user.firstName)} ${this.escapeHtml(user.lastName)}</h3>
                        <div class="user-meta">
                            <span class="user-login">
                                <i class="fas fa-user"></i>
                                ${this.escapeHtml(user.login)}
                            </span>
                            <span class="user-role user-role-${user.role}">
                                <i class="fas fa-shield-alt"></i>
                                ${user.role === 'admin' ? 'Administrator' : 'Użytkownik'}
                            </span>
                            <span class="user-status user-status-${user.active ? 'active' : 'blocked'}">
                                <i class="fas fa-circle"></i>
                                ${user.active ? 'Aktywny' : 'Zablokowany'}
                            </span>
                        </div>
                    </div>
                    <div class="user-management-actions">
                        ${!isCurrentUser && user.role !== 'admin' ? `
                            ${user.active ? `
                                <button class="btn-block" data-user-id="${user.id}">
                                    <i class="fas fa-ban"></i> Zablokuj
                                </button>
                            ` : `
                                <button class="btn-unblock" data-user-id="${user.id}">
                                    <i class="fas fa-check"></i> Odblokuj
                                </button>
                            `}
                        ` : ''}
                        ${isCurrentUser ? `
                            <span class="current-user-badge">(Ty)</span>
                        ` : ''}
                    </div>
                </div>
                <div class="user-additional-info">
                    <div class="user-detail">
                        <i class="fas fa-id-card"></i>
                        <span>ID: ${user.id}</span>
                    </div>
                    ${user.sandboxUserId ? `
                        <div class="user-detail">
                            <i class="fas fa-code"></i>
                            <span>Sandbox ID: ${user.sandboxUserId}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Aktualizacja statystyk
    updateStatistics() {
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(user => user.active).length;
        const blockedUsers = this.users.filter(user => !user.active).length;
        const adminUsers = this.users.filter(user => user.role === 'admin').length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('blockedUsers').textContent = blockedUsers;
        document.getElementById('adminUsers').textContent = adminUsers;
    }

    // Konfiguracja event listenerów
    setupEventListeners() {
        // Wyszukiwanie
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearch = e.target.value.toLowerCase();
                currentPage = 1;
                this.applyFilters();
                this.displayUsers();
            });
        }

        // Filtry
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                currentFilter = e.target.value;
                currentPage = 1;
                this.applyFilters();
                this.displayUsers();
            });
        }


        // Akcje użytkowników
        const usersList = document.getElementById('usersList');
        if (usersList) {
            usersList.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (!button) return;

                const userId = parseInt(button.dataset.userId);
                if (!userId) return;

                if (button.classList.contains('btn-block')) {
                    this.blockUser(userId);
                } else if (button.classList.contains('btn-unblock')) {
                    this.unblockUser(userId);
                }
            });
        }
    }

    // Blokowanie użytkownika
    async blockUser(userId) {
        if (!confirm('Czy na pewno chcesz zablokować tego użytkownika?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8082/api/admin/users/${userId}/block`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.showSuccess('Użytkownik został zablokowany');
                await this.loadUsers();
                this.updateStatistics();
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            console.error('Błąd podczas blokowania użytkownika:', error);
            this.showError('Nie udało się zablokować użytkownika: ' + error.message);
        }
    }

    // Odblokowanie użytkownika
    async unblockUser(userId) {
        if (!confirm('Czy na pewno chcesz odblokować tego użytkownika?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8082/api/admin/users/${userId}/unblock`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.showSuccess('Użytkownik został odblokowany');
                await this.loadUsers();
                this.updateStatistics();
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            console.error('Błąd podczas odblokowania użytkownika:', error);
            this.showError('Nie udało się odblokować użytkownika: ' + error.message);
        }
    }

  
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

