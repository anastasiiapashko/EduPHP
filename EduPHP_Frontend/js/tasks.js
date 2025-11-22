import { checkAuth, logout } from './auth.js';

export function setupTasksPage() {
    if (!document.querySelector('.tasks-container')) {
        return;
    }

    console.log('Inicjalizacja strony zadań...');
    new TasksViewer();
}

class TasksViewer {
    constructor() {
        this.tasks = [];
        this.courses = [];
        this.filteredTasks = [];
        this.currentPage = 1;
        this.tasksPerPage = 10;
        this.currentFilters = {
            search: '',
            course: 'all', 
            difficulty: 'all',
            sort: 'newest'
        };
        
        this.init();
    }

    async init() {
        await this.loadCourses();
        await this.loadTasks();
        this.setupEventListeners();
    }

    // Ładowanie kursów i wypełnianie filtra
    async loadCourses() {
        try {
            const response = await fetch('http://localhost:8082/api/kurs/all', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.courses = await response.json();
                this.populateCourseFilter();
                console.log('Załadowane kursy do wyświetlania:', this.courses);
            } else {
                console.warn('Nie udało się załadować kursów do wyświetlania');
            }
        } catch (error) {
            console.error('Błąd podczas ładowania kursów:', error);
        }
    }

    // Wypełnij select z kursami
    populateCourseFilter() {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter) return;

        // Zachowaj opcję "Wszystkie kursy"
        const defaultOption = courseFilter.querySelector('option[value="all"]');
        courseFilter.innerHTML = '';
        courseFilter.appendChild(defaultOption);
        
        // Dodaj kursy do selecta
        this.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.idKursu;
            option.textContent = course.tytul || `Kurs #${course.idKursu}`;
            courseFilter.appendChild(option);
        });
    }

    async loadTasks() {
        try {
            const response = await fetch('http://localhost:8082/api/task/all-dto', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.tasks = await response.json();
                console.log('Załadowane zadania:', this.tasks);
                this.applyFilters();
                this.displayTasks();
            } else {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Błąd podczas ładowania zadań:', error);
            this.showError('Nie udało się załadować zadań');
        }
    }

    applyFilters() {
        this.filteredTasks = this.tasks.filter(task => {
            // Filtrowanie po wyszukiwaniu (rozszerzone o nazwę kursu)
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const taskTitle = task.tytul || '';
                const taskDescription = task.description || '';
                const courseName = this.getCourseName(task.kursId).toLowerCase();
                
                const matchesSearch = 
                    taskTitle.toLowerCase().includes(searchTerm) ||
                    taskDescription.toLowerCase().includes(searchTerm) ||
                    courseName.includes(searchTerm); // DODANO: wyszukiwanie po nazwie kursu
                
                if (!matchesSearch) return false;
            }

            // Filtrowanie po kursie
            if (this.currentFilters.course !== 'all') {
                if (task.kursId !== parseInt(this.currentFilters.course)) {
                    return false;
                }
            }

            // Filtrowanie po poziomie trudności
            if (this.currentFilters.difficulty !== 'all') {
                if (task.difficulty !== this.currentFilters.difficulty) {
                    return false;
                }
            }

            return true;
        });

        this.sortTasks();
    }

    sortTasks() {
        switch (this.currentFilters.sort) {
            case 'oldest':
                this.filteredTasks.sort((a, b) => a.idTask - b.idTask);
                break;
            case 'difficulty_asc':
                const difficultyOrder = { 'łatwy': 1, 'średni': 2, 'trudny': 3 };
                this.filteredTasks.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
                break;
            case 'difficulty_desc':
                const difficultyOrderDesc = { 'łatwy': 1, 'średni': 2, 'trudny': 3 };
                this.filteredTasks.sort((a, b) => difficultyOrderDesc[b.difficulty] - difficultyOrderDesc[a.difficulty]);
                break;
            case 'newest':
            default:
                this.filteredTasks.sort((a, b) => b.idTask - a.idTask);
                break;
        }
    }

    displayTasks() {
        const tasksList = document.getElementById('tasksList');
        const tasksCount = document.getElementById('tasksCount');
        
        if (!tasksList || !tasksCount) return;

        if (this.filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-tasks fa-3x"></i>
                    <h3>Brak zadań</h3>
                    <p>Nie znaleziono zadań spełniających kryteria wyszukiwania.</p>
                </div>
            `;
            tasksCount.textContent = 'Znaleziono 0 zadań';
            const pagination = document.getElementById('pagination');
            if (pagination) pagination.innerHTML = '';
            return;
        }

        tasksCount.textContent = `Znaleziono ${this.filteredTasks.length} zadań`;

        const totalPages = Math.ceil(this.filteredTasks.length / this.tasksPerPage);
        const startIndex = (this.currentPage - 1) * this.tasksPerPage;
        const endIndex = startIndex + this.tasksPerPage;
        const paginatedTasks = this.filteredTasks.slice(startIndex, endIndex);

        tasksList.innerHTML = paginatedTasks.map(task => {
            const courseName = this.getCourseName(task.kursId);
            return `
            <div class="task-item" data-task-id="${task.idTask}">
                <div class="task-header">
                    <h3 class="task-title">${this.escapeHtml(task.tytul || 'Brak tytułu')}</h3>
                    <div class="task-meta">
                        <span class="task-course">
                            <i class="fas fa-book"></i> ${courseName}
                        </span>
                        <span class="task-difficulty task-difficulty-${task.difficulty}">
                            ${this.getDifficultyIcon(task.difficulty)} ${task.difficulty || 'Nieokreślony'}
                        </span>
                    </div>
                </div>
                <div class="task-content">
                    <p class="task-description">${this.escapeHtml(task.description || 'Brak opisu')}</p>
                    <div class="task-details">
                        <div class="task-detail">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>Wejście: ${this.escapeHtml(task.inputs || 'Brak danych')}</span>
                        </div>
                        <div class="task-detail">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Wyjście: ${this.escapeHtml(task.outputs || 'Brak danych')}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-primary solve-task-btn" data-task-id="${task.idTask}">
                        <i class="fas fa-play"></i> Rozwiąż zadanie
                    </button>
                </div>
            </div>
            `;
        }).join('');

        this.generatePagination(totalPages);
    }

    getCourseName(kursId) {
        if (!kursId) return 'Brak przypisanego kursu';
        const course = this.courses.find(c => c.idKursu === kursId);
        return course ? (course.tytul || `Kurs #${kursId}`) : `Kurs #${kursId}`;
    }

    getDifficultyIcon(difficulty) {
        switch (difficulty) {
            case 'łatwy': return '<i class="fas fa-smile"></i>';
            case 'średni': return '<i class="fas fa-meh"></i>';
            case 'trudny': return '<i class="fas fa-frown"></i>';
            default: return '<i class="fas fa-question"></i>';
        }
    }

    generatePagination(totalPages) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i> Poprzednia
            </button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="page-current">${i}</span>`;
            } else {
                paginationHTML += `<button class="page-btn" data-page="${i}">${i}</button>`;
            }
        }

        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage + 1}">
                Następna <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        pagination.innerHTML = paginationHTML;
    }

    setupEventListeners() {
        // Filtry
        const searchInput = document.getElementById('searchInput');
        const courseFilter = document.getElementById('courseFilter'); // DODANO
        const difficultyFilter = document.getElementById('difficultyFilter');
        const sortSelect = document.getElementById('sortSelect');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.displayTasks();
            });
        }

        // DODANO: Obsługa filtra kursu
        if (courseFilter) {
            courseFilter.addEventListener('change', (e) => {
                this.currentFilters.course = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.displayTasks();
            });
        }

        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', (e) => {
                this.currentFilters.difficulty = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.displayTasks();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.applyFilters();
                this.displayTasks();
            });
        }

        // Paginacja
        const pagination = document.getElementById('pagination');
        if (pagination) {
            pagination.addEventListener('click', (e) => {
                if (e.target.classList.contains('page-btn')) {
                    this.currentPage = parseInt(e.target.dataset.page);
                    this.displayTasks();
                }
            });
        }

        // Przyciski rozwiązywania zadań
        const tasksList = document.getElementById('tasksList');
        if (tasksList) {
            tasksList.addEventListener('click', (e) => {
                const taskId = e.target.closest('button')?.dataset.taskId;
                if (!taskId) return;

                if (e.target.closest('.solve-task-btn')) {
                    this.solveTask(parseInt(taskId));
                }
            });
        }
    }

    solveTask(taskId) {
        window.location.href = `task_solve.html?taskId=${taskId}`;
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}