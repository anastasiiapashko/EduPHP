// permissions.js - moduł do zarządzania uprawnieniami użytkownika

import { showGlobalError } from './utils.js';

// Funkcja sprawdzająca czy użytkownik jest administratorem
export function isAdmin() {
    try{
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
        return userData && userData.rola === 'admin';
    }catch (error){
        console.error('Błąd podczas sprawdzania uprawnień: ', error);
        return false;
    }
    
}

// Funkcja ukrywająca elementy tylko dla administratora
export function setupAdminPermissions() {
    try {
        if (!isAdmin()) {
            const adminOnlyElements = document.querySelectorAll('.admin-only');
            adminOnlyElements.forEach(element => {
                element.style.display = 'none';
            });
        }
    } catch (error) {
        console.error('Błąd podczas ustawiania uprawnień:', error);
    }
}

// Funkcja do pobierania danych użytkownika
export function getUserData() {
    try {
        return JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
    } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
        return {};
    }
}