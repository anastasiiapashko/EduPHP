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
        const executeBtn = document.getElementById('executeCodeBtn');
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
            executeBtn.addEventListener('click', () => this.executeAndSaveCode());
        }
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }
    
    async loadLastSolution() {
        try {
            const response = await fetch(`http://localhost:8082/api/php/solution/${this.userId}/${this.taskId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.code) {
                    this.currentCode = data.code;
                    this.setEditorContent(data.code);
                    console.log('✅ Załadowano ostatnie rozwiązanie');
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
    
    async executeAndSaveCode() {
    const code = this.getCurrentCode();
    if (!code.trim()) {
        showGlobalError('❌ Wpisz kod PHP do wykonania', 'error');
        return;
    }
    
    try {
        // Najpierw upewnij się, że zadanie jest rozpoczęte
        await this.ensureTaskStarted();
        
        const response = await fetch(`http://localhost:8082/api/php/execute/${this.userId}/${this.taskId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });
        
        const result = await response.json();
        this.displayExecutionResult(result, 'execute');
        
        if (result.success && result.saved) {
            showGlobalError('✅ Kod wykonany i zapisany pomyślnie!', 'success');
        } else if (result.success) {
            showGlobalError('✅ Kod wykonany pomyślnie!', 'success');
        } else {
            showGlobalError('⚠️ Kod wykonany z błędami', 'warning');
        }
        
    } catch (error) {
        console.error('Błąd wykonania kodu:', error);
        showGlobalError('❌ Błąd podczas wykonywania kodu', 'error');
    }
}

async ensureTaskStarted() {
    try {
        // Sprawdź status zadania
        const response = await fetch(`http://localhost:8082/api/user-task/${this.userId}/task/${this.taskId}`);
        if (!response.ok) {
            // Jeśli zadanie nie istnieje, rozpocznij je
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