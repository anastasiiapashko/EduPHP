import { getUserId, getUserDataFromStorage, handleMissingUserId, showGlobalError, showFieldError, setFormValue, updateProfileHeader, clearPasswordFields, updateCharCounter } from './utils.js';
import { setupAvatarActions, fetchAvatar } from './avatar.js';

async function setupProfilePage() {
    try {
        const profileForm = document.getElementById('profileForm');
        if (!profileForm) return;
        
        console.log('Inicjalizacja strony profilu...');
        
        await loadUserProfileData();
        setupAvatarActions();
        setupIndependentSaveButtons();
        setupProfileDeletion(); // ✅ DODANE - obsługa usuwania profilu
        
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                loadUserProfileData();
            });
        }
        
    } catch (error) {
        console.error('Błąd podczas inicjalizacji strony profilu:', error);
    }
}

// ✅ DODANE - Funkcja obsługująca usuwanie profilu
function setupProfileDeletion() {
    const deleteProfileBtn = document.getElementById('deleteProfileBtn');
    const modal = document.getElementById('deleteConfirmationModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const passwordInput = document.getElementById('confirmPasswordInput');
    const passwordError = document.getElementById('passwordError');

    if (!deleteProfileBtn) return;

    // Otwórz modal
    deleteProfileBtn.addEventListener('click', () => {
        modal.classList.add('show');
        passwordInput.value = '';
        confirmDeleteBtn.disabled = true;
        passwordError.style.display = 'none';
    });

    // Zamknij modal
    cancelDeleteBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    // Walidacja hasła w czasie rzeczywistym
    passwordInput.addEventListener('input', function() {
        const password = this.value.trim();
        confirmDeleteBtn.disabled = password.length === 0;
        passwordError.style.display = 'none';
    });

    // Potwierdź usunięcie
    confirmDeleteBtn.addEventListener('click', async () => {
        await deleteUserProfile();
    });

    // Zamknij modal kliknięciem w tło
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// ✅ DODANE - Funkcja usuwająca profil użytkownika
async function deleteUserProfile() {
    const passwordInput = document.getElementById('confirmPasswordInput');
    const passwordError = document.getElementById('passwordError');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const modal = document.getElementById('deleteConfirmationModal');

    const password = passwordInput.value.trim();
    const userData = getUserDataFromStorage();
    
    if (!password) {
        showFieldError('confirmPasswordInput', 'Wprowadź hasło');
        return;
    }

    if (!userData || !userData.id) {
        showGlobalError('Nie jesteś zalogowany!');
        return;
    }

    try {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Usuwanie...';

        // Najpierw sprawdź hasło
        const loginCheck = await fetch('http://localhost:8082/api/checkLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: userData.login,
                passwd: password
            })
        });

        const loginResult = await loginCheck.json();

        if (!loginResult.valid) {
            passwordError.textContent = 'Nieprawidłowe hasło';
            passwordError.style.display = 'block';
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Tak, usuń profil';
            return;
        }

        // Jeśli hasło poprawne - usuń profil
        const response = await fetch(`http://localhost:8082/api/deleteUser/${userData.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.text();
            console.log('Profil usunięty:', result);
            
            showGlobalError('Profil został usunięty pomyślnie. Za chwilę nastąpi przekierowanie...', 'success');
            
            // Wyczyść localStorage i przekieruj
            setTimeout(() => {
                localStorage.removeItem('userData');
                localStorage.removeItem('authToken');
                window.location.href = 'index.html';
            }, 2000);
            
        } else {
            const errorText = await response.text();
            throw new Error(errorText);
        }

    } catch (error) {
        console.error('Błąd podczas usuwania profilu:', error);
        showGlobalError('Błąd podczas usuwania profilu: ' + error.message);
        
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Tak, usuń profil';
    } finally {
        modal.classList.remove('show');
    }
}

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

async function fetchProfileData(userId) {
    try {
        const response = await fetch(`http://localhost:8082/api/profil/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        // Sprawdź typ odpowiedzi przed parsowaniem
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Otrzymano nie-JSON odpowiedź:', contentType);
            throw new Error('Serwer zwrócił nieprawidłowy format odpowiedzi');
        }
        
        return response;
    } catch (error) {
        console.error('Błąd podczas pobierania danych profilu:', error);
        throw error;
    }
}

async function handleSuccessfulProfileResponse(response, userData) {
    const profil = await response.json();
    console.log('Otrzymane dane profilu:', profil);
    
    fillProfileFormWithData(userData, profil);
    clearPasswordFields();
}

function fillProfileFormWithData(userData, profilData) {
    setFormValue('firstName', userData.firstName);
    setFormValue('secondName', userData.secondName);
    setFormValue('login', userData.login);
    
    const descriptionTextarea = document.getElementById('userDescription');
    if (descriptionTextarea && profilData.opisUser !== undefined) {
        descriptionTextarea.value = profilData.opisUser || '';
        updateCharCounter(descriptionTextarea.value.length);
    }
    
    updateProfileHeader(userData);
}

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
        const saveBtn = document.getElementById('saveDescriptionBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Zapisz opis';
            saveBtn.disabled = false;
        }
    }
}

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

        const saveBtn = document.getElementById('savePersonalDataBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';
        saveBtn.disabled = true;

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

        const updatedUserData = {
            ...userData,
            firstName: personalData.firstName,
            secondName: personalData.secondName,
            login: personalData.login
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
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
        const saveBtn = document.getElementById('savePersonalDataBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Zapisz dane osobowe';
            saveBtn.disabled = false;
        }
    }
}

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

        const saveBtn = document.getElementById('savePasswordBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zmieniam...';
        saveBtn.disabled = true;

        console.log('Wysyłam dane zmiany hasła:', {
            userId,
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        });

        const response = await fetch(`http://localhost:8082/api/profil/update-password/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })
        });

        if (!response.ok) {
            let errorData = {};
            try {
                errorData = await response.json();
            } catch (jsonError) {
                console.error('Błąd parsowania odpowiedzi JSON:', jsonError);
            }
            console.error('Odpowiedź serwera:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            throw new Error(errorData.message || `Błąd zmiany hasła: ${response.status} ${response.statusText}`);
        }

        console.log('Hasło zmienione pomyślnie');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

        showGlobalError('Hasło zostało zmienione pomyślnie!', 'success');

    } catch (error) {
        console.error('Błąd podczas zmiany hasła:', error);
        showGlobalError(error.message || 'Nie udało się zmienić hasła. Spróbuj ponownie.');
    } finally {
        const saveBtn = document.getElementById('savePasswordBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Zmień hasło';
            saveBtn.disabled = false;
        }
    }
}

function setupIndependentSaveButtons() {
    const saveDescriptionBtn = document.getElementById('saveDescriptionBtn');
    if (saveDescriptionBtn) {
        saveDescriptionBtn.addEventListener('click', saveUserDescription);
    }
    
    const savePersonalDataBtn = document.getElementById('savePersonalDataBtn');
    if (savePersonalDataBtn) {
        savePersonalDataBtn.addEventListener('click', savePersonalData);
    }
    
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', changePassword);
    }
}

export { setupProfilePage };