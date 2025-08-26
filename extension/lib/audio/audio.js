import * as WavEncoder from './wav-encoder.js';
import { AudioCapture } from './capture.js';

import { sendWavToNativeHost } from './native-host.js'

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

        const CHUNK_DURATION = 8.0;
        const pcm = this.audioCapture.getAudioChunk(CHUNK_DURATION);
        if (!pcm || pcm.length === 0) {
            this.log(`[X] No audio data available`);
            return;
        }

        const wav = WavEncoder.encodeSync({
            sampleRate: 16000,
            channelData: [pcm]
        }); // encode mono WAV at 16kHz

        this.log(`Sending past ${CHUNK_DURATION}s of audio to backend…`);
        let res;
        try {
            res = await sendWavToNativeHost(wav);
        } catch (error) {
            this.log(`[X] Couldn't get prediction from backend.`);
            throw error;
        }

        this.log(`Received response from the backend:`, undefined, true);
        this.log(res, undefined, true);
        return res;
    }

    async startCapture() {
        try {
            await this.audioCapture.startCapture();
            this.log('Started capturing audio from current tab');
        } catch (error) {
            this.log(`[X] Failed to start capture`, error);
            throw new Error(error);
        }
    }

    stopCapture() {
        this.audioCapture.stopCapture();
        this.log('Stopped capturing audio from current tab');
    }

    isCapturing() {
        return this.audioCapture.isCapturing;
    }

}
