// Store Bluetooth characteristics for sending commands and receiving notifications
let commandCharacteristic = null;
let notifyCharacteristic = null;
let connectedDevice = null;

// UUIDs from our Raspberry Pi console configuration
const VIBRATION_CONSOLE_NAME = "VibrationConsole";
const SERVICE_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4ee";
const COMMAND_CHAR_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4ef";
const NOTIFY_CHAR_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4e0";

// Function to connect to the Vibration Console device
async function connectBluetooth() {
    try {
        // Update connection status
        document.getElementById('connectionStatus').textContent = 'Scanning for devices...';
        
        const options = {
            // Filter by name to find our specific device
            filters: [
                { name: VIBRATION_CONSOLE_NAME },
                // Add a service filter as backup in case name is changed
                { services: [SERVICE_UUID] }
            ],
            // Make sure this service UUID is available after connection
            optionalServices: [SERVICE_UUID]
        };
        
        // Request the device
        const device = await navigator.bluetooth.requestDevice(options);
        connectedDevice = device;
        
        // Set up event listener for disconnection
        device.addEventListener('gattserverdisconnected', onDisconnected);
        
        document.getElementById('connectionStatus').textContent = 'Connecting to ' + device.name + '...';
        
        // Connect to the device GATT server
        const server = await device.gatt.connect();
        
        // Get the service and characteristics
        const service = await server.getPrimaryService(SERVICE_UUID);
        
        // Get command characteristic (for sending commands to the device)
        commandCharacteristic = await service.getCharacteristic(COMMAND_CHAR_UUID);
        
        // Get notify characteristic (for receiving notifications from the device)
        notifyCharacteristic = await service.getCharacteristic(NOTIFY_CHAR_UUID);
        
        // Set up notifications
        await notifyCharacteristic.startNotifications();
        notifyCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);
        
        // Update UI
        document.getElementById('connectionStatus').textContent = 'Connected to ' + device.name;
        
        // Switch to scheduler page after successful connection
        document.getElementById('connectionPage').classList.add('hidden');
        document.getElementById('schedulerPage').classList.remove('hidden');
        
        // Send initial status request to get current state
        requestStatus();
        
    } catch (error) {
        document.getElementById('connectionStatus').textContent = 'Connection failed: ' + error;
        console.error('Bluetooth connection error:', error);
    }
}

// Handle disconnection
function onDisconnected(event) {
    const device = event.target;
    console.log(`Device ${device.name} disconnected`);
    
    // Reset characteristics
    commandCharacteristic = null;
    notifyCharacteristic = null;
    
    // Update UI
    document.getElementById('connectionStatus').textContent = 'Disconnected';
    
    // Switch back to connection page
    document.getElementById('schedulerPage').classList.add('hidden');
    document.getElementById('connectionPage').classList.remove('hidden');
}

// Handle notifications from the device
function handleNotification(event) {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const data = JSON.parse(decoder.decode(value));
    
    console.log('Received notification:', data);
    
    // Process different notification types
    switch (data.type) {
        case 'status':
            updateStatusDisplay(data);
            break;
        case 'motor_stopped':
            displayMotorStopped(data);
            break;
        case 'sync_ack':
        case 'schedule_ack':
        case 'test_ack':
        case 'stop_ack':
        case 'config_update_ack':
            showCommandAcknowledgment(data);
            break;
        case 'error':
            showError(data);
            break;
    }
}

// Request current status from the device
async function requestStatus() {
    if (!commandCharacteristic) {
        console.error('Not connected to device');
        return;
    }
    
    const command = {
        type: 'status_request'
    };
    
    await sendCommand(command);
    document.getElementById('statusUpdateTime').textContent = new Date().toLocaleTimeString();
}

// Sync time with the device
async function syncTime() {
    if (!commandCharacteristic) {
        console.error('Not connected to device');
        return;
    }
    
    const command = {
        type: 'sync_time',
        timestamp: new Date().toISOString()
    };
    
    await sendCommand(command);
}

// Send a schedule to the device
async function sendSchedule(alarms) {
    if (!commandCharacteristic) {
        console.error('Not connected to device');
        return;
    }
    
    const command = {
        type: 'schedule',
        alarms: alarms
    };
    
    await sendCommand(command);
}

// Test a specific motor
async function testMotor(motorId, duration = 5) {
    if (!commandCharacteristic) {
        console.error('Not connected to device');
        return;
    }
    
    const command = {
        type: 'motor_test',
        motor_id: motorId,
        duration: duration
    };
    
    await sendCommand(command);
}

// Stop all motors
async function stopAllMotors() {
    if (!commandCharacteristic) {
        console.error('Not connected to device');
        return;
    }
    
    const command = {
        type: 'stop_all'
    };
    
    await sendCommand(command);
}

// Update a configuration value
async function updateConfig(section, option, value) {
    if (!commandCharacteristic) {
        console.error('Not connected to device');
        return;
    }
    
    const command = {
        type: 'update_config',
        section: section,
        option: option,
        value: value
    };
    
    await sendCommand(command);
}

// Generic function to send a command to the device
async function sendCommand(command) {
    if (!commandCharacteristic) {
        throw new Error('Not connected to device');
    }
    
    const encoder = new TextEncoder();
    const jsonCommand = JSON.stringify(command);
    const data = encoder.encode(jsonCommand);
    
    try {
        await commandCharacteristic.writeValue(data);
        console.log('Command sent:', command);
    } catch (error) {
        console.error('Error sending command:', error);
        throw error;
    }
}

// Update the UI with status information
function updateStatusDisplay(data) {
    // Update time display
    document.getElementById('deviceTime').textContent = new Date(data.time).toLocaleString();
    
    // Update active alarms
    document.getElementById('activeAlarms').textContent = data.active_alarms;
    
    // Update scheduled alarms
    document.getElementById('scheduledAlarms').textContent = data.scheduled_alarms;
    
    // Update FSR readings
    const fsrReadingsElem = document.getElementById('fsrReadings');
    fsrReadingsElem.innerHTML = '';
    data.fsr_readings.forEach((reading, index) => {
        const readingElem = document.createElement('div');
        readingElem.textContent = `Sensor ${index + 1}: ${reading.toFixed(1)} kg`;
        fsrReadingsElem.appendChild(readingElem);
    });
    
    // Update motor status
    const motorStatusElem = document.getElementById('motorStatus');
    motorStatusElem.innerHTML = '';
    data.motors_active.forEach((active, index) => {
        const motorElem = document.createElement('div');
        motorElem.textContent = `Motor ${index + 1}: ${active ? 'Active' : 'Inactive'}`;
        motorElem.className = active ? 'motor-active' : 'motor-inactive';
        motorStatusElem.appendChild(motorElem);
    });
    
    // Update threshold
    document.getElementById('fsrThreshold').textContent = `${data.fsr_threshold} kg`;
}

function displayMotorStopped(data) {
    const message = `Motor ${data.motor_id + 1} stopped: ${data.reason}`;
    
    // Add notification to the UI
    const notificationsElem = document.getElementById('notifications');
    const notificationElem = document.createElement('div');
    notificationElem.className = 'notification';
    notificationElem.textContent = message;
    notificationsElem.appendChild(notificationElem);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notificationElem.remove();
    }, 5000);
}

function showCommandAcknowledgment(data) {
    // Add acknowledgment to the UI
    const notificationsElem = document.getElementById('notifications');
    const notificationElem = document.createElement('div');
    notificationElem.className = 'notification success';
    notificationElem.textContent = `Command ${data.type.replace('_ack', '')} successful`;
    notificationsElem.appendChild(notificationElem);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notificationElem.remove();
    }, 3000);
}

function showError(data) {
    // Add error to the UI
    const notificationsElem = document.getElementById('notifications');
    const notificationElem = document.createElement('div');
    notificationElem.className = 'notification error';
    notificationElem.textContent = `Error: ${data.message}`;
    notificationsElem.appendChild(notificationElem);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notificationElem.remove();
    }, 5000);
}

// Connect to device when connect button is clicked
document.getElementById('connectButton').addEventListener('click', connectBluetooth);

// Add event listeners for controls
document.getElementById('refreshStatus').addEventListener('click', requestStatus);
document.getElementById('syncTimeButton').addEventListener('click', syncTime);
document.getElementById('stopAllButton').addEventListener('click', stopAllMotors);

// Event listener for motor test buttons
document.querySelectorAll('.test-motor-button').forEach(button => {
    button.addEventListener('click', event => {
        const motorId = parseInt(event.target.dataset.motorId);
        const duration = parseInt(document.getElementById('testDuration').value) || 5;
        testMotor(motorId, duration);
    });
});

// Event listener for FSR threshold update
document.getElementById('updateThresholdButton').addEventListener('click', () => {
    const newThreshold = parseFloat(document.getElementById('fsrThresholdInput').value);
    if (!isNaN(newThreshold) && newThreshold > 0) {
        updateConfig('Application', 'fsr_threshold', newThreshold);
    }
});
