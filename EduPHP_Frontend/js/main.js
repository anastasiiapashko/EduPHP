import { setupThemeToggle } from './theme.js';
import { setupRegistrationForm, setupLoginForm } from './auth.js';
import { setupUserDashboard } from './dashboard.js';
import { setupProfilePage } from './profile.js';
import { setupDescriptionCounter, setupPasswordValidation } from './validation.js';
import { showGlobalError } from './utils.js';
import { setupAdminPermissions } from './permissions.js';
import { setupCourseCreation } from './addKurs.js';
import { setupCourses } from './courses.js';

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
        setupCourseCreation();
        setupCourses();
    } catch (error) {
        console.error('Błąd podczas inicjalizacji aplikacji:', error);
        showGlobalError('Wystąpił błąd podczas ładowania aplikacji. Proszę odświeżyć stronę.');
    }
});