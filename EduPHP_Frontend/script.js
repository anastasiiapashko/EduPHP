// Pobierz userId z localStorage lub innej metody autentykacji
function getUserId() {
    const userData = getUserDataFromStorage();
    return userData.id || null;
}

// Funkcja do pobierania avatara
async function fetchAvatar(userId) {
    try {
        const avatarImage = document.getElementById('avatarImage');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const avatarMessage = document.getElementById('avatarMessage');

        if (!avatarImage || !avatarPlaceholder) {
            console.error('Brak elementów DOM: avatarImage lub avatarPlaceholder');
            return;
        }

        // Dodaj cache-busting, aby uniknąć cache'owania
        const response = await fetch(`http://localhost:8082/api/profil/avatar/${userId}?t=${new Date().getTime()}`, {
            method: 'GET',
            credentials: 'include', // Włącz ciasteczka dla CORS
            headers: {
                'Accept': 'image/*'
            }
        });

        // Sprawdź, czy odpowiedź jest poprawna
        if (!response.ok) {
            if (response.status === 404) {
                console.warn('Avatar nie znaleziony dla użytkownika:', userId);
                throw new Error('Brak avatara');
            }
            throw new Error(`Błąd serwera: ${response.status}`);
        }

        // Sprawdź typ zawartości
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('Nieprawidłowy format odpowiedzi - oczekiwano obrazu');
        }

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
            throw new Error('Pusta odpowiedź z serwera');
        }

        // Utwórz URL dla obrazu i ustaw go w elemencie <img>
        const url = URL.createObjectURL(blob);
        avatarImage.src = url;
        avatarImage.style.display = 'block';
        avatarPlaceholder.style.display = 'none';

        // Wyczyść komunikat, jeśli istnieje
        if (avatarMessage) {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }
    } catch (error) {
        console.error('Błąd podczas pobierania avatara:', error.message);
        const avatarImage = document.getElementById('avatarImage');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const avatarMessage = document.getElementById('avatarMessage');

        if (avatarImage && avatarPlaceholder) {
            avatarImage.src = ''; // Wyczyść źródło obrazu
            avatarImage.style.display = 'none';
            avatarPlaceholder.style.display = 'block'; // Pokaż domyślny placeholder
        }

        if (avatarMessage) {
            avatarMessage.textContent = 'Nie udało się załadować avatara';
            avatarMessage.className = 'avatar-message error';
            // Wyczyść komunikat po 5 sekundach
            setTimeout(() => {
                avatarMessage.textContent = '';
                avatarMessage.className = 'avatar-message';
            }, 5000);
        }
    }
}

// Funkcja do przesyłania avatara
async function uploadAvatar() {
    try {
        const userId = getUserId();
        if (!userId) {
            showGlobalError('Nie jesteś zalogowany!');
            return;
        }

        const avatarInput = document.getElementById('avatarUpload');
        const file = avatarInput.files[0];
        const avatarMessage = document.getElementById('avatarMessage');

        if (!file) {
            avatarMessage.textContent = 'Wybierz plik!';
            avatarMessage.className = 'avatar-message error';
            return;
        }

        // Walidacja rozmiaru pliku (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            avatarMessage.textContent = 'Plik jest za duży! Maksymalny rozmiar to 5MB.';
            avatarMessage.className = 'avatar-message error';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`http://localhost:8082/api/profil/upload-avatar/${userId}`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Błąd podczas przesyłania avatara');
        }

        const message = await response.text();
        avatarMessage.textContent = message;
        avatarMessage.className = 'avatar-message success';
        
        // Odśwież avatar po przesłaniu
        await fetchAvatar(userId);

        // Wyczyść komunikat po 5 sekundach
        setTimeout(() => {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }, 5000);
    } catch (error) {
        console.error('Błąd:', error);
        const avatarMessage = document.getElementById('avatarMessage');
        avatarMessage.textContent = error.message || 'Błąd podczas przesyłania avatara!';
        avatarMessage.className = 'avatar-message error';
        
        // Wyczyść komunikat po 5 sekundach
        setTimeout(() => {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }, 5000);
    }
}

// Funkcja do usuwania avatara
async function removeAvatar() {
    try {
        const userId = getUserId();
        if (!userId) {
            showGlobalError('Nie jesteś zalogowany!');
            return;
        }

        const avatarMessage = document.getElementById('avatarMessage');
        
        const response = await fetch(`http://localhost:8082/api/profil/remove-avatar/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Błąd podczas usuwania avatara');
        }

        const message = await response.text();
        avatarMessage.textContent = message;
        avatarMessage.className = 'avatar-message success';
        
        const avatarImage = document.getElementById('avatarImage');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        if (avatarImage && avatarPlaceholder) {
            avatarImage.src = '';
            avatarImage.style.display = 'none';
            avatarPlaceholder.style.display = 'block';
        }

        // Wyczyść komunikat po 5 sekundach
        setTimeout(() => {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }, 5000);
    } catch (error) {
        console.error('Błąd:', error);
        const avatarMessage = document.getElementById('avatarMessage');
        avatarMessage.textContent = error.message || 'Błąd podczas usuwania avatara!';
        avatarMessage.className = 'avatar-message error';
        
        // Wyczyść komunikat po 5 sekundach
        setTimeout(() => {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }, 5000);
    }
}

// Funkcja do podglądu avatara przed przesłaniem
function previewAvatar(event) {
    const avatarImage = document.getElementById('avatarImage');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    const file = event.target.files[0];

    if (file) {
        const url = URL.createObjectURL(file);
        avatarImage.src = url;
        avatarImage.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    }
}

// Funkcja do ustawiania akcji avatara
function setupAvatarActions() {
    const avatarUploadInput = document.getElementById('avatarUpload');
    const removeAvatarBtn = document.getElementById('removeAvatar');

    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', previewAvatar);
        avatarUploadInput.addEventListener('change', uploadAvatar); // Automatyczne przesyłanie po wybraniu pliku
    }

    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', removeAvatar);
    }
}

//funkcja odpowiedzialna za znalezienie przełącznika i podpięcie logiki do klickniecia motywu
function setupThemeToggle() {
    try {
        const themeToggle = document.getElementById('themeToggle');
        
        if (!themeToggle) {
            console.warn("Przełącznik motywu nie znaleziony");
            return;
        }

        // Inicjalizacja motywu
        initTheme(themeToggle);
        
        // Nasłuchiwanie kliknięcia
        themeToggle.addEventListener('click', toggleTheme);
    } catch (error) {
        console.error('Błąd podczas inicjalizacji przełącznika motywu:', error);
    }
}

//rejestracja
function setupRegistrationForm() {
    try {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return; // Wyjście jeśli formularz nie istnieje

        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Walidacja pól formularza
            if (!validateRegistrationForm()) {
                return;
            }

            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                secondName: document.getElementById('secondName').value.trim(),
                login: document.getElementById('login').value.trim(),
                passwd: document.getElementById('passwd').value,
            };

            try {
                // Pokazanie stanu ładowania
                const submitButton = registerForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Rejestruję...';
                submitButton.disabled = true;

                const response = await fetch('http://localhost:8082/api/saveData', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    document.getElementById('success').innerText = 'Rejestracja udana! Za chwilę zostaniesz przekierowany...';
                    registerForm.reset();
                    
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Błąd serwera: ${response.status}`);
                }
            } catch (error) {
                console.error('Błąd podczas rejestracji:', error);
                showFormError('registerForm', error.message || 'Błąd podczas rejestracji. Proszę spróbować jeszcze raz.');
            } finally {
                // Przywróć przycisk
                const submitButton = registerForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            }
        });
    } catch (error) {
        console.error('Błąd podczas inicjalizacji formularza rejestracji:', error);
    }
}

//logowanie
function setupLoginForm() {
    try {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // ✅ UKRYJ POPRZEDNIE BŁĘDY NA POCZĄTKU
            const errorDiv = document.getElementById('error');
            const successDiv = document.getElementById('success');
            
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.className = 'error'; // USUŃ KLASĘ 'show'
            }
            if (successDiv) successDiv.textContent = '';

            // Pokaż stan ładowania
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Logowanie...';
            submitButton.disabled = true;

            const loginData = {
                login: document.getElementById('login').value.trim(),
                passwd: document.getElementById('passwd').value
            };

            try {
                console.log('Wysyłam:', loginData);
                
                const response = await fetch('http://localhost:8082/api/checkLogin', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                console.log('Status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`Błąd serwera: ${response.status}`);
                }

                const data = await response.json();
                console.log('Otrzymano:', data);

                if (data.valid === true) {
                    const userData = {
                        id: data.userId,
                        login: data.login,
                        firstName: data.firstName,
                        secondName: data.secondName,
                        rola: data.rola
                    };
                    
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    if (successDiv) {
                        successDiv.textContent = 'Logowanie udane! Przekierowujemy...';
                    }
                    
                    setTimeout(() => {
                        window.location.href = 'user_main.html';
                    }, 1500);
                    
                } else {
                    throw new Error(data.message || 'Nieprawidłowy login lub hasło');
                }
            } catch (error) {
                console.error('Błąd podczas logowania:', error);
                if (errorDiv) {
                    errorDiv.textContent = error.message;
                    errorDiv.className = 'error show'; // ✅ DODAJ KLASĘ 'show'
                    
                    // ✅ UKRYJ BŁĄD PO 5 SEKUNDACH (opcjonalnie)
                    setTimeout(() => {
                        errorDiv.className = 'error';
                    }, 5000);
                }
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    } catch (error) {
        console.error('Błąd podczas inicjalizacji formularza logowania:', error);
    }
}

//strona użytkownika
function setupUserDashboard() {
    try {
        const userMain = document.getElementById('userGreeting');
        const userNameElement = document.getElementById('userName');
        
        // Jeśli nie ma elementów strony głównej, sprawdź czy jesteśmy na profilu
        if (!userMain && !userNameElement) return;
        
        // Pobierz dane użytkownika z localStorage
        let userData = {};
        try {
            const storedData = localStorage.getItem('userData');
            if (storedData) {
                userData = JSON.parse(storedData);
                console.log('✅ Znaleziono userData:', userData);
                
                // Aktualizuj powitanie na stronie głównej
                if (userMain) {
                    userMain.textContent = userData.firstName || userData.login || 'Użytkowniku';
                }
                
                // Aktualizuj nazwę w nagłówku (działa na wszystkich stronach)
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

        // Obsługa wylogowania (działa na wszystkich stronach)
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
        
        // Ładuj ostatnią aktywność tylko na stronie głównej
        if (userMain) {
            loadRecentActivity();
        }
        
    } catch (error) {
        console.error('Błąd podczas inicjalizacji dashboardu użytkownika:', error);
        window.location.href = 'login.html';
    }
}

//funkcja do inicjalizacji strony profilu
function setupProfilePage() {
    try {
        // Sprawdź czy jesteśmy na stronie profilu
        const profileForm = document.getElementById('profileForm');
        if (!profileForm) return; // Jeśli nie ma formularza profilu, wyjdź
        
        console.log('Inicjalizacja strony profilu...');
        
        // Załaduj dane użytkownika
        loadUserProfileData();
        
        // Inicjalizacja akcji avatara
        setupAvatarActions();

        // Zamiast tego dodaj niezależne przyciski zapisu
        setupIndependentSaveButtons();
        
        // Obsługa przycisku anuluj
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                // Przywróć oryginalne dane z localStorage
                loadUserProfileData();
            });
        }
        
    } catch (error) {
        console.error('Błąd podczas inicjalizacji strony profilu:', error);
    }
}

// LICZNIK ZNAKÓW DLA OPISU
function setupDescriptionCounter() {
    const textarea = document.getElementById('userDescription');
    if (!textarea) return;

    // Stwórz licznik
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.textContent = '0/500 znaków';
    textarea.parentNode.appendChild(counter);

    // Aktualizuj licznik
    textarea.addEventListener('input', function() {
        const length = this.value.length;
        counter.textContent = `${length}/500 znaków`;
        
        if (length > 450) {
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning');
        }
    });
}

// Walidacja siły hasła w czasie rzeczywistym
function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', validatePasswordStrength);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Obsługa przełącznika motywu (działa na każdej stronie)
        setupThemeToggle();
        
        // Obsługa formularza rejestracji 
        setupRegistrationForm();

        // Obsługa formularza logowania
        setupLoginForm();

        // Inicjalizuje i zarządza panelem użytkownika po zalogowaniu na stronie
        setupUserDashboard();

        //do profilu
        setupProfilePage();

        // Lyicznik znaków
        setupDescriptionCounter();
        
        // Walidacja haseł w czasie rzeczywistym
        setupPasswordValidation();
    } catch (error) {
        console.error('Błąd podczas inicjalizacji aplikacji:', error);
        showGlobalError('Wystąpił błąd podczas ładowania aplikacji. Proszę odświeżyć stronę.');
    }
});

// Funkcja wyświetlająca globalne błędy
function showGlobalError(message, type = 'error') {
    const notificationDiv = document.createElement('div');
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ed573' : '#ff4757'};
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    notificationDiv.textContent = message;
    document.body.appendChild(notificationDiv);

    setTimeout(() => {
        notificationDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            notificationDiv.remove();
        }, 300);
    }, 5000);
}

// Funkcja wyświetlająca błędy formularza
function showFormError(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Usuń poprzednie błędy
    const existingError = form.querySelector('.form-error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.style.cssText = `
        color: #ff4757;
        background: rgba(255, 71, 87, 0.1);
        padding: 10px;
        border-radius: 6px;
        margin: 10px 0;
        border-left: 4px solid #ff4757;
    `;
    errorDiv.textContent = message;
    
    form.insertBefore(errorDiv, form.firstChild);
}

//inicjalizację motywu przy starcie
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

//obsługa kliknięcia
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

// Walidacja formularza rejestracji
function validateRegistrationForm() {
    const firstName = document.getElementById('firstName').value.trim();
    const secondName = document.getElementById('secondName').value.trim();
    const login = document.getElementById('login').value.trim();
    const passwd = document.getElementById('passwd').value;

    // Usuń poprzednie błędy walidacji
    const existingErrors = document.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());

    let isValid = true;

    if (!firstName) {
        showFieldError('firstName', 'Imię jest wymagane');
        isValid = false;
    }

    if (!secondName) {
        showFieldError('secondName', 'Nazwisko jest wymagane');
        isValid = false;
    }

    if (!login) {
        showFieldError('login', 'Login jest wymagany');
        isValid = false;
    } else if (login.length < 3) {
        showFieldError('login', 'Login musi mieć co najmniej 3 znaki');
        isValid = false;
    }

    if (!passwd) {
        showFieldError('passwd', 'Hasło jest wymagane');
        isValid = false;
    } else if (passwd.length < 6) {
        showFieldError('passwd', 'Hasło musi mieć co najmniej 6 znaków');
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Usuń poprzedni błąd dla tego pola
    const existingError = field.parentNode.querySelector('.validation-error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = `
        color: #ff4757;
        font-size: 0.8rem;
        margin-top: 5px;
    `;
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#ff4757';
}

//aktywności
function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        // Tutaj możesz dodać pobieranie aktywności z backendu
        const activities = [
            { icon: 'fa-check-circle', text: 'Ukończono lekcję podstaw PHP', time: '2 godziny temu' },
            { icon: 'fa-trophy', text: 'Osiągnięto nowy poziom', time: '1 dzień temu' },
            { icon: 'fa-task', text: 'Rozwiązano zadanie z pętli', time: '2 dni temu' }
        ];
        
        // Wyczyść istniejące aktywności (opcjonalnie)
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

// ==================== OBSŁUGA FORMULARZA PROFILU ====================

// Inicjalizacja niezależnych przycisków zapisu
function setupIndependentSaveButtons() {
    // Zapisz opis
    const saveDescriptionBtn = document.getElementById('saveDescriptionBtn');
    if (saveDescriptionBtn) {
        saveDescriptionBtn.addEventListener('click', saveUserDescription);
    }
    
    // Zapisz dane osobowe
    const savePersonalDataBtn = document.getElementById('savePersonalDataBtn');
    if (savePersonalDataBtn) {
        savePersonalDataBtn.addEventListener('click', savePersonalData);
    }
    
    // Zmień hasło
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', changePassword);
    }
}

//ZAPISZ OPIS UŻYTKOWNIKA
async function saveUserDescription() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userId = userData.id;
        
        if (!userId) {
            showGlobalError('Nie jesteś zalogowany!');
            return;
        }
        
        const description = document.getElementById('userDescription').value.trim();
        
        if (description.length > 500) {
            showGlobalError('Opis może mieć maksymalnie 500 znaków');
            return;
        }

        // Pokaż loader
        const saveBtn = document.getElementById('saveDescriptionBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';
        saveBtn.disabled = true;

        const response = await fetch(`http://localhost:8082/api/profil/update-description/${userId}?description=${encodeURIComponent(description)}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showGlobalError('Opis zapisany pomyślnie!', 'success');
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Błąd podczas zapisywania opisu');
        }
    } catch (error) {
        console.error('Błąd podczas zapisywania opisu:', error);
        showGlobalError(error.message || 'Błąd podczas zapisywania opisu');
    } finally {
        // Przywróć przycisk
        const saveBtn = document.getElementById('saveDescriptionBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Zapisz opis';
            saveBtn.disabled = false;
        }
    }
}

// Zapisz dane osobowe (imię, nazwisko, login)
async function savePersonalData() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userId = userData.id;
        
        if (!userId) {
            showGlobalError('Nie jesteś zalogowany!');
            return;
        }

        const personalData = {
            firstName: document.getElementById('firstName').value.trim(),
            secondName: document.getElementById('secondName').value.trim(),
            login: document.getElementById('login').value.trim()
        };

        // Walidacja
        if (!personalData.firstName) {
            showFieldError('firstName', 'Imię jest wymagane');
            return;
        }
        
        if (!personalData.secondName) {
            showFieldError('secondName', 'Nazwisko jest wymagane');
            return;
        }
        
        if (!personalData.login) {
            showFieldError('login', 'Login jest wymagany');
            return;
        } else if (personalData.login.length < 3) {
            showFieldError('login', 'Login musi mieć co najmniej 3 znaki');
            return;
        }

        // Pokaż loader
        const saveBtn = document.getElementById('savePersonalDataBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';
        saveBtn.disabled = true;

        // Wyślij dane
        const response = await fetch(`http://localhost:8082/api/profil/update-personal/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(personalData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Błąd podczas zapisywania danych osobowych');
        }

        // Aktualizuj dane w localStorage
        const updatedUserData = {
            ...userData,
            firstName: personalData.firstName,
            secondName: personalData.secondName,
            login: personalData.login
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Aktualizuj nagłówek
        const userNameElement = document.getElementById('userName');
        const profileUserName = document.getElementById('profileUserName');
        
        if (userNameElement) {
            userNameElement.textContent = personalData.firstName || userData.login;
        }
        if (profileUserName) {
            profileUserName.textContent = `${personalData.firstName} ${personalData.secondName}`;
        }

        showGlobalError('Dane osobowe zapisane pomyślnie!', 'success');

    } catch (error) {
        console.error('Błąd podczas zapisywania danych osobowych:', error);
        showGlobalError(error.message || 'Błąd podczas zapisywania danych');
    } finally {
        // Przywróć przycisk
        const saveBtn = document.getElementById('savePersonalDataBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Zapisz dane osobowe';
            saveBtn.disabled = false;
        }
    }
}

// Zmiana hasła
async function changePassword() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userId = userData.id;
        
        if (!userId) {
            showGlobalError('Nie jesteś zalogowany!');
            return;
        }

        const passwordData = {
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: document.getElementById('newPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };

        // Walidacja
        if (!passwordData.currentPassword) {
            showFieldError('currentPassword', 'Obecne hasło jest wymagane');
            return;
        }
        
        if (!passwordData.newPassword) {
            showFieldError('newPassword', 'Nowe hasło jest wymagane');
            return;
        } else if (passwordData.newPassword.length < 6) {
            showFieldError('newPassword', 'Nowe hasło musi mieć co najmniej 6 znaków');
            return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showFieldError('confirmPassword', 'Hasła nie są identyczne');
            return;
        }

        // Pokaż loader
        const saveBtn = document.getElementById('savePasswordBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zmieniam...';
        saveBtn.disabled = true;

        // Wyślij dane
        const response = await fetch(`http://localhost:8082/api/profil/update-password/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            },
            body: JSON.stringify({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })
        });

        // POPRAWIONE: Obsługa odpowiedzi tekstowej zamiast JSON
        const responseText = await response.text();
        
        if (response.ok) {
            // Sukces
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            showGlobalError('Hasło zostało zmienione pomyślnie!', 'success');
        } else {
            // Błąd - użyj tekstu odpowiedzi
            throw new Error(responseText || 'Błąd podczas zmiany hasła');
        }

    } catch (error) {
        console.error('Błąd podczas zmiany hasła:', error);
        showGlobalError(error.message || 'Błąd podczas zmiany hasła');
    } finally {
        // Przywróć przycisk
        const saveBtn = document.getElementById('savePasswordBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Zmień hasło';
            saveBtn.disabled = false;
        }
    }
}

// ŁADUJ DANE PROFILU
async function loadUserProfileData() {
    try {
        const userData = getUserDataFromStorage();
        const userId = userData.id;
        
        if (!userId) {
            handleMissingUserId();
            return;
        }

        console.log('Pobieranie danych profilu dla ID:', userId);
        
        const response = await fetchProfileData(userId);
        
        if (response.ok) {
            await handleSuccessfulProfileResponse(response, userData);
        } else if (response.status === 404) {
            console.warn('Profil nie znaleziony, tworzenie nowego...');
            await createUserProfile(userId);
            fillProfileFormWithData(userData, {});
        } else {
            console.error('Błąd serwera:', response.status);
            fillProfileFormWithData(userData, {});
        }

        // Pobierz avatar po załadowaniu danych profilu
        await fetchAvatar(userId);
    } catch (error) {
        console.error('Błąd podczas ładowania danych profilu:', error);
        const userData = getUserDataFromStorage();
        fillProfileFormWithData(userData, {});
        showGlobalError('Błąd połączenia, używamy danych lokalnych');

        // Spróbuj pobrać avatar mimo błędu profilu
        const userId = getUserId();
        if (userId) {
            await fetchAvatar(userId);
        }
    }
}

// Funkcja do tworzenia profilu
async function createUserProfile(userId) {
    try {
        const response = await fetch(`http://localhost:8082/api/profil/create/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        if (response.ok) {
            showGlobalError('Profil został utworzony', 'success');
        } else {
            throw new Error('Nie udało się utworzyć profilu');
        }
    } catch (error) {
        console.error('Błąd tworzenia profilu:', error);
        showGlobalError('Utwórz profil ręcznie w ustawieniach');
    }
}

// POMOCNICZE FUNKCJE
function getUserDataFromStorage() {
    return JSON.parse(localStorage.getItem('userData') || '{}');
}

function handleMissingUserId() {
    console.error('Brak ID użytkownika w localStorage');
    showGlobalError('Nie jesteś zalogowany');
}

async function fetchProfileData(userId) {
    return await fetch(`http://localhost:8082/api/profil/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    });
}

async function handleSuccessfulProfileResponse(response, userData) {
    const profil = await response.json();
    console.log('Otrzymane dane profilu:', profil);
    
    fillProfileFormWithData(userData, profil);
    clearPasswordFields();
}

function fillProfileFormWithData(userData, profilData) {
    // Podstawowe dane użytkownika
    setFormValue('firstName', userData.firstName);
    setFormValue('secondName', userData.secondName);
    setFormValue('login', userData.login);
    
    // Opis użytkownika
    const descriptionTextarea = document.getElementById('userDescription');
    if (descriptionTextarea && profilData.opisUser !== undefined) {
        descriptionTextarea.value = profilData.opisUser || '';
        updateCharCounter(descriptionTextarea.value.length);
    }
    
    // Aktualizuj nagłówek profilu
    updateProfileHeader(userData);
}

function setFormValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value || '';
    }
}

function updateCharCounter(length) {
    const counter = document.querySelector('.char-counter');
    if (counter) {
        counter.textContent = `${length}/500 znaków`;
        counter.classList.toggle('warning', length > 450);
    }
}

function updateProfileHeader(userData) {
    setElementText('profileUserName', `${userData.firstName} ${userData.secondName}`);
    setElementText('profileUserRole', `Rola: ${userData.rola || 'Użytkownik'}`);
}

function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

function clearPasswordFields() {
    setFormValue('currentPassword', '');
    setFormValue('newPassword', '');
    setFormValue('confirmPassword', '');
}

//----------walidacja haseł w czasie rzeczywistym 
function validatePasswordStrength() {
    const password = this.value;
    const strengthMeter = document.querySelector('.strength-meter');
    const feedback = document.querySelector('.password-feedback');
    
    if (!password) {
        if (strengthMeter) strengthMeter.style.width = '0%';
        if (feedback) feedback.textContent = '';
        return;
    }
    
    // Prosta logika sprawdzania siły hasła
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    if (strengthMeter) {
        strengthMeter.style.width = `${strength}%`;
        
        if (strength < 50) {
            strengthMeter.style.backgroundColor = '#ff4757';
            if (feedback) {
                feedback.textContent = 'Słabe hasło';
                feedback.style.color = '#ff4757';
            }
        } else if (strength < 75) {
            strengthMeter.style.backgroundColor = '#ffa502';
            if (feedback) {
                feedback.textContent = 'Średnie hasło';
                feedback.style.color = '#ffa502';
            }
        } else {
            strengthMeter.style.backgroundColor = '#2ed573';
            if (feedback) {
                feedback.textContent = 'Silne hasło';
                feedback.style.color = '#2ed573';
            }
        }
    }
}

function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = this.value;
    const feedback = document.getElementById('passwordMatchFeedback');
    
    if (!feedback) return;
    
    if (!confirmPassword) {
        feedback.textContent = '';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        feedback.textContent = 'Hasła nie są identyczne';
        feedback.style.color = '#ff4757';
    } else {
        feedback.textContent = 'Hasła są identyczne';
        feedback.style.color = '#2ed573';
    }
}
//----------