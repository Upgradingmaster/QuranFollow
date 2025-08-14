export class AudioBuffer {
    constructor(maxDurationSeconds = 60, sampleRate = 16000) {
        this.maxDurationSeconds = maxDurationSeconds;
        this.sampleRate = sampleRate;
        this.maxSamples = maxDurationSeconds * sampleRate;
        this.buffer = new Float32Array(this.maxSamples);
        this.writeIndex = 0;
        this.totalSamples = 0;
        this.isOverflowed = false;
    }

    append(audioData) {
        const samplesLength = audioData.length;
        
        if (samplesLength === 0) return;

        for (let i = 0; i < samplesLength; i++) {
            this.buffer[this.writeIndex] = audioData[i];
            this.writeIndex = (this.writeIndex + 1) % this.maxSamples;
            
            if (this.totalSamples < this.maxSamples) {
                this.totalSamples++;
            } else {
                this.isOverflowed = true;
            }
        }
    }

    getRecentChunk(durationSeconds) {
        const chunkSamples = Math.min(
            durationSeconds * this.sampleRate,
            this.totalSamples
        );
        
        if (chunkSamples === 0) {
            return new Float32Array(0);
        }

        const chunk = new Float32Array(chunkSamples);
        
        let readIndex;
        if (this.isOverflowed) {
            readIndex = (this.writeIndex - chunkSamples + this.maxSamples) % this.maxSamples;
        } else {
            readIndex = Math.max(0, this.totalSamples - chunkSamples);
        }
        
        for (let i = 0; i < chunkSamples; i++) {
            chunk[i] = this.buffer[readIndex];
            readIndex = (readIndex + 1) % this.maxSamples;
        }
        
        return chunk;
    }

    clear() {
        this.writeIndex = 0;
        this.totalSamples = 0;
        this.isOverflowed = false;
        this.buffer.fill(0);
    }

    getStatus() {
        return {
            totalSamples: this.totalSamples,
            durationSeconds: this.totalSamples / this.sampleRate,
            maxDurationSeconds: this.maxDurationSeconds,
            isOverflowed: this.isOverflowed,
            bufferUsage: this.totalSamples / this.maxSamples
        };
    }
}