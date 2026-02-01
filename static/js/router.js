/**
 * router.js
 * Simple client-side router for switching views.
 */

const router = {
    currentRoute: '/',

    routes: {
        '/': 'view-dashboard',
        '/planning': 'view-planning',
        '/reports': 'view-reports',
        '/transactions': 'view-dashboard', // Reuse dashboard but maybe scroll to list? For now just show dashboard.
        '/add-income': 'view-add-transaction',
        '/add-expense': 'view-add-transaction'
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Handle initial load
    },

    navigate(path) {
        // Simple hash routing
        window.location.hash = path;
    },

    back() {
        window.history.back();
    },

    handleRoute() {
        let hash = window.location.hash.slice(1) || '/';
        // Handle params if needed manually, for now exact match

        // Special logic for add transaction to set type
        if (hash === '/add-income') {
            this.setTransactionType('income');
            hash = '/add-income'; // normalize
        } else if (hash === '/add-expense') {
            this.setTransactionType('expense');
            hash = '/add-expense';
        }

        const viewId = this.routes[hash] || 'view-dashboard';
        this.showView(viewId);

        // Update Bottom Nav Active State
        document.querySelectorAll('.nav-item').forEach(el => {
            if (el.dataset.target === hash) {
                el.classList.add('text-teal-400');
                el.classList.remove('text-gray-500');
            } else {
                el.classList.remove('text-teal-400');
                el.classList.add('text-gray-500');
            }
        });
    },

    showView(viewId) {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            setTimeout(() => {
                if (!el.classList.contains('active')) el.style.display = 'none';
            }, 300); // Wait for fade out
        });

        const activeEl = document.getElementById(viewId);
        if (activeEl) {
            activeEl.style.display = 'block';
            // slight delay to allow display block to apply before opacity transition
            setTimeout(() => activeEl.classList.add('active'), 10);
        }
    },

    setTransactionType(type) {
        // Helper to update the form state based on route
        setTimeout(() => {
            const titleEl = document.getElementById('add-tx-title');
            const typeInput = document.getElementById('tx-type');

            if (type === 'income') {
                titleEl.textContent = 'Nuevo Ingreso';
                titleEl.classList.add('text-emerald-400');
                titleEl.classList.remove('text-rose-400');
                typeInput.value = 'income';
            } else {
                titleEl.textContent = 'Nuevo Gasto';
                titleEl.classList.add('text-rose-400');
                titleEl.classList.remove('text-emerald-400');
                typeInput.value = 'expense';
            }
        }, 50);
    }
};
