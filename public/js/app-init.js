import DeadlockAPIService from './deadlock-api-service.js';

window.DeadlockAPIService = DeadlockAPIService;
window.apiService = new DeadlockAPIService();
window.dispatchEvent(new CustomEvent('apiServiceReady'));

if (window.innerWidth <= 768 || 'ontouchstart' in window) {
    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;

    document.addEventListener('touchstart', (event) => {
        startY = event.touches[0].clientY;
    });

    document.addEventListener('touchmove', (event) => {
        if (window.scrollY === 0 && !isRefreshing) {
            currentY = event.touches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > 80) {
                document.body.style.background = 'linear-gradient(180deg, var(--accent), var(--bg-primary))';
            }
        }
    });

    document.addEventListener('touchend', () => {
        if (window.scrollY === 0 && currentY - startY > 120 && !isRefreshing) {
            isRefreshing = true;

            if (window.currentSection === 'item-stats') {
                setTimeout(() => {
                    window.loadItemStats();
                    document.body.style.background = 'var(--bg-primary)';
                    isRefreshing = false;
                }, 500);
            }
        } else {
            document.body.style.background = 'var(--bg-primary)';
        }

        startY = 0;
        currentY = 0;
    });
}
