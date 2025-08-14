import * as WavEncoder from '../lib/wav-encoder.js'
import * as QuranRenderer from '../lib/quran-renderer.js'
import { AudioCapture } from '../lib/audio-capture.js'
import { GlobalKeybinds } from '../lib/keybinds.js'

function log(msg) {
    if (logel) {
        logel.textContent += msg + "\n"; 
        logel.scrollTop = logel.scrollHeight;
    } else {
        console.log(msg); // Fallback to console if log element not found
    }
}

async function updateCurrentVerse(json) {
    if (json.status == 'matched') {
        const surahNumber = parseInt(json.surah);
        const ayahNumber = parseInt(json.ayah);

        log(`✔ Found verse: ${surahNumber}:${ayahNumber}`);
        const currentState = QuranRenderer.getCurrentRenderingState();
        const selectedMode = getCurrentMode();

        // Check if we need to render new content or just update target verse
        const needsNewRender = !currentState.mode || 
                              currentState.mode !== selectedMode ||
                              (selectedMode === 'surah' && currentState.surah !== surahNumber) ||
                              (selectedMode === 'context') || // Always re-render for context mode
                              (selectedMode === 'mushaf'); // Always re-render for mushaf to find correct page

        if (needsNewRender) {
            try {
                switch (selectedMode) {
                    case 'surah':
                        await QuranRenderer.renderSurah(surahNumber, ayahNumber);
                        log(`📖 Loaded surah ${surahNumber} with verse ${ayahNumber} highlighted`);
                        break;
                    case 'context':
                        await QuranRenderer.renderVerseWithContext(surahNumber, ayahNumber);
                        log(`📖 Loaded verse ${surahNumber}:${ayahNumber} with context`);
                        break;
                    case 'mushaf':
                        const pageNumber = QuranRenderer.findPageContainingVerse(surahNumber, ayahNumber);
                        if (pageNumber) {
                            await QuranRenderer.renderMushafPage(pageNumber, {
                                targetSurah: surahNumber,
                                targetVerse: ayahNumber
                            });
                            log(`📖 Loaded page ${pageNumber} with verse ${surahNumber}:${ayahNumber} highlighted`);
                        } else {
                            log(`❌ Could not find page containing verse ${surahNumber}:${ayahNumber}`);
                            return;
                        }
                        break;
                }
            } catch (error) {
                log(`❌ Failed to load content: ${error.message}`);
                return;
            }
        } else {
            // Just update target verse if we're in the same mode and context
            if (currentState.targetVerse !== ayahNumber) {
                const success = QuranRenderer.setTargetVerse(ayahNumber);
                if (success) {
                    log(`🎯 Switched to verse ${ayahNumber} in current view`);
                } else {
                    log(`❌ Failed to switch to verse ${ayahNumber}`);
                }
            } else {
                QuranRenderer.scrollToTargetVerse();
                log(`📍 Scrolled to current verse ${surahNumber}:${ayahNumber}`);
            }
        }
    }
    else {
        log("❌ Analysis failed")
    }
}

async function loadQuranPage() {
    if (!pageInput) {
        log(`❌ Page input element not found`);
        return;
    }
    
    const pageNumber = parseInt(pageInput.value);
    
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 604) {
        log(`❌ Invalid page number: ${pageInput.value}. Please enter 1-604.`);
        return;
    }
    
    try {
        if (loadPageBtn) {
            loadPageBtn.disabled = true;
        }
        log(`📖 Loading page ${pageNumber}...`);
        await QuranRenderer.renderMushafPage(pageNumber);
        log(`✔ Page ${pageNumber} loaded successfully`);
    } catch (error) {
        log(`❌ Failed to load page ${pageNumber}: ${error.message}`);
    } finally {
        if (loadPageBtn) {
            loadPageBtn.disabled = false;
        }
    }
}

async function loadVerseWithContext() {
    if (!surahInput || !verseInput) {
        log(`❌ Required input elements not found`);
        return;
    }
    
    const surahNumber = parseInt(surahInput.value);
    const verseNumber = parseInt(verseInput.value);
    
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
        log(`❌ Invalid surah number: ${surahInput.value}. Please enter 1-114.`);
        return;
    }
    
    if (isNaN(verseNumber) || verseNumber < 1) {
        log(`❌ Invalid verse number: ${verseInput.value}. Please enter a positive number.`);
        return;
    }
    
    try {
        if (loadVerseBtn) {
            loadVerseBtn.disabled = true;
        }
        log(`📖 Loading verse ${surahNumber}:${verseNumber} with context...`);
        await QuranRenderer.renderVerseWithContext(surahNumber, verseNumber);
        log(`✔ Verse ${surahNumber}:${verseNumber} loaded successfully`);
    } catch (error) {
        log(`❌ Failed to load verse ${surahNumber}:${verseNumber}: ${error.message}`);
    } finally {
        if (loadVerseBtn) {
            loadVerseBtn.disabled = false;
        }
    }
}

async function loadSurah() {
    if (!surahNumberInput) {
        log(`❌ Surah number input element not found`);
        return;
    }
    
    const surahNumber = parseInt(surahNumberInput.value);
    const targetVerse = surahVerseInput && surahVerseInput.value ? parseInt(surahVerseInput.value) : null;
    
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
        log(`❌ Invalid surah number: ${surahNumberInput.value}. Please enter 1-114.`);
        return;
    }
    
    if (targetVerse !== null && (isNaN(targetVerse) || targetVerse < 1)) {
        log(`❌ Invalid verse number: ${surahVerseInput?.value}. Please enter a positive number.`);
        return;
    }
    
    try {
        if (loadSurahBtn) {
            loadSurahBtn.disabled = true;
        }
        const verseText = targetVerse ? ` with target verse ${targetVerse}` : '';
        log(`📖 Loading surah ${surahNumber}${verseText}...`);
        await QuranRenderer.renderSurah(surahNumber, targetVerse);
        log(`✔ Surah ${surahNumber} loaded successfully`);
    } catch (error) {
        log(`❌ Failed to load surah ${surahNumber}: ${error.message}`);
    } finally {
        if (loadSurahBtn) {
            loadSurahBtn.disabled = false;
        }
    }
}

async function analyzeCurrentAudio() {
    if (!audioCapture || !audioCapture.isCapturing) {
        log(`❌ Audio capture not active`);
        return;
    }

    const CHUNK_DURATION = 8.0; // seconds - grab 8 seconds of recent audio
    const pcm = audioCapture.getAudioChunk(CHUNK_DURATION);
    
    if (!pcm || pcm.length === 0) {
        log(`❌ No audio data available`);
        return;
    }

    // encode mono WAV at 16kHz
    const wav = WavEncoder.encodeSync({
        sampleRate: 16000,
        channelData: [pcm]
    });

    const blob = new Blob([wav], {type:'audio/wav'});
    const fd = new FormData(); 
    fd.append('chunk', blob, 'chunk.wav');
    log(`▶ sending ${blob.size/1024|0} kB from live stream…`);

    try {
        const r = await fetch('http://localhost:5000/process_chunk', {method:'POST', body:fd});
        
        if (!r.ok) {
            throw new Error(`Server error: ${r.status} ${r.statusText}`);
        }
        
        const js = await r.json();
        await updateCurrentVerse(js);
    } catch (error) {
        log(`❌ Failed to process audio chunk: ${error.message}`);
    }
}

// Audio capture and UI elements
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

let isCapturing = false;

// Mode management functions
function getCurrentMode() {
    return modeSelect.value;
}

function updateModeVisibility() {
    const selectedMode = getCurrentMode();
    
    // Hide all mode-specific controls
    mushafControls.style.display = 'none';
    contextControls.style.display = 'none';
    surahControls.style.display = 'none';
    
    // Show only the selected mode's controls
    switch (selectedMode) {
        case 'mushaf':
            mushafControls.style.display = 'block';
            break;
        case 'context':
            contextControls.style.display = 'block';
            break;
        case 'surah':
            surahControls.style.display = 'block';
            break;
    }
}

// Audio capture functions
async function toggleAudioCapture() {
    if (isCapturing) {
        stopCapture();
    } else {
        await startCapture();
    }
}

async function startCapture() {
    try {
        toggleCaptureBtn.disabled = true;
        captureStatus.textContent = 'Starting capture...';
        
        await audioCapture.startCapture();
        
        isCapturing = true;
        toggleCaptureBtn.textContent = 'Stop Capture';
        toggleCaptureBtn.classList.add('capturing');
        captureStatus.textContent = 'Capturing live audio from tab';
        analyzeBtn.disabled = false;
        
        log('✔ Started capturing audio from current tab');
    } catch (error) {
        log(`❌ Failed to start capture: ${error.message}`);
        captureStatus.textContent = 'Failed to start capture';
    } finally {
        toggleCaptureBtn.disabled = false;
    }
}

function stopCapture() {
    audioCapture.stopCapture();
    
    isCapturing = false;
    toggleCaptureBtn.textContent = 'Start Capture';
    toggleCaptureBtn.classList.remove('capturing');
    captureStatus.textContent = 'Capture stopped';
    analyzeBtn.disabled = true;
    
    log('🛑 Stopped audio capture');
}

// Footer modal functions
function showControlPanel() {
    controlModalBackdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideControlPanel() {
    controlModalBackdrop.classList.remove('show');
    document.body.style.overflow = '';
}

// Keybind action handlers
function promptAndNavigateTo(type) {
    let prompt, handler;
    
    switch (type) {
        case 'page':
            prompt = 'Enter page number (1-604):';
            handler = (value) => {
                const pageNumber = parseInt(value);
                if (pageNumber >= 1 && pageNumber <= 604) {
                    pageInput.value = pageNumber;
                    loadQuranPage();
                } else {
                    log(`❌ Invalid page number: ${value}. Please enter 1-604.`);
                }
            };
            break;
            
        case 'verse':
            prompt = 'Enter verse (format: surah:verse, e.g., 18:10):';
            handler = (value) => {
                const parts = value.split(':');
                if (parts.length === 2) {
                    const surah = parseInt(parts[0]);
                    const verse = parseInt(parts[1]);
                    if (surah >= 1 && surah <= 114 && verse >= 1) {
                        surahInput.value = surah;
                        verseInput.value = verse;
                        loadVerseWithContext();
                    } else {
                        log(`❌ Invalid verse format: ${value}. Use format surah:verse (e.g., 18:10)`);
                    }
                } else {
                    log(`❌ Invalid verse format: ${value}. Use format surah:verse (e.g., 18:10)`);
                }
            };
            break;
            
        case 'surah':
            prompt = 'Enter surah number (1-114):';
            handler = (value) => {
                const surahNumber = parseInt(value);
                if (surahNumber >= 1 && surahNumber <= 114) {
                    surahNumberInput.value = surahNumber;
                    loadSurah();
                } else {
                    log(`❌ Invalid surah number: ${value}. Please enter 1-114.`);
                }
            };
            break;
            
        default:
            log(`❌ Unknown navigation type: ${type}`);
            return;
    }
    
    const result = window.prompt(prompt);
    if (result !== null && result.trim() !== '') {
        handler(result.trim());
    }
}

function setViewMode(mode) {
    if (modeSelect.value !== mode) {
        modeSelect.value = mode;
        updateModeVisibility();
        log(`📋 Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} view mode`);
    }
}

function clearLogContent() {
    if (logel) {
        logel.textContent = '';
        log('📋 Log cleared');
    }
}

function reloadCurrentView() {
    const currentState = QuranRenderer.getCurrentRenderingState();
    if (currentState.mode) {
        switch (currentState.mode) {
            case 'surah':
                if (currentState.surah) {
                    QuranRenderer.renderSurah(currentState.surah, currentState.targetVerse);
                    log(`🔄 Reloaded surah ${currentState.surah}`);
                }
                break;
            case 'context':
                if (currentState.surah && currentState.targetVerse) {
                    QuranRenderer.renderVerseWithContext(currentState.surah, currentState.targetVerse);
                    log(`🔄 Reloaded verse ${currentState.surah}:${currentState.targetVerse} with context`);
                }
                break;
            case 'mushaf':
                if (currentState.page) {
                    QuranRenderer.renderMushafPage(currentState.page);
                    log(`🔄 Reloaded page ${currentState.page}`);
                }
                break;
            default:
                log('❌ No current view to reload');
        }
    } else {
        log('❌ No current view to reload');
    }
}

// Navigation helpers
function navigateNext() {
    const currentState = QuranRenderer.getCurrentRenderingState();
    // Basic implementation - can be enhanced based on current mode
    log('⏭ Next navigation (to be implemented based on current view)');
}

function navigatePrevious() {
    const currentState = QuranRenderer.getCurrentRenderingState();
    // Basic implementation - can be enhanced based on current mode
    log('⏮ Previous navigation (to be implemented based on current view)');
}

function goToHome() {
    const currentState = QuranRenderer.getCurrentRenderingState();
    if (currentState.surah) {
        QuranRenderer.renderSurah(currentState.surah, 1);
        log(`🏠 Navigated to beginning of surah ${currentState.surah}`);
    } else {
        log('❌ No current surah to navigate to beginning');
    }
}

function goToEnd() {
    const currentState = QuranRenderer.getCurrentRenderingState();
    if (currentState.surah) {
        // This would need surah length data to implement properly
        log(`🔚 Navigate to end of surah ${currentState.surah} (to be implemented)`);
    } else {
        log('❌ No current surah to navigate to end');
    }
}

// Event handlers
toggleCaptureBtn.onclick = toggleAudioCapture;
analyzeBtn.onclick = analyzeCurrentAudio;
loadPageBtn.onclick = loadQuranPage;
loadVerseBtn.onclick = loadVerseWithContext;
loadSurahBtn.onclick = loadSurah;
modeSelect.onchange = updateModeVisibility;

// Footer modal event handlers
toggleControlPanelBtn.onclick = showControlPanel;
closeControlPanelBtn.onclick = hideControlPanel;

// Close modal when clicking backdrop
controlModalBackdrop.onclick = (e) => {
    if (e.target === controlModalBackdrop) {
        hideControlPanel();
    }
};

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && controlModalBackdrop.classList.contains('show')) {
        hideControlPanel();
    }
});

pageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadQuranPage();
    }
});

surahInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadVerseWithContext();
    }
});

verseInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadVerseWithContext();
    }
});

surahNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadSurah();
    }
});

surahVerseInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadSurah();
    }
});

// Setup audio capture status monitoring
audioCapture.onStatusChange = (status, details) => {
    log(`🔊 Audio capture: ${status}`);
};

// Initialize global keybinds
const globalKeybinds = new GlobalKeybinds({
    actions: {
        // Audio controls
        toggleCapture: toggleAudioCapture,
        analyzeAudio: analyzeCurrentAudio,
        
        // Navigation
        goToPage: () => promptAndNavigateTo('page'),
        goToVerse: () => promptAndNavigateTo('verse'),
        goToSurah: () => promptAndNavigateTo('surah'),
        
        // View modes
        setMode: setViewMode,
        
        // Quick navigation
        nextItem: navigateNext,
        previousItem: navigatePrevious,
        goHome: goToHome,
        goEnd: goToEnd,
        
        // UI controls
        toggleControlPanel: () => {
            if (controlModalBackdrop.classList.contains('show')) {
                hideControlPanel();
            } else {
                showControlPanel();
            }
        },
        clearLog: clearLogContent,
        showHelp: () => globalKeybinds.showHelp(),
        reload: reloadCurrentView
    }
});

// Initialize Quran renderer
await QuranRenderer.initializeQuranRenderer();

// Initialize mode visibility
updateModeVisibility();

// Load initial content based on default mode
QuranRenderer.renderSurah(18);

// Log keybind initialization
log('⌨️ Global keybinds initialized. Press ? or F1 for help.');
