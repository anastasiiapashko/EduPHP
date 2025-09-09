function getUserId() {
    const userData = getUserDataFromStorage();
    return userData.id || null;
}

function getUserDataFromStorage() {
    return JSON.parse(localStorage.getItem('userData') || '{}');
}

function handleMissingUserId() {
    console.error('Brak ID użytkownika w localStorage');
    showGlobalError('Nie jesteś zalogowany');
}

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

function showFormError(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;

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

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

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

function setFormValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value || '';
    }
}

function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
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

function clearPasswordFields() {
    setFormValue('currentPassword', '');
    setFormValue('newPassword', '');
    setFormValue('confirmPassword', '');
}

function validateRegistrationForm() {
    const firstName = document.getElementById('firstName').value.trim();
    const secondName = document.getElementById('secondName').value.trim();
    const login = document.getElementById('login').value.trim();
    const passwd = document.getElementById('passwd').value;

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

export { getUserId, getUserDataFromStorage, handleMissingUserId, showGlobalError, showFormError, showFieldError, setFormValue, setElementText, updateCharCounter, updateProfileHeader, clearPasswordFields, validateRegistrationForm };