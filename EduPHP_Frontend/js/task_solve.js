import { showGlobalError } from './utils.js';
import { getCurrentUserId} from './auth.js';
import { PHPCompiler } from './php_compiler.js';
import { ScoreCalculator } from './calculation_score.js';

class TaskSolver {
    constructor() {
        this.taskId = this.getTaskIdFromURL();
        this.userId = getCurrentUserId();
        this.taskData = null;
        this.userTaskData = null;
        this.phpCompiler = null;
        this.scoreCalculator = new ScoreCalculator();

        this.init();
    }

    async init() {
        if (!this.taskId || !this.userId) {
            return;
        }

        await this.loadTaskData();
        await this.loadUserTaskData();
        this.initializePHPCompiler();
        this.setupEventListeners();
        this.setupHelpModal();
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
                this.resetTaskProgress();
            });
        }

        // Prześlij do oceny "Skończyłem"
        const submitBtn = document.getElementById('submitSolutionBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitSolution();
            });
        }

           // Przycisk pokaż rozwiązanie
        const showSolutionBtn = document.getElementById('showSolutionBtn');
        if (showSolutionBtn) {
            showSolutionBtn.addEventListener('click', () => {
                this.showHelpModal();
            });
        }

        // Modal pomocy
        const helpModal = document.getElementById('helpModal');
        const closeBtn = helpModal.querySelector('.close');
        const cancelHelpBtn = document.getElementById('cancelHelpBtn');
        const confirmHelpBtn = document.getElementById('confirmHelpBtn');

        closeBtn.addEventListener('click', () => this.hideHelpModal());
        cancelHelpBtn.addEventListener('click', () => this.hideHelpModal());
        confirmHelpBtn.addEventListener('click', () => this.useHelp());

        // Zamknij modal kliknięciem w tło
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                this.hideHelpModal();
            }
        });
    }


    setupHelpModal() {
        // Ukryj modal na starcie
        this.hideHelpModal();
    }

    async showHelpModal() {
        const helpModal = document.getElementById('helpModal');
        const solutionPreview = document.getElementById('solutionPreview');
        
        if (this.taskData && this.taskData.solution) {
            solutionPreview.textContent = this.taskData.solution;
        } else {
            solutionPreview.textContent = 'Brak dostępnego rozwiązania dla tego zadania.';
        }
        
        helpModal.style.display = 'block';
    }

    hideHelpModal() {
        const helpModal = document.getElementById('helpModal');
        helpModal.style.display = 'none';
    }

    async useHelp() {
    try {
        const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/use-help`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            showGlobalError('Zadanie ukończone z pomocą (0 punktów)', 'success');
            this.hideHelpModal();
            
            if (this.taskData && this.taskData.solution) {
                this.phpCompiler.setEditorContent(this.taskData.solution);
            }
            
            await this.loadUserTaskData();
            this.updateUI();
        } else {
            let errorMessage = 'Błąd podczas używania pomocy';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = `Błąd ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Błąd podczas używania pomocy:', error);
        showGlobalError(`Nie udało się użyć pomocy: ${error.message}`, 'error');
    }
}

async submitSolution() {
    const solution = this.phpCompiler.getCurrentCode();
    
    try {
        console.log('Rozpoczynanie przesyłania rozwiązania...');
        
        // 1. Najpierw zapisz rozwiązanie 
        const saveResponse = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/save-only`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ solution: solution })
        });

        console.log('Status zapisywania rozwiązania:', saveResponse.status);
        
        if (!saveResponse.ok) {
            const saveError = await saveResponse.text();
            console.error('Błąd zapisywania:', saveError);
            throw new Error('Błąd podczas zapisywania rozwiązania: ' + saveError);
        }

        // 2. Oblicz wynik na podstawie czasu i prób 
        const timeSpent = this.calculateTimeSpent();
        const attempts = this.userTaskData ? this.userTaskData.attempts : 0; // Używamy aktualnej liczby prób
        const score = this.scoreCalculator.calculateScore(timeSpent, attempts);

        console.log(' Obliczone dane:', {
            timeSpentMinutes: timeSpent,
            attempts: attempts,
            score: score,
            userTaskData: this.userTaskData
        });

        // 3. Przygotuj dane do wysłania
        const completeData = { 
            timeSpentMinutes: timeSpent,
            attempts: attempts // Używamy aktualnej liczby prób
        };

        console.log('Wysyłane dane:', completeData);

        // 4. Oznacz jako ukończone z obliczonym wynikiem
        const completeResponse = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(completeData)
        });

        console.log('Status odpowiedzi complete:', completeResponse.status);

        if (completeResponse.ok) {
            const result = await completeResponse.json();
            console.log(' Odpowiedź complete:', result);
            
            const analysis = this.scoreCalculator.getScoreAnalysis(timeSpent, attempts);
            showGlobalError(`Zadanie ukończone! Wynik: ${score}/10 (czas: ${timeSpent}min, próby: ${attempts})`, 'success');
            
            await this.loadUserTaskData();
            this.updateUI();
        } else {
            // Pobierz szczegóły błędu
            let errorMessage = 'Błąd podczas przesyłania rozwiązania';
            let errorDetails = '';
            
            try {
                const errorData = await completeResponse.json();
                console.error('Błąd z serwera:', errorData);
                errorMessage = errorData.error || errorData.message || errorMessage;
                errorDetails = JSON.stringify(errorData);
            } catch (e) {
                console.error('Błąd parsowania odpowiedzi:', e);
                errorMessage = `Błąd ${completeResponse.status}: ${completeResponse.statusText}`;
                errorDetails = await completeResponse.text();
            }
            
            console.error('Pełne szczegóły błędu:', errorDetails);
            throw new Error(`${errorMessage} | Szczegóły: ${errorDetails}`);
        }
    } catch (error) {
        console.error('Błąd podczas przesyłania rozwiązania:', error);
        showGlobalError(`Nie udało się przesłać rozwiązania: ${error.message}`, 'error');
    }
}

    calculateTimeSpent() {
        if (!this.userTaskData || !this.userTaskData.startDate) {
            return 0;
        }
        
        const startDate = new Date(this.userTaskData.startDate);
        const now = new Date();
        const diffMs = now - startDate;
        return Math.max(0, Math.round(diffMs / (1000 * 60))); // minuty
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
    
    // Wyświetl 0  gdy wynik wynosi 0
    const score = this.userTaskData.score;
    document.getElementById('progressScore').textContent = score !== null && score !== undefined ? score : '-';

    // Ostatnia próba
    const lastAttempt = this.userTaskData.completionDate || this.userTaskData.startDate;
    document.getElementById('progressLastAttempt').textContent = lastAttempt 
        ? new Date(lastAttempt).toLocaleString('pl-PL') 
        : '-';

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
        if (!this.userTaskData) return;
        
        const isCompleted = this.userTaskData.status === 'COMPLETED';
        const submitBtn = document.getElementById('submitSolutionBtn');
        
        if (submitBtn) {
            if (isCompleted) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Ukończone';
                submitBtn.title = 'To zadanie zostało już ukończone';
                submitBtn.classList.add('completed'); 
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> Skończyłem';
                submitBtn.title = 'Prześlij rozwiązanie do oceny';
                submitBtn.classList.remove('completed'); 
            }
        }
    }
    
    async resetTaskProgress() {
        if (!confirm('Czy na pewno chcesz zresetować postęp tego zadania? Wszystkie zapisane dane zostaną utracone.')) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/reset`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            console.log(' Status resetowania:', response.status);
            
            if (response.ok) {
                const resetData = await response.json();
                console.log(' Dane po resecie z backendu:', resetData);
                
                this.userTaskData = {
                    status: resetData.status || 'NOT_STARTED',
                    attempts: resetData.attempts || 0,
                    userSolution: resetData.userSolution || '',
                    score: resetData.score || 0,
                    startDate: resetData.startDate,
                    completionDate: resetData.completionDate,
                    userId: resetData.userId,
                    taskId: resetData.taskId
                };
                
                showGlobalError(' Postęp zadania zresetowany pomyślnie!', 'success');
                
                this.phpCompiler.setEditorContent('<?php\n// Napisz swoje rozwiązanie tutaj\n?>');
                
                this.updateUI();
                
                console.log(' Zadanie zresetowane, status:', this.userTaskData.status);
                
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `Błąd HTTP: ${response.status}`);
            }
            
        } catch (error) {
            console.error(' Błąd resetowania zadania:', error);
            showGlobalError(` Nie udało się zresetować zadania: ${error.message}`, 'error');
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