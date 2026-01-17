import { showGlobalError } from './utils.js';
import { setupAdminPermissions } from './permissions.js';
import { getCurrentUserId } from './auth.js';

function setupUserDashboard() {
    try {
        const userMain = document.getElementById('userGreeting');
        const userNameElement = document.getElementById('userName');
        
        if (!userMain && !userNameElement) return;
        
        let userData = {};
        try {
            const storedData = localStorage.getItem('userData');
            if (storedData) {
                userData = JSON.parse(storedData);
                console.log(' Znaleziono userData:', userData);
                
                if (userMain) {
                    userMain.textContent = userData.firstName || userData.login || 'Użytkowniku';
                }
                
                if (userNameElement) {
                    userNameElement.textContent = userData.firstName || userData.login || 'Profil';
                }
            } else {
                console.warn(' Brak userData w localStorage');
                window.location.href = 'login.html';
                return;
            }
        } catch (parseError) {
            console.error('Błąd parsowania danych użytkownika:', parseError);
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
            return;
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                try {
                    localStorage.removeItem('userData');
                    localStorage.removeItem('authToken');
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Błąd podczas wylogowania:', error);
                    showGlobalError('Błąd podczas wylogowania');
                }
            });
        }
        
        if (userMain) {
            loadRecentActivity();
            setupActivityRefresh();
        }
        
        setupAdminPermissions();
        
    } catch (error) {
        console.error('Błąd podczas inicjalizacji dashboardu użytkownika:', error);
        window.location.href = 'login.html';
    }
}

// Funkcja do konfiguracji odświeżania aktywności
function setupActivityRefresh() {
    const refreshBtn = document.getElementById('refreshActivity');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadRecentActivity();
        });
    }
}

// Główna funkcja ładowania aktywności
async function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activityList');
        const activityEmpty = document.getElementById('activityEmpty');
        
        if (!activityList) return;
        
        activityList.innerHTML = `
            <div class="activity-loading">
                <div class="loader-spinner"></div>
                <p>Ładowanie aktywności...</p>
            </div>
        `;
        
        if (activityEmpty) {
            activityEmpty.style.display = 'none';
        }
        
        const activities = await fetchUserActivities();
        
        if (activities.length === 0) {
            showEmptyActivityState(activityList, activityEmpty);
            return;
        }
        
        displayActivities(activities, activityList);
        
    } catch (error) {
        console.error('Błąd podczas ładowania aktywności:', error);
        showActivityError();
    }
}

// Funkcja pobierająca aktywności użytkownika
async function fetchUserActivities() {
    const userId = getCurrentUserId();
    if (!userId) {
        throw new Error('Nie znaleziono ID użytkownika');
    }
    
    try {
        console.log('🔄 Pobieranie aktywności dla użytkownika:', userId);
        
        const tasksResponse = await fetch(`http://localhost:8082/api/user-task/user/${userId}`, {
            credentials: 'include'
        });
        
        if (!tasksResponse.ok) {
            throw new Error('Błąd podczas pobierania zadań');
        }
        
        const userTasks = await tasksResponse.json();
        console.log('📊 Zadania użytkownika:', userTasks);
        
        const coursesResponse = await fetch(`http://localhost:8082/api/user-kurs/${userId}/kursy`, {
            credentials: 'include'
        });
        
        let userCourses = [];
        if (coursesResponse.ok) {
            userCourses = await coursesResponse.json();
            console.log('📚 Kursy użytkownika:', userCourses);
        }
        
        return transformToActivities(userTasks, userCourses);
        
    } catch (error) {
        console.error('Błąd pobierania danych aktywności:', error);
        throw error;
    }
}

// Funkcja przekształcająca dane na format aktywności
function transformToActivities(userTasks, userCourses) {
    const activities = [];
    
    userTasks.forEach(task => {
        if (task.status === 'COMPLETED' && task.completionDate) {
            activities.push({
                type: 'task_completed',
                icon: 'fa-check-circle',
                text: `Ukończono zadanie: ${task.taskTitle || 'Brak tytułu'}`,
                score: task.score,
                difficulty: task.taskDifficulty,
                time: new Date(task.completionDate),
                rawData: task
            });
        } else if (task.status === 'IN_PROGRESS' && task.startDate) {
            activities.push({
                type: 'task_started',
                icon: 'fa-play-circle',
                text: `Rozpoczęto zadanie: ${task.taskTitle || 'Brak tytułu'}`,
                time: new Date(task.startDate),
                rawData: task
            });
        }
    });
    
    userCourses.forEach(course => {
        if (course.ukonczony) {
            activities.push({
                type: 'course_completed',
                icon: 'fa-trophy',
                text: `Ukończono kurs: ${course.tytul || 'Brak tytułu'}`,
                time: new Date(), 
                rawData: course
            });
        }
    });
    
    // Sortuj od najnowszych do najstarszych
    activities.sort((a, b) => b.time - a.time);
    
    // Ogranicz do 10 najnowszych aktywności
    return activities.slice(0, 10);
}

// Funkcja wyświetlająca aktywności
function displayActivities(activities, activityList) {
    activityList.innerHTML = activities.map(activity => createActivityItem(activity)).join('');
}

// Funkcja tworząca pojedynczy element aktywności
function createActivityItem(activity) {
    const timeAgo = getTimeAgo(activity.time);
    let scoreBadge = '';
    let difficultyBadge = '';
    
    if (activity.type === 'task_completed' && activity.score !== undefined) {
        scoreBadge = `<span class="activity-score score-${Math.floor(activity.score)}">${activity.score}/10</span>`;
    }
    
    if (activity.difficulty) {
        difficultyBadge = `<span class="activity-difficulty task-difficulty-${activity.difficulty}">${activity.difficulty}</span>`;
    }
    
    return `
        <div class="activity-item" data-activity-type="${activity.type}">
            <i class="fas ${activity.icon} activity-icon"></i>
            <div class="activity-content">
                <div class="activity-text">
                    <span>${activity.text}</span>
                    ${scoreBadge}
                    ${difficultyBadge}
                </div>
                <small class="activity-time">${timeAgo}</small>
            </div>
        </div>
    `;
}

// Funkcja pomocnicza do formatowania czasu
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'przed chwilą';
    if (diffMins < 60) return `${diffMins} minut temu`;
    if (diffHours < 24) return `${diffHours} godzin temu`;
    if (diffDays === 1) return 'wczoraj';
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tygodni temu`;
    
    return date.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Funkcja pokazująca pusty stan
function showEmptyActivityState(activityList, activityEmpty) {
    activityList.innerHTML = '';
    if (activityEmpty) {
        activityEmpty.style.display = 'block';
    }
}

// Funkcja pokazująca błąd
function showActivityError() {
    const activityList = document.getElementById('activityList');
    if (activityList) {
        activityList.innerHTML = `
            <div class="activity-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Nie udało się załadować aktywności</p>
                <button class="btn-retry" onclick="loadRecentActivity()">Spróbuj ponownie</button>
            </div>
        `;
    }
}

// Eksport funkcji do globalnego scope
window.loadRecentActivity = loadRecentActivity;

export { setupUserDashboard };