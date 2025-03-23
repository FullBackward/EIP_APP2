// Temperature control logic
document.addEventListener('DOMContentLoaded', () => {
  initTemperatureControls();
});

// Initialize temperature controls - also call this after page loads
function initTemperatureControls() {
  const form = document.getElementById('temperatureForm');
  const currentTempDisplay = document.getElementById('currentTemperature');
  
  // Display the current temperature (hard code, will be implemented later) 
  let simulatedTemp = 22;
  if (currentTempDisplay) {
    currentTempDisplay.textContent = `${simulatedTemp} °C`;
  }
  
  // Upload expected temperature
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const targetTempInput = document.getElementById('targetTemperature');
      if (!targetTempInput) return;
      
      const targetTemp = targetTempInput.value;
      if (targetTemp) {
        // Update the UI
        showNotification(`Target temperature set to ${targetTemp} °C`, 'success');
        
        // If our updated Bluetooth functionality is available, use it
        if (window.setTemperature) {
          window.setTemperature(parseFloat(targetTemp))
            .then(() => {
              console.log("Temperature data sent:", targetTemp);
              // Update the status panel
              const statusControlElem = document.getElementById('statusControl');
              if (statusControlElem) {
                const currentTemp = simulatedTemp;
                const diff = parseFloat(targetTemp) - currentTemp;
                const controlText = diff === 0
                  ? 'Maintaining'
                  : diff > 0
                    ? `+${diff.toFixed(1)}℃ Heating`
                    : `${diff.toFixed(1)}℃ Cooling`;
                statusControlElem.textContent = controlText;
                statusControlElem.className = diff === 0
                  ? 'badge badge-secondary ml-2'
                  : diff > 0
                    ? 'badge badge-danger ml-2'
                    : 'badge badge-info ml-2';
              }
              
              // Update status panel with temperature control
              if (window.updateStatusPanel) {
                // Get vibration and occupancy status from current UI state
                const vibStatus = document.getElementById('statusVibration').textContent === 'Active';
                const occStatus = document.getElementById('statusOccupancy').textContent === 'Occupied';
                window.updateStatusPanel(vibStatus, occStatus, diff);
              }
            })
            .catch(err => {
              console.error("Failed to send temperature data:", err);
              showNotification("Failed to set temperature", 'error');
            });
        }
        // Backward compatibility with the old implementation
        else if (window.bluetoothCharacteristic) {
          const encoder = new TextEncoder();
          const data = encoder.encode(JSON.stringify({ 
            type: 'set_temperature', 
            value: parseFloat(targetTemp) 
          }));
          window.bluetoothCharacteristic.writeValue(data)
            .then(() => console.log("Temperature data sent:", targetTemp))
            .catch(err => console.error("Failed to send temperature data:", err));
        } 
        else {
          console.error("No Bluetooth connection available");
          showNotification("Bluetooth not connected. Unable to set temperature.", 'error');
        }
      }
    });
  }
}

// Register for the pageLoaded event
window.addEventListener('pageLoaded', () => {
  initTemperatureControls();
});