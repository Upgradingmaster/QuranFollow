import * as QuranRenderer from '../lib/quran-renderer.js'
import { AudioCapture } from '../lib/audio-capture.js'
import { GlobalKeybinds } from '../lib/keybinds.js'
import { NavigationActions } from '../lib/navigation-actions.js'
import { AudioActions } from '../lib/audio-actions.js'
import { UIActions } from '../lib/ui-actions.js'

// Logging function
function log(msg) {
    if (logel) {
        logel.textContent += msg + "\n"; 
        logel.scrollTop = logel.scrollHeight;
    } else {
        console.log(msg);
    }
}

// DOM Elements
const audioCapture = new AudioCapture();
const toggleCaptureBtn = document.getElementById('toggle-capture');
const captureStatus = document.getElementById('capture-status');
const analyzeBtn = document.getElementById('analyse');
const quran = document.getElementById('quran');
const logel = document.getElementById('log');

// Footer modal elements
const toggleControlPanelBtn = document.getElementById('toggle-control-panel');
const closeControlPanelBtn = document.getElementById('close-control-panel');
const controlModalBackdrop = document.getElementById('control-modal-backdrop');

// Mode selection elements
const modeSelect = document.getElementById('mode-select');
const mushafControls = document.getElementById('mushaf-controls');
const contextControls = document.getElementById('context-controls');
const surahControls = document.getElementById('surah-controls');

// Navigation elements
const pageInput = document.getElementById('page-input');
const loadPageBtn = document.getElementById('load-page');
const surahInput = document.getElementById('surah-input');
const verseInput = document.getElementById('verse-input');
const loadVerseBtn = document.getElementById('load-verse');
const surahNumberInput = document.getElementById('surah-number-input');
const surahVerseInput = document.getElementById('surah-verse-input');
const loadSurahBtn = document.getElementById('load-surah');

// Prepare element dependencies
const elements = {
    toggleCaptureBtn,
    captureStatus,
    analyzeBtn,
    quran,
    logel,
    controlModalBackdrop,
    modeSelect,
    mushafControls,
    contextControls,
    surahControls,
    pageInput,
    loadPageBtn,
    surahInput,
    verseInput,
    loadVerseBtn,
    surahNumberInput,
    surahVerseInput,
    loadSurahBtn
};

// Initialize action modules
const uiActions = new UIActions({ log, elements });
const navigationActions = new NavigationActions({ log, elements });
const audioActions = new AudioActions({ 
    log, 
    audioCapture, 
    elements, 
    navigationActions,
    uiActions
});

// Initialize global keybinds with modular actions
const globalKeybinds = new GlobalKeybinds({
    actions: {
        // Audio controls
        toggleCapture: () => audioActions.toggleAudioCapture(),
        analyzeAudio: () => audioActions.analyzeCurrentAudio(),
        
        // Navigation
        goToPage: () => navigationActions.promptAndNavigateTo('page'),
        goToVerse: () => navigationActions.promptAndNavigateTo('verse'),
        goToSurah: () => navigationActions.promptAndNavigateTo('surah'),
        
        // View modes
        setMode: (mode) => uiActions.setViewMode(mode),
        
        // Quick navigation
        nextItem: () => navigationActions.navigateNext(),
        previousItem: () => navigationActions.navigatePrevious(),
        goHome: () => navigationActions.goToHome(),
        goEnd: () => navigationActions.goToEnd(),
        
        // UI controls
        toggleControlPanel: () => uiActions.toggleControlPanel(),
        clearLog: () => uiActions.clearLogContent(),
        showHelp: () => globalKeybinds.showHelp(),
        reload: () => navigationActions.reloadCurrentView()
    }
});

// Event handlers - directly using action modules
toggleCaptureBtn.onclick = () => audioActions.toggleAudioCapture();
analyzeBtn.onclick = () => audioActions.analyzeCurrentAudio();
loadPageBtn.onclick = () => navigationActions.loadQuranPage();
loadVerseBtn.onclick = () => navigationActions.loadVerseWithContext();
loadSurahBtn.onclick = () => navigationActions.loadSurah();
modeSelect.onchange = () => uiActions.updateModeVisibility();

// Footer modal event handlers
toggleControlPanelBtn.onclick = () => uiActions.showControlPanel();
closeControlPanelBtn.onclick = () => uiActions.hideControlPanel();

// Close modal when clicking backdrop
controlModalBackdrop.onclick = (e) => {
    if (e.target === controlModalBackdrop) {
        uiActions.hideControlPanel();
    }
};

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && controlModalBackdrop.classList.contains('show')) {
        uiActions.hideControlPanel();
    }
});

// Keyboard event handlers for inputs
pageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigationActions.loadQuranPage();
    }
});

surahInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigationActions.loadVerseWithContext();
    }
});

verseInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigationActions.loadVerseWithContext();
    }
});

surahNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigationActions.loadSurah();
    }
});

surahVerseInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigationActions.loadSurah();
    }
});

// Setup audio capture status monitoring
audioCapture.onStatusChange = (status, details) => {
    log(`🔊 Audio capture: ${status}`);
};

// Initialize application
async function initializeApp() {
    // Initialize Quran renderer
    await QuranRenderer.initializeQuranRenderer();

    // Initialize mode visibility
    uiActions.updateModeVisibility();

    // Load initial content based on default mode
    QuranRenderer.renderSurah(18);

    // Log initialization complete
    log('⌨️ Global keybinds initialized. Press ? or F1 for help.');
    log('🎯 Application initialized successfully');
}

// Start the application
initializeApp().catch(error => {
    log(`❌ Failed to initialize application: ${error.message}`);
    console.error('App initialization error:', error);
});