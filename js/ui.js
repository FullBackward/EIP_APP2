// UI Component Loading and Page Navigation
let componentsLoaded = {
  connection: false,
  scheduler: false,
  temperature: false
};

function loadHTMLComponent(targetSelector, url) {
  fetch(url)
    .then(response => response.text())
    .then(html => {
      const container = document.querySelector(targetSelector);
      if (!container) {
        console.error(`Target container ${targetSelector} not found`);
        return;
      }
      
      container.innerHTML = html;

      // Track which component was loaded
      if (targetSelector === '#connectionPageContainer') {
        componentsLoaded.connection = true;
        const skipBtn = container.querySelector('#skipButton');
        if (skipBtn) {
          skipBtn.addEventListener('click', () => {
            showSchedulerPage();
            showNotification("You skipped Bluetooth connection. Some functions may not work.", "warning");
          });
        }
        
        // Ensure the connection page is visible by default
        const connectionPage = document.getElementById('connectionPage');
        if (connectionPage) {
          connectionPage.classList.remove('hidden');
        }
      }

      if (targetSelector === '#schedulerPageContainer') {
        componentsLoaded.scheduler = true;
        const tempBtn = container.querySelector('#goToTemperatureBtn');
        if (tempBtn) {
          tempBtn.addEventListener('click', showTemperaturePage);
        }
        
        // Make sure scheduler page is hidden initially
        const schedulerPage = document.getElementById('schedulerPage');
        if (schedulerPage) {
          schedulerPage.classList.add('hidden');
        }

        setTimeout(() => {
          loadStatusPanel(container);
        }, 100);
      }

      if (targetSelector === '#temperaturePageContainer') {
        componentsLoaded.temperature = true;
        const backBtn = container.querySelector('#backToSchedulerBtn');
        if (backBtn) {
          backBtn.addEventListener('click', backToSchedulerFromTemperaturePage);
        }
        
        // Make sure temperature page is hidden initially
        const temperaturePage = document.getElementById('temperaturePage');
        if (temperaturePage) {
          temperaturePage.classList.add('hidden');
        }

        setTimeout(() => {
          loadStatusPanel(container);
        }, 100);
      }

      // Notify that a page has been loaded
      if (window.notifyPageLoaded) {
        window.notifyPageLoaded();
      } else if (window.refreshPageView) {
        window.refreshPageView();
      }
      
      // Initialize Bluetooth connection button if this is the connection page
      if (targetSelector === '#connectionPageContainer') {
        const connectBtn = container.querySelector('#connectButton');
        if (connectBtn && window.connectBluetooth) {
          console.log('Adding click event to connect button');
          connectBtn.addEventListener('click', window.connectBluetooth);
        }
      }
    })
    .catch(error => {
      console.error(`Error loading component from ${url}:`, error);
    });
}

function showSchedulerPage() {
  if (!componentsLoaded.scheduler) {
    console.warn('Scheduler page not loaded yet');
    return;
  }
  
  const connectionPage = document.getElementById('connectionPage');
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');

  if (connectionPage)   connectionPage.classList.add('hidden');
  if (schedulerPage)    schedulerPage.classList.remove('hidden');
  if (temperaturePage)  temperaturePage.classList.add('hidden');

  if (window.notifyPageLoaded) {
    window.notifyPageLoaded();
  } else if (window.refreshPageView) {
    window.refreshPageView();
  }
}

function showTemperaturePage() {
  if (!componentsLoaded.temperature) {
    console.warn('Temperature page not loaded yet');
    return;
  }
  
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');
  if (schedulerPage)    schedulerPage.classList.add('hidden');
  if (temperaturePage)  temperaturePage.classList.remove('hidden');

  if (window.notifyPageLoaded) {
    window.notifyPageLoaded();
  } else if (window.refreshPageView) {
    window.refreshPageView();
  }
}

function backToSchedulerFromTemperaturePage() {
  const schedulerPage = document.getElementById('schedulerPage');
  const temperaturePage = document.getElementById('temperaturePage');
  if (temperaturePage)  temperaturePage.classList.add('hidden');
  if (schedulerPage)    schedulerPage.classList.remove('hidden');

  if (window.notifyPageLoaded) {
    window.notifyPageLoaded();
  } else if (window.refreshPageView) {
    window.refreshPageView();
  }
}

// Simple notification function if not already defined
if (typeof window.showNotification !== 'function') {
  window.showNotification = function(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    alert(message);
  };
}

// Load all components when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, loading components...');
  loadHTMLComponent('#connectionPageContainer', 'components/connection-page.html');
  
  // Delay loading other components slightly to prioritize connection page
  setTimeout(() => {
    loadHTMLComponent('#schedulerPageContainer', 'components/scheduler-page.html');
    loadHTMLComponent('#temperaturePageContainer', 'components/temperature-page.html');
  }, 100);
});

window.loadStatusPanel = function(containerElement) {
  if (!containerElement) {
    console.warn('No container element provided for status panel');
    return;
  }
  
  const panelDiv = containerElement.querySelector('#statusPanelContainer');
  if (!panelDiv) {
    console.warn('Status panel container not found in element');
    return;
  } 

  fetch('components/status-panel.html')
    .then(response => response.text())
    .then(html => {
      panelDiv.innerHTML = html;
      
      // Add Bluetooth status to the panel
      const statusPanel = panelDiv.querySelector('.status-panel');
      if (statusPanel) {
        const bluetoothStatusItem = document.createElement('li');
        bluetoothStatusItem.className = 'mb-2';
        bluetoothStatusItem.innerHTML = `
          <strong>Bluetooth:</strong>
          <span id="bluetoothStatus" class="badge badge-secondary ml-2">Disconnected</span>
        `;
        
        const list = statusPanel.querySelector('ul');
        if (list) {
          list.insertBefore(bluetoothStatusItem, list.firstChild);
        }
        
        // Update Bluetooth status if we can detect it
        if (window.isBluetoothConnected) {
          const connected = window.isBluetoothConnected();
          const statusEl = document.getElementById('bluetoothStatus');
          if (statusEl) {
            statusEl.textContent = connected ? 'Connected' : 'Disconnected';
            statusEl.className = connected 
              ? 'badge badge-success ml-2' 
              : 'badge badge-danger ml-2';
          }
        }
      }
    })
    .catch(error => {
      console.error('Error loading status panel:', error);
    });
};

window.updateStatusPanel = function(vibrationStatus, occupancy, controlValue) {
  const vibEl = document.getElementById('statusVibration');
  const occEl = document.getElementById('statusOccupancy');
  const controlEl = document.getElementById('statusControl');

  if (vibEl) {
    vibEl.textContent = vibrationStatus ? "Active" : "Inactive";
    vibEl.className = vibrationStatus ? "badge badge-success ml-2" : "badge badge-secondary ml-2";
  }
  
  if (occEl) {
    occEl.textContent = occupancy ? "Occupied" : "Vacant";
    occEl.className = occupancy ? "badge badge-success ml-2" : "badge badge-secondary ml-2";
  }

  if (controlEl && controlValue !== undefined) {
    const controlText = controlValue === 0
      ? 'Maintaining'
      : controlValue > 0
        ? `+${controlValue}℃ Heating`
        : `${controlValue}℃ Cooling`;

    controlEl.textContent = controlText;
    controlEl.className = controlValue === 0
      ? 'badge badge-secondary ml-2'
      : controlValue > 0
        ? 'badge badge-danger ml-2'
        : 'badge badge-info ml-2';
  }
};

// Export key functions for testing
window.loadHTMLComponent = loadHTMLComponent;
window.showSchedulerPage = showSchedulerPage;
window.showTemperaturePage = showTemperaturePage;
window.backToSchedulerFromTemperaturePage = backToSchedulerFromTemperaturePage;