import * as WavEncoder from './wav-encoder.js';
import { AudioCapture } from './capture.js';

export class AudioModule {
    constructor(dependencies) {
        this.audioCapture = new AudioCapture();
        this.log = dependencies.log;
        this.elements = dependencies.elements;
    }

    async analyzeCurrentAudio() {
        if (!this.audioCapture || !this.audioCapture.isCapturing) {
            this.log(`[X] Audio capture not active`);
            return;
        }

        const CHUNK_DURATION = 8.0; // seconds - grab 8 seconds of recent audio
        const pcm = this.audioCapture.getAudioChunk(CHUNK_DURATION);
        
        if (!pcm || pcm.length === 0) {
            this.log(`[X] No audio data available`);
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
        this.log(`Sending past ${CHUNK_DURATION}s of audio to backend…`);

        try {
            const r = await fetch('http://localhost:5000/process_chunk', {method:'POST', body:fd});
        } catch (error) {
            this.log(`[X] Couldn't get prediction from backend. Make sure it is running.`);
            this.log(undefined, error);
        }
            
        if (!r.ok) {
            throw new Error(`Server error: ${r.status} ${r.statusText}`);
        }

        const json = await r.json();
        this.log(`Received response from the backend:`, undefined, true);
        this.log(json, undefined, true);
        return json;
    }

    async toggleAudioCapture() {
        if (this.audioCapture.isCapturing) {
            this.stopCapture();
        } else {
            await this.startCapture();
        }
    }

    async startCapture() {
        const { toggleCaptureBtn, captureStatus, analyzeBtn } = this.elements;
        
        try {
            if (toggleCaptureBtn) {
                toggleCaptureBtn.disabled = true;
            }
            if (captureStatus) {
                captureStatus.textContent = 'Starting capture...';
            }
            
            await this.audioCapture.startCapture();
            
            if (toggleCaptureBtn) {
                toggleCaptureBtn.textContent = 'Stop Capture';
                toggleCaptureBtn.classList.add('capturing');
            }
            if (captureStatus) {
                captureStatus.textContent = 'Capturing live audio from tab';
            }
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
            }
            
            this.log('Started capturing audio from current tab');
        } catch (error) {
            this.log(`[X] Failed to start capture`, error);
            if (captureStatus) {
                captureStatus.textContent = 'Failed to start capture';
            }
        } finally {
            if (toggleCaptureBtn) {
                toggleCaptureBtn.disabled = false;
            }
        }
    }

    stopCapture() {
        const { toggleCaptureBtn, captureStatus, analyzeBtn } = this.elements;
        
        this.audioCapture.stopCapture();
        
        if (toggleCaptureBtn) {
            toggleCaptureBtn.textContent = 'Start Capture';
            toggleCaptureBtn.classList.remove('capturing');
        }
        if (captureStatus) {
            captureStatus.textContent = 'Capture stopped';
        }
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
        }
        
        this.log('Stopped capturing audio from current tab');
    }
}
