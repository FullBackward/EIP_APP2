// Utility functions for the Vibration Console Controller

// Send alarm data to the Raspberry Pi console
function sendAlarmData(alarmEntry) {
  // Format the alarm for our console protocol
  const alarmTime = new Date(alarmEntry.time);
  
  // Create an alarm object that matches our console's protocol
  const formattedAlarm = {
    time: alarmTime.toISOString(),
    motor_id: 0, // Default to first motor if not specified
    duration: 60, // Default duration in seconds
    intensity: 100 // Default intensity percentage
  };
  
  // Add label as a custom property
  if (alarmEntry.label) {
    formattedAlarm.label = alarmEntry.label;
  }
  
  // If we have an array of alarms, send them as a schedule
  // Otherwise, add a single alarm to the schedule
  if (window.sendSchedule) {
    if (Array.isArray(alarmEntry)) {
      // Format multiple alarms
      const formattedAlarms = alarmEntry.map(alarm => {
        const alarmTime = new Date(alarm.time);
        return {
          time: alarmTime.toISOString(),
          motor_id: 0,
          duration: 60,
          intensity: 100,
          label: alarm.label || "Alarm"
        };
      });
      
      window.sendSchedule(formattedAlarms)
        .then(() => console.log("Schedule sent:", formattedAlarms))
        .catch(error => console.error("Error sending schedule:", error));
    } else {
      // Send a single alarm
      window.sendSchedule([formattedAlarm])
        .then(() => console.log("Alarm sent:", formattedAlarm))
        .catch(error => console.error("Error sending alarm:", error));
    }
  } else {
    console.error("Bluetooth functionality not available");
  }
}

// Format a date object to a string suitable for the Raspberry Pi
function formatDate(date) {
  return date.toISOString();
}

// Check if Bluetooth is connected
function isConnected() {
  return window.isBluetoothConnected ? window.isBluetoothConnected() : false;
}

// Show a notification message
function showNotification(message, type = 'info', duration = 3000) {
  const notificationsElem = document.getElementById('notifications');
  if (!notificationsElem) return;
  
  const notificationElem = document.createElement('div');
  notificationElem.className = `notification ${type}`;
  notificationElem.textContent = message;
  notificationsElem.appendChild(notificationElem);
  
  // Auto-remove after specified duration
  setTimeout(() => {
    notificationElem.remove();
  }, duration);
}

// Dispatch an event to indicate a page has loaded
function notifyPageLoaded() {
  window.dispatchEvent(new Event('pageLoaded'));
}

// Export functions to global scope
window.sendAlarmData = sendAlarmData;
window.formatDate = formatDate;
window.isConnected = isConnected;
window.showNotification = showNotification;
window.notifyPageLoaded = notifyPageLoaded;