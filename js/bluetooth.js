// Bluetooth Communication with Raspberry Pi Vibration Console
// Based on Web Bluetooth API best practices

// Store Bluetooth characteristics for sending commands and receiving notifications
let commandCharacteristic = null;
let notifyCharacteristic = null;
let connectedDevice = null;
let isConnected = false;

// UUIDs from our Raspberry Pi console configuration
const VIBRATION_CONSOLE_NAME = "YuSmart";
const SERVICE_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4ee";
const COMMAND_CHAR_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4ef";
const NOTIFY_CHAR_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4e0";

// ----- Bluetooth Connection and Communication -----

/**
 * Connect to the Vibration Console device
 * @returns {Promise<void>}
 */
async function connectBluetooth() {
    console.log("Attempting to connect to Bluetooth device...");
    
    // Update UI
    updateConnectionStatus("Scanning for devices...", "info");
    
    try {
        // Define options for device request
        const options = {
            filters: [
                { services: [SERVICE_UUID] }
            ],
            optionalServices: [SERVICE_UUID]
        };
        
        // Request the device
        const device = await navigator.bluetooth.requestDevice(options);
        connectedDevice = device;
        
        // Set up disconnect listener
        device.addEventListener('gattserverdisconnected', handleDisconnection);
        
        // Update UI
        updateConnectionStatus(`Connecting to ${device.name}...`, "info");
        
        // Connect to the GATT server
        const server = await device.gatt.connect();
        console.log("Connected to GATT server");
        
        // Get the primary service
        const service = await server.getPrimaryService(SERVICE_UUID);
        console.log("Got primary service");
        
        // Get the command characteristic (for sending commands)
        commandCharacteristic = await service.getCharacteristic(COMMAND_CHAR_UUID);
        console.log("Got command characteristic");
        
        // Get the notify characteristic (for receiving notifications)
        notifyCharacteristic = await service.getCharacteristic(NOTIFY_CHAR_UUID);
        console.log("Got notify characteristic");
        
        // Set up notifications
        await notifyCharacteristic.startNotifications();
        notifyCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);
        console.log("Set up notifications");
        
        // Update connection state and UI
        isConnected = true;
        updateConnectionStatus(`Connected to ${device.name}`, "success");
        
        // Switch to scheduler page
        if (window.showSchedulerPage) {
            window.showSchedulerPage();
        }
        
        // Request initial status
        setTimeout(requestStatus, 1000);
        
        return true;
    } catch (error) {
        console.error("Bluetooth connection error:", error);
        updateConnectionStatus(`Connection failed: ${error.message}`, "error");
        isConnected = false;
        return false;
    }
}

/**
 * Handle device disconnection
 * @param {Event} event - The disconnection event
 */
function handleDisconnection(event) {
    const device = event.target;
    console.log(`Device ${device.name || 'Unknown'} disconnected`);
    
    // Reset state
    commandCharacteristic = null;
    notifyCharacteristic = null;
    isConnected = false;
    
    // Update UI
    updateConnectionStatus("Disconnected", "error");
    
    // Switch back to connection page
    if (window.showConnectionPage) {
        window.showConnectionPage();
    } else {
        // Fallback if function not available
        const connectionPage = document.getElementById('connectionPage');
        const schedulerPage = document.getElementById('schedulerPage');
        const temperaturePage = document.getElementById('temperaturePage');
        
        if (connectionPage) connectionPage.classList.remove('hidden');
        if (schedulerPage) schedulerPage.classList.add('hidden');
        if (temperaturePage) temperaturePage.classList.add('hidden');
    }
}

/**
 * Handle incoming notifications from the device
 * @param {Event} event - The notification event
 */
function handleNotification(event) {
    try {
        // Get the data from the event
        const value = event.target.value;
        
        // Convert ArrayBuffer to string
        const decoder = new TextDecoder('utf-8');
        const dataString = decoder.decode(value);
        
        // Parse JSON
        const data = JSON.parse(dataString);
        console.log("Received notification:", data);
        
        // Process different notification types
        switch (data.type) {
            case 'status':
                updateStatusDisplay(data);
                // Update status panel if available
                if (window.updateStatusPanel) {
                    window.updateStatusPanel(
                        data.motors_active.some(status => status), 
                        data.fsr_readings.some(reading => reading >= data.fsr_threshold),
                        data.current_temperature !== undefined && data.target_temperature !== undefined 
                            ? data.target_temperature - data.current_temperature
                            : 0
                    );
                }
                break;
                
            case 'motor_stopped':
                showNotification(`Motor ${data.motor_id + 1} stopped: ${data.reason}`, "info");
                break;
                
            case 'sync_ack':
            case 'schedule_ack':
            case 'test_ack':
            case 'stop_ack':
            case 'config_update_ack':
            case 'temperature_ack':
                showNotification(`Command ${data.type.replace('_ack', '')} successful`, "success");
                break;
                
            case 'error':
                showNotification(`Error: ${data.message}`, "error");
                break;
                
            default:
                console.log("Unknown notification type:", data.type);
        }
    } catch (error) {
        console.error("Error processing notification:", error);
    }
}

// ----- Command functions -----

/**
 * Send a command to the device
 * @param {Object} command - The command to send
 * @returns {Promise<boolean>} - Success/failure
 */
async function sendCommand(command) {
    if (!isConnected || !commandCharacteristic) {
        console.error("Not connected to device");
        return Promise.reject(new Error("Not connected to device"));
    }
    
    try {
        // Convert to JSON and then to bytes
        const encoder = new TextEncoder();
        const jsonCommand = JSON.stringify(command);
        const data = encoder.encode(jsonCommand);
        
        // Send the command
        await commandCharacteristic.writeValue(data);
        console.log("Command sent:", command);
        return true;
    } catch (error) {
        console.error("Error sending command:", error);
        return Promise.reject(error);
    }
}

/**
 * Request current status from the device
 */
async function requestStatus() {
    try {
        await sendCommand({ type: 'status_request' });
        const statusTimeEl = document.getElementById('statusUpdateTime');
        if (statusTimeEl) {
            statusTimeEl.textContent = new Date().toLocaleTimeString();
        }
    } catch (error) {
        console.error("Failed to request status:", error);
    }
}

/**
 * Sync time with the device
 */
async function syncTime() {
    try {
        await sendCommand({
            type: 'sync_time',
            timestamp: new Date().toISOString()
        });
        showNotification("Time synchronized with device", "success");
    } catch (error) {
        console.error("Failed to sync time:", error);
        showNotification("Failed to sync time", "error");
    }
}

/**
 * Send a schedule to the device
 * @param {Array} alarms - Array of alarm objects
 */
async function sendSchedule(alarms) {
    try {
        await sendCommand({
            type: 'schedule',
            alarms: alarms
        });
        showNotification(`Schedule with ${alarms.length} alarms sent to device`, "success");
        return true;
    } catch (error) {
        console.error("Failed to send schedule:", error);
        showNotification("Failed to send schedule", "error");
        return false;
    }
}

/**
 * Test a specific motor
 * @param {number} motorId - The motor ID (0-based)
 * @param {number} duration - Duration in seconds
 */
async function testMotor(motorId, duration = 5) {
    try {
        await sendCommand({
            type: 'motor_test',
            motor_id: motorId,
            duration: duration
        });
        showNotification(`Testing motor ${motorId + 1} for ${duration} seconds`, "info");
    } catch (error) {
        console.error("Failed to test motor:", error);
        showNotification("Failed to test motor", "error");
    }
}

/**
 * Stop all motors
 */
async function stopAllMotors() {
    try {
        await sendCommand({ type: 'stop_all' });
        showNotification("All motors stopped", "success");
    } catch (error) {
        console.error("Failed to stop motors:", error);
        showNotification("Failed to stop motors", "error");
    }
}

/**
 * Update a configuration value
 * @param {string} section - Configuration section
 * @param {string} option - Option name
 * @param {any} value - New value
 */
async function updateConfig(section, option, value) {
    try {
        await sendCommand({
            type: 'update_config',
            section: section,
            option: option,
            value: value
        });
        showNotification(`Updated ${section}.${option} to ${value}`, "success");
    } catch (error) {
        console.error("Failed to update config:", error);
        showNotification("Failed to update configuration", "error");
    }
}

/**
 * Set the target temperature
 * @param {number} temperature - Target temperature in Celsius
 */
async function setTemperature(temperature) {
    try {
        await sendCommand({
            type: 'set_temperature',
            value: temperature
        });
        showNotification(`Target temperature set to ${temperature}°C`, "success");
    } catch (error) {
        console.error("Failed to set temperature:", error);
        showNotification("Failed to set temperature", "error");
    }
}

// ----- UI Helper Functions -----

/**
 * Update the connection status in the UI
 * @param {string} message - Status message
 * @param {string} type - Message type (info, success, error)
 */
function updateConnectionStatus(message, type) {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.textContent = message;
        
        // Update class based on type
        statusEl.className = 'mt-3 text-';
        switch (type) {
            case 'success':
                statusEl.className += 'success';
                break;
            case 'error':
                statusEl.className += 'danger';
                break;
            default:
                statusEl.className += 'info';
        }
    }
    
    // Update Bluetooth status in the status panel if available
    const bluetoothStatusEl = document.getElementById('bluetoothStatus');
    if (bluetoothStatusEl) {
        if (type === 'success') {
            bluetoothStatusEl.textContent = 'Connected';
            bluetoothStatusEl.className = 'badge badge-success ml-2';
        } else if (type === 'error') {
            bluetoothStatusEl.textContent = 'Disconnected';
            bluetoothStatusEl.className = 'badge badge-danger ml-2';
        } else {
            bluetoothStatusEl.textContent = 'Connecting...';
            bluetoothStatusEl.className = 'badge badge-warning ml-2';
        }
    }
}

/**
 * Update status display with device information
 * @param {Object} data - Status data from device
 */
function updateStatusDisplay(data) {
    try {
        // Update time display
        const deviceTimeEl = document.getElementById('deviceTime');
        if (deviceTimeEl) {
            deviceTimeEl.textContent = new Date(data.time).toLocaleString();
        }
        
        // Update active alarms
        const activeAlarmsEl = document.getElementById('activeAlarms');
        if (activeAlarmsEl) {
            activeAlarmsEl.textContent = data.active_alarms;
        }
        
        // Update scheduled alarms
        const scheduledAlarmsEl = document.getElementById('scheduledAlarms');
        if (scheduledAlarmsEl) {
            scheduledAlarmsEl.textContent = data.scheduled_alarms;
        }
        
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
        if (fsrThresholdEl) {
            fsrThresholdEl.textContent = `${data.fsr_threshold} kg`;
        }
        
        // Update temperature if available
        const currentTempEl = document.getElementById('currentTemperature');
        if (currentTempEl && data.current_temperature !== undefined) {
            currentTempEl.textContent = `${data.current_temperature.toFixed(1)} °C`;
        }
    } catch (error) {
        console.error("Error updating status display:", error);
    }
}

/**
 * Show a notification message
 * @param {string} message - Notification message
 * @param {string} type - Message type (info, success, error)
 */
function showNotification(message, type = 'info') {
    // Use global function if available
    if (window.showNotification && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback implementation
    const notificationsElem = document.getElementById('notifications');
    if (!notificationsElem) {
        console.log(`[${type}] ${message}`);
        return;
    }
    
    const notificationElem = document.createElement('div');
    notificationElem.className = `notification ${type}`;
    notificationElem.textContent = message;
    notificationsElem.appendChild(notificationElem);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notificationElem.remove();
    }, 5000);
}

// ----- Initialization -----

/**
 * Initialize Bluetooth functionality
 */
function initBluetooth() {
    // Check if Web Bluetooth API is available
    if (!navigator.bluetooth) {
        console.error("Web Bluetooth API is not available in this browser");
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.textContent = "Web Bluetooth not supported in this browser";
            statusEl.className = "mt-3 text-danger";
        }
        return false;
    }
    
    // Set up event listeners
    const connectBtn = document.getElementById('connectButton');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectBluetooth);
    }
    
    // Set up backward compatibility
    window.bluetoothCharacteristic = {
        writeValue: function(data) {
            if (!isConnected || !commandCharacteristic) {
                return Promise.reject(new Error("Not connected to device"));
            }
            return commandCharacteristic.writeValue(data);
        }
    };
    
    console.log("Bluetooth functionality initialized");
    return true;
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing Bluetooth...");
    setTimeout(initBluetooth, 500);
});

// Set up controls after page changes
window.addEventListener('pageLoaded', function() {
    console.log("Page loaded, setting up controls...");
    
    // Refresh status button
    const refreshBtn = document.getElementById('refreshStatus');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', requestStatus);
    }
    
    // Sync time button
    const syncTimeBtn = document.getElementById('syncTimeButton');
    if (syncTimeBtn) {
        syncTimeBtn.addEventListener('click', syncTime);
    }
    
    // Stop all motors button
    const stopAllBtn = document.getElementById('stopAllButton');
    if (stopAllBtn) {
        stopAllBtn.addEventListener('click', stopAllMotors);
    }
    
    // Test motor buttons
    const testMotorBtns = document.querySelectorAll('.test-motor-button');
    testMotorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const motorId = parseInt(btn.dataset.motorId);
            const durationInput = document.getElementById('testDuration');
            const duration = durationInput ? parseInt(durationInput.value) || 5 : 5;
            testMotor(motorId, duration);
        });
    });
    
    // FSR threshold update button
    const updateThresholdBtn = document.getElementById('updateThresholdButton');
    if (updateThresholdBtn) {
        updateThresholdBtn.addEventListener('click', () => {
            const thresholdInput = document.getElementById('fsrThresholdInput');
            if (!thresholdInput) return;
            
            const newThreshold = parseFloat(thresholdInput.value);
            if (!isNaN(newThreshold) && newThreshold > 0) {
                updateConfig('Application', 'fsr_threshold', newThreshold);
            }
        });
    }
});

// Export functions to global scope
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
window.showNotification = showNotification;

console.log("bluetooth.js loaded and ready");