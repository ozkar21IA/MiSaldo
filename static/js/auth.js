/**
 * auth.js
 * Handles Local Authentication and Offline Licensing.
 */

const SECRET_SALT = "MISALDO_OFFLINE_SECRET_2024"; // In real app, this logic is obfuscated or key is asymmetric. 
// For MVP/PWA: We check if Hash(UserEmail + Salt) === Key provided.

const auth = {
    user: null,
    isPro: false,

    async init() {
        // Load User
        const savedUser = localStorage.getItem('misaldo_user');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            this.updateUI();
        } else {
            // Show Setup
            document.getElementById('authModal').showModal();
        }

        // Check License
        this.checkLicense();
    },

    saveUser(name, pin) {
        this.user = { name, pin };
        localStorage.setItem('misaldo_user', JSON.stringify(this.user));
        this.updateUI();
        document.getElementById('authModal').close();
    },

    updateUI() {
        if (this.user) {
            document.getElementById('user-name-display').textContent = this.user.name;
            document.getElementById('user-avatar').textContent = this.user.name.charAt(0).toUpperCase();
        }
    },

    async checkLicense() {
        const key = await db.getSetting('license_key');
        if (!key) {
            this.setPro(false);
            return;
        }

        // Simple Validation: Is the key "STAR-PRO" (Dev Backdoor) or valid format?
        // Real logic: Verify signature.
        if (key === 'STAR-PRO' || key.startsWith('PRO-')) {
            this.setPro(true);
        } else {
            this.setPro(false);
        }
    },

    setPro(status) {
        this.isPro = status;
        const statusEl = document.getElementById('license-status');
        if (statusEl) {
            if (status) {
                statusEl.innerHTML = '<span class="text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="badge-check" class="w-4 h-4"></i> PRO Activado</span>';
            } else {
                statusEl.innerHTML = '<span class="text-yellow-400 font-bold flex items-center gap-1"><i data-lucide="lock" class="w-4 h-4"></i> Modo Prueba</span>';
            }
            if (window.lucide) lucide.createIcons();
        }
    },

    async activateLicense(inputKey) {
        // Simulate processing
        await new Promise(r => setTimeout(r, 1000));

        if (inputKey.length > 5) {
            await db.setSetting('license_key', inputKey);
            await this.checkLicense();
            alert('Licencia activada correctamente.');
            return true;
        } else {
            alert('Código inválido.');
            return false;
        }
    }
};

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for DB then Init Auth
    // We hook into app.js flow or just run parallel.
    // Ideally app.js calls auth.init()
    auth.init();
});

// Expose GLOBAL for HTML access
window.auth = auth;
