import { getCurrentUserId } from './auth.js';
import { updateCharCounter } from './utils.js';


let isEditMode = false;
let editApplicationId = null;

export function setupApplicationForm() {
    const applicationForm = document.getElementById('applicationForm');
    if (!applicationForm) {
        console.log('Formularz zgłoszeń nie znaleziony');
        return;
    }
    
    console.log('Inicjalizacja formularza zgłoszeń...');

    // Sprawdź czy jesteśmy w trybie edycji
    checkEditMode();
    
    // Obsługa formularza
    applicationForm.addEventListener('submit', handleApplicationSubmit);
    
    // Inicjalizacja licznika znaków
    setupCharCounter();
    
    console.log('Formularz zgłoszeń zainicjalizowany pomyślnie');
}

function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        isEditMode = true;
        editApplicationId = editId;
        console.log('Tryb edycji dla zgłoszenia ID:', editId);
        
        // Zmień tytuł strony i przycisk
        document.querySelector('h1').innerHTML = '<i class="fas fa-edit"></i> Edytuj zgłoszenie';
        document.querySelector('p').textContent = 'Edytuj istniejące zgłoszenie problemu.';
        document.querySelector('.btn-primary').innerHTML = '<i class="fas fa-save"></i> Zapisz zmiany';
        
        // Załaduj dane zgłoszenia
        loadApplicationData(editId);
    }
}

async function loadApplicationData(applicationId) {
    try {
        console.log('Ładowanie danych zgłoszenia ID:', applicationId);
        
        const response = await fetch(`http://localhost:8082/api/applications/${applicationId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const application = await response.json();
            console.log('Załadano dane zgłoszenia:', application);
            
            // Wypełnij formularz danymi
            document.getElementById('applicationTitle').value = application.tytul || '';
            document.getElementById('applicationDescription').value = application.opis || '';
            
            // Zaktualizuj licznik znaków
            const descriptionLength = document.getElementById('applicationDescription').value.length;
            updateCharCounter(descriptionLength);
            
        } else {
            console.error('Błąd podczas ładowania danych zgłoszenia');
            showErrorMessage('Nie udało się załadować danych zgłoszenia do edycji');
        }
    } catch (error) {
        console.error('Błąd:', error);
        showErrorMessage('Wystąpił błąd podczas ładowania danych: ' + error.message);
    }
}

function setupCharCounter() {
    const descriptionTextarea = document.getElementById('applicationDescription');
    
    if (descriptionTextarea) {
        descriptionTextarea.addEventListener('input', function() {
            const length = this.value.length;
            updateCharCounter(length, 500);  
        });
        
        // Inicjalne ustawienie licznika
        const initialLength = descriptionTextarea.value.length;
        updateCharCounter(initialLength, 500);
    }
}

async function handleApplicationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const application = {
        tytul: formData.get('title'),
        opis: formData.get('description')
    };
    
    try {
        const userId = getCurrentUserId();
        console.log('Pobrane ID użytkownika:', userId);
        
        if (!userId) {
            showErrorMessage('Nie jesteś zalogowany!');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }
        
        let response;
        
        if (isEditMode) {
            // Tryb edycji - PUT
            console.log('Aktualizowanie zgłoszenia ID:', editApplicationId);
            response = await fetch(`http://localhost:8082/api/applications/${editApplicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(application),
                credentials: 'include'
            });
        } else {
            // Tryb tworzenia - POST
            console.log('Tworzenie nowego zgłoszenia:', application);
            response = await fetch(`http://localhost:8082/api/applications/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(application),
                credentials: 'include'
            });
        }
        
        console.log('Odpowiedź serwera:', response.status);
        
        if (response.ok) {
            const savedApplication = await response.json();
            console.log('Zapisane zgłoszenie:', savedApplication);
            
            const successMessage = isEditMode 
                ? 'Zgłoszenie zostało zaktualizowane pomyślnie! Za chwilę nastąpi przekierowanie...'
                : 'Zgłoszenie zostało wysłane pomyślnie! Za chwilę nastąpi przekierowanie...';
                
            showSuccessMessage(successMessage);
            
            // Przekieruj po 2 sekundach
            setTimeout(() => {
                window.location.href = 'application.html';
            }, 2000);
            
        } else {
            const errorText = await response.text();
            console.error('Błąd serwera:', errorText);
            showErrorMessage('Wystąpił błąd: ' + errorText);
        }
    } catch (error) {
        console.error('Błąd:', error);
        showErrorMessage('Wystąpił błąd połączenia: ' + error.message);
    }
}

// Pozostałe funkcje pozostają bez zmian
function showSuccessMessage(message) {
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'form-success';
    messageDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    
    const form = document.getElementById('applicationForm');
    form.insertBefore(messageDiv, form.firstChild);
}

function showErrorMessage(message) {
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error show';
    messageDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
    `;
    
    const form = document.getElementById('applicationForm');
    form.insertBefore(messageDiv, form.firstChild);
}

function removeExistingMessages() {
    const existingSuccess = document.querySelector('.form-success');
    const existingError = document.querySelector('.error.show');
    
    if (existingSuccess) existingSuccess.remove();
    if (existingError) existingError.remove();
}