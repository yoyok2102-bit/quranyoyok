/* Qibla Direction and Compass Logic (compass.js) */

const COMPASS_STATE = {
    qiblaAngle: 0,
    heading: 0,
    orientationActive: false
};

let COMPASS_DOM = {};

function initializeCompassDOM() {
    COMPASS_DOM = {
        compassContainer: document.getElementById('compassContainer'),
        qiblaNeedle: document.getElementById('qiblaNeedle'),
        qiblaAngleText: document.getElementById('qiblaAngleText'),
        compassHeadingText: document.getElementById('compassHeadingText'),
        sensorStatus: document.getElementById('sensorStatus'),
        compassPermissionCard: document.getElementById('compassPermissionCard'),
        btnRequestSensor: document.getElementById('btnRequestSensor')
    };
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeCompassDOM();
    } catch (e) {
        console.error("Compass DOM Cache initialization error:", e);
    }
    try {
        initCompass();
    } catch (e) {
        console.error("initCompass error:", e);
    }
});

// Watch navigation switches to calculate qibla dynamically
function initCompass() {
    calculateQibla();
    
    // Listen to changes in navigation to recalculate if location changed
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.getAttribute('data-page') === 'qibla') {
                calculateQibla();
                requestOrientationSensor(false); // Try silent auto-bind
            }
        });
    });

    // Explicit request button
    COMPASS_DOM.btnRequestSensor.addEventListener('click', () => {
        requestOrientationSensor(true);
    });
}

// Qibla math formula
function calculateQibla() {
    // Lat/Lng from prayer.js cached state
    const lat = PRAYER_STATE.lat;
    const lng = PRAYER_STATE.lng;

    // Kaaba Coordinates
    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLng = 39.8262 * Math.PI / 180;
    
    const userLat = lat * Math.PI / 180;
    const userLng = lng * Math.PI / 180;
    
    const deltaLng = kaabaLng - userLng;

    const y = Math.sin(deltaLng);
    const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(deltaLng);
    
    let qiblaRad = Math.atan2(y, x);
    let qiblaDeg = qiblaRad * 180 / Math.PI;
    
    // Normalize to 0-360
    qiblaDeg = (qiblaDeg + 360) % 360;
    
    COMPASS_STATE.qiblaAngle = qiblaDeg;
    
    COMPASS_DOM.qiblaAngleText.textContent = `${qiblaDeg.toFixed(1)}° N`;
    
    // Set visual Kaaba icon offset
    // Let's set the Qibla Needle rotation directly relative to North
    // When heading is 0, the needle points to qiblaAngle
    updateCompassRotation();
}

function updateCompassRotation() {
    // Compass Dial shows absolute direction:
    // If heading is `H` (user device is pointed at H degrees from North), 
    // we rotate the compass dial by `-H` so North indicator always points to true north.
    // The Qibla needle is placed inside the compass. It should point at `qiblaAngle`.
    // Combined rotation:
    // Dial Rotation = -heading
    // Needle Rotation (relative to dial North) = qiblaAngle
    
    const dialRotation = -COMPASS_STATE.heading;
    const needleRotation = COMPASS_STATE.qiblaAngle - COMPASS_STATE.heading;
    
    COMPASS_DOM.compassContainer.style.transform = `rotate(${dialRotation}deg)`;
    COMPASS_DOM.qiblaNeedle.style.transform = `rotate(${COMPASS_STATE.qiblaAngle}deg)`; // Relative to dial North, so it spins with it
}

// Request Magnetometer permission for absolute orientation
async function requestOrientationSensor(userTriggered = false) {
    // Check if permission required (iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        if (userTriggered) {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    bindOrientationEvents();
                    COMPASS_DOM.compassPermissionCard.style.display = 'none';
                } else {
                    showError("Izin sensor orientasi ditolak.");
                    COMPASS_DOM.sensorStatus.textContent = "Sensor Nonaktif";
                }
            } catch (err) {
                console.error(err);
                showError("Gagal memanggil sensor orientasi.");
            }
        } else {
            // Show prompt card for iOS users if they haven't approved
            COMPASS_DOM.compassPermissionCard.style.display = 'block';
            COMPASS_DOM.sensorStatus.textContent = "Butuh Izin";
        }
    } else {
        // Android or PC (No requestPermission needed)
        bindOrientationEvents();
    }
}

function bindOrientationEvents() {
    if (COMPASS_STATE.orientationActive) return;

    const handleOrientation = (event) => {
        let heading = null;
        
        // iOS Compass heading
        if (event.webkitCompassHeading !== undefined) {
            heading = event.webkitCompassHeading;
        } 
        // Android absolute heading standard
        else if (event.alpha !== null) {
            heading = 360 - event.alpha;
        }

        if (heading !== null) {
            COMPASS_STATE.heading = heading;
            COMPASS_STATE.orientationActive = true;
            COMPASS_DOM.compassHeadingText.textContent = `${Math.round(heading)}°`;
            COMPASS_DOM.sensorStatus.textContent = "Sensor Aktif";
            COMPASS_DOM.compassPermissionCard.style.display = 'none';
            updateCompassRotation();
        }
    };

    // Use absolute orientation if possible
    if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else if ('ondeviceorientation' in window) {
        window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
        COMPASS_DOM.sensorStatus.textContent = "Tanpa Sensor";
        COMPASS_DOM.compassHeadingText.textContent = "Manual";
    }
}
