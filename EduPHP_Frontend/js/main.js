import { setupThemeToggle } from './theme.js';
import { setupRegistrationForm, setupLoginForm } from './auth.js';
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
import { setupCreatorPage } from './addTask.js'; // ← DODAJ TEN IMPORT

document.addEventListener('DOMContentLoaded', function() {
    try {
        setupThemeToggle();
        setupRegistrationForm();
        setupLoginForm();
        setupUserDashboard();
        setupProfilePage();
        setupDescriptionCounter();
        setupPasswordValidation();
        setupAdminPermissions();
        setupCourseCreation(); // Kursy w creator.html
        setupCourses();
        setupApplicationForm(); 
        setupApplicationsPage();
        setupTasksPage(); // Zadania tylko do przeglądania
        setupCreatorPage(); // ← DODAJ: Zarządzanie zadaniami w creator.html
    } catch (error) {
        console.error('Błąd podczas inicjalizacji aplikacji:', error);
        showGlobalError('Wystąpił błąd podczas ładowania aplikacji. Proszę odświeżyć stronę.');
    }
});