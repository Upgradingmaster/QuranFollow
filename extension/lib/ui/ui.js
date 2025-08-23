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
}
