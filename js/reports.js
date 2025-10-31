const monthlySummaryEl = document.getElementById("monthlySummary");
const biggestExpensesListEl = document.getElementById("biggestExpensesList");

function getMonthlyData() {
  const { transactions, accounts } = store.getState();
  const now = new Date();
  const monthStart = startOfMonthISO(now);

  const monthTx = transactions.filter(t => {
    return new Date(t.date) >= new Date(monthStart);
  });

  // by category
  const spendByCat = {};
  // by account
  const spendByAccount = {};

  let monthIncome = 0;
  let monthExpense = 0;

  monthTx.forEach(tx => {
    if (tx.type === "income") {
      monthIncome += tx.amount;
    } else {
      monthExpense += tx.amount;
    }

    // category
    if (!spendByCat[tx.category]) spendByCat[tx.category] = 0;
    spendByCat[tx.category] += (tx.type === "expense" ? tx.amount : 0);

    // account
    const acc = accounts.find(a => a.id === tx.accountId);
    const accName = acc ? acc.name : "?";
    if (!spendByAccount[accName]) spendByAccount[accName] = 0;
    spendByAccount[accName] += (tx.type === "expense" ? tx.amount : 0);
  });

  const savings = monthIncome - monthExpense;

  return {
    monthTx,
    spendByCat,
    spendByAccount,
    monthIncome,
    monthExpense,
    savings
  };
}

function renderMonthlySummary() {
  const d = getMonthlyData();
  const accountLines = Object.entries(d.spendByAccount)
    .map(([acc, amt]) => `${acc}: ${fmt(amt)}`)
    .join("<br>");
  const categoryLines = Object.entries(d.spendByCat)
    .map(([cat, amt]) => `${cat}: ${fmt(amt)}`)
    .join("<br>");

  monthlySummaryEl.innerHTML = `
    <div><strong>Income this month:</strong> ${fmt(d.monthIncome)}</div>
    <div><strong>Expenses this month:</strong> ${fmt(d.monthExpense)}</div>
    <div><strong>Average Monthly Savings:</strong> ${fmt(d.savings)}</div>

    <span class="section-title">By Account (Expense)</span>
    <div>${accountLines || "No data"}</div>

    <span class="section-title">By Category (Expense)</span>
    <div>${categoryLines || "No data"}</div>
  `;
}

function renderBiggestExpenses() {
  const d = getMonthlyData();
  const { accounts } = store.getState();

  // only expense tx
  const expensesOnly = d.monthTx.filter(t => t.type === "expense");
  // sort desc by amount
  expensesOnly.sort((a,b) => b.amount - a.amount);

  biggestExpensesListEl.innerHTML = "";
  expensesOnly.slice(0,5).forEach(tx => {
    const acc = accounts.find(a => a.id === tx.accountId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${tx.name}</td>
      <td>${fmt(tx.amount)}</td>
      <td>${acc ? acc.name : "?"}</td>
    `;
    biggestExpensesListEl.appendChild(tr);
  });
}

function renderCategoryTableWithLimits() {
  const { categories, transactions } = store.getState();
  const categoriesListEl = document.getElementById("categoriesList");
  categoriesListEl.innerHTML = "";

  const now = new Date();
  const monthStart = startOfMonthISO(now);

  categories.forEach(cat => {
    // calc spent this month in this cat
    const spent = transactions
      .filter(t => t.type === "expense" && t.category === cat.name && new Date(t.date) >= new Date(monthStart))
      .reduce((sum,t)=>sum+t.amount,0);

    const pct = cat.limit > 0 ? (spent / cat.limit * 100) : 0;
    const warn = cat.limit > 0 && spent > cat.limit;

    const tr = document.createElement("tr");
    tr.dataset.id = cat.name;
    tr.innerHTML = `
      <td class="editable-cat" data-field="name">${cat.name}</td>
      <td>${fmt(spent)}</td>
      <td class="editable-cat" data-field="limit">${fmt(cat.limit)}</td>
      <td style="color:${warn? "var(--danger)": "var(--accent)"}">${pct.toFixed(0)}%</td>
      <td><button class="btn inline danger delete-cat">X</button></td>
    `;
    categoriesListEl.appendChild(tr);

    if (warn) {
      alert(`Category "${cat.name}" is over its limit for this month.`);
    }
  });
}

// inline edit and delete categories
document.getElementById("categoriesList").addEventListener("click", e => {
  const { categories } = store.getState();
  const rowId = e.target.closest("tr")?.dataset.id;
  if (!rowId) return;

  if (e.target.classList.contains("delete-cat")) {
    const idx = categories.findIndex(c => c.name === rowId);
    if (idx >= 0) {
      categories.splice(idx,1);
      store.update({ categories });
      renderCategoryDropdowns();
      renderCategoryTableWithLimits();
    }
  }

  if (e.target.classList.contains("editable-cat")) {
    const field = e.target.dataset.field;
    const idx = categories.findIndex(c => c.name === rowId);
    if (idx < 0) return;

    const oldVal = categories[idx][field];
    const newVal = prompt(`Edit ${field}`, oldVal);
    if (newVal === null) return;

    if (field === "limit") {
      const num = parseFloat(newVal);
      if (isNaN(num) || num < 0) return;
      categories[idx][field] = num;
    } else {
      // rename category
      const newName = newVal.trim();
      if (!newName) return;
      categories[idx][field] = newName;
      // also update all tx that used the old category
      const st = store.getState();
      st.transactions.forEach(t => {
        if (t.category === rowId) t.category = newName;
      });
      store.setState(st);
    }

    store.update({ categories });
    renderCategoryDropdowns();
    renderCategoryTableWithLimits();
    renderReports();
  }
});

// add / update category with limit
document.getElementById("addCategoryBtn").addEventListener("click", () => {
  const nameEl = document.getElementById("newCategoryName");
  const limitEl = document.getElementById("newCategoryLimit");
  const name = nameEl.value.trim();
  const limit = parseFloat(limitEl.value);

  if (!name || isNaN(limit) || limit < 0) return;

  const st = store.getState();
  const idx = st.categories.findIndex(c => c.name === name);
  if (idx >= 0) {
    st.categories[idx].limit = limit;
  } else {
    st.categories.push({ name, limit });
  }
  store.setState(st);

  nameEl.value = "";
  limitEl.value = "";

  renderCategoryDropdowns();
  renderCategoryTableWithLimits();
  renderReports();
});

// GOALS
const goalNameEl = document.getElementById("goalName");
const goalTargetEl = document.getElementById("goalTarget");
const addGoalBtn = document.getElementById("addGoalBtn");
const goalsListEl = document.getElementById("goalsList");

addGoalBtn.addEventListener("click", () => {
  const { goals } = store.getState();
  const name = goalNameEl.value.trim();
  const target = parseFloat(goalTargetEl.value);
  const accountId = document.getElementById("goalAccount").value;

  if (!name || isNaN(target) || target <= 0 || !accountId) return;

  goals.push({
    id: crypto.randomUUID(),
    name,
    target,
    accountId
  });

  store.update({ goals });
  goalNameEl.value = "";
  goalTargetEl.value = "";
  renderGoalsTable();
  renderReports();
});

goalsListEl.addEventListener("click", e => {
  const { goals } = store.getState();
  const rowId = e.target.closest("tr")?.dataset.id;
  if (!rowId) return;

  if (e.target.classList.contains("delete-goal")) {
    const idx = goals.findIndex(g => g.id === rowId);
    if (idx >= 0) {
      goals.splice(idx,1);
      store.update({ goals });
      renderGoalsTable();
      renderReports();
    }
  }

  if (e.target.classList.contains("editable-goal")) {
    const field = e.target.dataset.field;
    const idx = goals.findIndex(g => g.id === rowId);
    if (idx < 0) return;

    const oldVal = goals[idx][field];
    const newVal = prompt(`Edit ${field}`, oldVal);
    if (newVal === null) return;

    if (field === "target") {
      const num = parseFloat(newVal);
      if (isNaN(num) || num <= 0) return;
      goals[idx][field] = num;
    } else {
      goals[idx][field] = newVal.trim() || oldVal;
    }

    store.update({ goals });
    renderGoalsTable();
    renderReports();
  }
});

function renderGoalsTable() {
  const { goals, accounts } = store.getState();
  goalsListEl.innerHTML = "";
  goals.forEach(g => {
    const acc = accounts.find(a => a.id === g.accountId);
    const bal = acc ? acc.balance : 0;
    const pct = Math.min(100, (bal / g.target) * 100);

    const tr = document.createElement("tr");
    tr.dataset.id = g.id;
    tr.innerHTML = `
      <td class="editable-goal" data-field="name">${g.name}</td>
      <td>
        <div>${fmt(bal)} / ${fmt(g.target)}</div>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
      </td>
      <td class="editable-goal" data-field="target">${fmt(g.target)}</td>
      <td>${pct.toFixed(0)}%</td>
      <td><button class="btn inline danger delete-goal">X</button></td>
    `;
    goalsListEl.appendChild(tr);
  });
}

// make charts and insights
function renderReports() {
  // refresh monthly summary + biggest expenses
  renderMonthlySummary();
  renderBiggestExpenses();

  // refresh cats with limits
  renderCategoryTableWithLimits();

  // refresh goals table
  renderGoalsTable();

  // refresh charts
  renderCharts();
}
