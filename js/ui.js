// Loading HTML components dynamically
function loadHTMLComponent(targetSelector, url) {
  fetch(url)
    .then(response => response.text())
    .then(html => {
      const container = document.querySelector(targetSelector);
      container.innerHTML = ''; 
      container.innerHTML = html;

      if (targetSelector === '#connectionPageContainer') {
        const skipBtn = container.querySelector('#skipButton'); 
        if (skipBtn) {
          skipBtn.addEventListener('click', () => {
            showSchedulerPage();
            alert("You skipped Bluetooth connection. Some functions may not work.");
          });
        }
      }

      if (targetSelector === '#schedulerPageContainer') {
        const tempBtn = container.querySelector('#goToTemperatureBtn');
        if (tempBtn) {
          tempBtn.addEventListener('click', showTemperaturePage);
        }
      }

      if (targetSelector === '#temperaturePageContainer') {
        const backBtn = container.querySelector('#backToSchedulerBtn');
        if (backBtn) {
          backBtn.addEventListener('click', backToSchedulerFromTemperaturePage);
        }
      }
    })
    .catch(error => {
      console.error(`Error loading component from ${url}:`, error);
    });
}


// Page switching function - Scheduler
function showSchedulerPage() {
  const connectionPage = document.getElementById('connectionPage');
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');

  if (connectionPage) connectionPage.classList.add('hidden');
  if (schedulerPage) schedulerPage.classList.remove('hidden');
  if (temperaturePage) temperaturePage.classList.add('hidden');
}

// Page switching function - Temperature
function showTemperaturePage() {
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');
  if (schedulerPage) schedulerPage.classList.add('hidden');
  if (temperaturePage) temperaturePage.classList.remove('hidden');
}

// Page switching function - Back
function backToSchedulerFromTemperaturePage() {
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');
  if (temperaturePage) temperaturePage.classList.add('hidden');
  if (schedulerPage) schedulerPage.classList.remove('hidden');
}

// Load pages
window.addEventListener('DOMContentLoaded', () => {
  loadHTMLComponent('#connectionPageContainer', 'components/connection-page.html');
  loadHTMLComponent('#schedulerPageContainer', 'components/scheduler-page.html');
  loadHTMLComponent('#temperaturePageContainer', 'components/temperature-page.html');
});
