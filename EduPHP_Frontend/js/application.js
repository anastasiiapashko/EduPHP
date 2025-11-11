import { checkAuth, getCurrentUserId, getCurrentUser } from './auth.js';

let allApplications = [];
let currentPage = 1;
const applicationsPerPage = 10;
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'newest';
let answers = [];

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
                     <div class="application-full-description">${autoDetectAndFormatCode(application.opis)}</div>
                    
                    <!-- Sekcja odpowiedzi -->
                    ${createAnswersSection(application.idApp, isMyApplication)}
                    
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

export async function loadAnswers(complainId) {
    try {
        const response = await fetch(`http://localhost:8082/api/answers/complain/${complainId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Błąd podczas ładowania odpowiedzi');
            return [];
        }
    } catch (error) {
        console.error('Błąd:', error);
        return [];
    }
}

export async function addAnswer(complainId, content) {
    try {
        const userId = getCurrentUserId();
        const response = await fetch(`http://localhost:8082/api/answers/complain/${complainId}/user/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content }),
            credentials: 'include'
        });
        
        return response.ok;
    } catch (error) {
        console.error('Błąd:', error);
        return false;
    }
}

export async function deleteAnswer(answerId) {
    try {
        const response = await fetch(`http://localhost:8082/api/answers/${answerId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        return response.ok;
    } catch (error) {
        console.error('Błąd:', error);
        return false;
    }
}

export async function updateAnswer(answerId, content) {
    try {
        const response = await fetch(`http://localhost:8082/api/answers/${answerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content }),
            credentials: 'include'
        });
        
        return response.ok;
    } catch (error) {
        console.error('Błąd:', error);
        return false;
    }
}

// Funkcja do tworzenia interfejsu komentarzy
function createAnswersSection(complainId, isMyApplication) {
    return `
        <div class="answers-section" data-complain-id="${complainId}">
            <div class="answers-header">
                <h4><i class="fas fa-comments"></i> Odpowiedzi</h4>
                <button class="btn-toggle-answers" onclick="toggleAnswers(${complainId})">
                    <i class="fas fa-chevron-down"></i>
                    <span>Pokaż odpowiedzi</span>
                </button>
            </div>
            <div class="answers-container" id="answers-${complainId}" style="display: none;">
                <div class="answers-list" id="answers-list-${complainId}">
                    <div class="loader">Ładowanie odpowiedzi...</div>
                </div>
                <div class="answer-form">
                    <textarea 
                        id="answer-input-${complainId}" 
                        placeholder="Dodaj odpowiedź..." 
                        rows="3"
                    ></textarea>
                    <button class="btn-submit-answer" onclick="submitAnswer(${complainId})">
                        <i class="fas fa-paper-plane"></i> Wyślij odpowiedź
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Globalne funkcje do obsługi odpowiedzi
window.toggleAnswers = async function(complainId) {
    const container = document.getElementById(`answers-${complainId}`);
    const button = document.querySelector(`[onclick="toggleAnswers(${complainId})"]`);
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (container.style.display === 'none') {
        // Pokaż i załaduj odpowiedzi
        container.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
        text.textContent = 'Ukryj odpowiedzi';
        
        await loadAndDisplayAnswers(complainId);
    } else {
        // Ukryj odpowiedzi
        container.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
        text.textContent = 'Pokaż odpowiedzi';
    }
}

window.submitAnswer = async function(complainId) {
    const input = document.getElementById(`answer-input-${complainId}`);
    const content = input.value.trim();
    
    if (!content) {
        alert('Proszę wpisać odpowiedź');
        return;
    }
    
    const success = await addAnswer(complainId, content);
    
    if (success) {
        input.value = '';
        await loadAndDisplayAnswers(complainId); // Odśwież listę
    } else {
        alert('Błąd podczas dodawania odpowiedzi');
    }
}

async function loadAndDisplayAnswers(complainId) {
    const answersList = document.getElementById(`answers-list-${complainId}`);
    answersList.innerHTML = '<div class="loader">Ładowanie odpowiedzi...</div>';
    
    answers = await loadAnswers(complainId); // ZAPISZ DO GLOBALNEJ ZMIENNEJ
    
    if (answers.length === 0) {
        answersList.innerHTML = '<div class="empty-state">Brak odpowiedzi</div>';
        return;
    }
    
    answersList.innerHTML = answers.map(answer => `
        <div class="answer-item" data-answer-id="${answer.idAnswer}">
            <div class="answer-header">
                <span class="answer-author">${answer.userName}</span>
                <span class="answer-date">
                    ${new Date(answer.dateCreated).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            </div>
            <div class="answer-content">${autoDetectAndFormatCode(answer.content)}</div> <!-- DODAJ FORMATOWANIE -->
            ${answer.userId === getCurrentUserId() ? `
                <div class="answer-actions">
                    <button class="btn-edit-sm" onclick="editAnswer(${answer.idAnswer})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-sm" onclick="deleteAnswerConfirm(${answer.idAnswer})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

window.editAnswer = function(answerId) {
    const answerItem = document.querySelector(`[data-answer-id="${answerId}"]`);
    const contentDiv = answerItem.querySelector('.answer-content');
    
    // Pobierz oryginalną treść z globalnej zmiennej answers
    const originalAnswer = answers.find(a => a.idAnswer === answerId);
    const currentContent = originalAnswer ? originalAnswer.content : contentDiv.textContent;
    
    contentDiv.innerHTML = `
        <textarea class="edit-answer-input" style="width: 100%; min-height: 100px; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--card-bg); color: var(--text-color);">${currentContent}</textarea>
        <div class="edit-actions">
            <button class="btn-primary btn-sm" onclick="saveAnswerEdit(${answerId})">Zapisz</button>
            <button class="btn-secondary btn-sm" onclick="cancelAnswerEdit(${answerId})">Anuluj</button>
        </div>
    `;
}

window.saveAnswerEdit = async function(answerId) {
    const answerItem = document.querySelector(`[data-answer-id="${answerId}"]`);
    const textarea = answerItem.querySelector('.edit-answer-input');
    const newContent = textarea.value.trim();
    
    if (!newContent) {
        alert('Odpowiedź nie może być pusta');
        return;
    }
    
    const success = await updateAnswer(answerId, newContent);
    
    if (success) {
        // Odśwież listę odpowiedzi
        const complainId = answerItem.closest('.answers-section').dataset.complainId;
        await loadAndDisplayAnswers(complainId);
    } else {
        alert('Błąd podczas aktualizacji odpowiedzi');
    }
}

window.cancelAnswerEdit = function(answerId) {
    const answerItem = document.querySelector(`[data-answer-id="${answerId}"]`);
    const complainId = answerItem.closest('.answers-section').dataset.complainId;
    loadAndDisplayAnswers(complainId); // Odśwież bez zapisywania
}

window.deleteAnswerConfirm = function(answerId) {
    if (confirm('Czy na pewno chcesz usunąć tę odpowiedź?')) {
        deleteAnswer(answerId).then(success => {
            if (success) {
                // Odśwież listę odpowiedzi
                const answerItem = document.querySelector(`[data-answer-id="${answerId}"]`);
                const complainId = answerItem.closest('.answers-section').dataset.complainId;
                loadAndDisplayAnswers(complainId);
            } else {
                alert('Błąd podczas usuwania odpowiedzi');
            }
        });
    }
}

function autoDetectAndFormatCode(content) {
    if (!content) return '';
    
    // Escapowanie HTML dla bezpieczeństwa
    let safeContent = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // 1. Wykrywanie bloków kodu PHP (różne warianty)
    safeContent = safeContent.replace(
        /(&lt;\/?(php\?|php|\?)(&gt;)?)([\s\S]*?)(\?&gt;)/gi,
        '<pre><code class="language-php">$1$4$5</code></pre>'
    );

    // 2. Wykrywanie bloków kodu z ``` (Markdown)
    safeContent = safeContent.replace(
        /```(\w+)?\n?([\s\S]*?)```/g,
        '<pre><code class="language-$1">$2</code></pre>'
    );

    // 3. Wykrywanie pojedynczych linii kodu z `
    safeContent = safeContent.replace(
        /`([^`]+)`/g,
        '<code class="inline-code">$1</code>'
    );

    // 4. Zamiana zwykłych enterów na <br> dla tekstu poza kodem
    safeContent = safeContent.replace(/\n/g, '<br>');

    return safeContent;
}
