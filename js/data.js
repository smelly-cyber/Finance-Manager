// ===============================
// Currency system (base: AUD)
// ===============================
const CURRENCY_RATES = {
  AUD: 1,
  USD: 1.52,   // 1 USD -> 1.52 AUD
  EUR: 1.66,   // 1 EUR -> 1.66 AUD
  JPY: 0.010   // 1 JPY -> 0.010 AUD
};

function toAUD(amount, currency) {
  const rate = CURRENCY_RATES[currency] || 1;
  return amount * rate;
}
function fromAUD(amountAUD, currency) {
  const rate = CURRENCY_RATES[currency] || 1;
  return amountAUD / rate;
}
function convertCurrency(amount, from, to) {
  if (from === to) return amount;
  return fromAUD(toAUD(amount, from), to);
}

function fmt(amount, currency = "AUD") {
  const cur = ["AUD","USD","EUR","JPY"].includes(currency) ? currency : "AUD";
  const locale =
    cur === "JPY" ? "ja-JP" :
    cur === "EUR" ? "de-DE" :
    cur === "USD" ? "en-US" : "en-AU";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: cur,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// ===============================
// Profile-aware storage
// ===============================
const DEFAULT_PROFILES = ["Personal","Work","Shared Household"];
function currentProfile() {
  return localStorage.getItem("currentProfile") || "Personal";
}
function setCurrentProfile(name) {
  localStorage.setItem("currentProfile", name);
}
function k(key) {
  return `${currentProfile()}::${key}`;
}

// ===============================
// Data model and persistence
// ===============================
const store = {
  getState() {
    return {
      accounts: JSON.parse(localStorage.getItem(k("accounts")) || "[]"),
      transactions: JSON.parse(localStorage.getItem(k("transactions")) || "[]"),
      categories: JSON.parse(localStorage.getItem(k("categories")) || "[]"), // {name, limit:number}
      goals: JSON.parse(localStorage.getItem(k("goals")) || "[]"),
      recurring: JSON.parse(localStorage.getItem(k("recurring")) || "[]"),
      netWorthHistory: JSON.parse(localStorage.getItem(k("netWorthHistory")) || "[]"),
      auditLog: JSON.parse(localStorage.getItem(k("auditLog")) || "[]"), // [{id,ts,action,entity,before,after}]
      backups: JSON.parse(localStorage.getItem(k("backups")) || "[]") // [{ts, blob} as dataURL/JSON]
    };
  },
  setState(next) {
    localStorage.setItem(k("accounts"), JSON.stringify(next.accounts));
    localStorage.setItem(k("transactions"), JSON.stringify(next.transactions));
    localStorage.setItem(k("categories"), JSON.stringify(next.categories));
    localStorage.setItem(k("goals"), JSON.stringify(next.goals));
    localStorage.setItem(k("recurring"), JSON.stringify(next.recurring));
    localStorage.setItem(k("netWorthHistory"), JSON.stringify(next.netWorthHistory));
    localStorage.setItem(k("auditLog"), JSON.stringify(next.auditLog));
    localStorage.setItem(k("backups"), JSON.stringify(next.backups));
  },
  update(partial) {
    const curr = this.getState();
    this.setState({ ...curr, ...partial });
  }
};

// ===============================
// Helpers
// ===============================
function nowISO() { return new Date().toISOString(); }
function startOfMonthISO(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); }
function sameMonth(aISO, bISO) {
  const a = new Date(aISO), b = new Date(bISO);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// ===============================
// Audit log
// ===============================
function audit(action, entity, before, after) {
  const st = store.getState();
  const entry = {
    id: crypto.randomUUID(),
    ts: nowISO(),
    action, entity, before, after
  };
  const log = [entry, ...st.auditLog].slice(0, 100); // keep last 100
  store.update({ auditLog: log });
  return entry.id;
}
function undoAudit(id) {
  const st = store.getState();
  const idx = st.auditLog.findIndex(e => e.id === id);
  if (idx < 0) return false;
  const entry = st.auditLog[idx];

  // naive apply "before" as full-state patches for entity types
  if (entry.entity === "transaction") {
    st.transactions = entry.before;
  } else if (entry.entity === "accounts") {
    st.accounts = entry.before;
  } else if (entry.entity === "categories") {
    st.categories = entry.before;
  } else if (entry.entity === "goals") {
    st.goals = entry.before;
  } else if (entry.entity === "recurring") {
    st.recurring = entry.before;
  }
  // remove the undo entry
  st.auditLog.splice(idx,1);
  store.setState(st);
  return true;
}

// ===============================
// Net worth tracking (AUD base)
// ===============================
function recordNetWorthSnapshot() {
  const state = store.getState();
  const totalAUD = state.accounts.reduce((sum, acc) => sum + toAUD(acc.balance, acc.currency), 0);
  const todayKey = new Date().toISOString().slice(0,10);
  const hist = state.netWorthHistory.slice();
  const i = hist.findIndex(h => h.date === todayKey);
  if (i >= 0) hist[i].netWorthAUD = totalAUD;
  else hist.push({ date: todayKey, netWorthAUD: totalAUD });
  store.update({ netWorthHistory: hist });
}
