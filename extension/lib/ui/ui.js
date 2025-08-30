export class UIModule {
    constructor(dependencies) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
    }

    getSelectedMode() {
       return this.elements.modeSelect.value;
    }

    setSelectedMode(mode) {
        this.elements.modeSelect.value = mode;
    }

    setControlPanelInputs(surah, ayah, page) {
        const { surahInput, ayahInput, pageInput } = this.elements;

        if (surah !== null) surahInput.value = surah;
        if (ayah  !== null) ayahInput.value  = ayah;
        if (page  !== null) pageInput.value  = page;
    }
    setLocationInfo(surahName, surah, ayah) {
        this.elements.locationInfo.textContent = `${surahName} ${surah}:${ayah}`;
    }

    startAudioCapture() {
        const { toggleCaptureBtn, captureStatus } = this.elements;

        if (toggleCaptureBtn) {
            toggleCaptureBtn.disabled = true;
        }

        if (captureStatus) {
            captureStatus.textContent = 'Starting capture...';
        }
    }

    startedAudioCapture () {
        const { toggleCaptureBtn, captureStatus, analyzeBtn } = this.elements;
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
        if (toggleCaptureBtn) {
            toggleCaptureBtn.disabled = false;
        }
    }

    stoppedAudioCapture() {
        const { toggleCaptureBtn, captureStatus, analyzeBtn } = this.elements;

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
    }

    failedAudioCapture() {
        if (captureStatus) {
            captureStatus.textContent = 'Failed to start capture';
        }
        if (toggleCaptureBtn) {
            toggleCaptureBtn.disabled = false;
        }
    }

    /* Settings */
    setSetting(setting, value) {
        const element = this.settingToElement(setting);
        element.checked = value;
    }

    settingToElement(setting) {
        const settingElementMap = {
            'useASR' : this.elements.settingUseASR,
        };

        if (!settingElementMap.hasOwnProperty(setting)) {
            throw new Error(`Setting '${setting}' not mapped to the UI elements correctly!`);
        }

        return settingElementMap[setting];
    }

    // Setting-specific UI states
    asrDisabled() {
        this.elements.toggleCaptureBtn.disabled = true;
        this.elements.settingUseASR.disabled = true;
    }
}
