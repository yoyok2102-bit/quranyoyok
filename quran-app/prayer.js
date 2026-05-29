/* Logic Waktu Shalat, Pilihan Suara Adzan, & Geolocation (prayer.js) */

const PRAYER_STATE = {
    lat: -6.2088,   // Default Jakarta Lat
    lng: 106.8456,  // Default Jakarta Lng
    cityName: "Jakarta, Indonesia",
    timings: null,
    nextPrayerName: "",
    nextPrayerTime: null,
    countdownInterval: null,
    isAdhanEnabled: false,
    adhanPlayed: {} // Prevent double adhan playing in the same minute
};

// Elegant Adhan Audio Streams
const ADHAN_TRACKS = {
    azan1: "https://www.islamcan.com/audio/adhan/azan1.mp3",   // Mekkah
    azan2: "https://www.islamcan.com/audio/adhan/azan2.mp3",   // Madinah
    azan15: "https://www.islamcan.com/audio/adhan/azan15.mp3", // Mesir (Abdul Basit)
    azan3: "https://www.islamcan.com/audio/adhan/azan3.mp3",   // Al-Aqsa
    azan14: "https://www.islamcan.com/audio/adhan/azan14.mp3"  // Turki
};

// Cache DOM prayer elements
let PRAYER_DOM = {};

function initializePrayerDOM() {
    PRAYER_DOM = {
        headerCityName: document.getElementById('headerCityName'),
        prayerRegion: document.getElementById('prayerRegion'),
        prayerCoordinates: document.getElementById('prayerCoordinates'),
        btnRefreshLocation: document.getElementById('btnRefreshLocation'),
        nextPrayerLabel: document.getElementById('nextPrayerLabel'),
        nextPrayerTimer: document.getElementById('nextPrayerTimer'),
        nextPrayerName: document.getElementById('nextPrayerName'),
        toggleAdhanNotification: document.getElementById('toggleAdhanNotification'),
        selectAdhanStyle: document.getElementById('selectAdhanStyle'),
        btnPlayAdhanTest: document.getElementById('btnPlayAdhanTest'),
        adhanAudio: document.getElementById('adhanAudio'),
        prayerCalculationMethod: document.getElementById('prayerCalculationMethod'),
        toggleGPS: document.getElementById('toggleGPS')
    };
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializePrayerDOM();
    } catch (e) {
        console.error("Prayer DOM Cache initialization error:", e);
    }
    try {
        initPrayerTimes();
    } catch (e) {
        console.error("initPrayerTimes error:", e);
    }
});

function initPrayerTimes() {
    loadPrayerSettings();
    setupLocation();
    
    PRAYER_DOM.btnRefreshLocation.addEventListener('click', () => {
        PRAYER_DOM.toggleGPS.checked = true;
        PRAYER_STATE.isGPSEnabled = true;
        localStorage.setItem('annuur_gps_enabled', 'true');
        detectUserLocation(true);
    });

    PRAYER_DOM.toggleAdhanNotification.addEventListener('change', (e) => {
        PRAYER_STATE.isAdhanEnabled = e.target.checked;
        localStorage.setItem('annuur_adhan_enabled', PRAYER_STATE.isAdhanEnabled);
        if (PRAYER_STATE.isAdhanEnabled) {
            PRAYER_DOM.adhanAudio.volume = 0.8;
            showToast("Notifikasi & Alarm Adzan diaktifkan.");
            requestNotificationPermission();
        }
    });

    PRAYER_DOM.selectAdhanStyle.addEventListener('change', (e) => {
        localStorage.setItem('annuur_adhan_style', e.target.value);
        showToast("Suara adzan terpilih berhasil diubah.");
    });

    // Test Play Adhan button logic
    let isTestingAdhan = false;
    PRAYER_DOM.btnPlayAdhanTest.addEventListener('click', () => {
        if (isTestingAdhan) {
            PRAYER_DOM.adhanAudio.pause();
            PRAYER_DOM.adhanAudio.currentTime = 0;
            isTestingAdhan = false;
            PRAYER_DOM.btnPlayAdhanTest.innerHTML = '<i data-lucide="play"></i> Dengar Tes Adzan';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            showToast("Tes Adzan dihentikan.");
        } else {
            const style = PRAYER_DOM.selectAdhanStyle.value;
            const trackUrl = ADHAN_TRACKS[style] || ADHAN_TRACKS.azan1;
            
            PRAYER_DOM.adhanAudio.src = trackUrl;
            PRAYER_DOM.adhanAudio.load();
            PRAYER_DOM.adhanAudio.play()
                .then(() => {
                    isTestingAdhan = true;
                    PRAYER_DOM.btnPlayAdhanTest.innerHTML = '<i data-lucide="square"></i> Hentikan Tes';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                    showToast("Memutar Tes Adzan...");
                })
                .catch(err => {
                    console.error("Play test failed:", err);
                    showToast("Gagal memutar tes. Harap berikan izin interaksi terlebih dahulu.");
                });
        }
    });

    PRAYER_DOM.adhanAudio.addEventListener('ended', () => {
        if (isTestingAdhan) {
            isTestingAdhan = false;
            PRAYER_DOM.btnPlayAdhanTest.innerHTML = '<i data-lucide="play"></i> Dengar Tes Adzan';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    PRAYER_DOM.prayerCalculationMethod.addEventListener('change', () => {
        fetchPrayerTimes();
    });

    PRAYER_DOM.toggleGPS.addEventListener('change', (e) => {
        PRAYER_STATE.isGPSEnabled = e.target.checked;
        localStorage.setItem('annuur_gps_enabled', PRAYER_STATE.isGPSEnabled);
        if (PRAYER_STATE.isGPSEnabled) {
            detectUserLocation(true);
        } else {
            // Reset to Jakarta default
            PRAYER_STATE.lat = -6.2088;
            PRAYER_STATE.lng = 106.8456;
            PRAYER_STATE.cityName = "Jakarta (Default)";
            updateLocationUI();
            fetchPrayerTimes();
            showToast("GPS dinonaktifkan. Menggunakan Jakarta.");
        }
    });
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log("Browser ini tidak mendukung notifikasi web.");
        return;
    }
    
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast("Izin notifikasi disetujui! Anda akan menerima peringatan shalat.");
            } else {
                showToast("Izin notifikasi ditolak. Anda tidak akan melihat peringatan teks.");
            }
        });
    }
}

function loadPrayerSettings() {
    const savedMethod = localStorage.getItem('annuur_prayer_method');
    if (savedMethod) {
        PRAYER_DOM.prayerCalculationMethod.value = savedMethod;
    }

    const savedAdhan = localStorage.getItem('annuur_adhan_enabled');
    if (savedAdhan) {
        PRAYER_STATE.isAdhanEnabled = savedAdhan === 'true';
        PRAYER_DOM.toggleAdhanNotification.checked = PRAYER_STATE.isAdhanEnabled;
    }

    const savedAdhanStyle = localStorage.getItem('annuur_adhan_style');
    if (savedAdhanStyle) {
        PRAYER_DOM.selectAdhanStyle.value = savedAdhanStyle;
    }

    const savedGPS = localStorage.getItem('annuur_gps_enabled');
    if (savedGPS) {
        PRAYER_STATE.isGPSEnabled = savedGPS === 'true';
        PRAYER_DOM.toggleGPS.checked = PRAYER_STATE.isGPSEnabled;
    } else {
        PRAYER_STATE.isGPSEnabled = false;
        PRAYER_DOM.toggleGPS.checked = false;
    }
}

// Check stored location or fetch GPS
function setupLocation() {
    const storedLat = localStorage.getItem('annuur_lat');
    const storedLng = localStorage.getItem('annuur_lng');
    const storedCity = localStorage.getItem('annuur_city');

    if (PRAYER_STATE.isGPSEnabled && storedLat && storedLng && storedCity) {
        PRAYER_STATE.lat = parseFloat(storedLat);
        PRAYER_STATE.lng = parseFloat(storedLng);
        PRAYER_STATE.cityName = storedCity;
        updateLocationUI();
        fetchPrayerTimes();
    } else if (PRAYER_STATE.isGPSEnabled) {
        detectUserLocation(false);
    } else {
        // Default Jakarta
        PRAYER_STATE.lat = -6.2088;
        PRAYER_STATE.lng = 106.8456;
        PRAYER_STATE.cityName = "Jakarta (Default)";
        updateLocationUI();
        fetchPrayerTimes();
    }
}

// Request coordinates
function detectUserLocation(forceToast = false) {
    if (!navigator.geolocation) {
        showError("Geolocation tidak didukung browser Anda.");
        fetchPrayerTimes(); // Fetch default Jakarta
        return;
    }

    PRAYER_DOM.headerCityName.textContent = "Mencari GPS...";
    PRAYER_DOM.prayerRegion.textContent = "Mengakses GPS...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            PRAYER_STATE.lat = position.coords.latitude;
            PRAYER_STATE.lng = position.coords.longitude;
            
            // Call reverse geocoding to get City Name
            await getCityNameFromCoords(PRAYER_STATE.lat, PRAYER_STATE.lng);
            
            localStorage.setItem('annuur_lat', PRAYER_STATE.lat);
            localStorage.setItem('annuur_lng', PRAYER_STATE.lng);
            
            updateLocationUI();
            fetchPrayerTimes();

            if (forceToast) {
                showToast("Lokasi berhasil diperbarui via GPS.");
            }
        },
        (error) => {
            console.warn(error);
            showError("GPS ditolak/gagal. Menggunakan lokasi default (Jakarta).");
            PRAYER_STATE.cityName = "Jakarta, Indonesia";
            updateLocationUI();
            fetchPrayerTimes();
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// Fast reverse geocode via openstreetmap Nominatim
async function getCityNameFromCoords(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
        const data = await res.json();
        if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.municipality || data.address.county || "Lokasi Anda";
            const country = data.address.country || "Indonesia";
            PRAYER_STATE.cityName = `${city}, ${country}`;
            localStorage.setItem('annuur_city', PRAYER_STATE.cityName);
        }
    } catch (err) {
        console.error("OSM Geocoding failed:", err);
        PRAYER_STATE.cityName = "Lokasi Anda";
    }
}

function updateLocationUI() {
    PRAYER_DOM.headerCityName.textContent = PRAYER_STATE.cityName;
    PRAYER_DOM.prayerRegion.textContent = PRAYER_STATE.cityName;
    PRAYER_DOM.prayerCoordinates.textContent = `Lat: ${PRAYER_STATE.lat.toFixed(4)}, Lng: ${PRAYER_STATE.lng.toFixed(4)}`;
}

// Fetch timings from Aladhan API
async function fetchPrayerTimes() {
    const timestamp = Math.floor(Date.now() / 1000);
    const method = PRAYER_DOM.prayerCalculationMethod.value;
    localStorage.setItem('annuur_prayer_method', method);

    try {
        const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${PRAYER_STATE.lat}&longitude=${PRAYER_STATE.lng}&method=${method}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 200) {
            PRAYER_STATE.timings = data.data.timings;
            renderPrayerSchedule();
            startPrayerCountdown();
        } else {
            showError("Gagal memuat jadwal shalat.");
        }
    } catch (err) {
        console.error(err);
        showError("Koneksi jadwal shalat gagal.");
    }
}

// Render schedule inside DOM cards
function renderPrayerSchedule() {
    if (!PRAYER_STATE.timings) return;
    
    const targets = {
        'Imsak': 'time-Imsak',
        'Fajr': 'time-Fajr',
        'Dhuhr': 'time-Dhuhr',
        'Asr': 'time-Asr',
        'Maghrib': 'time-Maghrib',
        'Isha': 'time-Isha'
    };

    Object.keys(targets).forEach(key => {
        const rawTime = PRAYER_STATE.timings[key]; // returns "04:32" etc.
        const cleanTime = rawTime.split(' ')[0]; // remove timezones if present
        document.getElementById(targets[key]).textContent = cleanTime;
    });
}

// Countdown Tick Engine
function startPrayerCountdown() {
    if (PRAYER_STATE.countdownInterval) {
        clearInterval(PRAYER_STATE.countdownInterval);
    }

    PRAYER_STATE.countdownInterval = setInterval(() => {
        if (!PRAYER_STATE.timings) return;

        const now = new Date();
        const prayerList = [
            { name: "Subuh", key: "Fajr", timeStr: PRAYER_STATE.timings.Fajr },
            { name: "Dzuhur", key: "Dhuhr", timeStr: PRAYER_STATE.timings.Dhuhr },
            { name: "Ashar", key: "Asr", timeStr: PRAYER_STATE.timings.Asr },
            { name: "Maghrib", key: "Maghrib", timeStr: PRAYER_STATE.timings.Maghrib },
            { name: "Isya", key: "Isha", timeStr: PRAYER_STATE.timings.Isha }
        ];

        let nextPrayer = null;
        let minDiff = Infinity;
        let activePrayerKey = null;

        // Parse each sholat time to Date Object
        const prayersWithDates = prayerList.map(p => {
            const [hrs, mins] = p.timeStr.split(':').map(Number);
            const pDate = new Date();
            pDate.setHours(hrs, mins, 0, 0);

            // If time has passed today, calculate it for tomorrow
            if (pDate < now) {
                pDate.setDate(pDate.getDate() + 1);
            }

            const diff = pDate - now;
            return { ...p, dateObj: pDate, diff };
        });

        // Sort by closest diff
        prayersWithDates.sort((a, b) => a.diff - b.diff);
        nextPrayer = prayersWithDates[0];

        // Active prayer is the one that finished most recently
        // Find which prayer cards to highlight
        const justPassed = prayerList.map(p => {
            const [hrs, mins] = p.timeStr.split(':').map(Number);
            const pDate = new Date();
            pDate.setHours(hrs, mins, 0, 0);
            if (pDate > now) {
                pDate.setDate(pDate.getDate() - 1);
            }
            return { ...p, dateObj: pDate, age: now - pDate };
        }).sort((a, b) => a.age - b.age);

        if (justPassed.length > 0) {
            activePrayerKey = justPassed[0].key;
        }

        // Highlight Active card
        document.querySelectorAll('.prayer-card').forEach(card => {
            card.classList.remove('active');
            if (card.getAttribute('data-prayer') === activePrayerKey) {
                card.classList.add('active');
            }
        });

        // Set Labels
        PRAYER_DOM.nextPrayerName.textContent = `Menuju ${nextPrayer.name}`;
        
        // Tick String Output Format (HH:MM:SS)
        const diffMs = nextPrayer.diff;
        const diffSecs = Math.floor(diffMs / 1000) % 60;
        const diffMins = Math.floor(diffMs / 60000) % 60;
        const diffHrs = Math.floor(diffMs / 3600000);

        const pad = (n) => String(n).padStart(2, '0');
        PRAYER_DOM.nextPrayerTimer.textContent = `${pad(diffHrs)}:${pad(diffMins)}:${pad(diffSecs)}`;

        // Adhan Trigger Alarm check (exactly 0 diff minutes/seconds boundary)
        if (diffMs <= 1000 && PRAYER_STATE.isAdhanEnabled) {
            triggerAdhanAlarm(nextPrayer.name);
        }
    }, 1000);
}

// Play Adhan Alarm notification
function triggerAdhanAlarm(prayerName) {
    const today = new Date().toDateString();
    
    // Play only once per prayer event
    if (PRAYER_STATE.adhanPlayed[prayerName] === today) return;
    PRAYER_STATE.adhanPlayed[prayerName] = today;

    // Trigger local push notification (Android & iOS)
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(`Waktu Shalat ${prayerName} Tiba!`, {
                body: `Mari tunaikan shalat ${prayerName} untuk wilayah ${PRAYER_STATE.cityName}.`,
                icon: 'icons/icon.png',
                tag: 'sholat-alert',
                requireInteraction: true
            });
        } catch (e) {
            console.error("Local Notification failed:", e);
        }
    }

    showToast(`🕌 Waktu shalat ${prayerName} telah tiba!`);
    
    // Play beautiful public Adhan track
    const style = PRAYER_DOM.selectAdhanStyle.value;
    const trackUrl = ADHAN_TRACKS[style] || ADHAN_TRACKS.azan1;

    PRAYER_DOM.adhanAudio.src = trackUrl;
    PRAYER_DOM.adhanAudio.load();
    PRAYER_DOM.adhanAudio.play()
        .then(() => {
            showToast("Memutar kumandang Adzan...");
        })
        .catch(err => {
            console.error("Audio playback blocked by browser security policies.", err);
        });
}
