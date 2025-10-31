// Expense forecast (3-month avg) + goal ETA
function forecastNextMonthExpense() {
  const st = store.getState();
  const { labels, data } = (function monthly() {
    const map = {};
    st.transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if (!map[key]) map[key] = { expense:0 };
      if (t.type === "expense") map[key].expense += t.amount;
    });
    const labels = Object.keys(map).sort();
    return { labels, data: labels.map(k => map[k]) };
  })();

  const last3 = data.slice(-3).map(x=>x.expense);
  const avg = last3.length ? last3.reduce((a,b)=>a+b,0)/last3.length : 0;
  return avg;
}

function predictGoalCompletion(goalId) {
  const st = store.getState();
  const g = st.goals.find(x => x.id === goalId);
  if (!g) return null;
  const acc = st.accounts.find(a => a.id === g.accountId);
  const bal = acc ? acc.balance : 0;
  const need = Math.max(0, g.target - bal);

  // monthly savings = avg of (income - expense) last 3 months
  const { values, avg } = (function savings3() {
    const map = {};
    st.transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if (!map[key]) map[key] = { inc:0, exp:0 };
      if (t.type === "income") map[key].inc += t.amount;
      else map[key].exp += t.amount;
    });
    const labels = Object.keys(map).sort();
    const vals = labels.map(k => map[k].inc - map[k].exp);
    const last3 = vals.slice(-3);
    const avg = last3.length ? last3.reduce((a,b)=>a+b,0)/last3.length : 0;
    return { values: last3, avg };
  })();

  if (avg <= 0) return { months: Infinity, etaText: "No positive savings trend" };
  const months = Math.ceil(need / avg);
  const eta = new Date(); eta.setMonth(eta.getMonth() + months);
  return { months, etaText: eta.toLocaleDateString() };
}
