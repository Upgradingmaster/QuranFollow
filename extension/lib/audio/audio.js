import * as WavEncoder from './wav-encoder.js';
import { AudioCapture } from './capture.js';

export class AudioModule {
    constructor(dependencies) {
        this.audioCapture = new AudioCapture(dependencies);
        this.log = dependencies.log;
        this.elements = dependencies.elements;
    }

    async analyzeCurrentAudio() {
        if (!this.audioCapture || !this.audioCapture.isCapturing) {
            this.log(`❌ Audio capture not active`);
            return;
        }

        const CHUNK_DURATION = 8.0; // seconds - grab 8 seconds of recent audio
        const pcm = this.audioCapture.getAudioChunk(CHUNK_DURATION);
        
        if (!pcm || pcm.length === 0) {
            this.log(`❌ No audio data available`);
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
        this.log(`▶ sending ${blob.size/1024|0} kB from live stream…`);

        try {
            const r = await fetch('http://localhost:5000/process_chunk', {method:'POST', body:fd});
            
            if (!r.ok) {
                throw new Error(`Server error: ${r.status} ${r.statusText}`);
            }
            
            const js = await r.json();
            console.log("Received response from the backend: ", js);
            return js;
        } catch (error) {
            this.log(`❌ Failed to process audio chunk: ${error.message}`);
        }
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
            
            this.log('✔ Started capturing audio from current tab');
        } catch (error) {
            this.log(`❌ Failed to start capture: ${error.message}`);
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
        
        this.log('🛑 Stopped audio capture');
    }
}
