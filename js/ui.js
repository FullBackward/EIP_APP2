function loadHTMLComponent(targetSelector, url) {
  fetch(url)
    .then(response => response.text())
    .then(html => {
      const container = document.querySelector(targetSelector);
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

        setTimeout(() => {
          loadStatusPanel(container);
        }, 0);
      }

      if (targetSelector === '#temperaturePageContainer') {
        const backBtn = container.querySelector('#backToSchedulerBtn');
        if (backBtn) {
          backBtn.addEventListener('click', backToSchedulerFromTemperaturePage);
        }

        setTimeout(() => {
          loadStatusPanel(container);
        }, 0);
      }

      if (window.refreshPageView) {
        window.refreshPageView();
      }
    })
    .catch(error => {
      console.error(`Error loading component from ${url}:`, error);
    });
}

function showSchedulerPage() {
  const connectionPage = document.getElementById('connectionPage');
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');

  if (connectionPage)   connectionPage.classList.add('hidden');
  if (schedulerPage)    schedulerPage.classList.remove('hidden');
  if (temperaturePage)  temperaturePage.classList.add('hidden');

  if (window.refreshPageView) window.refreshPageView();
}

function showTemperaturePage() {
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');
  if (schedulerPage)    schedulerPage.classList.add('hidden');
  if (temperaturePage)  temperaturePage.classList.remove('hidden');

  if (window.refreshPageView) window.refreshPageView();
}

function backToSchedulerFromTemperaturePage() {
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');
  if (temperaturePage)  temperaturePage.classList.add('hidden');
  if (schedulerPage)    schedulerPage.classList.remove('hidden');

  if (window.refreshPageView) window.refreshPageView();
}

window.addEventListener('DOMContentLoaded', () => {
  loadHTMLComponent('#connectionPageContainer', 'components/connection-page.html');
  loadHTMLComponent('#schedulerPageContainer', 'components/scheduler-page.html');
  loadHTMLComponent('#temperaturePageContainer', 'components/temperature-page.html');
});

window.loadStatusPanel = function(containerElement) {
  if (!containerElement) return;
  const panelDiv = containerElement.querySelector('#statusPanelContainer');
  if (!panelDiv) return; 

  fetch('components/status-panel.html')
    .then(response => response.text())
    .then(html => {
      panelDiv.innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading status panel:', error);
    });
};

window.updateStatusPanel = function(vibrationStatus, occupancy, controlValue) {
  const vibEl = document.getElementById('statusVibration');
  const occEl = document.getElementById('statusOccupancy');
  const controlEl = document.getElementById('statusControl');

  if (vibEl) vibEl.textContent = vibrationStatus ? "Active" : "Inactive";
  if (occEl) occEl.textContent = occupancy ? "Occupied" : "Vacant";

  const controlText = controlValue === 0
    ? 'Idle'
    : controlValue > 0
      ? `+${controlValue}℃ Heating`
      : `${controlValue}℃ Cooling`;

  if (controlEl) controlEl.textContent = controlText;
};