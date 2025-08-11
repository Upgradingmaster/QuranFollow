import * as WavEncoder from './wav-encoder.js'
import * as QuranRenderer from './quran-renderer.js'

async function decodeArrayBuffer(ab, token) {
    try {
        const buf = await ctx.decodeAudioData(ab);
        if (token !== decodeToken) return;
        audioBuf = buf;
        log(`✔ audio decoded ${(buf.length / buf.sampleRate).toFixed(1)} s @ ${buf.sampleRate} Hz`);
        btn.disabled = false;
    } catch (e) {
        log(`❌ decode failed: ${e}`);
    }
}

async function loadAudio() {
    btn.disabled = true;
    const token = ++decodeToken;
    const ab    = await fetch(player.src).then(r => r.arrayBuffer());
    await decodeArrayBuffer(ab, token);
}

function log(msg) {
    logel.textContent+=msg+"\n"; logel.scrollTop=logel.scrollHeight;
}

function updateCurrentVerse(json) {
    if (json.status == 'matched') {
        const msg = `${json.surah} : ${json.ayah}\n${json.arabic_text}`;
        quran.textContent = msg;
    }
}

async function loadQuranPage() {
    const pageNumber = parseInt(pageInput.value);
    
    if (pageNumber < 1 || pageNumber > 604) {
        log(`❌ Invalid page number: ${pageNumber}. Please enter 1-604.`);
        return;
    }
    
    try {
        loadPageBtn.disabled = true;
        log(`📖 Loading page ${pageNumber}...`);
        await QuranRenderer.renderPageToElement(pageNumber, quran);
        log(`✔ Page ${pageNumber} loaded successfully`);
    } catch (error) {
        log(`❌ Failed to load page ${pageNumber}: ${error.message}`);
    } finally {
        loadPageBtn.disabled = false;
    }
}

async function predictCurrentPosition() {
    // grab +-4 s around currentTime, resample to 16 kHz and send

    const now = player.currentTime;
    const from = Math.max(0, now - CHUNK_BACK);
    const to   = Math.min(audioBuf.duration, now + CHUNK_FWD);
    const origSR = audioBuf.sampleRate;

    // slice the original buffer
    const start  = Math.floor(from * origSR);
    const end    = Math.floor(to   * origSR);
    const slice  = audioBuf.getChannelData(0).slice(start, end); // mono(channel 0 only)

    // resample using an OfflineAudioContext
    const frames   = Math.floor((end-start) * TARGET_SR / origSR);
    const off      = new OfflineAudioContext(1, frames, TARGET_SR);
    const buf      = off.createBuffer(1, slice.length, origSR); buf.copyToChannel(slice, 0);
    const src      = off.createBufferSource();
    src.buffer     = buf; src.connect(off.destination); src.start();
    const rendered = await off.startRendering();
    const pcm      = rendered.getChannelData(0); // Float32Array @16 kHz

    // encode small little-endian mono WAV
    const wav = WavEncoder.encodeSync({
        sampleRate:  TARGET_SR,
        channelData: [pcm]
    });

    const blob= new Blob([wav], {type:'audio/wav'});
    const fd = new FormData(); fd.append('chunk', blob, 'chunk.wav');
    log(`▶ sending ${blob.size/1024|0} kB …`);

    const r  = await fetch('/process_chunk', {method:'POST', body:fd});
    const js = await r.json();

    log(JSON.stringify(js, null, 2));
    updateCurrentVerse(js);
}

// variables
const CHUNK_BACK = 4.0, CHUNK_FWD = 4.0, TARGET_SR = 16_000;
const picker = document.getElementById('pick');
const player = document.getElementById('player');
const btn    = document.getElementById('analyse');
const quran  = document.getElementById('quran');
const logel  = document.getElementById('log');
const ctx    = new AudioContext();
const pageInput = document.getElementById('page-input');
const loadPageBtn = document.getElementById('load-page');

let   audioBuf   = null;
let   decodeToken = 0;

// Handlers
picker.onchange = async () => {
    const file = picker.files[0];
    if (!file) return;

    player.src = URL.createObjectURL(file);
    player.load();

    loadAudio();
};
btn.onclick = predictCurrentPosition;
loadPageBtn.onclick = loadQuranPage;

// Allow Enter key to load page
pageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadQuranPage();
    }
});

loadAudio();

QuranRenderer.initializeQuranRenderer();
QuranRenderer.renderPageToElement(1, quran)
