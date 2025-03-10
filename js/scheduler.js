// Alarm Scheduler Logic
const alarms = [];

document.getElementById('alarmForm').addEventListener('submit', function(event) {
  event.preventDefault();
  
  const alarmTimeInput = document.getElementById('alarmTime').value;
  const alarmLabelInput = document.getElementById('alarmLabel').value || "Alarm";
  
  if (!alarmTimeInput) {
    alert('Please select a time for the alarm.');
    return;
  }
  
  const now = new Date();
  let alarmTime = new Date();
  const [hours, minutes] = alarmTimeInput.split(':');
  alarmTime.setHours(hours, minutes, 0, 0);
  
  // If the alarm time has already passed today, schedule for the next day
  if (alarmTime <= now) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }
  
  const timeout = alarmTime - now;
  
  // Schedule the alarm with setTimeout
  const alarmId = setTimeout(function() {
    alert('Alarm: ' + alarmLabelInput + ' is ringing!');
  }, timeout);
  
  // Save the alarm details
  const alarmEntry = {
    time: alarmTime.toLocaleTimeString(),
    label: alarmLabelInput,
    id: alarmId
  };
  
  alarms.push(alarmEntry);
  updateAlarmList();

  // Send the alarm data to the connected Bluetooth device
  sendAlarmData(alarmEntry);
  
  // Clear input fields for new alarm entry
  document.getElementById('alarmTime').value = '';
  document.getElementById('alarmLabel').value = '';
});

// Update the displayed list of scheduled alarms
function updateAlarmList() {
  const alarmList = document.getElementById('alarmList');
  alarmList.innerHTML = '';
  alarms.forEach((alarm, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.textContent = alarm.label + ' at ' + alarm.time;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = function() {
      clearTimeout(alarm.id);
      alarms.splice(index, 1);
      updateAlarmList();
    };
    
    li.appendChild(deleteButton);
    alarmList.appendChild(li);
  });
}