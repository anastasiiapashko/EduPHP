import { showGlobalError, showFieldError } from './utils.js';

export function setupSolutionManagement() {
    extendTaskFormWithSolution();
    setupSolutionEventListeners();
}

function extendTaskFormWithSolution() {
    const taskForm = document.getElementById('addTaskForm');
    if (!taskForm) return;

    // Sprawdź czy pole rozwiązania już istnieje
    const existingSolutionField = document.getElementById('taskSolution');
    if (existingSolutionField) return;

    // Znajdź grupę formularza przed przyciskami akcji
    const formActions = taskForm.querySelector('.form-actions');
    if (!formActions) return;

    // Utwórz nową sekcję dla rozwiązania
    const solutionSection = document.createElement('div');
    solutionSection.className = 'form-group';
    solutionSection.innerHTML = `
        <label for="taskSolution">
            <i class="fas fa-life-ring"></i> Rozwiązanie pomocy
            <small class="input-hint">(Opcjonalne - gotowe rozwiązanie dla użytkowników)</small>
        </label>
        <textarea id="taskSolution" name="solution" rows="6"
                placeholder="Wpisz gotowe rozwiązanie zadania. Użytkownicy którzy skorzystają z pomocy otrzymają 0 punktów, ale zobaczą to rozwiązanie."></textarea>
        <div class="char-counter" id="solutionCounter">0/5000 znaków</div>
    `;

    // Wstaw przed przyciskami akcji
    formActions.parentNode.insertBefore(solutionSection, formActions);

    // Inicjalizuj licznik znaków dla rozwiązania
    setupSolutionCharCounter();
}

function setupSolutionCharCounter() {
    const solutionTextarea = document.getElementById('taskSolution');
    const solutionCounter = document.getElementById('solutionCounter');

    if (solutionTextarea && solutionCounter) {
        solutionTextarea.addEventListener('input', function() {
            const length = this.value.length;
            solutionCounter.textContent = `${length}/5000 znaków`;
            
            if (length > 4500) {
                solutionCounter.classList.add('warning');
            } else {
                solutionCounter.classList.remove('warning');
            }
        });

        // Inicjalne ustawienie
        const initialLength = solutionTextarea.value.length;
        solutionCounter.textContent = `${initialLength}/5000 znaków`;
    }
}

function setupSolutionEventListeners() {
    const taskForm = document.getElementById('addTaskForm');
    if (taskForm) {
        const originalSubmit = taskForm.onsubmit;
        taskForm.onsubmit = function(e) {
            if (!validateSolutionForm()) {
                e.preventDefault();
                return false;
            }
            return originalSubmit ? originalSubmit.call(this, e) : true;
        };
    }
}

function validateSolutionForm() {
    const solutionTextarea = document.getElementById('taskSolution');
    

    const existingErrors = document.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());

    if (solutionTextarea && solutionTextarea.value.length > 5000) {
        showFieldError('taskSolution', 'Rozwiązanie może mieć maksymalnie 5000 znaków');
        return false;
    }

    return true;
}

// Funkcja do wypełniania formularza danymi zadania 
export function fillTaskFormWithSolution(task) {
    const solutionField = document.getElementById('taskSolution');
    if (solutionField && task.solution !== undefined) {
        solutionField.value = task.solution || '';
        
        // Zaktualizuj licznik znaków
        const solutionCounter = document.getElementById('solutionCounter');
        if (solutionCounter) {
            const length = solutionField.value.length;
            solutionCounter.textContent = `${length}/5000 znaków`;
            solutionCounter.classList.toggle('warning', length > 4500);
        }
    }
}

// Funkcja do pobierania danych rozwiązania z formularza
export function getSolutionData() {
    const solutionField = document.getElementById('taskSolution');
    return solutionField ? solutionField.value.trim() : '';
}