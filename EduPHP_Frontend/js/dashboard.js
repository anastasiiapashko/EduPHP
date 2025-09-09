import { getUserDataFromStorage, showGlobalError } from './utils.js';
import { setupAdminPermissions } from './permissions.js';
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
                console.log('✅ Znaleziono userData:', userData);
                
                if (userMain) {
                    userMain.textContent = userData.firstName || userData.login || 'Użytkowniku';
                }
                
                if (userNameElement) {
                    userNameElement.textContent = userData.firstName || userData.login || 'Profil';
                }
            } else {
                console.warn('❌ Brak userData w localStorage');
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
        }
        
        setupAdminPermissions();
        
    } catch (error) {
        console.error('Błąd podczas inicjalizacji dashboardu użytkownika:', error);
        window.location.href = 'login.html';
    }
}

function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        const activities = [
            { icon: 'fa-check-circle', text: 'Ukończono lekcję podstaw PHP', time: '2 godziny temu' },
            { icon: 'fa-trophy', text: 'Osiągnięto nowy poziom', time: '1 dzień temu' },
            { icon: 'fa-task', text: 'Rozwiązano zadanie z pętli', time: '2 dni temu' }
        ];
        
        activityList.innerHTML = '';
        
        activities.forEach(activity => {
            try {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <i class="fas ${activity.icon}"></i>
                    <span>${activity.text}</span>
                    <small>${activity.time}</small>
                `;
                activityList.appendChild(activityItem);
            } catch (activityError) {
                console.error('Błąd podczas tworzenia elementu aktywności:', activityError);
            }
        });
    } catch (error) {
        console.error('Błąd podczas ładowania aktywności:', error);
    }
}

export { setupUserDashboard };