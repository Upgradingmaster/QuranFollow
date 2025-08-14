export class UIModule {
    constructor(dependencies) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
    }

    getSelectedMode() {
       return this.elements.modeSelect.value;
    }

    updateMode() {
        const selectedMode = this.getSelectedMode();
        const { mushafControls, contextControls, surahControls } = this.elements;
        
        // Hide all mode-specific controls
        mushafControls.style.display = 'none';
        contextControls.style.display = 'none';
        surahControls.style.display = 'none';
        
        // Show only the selected mode's controls
        switch (selectedMode) {
            case 'mushaf':
                mushafControls.style.display = 'block';
                break;
            case 'context':
                contextControls.style.display = 'block';
                break;
            case 'surah':
                surahControls.style.display = 'block';
                break;
        }
    }

    setViewMode(mode) {
        if (this.elements.modeSelect.value !== mode) {
            this.elements.modeSelect.value = mode;
            this.updateMode();
            this.log(`📋 Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} view mode`);
        }
    }

    showControlPanel() {
        this.elements.controlModalBackdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideControlPanel() {
        this.elements.controlModalBackdrop.classList.remove('show');
        document.body.style.overflow = '';
    }

    toggleControlPanel() {
        if (this.elements.controlModalBackdrop.classList.contains('show')) {
            this.hideControlPanel();
        } else {
            this.showControlPanel();
        }
    }

    clearLogContent() {
        if (this.elements.logel) {
            this.elements.logel.textContent = '';
            this.log('📋 Log cleared');
        }
    }
}
