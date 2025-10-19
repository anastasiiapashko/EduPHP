import { showFormError, validateRegistrationForm, showFieldError } from './utils.js';

function setupRegistrationForm() {
    try {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return;

        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            if (!validateRegistrationForm()) {
                return;
            }

            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                secondName: document.getElementById('secondName').value.trim(),
                login: document.getElementById('login').value.trim(),
                passwd: document.getElementById('passwd').value,
            };

            // ✅ PRZENIESIONY przed try - dostępny w całej funkcji
            const submitButton = registerForm.querySelector('button[type="submit"]');
            let originalText = submitButton.textContent; // ✅ użyj let zamiast const

            try {
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

                const responseData = await response.json(); // ✅ WAŻNE: parsuj odpowiedź

                if (response.ok) {
                    document.getElementById('success').innerText = 'Rejestracja udana! Za chwilę zostaniesz przekierowany...';
                    registerForm.reset();
                    
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    // ✅ Poprawna obsługa błędów z backendu
                    const errorMessage = responseData.message || `Błąd serwera: ${response.status}`;
                    throw new Error(errorMessage);
                }
            } catch (error) {
                console.error('Błąd podczas rejestracji:', error);
                showFormError('registerForm', error.message || 'Błąd podczas rejestracji. Proszę spróbować jeszcze raz.');
            } finally {
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

function setupLoginForm() {
    try {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const errorDiv = document.getElementById('error');
            const successDiv = document.getElementById('success');
            
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.className = 'error';
            }
            if (successDiv) successDiv.textContent = '';

            // ✅ PRZENIESIONY przed try - dostępny w całej funkcji
            const submitButton = loginForm.querySelector('button[type="submit"]');
            let originalText = submitButton.textContent; // ✅ użyj let zamiast const

            try {
                submitButton.textContent = 'Logowanie...';
                submitButton.disabled = true;

                const loginData = {
                    login: document.getElementById('login').value.trim(),
                    passwd: document.getElementById('passwd').value
                };

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
                    errorDiv.className = 'error show';
                    setTimeout(() => {
                        errorDiv.className = 'error';
                    }, 5000);
                }
            } finally {
                if (submitButton) {
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            }
        });
    } catch (error) {
        console.error('Błąd podczas inicjalizacji formularza logowania:', error);
    }
}

function checkAuth() {
    try {
        const userData = localStorage.getItem('userData');
        if (!userData) return false;
        
        const user = JSON.parse(userData);
        return !!(user && user.id); // Zwraca true jeśli użytkownik ma ID
    } catch (error) {
        console.error('Błąd podczas sprawdzania autoryzacji:', error);
        return false;
    }
} 

function getCurrentUserId() {
    try {
        const userData = localStorage.getItem('userData');
        if (!userData) return null;
        
        const user = JSON.parse(userData);
        return user ? user.id : null;
    } catch (error) {
        console.error('Błąd podczas pobierania ID użytkownika:', error);
        return null;
    }
}

 function getCurrentUser() {
    try {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
        return null;
    }
}

function logout(){
    localStorage.removeItem('userData');
            window.location.href = 'index.html';
}
export {logout, setupRegistrationForm, setupLoginForm, getCurrentUser, getCurrentUserId, checkAuth };