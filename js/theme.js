document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("toggleThemeBtn");
  
    function applyTheme(theme) {
      if (theme === "dark") {
        document.body.classList.add("dark-mode");
        document.body.setAttribute("data-theme", "dark");
      } else {
        document.body.classList.remove("dark-mode");
        document.body.setAttribute("data-theme", "light");
      }
  
      updateLogos();
    }
  
    function updateLogos() {
      const isDark = document.body.classList.contains("dark-mode");
      const logos = document.querySelectorAll(".app-logo");
      logos.forEach(logo => {
        logo.style.backgroundImage = isDark
          ? "url('../assets/logo-dark.jpg')"
          : "url('../assets/logo-light.jpg')";
      });
    }
  
    const savedTheme = localStorage.getItem("theme") || "light";
  
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.setAttribute("data-theme", "light");
    }
  
    applyTheme(savedTheme);
  
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
      });
    }
  
    window.applyTheme = applyTheme;
    window.updateLogos = updateLogos;
});
  