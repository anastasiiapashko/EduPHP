import {  showGlobalError } from './utils.js';
import { getCurrentUserId, checkAuth } from './auth.js';

class TaskSolver {
    constructor() {
        this.taskId = this.getTaskIdFromURL();
        this.userId = getCurrentUserId();
        this.taskData = null;
        this.userTaskData = null;
        
        this.init();
    }

    async init() {
        
        if (!this.taskId || !this.userId) {
            //this.showError('Błąd: Brak ID zadania lub użytkownika');
            return;
        }

        await this.loadTaskData();
        await this.loadUserTaskData();
        this.setupEventListeners();
        this.updateUI();
    }

    getTaskIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('taskId'));
    }

    async loadTaskData() {
        try {
            const response = await fetch(`http://localhost:8082/api/task/dto/${this.taskId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.taskData = await response.json();
                this.displayTaskData();
            } else {
                throw new Error('Nie udało się załadować danych zadania');
            }
        } catch (error) {
            console.error('Błąd podczas ładowania zadania:', error);
            this.showError('Nie udało się załadować zadania');
        }
    }

    async loadUserTaskData() {
    try {
        console.log(`Ładowanie danych zadania użytkownika: userId=${this.userId}, taskId=${this.taskId}`);
        
        const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}`, {
            credentials: 'include'
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Otrzymane dane user-task (DTO):', data);
            
            // Mapuj dane z DTO na nasz obiekt
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
            // Jeśli błąd - używamy domyślnych danych
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
        
        // Nazwa kursu (możesz dodać pobieranie nazwy kursu jeśli potrzebne)
        document.getElementById('taskCourse').textContent = `Kurs #${this.taskData.kursId}`;
    }

    setupEventListeners() {
        // Zapisz rozwiązanie
        document.getElementById('saveSolutionBtn').addEventListener('click', () => {
            this.saveSolution();
        });

        // Prześlij do oceny
        document.getElementById('submitSolutionBtn').addEventListener('click', () => {
            this.submitSolution();
        });

        // Resetuj rozwiązanie
        document.getElementById('resetSolutionBtn').addEventListener('click', () => {
            this.resetSolution();
        });

        // Licznik znaków w edytorze
        const codeEditor = document.getElementById('codeEditor');
        codeEditor.addEventListener('input', () => {
            document.getElementById('charCount').textContent = `${codeEditor.value.length} znaków`;
        });

        // Wypełnij edytor jeśli mamy zapisane rozwiązanie
        if (this.userTaskData.userSolution) {
            codeEditor.value = this.userTaskData.userSolution;
            document.getElementById('charCount').textContent = `${codeEditor.value.length} znaków`;
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
        if (this.userTaskData.status === 'COMPLETED') {
            document.getElementById('historySection').style.display = 'block';
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
        
        if (isCompleted) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Zadanie ukończone';
            submitBtn.title = 'To zadanie zostało już ukończone';
        }
    }

    async saveSolution() {
        const solution = document.getElementById('codeEditor').value.trim();
        
        if (!solution) {
            this.showError('Wprowadź rozwiązanie przed zapisaniem');
            return;
        }

        try {
            // Jeśli zadanie nie zostało jeszcze rozpoczęte, najpierw je rozpocznij
            if (this.userTaskData.status === 'NOT_STARTED') {
                await this.startTask();
            }

            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/solution`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ solution: solution })
            });

            if (response.ok) {
                showGlobalError('Rozwiązanie zapisane pomyślnie!', 'success');
                await this.loadUserTaskData(); // Odśwież dane
                this.updateUI();
            } else {
                throw new Error('Błąd podczas zapisywania rozwiązania');
            }
        } catch (error) {
            console.error('Błąd podczas zapisywania rozwiązania:', error);
            this.showError('Nie udało się zapisać rozwiązania');
        }
    }

    async startTask() {
        try {
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/start/${this.taskId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                console.log('Zadanie rozpoczęte pomyślnie');
                return true;
            } else {
                throw new Error('Błąd podczas rozpoczynania zadania');
            }
        } catch (error) {
            console.error('Błąd podczas rozpoczynania zadania:', error);
            throw error;
        }
    }

    async submitSolution() {
        const solution = document.getElementById('codeEditor').value.trim();
        
        if (!solution) {
            this.showError('Wprowadź rozwiązanie przed przesłaniem');
            return;
        }

        // Tutaj możesz dodać logikę oceniania rozwiązania
        // Na razie symulujemy ocenę
        const score = this.evaluateSolution(solution);

        try {
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ score: score })
            });

            if (response.ok) {
                showGlobalError(`Zadanie ukończone! Wynik: ${score}/100`, 'success');
                await this.loadUserTaskData();
                this.updateUI();
            } else {
                throw new Error('Błąd podczas przesyłania rozwiązania');
            }
        } catch (error) {
            console.error('Błąd podczas przesyłania rozwiązania:', error);
            this.showError('Nie udało się przesłać rozwiązania');
        }
    }

    evaluateSolution(solution) {
        // Prosta symulacja oceniania - w rzeczywistości tutaj byłby system oceniania kodu
        // Na razie zwracamy losowy wynik lub wynik na podstawie długości kodu
        const baseScore = Math.min(100, Math.max(20, solution.length / 10));
        return Math.round(baseScore);
    }

    resetSolution() {
        if (confirm('Czy na pewno chcesz zresetować swoje rozwiązanie? To usunie twój obecny kod.')) {
            document.getElementById('codeEditor').value = '';
            document.getElementById('charCount').textContent = '0 znaków';
            
            // Jeśli chcesz zresetować również status zadania:
            // this.resetTaskProgress();
        }
    }

    async resetTaskProgress() {
        try {
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/reset`, {
                method: 'PUT',
                credentials: 'include'
            });

            if (response.ok) {
                showGlobalError('Postęp zadania zresetowany', 'success');
                await this.loadUserTaskData();
                this.updateUI();
            }
        } catch (error) {
            console.error('Błąd podczas resetowania zadania:', error);
        }
    }

    showError(message) {
        showGlobalError(message);
    }
}

// Inicjalizacja gdy strona się załaduje
document.addEventListener('DOMContentLoaded', () => {
    new TaskSolver();
});


export function setupTaskSolvePage() {
    if (!document.querySelector('.task-solve-container')) {
        return;
    }
    
    console.log('Inicjalizacja strony rozwiązywania zadań...');    
}