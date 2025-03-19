document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggleThemeBtn");

  function refreshPageView() {
    // e.g. updateStatusPanel();
  }

  function applyTheme(isDarkMode) {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    refreshPageView();
  }

  const savedTheme = localStorage.getItem("theme") || "light";
  const isDarkMode = (savedTheme === "dark");

  if (isDarkMode) {
    document.body.classList.add("dark-mode");
    document.body.setAttribute("data-theme", "dark");
  } else {
    document.body.classList.remove("dark-mode");
    document.body.setAttribute("data-theme", "light");
  }

  applyTheme(isDarkMode);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currentlyDark = document.body.classList.contains("dark-mode");
      applyTheme(!currentlyDark);
    });
  }

  refreshPageView();

  window.applyTheme = applyTheme;
  window.refreshPageView = refreshPageView;
});