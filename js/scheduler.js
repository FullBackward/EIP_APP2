// Alarm Scheduler Logic

// Store alarms in a format compatible with our console
let alarms = [];

document.addEventListener('DOMContentLoaded', () => {
  initSchedulerControls();
});

// Initialize scheduler controls - also call this after page loads
function initSchedulerControls() {
  const form = document.getElementById('alarmForm');
  if (!form) return;
  
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const alarmTimeInput = document.getElementById('alarmTime');
    const alarmLabelInput = document.getElementById('alarmLabel');
    
    if (!alarmTimeInput) return;
    
    const timeValue = alarmTimeInput.value;
    const labelValue = alarmLabelInput ? alarmLabelInput.value || "Alarm" : "Alarm";
    
    if (!timeValue) {
      showNotification('Please select a time for the alarm.', 'error');
      return;
    }
    
    const now = new Date();
    let alarmTime = new Date();
    const [hours, minutes] = timeValue.split(':');
    alarmTime.setHours(hours, minutes, 0, 0);
    
    // If the alarm time has already passed today, schedule for the next day
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    // Add random motor selection
    const motorId = Math.floor(Math.random() * 3); // 0, 1, or 2
    
    // Create an alarm object that matches our console's protocol
    const alarmEntry = {
      time: alarmTime.toISOString(),
      label: labelValue,
      motor_id: motorId,
      duration: 60, // Default duration in seconds
      intensity: 100, // Default intensity percentage
      // Legacy properties for backward compatibility
      id: Date.now(), // Unique ID for this alarm
      localTime: alarmTime.toLocaleTimeString()
    };
    
    // Add to our alarms array
    alarms.push(alarmEntry);
    updateAlarmList();
    
    // Send the alarm data to the connected Bluetooth device
    sendAlarmData(alarms);
    
    // Clear input fields for new alarm entry
    if (alarmTimeInput) alarmTimeInput.value = '';
    if (alarmLabelInput) alarmLabelInput.value = '';
  });
  
  // Check for any send schedule button
  const sendScheduleBtn = document.getElementById('sendScheduleButton');
  if (sendScheduleBtn) {
    sendScheduleBtn.addEventListener('click', function() {
      if (alarms.length === 0) {
        showNotification('No alarms to send', 'error');
        return;
      }
      
      sendAlarmData(alarms);
    });
  }
}

// Update the displayed list of scheduled alarms
function updateAlarmList() {
  const alarmList = document.getElementById('alarmList');
  if (!alarmList) return;
  
  alarmList.innerHTML = '';
  
  if (alarms.length === 0) {
    const emptyNotice = document.createElement('li');
    emptyNotice.className = 'list-group-item text-muted';
    emptyNotice.textContent = 'No alarms scheduled';
    alarmList.appendChild(emptyNotice);
    return;
  }
  
  alarms.forEach((alarm, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    // Format the display text
    const alarmDate = new Date(alarm.time);
    const timeString = alarmDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = alarmDate.toLocaleDateString();
    
    const alarmInfo = document.createElement('div');
    alarmInfo.innerHTML = `
      <div><strong>${alarm.label}</strong> at ${timeString} on ${dateString}</div>
      <div class="text-muted small">Motor ${alarm.motor_id + 1}, ${alarm.duration}s, ${alarm.intensity}% intensity</div>
    `;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = function() {
      alarms.splice(index, 1);
      updateAlarmList();
      
      // If we have no alarms left, clear the schedule on the device
      if (alarms.length === 0 && window.sendSchedule) {
        window.sendSchedule([])
          .then(() => console.log("Cleared alarm schedule"))
          .catch(error => console.error("Error clearing schedule:", error));
      }
    };
    
    li.appendChild(alarmInfo);
    li.appendChild(deleteButton);
    alarmList.appendChild(li);
  });
}

// Register for the pageLoaded event
window.addEventListener('pageLoaded', () => {
  initSchedulerControls();
});