// main.js - centralne zarządzanie autoryzacją
import { setupThemeToggle } from './theme.js';
import { setupRegistrationForm, setupLoginForm, checkAuth } from './auth.js';
import { setupUserDashboard } from './dashboard.js';
import { setupProfilePage } from './profile.js';
import { setupDescriptionCounter, setupPasswordValidation } from './validation.js';
import { showGlobalError } from './utils.js';
import { setupAdminPermissions } from './permissions.js';
import { setupCourseCreation } from './addKurs.js';
import { setupCourses } from './courses.js';
import { setupApplicationForm } from './application_send.js';
import { setupApplicationsPage } from './application.js';
import { setupTasksPage } from './tasks.js';
import { setupCreatorPage } from './addTask.js'; 
import { setupTaskSolvePage } from './task_solve.js';

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Strony publiczne - nie wymagają logowania
        const publicPages = ['index.html', 'login.html', 'register.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        console.log('Aktualna strona:', currentPage);
        console.log('Użytkownik zalogowany:', checkAuth());
        
        // Sprawdź czy strona wymaga autoryzacji
        const isPublicPage = publicPages.includes(currentPage);
        const isLoggedIn = checkAuth();
        
        // Jeśli nie jesteśmy na stronie publicznej i użytkownik nie jest zalogowany
        if (!isPublicPage && !isLoggedIn) {
            console.log('Brak autoryzacji - przekierowanie do logowania');
            window.location.href = 'login.html';
            return; // STOP - nie ładuj dalszych modułów
        }
        
        // Jeśli jesteśmy na stronie logowania/rejestracji i użytkownik jest już zalogowany
        if (isPublicPage && isLoggedIn && currentPage !== 'index.html') {
            console.log('Użytkownik już zalogowany - przekierowanie do dashboardu');
            window.location.href = 'user_main.html';
            return;
        }

        // Inicjalizuj moduły wspólne dla wszystkich stron
        setupThemeToggle();
        
        // Inicjalizuj moduły dla stron publicznych
        if (isPublicPage) {
            setupRegistrationForm();
            setupLoginForm();
        }
        
        // Inicjalizuj moduły tylko dla zalogowanych użytkowników
        if (isLoggedIn) {
            setupUserDashboard();
            setupProfilePage();
            setupDescriptionCounter();
            setupPasswordValidation();
            setupAdminPermissions();
            setupCourseCreation();
            setupCourses();
            setupApplicationForm();
            setupApplicationsPage();
            setupTasksPage();
            setupCreatorPage();
            setupTaskSolvePage();
        }
        
        console.log('Inicjalizacja zakończona pomyślnie');
        
    } catch (error) {
        console.error('Błąd podczas inicjalizacji aplikacji:', error);
        showGlobalError('Wystąpił błąd podczas ładowania aplikacji. Proszę odświeżyć stronę.');
    }
});