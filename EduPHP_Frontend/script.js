// Sprawdź zapisany motyw PRZED renderowaniem strony
        (function() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme === 'auto' ? (prefersDark ? 'dark' : 'light') : savedTheme;
            
            document.documentElement.setAttribute('data-theme', theme);
            
            // Dodaj klasę dla płynnego przejścia po załadowaniu
            document.addEventListener('DOMContentLoaded', function() {
                document.body.style.transition = 'background-color 0.3s, color 0.3s';
            });
        })();