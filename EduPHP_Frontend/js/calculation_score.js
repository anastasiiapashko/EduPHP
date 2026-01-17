export class ScoreCalculator {
    constructor() {
        this.maxAttempts = 10;
        this.maxTimeMinutes = 30;
        this.timeWeight = 0.7;  // Waga czasu - 70%
        this.attemptsWeight = 0.3; // Waga prób - 30%
    }

    /**
     * Oblicza wynik na podstawie czasu i liczby prób
     * @param {number} timeSpentMinutes - Czas spędzony w minutach
     * @param {number} attempts - Liczba prób
     * @returns {number} Wynik od 0 do 10
     */
    calculateScore(timeSpentMinutes, attempts) {
        // Normalizacja czasu (0-1, gdzie 1 = najlepszy czas)
        const normalizedTime = this.normalizeTime(timeSpentMinutes);
        
        // Normalizacja prób (0-1, gdzie 1 = najmniej prób)
        const normalizedAttempts = this.normalizeAttempts(attempts);
        
        // Obliczenie wyniku z wagami
        const score = (normalizedTime * this.timeWeight) + (normalizedAttempts * this.attemptsWeight);
        
        // Skalowanie do 0-10 i zaokrąglenie
        return Math.round(score * 10 * 100) / 100;
    }

    // Normalizuje czas (im krótszy czas, tym lepszy wynik)
    normalizeTime(timeSpentMinutes) {
        if (timeSpentMinutes <= 0) return 1.0;
        if (timeSpentMinutes >= this.maxTimeMinutes) return 0.0;
        
        // Funkcja wykładnicza - nagroda za bardzo szybkie rozwiązanie
        const normalized = 1 - Math.pow(timeSpentMinutes / this.maxTimeMinutes, 0.7);
        return Math.max(0, Math.min(1, normalized));
    }

    //Normalizuje liczbę prób (im mniej prób, tym lepszy wynik)
     
    normalizeAttempts(attempts) {
        if (attempts <= 1) return 1.0;
        if (attempts >= this.maxAttempts) return 0.0;
        
        // Funkcja liniowa z lekkim wygładzeniem
        const normalized = 1 - (attempts - 1) / (this.maxAttempts - 1);
        return Math.max(0, Math.min(1, normalized));
    }

       // Oblicza czas spędzony między startem a ukończeniem
    calculateTimeSpent(startDate, completionDate) {
        if (!startDate || !completionDate) return 0;
        
        const start = new Date(startDate);
        const completion = new Date(completionDate);
        const diffMs = completion - start;
        
        return Math.max(0, Math.round(diffMs / (1000 * 60))); // minuty
    }

    
     // Zwraca szczegółową analizę wyniku
     
    getScoreAnalysis(timeSpentMinutes, attempts) {
        const score = this.calculateScore(timeSpentMinutes, attempts);
        const timeScore = this.normalizeTime(timeSpentMinutes) * this.timeWeight * 10;
        const attemptsScore = this.normalizeAttempts(attempts) * this.attemptsWeight * 10;
        
        return {
            totalScore: score,
            timeScore: Math.round(timeScore * 100) / 100,
            attemptsScore: Math.round(attemptsScore * 100) / 100,
            timeSpent: timeSpentMinutes,
            attempts: attempts,
            maxPossibleScore: 10
        };
    }
}
