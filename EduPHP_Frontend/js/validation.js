function setupDescriptionCounter() {
    // Dla profilu użytkownika
    const userDescription = document.getElementById('userDescription');
    if (userDescription) {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.textContent = '0/500 znaków';
        userDescription.parentNode.appendChild(counter);

        userDescription.addEventListener('input', function() {
            const length = this.value.length;
            counter.textContent = `${length}/500 znaków`;
            
            if (length > 450) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }
        });
    }
}

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

function validatePasswordStrength() {
    const password = this.value;
    const strengthMeter = document.querySelector('.strength-meter');
    const feedback = document.querySelector('.password-feedback');
    
    if (!password) {
        if (strengthMeter) strengthMeter.style.width = '0%';
        if (feedback) feedback.textContent = '';
        return;
    }
    
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

export { setupDescriptionCounter, setupPasswordValidation };