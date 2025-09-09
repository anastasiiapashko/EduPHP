// courses.js - obsługa wyświetlania kursów i śledzenia postępów

import { showGlobalError, getUserDataFromStorage } from './utils.js';

let allCourses = [];
let userCourses = [];

export function setupCourses() {
    try {
        // Sprawdź czy jesteśmy na stronie kursów
        if (!window.location.pathname.includes('kurs.html')) {
            return;
        }

        // Inicjalizacja
        loadUserCourses();
        setupEventListeners();

    } catch (error) {
        console.error('Błąd podczas inicjalizacji kursów:', error);
        showGlobalError('Błąd podczas ładowania kursów');
    }
}

// Funkcja ładująca kursy użytkownika
async function loadUserCourses() {
    try {
        const userData = getUserDataFromStorage();
        if (!userData || !userData.id) {
            showGlobalError('Nie jesteś zalogowany!');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Pobierz wszystkie kursy
        const coursesResponse = await fetch('http://localhost:8082/api/kurs/all');
        if (coursesResponse.ok) {
            allCourses = await coursesResponse.json();
            
            // Pobierz kursy użytkownika z statusami
            const userCoursesResponse = await fetch(`http://localhost:8082/api/user-kurs/${userData.id}/kursy`);
            if (userCoursesResponse.ok) {
                userCourses = await userCoursesResponse.json();
                renderCoursesList();
                updateProgressSummary();
            } else {
                throw new Error('Błąd podczas ładowania postępów');
            }
        } else {
            throw new Error('Błąd podczas ładowania kursów');
        }
    } catch (error) {
        console.error('Błąd podczas ładowania kursów:', error);
        const coursesList = document.getElementById('coursesList');
        if (coursesList) {
            coursesList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Błąd podczas ładowania kursów. Spróbuj odświeżyć stronę.</p>
                </div>
            `;
        }
    }
}

// Funkcja renderująca listę kursów
function renderCoursesList() {
    const coursesList = document.getElementById('coursesList');
    if (!coursesList) return;

    if (allCourses.length === 0) {
        coursesList.innerHTML = '<div class="empty-state">Brak dostępnych kursów</div>';
        return;
    }

    coursesList.innerHTML = allCourses.map(course => {
        const userCourse = userCourses.find(uc => uc.idKursu === course.idKursu);
        const isCompleted = userCourse ? userCourse.ukonczony : false;
        
        return `
            <div class="course-item ${isCompleted ? 'completed' : ''}" data-course-id="${course.idKursu}">
                <div class="course-header">
                    <h3>${course.tytul}</h3>
                    <div class="course-actions">
                        <label class="completion-toggle">
                            <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                                onchange="toggleCourseCompletion(${course.idKursu}, this.checked)">
                            <span class="checkmark"></span>
                            <span class="toggle-label">${isCompleted ? 'Ukończony' : 'Oznacz jako ukończony'}</span>
                        </label>
                        <button class="toggle-details-btn" onclick="toggleCourseDetails(${course.idKursu})">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
                
                <div class="course-details" id="details-${course.idKursu}">
                    <div class="course-content">
                        <div class="course-description">
                            <h4>Opis kursu:</h4>
                            <p>${course.tresc || 'Brak opisu kursu.'}</p>
                        </div>
                        
                        <div class="course-video">
                            <h4>Materiał wideo:</h4>
                            <div class="video-container">
                                ${embedYouTubeVideo(course.linkWideo)}
                            </div>
                        </div>
                        
                        <div class="course-meta">
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                Dodano: ${new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Funkcja osadzająca wideo YouTube
function embedYouTubeVideo(url) {
    if (!url) return '<p>Brak materiału wideo</p>';
    
    // Ekstrakcja ID wideo z różnych formatów URL YouTube
    let videoId = '';
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
        /youtube\.com\/watch\?.*v=([^&?#]+)/,
        /youtu\.be\/([^&?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            videoId = match[1];
            break;
        }
    }
    
    if (videoId) {
        return `
            <iframe 
                width="100%" 
                height="400" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    }
    
    return `<p>Nieprawidłowy link YouTube: <a href="${url}" target="_blank">${url}</a></p>`;
}

// Funkcja aktualizująca podsumowanie postępów
function updateProgressSummary() {
    const completedCount = userCourses.filter(course => course.ukonczony).length;
    const totalCount = allCourses.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    document.getElementById('completedCount').textContent = `${completedCount}/${totalCount}`;
    document.getElementById('overallProgress').textContent = `${progressPercentage}%`;
}

// Funkcja obsługująca przełączanie widoczności szczegółów kursu
window.toggleCourseDetails = function(courseId) {
    const detailsElement = document.getElementById(`details-${courseId}`);
    const toggleBtn = document.querySelector(`[onclick="toggleCourseDetails(${courseId})"]`);
    
    if (detailsElement && toggleBtn) {
        const isVisible = detailsElement.style.display === 'block';
        detailsElement.style.display = isVisible ? 'none' : 'block';
        toggleBtn.innerHTML = isVisible ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
        
        // Dodaj/usuń klasę expanded
        const courseItem = detailsElement.closest('.course-item');
        if (courseItem) {
            courseItem.classList.toggle('expanded', !isVisible);
        }
    }
};

// Funkcja obsługująca zmianę statusu ukończenia kursu
window.toggleCourseCompletion = async function(courseId, isCompleted) {
    try {
        const userData = getUserDataFromStorage();
        if (!userData || !userData.id) {
            showGlobalError('Nie jesteś zalogowany!');
            return;
        }

        const response = await fetch(`http://localhost:8082/api/user-kurs/${userData.id}/${courseId}?ukonczony=${isCompleted}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Aktualizuj lokalny stan
            const courseIndex = userCourses.findIndex(uc => uc.idKursu === courseId);
            if (courseIndex !== -1) {
                userCourses[courseIndex].ukonczony = isCompleted;
            } else {
                userCourses.push({
                    idKursu: courseId,
                    ukonczony: isCompleted
                });
            }
            
            // Aktualizuj UI
            const courseItem = document.querySelector(`.course-item[data-course-id="${courseId}"]`);
            if (courseItem) {
                courseItem.classList.toggle('completed', isCompleted);
                
                
                const toggleLabel = courseItem.querySelector('.toggle-label');
                if (toggleLabel) {
                    toggleLabel.textContent = isCompleted ? 'Ukończony' : 'Oznacz jako ukończony';
                }
            }
            
            // Aktualizuj podsumowanie
            updateProgressSummary();
            
            showGlobalError(`Kurs ${isCompleted ? 'oznaczony jako ukończony' : 'wznowiony'}!`, 'success');
        } else {
            throw new Error('Błąd podczas aktualizacji statusu kursu');
        }
    } catch (error) {
        console.error('Błąd podczas zmiany statusu kursu:', error);
        showGlobalError('Błąd podczas zapisywania statusu kursu');
        
        // Przywróć poprzedni stan checkboxa
        const checkbox = document.querySelector(`input[onchange="toggleCourseCompletion(${courseId}, this.checked)"]`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
        }
    }
};

// Konfiguracja nasłuchiwaczy zdarzeń
function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        });
    }
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const theme = html.getAttribute('data-theme');
            html.setAttribute('data-theme', theme === 'light' ? 'dark' : 'light');
            themeToggle.innerHTML = theme === 'light' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
}