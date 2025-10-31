const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const importFileInput = document.getElementById("importFileInput");
const importBtn = document.getElementById("importBtn");

// chart export buttons (attach to canvases)
function exportChartPng(canvasId, filename) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const url = c.toDataURL("image/png");
  downloadFile(url, filename);
}

function attachChartExportButtons() {
  const map = {
    pieCategoryChart: "spending-by-category.png",
    lineTrendChart: "spending-trend.png",
    barIncomeExpenseChart: "income-vs-expenses.png",
    lineNetWorthChart: "net-worth.png",
    budgetVsActualChart: "budget-vs-actual.png",
    cashflowChart: "cashflow.png",
    netWorthProjectionChart: "net-worth-projection.png",
    incomeSourceChart: "income-sources.png"
  };
  Object.entries(map).forEach(([id, name]) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (canvas.nextElementSibling?.classList?.contains("chart-export")) return;
    const btn = document.createElement("button");
    btn.className = "btn inline primary chart-export";
    btn.textContent = "Export PNG";
    btn.addEventListener("click", ()=>exportChartPng(id, name));
    canvas.parentElement.appendChild(btn);
  });
}

// backups: keep last N snapshots in localStorage
function scheduleBackupIfDue() {
  const key = k("lastBackupTs");
  const last = parseInt(localStorage.getItem(key) || "0", 10);
  const now = Date.now();
  const ONE_DAY = 86400000;
  if (!last || now - last > ONE_DAY) {
    const data = store.getState();
    const blob = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    const backups = data.backups || [];
    const next = [{ ts: now, blob }, ...backups].slice(0, 7); // keep 7
    store.update({ backups: next });
    localStorage.setItem(key, String(now));
    showBanner("Backup created", "info");
  }
}

// export JSON (all data)
exportJsonBtn.addEventListener("click", () => {
  const data = store.getState();
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"}));
  downloadFile(url, "budget-data.json");
});

// export CSV (transactions only)
exportCsvBtn.addEventListener("click", () => {
  const { transactions } = store.getState();
  const header = ["id","name","amount","type","accountId","category","date"];
  const rows = transactions.map(t => [
    t.id, t.name.replace(/"/g,'""'), t.amount, t.type, t.accountId, t.category.replace(/"/g,'""'), t.date
  ]);
  const csv = [header.join(","), ...rows.map(r => r.map(x=>`"${x}"`).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  downloadFile(url, "transactions.csv");
});

function downloadFile(url, filename) {
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

// import (JSON or bank CSV auto-map)
importBtn.addEventListener("click", async () => {
  const file = importFileInput.files[0];
  if (!file) { alert("Choose a file"); return; }
  const text = await file.text();

  if (file.name.endsWith(".json")) {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data.accounts)) throw new Error();
      const before = store.getState();
      store.setState(data);
      audit("import_json", "accounts", before.accounts, data.accounts);
      recordNetWorthSnapshot();
      fullRender();
      alert("Import complete");
    } catch { alert("Bad JSON"); }
  } else if (file.name.endsWith(".csv")) {
    const txs = parseBankCsv(text);
    const st = store.getState();
    const before = st.transactions.slice();
    st.transactions = txs;
    store.setState(st);
    audit("import_csv", "transaction", before, st.transactions);
    recordNetWorthSnapshot();
    fullRender();
    alert("Import complete (transactions replaced)");
  } else { alert("Unsupported file"); }
});

// naive bank CSV parser + auto-map
function parseBankCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]).map(s => s.toLowerCase());
  // common names
  const idx = {
    date: headers.findIndex(h => /(date)/.test(h)),
    desc: headers.findIndex(h => /(description|details|narration|memo|payee)/.test(h)),
    amount: headers.findIndex(h => /(amount|amt|value)/.test(h)),
    type: headers.findIndex(h => /(type|dr|cr|debit|credit)/.test(h)),
    account: headers.findIndex(h => /(account|acct|account id|iban)/.test(h)),
    category: headers.findIndex(h => /(category)/.test(h))
  };

  const st = store.getState();
  const firstAccount = st.accounts[0]?.id;

  const out = [];
  for (let i=1;i<lines.length;i++) {
    const cols = splitCsvLine(lines[i]);
    const rawAmount = parseFloat(cols[idx.amount] || "0");
    const rawType = (cols[idx.type] || "").toLowerCase();
    const type = rawType.includes("cr") || rawType.includes("credit") || rawAmount > 0 ? "income" : "expense";
    const amount = Math.abs(rawAmount);
    const name = cols[idx.desc] || "Imported";
    const accountId = cols[idx.account] || firstAccount || "";
    const category = cols[idx.category] || "uncategorized";
    out.push({
      id: crypto.randomUUID(),
      name,
      amount,
      type,
      accountId,
      category,
      date: new Date(cols[idx.date] || Date.now()).toISOString()
    });
  }
  return out;
}
function splitCsvLine(line) {
  const out = []; let cur = ""; let q = false;
  for (let i=0;i<line.length;i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i+1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (ch === "," && !q) { out.push(cur); cur=""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// run once on load
window.addEventListener("load", () => {
  scheduleBackupIfDue();
  setTimeout(attachChartExportButtons, 400);
});
