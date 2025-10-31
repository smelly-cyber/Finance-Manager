// === Theme Toggle (uses existing button) ===
const themeToggleBtn = document.getElementById('themeToggle');

function setTheme(mode) {
  if (mode === 'dark') {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    themeToggleBtn.textContent = '☀️ Light';
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    themeToggleBtn.textContent = '🌙 Dark';
  }
}

// Load stored theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

// Toggle on click
themeToggleBtn.addEventListener('click', () => {
  const next = document.body.classList.contains('dark') ? 'light' : 'dark';
  setTheme(next);
});

// Smooth transition
document.body.style.transition = 'background 0.4s, color 0.4s';
