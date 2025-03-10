function sendAlarmData(alarmEntry) {
    if (!bluetoothCharacteristic) {
      console.error("No Bluetooth characteristic available. Alarm not sent.");
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(alarmEntry));
    bluetoothCharacteristic.writeValue(data)
      .then(() => console.log("Alarm data sent:", alarmEntry))
      .catch(error => console.error("Error sending alarm data:", error));
  }
  