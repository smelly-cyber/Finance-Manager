const accountNameEl = document.getElementById("accountName");
const accountBalanceEl = document.getElementById("accountBalance");
const accountCurrencyEl = document.getElementById("accountCurrency");
const addAccountBtn = document.getElementById("addAccountBtn");

const accountsListEl = document.getElementById("accountsList");

// add account
addAccountBtn.addEventListener("click", () => {
  const { accounts } = store.getState();
  const name = accountNameEl.value.trim();
  const bal = parseFloat(accountBalanceEl.value);
  const currency = accountCurrencyEl.value;
  if (!name || isNaN(bal)) return;

  accounts.push({
    id: crypto.randomUUID(),
    name,
    balance: bal,
    currency
  });

  store.update({ accounts });
  accountNameEl.value = "";
  accountBalanceEl.value = "";
  renderAccountDropdowns();
  renderAccountsTable();
  recordNetWorthSnapshot();
  fullRender(); // refresh summaries etc
});

accountsListEl.addEventListener("click", e => {
  const { accounts } = store.getState();
  const rowId = e.target.closest("tr")?.dataset.id;
  if (!rowId) return;

  // delete
  if (e.target.classList.contains("delete-acct")) {
    const idx = accounts.findIndex(a => a.id === rowId);
    if (idx >= 0) {
      accounts.splice(idx, 1);
      store.update({ accounts });
      renderAccountDropdowns();
      renderAccountsTable();
      recordNetWorthSnapshot();
      fullRender();
    }
  }

  // deposit
  if (e.target.classList.contains("deposit-acct")) {
    const idx = accounts.findIndex(a => a.id === rowId);
    if (idx < 0) return;
    const amt = parseFloat(prompt("Deposit amount:"));
    if (isNaN(amt) || amt <= 0) return;
    accounts[idx].balance += amt;

    // log transaction as income
    const st = store.getState();
    st.transactions.push({
      id: crypto.randomUUID(),
      name: "Manual Deposit",
      amount: amt,
      type: "income",
      accountId: accounts[idx].id,
      category: "income",
      date: nowISO()
    });

    store.setState(st);
    renderAccountsTable();
    recordNetWorthSnapshot();
    fullRender();
  }

  // withdraw
  if (e.target.classList.contains("withdraw-acct")) {
    const idx = accounts.findIndex(a => a.id === rowId);
    if (idx < 0) return;
    const amt = parseFloat(prompt("Withdraw amount:"));
    if (isNaN(amt) || amt <= 0) return;
    if (accounts[idx].balance < amt) {
      alert("Not enough balance.");
      return;
    }
    accounts[idx].balance -= amt;

    // log transaction as expense
    const st = store.getState();
    st.transactions.push({
      id: crypto.randomUUID(),
      name: "Manual Withdrawal",
      amount: amt,
      type: "expense",
      accountId: accounts[idx].id,
      category: "manual",
      date: nowISO()
    });

    store.setState(st);
    renderAccountsTable();
    recordNetWorthSnapshot();
    fullRender();
  }

  // inline edit account name/balance
  if (e.target.classList.contains("editable-acct")) {
    const field = e.target.dataset.field;
    const idx = accounts.findIndex(a => a.id === rowId);
    if (idx < 0) return;

    const oldVal = accounts[idx][field];
    const newVal = prompt(`Edit ${field}`, oldVal);
    if (newVal === null) return;

    if (field === "balance") {
      const num = parseFloat(newVal);
      if (isNaN(num)) return;
      accounts[idx][field] = num;
    } else {
      accounts[idx][field] = newVal.trim() || oldVal;
    }

    store.update({ accounts });
    renderAccountsTable();
    recordNetWorthSnapshot();
    fullRender();
  }
});

function renderAccountsTable() {
  const { accounts } = store.getState();
  accountsListEl.innerHTML = "";
  accounts.forEach(acc => {
    const tr = document.createElement("tr");
    tr.dataset.id = acc.id;

    tr.innerHTML = `
      <td class="editable-acct" data-field="name">${acc.name}</td>
      <td class="editable-acct" data-field="balance">${fmt(acc.balance)}</td>
      <td>${acc.currency}</td>
      <td><button class="btn inline primary deposit-acct">+</button></td>
      <td><button class="btn inline primary withdraw-acct">-</button></td>
      <td><button class="btn inline danger delete-acct">X</button></td>
    `;
    accountsListEl.appendChild(tr);
  });
}
