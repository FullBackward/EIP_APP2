// Temperature control logic
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('temperatureForm');
    const currentTempDisplay = document.getElementById('currentTemperature');
  
    // Display the current temperature (hard code, will be implement later) 
    let simulatedTemp = 22;
    currentTempDisplay.textContent = `${simulatedTemp} °C`;
  
    // Upload expected temprature
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const targetTemp = document.getElementById('targetTemperature').value;
        if (targetTemp) {
          alert(`Target temperature set to ${targetTemp} °C`);
          
          // If bluetooth has been connected, send data
          if (window.bluetoothCharacteristic) {
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({ type: 'temperature', value: targetTemp }));
            window.bluetoothCharacteristic.writeValue(data)
              .then(() => console.log("Temperature data sent:", targetTemp))
              .catch(err => console.error("Failed to send temperature data:", err));
          }
        }
      });
    }
  });
  