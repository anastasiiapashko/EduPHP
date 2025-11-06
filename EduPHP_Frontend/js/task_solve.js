// js/task_solve.js
import { showGlobalError } from './utils.js';
import { getCurrentUserId, checkAuth, requireAuth } from './auth.js';
import { PHPCompiler } from './php_compiler.js';

class TaskSolver {
    constructor() {
        this.taskId = this.getTaskIdFromURL();
        this.userId = getCurrentUserId();
        this.taskData = null;
        this.userTaskData = null;
        this.phpCompiler = null;
        
        this.init();
    }

    async init() {
        if (!this.taskId || !this.userId) {
            //showGlobalError('Błąd: Brak ID zadania lub użytkownika', 'error');
            return;
        }

        await this.loadTaskData();
        await this.loadUserTaskData();
        this.initializePHPCompiler();
        this.setupEventListeners();
        this.updateUI();
    }

    getTaskIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('taskId'));
    }

    async loadTaskData() {
        try {
            const response = await fetch(`http://localhost:8082/api/task/dto/${this.taskId}`);
            
            if (response.ok) {
                this.taskData = await response.json();
                this.displayTaskData();
            } else {
                throw new Error('Nie udało się załadować danych zadania');
            }
        } catch (error) {
            console.error('Błąd podczas ładowania zadania:', error);
            showGlobalError('Nie udało się załadować zadania', 'error');
        }
    }

    async loadUserTaskData() {
        try {
            console.log(`Ładowanie danych zadania użytkownika: userId=${this.userId}, taskId=${this.taskId}`);
            
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}`);
            
            console.log('Status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Otrzymane dane user-task (DTO):', data);
                
                this.userTaskData = {
                    status: data.status || 'NOT_STARTED',
                    attempts: data.attempts || 0,
                    userSolution: data.userSolution || '',
                    score: data.score || 0,
                    startDate: data.startDate,
                    completionDate: data.completionDate,
                    userId: data.userId,
                    taskId: data.taskId
                };
                
            } else {
                console.warn('Błąd serwera, używam domyślnych danych');
                this.userTaskData = {
                    status: 'NOT_STARTED',
                    attempts: 0,
                    userSolution: '',
                    score: 0
                };
            }
        } catch (error) {
            console.error('Błąd podczas ładowania postępu:', error);
            this.userTaskData = {
                status: 'NOT_STARTED',
                attempts: 0,
                userSolution: '',
                score: 0
            };
        }
    }

    displayTaskData() {
        if (!this.taskData) return;

        document.getElementById('taskTitle').textContent = this.taskData.tytul || 'Brak tytułu';
        document.getElementById('taskDescription').textContent = this.taskData.description || 'Brak opisu';
        document.getElementById('taskInputs').textContent = this.taskData.inputs || 'Brak danych';
        document.getElementById('taskOutputs').textContent = this.taskData.outputs || 'Brak danych';
        
        // Poziom trudności
        const difficultyElement = document.getElementById('taskDifficulty');
        difficultyElement.textContent = this.taskData.difficulty || 'Nieokreślony';
        difficultyElement.className = `task-difficulty task-difficulty-${this.taskData.difficulty || 'unknown'}`;
        
        // Nazwa kursu
        document.getElementById('taskCourse').textContent = `Kurs #${this.taskData.kursId}`;
    }

    initializePHPCompiler() {
        // Inicjalizuj kompilator PHP
        this.phpCompiler = new PHPCompiler(this.taskId, this.userId);
    }

    setupEventListeners() {
        // Resetuj rozwiązanie
        const resetBtn = document.getElementById('resetSolutionBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSolution();
            });
        }

        // Prześlij do oceny (jeśli masz taki przycisk)
        const submitBtn = document.getElementById('submitSolutionBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitSolution();
            });
        }
    }

    updateUI() {
        if (!this.userTaskData) return;

        // Status zadania
        const statusElement = document.getElementById('taskStatus');
        const statusText = this.getStatusText(this.userTaskData.status);
        statusElement.textContent = statusText;
        statusElement.className = `task-status task-status-${this.userTaskData.status.toLowerCase()}`;

        // Informacje o postępie
        document.getElementById('progressStatus').textContent = statusText;
        document.getElementById('progressAttempts').textContent = this.userTaskData.attempts || 0;
        document.getElementById('progressScore').textContent = this.userTaskData.score || '-';

        // Ostatnia próba
        const lastAttempt = this.userTaskData.completionDate || this.userTaskData.startDate;
        document.getElementById('progressLastAttempt').textContent = lastAttempt 
            ? new Date(lastAttempt).toLocaleString('pl-PL') 
            : '-';

        // Pokazuj/ukryj historię dla ukończonych zadań
        const historySection = document.getElementById('historySection');
        if (historySection) {
            historySection.style.display = this.userTaskData.status === 'COMPLETED' ? 'block' : 'none';
        }

        // Aktualizuj przyciski w zależności od statusu
        this.updateButtons();
    }

    getStatusText(status) {
        const statusMap = {
            'NOT_STARTED': 'Nie rozpoczęte',
            'IN_PROGRESS': 'W trakcie',
            'COMPLETED': 'Ukończone'
        };
        return statusMap[status] || status;
    }

    updateButtons() {
        const isCompleted = this.userTaskData.status === 'COMPLETED';
        const submitBtn = document.getElementById('submitSolutionBtn');
        
        if (submitBtn && isCompleted) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Zadanie ukończone';
            submitBtn.title = 'To zadanie zostało już ukończone';
        }
    }

    async submitSolution() {
        // Tutaj możesz dodać logikę oceniania rozwiązania
        // Na razie symulujemy ocenę
        const score = this.evaluateSolution(this.phpCompiler.getCurrentCode());

        try {
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ score: score })
            });

            if (response.ok) {
                showGlobalError(`✅ Zadanie ukończone! Wynik: ${score}/100`, 'success');
                await this.loadUserTaskData();
                this.updateUI();
            } else {
                throw new Error('Błąd podczas przesyłania rozwiązania');
            }
        } catch (error) {
            console.error('Błąd podczas przesyłania rozwiązania:', error);
            showGlobalError('❌ Nie udało się przesłać rozwiązania', 'error');
        }
    }

    evaluateSolution(solution) {
        // Prosta symulacja oceniania - w przyszłości możesz dodać prawdziwy system oceniania
        const baseScore = Math.min(100, Math.max(20, solution.length / 10));
        return Math.round(baseScore);
    }

    resetSolution() {
        if (confirm('Czy na pewno chcesz zresetować swoje rozwiązanie? To usunie twój obecny kod.')) {
            this.phpCompiler.setEditorContent('');
            
            // Jeśli chcesz zresetować również status zadania:
            // this.resetTaskProgress();
        }
    }

    async resetTaskProgress() {
        try {
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/reset`, {
                method: 'PUT'
            });

            if (response.ok) {
                showGlobalError('🔄 Postęp zadania zresetowany', 'success');
                await this.loadUserTaskData();
                this.updateUI();
            }
        } catch (error) {
            console.error('Błąd podczas resetowania zadania:', error);
        }
    }

    destroy() {
        if (this.phpCompiler) {
            this.phpCompiler.destroy();
        }
    }
}

// Inicjalizacja gdy strona się załaduje
document.addEventListener('DOMContentLoaded', () => {
    window.taskSolver = new TaskSolver();
});

// Czyszczenie przy opuszczeniu strony
window.addEventListener('beforeunload', () => {
    if (window.taskSolver) {
        window.taskSolver.destroy();
    }
});

export function setupTaskSolvePage() {
    if (!document.querySelector('.task-solve-container')) {
        return;
    }
    
    console.log('Inicjalizacja strony rozwiązywania zadań...');    
}