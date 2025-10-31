const incomeAmountEl = document.getElementById("incomeAmount");
const addIncomeBtn = document.getElementById("addIncomeBtn");

const expenseNameEl = document.getElementById("expenseName");
const expenseAmountEl = document.getElementById("expenseAmount");
const addExpenseBtn = document.getElementById("addExpenseBtn");

const txListEl = document.getElementById("txList");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const netBalanceEl = document.getElementById("netBalance");
const netWorthEl = document.getElementById("netWorth");

const resetAllBtn = document.getElementById("resetAllBtn");

// add income
addIncomeBtn.addEventListener("click", () => {
  const { accounts, transactions } = store.getState();
  const accountId = document.getElementById("incomeAccount").value;
  const amount = parseFloat(incomeAmountEl.value);
  if (!accountId || isNaN(amount) || amount <= 0) return;

  const updatedAccounts = accounts.map(acc => {
    if (acc.id === accountId) {
      return { ...acc, balance: acc.balance + amount };
    }
    return acc;
  });

  const newTx = {
    id: crypto.randomUUID(),
    name: "Income",
    amount,
    type: "income",
    accountId,
    category: "income",
    date: nowISO()
  };

  transactions.push(newTx);

  store.update({
    accounts: updatedAccounts,
    transactions
  });

  incomeAmountEl.value = "";
  recordNetWorthSnapshot();
  fullRender();
});

// add expense
addExpenseBtn.addEventListener("click", () => {
  const { accounts, transactions } = store.getState();
  const accountId = document.getElementById("expenseAccount").value;
  const category = document.getElementById("expenseCategory").value || "uncategorized";
  const name = expenseNameEl.value.trim();
  const amount = parseFloat(expenseAmountEl.value);
  if (!accountId || !name || isNaN(amount) || amount <= 0) return;

  // withdraw from account if enough
  const accIndex = accounts.findIndex(a => a.id === accountId);
  if (accIndex < 0) return;
  if (accounts[accIndex].balance < amount) {
    alert("Insufficient funds in this account.");
    return;
  }
  const updatedAccounts = accounts.slice();
  updatedAccounts[accIndex] = {
    ...updatedAccounts[accIndex],
    balance: updatedAccounts[accIndex].balance - amount
  };

  const newTx = {
    id: crypto.randomUUID(),
    name,
    amount,
    type: "expense",
    accountId,
    category,
    date: nowISO()
  };

  transactions.push(newTx);
  store.update({
    accounts: updatedAccounts,
    transactions
  });

  expenseNameEl.value = "";
  expenseAmountEl.value = "";
  recordNetWorthSnapshot();
  fullRender();
});

// delete / edit tx inline
txListEl.addEventListener("click", e => {
  const { accounts, transactions } = store.getState();
  const rowId = e.target.closest("tr")?.dataset.id;
  if (!rowId) return;

  // delete
  if (e.target.classList.contains("delete-tx")) {
    const txIndex = transactions.findIndex(t => t.id === rowId);
    if (txIndex < 0) return;
    const tx = transactions[txIndex];

    // reverse account impact
    const accountIdx = accounts.findIndex(a => a.id === tx.accountId);
    if (accountIdx >= 0) {
      const accCopy = accounts.slice();
      if (tx.type === "income") {
        accCopy[accountIdx] = {
          ...accCopy[accountIdx],
          balance: accCopy[accountIdx].balance - tx.amount
        };
      } else {
        accCopy[accountIdx] = {
          ...accCopy[accountIdx],
          balance: accCopy[accountIdx].balance + tx.amount
        };
      }
      accounts.splice(0, accounts.length, ...accCopy);
    }

    transactions.splice(txIndex, 1);

    store.update({ accounts, transactions });
    recordNetWorthSnapshot();
    fullRender();
  }

  // inline edit name or amount
  if (e.target.classList.contains("editable")) {
    const field = e.target.dataset.field;
    const txIndex = transactions.findIndex(t => t.id === rowId);
    if (txIndex < 0) return;
    const oldVal = transactions[txIndex][field];

    const newVal = prompt(`Edit ${field}`, oldVal);
    if (newVal === null) return;

    if (field === "amount") {
      const num = parseFloat(newVal);
      if (isNaN(num) || num <= 0) return;

      // adjust account balance difference
      const tx = transactions[txIndex];
      const delta = num - tx.amount;
      const acctIdx = accounts.findIndex(a => a.id === tx.accountId);
      if (acctIdx >= 0) {
        const accCopy = accounts.slice();
        if (tx.type === "income") {
          accCopy[acctIdx] = {
            ...accCopy[acctIdx],
            balance: accCopy[acctIdx].balance + delta
          };
        } else {
          // expense
          // if increasing expense, subtract more from account
          // if decreasing expense, refund account
          if (accCopy[acctIdx].balance < (tx.type === "expense" && delta > 0 ? delta : 0)) {
            alert("Not enough balance for this change.");
            return;
          }
          accCopy[acctIdx] = {
            ...accCopy[acctIdx],
            balance: accCopy[acctIdx].balance - delta
          };
        }
        accounts.splice(0, accounts.length, ...accCopy);
      }
      transactions[txIndex].amount = num;
    } else {
      transactions[txIndex][field] = newVal.trim() || oldVal;
    }

    store.update({ accounts, transactions });
    recordNetWorthSnapshot();
    fullRender();
  }
});

// reset all data
resetAllBtn.addEventListener("click", () => {
  const ok = confirm("This clears EVERYTHING. Continue?");
  if (!ok) return;
  store.setState({
    accounts: [],
    transactions: [],
    categories: [],
    goals: [],
    recurring: [],
    netWorthHistory: []
  });
  fullRender();
});

// render summary & tx table etc
function renderSummaryAndTx() {
  const { accounts, transactions } = store.getState();

  // totals
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const net = totalIncome - totalExpenses;

  // net worth = sum of all accounts converted to USD
  const netWorthUSD = accounts.reduce((sum, a) => {
    return sum + toUSD(a.balance, a.currency);
  }, 0);

  totalIncomeEl.textContent = fmt(totalIncome);
  totalExpensesEl.textContent = fmt(totalExpenses);
  netBalanceEl.textContent = fmt(net);
  netWorthEl.textContent = "$" + fmt(netWorthUSD) + " USD";

  // tx table
  txListEl.innerHTML = "";
  // newest first
  const sorted = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(tx => {
    const account = accounts.find(a => a.id === tx.accountId);
    const tr = document.createElement("tr");
    tr.dataset.id = tx.id;

    const dateStr = new Date(tx.date).toLocaleString();

    tr.innerHTML = `
      <td class="editable" data-field="name">${tx.name}</td>
      <td class="editable" data-field="amount">${fmt(tx.amount)}</td>
      <td>${account ? account.name : "?"}</td>
      <td>${tx.category}</td>
      <td>${dateStr}</td>
      <td><button class="btn inline danger delete-tx">X</button></td>
    `;
    txListEl.appendChild(tr);
  });
}
