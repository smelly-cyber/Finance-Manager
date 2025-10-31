// On-screen banner + optional Web Notifications
const bannerHost = document.createElement("div");
bannerHost.id = "bannerHost";
bannerHost.style.position = "fixed";
bannerHost.style.top = "12px";
bannerHost.style.right = "12px";
bannerHost.style.zIndex = "9999";
document.body.appendChild(bannerHost);

function showBanner(msg, level = "info", timeoutMs = 5000) {
  const div = document.createElement("div");
  div.style.minWidth = "280px";
  div.style.marginBottom = "10px";
  div.style.padding = "12px 14px";
  div.style.borderRadius = "8px";
  div.style.border = "1px solid var(--border-color)";
  div.style.background = level === "danger" ? "var(--danger)" :
                         level === "warn" ? "#f59e0b" : "var(--accent)";
  div.style.color = "#fff";
  div.textContent = msg;
  bannerHost.appendChild(div);
  setTimeout(()=>div.remove(), timeoutMs);
}

async function requestNotifyPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch {}
  }
}

function notify(msg) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") new Notification(msg);
}

// Checks
function checkCategoryLimits() {
  const st = store.getState();
  const start = startOfMonthISO();
  st.categories.forEach(cat => {
    const spent = st.transactions
      .filter(t => t.type === "expense" && t.category === cat.name && new Date(t.date) >= new Date(start))
      .reduce((s,t)=>s+t.amount,0);
    if (cat.limit > 0 && spent > cat.limit) {
      const m = `Over budget: ${cat.name} (${fmt(spent)} > ${fmt(cat.limit)})`;
      showBanner(m, "danger");
      notify(m);
    }
  });
}

function checkRecurringDueTomorrow() {
  const st = store.getState();
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate()+1);
  st.recurring.forEach(r => {
    const d = new Date(r.nextDate);
    const isTomorrow = d.getFullYear()===tomorrow.getFullYear() && d.getMonth()===tomorrow.getMonth() && d.getDate()===tomorrow.getDate();
    if (isTomorrow) {
      const m = `Recurring ${r.type}: ${r.name} due tomorrow`;
      showBanner(m, "warn");
      notify(m);
    }
  });
}

function checkGoalsNear() {
  const st = store.getState();
  st.goals.forEach(g => {
    const acc = st.accounts.find(a => a.id === g.accountId);
    const bal = acc ? acc.balance : 0;
    const pct = g.target > 0 ? (bal / g.target) * 100 : 0;
    if (pct >= 90 && pct < 100) {
      const m = `Goal near: ${g.name} at ${pct.toFixed(0)}%`;
      showBanner(m, "info");
      notify(m);
    }
  });
}

function runNotifyChecks() {
  requestNotifyPermission();
  checkCategoryLimits();
  checkRecurringDueTomorrow();
  checkGoalsNear();
}
