// init app flow

// on load:
// 1. applyRecurring (auto add due recurring tx)
// 2. record net worth snapshot
// 3. render dropdowns, tables, charts

window.addEventListener("load", () => {
  applyRecurring();
  recordNetWorthSnapshot();
  fullRender();
});

// fullRender updates all dynamic UI
function fullRender() {
  renderAccountDropdowns();
  renderCategoryDropdowns();

  renderAccountsTable();
  renderSummaryAndTx();
  renderRecurringTable();
  renderCategoryTableWithLimits();
  renderGoalsTable();
  renderReports();
}
