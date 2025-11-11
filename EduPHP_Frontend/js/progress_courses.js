// progress_courses.js - tylko dodawaj progres do istniejących kursów
import { showGlobalError, getUserId } from './utils.js';

class ProgressCoursesManager {
    constructor() {
        this.userId = getUserId();
        this.courses = [];
        this.useMockData = false; // ✅ WYŁĄCZ MOCK DANE
        this.init();
    }

    async init() {
        if (!this.userId) {
            showGlobalError('Nie jesteś zalogowany!');
            return;
        }

        console.log('🔄 Inicjalizacja progresu kursów dla user:', this.userId);
        
        // Poczekaj aż courses.js załaduje i wyrenderuje kursy
        await this.waitForCoursesToLoad();
        
        // Załaduj dane progresu
        await this.loadCoursesWithProgress();
        
        // Zintegruj progres z istniejącymi kursami
        this.integrateProgressIntoExistingCourses();
        
        // Zaktualizuj podsumowanie
        this.updateProgressSummary();

        // ✅ DODAJ: Nasłuchiwacz na zmiany (np. po rozwiązaniu zadania)
        this.setupProgressListener();
    }

    // ✅ DODAJ: Nasłuchiwacz na zmiany progresu
    setupProgressListener() {
        // Możesz odświeżać progres co jakiś czas lub po konkretnych akcjach
        document.addEventListener('taskCompleted', () => {
            console.log('📢 Zadanie ukończone - odświeżam progres');
            this.refreshProgress();
        });

        // Odśwież progres co 30 sekund (opcjonalnie)
        setInterval(() => {
            this.refreshProgress();
        }, 30000);
    }

    // ✅ DODAJ: Funkcja odświeżania progresu
    async refreshProgress() {
        console.log('🔄 Odświeżanie progresu...');
        await this.loadCoursesWithProgress();
        this.integrateProgressIntoExistingCourses();
        this.updateProgressSummary();
    }

    // Czekaj aż courses.js załaduje kursy
    async waitForCoursesToLoad() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 sekund maksymalnie
            
            const checkCourses = () => {
                const coursesList = document.getElementById('coursesList');
                const courseItems = coursesList?.querySelectorAll('.course-item');
                
                if (courseItems && courseItems.length > 0) {
                    console.log(`✅ Znaleziono ${courseItems.length} kursów - courses.js załadowane`);
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    console.log(`⏳ Oczekiwanie na courses.js... (${attempts}/${maxAttempts})`);
                    setTimeout(checkCourses, 100);
                } else {
                    console.warn('⚠️ Timeout - kontynuuję bez kursów');
                    resolve();
                }
            };
            checkCourses();
        });
    }

    async loadCoursesWithProgress() {
        try {
            console.log('📥 Ładowanie kursów z progresem...');
            
            const response = await fetch('http://localhost:8082/api/kurs/all', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.courses = await response.json();
                console.log(`📚 Załadowano ${this.courses.length} kursów`);
                
                // ✅ ZAWSZE ładuj prawdziwy progres z backendu
                await this.loadCoursesProgress();
                
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Błąd ładowania kursów:', error);
            showGlobalError('Błąd ładowania progresu kursów');
            // W przypadku błędu ustaw progres na 0
            this.courses.forEach(course => course.progress = 0);
        }
    }

    async loadCoursesProgress() {
        console.log('📊 Ładowanie progresu dla każdego kursu...');
        
        const progressPromises = this.courses.map(async (course) => {
            try {
                const response = await fetch(
                    `http://localhost:8082/api/kurs/${course.idKursu}/user/${this.userId}/progress`,
                    { 
                        credentials: 'include',
                        headers: {
                            'Cache-Control': 'no-cache' // ✅ Zapobiegaj cache'owaniu
                        }
                    }
                );
                
                if (response.ok) {
                    const progress = await response.json();
                    console.log(`📈 Kurs ${course.idKursu} (${course.tytul}): ${progress}%`);
                    return { ...course, progress };
                } else {
                    console.warn(`⚠️ Błąd progresu dla kursu ${course.idKursu}: HTTP ${response.status}`);
                    return { ...course, progress: 0 };
                }
            } catch (error) {
                console.error(`❌ Błąd pobierania progresu kursu ${course.idKursu}:`, error);
                return { ...course, progress: 0 };
            }
        });

        // Poczekaj na wszystkie zapytania
        this.courses = await Promise.all(progressPromises);
        console.log('✅ Zakończono ładowanie progresu wszystkich kursów');
    }

    integrateProgressIntoExistingCourses() {
        const coursesList = document.getElementById('coursesList');
        if (!coursesList) {
            console.error('❌ Nie znaleziono coursesList!');
            return;
        }

        const existingCourseItems = coursesList.querySelectorAll('.course-item');
        
        console.log(`🔄 Integracja progresu z ${existingCourseItems.length} istniejącymi kursami`);
        
        existingCourseItems.forEach(courseItem => {
            const courseId = parseInt(courseItem.dataset.courseId);
            const course = this.courses.find(c => c.idKursu === courseId);
            
            if (course) {
                this.addProgressToCourseItem(courseItem, course);
            } else {
                console.warn(`⚠️ Nie znaleziono danych progresu dla kursu ${courseId}`);
            }
        });
    }

    addProgressToCourseItem(courseItem, course) {
        // Usuń istniejący progres (jeśli był dodany wcześniej)
        const existingProgress = courseItem.querySelector('.course-progress');
        if (existingProgress) {
            existingProgress.remove();
        }

        // Usuń istniejącą odznakę ukończenia
        const existingBadge = courseItem.querySelector('.course-completed-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Zaokrąglij progres dla lepszego wyświetlania
        const roundedProgress = Math.round(course.progress);

        // Stwórz nowy element progresu
        const progressHTML = `
            <div class="course-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${roundedProgress}%"></div>
                </div>
                <span class="progress-text">${roundedProgress}%</span>
            </div>
        `;

        // Dodaj progres po tytule kursu
        const courseHeader = courseItem.querySelector('.course-header');
        const courseTitle = courseHeader.querySelector('h3');
        
        if (courseTitle) {
            courseTitle.insertAdjacentHTML('afterend', progressHTML);
        }

        // Dodaj odznakę ukończenia jeśli 100%
        if (roundedProgress === 100) {
            const badgeHTML = `
                <div class="course-completed-badge">
                    <i class="fas fa-check-circle"></i> Ukończono!
                </div>
            `;
            
            const courseActions = courseItem.querySelector('.course-actions');
            if (courseActions) {
                courseActions.insertAdjacentHTML('afterbegin', badgeHTML);
            }
        }

        console.log(`✅ Dodano progres ${roundedProgress}% do kursu ${course.idKursu}`);
    }

    updateProgressSummary() {
        // Oblicz ukończone kursy (100% progresu)
        const completedCount = this.courses.filter(course => Math.round(course.progress) >= 100).length;
        
        // Oblicz średni progres
        const totalProgress = this.courses.reduce((sum, course) => sum + course.progress, 0);
        const overallProgress = this.courses.length > 0 ? totalProgress / this.courses.length : 0;

        // Zaktualizuj UI
        const completedElement = document.getElementById('completedCount');
        const progressElement = document.getElementById('overallProgress');
        
        if (completedElement) completedElement.textContent = completedCount;
        if (progressElement) progressElement.textContent = `${Math.round(overallProgress)}%`;

        console.log(`📊 Podsumowanie: ${completedCount} ukończonych, ${Math.round(overallProgress)}% progresu`);
    }
}

// Inicjalizacja
export function setupProgressCoursesPage() {
    if (!document.querySelector('.courses-container')) {
        return;
    }
    
    console.log('🎯 Inicjalizacja progresu kursów...');
    window.progressCoursesManager = new ProgressCoursesManager();
}

// ✅ DODAJ: Globalna funkcja do ręcznego odświeżania progresu
window.refreshCourseProgress = function() {
    if (window.progressCoursesManager) {
        window.progressCoursesManager.refreshProgress();
    }
};