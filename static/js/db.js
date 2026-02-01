/**
 * db.js
 * IndexedDB Wrapper for MiSaldo offline storage.
 * Handles Transactions, Plans, and User Settings.
 */

const DB_NAME = 'MiSaldoDB';
const DB_VERSION = 1;

class LocalDB {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject("Could not open DB");
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Transactions Store
                if (!db.objectStoreNames.contains('transactions')) {
                    const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
                    txStore.createIndex('date', 'date', { unique: false });
                    txStore.createIndex('type', 'type', { unique: false });
                }

                // Plans Store
                if (!db.objectStoreNames.contains('plans')) {
                    const planStore = db.createObjectStore('plans', { keyPath: 'id' });
                    planStore.createIndex('month_year', ['month', 'year'], { unique: false });
                }

                // Settings/User Store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("IndexedDB Initialized");
                resolve(this.db);
            };
        });
    }

    // --- GENERIC HELPER ---
    async getStore(storeName, mode = 'readonly') {
        if (!this.db) await this.init();
        return this.db.transaction(storeName, mode).objectStore(storeName);
    }

    // --- TRANSACTIONS ---
    async addTransaction(tx) {
        const store = await this.getStore('transactions', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(tx); // put allows update if id exists
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getTransactions() {
        const store = await this.getStore('transactions', 'readonly');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                // Sort by date desc by default
                const res = request.result;
                res.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(res);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTransaction(id) {
        const store = await this.getStore('transactions', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // --- PLANS ---
    async getPlans(month, year) {
        const store = await this.getStore('plans', 'readonly');
        return new Promise((resolve, reject) => {
            const index = store.index('month_year');
            const request = index.getAll([month, year]);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async addPlan(plan) {
        const store = await this.getStore('plans', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(plan);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updatePlanStatus(id, is_completed) {
        const store = await this.getStore('plans', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                const plan = request.result;
                if (plan) {
                    plan.is_completed = is_completed;
                    store.put(plan).onsuccess = () => resolve(true);
                } else resolve(false);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deletePlan(id) {
        const store = await this.getStore('plans', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // --- SETTINGS ---
    async getSetting(key) {
        const store = await this.getStore('settings', 'readonly');
        return new Promise((resolve) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => resolve(null);
        });
    }

    async setSetting(key, value) {
        const store = await this.getStore('settings', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

// Export global instance
const db = new LocalDB();
