class PHPCompiler {
    constructor() {
        this.currentUserId = null;
        this.currentTaskId = null;
        this.isTesting = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUserData();
    }

    bindEvents() {
        // Przycisk testowania kodu
        document.getElementById('testCodeBtn')?.addEventListener('click', () => this.testCode());
        
        // Przycisk zapisu i wykonania
        document.getElementById('executeCodeBtn')?.addEventListener('click', () => this.executeCode());
        
        // Autosave co 30 sekund
        setInterval(() => this.autoSave(), 30000);
    }

    async testCode() {
        const code = this.getCode();
        if (!code.trim()) {
            this.showOutput('error', 'Proszę wpisać kod PHP do testowania');
            return;
        }

        this.isTesting = true;
        this.showOutput('info', '🔧 Testowanie kodu...');

        try {
            const response = await fetch(`/api/php/test/${this.currentUserId}/${this.currentTaskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            const result = await response.json();
            this.displayTestResult(result);

        } catch (error) {
            this.showOutput('error', `Błąd sieci: ${error.message}`);
        } finally {
            this.isTesting = false;
        }
    }

    async executeCode() {
        const code = this.getCode();
        if (!code.trim()) {
            this.showOutput('error', 'Kod nie może być pusty');
            return;
        }

        this.showOutput('info', '🚀 Wykonywanie kodu...');

        try {
            const response = await fetch(`/api/php/execute/${this.currentUserId}/${this.currentTaskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            const result = await response.json();
            this.displayExecutionResult(result);

        } catch (error) {
            this.showOutput('error', `Błąd wykonania: ${error.message}`);
        }
    }

    displayTestResult(result) {
        const outputElement = document.getElementById('compilerOutput');
        
        if (result.success) {
            if (result.output) {
                this.showOutput('success', `✅ Wynik:\n${result.output}`);
            } else {
                this.showOutput('success', '✅ Kod wykonany pomyślnie (brak outputu)');
            }
        } else {
            let errorMessage = '❌ Błąd wykonania:\n';
            if (result.errors) errorMessage += result.errors;
            if (result.output) errorMessage += `\nOutput: ${result.output}`;
            
            this.showOutput('error', errorMessage);
        }
    }

    displayExecutionResult(result) {
        if (result.success) {
            this.showOutput('success', 
                `✅ Rozwiązanie zapisane i wykonane pomyślnie!\n\nWynik:\n${result.output}`);
            
            // Możesz dodać automatyczne oznaczenie zadania jako ukończone
            this.markTaskAsCompleted();
        } else {
            this.showOutput('error', 
                `❌ Błąd:\n${result.errors || 'Nieznany błąd'}`);
        }
    }

    showOutput(type, message) {
        const outputElement = document.getElementById('compilerOutput');
        outputElement.textContent = message;
        outputElement.className = `compiler-output ${type}`;
        outputElement.style.display = 'block';
        
        // Auto-scroll do outputu
        outputElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    getCode() {
        return document.getElementById('codeEditor').value;
    }

    setCode(code) {
        document.getElementById('codeEditor').value = code || '';
    }

    async autoSave() {
        if (this.isTesting) return;
        
        const code = this.getCode();
        if (!code.trim()) return;

        try {
            await fetch(`/api/user-task/${this.currentUserId}/task/${this.currentTaskId}/solution`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ solution: code })
            });
            
            console.log('Autosave completed');
        } catch (error) {
            console.warn('Autosave failed:', error);
        }
    }

    loadUserData() {
        // Pobierz dane użytkownika i zadania z istniejącego systemu
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
            this.currentUserId = userData.userId;
            document.getElementById('userName').textContent = userData.firstName;
        }
        
        // Pobierz taskId z URL lub parametrów
        const urlParams = new URLSearchParams(window.location.search);
        this.currentTaskId = urlParams.get('taskId') || 
                            document.getElementById('taskId')?.value;
    }

    markTaskAsCompleted() {
        // Oznacz zadanie jako ukończone w systemie
        fetch(`/api/user-task/${this.currentUserId}/task/${this.currentTaskId}/complete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: 100 }) // lub inna logika punktacji
        }).catch(console.error);
    }
}

// Inicjalizacja kompilatora gdy strona się załaduje
document.addEventListener('DOMContentLoaded', () => {
    window.phpCompiler = new PHPCompiler();
});