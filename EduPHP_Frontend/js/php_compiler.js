// js/php_compiler.js
import { showGlobalError } from './utils.js';
import { getCurrentUserId } from './auth.js';

class PHPCompiler {
    constructor(taskId, userId) {
        this.taskId = taskId;
        this.userId = userId;
        this.currentCode = '';
        
        this.initializeCompiler();
    }
    
    initializeCompiler() {
        this.setupEventListeners();
        this.loadLastSolution();
    }
    
    setupEventListeners() {
        const editor = document.getElementById('codeEditor');
        const testBtn = document.getElementById('testCodeBtn');
        const executeBtn = document.getElementById('saveCodeBtn');
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        if (editor) {
            editor.addEventListener('input', () => {
                this.currentCode = editor.value;
                this.updateCharCount();
            });
            
            editor.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.insertTab(editor);
                }
            });
        }
        
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testCode());
        }
        
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.saveCode());
        }
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }
    
    async loadLastSolution() {
    try {
        // UŻYJ ENDPOINTU KTÓRY JUŻ MASZ - pobierz dane user-task
        const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}`);
        if (response.ok) {
            const userTaskData = await response.json();
            if (userTaskData.userSolution) {
                this.currentCode = userTaskData.userSolution;
                this.setEditorContent(userTaskData.userSolution);
                console.log('✅ Załadowano zapisane rozwiązanie użytkownika');
            } else {
                console.log('ℹ️ Brak zapisanego rozwiązania, używam pustego edytora');
            }
        }
    } catch (error) {
        console.error('Błąd ładowania rozwiązania:', error);
    }
}
    
    setEditorContent(code) {
        const editor = document.getElementById('codeEditor');
        if (editor) {
            editor.value = code;
            this.updateCharCount();
        }
    }
    
    updateCharCount() {
        const editor = document.getElementById('codeEditor');
        const charCount = document.getElementById('charCount');
        if (editor && charCount) {
            const count = editor.value.length;
            charCount.textContent = `${count} znaków`;
            charCount.className = count > 0 ? 'has-content' : '';
        }
    }
    
    insertTab(editor) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
    }
    
    switchTab(tabName) {
        const tabs = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.editor-panel, .output-panel');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName + 'Panel').classList.add('active');
    }
    
    getCurrentCode() {
        const editor = document.getElementById('codeEditor');
        return editor ? editor.value : '';
    }
    
    async testCode() {
        const code = this.getCurrentCode();
        if (!code.trim()) {
            showGlobalError('❌ Wpisz kod PHP do przetestowania', 'error');
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:8082/api/php/test/${this.userId}/${this.taskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });
            
            const result = await response.json();
            this.displayExecutionResult(result, 'test');
            
            // DODAJ TE LINIJKI - odśwież dane użytkownika po teście
            await this.refreshUserTaskData();

            if (result.success) {
                showGlobalError('✅ Test zakończony pomyślnie', 'success');
            } else {
                showGlobalError('⚠️ Test zakończony z błędami', 'warning');
            }
            
        } catch (error) {
            console.error('Błąd testowania kodu:', error);
            showGlobalError('❌ Błąd podczas testowania kodu', 'error');
        }
    }
    
    // DODAJ NOWĄ METODĘ do odświeżania danych
    async refreshUserTaskData() {
        try {
            // Wywołaj metodę z TaskSolver aby odświeżyć UI
            if (window.taskSolver && typeof window.taskSolver.loadUserTaskData === 'function') {
                await window.taskSolver.loadUserTaskData();
                await window.taskSolver.updateUI();
                console.log('🔄 Dane użytkownika odświeżone');
            }
        } catch (error) {
            console.error('Błąd odświeżania danych:', error);
        }
    }
    async saveCode() {
        const code = this.getCurrentCode();
        if (!code.trim()) {
            showGlobalError('❌ Wpisz kod PHP do zapisania', 'error');
            return;
        }
        
        try {
            // Upewnij się, że zadanie jest rozpoczęte
            await this.ensureTaskStarted();
            
            // Tylko zapisz rozwiązanie bez wykonywania
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}/save-only`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ solution: code })
            });
            
            if (response.ok) {
                showGlobalError('✅ Kod zapisany pomyślnie!', 'success');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Błąd podczas zapisywania kodu');
            }
            
        } catch (error) {
            console.error('Błąd zapisywania kodu:', error);
            showGlobalError(`❌ Błąd podczas zapisywania kodu: ${error.message}`, 'error');
        }
    }
    
    async ensureTaskStarted() {
        try {
            const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}`);
            if (!response.ok) {
                await fetch(`http://localhost:8082/api/user-task/${this.userId}/start/${this.taskId}`, {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.error('Błąd podczas rozpoczynania zadania:', error);
        }
    }
    
    displayExecutionResult(result, actionType = 'test') {
        const outputElement = document.getElementById('compilerOutput');
        
        if (!outputElement) return;
        
        let outputHTML = '';
     
        if (result.output) {
            outputHTML += `<div class="output-section">
                <div class="output-header">Wynik:</div>
                <pre class="output-content">${this.escapeHtml(result.output)}</pre>
            </div>`;
        }
        
        if (result.errors) {
            outputHTML += `<div class="output-section">
                <div class="output-header">Błędy:</div>
                <pre class="output-content error">${this.escapeHtml(result.errors)}</pre>
            </div>`;
        }
        
        outputElement.innerHTML = outputHTML;
        this.switchTab('output');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    
    destroy() {
        console.log('🧹 PHPCompiler zniszczony');
    }
}

export { PHPCompiler };