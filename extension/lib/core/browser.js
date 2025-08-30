function getBrowser() {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Firefox')) {
        return 'Firefox';
    } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        return 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        return 'Safari';
    } else if (userAgent.includes('Edg')) {
        return 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        return 'Opera';
    }

    return 'Unknown';
}

// TODO: Test with other Chromium browsers
// Firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=1541425
function browserSupportsAudioCapture() {
    return getBrowser() == 'Chrome';
}

export {
    getBrowser,
    browserSupportsAudioCapture
}
