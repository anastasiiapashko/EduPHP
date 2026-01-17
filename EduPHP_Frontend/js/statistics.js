import { showGlobalError, getUserId } from './utils.js';

class StatisticsManager {
    constructor() {
        this.userId = getUserId();
        this.currentPeriod = 'weekly';
        this.currentDate = new Date();
        this.activityChart = null;
        this.scoreChart = null;
        this.difficultyChart = null;
        this.userTasks = [];
        
        this.init();
    }

    async init() {
        if (!this.userId) {
            showGlobalError('Nie jesteś zalogowany!');
            return;
        }

        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
        this.renderCharts();
    }

    async loadUserData() {
        try {
            const dateStr = this.currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const response = await fetch(
                `http://localhost:8082/api/user-task/user/${this.userId}/statistics/detailed?period=${this.currentPeriod}&date=${dateStr}`, 
                {
                    credentials: 'include'
                }
            );
            
            if (response.ok) {
                this.userTasks = await response.json();
                console.log('Załadowane zadania użytkownika:', this.userTasks);
            } else {
                const fallbackResponse = await fetch(
                    `http://localhost:8082/api/user-task/user/${this.userId}`, 
                    {
                        credentials: 'include'
                    }
                );
                if (fallbackResponse.ok) {
                    this.userTasks = await fallbackResponse.json();
                } else {
                    throw new Error('Błąd podczas ładowania danych użytkownika');
                }
            }
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
            showGlobalError('Nie udało się załadować statystyk');
        }
    }

    setupEventListeners() {
        // Zmiana typu okresu
        document.getElementById('periodType').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.currentDate = new Date(); // Reset do bieżącego okresu
            this.updateUI();
            this.loadUserData().then(() => {
                this.renderCharts();
            });
        });

        // Nawigacja między okresami
        document.getElementById('prevPeriod').addEventListener('click', () => {
            this.navigatePeriod(-1);
        });

        document.getElementById('nextPeriod').addEventListener('click', () => {
            this.navigatePeriod(1);
        });

        document.getElementById('currentPeriodBtn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.updateUI();
            this.loadUserData().then(() => {
                this.renderCharts();
            });
        });
    }

    navigatePeriod(direction) {
        switch (this.currentPeriod) {
            case 'weekly':
                this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
                break;
            case 'monthly':
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                break;
            case 'yearly':
                this.currentDate.setFullYear(this.currentDate.getFullYear() + direction);
                break;
        }
        this.updateUI();
        this.loadUserData().then(() => {
            this.renderCharts();
        });
    }

    updateUI() {
        this.updateSummaryCards();
        this.updatePeriodDisplay();
    }

    updateSummaryCards() {
        const completedTasks = this.userTasks.filter(task => task.status === 'COMPLETED').length;
        const inProgressTasks = this.userTasks.filter(task => task.status === 'IN_PROGRESS').length;
        const totalTasks = this.userTasks.length;
        
        const completedTasksWithScore = this.userTasks.filter(task => 
            task.status === 'COMPLETED' && task.score > 0
        );
        const averageScore = completedTasksWithScore.length > 0 
            ? (completedTasksWithScore.reduce((sum, task) => sum + task.score, 0) / completedTasksWithScore.length).toFixed(1)
            : '0.0';

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('inProgressTasks').textContent = inProgressTasks;
        document.getElementById('averageScore').textContent = averageScore;
    }

    updatePeriodDisplay() {
        const periodElement = document.getElementById('currentPeriod');
        
        switch (this.currentPeriod) {
            case 'weekly':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                periodElement.textContent = `Tydzień: ${this.formatDate(weekStart)} - ${this.formatDate(weekEnd)}`;
                break;
                
            case 'monthly':
                const monthName = this.currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
                periodElement.textContent = `Miesiąc: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
                break;
                
            case 'yearly':
                periodElement.textContent = `Rok: ${this.currentDate.getFullYear()}`;
                break;
        }
    }

    getWeekStart(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    formatDate(date) {
        return date.toLocaleDateString('pl-PL');
    }

    getDataForPeriod() {
        const periodData = {
            labels: [],
            completedTasks: [],
            averageScores: [],
            difficultyDistribution: { łatwy: 0, średni: 0, trudny: 0 },
            detailedStats: []
        };

        const filteredTasks = this.userTasks;
        
        const groupedData = this.groupTasksByPeriod(filteredTasks);
        
        switch (this.currentPeriod) {
            case 'weekly':
                periodData.labels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
                this.processWeeklyData(groupedData, periodData);
                break;
                
            case 'monthly':
                const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
                periodData.labels = Array.from({length: daysInMonth}, (_, i) => (i + 1).toString());
                this.processMonthlyData(groupedData, periodData);
                break;
                
            case 'yearly':
                periodData.labels = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
                this.processYearlyData(groupedData, periodData);
                break;
        }

        return periodData;
    }

    groupTasksByPeriod(tasks) {
        const grouped = {};
        
        tasks.forEach(task => {
            const taskDate = task.completionDate ? new Date(task.completionDate) : new Date(task.startDate);
            let key;
            
            switch (this.currentPeriod) {
                case 'weekly':
                    key = taskDate.getDay(); // 0-6 (niedziela-sobota)
                    break;
                case 'monthly':
                    key = taskDate.getDate() - 1; // 0-30
                    break;
                case 'yearly':
                    key = taskDate.getMonth(); // 0-11
                    break;
            }
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(task);
        });
        
        return grouped;
    }

    processWeeklyData(groupedData, periodData) {
        for (let i = 1; i <= 7; i++) {
            const dayIndex = i === 7 ? 0 : i; 
            const tasks = groupedData[dayIndex] || [];
            
            periodData.completedTasks.push(tasks.filter(task => task.status === 'COMPLETED').length);
            
            const completedWithScore = tasks.filter(task => task.status === 'COMPLETED' && task.score > 0);
            const avgScore = completedWithScore.length > 0 
                ? completedWithScore.reduce((sum, task) => sum + task.score, 0) / completedWithScore.length
                : 0;
            periodData.averageScores.push(avgScore);
            
            // Zbieranie statystyk trudności
            tasks.forEach(task => {
                if (task.taskDifficulty && periodData.difficultyDistribution[task.taskDifficulty] !== undefined) {
                    periodData.difficultyDistribution[task.taskDifficulty]++;
                }
            });
            
            // Szczegółowe statystyki
            periodData.detailedStats.push(...tasks.map(task => ({
                date: task.completionDate || task.startDate,
                title: task.taskTitle || 'Brak tytułu',
                difficulty: task.taskDifficulty || 'nieokreślony',
                score: task.score || 0,
                timeSpent: this.calculateTimeSpent(task),
                attempts: task.attempts || 0,
                status: this.getStatusText(task.status)
            })));
        }
    }

    processMonthlyData(groupedData, periodData) {
        const daysInMonth = periodData.labels.length;
        
        for (let day = 0; day < daysInMonth; day++) {
            const tasks = groupedData[day] || [];
            
            periodData.completedTasks.push(tasks.filter(task => task.status === 'COMPLETED').length);
            
            const completedWithScore = tasks.filter(task => task.status === 'COMPLETED' && task.score > 0);
            const avgScore = completedWithScore.length > 0 
                ? completedWithScore.reduce((sum, task) => sum + task.score, 0) / completedWithScore.length
                : 0;
            periodData.averageScores.push(avgScore);
        }
        
        // Dla miesięcznego - zbierz wszystkie zadania dla rozkładu trudności
        Object.values(groupedData).flat().forEach(task => {
            if (task.taskDifficulty && periodData.difficultyDistribution[task.taskDifficulty] !== undefined) {
                periodData.difficultyDistribution[task.taskDifficulty]++;
            }
        });
        
        // Szczegółowe statystyki
        periodData.detailedStats = Object.values(groupedData).flat().map(task => ({
            date: task.completionDate || task.startDate,
            title: task.taskTitle || 'Brak tytułu',
            difficulty: task.taskDifficulty || 'nieokreślony',
            score: task.score || 0,
            timeSpent: this.calculateTimeSpent(task),
            attempts: task.attempts || 0,
            status: this.getStatusText(task.status)
        }));
    }

    processYearlyData(groupedData, periodData) {
        for (let month = 0; month < 12; month++) {
            const tasks = groupedData[month] || [];
            
            periodData.completedTasks.push(tasks.filter(task => task.status === 'COMPLETED').length);
            
            const completedWithScore = tasks.filter(task => task.status === 'COMPLETED' && task.score > 0);
            const avgScore = completedWithScore.length > 0 
                ? completedWithScore.reduce((sum, task) => sum + task.score, 0) / completedWithScore.length
                : 0;
            periodData.averageScores.push(avgScore);
            
            // Zbieranie statystyk trudności
            tasks.forEach(task => {
                if (task.taskDifficulty && periodData.difficultyDistribution[task.taskDifficulty] !== undefined) {
                    periodData.difficultyDistribution[task.taskDifficulty]++;
                }
            });
        }
        
        // Szczegółowe statystyki
        periodData.detailedStats = Object.values(groupedData).flat().map(task => ({
            date: task.completionDate || task.startDate,
            title: task.taskTitle || 'Brak tytułu',
            difficulty: task.taskDifficulty || 'nieokreślony',
            score: task.score || 0,
            timeSpent: this.calculateTimeSpent(task),
            attempts: task.attempts || 0,
            status: this.getStatusText(task.status)
        }));
    }

    calculateTimeSpent(task) {
        if (!task.startDate || !task.completionDate) return 0;
        
        const start = new Date(task.startDate);
        const end = new Date(task.completionDate);
        return Math.round((end - start) / (1000 * 60)); // minuty
    }

    getStatusText(status) {
        const statusMap = {
            'NOT_STARTED': 'Nie rozpoczęte',
            'IN_PROGRESS': 'W trakcie',
            'COMPLETED': 'Ukończone'
        };
        return statusMap[status] || status;
    }

    renderCharts() {
        const periodData = this.getDataForPeriod();
        
        this.renderActivityChart(periodData);
        this.renderScoreChart(periodData);
        this.renderDifficultyChart(periodData);
        this.renderDetailedStats(periodData);
    }

    renderActivityChart(periodData) {
        const ctx = document.getElementById('activityChart').getContext('2d');
        
        if (this.activityChart) {
            this.activityChart.destroy();
        }
        
        this.activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: periodData.labels,
                datasets: [{
                    label: 'Ukończone zadania',
                    data: periodData.completedTasks,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Liczba ukończonych zadań'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderScoreChart(periodData) {
        const ctx = document.getElementById('scoreChart').getContext('2d');
        
        if (this.scoreChart) {
            this.scoreChart.destroy();
        }
        
        this.scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: periodData.labels,
                datasets: [{
                    label: 'Średni wynik',
                    data: periodData.averageScores,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Średnie wyniki zadań'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderDifficultyChart(periodData) {
        const ctx = document.getElementById('difficultyChart').getContext('2d');
        
        if (this.difficultyChart) {
            this.difficultyChart.destroy();
        }
        
        const difficultyData = Object.values(periodData.difficultyDistribution);
        const difficultyLabels = Object.keys(periodData.difficultyDistribution).map(diff => 
            diff.charAt(0).toUpperCase() + diff.slice(1)
        );
        
        this.difficultyChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: difficultyLabels,
                datasets: [{
                    data: difficultyData,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',  
                        'rgba(255, 205, 86, 0.8)',  
                        'rgba(255, 99, 132, 0.8)'   
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Rozkład zadań według trudności'
                    }
                }
            }
        });
    }

    renderDetailedStats(periodData) {
        const tbody = document.getElementById('detailedStatsBody');
        
        // Sortuj statystyki według daty 
        const sortedStats = periodData.detailedStats.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        tbody.innerHTML = sortedStats.map(stat => `
            <tr>
                <td>${new Date(stat.date).toLocaleDateString('pl-PL')}</td>
                <td>${this.escapeHtml(stat.title)}</td>
                <td>
                    <span class="task-difficulty task-difficulty-${stat.difficulty}">
                        ${stat.difficulty}
                    </span>
                </td>
                <td>
                    <span class="score-badge score-${Math.floor(stat.score)}">
                        ${stat.score}/10
                    </span>
                </td>
                <td>${stat.timeSpent}</td>
                <td>${stat.attempts}</td>
                <td>
                    <span class="status-badge status-${stat.status.toLowerCase().replace(' ', '_')}">
                        ${stat.status}
                    </span>
                </td>
            </tr>
        `).join('');
        
        if (sortedStats.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-cell">
                        <i class="fas fa-chart-bar"></i>
                        <p>Brak danych dla wybranego okresu</p>
                    </td>
                </tr>
            `;
        }
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

    destroy() {
        if (this.activityChart) this.activityChart.destroy();
        if (this.scoreChart) this.scoreChart.destroy();
        if (this.difficultyChart) this.difficultyChart.destroy();
    }
}

// Inicjalizacja strony statystyk
export function setupStatisticsPage() {
    if (!document.querySelector('.statistics-container')) {
        return;
    }
    
    console.log('Inicjalizacja strony statystyk...');
    window.statisticsManager = new StatisticsManager();
}

// Czyszczenie przy opuszczeniu strony
window.addEventListener('beforeunload', () => {
    if (window.statisticsManager) {
        window.statisticsManager.destroy();
    }
});