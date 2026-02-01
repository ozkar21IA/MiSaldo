/**
 * app.js
 * Main application logic.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Init DB
    await db.init();

    // 2. Init Router
    router.init();

    // 3. Init App Logic
    initDashboard();
    initPlanning();
    initReports(); // New
    initForms();

    // Hide Loading
    document.getElementById('loading').style.display = 'none';
});

// --- DASHBOARD LOGIC ---
async function initDashboard() {
    const transactions = await db.getTransactions();

    let balUSD = 0;
    let balVES = 0;

    const listContainer = document.getElementById('dashboard-tx-list');
    listContainer.innerHTML = ''; // Request clear

    if (transactions.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-10 opacity-50">
                <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2"></i>
                <p>Sin movimientos aún</p>
            </div>`;
        lucide.createIcons();
    }

    transactions.forEach(tx => {
        // Calculate Balance
        if (tx.currency === 'USD') {
            balUSD += tx.type === 'income' ? tx.amount : -tx.amount;
        } else {
            balVES += tx.type === 'income' ? tx.amount : -tx.amount;
        }

        // Render Item
        const item = document.createElement('div');
        item.className = 'bg-gray-800/80 p-4 rounded-xl flex justify-between items-center border border-gray-700/50';
        item.onclick = "alert('Detalles en construcción')"; // Placeholder

        const isExpense = tx.type === 'expense';
        const iconColor = isExpense ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400';
        const icon = isExpense ? 'arrow-down' : 'arrow-up';
        const sign = isExpense ? '- ' : '+ ';
        const amountClass = isExpense ? 'text-gray-200' : 'text-emerald-400';

        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full ${iconColor} flex items-center justify-center">
                    <i data-lucide="${icon}" class="w-5 h-5"></i>
                </div>
                <div>
                    <h4 class="font-bold text-sm text-gray-200">${tx.category}</h4>
                    <p class="text-[10px] text-gray-500">${tx.date} • ${tx.description || ''}</p>
                </div>
            </div>
            <div class="text-right">
                <span class="block font-bold ${amountClass}">${sign}${formatCurrency(tx.amount)} ${tx.currency}</span>
            </div>
        `;
        listContainer.appendChild(item);
    });

    // Update Header
    document.getElementById('balance-usd').textContent = formatCurrency(balUSD);
    document.getElementById('balance-ves').textContent = formatCurrency(balVES);

    lucide.createIcons();
}

function initForms() {
    // Populate Categories
    const categories = ['Comida', 'Transporte', 'Servicios', 'Salud', 'Entretenimiento', 'Ropa', 'Sueldo', 'Ventas', 'Otros'];
    const select = document.getElementById('tx-category');
    categories.forEach(c => {
        const op = document.createElement('option');
        op.value = c;
        op.textContent = c;
        select.appendChild(op);
    });

    // Handle Submit
    document.getElementById('add-tx-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const newTx = {
            id: crypto.randomUUID(),
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            currency: document.getElementById('tx-currency').value,
            category: formData.get('category'),
            date: formData.get('date'),
            description: formData.get('description'),
            createdAt: new Date().toISOString()
        };

        await db.addTransaction(newTx);

        // Reset and Go Back
        e.target.reset();
        await initDashboard(); // Refresh data
        router.navigate('/');
    });

    // Set default date to today
    document.getElementById('tx-date').valueAsDate = new Date();
}

// Utils
function formatCurrency(val) {
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- PLANNING LOGIC ---
async function initPlanning() {
    // Current Month/Year
    const now = new Date();
    const month = now.getMonth() + 1; // 1-indexed for simple storage
    const year = now.getFullYear();

    // Display Month
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('plan-month-display').textContent = `${monthNames[month - 1]} ${year}`;

    // Fetch Plans
    const plans = await db.getPlans(month, year);

    const listEl = document.getElementById('planning-list');
    listEl.innerHTML = '';

    let totalUSD = 0;
    let totalVES = 0;

    if (plans.length === 0) {
        listEl.innerHTML = `<p class="text-center text-gray-500 text-sm py-4">No hay planes para este mes.</p>`;
    }

    plans.forEach(p => {
        // Calc Totals
        if (p.currency === 'USD') totalUSD += p.estimated_amount;
        else totalVES += p.estimated_amount;

        const item = document.createElement('div');
        item.className = `p-4 rounded-xl flex justify-between items-center border transition-all ${p.is_completed ? 'bg-gray-900 border-gray-800 opacity-60' : 'bg-gray-800 border-gray-700'}`;

        item.innerHTML = `
            <div class="flex items-center gap-3">
                <button onclick="togglePlan('${p.id}', ${!p.is_completed})" 
                    class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${p.is_completed ? 'bg-violet-500 border-violet-500 text-white' : 'border-gray-500 text-transparent hover:border-violet-400'}">
                    <i data-lucide="check" class="w-3 h-3"></i>
                </button>
                <div>
                    <h4 class="font-bold text-sm text-gray-200 ${p.is_completed ? 'line-through text-gray-500' : ''}">${p.description}</h4>
                    <p class="text-[10px] text-gray-500">${p.category}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                 <span class="font-bold text-sm ${p.is_completed ? 'text-gray-500' : 'text-violet-400'}">
                    ${formatCurrency(p.estimated_amount)} ${p.currency}
                </span>
                <button onclick="deletePlan('${p.id}')" class="text-gray-600 hover:text-red-400">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        listEl.appendChild(item);
    });

    document.getElementById('plan-total-usd').textContent = formatCurrency(totalUSD);
    document.getElementById('plan-total-ves').textContent = formatCurrency(totalVES);

    lucide.createIcons();
}

async function togglePlan(id, status) {
    await db.updatePlanStatus(id, status);
    await initPlanning();
}

async function deletePlan(id) {
    if (confirm('¿Borrar este plan?')) {
        await db.deletePlan(id);
        await initPlanning();
    }
}

// Attach Plan Form Listener
// Note: This needs to be guarded because initPlanning is called multiple times but listener should be once.
// Or we can move it to initForms or check if added.
// For simplicity, I'll move it mainly to global scope but outside init. Or just ensure initForms() calls it.
// Actually, simple way:
if (document.getElementById('add-plan-form')) {
    document.getElementById('add-plan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const now = new Date();

        const plan = {
            id: crypto.randomUUID(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            description: formData.get('description'),
            estimated_amount: parseFloat(formData.get('amount')),
            currency: formData.get('currency'),
            category: formData.get('category'),
            is_completed: false,
            createdAt: new Date().toISOString()
        };

        await db.addPlan(plan);
        e.target.reset();
        document.getElementById('addPlanModal').close();
        await initPlanning();
    });
}

// Update initForms to populate plan categories too
(function updatePlanCategories() {
    const categories = ['Comida', 'Transporte', 'Servicios', 'Salud', 'Entretenimiento', 'Ropa', 'Sueldo', 'Ventas', 'Otros'];
    const select = document.getElementById('plan-category');
    if (select) {
        categories.forEach(c => {
            const op = document.createElement('option');
            op.value = c;
            op.textContent = c;
            select.appendChild(op);
        });
    }
})();

// --- REPORTS LOGIC ---
let currentReportDate = new Date();
let chartExpensesUSD = null;
let chartExpensesVES = null;

async function initReports() {
    const month = currentReportDate.getMonth(); // 0-indexed
    const year = currentReportDate.getFullYear();

    // Display Month
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('report-month-display').textContent = \\ \\;

    // Fetch All Transactions (DB currently doesn't have by-month range query, so filter in JS)
    // Optimization: Add getTransactionsByMonth in db.js later. For MVP (local DB small data), filtering all is fine.
    const allTx = await db.getTransactions();

    // Filter
    const monthTx = allTx.filter(tx => {
        try {
            const d = new Date(tx.date);
            // Handle day mismatch due to timezone if string is YYYY-MM-DD
            // Actually tx.date is usually YYYY-MM-DD string.
            // Let's parse strictly.
            const parts = tx.date.split('-');
            if (parts.length < 3) return false;
            return parseInt(parts[0]) === year && parseInt(parts[1]) === (month + 1);
        } catch (e) { return false; }
    });

    // Calculate Totals
    let incomeUSD = 0;
    let incomeVES = 0;
    let expenseUSD = 0;
    let expenseVES = 0;

    const catExpenseUSD = {};
    const catExpenseVES = {};

    monthTx.forEach(tx => {
        if (tx.type === 'income') {
            if (tx.currency === 'USD') incomeUSD += tx.amount;
            else incomeVES += tx.amount;
        } else {
            if (tx.currency === 'USD') {
                expenseUSD += tx.amount;
                catExpenseUSD[tx.category] = (catExpenseUSD[tx.category] || 0) + tx.amount;
            } else {
                expenseVES += tx.amount;
                catExpenseVES[tx.category] = (catExpenseVES[tx.category] || 0) + tx.amount;
            }
        }
    });

    document.getElementById('report-income-usd').textContent = formatCurrency(incomeUSD);
    document.getElementById('report-income-ves').textContent = formatCurrency(incomeVES);
    document.getElementById('report-expense-usd').textContent = formatCurrency(expenseUSD);
    document.getElementById('report-expense-ves').textContent = formatCurrency(expenseVES);

    renderCharts(catExpenseUSD, catExpenseVES);
}

function changeReportMonth(delta) {
    currentReportDate.setMonth(currentReportDate.getMonth() + delta);
    initReports();
}

function renderCharts(dataUSD, dataVES) {
    // USD Chart
    const ctxUSD = document.getElementById('chart-expenses-usd');
    if (chartExpensesUSD) chartExpensesUSD.destroy();

    chartExpensesUSD = new Chart(ctxUSD, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dataUSD),
            datasets: [{
                data: Object.values(dataUSD),
                backgroundColor: ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af', boxWidth: 10, font: { size: 10 } } }
            }
        }
    });

    // VES Chart
    const ctxVES = document.getElementById('chart-expenses-ves');
    if (chartExpensesVES) chartExpensesVES.destroy();

    chartExpensesVES = new Chart(ctxVES, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dataVES),
            datasets: [{
                data: Object.values(dataVES),
                backgroundColor: ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af', boxWidth: 10, font: { size: 10 } } }
            }
        }
    });
}

