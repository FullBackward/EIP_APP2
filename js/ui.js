// Loading HTML components dynamically
function loadHTMLComponent(targetSelector, url) {
  fetch(url)
    .then(response => response.text())
    .then(html => {
      document.querySelector(targetSelector).innerHTML = html;
      // After connectionPage is loaded, bind skip button event
      if (targetSelector === '#connectionPageContainer') {
        const skipBtn = document.getElementById('skipButton');
        skipBtn.addEventListener('click', () => {
          showSchedulerPage();
          alert("You skipped Bluetooth connection. Some functions may not work.");
        });
      }

      // After schedulerPage is loaded, bind temperature jump button event
      if (targetSelector === '#schedulerPageContainer') {
        const tempBtn = document.getElementById('goToTemperatureBtn');
        if (tempBtn) {
          tempBtn.addEventListener('click', showTemperaturePage);
        } 
      }
    // After temperaturePage is loaded, bind back button event
      if (targetSelector === '#temperaturePageContainer') {
        const backBtn = document.getElementById('backToSchedulerBtn');
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
  if (connectionPage && schedulerPage) {
      connectionPage.classList.add('hidden');
      schedulerPage.classList.remove('hidden');
  }
}

// Page switching function - Temperature 
function showTemperaturePage() {
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');

  if (schedulerPage && temperaturePage) {
    schedulerPage.classList.add('hidden');
    temperaturePage.classList.remove('hidden');
  }
}

// Page switching function - Go back to Temperature page
function backToSchedulerFromTemperaturePage() {
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');
  if (schedulerPage && temperaturePage) {
    schedulerPage.classList.remove('hidden');
    temperaturePage.classList.add('hidden');
  }
}

// Initializing page loading component
window.addEventListener('DOMContentLoaded', () => {
  loadHTMLComponent('#connectionPageContainer', 'components/connection-page.html');
  loadHTMLComponent('#schedulerPageContainer', 'components/scheduler-page.html');
  loadHTMLComponent('#temperaturePageContainer', 'components/temperature-page.html');
});
