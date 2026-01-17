import { showGlobalError, showFormError, showFieldError } from './utils.js';

let currentEditId = null;

export function setupCourseCreation() {
    try {
        const addCourseForm = document.getElementById('addCourseForm');
        const courseDescription = document.getElementById('courseDescription');
        const charCounter = document.querySelector('.char-counter');
        
        if (!addCourseForm) return;

        // Inicjalizacja licznika znaków
        if (courseDescription && charCounter) {
            courseDescription.addEventListener('input', function() {
                const length = this.value.length;
                charCounter.textContent = `${length}/1000 znaków`;
                
                if (length > 950) {
                    charCounter.classList.add('warning');
                } else {
                    charCounter.classList.remove('warning');
                }
            });
        }

        // Obsługa wysłania formularza
        addCourseForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Walidacja formularza
            if (!validateCourseForm()) {
                return;
            }

            const formData = {
                tytul: document.getElementById('courseTitle').value.trim(),
                tresc: document.getElementById('courseDescription').value.trim(),
                linkWideo: document.getElementById('youtubeLink').value.trim()
            };

            try {
                const submitButton = addCourseForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                
                if (currentEditId) {
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';
                } else {
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Dodawanie...';
                }
                
                submitButton.disabled = true;

                let response;
                if (currentEditId) {
                    // Edycja istniejącego kursu
                    response = await fetch(`http://localhost:8082/api/kurs/update/${currentEditId}`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });
                } else {
                    // Dodawanie nowego kursu
                    response = await fetch('http://localhost:8082/api/kurs/create', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });
                }

                if (response.ok) {
                    const savedCourse = await response.json();
                    
                    if (currentEditId) {
                        showFormSuccess('Kurs został pomyślnie zaktualizowany!');
                    } else {
                        showFormSuccess('Kurs został pomyślnie dodany!');
                    }
                    
                    resetForm();
                    loadAdminCourses();
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Błąd serwera: ${response.status}`);
                }
            } catch (error) {
                console.error('Błąd podczas zapisywania kursu:', error);
                showFormError('addCourseForm', error.message || 'Błąd podczas zapisywania kursu. Proszę spróbować jeszcze raz.');
            } finally {
                const submitButton = addCourseForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.textContent = currentEditId ? 'Zapisz zmiany' : 'Dodaj Kurs';
                    submitButton.disabled = false;
                }
            }
        });

        // Inicjalizacja przycisku anulowania edycji
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', resetForm);
        }

        // Załaduj istniejące kursy
        loadAdminCourses();

    } catch (error) {
        console.error('Błąd podczas inicjalizacji formularza kursu:', error);
        showGlobalError('Błąd podczas ładowania formularza kursu');
    }
}

// Funkcja resetująca formularz
function resetForm() {
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.reset();
    }
    
    const submitButton = document.querySelector('#addCourseForm button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Dodaj Kurs';
    }
    
    const formTitle = document.querySelector('.card h2');
    if (formTitle) {
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Dodaj nowy kurs';
    }
    
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.style.display = 'none';
    }
    
    currentEditId = null;
    
    // Ukryj ewentualne komunikaty o błędach
    const existingErrors = document.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());
}

// Funkcja walidująca formularz kursu
function validateCourseForm() {
    const courseTitle = document.getElementById('courseTitle').value.trim();
    const youtubeLink = document.getElementById('youtubeLink').value.trim();
    
    const existingErrors = document.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());

    let isValid = true;

    if (!courseTitle) {
        showFieldError('courseTitle', 'Tytuł kursu jest wymagany');
        isValid = false;
    }

    if (youtubeLink && !isValidYouTubeLink(youtubeLink)) {
        showFieldError('youtubeLink', 'Podaj poprawny link YouTube lub pozostaw puste');
        isValid = false;
    }

    return isValid;
}

// Funkcja sprawdzająca poprawność linku YouTube
function isValidYouTubeLink(url) {
    if (!url) return true; // Pusty link jest teraz poprawny
    
    const patterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

// Funkcja ładująca listę kursów dla administratora
async function loadAdminCourses() {
    try {
        const coursesList = document.getElementById('adminCoursesList');
        if (!coursesList) return;

        coursesList.innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';

        const response = await fetch('http://localhost:8082/api/kurs/all');
        
        if (response.ok) {
            const courses = await response.json();
            renderCoursesList(courses);
        } else {
            throw new Error(`Błąd serwera: ${response.status}`);
        }
    } catch (error) {
        console.error('Błąd podczas ładowania kursów:', error);
        const coursesList = document.getElementById('adminCoursesList');
        if (coursesList) {
            coursesList.innerHTML = '<div class="error-message">Błąd podczas ładowania kursów</div>';
        }
    }
}

// Funkcja renderująca listę kursów
function renderCoursesList(courses) {
    const coursesList = document.getElementById('adminCoursesList');
    if (!coursesList) return;

    if (courses.length === 0) {
        coursesList.innerHTML = '<div class="empty-state">Brak dodanych kursów</div>';
        return;
    }

    coursesList.innerHTML = `
        <div class="courses-grid">
            ${courses.map(course => `
                <div class="course-card" data-course-id="${course.idKursu}">
                    <h3>${course.tytul}</h3>
                    <p class="course-description">${course.tresc || 'Brak opisu'}</p>
                    <div class="course-actions">
                        <button class="btn-edit" onclick="editCourse(${course.idKursu})">
                            <i class="fas fa-edit"></i> Edytuj
                        </button>
                        <button class="btn-delete" onclick="deleteCourse(${course.idKursu})">
                            <i class="fas fa-trash"></i> Usuń
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Funkcja pokazująca sukces
function showFormSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.style.cssText = `
        color: #2ed573;
        background: rgba(46, 213, 115, 0.1);
        padding: 10px;
        border-radius: 6px;
        margin: 10px 0;
        border-left: 4px solid #2ed573;
    `;
    successDiv.textContent = message;
    
    const form = document.getElementById('addCourseForm');
    if (form) {
        form.insertBefore(successDiv, form.firstChild);
        
        // Usuń komunikat po 5 sekundach
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}

// Funkcje globalne do użycia w onclick
window.editCourse = async function(courseId) {
    try {
        const response = await fetch(`http://localhost:8082/api/kurs/${courseId}`);
        if (response.ok) {
            const course = await response.json();
            
            // Wypełnij formularz danymi kursu
            document.getElementById('courseTitle').value = course.tytul;
            document.getElementById('courseDescription').value = course.tresc || '';
            document.getElementById('youtubeLink').value = course.linkWideo;
            
            // Zmień tryb na edycję
            currentEditId = courseId;
            
            const submitButton = document.querySelector('#addCourseForm button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Zapisz zmiany';
            }
            
            const formTitle = document.querySelector('.card h2');
            if (formTitle) {
                formTitle.innerHTML = '<i class="fas fa-edit"></i> Edytuj kurs';
            }
            
            const cancelEditBtn = document.getElementById('cancelEditBtn');
            if (cancelEditBtn) {
                cancelEditBtn.style.display = 'block';
            }
            
            // Przewiń do formularza
            document.querySelector('.course-form').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Błąd podczas edycji kursu:', error);
        showGlobalError('Błąd podczas ładowania kursu do edycji');
    }
};

window.deleteCourse = async function(courseId) {
    if (!confirm('Czy na pewno chcesz usunąć ten kurs?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8082/api/kurs/delete/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            showGlobalError('Kurs został usunięty', 'success');
            loadAdminCourses();
            
            if (currentEditId === courseId) {
                resetForm();
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Błąd serwera: ${response.status}`);
        }
    } catch (error) {
        console.error('Błąd podczas usuwania kursu:', error);
        showGlobalError(error.message || 'Błąd podczas usuwania kursu');
    }
};