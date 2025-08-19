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
}
