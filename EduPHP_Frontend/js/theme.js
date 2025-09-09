import { showGlobalError } from './utils.js';

function setupThemeToggle() {
    try {
        const themeToggle = document.getElementById('themeToggle');
        
        if (!themeToggle) {
            console.warn("Przełącznik motywu nie znaleziony");
            return;
        }

        initTheme(themeToggle);
        themeToggle.addEventListener('click', toggleTheme);
    } catch (error) {
        console.error('Błąd podczas inicjalizacji przełącznika motywu:', error);
    }
}

function initTheme(themeToggle) {
    try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    } catch (error) {
        console.error('Błąd podczas inicjalizacji motywu:', error);
    }
}

function toggleTheme() {
    try {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = this.querySelector('i');
        if (icon) {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    } catch (error) {
        console.error('Błąd podczas przełączania motywu:', error);
        showGlobalError('Błąd podczas zmiany motywu');
    }
}

export { setupThemeToggle };