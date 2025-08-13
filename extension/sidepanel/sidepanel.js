import * as WavEncoder from '../lib/wav-encoder.js'
import * as QuranRenderer from '../lib/quran-renderer.js'
import { AudioCapture } from '../lib/audio-capture.js'

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

        if (!currentState.mode || currentState.surah !== surahNumber) { // new surah
            try {
                await QuranRenderer.renderSurah(surahNumber, ayahNumber);
                log(`📖 Loaded surah ${surahNumber} with verse ${ayahNumber} highlighted`);
            } catch (error) {
                log(`❌ Failed to load surah ${surahNumber}: ${error.message}`);
                return;
            }
        }
        else { // same surah
            if (currentState.targetVerse !== ayahNumber) { // new ayah
                const success = QuranRenderer.setTargetVerse(ayahNumber);
                if (success) {
                    log(`🎯 Switched to verse ${ayahNumber} in current surah`);
                } else {
                    log(`❌ Failed to switch to verse ${ayahNumber}`);
                }
            } else {// same ayah
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

// Event handlers
toggleCaptureBtn.onclick = toggleAudioCapture;
analyzeBtn.onclick = analyzeCurrentAudio;
loadPageBtn.onclick = loadQuranPage;
loadVerseBtn.onclick = loadVerseWithContext;
loadSurahBtn.onclick = loadSurah;

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

// Initialize Quran renderer
await QuranRenderer.initializeQuranRenderer();
QuranRenderer.renderSurah(18);