// Render audit log + undo
function renderAuditLog() {
  const st = store.getState();
  const tbody = document.getElementById("auditList");
  if (!tbody) return;
  tbody.innerHTML = "";
  st.auditLog.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(e.ts).toLocaleString()}</td>
      <td>${e.action}</td>
      <td>${e.entity}</td>
      <td><button class="btn inline primary" data-id="${e.id}">Undo</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.addEventListener("click", ev => {
    const id = ev.target?.dataset?.id;
    if (!id) return;
    const ok = undoAudit(id);
    if (ok) {
      recordNetWorthSnapshot();
      fullRender();
      showBanner("Undone", "info");
    }
  }, { once: true });
}
