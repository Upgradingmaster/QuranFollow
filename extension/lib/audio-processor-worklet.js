// AudioWorklet processor for replacing ScriptProcessorNode
class AudioProcessorWorklet extends AudioWorkletProcessor {
    constructor() {
        super();
        this.targetSampleRate = 16000;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        
        if (input && input.length > 0) {
            const inputChannel = input[0];
            
            if (inputChannel && inputChannel.length > 0) {
                // Resample audio if needed
                const resampledData = this.resampleAudio(
                    inputChannel,
                    sampleRate, // Built-in AudioWorklet property
                    this.targetSampleRate
                );
                
                // Send the processed audio data to the main thread
                this.port.postMessage({
                    type: 'audioData',
                    data: resampledData
                });
            }
        }
        
        // Keep the processor alive
        return true;
    }

    resampleAudio(inputData, inputSampleRate, targetSampleRate) {
        if (inputSampleRate === targetSampleRate) {
            return inputData;
        }

        const ratio = inputSampleRate / targetSampleRate;
        const outputLength = Math.round(inputData.length / ratio);
        const output = new Float32Array(outputLength);
        
        for (let i = 0; i < outputLength; i++) {
            const inputIndex = i * ratio;
            const inputIndexFloor = Math.floor(inputIndex);
            const inputIndexCeil = Math.min(inputIndexFloor + 1, inputData.length - 1);
            const fraction = inputIndex - inputIndexFloor;
            
            // Linear interpolation
            output[i] = inputData[inputIndexFloor] * (1 - fraction) + 
                       inputData[inputIndexCeil] * fraction;
        }
        
        return output;
    }
}

registerProcessor('audio-processor-worklet', AudioProcessorWorklet);