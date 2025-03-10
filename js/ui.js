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
    })
    .catch(error => {
      console.error(`Error loading component from ${url}:`, error);
    });
}
  
// Page switching function
function showSchedulerPage() {
  const connectionPage = document.getElementById('connectionPage');
  const schedulerPage = document.getElementById('schedulerPage');
  if (connectionPage && schedulerPage) {
      connectionPage.classList.add('hidden');
      schedulerPage.classList.remove('hidden');
  }
}

// Initializing page loading component
window.addEventListener('DOMContentLoaded', () => {
  loadHTMLComponent('#connectionPageContainer', 'components/connection-page.html');
  loadHTMLComponent('#schedulerPageContainer', 'components/scheduler-page.html');
});
