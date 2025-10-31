// Profile UI and switch
function ensureProfiles() {
  const saved = JSON.parse(localStorage.getItem("profiles") || "null");
  if (!saved) localStorage.setItem("profiles", JSON.stringify(DEFAULT_PROFILES));
}
function getProfiles() {
  ensureProfiles();
  return JSON.parse(localStorage.getItem("profiles"));
}
function addProfile(name) {
  const profiles = getProfiles();
  if (!profiles.includes(name)) {
    profiles.push(name);
    localStorage.setItem("profiles", JSON.stringify(profiles));
  }
}
function removeProfile(name) {
  const profiles = getProfiles().filter(p => p !== name);
  localStorage.setItem("profiles", JSON.stringify(profiles));
}

function initProfileSelector() {
  const sel = document.getElementById("profileSelect");
  if (!sel) return;
  sel.innerHTML = "";
  getProfiles().forEach(p => {
    const opt = document.createElement("option");
    opt.value = p; opt.textContent = p;
    if (p === currentProfile()) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => {
    setCurrentProfile(sel.value);
    fullRender();
    showBanner(`Switched to profile: ${sel.value}`, "info");
  });

  const addBtn = document.getElementById("addProfileBtn");
  const newInp = document.getElementById("newProfileName");
  addBtn?.addEventListener("click", () => {
    const name = (newInp.value || "").trim();
    if (!name) return;
    addProfile(name);
    setCurrentProfile(name);
    initProfileSelector();
    fullRender();
    newInp.value = "";
  });
}
