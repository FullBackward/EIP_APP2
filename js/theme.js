document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggleThemeBtn");

  function applyTheme(isDarkMode) {
    document.body.classList.toggle('dark-mode', isDarkMode);

    // Unified logo update
    const logos = document.querySelectorAll('.app-logo');
    logos.forEach(el => {
      el.style.backgroundImage = isDarkMode
        ? "url('./assets/logo-dark.jpg')"
        : "url('./assets/logo-light.jpg')";
    });

    // Update data-theme attribute and save
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }

  const savedTheme = localStorage.getItem("theme") || "light";
  const isDarkMode = savedTheme === "dark";

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
      const isDark = document.body.classList.contains("dark-mode");
      applyTheme(!isDark);
    });
  }

  window.applyTheme = applyTheme;
});
