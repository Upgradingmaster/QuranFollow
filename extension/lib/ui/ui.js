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

        surahInput.value = surah;
        ayahInput.value  = ayah;
        pageInput.value  = page;
    }
    setLocationInfo(surah, ayah) {
        const { locationInfo } = this.elements;
        locationInfo.textContent = `${surah}:${ayah}`;
    }
}
