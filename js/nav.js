const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.page;

    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    pages.forEach(p => {
      if (p.id === target) p.classList.add("active");
      else p.classList.remove("active");
    });

    // refresh reports charts when opening reports
    if (target === "reports") {
      renderReports();
    }

    // refresh dropdowns when going home/accounts
    if (target === "home" || target === "accounts") {
      renderAccountDropdowns();
      renderCategoryDropdowns();
    }
  });
});
