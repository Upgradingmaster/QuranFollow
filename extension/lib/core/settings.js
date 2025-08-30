export class SettingsModule {
    constructor(dependencies) {
        this.log = dependencies.log;
        this.defaultSettings = {
            highlightCurrentAyah: true,
            showLineNumbers: false,
            autoCapture: false
        };
        const savedSettings = this.loadSettingsFromLocalStorage();
        this.settings = { ...this.defaultSettings, ...savedSettings };
        this.saveSettingsToLocalStorage();
    }

    getSettings() {
        return { ...this.settings };
    }

    getSetting(key, defaultValue = null) {
        return this.settings.hasOwnProperty(key) ? this.settings[key] : defaultValue;
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettingsToLocalStorage();
        this.log(`Setting '${key}' set to '${value}'`, null, true);
    }

    loadSettingsFromLocalStorage() {
        try {
            const saved = localStorage.getItem('quran-locator-settings');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            this.log('[X] Failed to load settings from localStorage', error);
            return {};
        }
    }

    saveSettingsToLocalStorage() {
        try {
            localStorage.setItem('quran-locator-settings', JSON.stringify(this.settings));
        } catch (error) {
            this.log('[X] Failed to save settings to localStorage', error);
        }
    }

    resetToDefaults() {
        this.settings = { ...this.defaultSettings };
        this.saveSettingsToLocalStorage();
        this.log('Settings reset to defaults');
    }
}
