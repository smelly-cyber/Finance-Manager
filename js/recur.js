const recurringNameEl = document.getElementById("recurringName");
const recurringAmountEl = document.getElementById("recurringAmount");
const recurringAccountEl = document.getElementById("recurringAccount");
const recurringCategoryEl = document.getElementById("recurringCategory");
const recurringTypeEl = document.getElementById("recurringType");
const recurringFreqEl = document.getElementById("recurringFreq");
const addRecurringBtn = document.getElementById("addRecurringBtn");
const recurringListEl = document.getElementById("recurringList");

// add recurring rule
addRecurringBtn.addEventListener("click", () => {
  const { recurring } = store.getState();
  const name = recurringNameEl.value.trim();
  const amount = parseFloat(recurringAmountEl.value);
  const accountId = recurringAccountEl.value;
  const category = recurringCategoryEl.value || "uncategorized";
  const type = recurringTypeEl.value;
  const freq = recurringFreqEl.value;

  if (!name || !accountId || isNaN(amount) || amount <= 0) return;

  const nextDate = computeNextDate(freq);

  recurring.push({
    id: crypto.randomUUID(),
    name,
    amount,
    accountId,
    category,
    type,
    freq,
    nextDate
  });

  store.update({ recurring });
  recurringNameEl.value = "";
  recurringAmountEl.value = "";
  renderRecurringTable();
});

// compute nextDate from now
function computeNextDate(freq, baseDate) {
  const d = baseDate ? new Date(baseDate) : new Date();
  if (freq === "weekly") {
    d.setDate(d.getDate() + 7);
  } else {
    // monthly
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

// run recurring due items
function applyRecurring() {
  const st = store.getState();
  const now = new Date();

  let changed = false;

  st.recurring.forEach(rule => {
    const due = new Date(rule.nextDate);
    if (now >= due) {
      // apply transaction same as manual add
      const accIdx = st.accounts.findIndex(a => a.id === rule.accountId);
      if (accIdx < 0) return;

      if (rule.type === "income") {
        st.accounts[accIdx].balance += rule.amount;
      } else {
        if (st.accounts[accIdx].balance >= rule.amount) {
          st.accounts[accIdx].balance -= rule.amount;
        } else {
          // skip if not enough funds
          return;
        }
      }

      st.transactions.push({
        id: crypto.randomUUID(),
        name: rule.name,
        amount: rule.amount,
        type: rule.type,
        accountId: rule.accountId,
        category: rule.category,
        date: nowISO()
      });

      // set nextDate forward
      rule.nextDate = computeNextDate(rule.freq, now).toString();
      changed = true;
    }
  });

  if (changed) {
    store.setState(st);
    recordNetWorthSnapshot();
  }
}

recurringListEl.addEventListener("click", e => {
  const { recurring } = store.getState();
  const rowId = e.target.closest("tr")?.dataset.id;
  if (!rowId) return;

  if (e.target.classList.contains("delete-recurring")) {
    const idx = recurring.findIndex(r => r.id === rowId);
    if (idx >= 0) {
      recurring.splice(idx, 1);
      store.update({ recurring });
      renderRecurringTable();
    }
  }

  if (e.target.classList.contains("editable-recurring")) {
    const field = e.target.dataset.field;
    const idx = recurring.findIndex(r => r.id === rowId);
    if (idx < 0) return;
    const oldVal = recurring[idx][field];
    const newVal = prompt(`Edit ${field}`, oldVal);
    if (newVal === null) return;

    if (field === "amount") {
      const num = parseFloat(newVal);
      if (isNaN(num) || num <= 0) return;
      recurring[idx][field] = num;
    } else {
      recurring[idx][field] = newVal.trim() || oldVal;
    }

    store.update({ recurring });
    renderRecurringTable();
  }
});

function renderRecurringTable() {
  const { recurring } = store.getState();
  recurringListEl.innerHTML = "";
  recurring.forEach(r => {
    const tr = document.createElement("tr");
    tr.dataset.id = r.id;
    tr.innerHTML = `
      <td class="editable-recurring" data-field="name">${r.name}</td>
      <td>${r.type}</td>
      <td>${r.freq}</td>
      <td>${new Date(r.nextDate).toLocaleDateString()}</td>
      <td><button class="btn inline danger delete-recurring">X</button></td>
    `;
    recurringListEl.appendChild(tr);
  });
}
