let nativePort = null;

const HOST_NAME = 'com.armaan.quran_locater';

function startHost() {
    try {
        nativePort = chrome.runtime.connectNative(HOST_NAME);
        nativePort.onDisconnect.addListener(() => {
            console.log('[Native Host] Crashed');
            stopHost();
        });
        console.log(`[Native Host] Connected '${HOST_NAME}'`);
    } catch (error) {
        console.log(`[Native Host] Failed to connect to native host: ${error.message}`);
        nativePort = null;
    }
}

function stopHost() {
    nativePort.disconnect();
    nativePort = null;
    console.log(`[Native Host] Disconnected '${HOST_NAME}'`);
}

function hostStarted() {
    return !!nativePort;
}

async function sendWavToNativeHost(wav) {
    if (!nativePort) {
        console.error(`[Native Host] Can't send audio, Native Host not connected`);
        return;
    }

    try {
        const data = wavToBase64(wav);
        const msg = {
            action: 'process_audio',
            data
        }
        const result = await sendToNativeHostSync(msg);
        return result;

    } catch (error) {
        console.log(`[Native Host] Error sending message: ${error.message}`);
        throw error;
    }
}

async function sendToNativeHostSync(message) {
    console.log('[Native Host] Sending to native host: ', message);
    return new Promise((resolve, reject) => {
        if (!nativePort) {
            reject(new Error('[Native Host] Native Host not connected'));
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('[Native Host] Request timed out'));
        }, 10000); // 10 second timeout

        const messageHandler = (response) => {
            clearTimeout(timeout);
            nativePort.onMessage.removeListener(messageHandler);

            if (response.ok) {
                resolve(response.result || response);
            } else {
                reject(new Error('[Native Host] Error: ', response.error || '[Native Host] Unknown error from native host'));
            }
        };

        nativePort.onMessage.addListener(messageHandler);
        nativePort.postMessage(message);
    });
}

function wavToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export {
    sendWavToNativeHost,
    startHost,
    stopHost,
    hostStarted
}
