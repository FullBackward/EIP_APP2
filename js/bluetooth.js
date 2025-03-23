// Store Bluetooth characteristics for sending commands and receiving notifications
let commandCharacteristic = null;
let notifyCharacteristic = null;
let connectedDevice = null;
let isConnected = false;

// UUIDs from our Raspberry Pi console configuration
const VIBRATION_CONSOLE_NAME = "VibrationConsole";
const SERVICE_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4ee";
const COMMAND_CHAR_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4ef";
const NOTIFY_CHAR_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4e0";

// Initialize Bluetooth binding after components are loaded
function initBluetooth() {
    console.log("Initializing Bluetooth...");
    
    // Set up references to the old bluetoothCharacteristic for backward compatibility
    window.bluetoothCharacteristic = {
        writeValue: function(data) {
            if (!isConnected || !commandCharacteristic) {
                return Promise.reject(new Error("Not connected to device"));
            }
            return commandCharacteristic.writeValue(data);
        }
    };
}

// Function to connect to the Vibration Console device
async function connectBluetooth() {
    console.log("Connect button clicked");
    try {
        // Update connection status
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) statusEl.textContent = 'Scanning for devices...';
        
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
        
        if (statusEl) statusEl.textContent = 'Connecting to ' + device.name + '...';
        
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
        isConnected = true;
        if (statusEl) statusEl.textContent = 'Connected to ' + device.name;
        
        // Switch to scheduler page after successful connection
        if (window.showSchedulerPage) {
            window.showSchedulerPage();
        } else {
            // Fallback method if function not available
            const connectionPage = document.getElementById('connectionPage');
            const schedulerPage = document.getElementById('schedulerPage');
            if (connectionPage) connectionPage.classList.add('hidden');
            if (schedulerPage) schedulerPage.classList.remove('hidden');
        }
        
        // Send initial status request to get current state
        setTimeout(() => {
            requestStatus();
        }, 500);

        // Update the status panel with the connection info
        updateConnectionStatus(true);
        
    } catch (error) {
        console.error('Bluetooth connection error:', error);
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) statusEl.textContent = 'Connection failed: ' + error;
    }
}

// Handle disconnection
function onDisconnected(event) {
    const device = event.target;
    console.log(`Device ${device.name} disconnected`);
    
    // Reset characteristics
    commandCharacteristic = null;
    notifyCharacteristic = null;
    isConnected = false;
    
    // Update UI
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) statusEl.textContent = 'Disconnected';
    
    // Update the status panel
    updateConnectionStatus(false);
    
    // Show the connection page again
    const connectionPage = document.getElementById('connectionPage');
    const schedulerPage = document.getElementById('schedulerPage');
    const temperaturePage = document.getElementById('temperaturePage');
    
    if (connectionPage) connectionPage.classList.remove('hidden');
    if (schedulerPage) schedulerPage.classList.add('hidden');
    if (temperaturePage) temperaturePage.classList.add('hidden');
}

// Handle notifications from the device
function handleNotification(event) {
    try {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const jsonString = decoder.decode(value);
        console.log('Received data:', jsonString);
        
        const data = JSON.parse(jsonString);
        console.log('Parsed notification:', data);
        
        // Process different notification types
        switch (data.type) {
            case 'status':
                updateStatusDisplay(data);
                // Update the occupancy status in the status panel
                if (window.updateStatusPanel) {
                    window.updateStatusPanel(
                        data.motors_active.some(status => status), 
                        data.fsr_readings.some(reading => reading >= data.fsr_threshold),
                        0 // Default temperature control value
                    );
                }
                break;
            case 'motor_stopped':
                displayMotorStopped(data);
                break;
            case 'sync_ack':
            case 'schedule_ack':
            case 'test_ack':
            case 'stop_ack':
            case 'config_update_ack':
            case 'temperature_ack':
                showCommandAcknowledgment(data);
                break;
            case 'error':
                showError(data);
                break;
            default:
                console.log('Unknown notification type:', data.type);
        }
    } catch (error) {
        console.error('Error processing notification:', error);
    }
}

// Request current status from the device
async function requestStatus() {
    if (!isConnected || !commandCharacteristic) {
        console.error('Not connected to device');
        return;
    }
    
    const command = {
        type: 'status_request'
    };
    
    try {
        await sendCommand(command);
        const statusTimeEl = document.getElementById('statusUpdateTime');
        if (statusTimeEl) statusTimeEl.textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Error requesting status:', error);
    }
}

// Sync time with the device
async function syncTime() {
    if (!isConnected || !commandCharacteristic) {
        console.error('Not connected to device');
        return;
    }
    
    const command = {
        type: 'sync_time',
        timestamp: new Date().toISOString()
    };
    
    try {
        await sendCommand(command);
    } catch (error) {
        console.error('Error syncing time:', error);
    }
}

// Send a schedule to the device
async function sendSchedule(alarms) {
    if (!isConnected || !commandCharacteristic) {
        console.error('Not connected to device');
        return Promise.reject(new Error('Not connected to device'));
    }
    
    const command = {
        type: 'schedule',
        alarms: alarms
    };
    
    return sendCommand(command);
}

// Test a specific motor
async function testMotor(motorId, duration = 5) {
    if (!isConnected || !commandCharacteristic) {
        console.error('Not connected to device');
        return Promise.reject(new Error('Not connected to device'));
    }
    
    const command = {
        type: 'motor_test',
        motor_id: motorId,
        duration: duration
    };
    
    return sendCommand(command);
}

// Stop all motors
async function stopAllMotors() {
    if (!isConnected || !commandCharacteristic) {
        console.error('Not connected to device');
        return Promise.reject(new Error('Not connected to device'));
    }
    
    const command = {
        type: 'stop_all'
    };
    
    return sendCommand(command);
}

// Update a configuration value
async function updateConfig(section, option, value) {
    if (!isConnected || !commandCharacteristic) {
        console.error('Not connected to device');
        return Promise.reject(new Error('Not connected to device'));
    }
    
    const command = {
        type: 'update_config',
        section: section,
        option: option,
        value: value
    };
    
    return sendCommand(command);
}

// Set temperature (new command for our console)
async function setTemperature(temperature) {
    if (!isConnected || !commandCharacteristic) {
        console.error('Not connected to device');
        return Promise.reject(new Error('Not connected to device'));
    }
    
    const command = {
        type: 'set_temperature',
        value: temperature
    };
    
    return sendCommand(command);
}

// Generic function to send a command to the device
async function sendCommand(command) {
    if (!isConnected || !commandCharacteristic) {
        throw new Error('Not connected to device');
    }
    
    const encoder = new TextEncoder();
    const jsonCommand = JSON.stringify(command);
    const data = encoder.encode(jsonCommand);
    
    try {
        await commandCharacteristic.writeValue(data);
        console.log('Command sent:', command);
        return true;
    } catch (error) {
        console.error('Error sending command:', error);
        throw error;
    }
}

// Update the UI with status information
function updateStatusDisplay(data) {
    try {
        // Update time display
        const deviceTimeEl = document.getElementById('deviceTime');
        if (deviceTimeEl) deviceTimeEl.textContent = new Date(data.time).toLocaleString();
        
        // Update active alarms
        const activeAlarmsEl = document.getElementById('activeAlarms');
        if (activeAlarmsEl) activeAlarmsEl.textContent = data.active_alarms;
        
        // Update scheduled alarms
        const scheduledAlarmsEl = document.getElementById('scheduledAlarms');
        if (scheduledAlarmsEl) scheduledAlarmsEl.textContent = data.scheduled_alarms;
        
        // Update FSR readings
        const fsrReadingsElem = document.getElementById('fsrReadings');
        if (fsrReadingsElem) {
            fsrReadingsElem.innerHTML = '';
            data.fsr_readings.forEach((reading, index) => {
                const readingElem = document.createElement('div');
                readingElem.textContent = `Sensor ${index + 1}: ${reading.toFixed(1)} kg`;
                fsrReadingsElem.appendChild(readingElem);
            });
        }
        
        // Update motor status
        const motorStatusElem = document.getElementById('motorStatus');
        if (motorStatusElem) {
            motorStatusElem.innerHTML = '';
            data.motors_active.forEach((active, index) => {
                const motorElem = document.createElement('div');
                motorElem.textContent = `Motor ${index + 1}: ${active ? 'Active' : 'Inactive'}`;
                motorElem.className = active ? 'motor-active' : 'motor-inactive';
                motorStatusElem.appendChild(motorElem);
            });
        }
        
        // Update threshold
        const fsrThresholdEl = document.getElementById('fsrThreshold');
        if (fsrThresholdEl) fsrThresholdEl.textContent = `${data.fsr_threshold} kg`;
        
        // Update temperature if available
        if (data.current_temperature !== undefined) {
            const currentTempEl = document.getElementById('currentTemperature');
            if (currentTempEl) {
                currentTempEl.textContent = `${data.current_temperature.toFixed(1)} °C`;
            }
        }
    } catch (error) {
        console.error('Error updating status display:', error);
    }
}

function displayMotorStopped(data) {
    try {
        const message = `Motor ${data.motor_id + 1} stopped: ${data.reason}`;
        
        // Use the showNotification function if available
        if (window.showNotification) {
            window.showNotification(message, 'info');
            return;
        }
        
        // Fallback implementation
        const notificationsElem = document.getElementById('notifications');
        if (!notificationsElem) return;
        
        const notificationElem = document.createElement('div');
        notificationElem.className = 'notification';
        notificationElem.textContent = message;
        notificationsElem.appendChild(notificationElem);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notificationElem.remove();
        }, 5000);
    } catch (error) {
        console.error('Error displaying motor stopped:', error);
    }
}

function showCommandAcknowledgment(data) {
    try {
        // Use the showNotification function if available
        if (window.showNotification) {
            const message = `Command ${data.type.replace('_ack', '')} successful`;
            window.showNotification(message, 'success');
            return;
        }
        
        // Fallback implementation
        const notificationsElem = document.getElementById('notifications');
        if (!notificationsElem) return;
        
        const notificationElem = document.createElement('div');
        notificationElem.className = 'notification success';
        notificationElem.textContent = `Command ${data.type.replace('_ack', '')} successful`;
        notificationsElem.appendChild(notificationElem);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notificationElem.remove();
        }, 3000);
    } catch (error) {
        console.error('Error showing command acknowledgment:', error);
    }
}

function showError(data) {
    try {
        // Use the showNotification function if available
        if (window.showNotification) {
            window.showNotification(`Error: ${data.message}`, 'error');
            return;
        }
        
        // Fallback implementation
        const notificationsElem = document.getElementById('notifications');
        if (!notificationsElem) return;
        
        const notificationElem = document.createElement('div');
        notificationElem.className = 'notification error';
        notificationElem.textContent = `Error: ${data.message}`;
        notificationsElem.appendChild(notificationElem);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notificationElem.remove();
        }, 5000);
    } catch (error) {
        console.error('Error showing error notification:', error);
    }
}

// Update connection status in the status panel
function updateConnectionStatus(connected) {
    try {
        const statusEl = document.getElementById('bluetoothStatus');
        if (statusEl) {
            statusEl.textContent = connected ? 'Connected' : 'Disconnected';
            statusEl.className = connected 
                ? 'badge badge-success ml-2' 
                : 'badge badge-danger ml-2';
        }
    } catch (error) {
        console.error('Error updating connection status:', error);
    }
}

// Initialize Bluetooth after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded in bluetooth.js');
    // Wait a short time for components to load
    setTimeout(() => {
        initBluetooth();
    }, 1000);
});

// Expose functions to the global scope
window.connectBluetooth = connectBluetooth;
window.requestStatus = requestStatus;
window.syncTime = syncTime;
window.sendSchedule = sendSchedule;
window.testMotor = testMotor;
window.stopAllMotors = stopAllMotors;
window.updateConfig = updateConfig;
window.setTemperature = setTemperature;
window.sendCommand = sendCommand;
window.isBluetoothConnected = () => isConnected;

// Debug logging to help with troubleshooting
console.log('bluetooth.js loaded. Connect function registered:', typeof connectBluetooth === 'function');