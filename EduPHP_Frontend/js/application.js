import { checkAuth, getCurrentUserId, getCurrentUser } from './auth.js';

let allApplications = [];
let currentPage = 1;
const applicationsPerPage = 10;
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'newest';

export function setupApplicationsPage() {
    const applicationsList = document.getElementById('applicationsList');
    if (!applicationsList) return;
    
    console.log('Inicjalizacja strony zgłoszeń...');

    setupEventListeners();
    loadApplications();
}

function setupEventListeners() {
    // Wyszukiwanie
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            currentPage = 1;
            filterAndDisplayApplications();
        });
    }

    // Filtry
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            currentPage = 1;
            filterAndDisplayApplications();
        });
    }

    // Sortowanie
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            filterAndDisplayApplications();
        });
    }
}

async function loadApplications() {
    try {
        const response = await fetch('http://localhost:8082/api/applications', {
            credentials: 'include'
        });
        
        if (response.ok) {
            allApplications = await response.json();
            console.log('Załadano zgłoszenia:', allApplications.length);
            updateStatistics();
            filterAndDisplayApplications();
        } else {
            throw new Error('Błąd podczas ładowania zgłoszeń');
        }
    } catch (error) {
        console.error('Błąd:', error);
        showError('Nie udało się załadować zgłoszeń');
    }
}

function filterAndDisplayApplications() {
    let filteredApplications = [...allApplications];

    // Filtrowanie po wyszukiwaniu
    if (currentSearch) {
        filteredApplications = filteredApplications.filter(app => 
            app.tytul.toLowerCase().includes(currentSearch) ||
            app.opis.toLowerCase().includes(currentSearch)
        );
    }

    // Filtrowanie po typie (wszystkie/moje)
    if (currentFilter === 'my') {
        const currentUserId = getCurrentUserId();
        filteredApplications = filteredApplications.filter(app => 
            app.user && app.user.idUser === currentUserId
        );
    }

    // Sortowanie
    filteredApplications.sort((a, b) => {
        const dateA = new Date(a.datePublish);
        const dateB = new Date(b.datePublish);
        
        if (currentSort === 'newest') {
            return dateB - dateA; // Od najnowszych
        } else {
            return dateA - dateB; // Od najstarszych
        }
    });

    displayApplications(filteredApplications);
    updatePagination(filteredApplications.length);
}

function displayApplications(applications) {
    const applicationsList = document.getElementById('applicationsList');
    const applicationsCount = document.getElementById('applicationsCount');
    
    if (!applicationsList) return;

    // Aktualizuj licznik
    if (applicationsCount) {
        applicationsCount.textContent = `Znaleziono ${applications.length} zgłoszeń`;
    }

    if (applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Brak zgłoszeń spełniających kryteria</p>
                <a href="application_send.html" class="application-btn">Utwórz pierwsze zgłoszenie</a>
            </div>
        `;
        return;
    }

    // Paginacja
    const startIndex = (currentPage - 1) * applicationsPerPage;
    const endIndex = startIndex + applicationsPerPage;
    const paginatedApplications = applications.slice(startIndex, endIndex);

    applicationsList.innerHTML = paginatedApplications.map(app => createApplicationCard(app)).join('');
    
    // Dodaj event listeners do przycisków rozwijania
    addExpandListeners();
}

function createApplicationCard(application) {
    const isMyApplication = application.user && application.user.idUser === getCurrentUserId();
    const shortDescription = application.opis.length > 150 
        ? application.opis.substring(0, 150) + '...' 
        : application.opis;
    
    const date = new Date(application.datePublish).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    //ten fragment używa dynamicznych danych
    return `
        <div class="application-card" data-app-id="${application.idApp}">
            <div class="application-card-header">
                <div class="application-content">
                    <h3 class="application-title">${application.tytul}</h3>
                    <div class="application-meta">
                        <span class="application-author">
                            <i class="fas fa-user"></i>
                            ${application.user ? application.user.firstName + ' ' + application.user.secondName : 'Nieznany użytkownik'}
                            ${isMyApplication ? '<span class="my-badge">(Moje)</span>' : ''}
                        </span>
                        <span class="application-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${date}
                        </span>
                    </div>
                </div>
                <button class="toggle-btn" data-app-id="${application.idApp}">
                    <i class="fas fa-chevron-down"></i>
                    <span>Rozwiń</span>
                </button>
            </div>
            <div class="application-preview">
                <div class="application-full-content" id="full-content-${application.idApp}">
                    <div class="application-full-description">${application.opis}</div>
                    ${isMyApplication ? `
                        <div class="application-actions">
                            <button class="btn-edit" onclick="editApplication(${application.idApp})">
                                <i class="fas fa-edit"></i> Edytuj
                            </button>
                            <button class="btn-delete" onclick="deleteApplication(${application.idApp})">
                                <i class="fas fa-trash"></i> Usuń
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function addExpandListeners() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appId = this.getAttribute('data-app-id');
            const fullContent = document.getElementById(`full-content-${appId}`);
            const icon = this.querySelector('i');
            const text = this.querySelector('span');
            
            if (fullContent.classList.contains('expanded')) {
                fullContent.classList.remove('expanded');
                icon.className = 'fas fa-chevron-down';
                text.textContent = 'Rozwiń';
            } else {
                fullContent.classList.add('expanded');
                icon.className = 'fas fa-chevron-up';
                text.textContent = 'Zwiń';
            }
        });
    });
}

function updatePagination(totalApplications) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(totalApplications / applicationsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Przycisk poprzedni
    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Poprzednia
        </button>
    `;

    // Numery stron
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
    }

    // Przycisk następny
    paginationHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            Następna <i class="fas fa-chevron-right"></i>
        </button>
    `;

    // Informacja o stronie
    paginationHTML += `
        <div class="pagination-info">
            Strona ${currentPage} z ${totalPages}
        </div>
    `;

    pagination.innerHTML = paginationHTML;
}

function updateStatistics() {
    const currentUserId = getCurrentUserId();
    const today = new Date().toDateString();
    
    const totalApplications = allApplications.length;
    const myApplications = allApplications.filter(app => 
        app.user && app.user.idUser === currentUserId
    ).length;
    const todayApplications = allApplications.filter(app => 
        new Date(app.datePublish).toDateString() === today
    ).length;

    document.getElementById('totalApplications').textContent = totalApplications;
    document.getElementById('myApplications').textContent = myApplications;
    document.getElementById('todayApplications').textContent = todayApplications;
}

function showError(message) {
    const applicationsList = document.getElementById('applicationsList');
    applicationsList.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Funkcje globalne dla paginacji
window.changePage = function(page) {
    currentPage = page;
    filterAndDisplayApplications();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.editApplication = function(id) {
    // Przekieruj do formularza edycji
    window.location.href = `application_send.html?edit=${id}`;
};

window.deleteApplication = async function(id) {
    if (!confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8082/api/applications/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Zgłoszenie zostało usunięte.');
            loadApplications(); // Przeładuj listę
        } else {
            alert('Wystąpił błąd podczas usuwania zgłoszenia.');
        }
    } catch (error) {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas usuwania zgłoszenia.');
    }
};