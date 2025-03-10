let bluetoothCharacteristic = null;

// Function to connect to a Bluetooth device and get a specific service & characteristic.
async function connectBluetooth() {
    try {
    const options = {
        // Request all devices; update filters if needed.
        acceptAllDevices: true,
        // Add your custom service UUID here so that it is available after connection.
        optionalServices: ['00001234-0000-1000-8000-00805f9b34fb']
    };
    const device = await navigator.bluetooth.requestDevice(options);
    const server = await device.gatt.connect();

    // Replace these UUIDs with the ones matching your Bluetooth device.
    const service = await server.getPrimaryService('00001234-0000-1000-8000-00805f9b34fb');
    bluetoothCharacteristic = await service.getCharacteristic('00005678-0000-1000-8000-00805f9b34fb');
    
    document.getElementById('connectionStatus').textContent = 'Connected to ' + (device.name || 'Unknown Device');
    // Switch to scheduler page after successful connection
    document.getElementById('connectionPage').classList.add('hidden');
    document.getElementById('schedulerPage').classList.remove('hidden');
    } catch (error) {
    document.getElementById('connectionStatus').textContent = 'Connection failed: ' + error;
    console.error(error);
    }
}

// Bind connection button click event
document.getElementById('connectButton').addEventListener('click', connectBluetooth);
