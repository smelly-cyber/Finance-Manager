// Autofill budgets from last month
function lastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, end };
}

function calcLastMonthSpendByCategory() {
  const st = store.getState();
  const { start, end } = lastMonthRange();
  const map = {};
  st.transactions.forEach(t => {
    const d = new Date(t.date);
    if (t.type === "expense" && d >= start && d < end) {
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
  });
  return map;
}

function autofillBudgetsFromLastMonth() {
  const st = store.getState();
  const spend = calcLastMonthSpendByCategory();
  const before = JSON.parse(JSON.stringify(st.categories));
  st.categories = st.categories.map(c => ({ ...c, limit: spend[c.name] || c.limit || 0 }));
  store.setState(st);
  audit("autofill_budgets", "categories", before, st.categories);
  renderCategoryDropdowns();
  renderCategoryTableWithLimits();
  renderReports();
  showBanner("Budgets autofilled from last month", "info");
}

function setBudgetProgressBars() {
  // already shown in Category Limits table via percent column
  // hook exists for any extra UI
}
