let pieCategoryChart,
    lineTrendChart,
    barIncomeExpenseChart,
    lineNetWorthChart;

function renderCharts() {
  const st = store.getState();
  const now = new Date();
  const monthStart = startOfMonthISO(now);

  // category pie (this month)
  const monthTx = st.transactions.filter(t => new Date(t.date) >= new Date(monthStart));
  const catMap = {};
  monthTx.forEach(t => {
    if (t.type === "expense") {
      if (!catMap[t.category]) catMap[t.category] = 0;
      catMap[t.category] += t.amount;
    }
  });

  const catLabels = Object.keys(catMap);
  const catData = Object.values(catMap);

  if (pieCategoryChart) pieCategoryChart.destroy();
  pieCategoryChart = new Chart(document.getElementById("pieCategoryChart"), {
    type: "pie",
    data: {
      labels: catLabels,
      datasets: [{
        data: catData,
        backgroundColor: [
          "#007bff","#ff6384","#36a2eb","#ffce56","#4bc0c0","#dc3545","#8b5cf6"
        ]
      }]
    }
  });

  // spending trend line (by day)
  const dailyMap = {};
  st.transactions.forEach(t => {
    const dayKey = new Date(t.date).toISOString().slice(0,10);
    if (!dailyMap[dayKey]) dailyMap[dayKey] = { expense:0 };
    if (t.type === "expense") {
      dailyMap[dayKey].expense += t.amount;
    }
  });
  const trendLabels = Object.keys(dailyMap).sort();
  const trendData = trendLabels.map(day => dailyMap[day].expense);

  if (lineTrendChart) lineTrendChart.destroy();
  lineTrendChart = new Chart(document.getElementById("lineTrendChart"), {
    type: "line",
    data: {
      labels: trendLabels,
      datasets: [{
        label: "Daily Spend",
        data: trendData,
        borderColor: "#dc3545",
        backgroundColor: "rgba(220,53,69,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive: true }
  });

  // income vs expenses bar (by month)
  const monthAgg = {};
  st.transactions.forEach(t => {
    const d = new Date(t.date);
    const key = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
    if (!monthAgg[key]) monthAgg[key] = { income:0, expense:0 };
    if (t.type === "income") monthAgg[key].income += t.amount;
    else monthAgg[key].expense += t.amount;
  });

  const barLabels = Object.keys(monthAgg).sort();
  const incomeData = barLabels.map(m => monthAgg[m].income);
  const expenseData = barLabels.map(m => monthAgg[m].expense);

  if (barIncomeExpenseChart) barIncomeExpenseChart.destroy();
  barIncomeExpenseChart = new Chart(document.getElementById("barIncomeExpenseChart"), {
    type: "bar",
    data: {
      labels: barLabels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          backgroundColor: "#007bff"
        },
        {
          label: "Expenses",
          data: expenseData,
          backgroundColor: "#dc3545"
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });

  // net worth line (USD)
  const hist = st.netWorthHistory.slice().sort((a,b) => new Date(a.date)-new Date(b.date));
  const nwLabels = hist.map(h => h.date);
  const nwData = hist.map(h => h.netWorthUSD);

  if (lineNetWorthChart) lineNetWorthChart.destroy();
  lineNetWorthChart = new Chart(document.getElementById("lineNetWorthChart"), {
    type: "line",
    data: {
      labels: nwLabels,
      datasets: [{
        label: "Net Worth (USD)",
        data: nwData,
        borderColor: "#36a2eb",
        backgroundColor: "rgba(54,162,235,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive: true }
  });
}
