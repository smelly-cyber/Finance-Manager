// UI helpers

function renderAccountDropdowns() {
  const { accounts } = store.getState();

  const incomeAccount = document.getElementById("incomeAccount");
  const expenseAccount = document.getElementById("expenseAccount");
  const recurringAccount = document.getElementById("recurringAccount");
  const goalAccount = document.getElementById("goalAccount");

  [incomeAccount, expenseAccount, recurringAccount, goalAccount].forEach(sel => {
    sel.innerHTML = "";
    if (accounts.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "No accounts";
      opt.disabled = true;
      opt.selected = true;
      sel.appendChild(opt);
    } else {
      accounts.forEach(acc => {
        const opt = document.createElement("option");
        opt.value = acc.id;
        opt.textContent = `${acc.name} (${acc.currency})`;
        sel.appendChild(opt);
      });
    }
  });
}

function renderCategoryDropdowns() {
  const { categories } = store.getState();
  const expenseCategory = document.getElementById("expenseCategory");
  const recurringCategory = document.getElementById("recurringCategory");

  [expenseCategory, recurringCategory].forEach(sel => {
    sel.innerHTML = "";
    if (categories.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "Uncategorized";
      opt.value = "uncategorized";
      sel.appendChild(opt);
    } else {
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = cat.name;
        sel.appendChild(opt);
      });
    }
  });
}

// collapsible cards
function setupCollapsibles() {
  document.querySelectorAll(".collapsible").forEach(card => {
    const toggle = card.querySelector(".collapse-toggle");
    toggle.addEventListener("click", () => {
      if (card.classList.contains("closed")) {
        card.classList.remove("closed");
        toggle.textContent = "−";
      } else {
        card.classList.add("closed");
        toggle.textContent = "+";
      }
    });
  });
}

setupCollapsibles();
