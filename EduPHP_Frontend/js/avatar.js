import { getUserId, showGlobalError } from './utils.js';

async function fetchAvatar(userId) {
    try {
        const avatarImage = document.getElementById('avatarImage');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const avatarMessage = document.getElementById('avatarMessage');

        if (!avatarImage || !avatarPlaceholder) {
            console.error('Brak elementów DOM: avatarImage lub avatarPlaceholder');
            return;
        }

        const response = await fetch(`http://localhost:8082/api/profil/avatar/${userId}?t=${new Date().getTime()}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'image/*'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn('Avatar nie znaleziony dla użytkownika:', userId);
                throw new Error('Brak avatara');
            }
            throw new Error(`Błąd serwera: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('Nieprawidłowy format odpowiedzi - oczekiwano obrazu');
        }

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
            throw new Error('Pusta odpowiedź z serwera');
        }

        const url = URL.createObjectURL(blob);
        avatarImage.src = url;
        avatarImage.style.display = 'block';
        avatarPlaceholder.style.display = 'none';

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
            avatarImage.src = '';
            avatarImage.style.display = 'none';
            avatarPlaceholder.style.display = 'block';
        }

        if (avatarMessage) {
            avatarMessage.textContent = 'Nie udało się załadować avatara';
            avatarMessage.className = 'avatar-message error';
            setTimeout(() => {
                avatarMessage.textContent = '';
                avatarMessage.className = 'avatar-message';
            }, 5000);
        }
    }
}

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
        
        await fetchAvatar(userId);

        setTimeout(() => {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }, 5000);
    } catch (error) {
        console.error('Błąd:', error);
        const avatarMessage = document.getElementById('avatarMessage');
        avatarMessage.textContent = error.message || 'Błąd podczas przesyłania avatara!';
        avatarMessage.className = 'avatar-message error';
        
        setTimeout(() => {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }, 5000);
    }
}

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

        setTimeout(() => {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }, 5000);
    } catch (error) {
        console.error('Błąd:', error);
        const avatarMessage = document.getElementById('avatarMessage');
        avatarMessage.textContent = error.message || 'Błąd podczas usuwania avatara!';
        avatarMessage.className = 'avatar-message error';
        
        setTimeout(() => {
            avatarMessage.textContent = '';
            avatarMessage.className = 'avatar-message';
        }, 5000);
    }
}

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

function setupAvatarActions() {
    const avatarUploadInput = document.getElementById('avatarUpload');
    const removeAvatarBtn = document.getElementById('removeAvatar');

    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', previewAvatar);
        avatarUploadInput.addEventListener('change', uploadAvatar);
    }

    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', removeAvatar);
    }
}

export { fetchAvatar, setupAvatarActions };