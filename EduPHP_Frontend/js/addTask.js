import { checkAuth } from './auth.js';
import { isAdmin } from './permissions.js';

export function setupCreatorPage() {
    if (!document.querySelector('.creator-container')) {
        return;
    }

    console.log('Inicjalizacja strony tworzenia zadań...');
    new TaskCreatorManager();
}

class TaskCreatorManager {
    constructor() {
        this.tasks = [];
        this.courses = [];
        this.currentEditTaskId = null; // ID zadania w trybie edycji
        this.init();
    }

    async init() {
        await this.checkAdminStatus();
        await this.loadCourses();
        await this.loadTasks();
        this.setupEventListeners();
    }

    async checkAdminStatus() {
        const admin = await isAdmin();
        if (!admin) {
            window.location.href = 'user_main.html';
            return;
        }
    }

    // Ładowanie kursów do selecta
    async loadCourses() {
        try {
            const response = await fetch('http://localhost:8082/api/kurs/all', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.courses = await response.json();
                console.log('Załadowane kursy:', this.courses);
                this.populateCourseSelect();
            } else {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Błąd podczas ładowania kursów:', error);
            this.showError('Nie udało się załadować listy kursów');
        }
    }

    // Wypełnianie selecta z kursami
    populateCourseSelect() {
        const courseSelect = document.getElementById('taskCourseSelect');
        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">-- Wybierz kurs --</option>';
        
        this.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.idKursu;
            option.textContent = course.tytul || `Kurs #${course.idKursu}`;
            courseSelect.appendChild(option);
        });
    }

    // Ładowanie zadań do zarządzania
    async loadTasks() {
        try {
            const response = await fetch('http://localhost:8082/api/task/all-dto', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.tasks = await response.json();
                console.log('Załadowane zadania do zarządzania:', this.tasks);
                this.displayTasksForManagement();
            } else {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Błąd podczas ładowania zadań:', error);
            this.showError('Nie udało się załadować zadań');
        }
    }

    // Konfiguracja event listenerów
    setupEventListeners() {
        // Formularz dodawania/edycji zadania
        const taskForm = document.getElementById('addTaskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }

        // Przycisk anulowania edycji zadania
        const cancelTaskEditBtn = document.getElementById('cancelTaskEditBtn');
        if (cancelTaskEditBtn) {
            cancelTaskEditBtn.addEventListener('click', () => {
                this.resetTaskForm();
            });
        }
    }

    // Zapis zadania (dodawanie lub edycja)
    async saveTask() {
        const form = document.getElementById('addTaskForm');
        if (!form) return;

        const formData = new FormData(form);
        
        const kursId = formData.get('kursId');
        if (!kursId) {
            this.showError('Proszę wybrać kurs dla zadania');
            return;
        }
        
        const taskData = {
            tytul: formData.get('tytul'),
            description: formData.get('description'),
            inputs: formData.get('inputs'),
            outputs: formData.get('outputs'),
            difficulty: formData.get('difficulty'),
            kursId: parseInt(kursId)
        };

        try {
            let response;
            
            if (this.currentEditTaskId) {
                // Tryb edycji
                response = await fetch(`http://localhost:8082/api/task/update-dto/${this.currentEditTaskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(taskData)
                });
            } else {
                // Tryb dodawania
                response = await fetch(`http://localhost:8082/api/task/create-dto/kurs/${kursId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(taskData)
                });
            }
            
            if (response.ok) {
                const savedTask = await response.json();
                
                if (this.currentEditTaskId) {
                    this.showSuccess('Zadanie zostało zaktualizowane!');
                } else {
                    this.showSuccess('Zadanie zostało utworzone!');
                }
                
                this.resetTaskForm();
                await this.loadTasks(); // Przeładuj listę zadań
            } else {
                const errorText = await response.text();
                throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Błąd podczas zapisywania zadania:', error);
            this.showError('Nie udało się zapisać zadania: ' + error.message);
        }
    }

    // Reset formularza zadania
    resetTaskForm() {
        const form = document.getElementById('addTaskForm');
        if (form) {
            form.reset();
        }
        
        // Przywróć tryb dodawania
        this.currentEditTaskId = null;
        
        // Zaktualizuj interfejs
        this.updateTaskFormUI();
    }

    // Aktualizacja interfejsu formularza zadania
    updateTaskFormUI() {
        const formTitle = document.getElementById('taskFormTitle');
        const submitBtn = document.getElementById('submitTaskBtn');
        const cancelBtn = document.getElementById('cancelTaskEditBtn');

        if (this.currentEditTaskId) {
            // Tryb edycji
            if (formTitle) formTitle.innerHTML = '<i class="fas fa-edit"></i> Edytuj zadanie';
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Zapisz zmiany';
            if (cancelBtn) cancelBtn.style.display = 'block';
        } else {
            // Tryb dodawania
            if (formTitle) formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Dodaj nowe zadanie';
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Dodaj Zadanie';
            if (cancelBtn) cancelBtn.style.display = 'none';
        }
    }

    // Wyświetlanie zadań do zarządzania
    displayTasksForManagement() {
        const tasksList = document.getElementById('tasksManagementList');
        if (!tasksList) return;

        if (this.tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-tasks fa-3x"></i>
                    <h3>Brak zadań</h3>
                    <p>Nie masz jeszcze żadnych zadań. Dodaj pierwsze zadanie!</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = this.tasks.map(task => {
            const courseName = this.getCourseName(task.kursId);
            return `
            <div class="task-management-item" data-task-id="${task.idTask}">
                <div class="task-management-header">
                    <h3>${this.escapeHtml(task.tytul || 'Brak tytułu')}</h3>
                    <div class="task-management-actions">
                        <button class="btn-edit" data-task-id="${task.idTask}">
                            <i class="fas fa-edit"></i> Edytuj
                        </button>
                        <button class="btn-delete" data-task-id="${task.idTask}">
                            <i class="fas fa-trash"></i> Usuń
                        </button>
                    </div>
                </div>
                <div class="task-management-content">
                    <p class="task-description">${this.escapeHtml(task.description || 'Brak opisu')}</p>
                    <div class="task-management-details">
                        <div class="task-detail">
                            <i class="fas fa-book"></i>
                            <span>Kurs: ${courseName}</span>
                        </div>
                        <div class="task-detail">
                            <i class="fas fa-signal"></i>
                            <span>Poziom: ${task.difficulty || 'Nieokreślony'}</span>
                        </div>
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
            </div>
            `;
        }).join('');

        // Dodaj event listeners do przycisków
        this.setupTaskManagementEventListeners();
    }

    // Pobieranie nazwy kursu
    getCourseName(kursId) {
        if (!kursId) return 'Brak przypisanego kursu';
        const course = this.courses.find(c => c.idKursu === kursId);
        return course ? (course.tytul || `Kurs #${kursId}`) : `Kurs #${kursId}`;
    }

    // Event listeners dla zarządzania zadaniami
    setupTaskManagementEventListeners() {
        // Edycja zadania
        document.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').dataset.taskId;
                this.editTask(parseInt(taskId));
            });
        });

        // Usuwanie zadania
        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').dataset.taskId;
                this.deleteTask(parseInt(taskId));
            });
        });
    }

    // Edycja zadania - wypełnienie formularza
    async editTask(taskId) {
        const task = this.tasks.find(t => t.idTask === taskId);
        if (task) {
            this.fillTaskForm(task);
        }
    }

    // Wypełnienie formularza danymi zadania
    fillTaskForm(task) {
        // Wypełnij pola formularza
        document.getElementById('taskTitle').value = task.tytul || '';
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskInputs').value = task.inputs || '';
        document.getElementById('taskOutputs').value = task.outputs || '';
        document.getElementById('taskDifficulty').value = task.difficulty || 'łatwy';
        
        // Ustaw odpowiedni kurs w select
        const courseSelect = document.getElementById('taskCourseSelect');
        if (courseSelect) {
            courseSelect.value = task.kursId || '';
        }

        // Przełącz na tryb edycji
        this.currentEditTaskId = task.idTask;
        this.updateTaskFormUI();

        // Przewiń do formularza
        document.getElementById('addTaskForm').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // Usuwanie zadania
    async deleteTask(taskId) {
        if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8082/api/task/delete/${taskId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showSuccess('Zadanie zostało usunięte');
                
                // Jeśli usuwamy zadanie które właśnie edytujemy, zresetuj formularz
                if (this.currentEditTaskId === taskId) {
                    this.resetTaskForm();
                }
                
                await this.loadTasks();
            } else {
                const errorText = await response.text();
                throw new Error(`Błąd: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Błąd podczas usuwania zadania:', error);
            this.showError('Nie udało się usunąć zadania: ' + error.message);
        }
    }

    // Metody pomocnicze
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
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