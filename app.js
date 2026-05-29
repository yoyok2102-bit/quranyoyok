/* Logic Utama Aplikasi An-Nuur (Al-Quran SPA) */

// State Management
const STATE = {
    activePage: 'quran',
    activeTab: 'surah', // 'surah', 'juz', 'bookmark'
    allSurahs: [],
    currentSurah: null,
    bookmarks: [],
    lastRead: null,
    settings: {
        theme: 'dark',
        arabicSize: 32,
        showTranslation: true,
        showTransliteration: true
    },
    audioPlayer: {
        isPlaying: false,
        activeSurahNum: null,
        activeAyahNum: null,
        audioList: [],
        currentIndex: 0
    }
};

// Static Juz Mapping (Juz -> Start Surah & Start Ayah)
const JUZ_MAPPINGS = [
    { juz: 1, name: "Juz 1", startSurah: 1, startAyah: 1, surahName: "Al-Fatihah" },
    { juz: 2, name: "Juz 2", startSurah: 2, startAyah: 142, surahName: "Al-Baqarah" },
    { juz: 3, name: "Juz 3", startSurah: 2, startAyah: 253, surahName: "Al-Baqarah" },
    { juz: 4, name: "Juz 4", startSurah: 3, startAyah: 93, surahName: "Ali 'Imran" },
    { juz: 5, name: "Juz 5", startSurah: 4, startAyah: 24, surahName: "An-Nisa" },
    { juz: 6, name: "Juz 6", startSurah: 4, startAyah: 148, surahName: "An-Nisa" },
    { juz: 7, name: "Juz 7", startSurah: 5, startAyah: 82, surahName: "Al-Ma'idah" },
    { juz: 8, name: "Juz 8", startSurah: 6, startAyah: 111, surahName: "Al-An'am" },
    { juz: 9, name: "Juz 9", startSurah: 7, startAyah: 88, surahName: "Al-A'raf" },
    { juz: 10, name: "Juz 10", startSurah: 8, startAyah: 41, surahName: "Al-Anfal" },
    { juz: 11, name: "Juz 11", startSurah: 9, startAyah: 93, surahName: "At-Taubah" },
    { juz: 12, name: "Juz 12", startSurah: 11, startAyah: 6, surahName: "Hud" },
    { juz: 13, name: "Juz 13", startSurah: 12, startAyah: 53, surahName: "Yusuf" },
    { juz: 14, name: "Juz 14", startSurah: 15, startAyah: 1, surahName: "Al-Hijr" },
    { juz: 15, name: "Juz 15", startSurah: 17, startAyah: 1, surahName: "Al-Isra'" },
    { juz: 16, name: "Juz 16", startSurah: 18, startAyah: 75, surahName: "Al-Kahf" },
    { juz: 17, name: "Juz 17", startSurah: 21, startAyah: 1, surahName: "Al-Anbiya'" },
    { juz: 18, name: "Juz 18", startSurah: 23, startAyah: 1, surahName: "Al-Mu'minun" },
    { juz: 19, name: "Juz 19", startSurah: 25, startAyah: 21, surahName: "Al-Furqan" },
    { juz: 20, name: "Juz 20", startSurah: 27, startAyah: 56, surahName: "An-Naml" },
    { juz: 21, name: "Juz 21", startSurah: 29, startAyah: 46, surahName: "Al-'Ankabut" },
    { juz: 22, name: "Juz 22", startSurah: 33, startAyah: 31, surahName: "Al-Ahzab" },
    { juz: 23, name: "Juz 23", startSurah: 36, startAyah: 28, surahName: "Ya Sin" },
    { juz: 24, name: "Juz 24", startSurah: 39, startAyah: 32, surahName: "Az-Zumar" },
    { juz: 25, name: "Juz 25", startSurah: 41, startAyah: 47, surahName: "Fussilat" },
    { juz: 26, name: "Juz 26", startSurah: 46, startAyah: 1, surahName: "Al-Ahqaf" },
    { juz: 27, name: "Juz 27", startSurah: 51, startAyah: 31, surahName: "Adz-Dzariyat" },
    { juz: 28, name: "Juz 28", startSurah: 58, startAyah: 1, surahName: "Al-Mujadilah" },
    { juz: 29, name: "Juz 29", startSurah: 67, startAyah: 1, surahName: "Al-Mulk" },
    { juz: 30, name: "Juz 30", startSurah: 78, startAyah: 1, surahName: "An-Naba'" }
];

// Cache references
let DOM = {};

function initializeDOMCache() {
    DOM = {
        appContainer: document.getElementById('appContainer'),
        mainContent: document.getElementById('mainContent'),
        themeToggle: document.getElementById('themeToggle'),
        settingsToggle: document.getElementById('settingsToggle'),
        settingsModal: document.getElementById('settingsModal'),
        closeSettings: document.getElementById('closeSettings'),
        arabicFontSize: document.getElementById('arabicFontSize'),
        arabicFontPreview: document.getElementById('arabicFontPreview'),
        toggleTranslation: document.getElementById('toggleTranslation'),
        toggleTransliteration: document.getElementById('toggleTransliteration'),
        quranSearch: document.getElementById('quranSearch'),
        quranGrid: document.getElementById('quranGrid'),
        globalLoading: document.getElementById('globalLoading'),
        
        // Bottom Nav & Tabs
        navItems: document.querySelectorAll('.nav-item'),
        tabSurah: document.getElementById('tabSurah'),
        tabJuz: document.getElementById('tabJuz'),
        tabBookmark: document.getElementById('tabBookmark'),
        
        // Pages
        pageQuran: document.getElementById('page-quran'),
        pageSurahDetail: document.getElementById('page-surah-detail'),
        pagePrayer: document.getElementById('page-prayer'),
        pageQibla: document.getElementById('page-qibla'),
        
        // Surah Detail
        btnBackToQuran: document.getElementById('btnBackToQuran'),
        detailSurahName: document.getElementById('detailSurahName'),
        detailSurahDesc: document.getElementById('detailSurahDesc'),
        btnPlayFullSurah: document.getElementById('btnPlayFullSurah'),
        bismillahContainer: document.getElementById('bismillahContainer'),
        ayahsList: document.getElementById('ayahsList'),
        
        // Last read card
        lastReadSurah: document.getElementById('lastReadSurah'),
        lastReadAyah: document.getElementById('lastReadAyah'),
        btnResumeRead: document.getElementById('btnResumeRead'),

        // Floating Audio Elements
        globalAudioBar: document.getElementById('globalAudioBar'),
        audioTrackTitle: document.getElementById('audioTrackTitle'),
        audioTrackSub: document.getElementById('audioTrackSub'),
        audioBtnPlay: document.getElementById('audioBtnPlay'),
        audioBtnPrev: document.getElementById('audioBtnPrev'),
        audioBtnNext: document.getElementById('audioBtnNext'),
        audioProgressBar: document.getElementById('audioProgressBar'),
        audioBtnClose: document.getElementById('audioBtnClose'),
        quranAudio: document.getElementById('quranAudio')
    };
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeDOMCache();
    } catch (e) {
        console.error("DOM Cache Initialization error:", e);
    }

    try {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) { console.error("Lucide init error:", e); }
    
    try { loadSettings(); } catch (e) { console.error("loadSettings error:", e); }
    try { loadLocalData(); } catch (e) { console.error("loadLocalData error:", e); }
    try { setupEventListeners(); } catch (e) { console.error("setupEventListeners error:", e); }
    try { fetchSurahList(); } catch (e) { console.error("fetchSurahList error:", e); }

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registered successfully!', reg.scope))
                .catch(err => console.error('Service Worker registration failed:', err));
        });
    }
});

// Settings & Local Storage
function loadSettings() {
    try {
        const saved = localStorage.getItem('annuur_settings');
        if (saved) {
            STATE.settings = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Local storage settings parse error:", e);
    }
    
    // Apply Settings to UI
    try {
        applyTheme(STATE.settings.theme || 'dark');
        DOM.arabicFontSize.value = STATE.settings.arabicSize || 32;
        DOM.arabicFontPreview.style.fontSize = `${STATE.settings.arabicSize || 32}px`;
        DOM.toggleTranslation.checked = STATE.settings.showTranslation !== false;
        DOM.toggleTransliteration.checked = STATE.settings.showTransliteration !== false;
    } catch (e) {
        console.error("Error applying settings to UI:", e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('annuur_settings', JSON.stringify(STATE.settings));
    } catch (e) {
        console.error("saveSettings error:", e);
    }
}

function applyTheme(theme) {
    try {
        const icon = DOM.themeToggle.querySelector('i, svg');
        if (theme === 'light') {
            document.body.classList.add('theme-light');
            if (icon) icon.setAttribute('data-lucide', 'sun');
        } else {
            document.body.classList.remove('theme-light');
            if (icon) icon.setAttribute('data-lucide', 'moon');
        }
    } catch (e) {
        console.error("applyTheme DOM manipulation error:", e);
    }
    
    if (typeof lucide !== 'undefined') {
        try {
            lucide.createIcons();
        } catch (e) {
            console.error("Lucide icon generation error:", e);
        }
    }
    STATE.settings.theme = theme;
    saveSettings();
}

function loadLocalData() {
    // Bookmarks
    try {
        const b = localStorage.getItem('annuur_bookmarks');
        if (b) STATE.bookmarks = JSON.parse(b);
    } catch (e) {
        console.error("loadBookmarks error:", e);
    }
    
    // Last Read
    try {
        const lr = localStorage.getItem('annuur_lastread');
        if (lr) {
            STATE.lastRead = JSON.parse(lr);
            DOM.lastReadSurah.textContent = STATE.lastRead.surahName || "Al-Fatihah";
            DOM.lastReadAyah.textContent = `Ayat ${STATE.lastRead.ayahNum || 1} • Juz ${STATE.lastRead.juz || 1}`;
        } else {
            DOM.lastReadSurah.textContent = "Al-Fatihah";
            DOM.lastReadAyah.textContent = "Belum ada riwayat membaca";
        }
    } catch (e) {
        console.error("loadLastRead error:", e);
        DOM.lastReadSurah.textContent = "Al-Fatihah";
        DOM.lastReadAyah.textContent = "Belum ada riwayat membaca";
    }
}

function saveBookmarks() {
    try {
        localStorage.setItem('annuur_bookmarks', JSON.stringify(STATE.bookmarks));
    } catch (e) {
        console.error("saveBookmarks error:", e);
    }
}

function saveLastRead(surahNum, surahName, ayahNum, juz) {
    STATE.lastRead = { surahNum, surahName, ayahNum, juz };
    localStorage.setItem('annuur_lastread', JSON.stringify(STATE.lastRead));
    DOM.lastReadSurah.textContent = surahName;
    DOM.lastReadAyah.textContent = `Ayat ${ayahNum} • Juz ${juz}`;
}

// Router
function switchPage(pageId) {
    // Stop single ayah playing if switching page (optional, but good practice)
    STATE.activePage = pageId;
    
    document.querySelectorAll('.app-page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    DOM.navItems.forEach(item => {
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners Setup
function setupEventListeners() {
    // Nav Items click
    if (DOM.navItems) {
        DOM.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.getAttribute('data-page');
                switchPage(page);
            });
        });
    }

    // Theme Toggle
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', () => {
            const nextTheme = STATE.settings.theme === 'light' ? 'dark' : 'light';
            applyTheme(nextTheme);
        });
    }

    // Settings Toggle
    if (DOM.settingsToggle) {
        DOM.settingsToggle.addEventListener('click', () => {
            if (DOM.settingsModal) DOM.settingsModal.classList.add('visible');
        });
    }

    if (DOM.closeSettings) {
        DOM.closeSettings.addEventListener('click', () => {
            if (DOM.settingsModal) DOM.settingsModal.classList.remove('visible');
        });
    }

    if (DOM.settingsModal) {
        DOM.settingsModal.addEventListener('click', (e) => {
            if (e.target === DOM.settingsModal) {
                DOM.settingsModal.classList.remove('visible');
            }
        });
    }

    // Font Size Slider
    if (DOM.arabicFontSize) {
        DOM.arabicFontSize.addEventListener('input', (e) => {
            const val = e.target.value;
            if (DOM.arabicFontPreview) DOM.arabicFontPreview.style.fontSize = `${val}px`;
            STATE.settings.arabicSize = parseInt(val);
            saveSettings();
            applyFontSizeToAyahs();
        });
    }

    // Toggle Toggles
    if (DOM.toggleTranslation) {
        DOM.toggleTranslation.addEventListener('change', (e) => {
            STATE.settings.showTranslation = e.target.checked;
            saveSettings();
            applyTranslationVisibility();
        });
    }

    if (DOM.toggleTransliteration) {
        DOM.toggleTransliteration.addEventListener('change', (e) => {
            STATE.settings.showTransliteration = e.target.checked;
            saveSettings();
            applyTranslationVisibility();
        });
    }

    // Tabs inside Quran
    if (DOM.tabSurah) {
        DOM.tabSurah.addEventListener('click', () => {
            setQuranTab('surah');
        });
    }
    if (DOM.tabJuz) {
        DOM.tabJuz.addEventListener('click', () => {
            setQuranTab('juz');
        });
    }
    if (DOM.tabBookmark) {
        DOM.tabBookmark.addEventListener('click', () => {
            setQuranTab('bookmark');
        });
    }

    // Search bar filter
    if (DOM.quranSearch) {
        DOM.quranSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            filterQuranGrid(query);
        });
    }

    // Back to Quran detail
    if (DOM.btnBackToQuran) {
        DOM.btnBackToQuran.addEventListener('click', () => {
            switchPage('quran');
        });
    }

    // Resume last read
    if (DOM.btnResumeRead) {
        DOM.btnResumeRead.addEventListener('click', () => {
            if (STATE.lastRead) {
                loadSurahDetail(STATE.lastRead.surahNum, STATE.lastRead.ayahNum);
            } else {
                loadSurahDetail(1); // default Al-Fatihah
            }
        });
    }

    // Audio bar listeners
    if (DOM.audioBtnPlay) DOM.audioBtnPlay.addEventListener('click', toggleAudioPlayback);
    if (DOM.audioBtnClose) {
        DOM.audioBtnClose.addEventListener('click', () => {
            if (DOM.quranAudio) DOM.quranAudio.pause();
            STATE.audioPlayer.isPlaying = false;
            if (DOM.globalAudioBar) DOM.globalAudioBar.classList.remove('visible');
            // Remove highlighting
            document.querySelectorAll('.ayah-row').forEach(row => row.classList.remove('active-playing'));
        });
    }

    // Audio progress bar click to seek
    if (DOM.globalAudioBar) {
        const progressContainer = DOM.globalAudioBar.querySelector('.audio-progress-container');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                const barWidth = e.currentTarget.offsetWidth;
                const clickX = e.offsetX;
                const duration = DOM.quranAudio ? DOM.quranAudio.duration : 0;
                if (duration && DOM.quranAudio) {
                    DOM.quranAudio.currentTime = (clickX / barWidth) * duration;
                }
            });
        }
    }

    // Audio playback monitor
    if (DOM.quranAudio) {
        DOM.quranAudio.addEventListener('timeupdate', () => {
            if (DOM.quranAudio && DOM.audioProgressBar) {
                const pct = (DOM.quranAudio.currentTime / DOM.quranAudio.duration) * 100;
                DOM.audioProgressBar.style.width = `${pct}%`;
            }
        });

        DOM.quranAudio.addEventListener('ended', playNextInQueue);
    }

    if (DOM.audioBtnNext) DOM.audioBtnNext.addEventListener('click', playNextInQueue);
    if (DOM.audioBtnPrev) DOM.audioBtnPrev.addEventListener('click', playPrevInQueue);
}

// Set Quran tab views
function setQuranTab(tabName) {
    STATE.activeTab = tabName;
    
    [DOM.tabSurah, DOM.tabJuz, DOM.tabBookmark].forEach(btn => btn.classList.remove('active'));
    
    if (tabName === 'surah') {
        DOM.tabSurah.classList.add('active');
        renderSurahGrid();
        DOM.quranSearch.style.display = 'block';
    } else if (tabName === 'juz') {
        DOM.tabJuz.classList.add('active');
        renderJuzGrid();
        DOM.quranSearch.style.display = 'none';
    } else if (tabName === 'bookmark') {
        DOM.tabBookmark.classList.add('active');
        renderBookmarkGrid();
        DOM.quranSearch.style.display = 'none';
    }
}

// Fetch 114 Surahs
async function fetchSurahList() {
    DOM.globalLoading.style.display = 'flex';
    try {
        const res = await fetch('https://equran.id/api/v2/surat');
        const data = await res.json();
        
        if (data.code === 200) {
            STATE.allSurahs = data.data;
            renderSurahGrid();
        } else {
            showError("Gagal mengambil data Al-Quran.");
        }
    } catch (err) {
        console.error(err);
        showError("Masalah koneksi internet.");
    } finally {
        DOM.globalLoading.style.display = 'none';
    }
}

// Render Grid
function renderSurahGrid(surahList = STATE.allSurahs) {
    DOM.quranGrid.innerHTML = '';
    
    if (surahList.length === 0) {
        DOM.quranGrid.innerHTML = `<div class="glass-card text-center" style="grid-column: 1/-1;">Surah tidak ditemukan</div>`;
        return;
    }

    surahList.forEach(s => {
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.setAttribute('data-id', s.nomor);
        
        card.innerHTML = `
            <div class="surah-left">
                <div class="surah-number-badge">${s.nomor}</div>
                <div class="surah-meta">
                    <h3>${s.namaLatin}</h3>
                    <p>${s.tempatTurun} • ${s.arti}</p>
                </div>
            </div>
            <div class="surah-right">
                <div class="surah-arabic">${s.nama}</div>
                <div class="surah-verses">${s.jumlahAyat} Ayat</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            loadSurahDetail(s.nomor);
        });
        
        DOM.quranGrid.appendChild(card);
    });
}

// Render Juz Tab
function renderJuzGrid() {
    DOM.quranGrid.innerHTML = '';
    
    JUZ_MAPPINGS.forEach(j => {
        const card = document.createElement('div');
        card.className = 'surah-card';
        
        card.innerHTML = `
            <div class="surah-left">
                <div class="surah-number-badge">${j.juz}</div>
                <div class="surah-meta">
                    <h3>Juz ${j.juz}</h3>
                    <p>Mulai dari Surah ${j.surahName} (Ayat ${j.startAyah})</p>
                </div>
            </div>
            <div class="surah-right">
                <i data-lucide="book-open" class="icon-gold"></i>
            </div>
        `;
        
        card.addEventListener('click', () => {
            loadSurahDetail(j.startSurah, j.startAyah);
        });
        
        DOM.quranGrid.appendChild(card);
    });
    lucide.createIcons();
}

// Render Bookmarks Grid
function renderBookmarkGrid() {
    DOM.quranGrid.innerHTML = '';
    
    if (STATE.bookmarks.length === 0) {
        DOM.quranGrid.innerHTML = `
            <div class="glass-card text-center" style="padding:30px; color:var(--text-secondary);">
                <i data-lucide="bookmark" style="width:40px; height:40px; margin-bottom:10px; opacity:0.5;"></i>
                <p>Belum ada ayat favorit ditambahkan.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    STATE.bookmarks.forEach(b => {
        const card = document.createElement('div');
        card.className = 'surah-card';
        
        card.innerHTML = `
            <div class="surah-left">
                <div class="surah-number-badge"><i data-lucide="heart" style="width:14px; fill:var(--accent-gold);"></i></div>
                <div class="surah-meta">
                    <h3>${b.surahName} [Ayat ${b.ayahNum}]</h3>
                    <p>Juz ${b.juz}</p>
                </div>
            </div>
            <div class="surah-right">
                <i data-lucide="chevron-right"></i>
            </div>
        `;
        
        card.addEventListener('click', () => {
            loadSurahDetail(b.surahNum, b.ayahNum);
        });
        
        DOM.quranGrid.appendChild(card);
    });
    lucide.createIcons();
}

// Search filtering
function filterQuranGrid(query) {
    if (STATE.activeTab !== 'surah') return;
    
    const filtered = STATE.allSurahs.filter(s => {
        return s.namaLatin.toLowerCase().includes(query) || 
               s.arti.toLowerCase().includes(query) ||
               s.nomor.toString() === query;
    });
    
    renderSurahGrid(filtered);
}

// Fetch and display Surah details
async function loadSurahDetail(surahNum, scrolltoAyah = null) {
    DOM.globalLoading.style.display = 'flex';
    switchPage('surah-detail');
    
    try {
        const res = await fetch(`https://equran.id/api/v2/surat/${surahNum}`);
        const data = await res.json();
        
        if (data.code === 200) {
            const s = data.data;
            STATE.currentSurah = s;
            
            // Render Headers
            DOM.detailSurahName.textContent = s.namaLatin;
            DOM.detailSurahDesc.textContent = `${s.tempatTurun} • ${s.arti} • ${s.jumlahAyat} Ayat`;
            
            // Play Full Surah Audio Action button
            DOM.btnPlayFullSurah.onclick = () => {
                playSurahAudioPlaylist(s);
            };

            // Hide/Show Bismillah (except for At-Taubah Surah 9)
            if (s.nomor === 9 || s.nomor === 1) {
                DOM.bismillahContainer.style.display = 'none';
            } else {
                DOM.bismillahContainer.style.display = 'block';
            }

            // Render Ayahs List
            renderAyahs(s.ayat, s.namaLatin, s.nomor);
            
            // Scroll to specific Ayah
            if (scrolltoAyah) {
                setTimeout(() => {
                    const el = document.getElementById(`ayah-${surahNum}-${scrolltoAyah}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('active-playing');
                        setTimeout(() => el.classList.remove('active-playing'), 3000);
                    }
                }, 400);
            }
            
        } else {
            showError("Gagal memuat detail surah.");
            switchPage('quran');
        }
    } catch (err) {
        console.error(err);
        showError("Koneksi gagal.");
        switchPage('quran');
    } finally {
        DOM.globalLoading.style.display = 'none';
    }
}

// Render individual Ayah rows inside the surah detail
function renderAyahs(ayahList, surahName, surahNum) {
    DOM.ayahsList.innerHTML = '';
    
    ayahList.forEach(a => {
        const isBookmarked = STATE.bookmarks.some(b => b.surahNum === surahNum && b.ayahNum === a.nomorAyat);
        const row = document.createElement('div');
        row.className = `ayah-row`;
        row.id = `ayah-${surahNum}-${a.nomorAyat}`;
        
        row.innerHTML = `
            <div class="ayah-header">
                <span class="ayah-badge">${surahNum}:${a.nomorAyat}</span>
                <div class="ayah-actions">
                    <button class="ayah-btn btn-bookmark" title="Favorit">
                        <i data-lucide="${isBookmarked ? 'heart' : 'bookmark'}" style="${isBookmarked ? 'fill:var(--accent-gold); color:var(--accent-gold);' : ''}"></i>
                    </button>
                    <button class="ayah-btn btn-play-ayah" title="Putar Murottal">
                        <i data-lucide="play-circle"></i>
                    </button>
                </div>
            </div>
            <div class="ayah-arabic" style="font-size: ${STATE.settings.arabicSize}px">${a.teksArab}</div>
            <div class="ayah-transliteration">${a.teksLatin}</div>
            <div class="ayah-translation">${a.teksIndonesia}</div>
        `;
        
        // Listeners for individual items
        row.querySelector('.btn-bookmark').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBookmark(surahNum, surahName, a.nomorAyat, standardGetJuz(surahNum, a.nomorAyat), row.querySelector('.btn-bookmark i, .btn-bookmark svg'));
        });

        row.querySelector('.btn-play-ayah').addEventListener('click', (e) => {
            e.stopPropagation();
            playAyahAudio(a, surahNum, surahName);
        });

        // Set Last Read automatically when clicking a row anywhere
        row.addEventListener('click', () => {
            saveLastRead(surahNum, surahName, a.nomorAyat, standardGetJuz(surahNum, a.nomorAyat));
            showToast(`Ditandai Terakhir Dibaca: Surah ${surahName} ayat ${a.nomorAyat}`);
        });

        DOM.ayahsList.appendChild(row);
    });

    applyTranslationVisibility();
    lucide.createIcons();
}

// Adjust Arabic Font Size dynamically
function applyFontSizeToAyahs() {
    document.querySelectorAll('.ayah-arabic').forEach(el => {
        el.style.fontSize = `${STATE.settings.arabicSize}px`;
    });
}

// Hide/Show Translation and Transliteration layers
function applyTranslationVisibility() {
    document.querySelectorAll('.ayah-translation').forEach(el => {
        el.style.display = STATE.settings.showTranslation ? 'block' : 'none';
    });
    document.querySelectorAll('.ayah-transliteration').forEach(el => {
        el.style.display = STATE.settings.showTransliteration ? 'block' : 'none';
    });
}

// Bookmarking Handler
function toggleBookmark(surahNum, surahName, ayahNum, juz, iconEl) {
    const idx = STATE.bookmarks.findIndex(b => b.surahNum === surahNum && b.ayahNum === ayahNum);
    
    if (idx > -1) {
        STATE.bookmarks.splice(idx, 1);
        iconEl.setAttribute('data-lucide', 'bookmark');
        iconEl.style.fill = 'none';
        iconEl.style.color = 'var(--text-secondary)';
        showToast("Ayat dihapus dari Favorit.");
    } else {
        STATE.bookmarks.push({ surahNum, surahName, ayahNum, juz });
        iconEl.setAttribute('data-lucide', 'heart');
        iconEl.style.fill = 'var(--accent-gold)';
        iconEl.style.color = 'var(--accent-gold)';
        showToast("Ayat ditambahkan ke Favorit.");
    }
    
    saveBookmarks();
    lucide.createIcons();
}

// Helper to estimate standard Juz (fallback, or approximate)
function standardGetJuz(surahNum, ayahNum) {
    // Return approximate juz based on JUZ_MAPPINGS
    let targetJuz = 1;
    for (let i = 0; i < JUZ_MAPPINGS.length; i++) {
        const item = JUZ_MAPPINGS[i];
        if (surahNum > item.startSurah || (surahNum === item.startSurah && ayahNum >= item.startAyah)) {
            targetJuz = item.juz;
        }
    }
    return targetJuz;
}

// Murottal Audio Actions
function playAyahAudio(ayahData, surahNum, surahName) {
    // Reset highlights
    document.querySelectorAll('.ayah-row').forEach(row => row.classList.remove('active-playing'));
    
    const rowEl = document.getElementById(`ayah-${surahNum}-${ayahData.nomorAyat}`);
    if (rowEl) rowEl.classList.add('active-playing');

    // Get Qori Audio (let's use standard qori audio provided by equran.id, usually audio.01 (Misyari Rasyid))
    const audioUrl = ayahData.audio['01'];
    
    STATE.audioPlayer.activeSurahNum = surahNum;
    STATE.audioPlayer.activeAyahNum = ayahData.nomorAyat;
    STATE.audioPlayer.audioList = [{ url: audioUrl, title: `Surah ${surahName}`, sub: `Ayat ${ayahData.nomorAyat}` }];
    STATE.audioPlayer.currentIndex = 0;

    DOM.audioTrackTitle.textContent = `Surah ${surahName}`;
    DOM.audioTrackSub.textContent = `Ayat ${ayahData.nomorAyat}`;
    
    DOM.quranAudio.src = audioUrl;
    DOM.quranAudio.play();
    STATE.audioPlayer.isPlaying = true;
    
    const playIcon = DOM.audioBtnPlay.querySelector('i, svg');
    if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
    DOM.globalAudioBar.classList.add('visible');
    lucide.createIcons();
}

function playSurahAudioPlaylist(surahData) {
    STATE.audioPlayer.activeSurahNum = surahData.nomor;
    STATE.audioPlayer.activeAyahNum = null;
    
    // Compile ayahs audio list
    STATE.audioPlayer.audioList = surahData.ayat.map(a => ({
        url: a.audio['01'],
        title: `Surah ${surahData.namaLatin}`,
        sub: `Ayat ${a.nomorAyat}`,
        ayahNum: a.nomorAyat
    }));
    STATE.audioPlayer.currentIndex = 0;

    startQueuePlayback();
}

function startQueuePlayback() {
    if (STATE.audioPlayer.audioList.length === 0) return;
    const current = STATE.audioPlayer.audioList[STATE.audioPlayer.currentIndex];
    
    DOM.audioTrackTitle.textContent = current.title;
    DOM.audioTrackSub.textContent = current.sub;
    
    // Highlight if on the same surah page
    document.querySelectorAll('.ayah-row').forEach(row => row.classList.remove('active-playing'));
    if (current.ayahNum) {
        const rowEl = document.getElementById(`ayah-${STATE.audioPlayer.activeSurahNum}-${current.ayahNum}`);
        if (rowEl) {
            rowEl.classList.add('active-playing');
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    DOM.quranAudio.src = current.url;
    DOM.quranAudio.play();
    STATE.audioPlayer.isPlaying = true;
    
    const playIcon = DOM.audioBtnPlay.querySelector('i, svg');
    if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
    DOM.globalAudioBar.classList.add('visible');
    lucide.createIcons();
}

function playNextInQueue() {
    if (STATE.audioPlayer.currentIndex < STATE.audioPlayer.audioList.length - 1) {
        STATE.audioPlayer.currentIndex++;
        startQueuePlayback();
    } else {
        // finished surah
        DOM.globalAudioBar.classList.remove('visible');
        STATE.audioPlayer.isPlaying = false;
        document.querySelectorAll('.ayah-row').forEach(row => row.classList.remove('active-playing'));
    }
}

function playPrevInQueue() {
    if (STATE.audioPlayer.currentIndex > 0) {
        STATE.audioPlayer.currentIndex--;
        startQueuePlayback();
    }
}

function toggleAudioPlayback() {
    const playIcon = DOM.audioBtnPlay.querySelector('i, svg');
    if (STATE.audioPlayer.isPlaying) {
        DOM.quranAudio.pause();
        STATE.audioPlayer.isPlaying = false;
        if (playIcon) playIcon.setAttribute('data-lucide', 'play');
    } else {
        DOM.quranAudio.play();
        STATE.audioPlayer.isPlaying = true;
        if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
    }
    lucide.createIcons();
}

// UI Alerts / Toast helper
function showToast(msg) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '90px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.zIndex = '999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.style.background = 'rgba(13, 92, 58, 0.95)';
    toast.style.color = '#fff';
    toast.style.border = '1px solid var(--accent-gold)';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '20px';
    toast.style.fontSize = '0.8rem';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    toast.style.animation = 'fadeInSlide 0.3s ease-out';
    toast.textContent = msg;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

function showError(msg) {
    showToast(`⚠️ ${msg}`);
}
