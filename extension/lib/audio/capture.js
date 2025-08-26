import { AudioBuffer } from './buffer.js';
import {
    startHost,
    stopHost,
    hostStarted } from './native-host.js';

export class AudioCapture {
    constructor() {
        this.isCapturing = false;
        this.audioBuffer = null;

        this.mediaStream = null;
        this.audioContext = null;
        this.audioWorkletNode = null;
        this.outputAudioContext = null;


        this.TARGET_SAMPLE_RATE = 16000;
        this.BUFFER_DURATION = 60; // seconds
    }

    async startCapture() {
        if (this.isCapturing) {
            throw new Error('Already capturing audio');
        }

        try {
            if (!hostStarted()) {
                startHost();
            }

            // Get stream ID from current tab
            const streamId = await chrome.tabCapture.getMediaStreamId();
            
            // Get MediaStream using the stream ID
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: streamId,
                    },
                },
                video: false
            });

            // Create audio context for processing
            this.audioContext = new AudioContext();
            
            // Load the AudioWorklet processor
            const workletUrl = chrome.runtime.getURL('lib/audio/processor-worklet.js');
            await this.audioContext.audioWorklet.addModule(workletUrl);
            
            // Create MediaStreamSource
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // Preserve system audio - route back to speakers
            this.outputAudioContext = new AudioContext();
            const outputSource = this.outputAudioContext.createMediaStreamSource(this.mediaStream);
            outputSource.connect(this.outputAudioContext.destination);
            
            // Create buffer for storing audio data
            this.audioBuffer = new AudioBuffer(this.BUFFER_DURATION, this.TARGET_SAMPLE_RATE);
            
            // Create AudioWorklet node for processing audio data
            this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor-worklet');
            
            // Handle messages from the AudioWorklet
            this.audioWorkletNode.port.onmessage = (event) => {
                if (event.data.type === 'audioData') {
                    // Add resampled data to buffer
                    this.audioBuffer.append(event.data.data);
                }
            };
            
            // Connect the processing chain
            source.connect(this.audioWorkletNode);
            this.audioWorkletNode.connect(this.audioContext.destination);
            
            this.isCapturing = true;

            return true;
        } catch (error) {
            this.cleanup();
            throw new Error(`Failed to start audio capture: ${error.message}`);
        }
    }

    stopCapture() {
        if (!this.isCapturing) {
            return;
        }

        this.cleanup();
        this.isCapturing = false;
    }

    cleanup() {
        if (hostStarted()) {
            stopHost();
        }

        if (this.audioWorkletNode) {
            this.audioWorkletNode.disconnect();
            this.audioWorkletNode = null;
        }


        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        if (this.outputAudioContext) {
            this.outputAudioContext.close();
            this.outputAudioContext = null;
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        if (this.audioBuffer) {
            this.audioBuffer.clear();
        }
    }

    getAudioChunk(durationSeconds = 8) {
        if (!this.audioBuffer) {
            return null;
        }
        
        return this.audioBuffer.getRecentChunk(durationSeconds);
    }



    getStatus() {
        return {
            isCapturing: this.isCapturing,
            hasStream: !!this.mediaStream,
            hasAudioWorklet: !!this.audioWorkletNode,
            audioBuffer: this.audioBuffer ? this.audioBuffer.getStatus() : null
        };
    }
}
