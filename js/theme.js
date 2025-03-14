document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("toggleThemeBtn");
  
    // 应用主题并更新样式与 logo
    function applyTheme(theme) {
      if (theme === "dark") {
        document.body.classList.add("dark-mode");
        document.body.setAttribute("data-theme", "dark");
      } else {
        document.body.classList.remove("dark-mode");
        document.body.setAttribute("data-theme", "light");
      }
      updateLogos(theme);
    }
  
    // 更新 logo 图片
    function updateLogos(theme) {
      const logos = document.querySelectorAll(".app-logo");
      logos.forEach(logo => {
        logo.src = theme === "dark" ? "assets/logo-dark.jpg" : "assets/logo-light.jpg";
      });
    }
  
    // 初始化主题（在页面显示前完成设置，防止“闪一下”）
    const savedTheme = localStorage.getItem("theme") || "light";
  
    // ⚠ 在 DOM 渲染早期就设置 dark-class 和 data-theme（提前让页面加载时就是 dark）
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.setAttribute("data-theme", "light");
    }
  
    updateLogos(savedTheme); // 初始化 logo
  
    // 按钮点击切换
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
      });
    }
  
    // 暴露供外部调用
    window.applyTheme = applyTheme;
    window.updateLogos = updateLogos;
  });
  
  