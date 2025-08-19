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
        // TODO we can show the page number field for the mushaf mode exclusively here
    }

    setControlPanelInputs(surah, ayah, page) {
        const { surahInput, ayahInput, pageInput } = this.elements;

        surahInput.value = surah;
        ayahInput.value  = ayah;
        pageInput.value  = page;
    }
}
