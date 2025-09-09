import { showGlobalError, showFormError, validateRegistrationForm, showFieldError } from './utils.js';

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

            try {
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
                    errorDiv.className = 'error show';
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

export { setupRegistrationForm, setupLoginForm };