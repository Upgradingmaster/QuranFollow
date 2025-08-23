export const DATA_PATHS = {
      AYAT           : '../data/scripts/uthmani-aba.json',
      WORDS          : '../data/scripts/uthmani-wbw.json',
      PAGES          : '../data/pages/uthmani.json',
      TRANSLATION    : '../data/translations/si-footnotes.json',
      SURAH_METADATA : '../data/metadata/surah-metadata.json'
  };

export const MODES = {
    MUSHAF  : 'mushaf',
    CONTEXT : 'context',
    SURAH   : 'surah',
  };

export const ELEMENT_IDS = {
    QURAN_CONTAINER    : 'quran',
    LOG                : 'log',
    LOCATION_INFO      : 'location-info',
    QUICK_JUMP         : 'quick-jump',
    QUICK_JUMP_INPUT   : 'quick-jump-input',
    CONTROL_PANEL      : 'control-panel',
    TOGGLE_CAPTURE_BTN : 'toggle-capture',
    SURAH_INPUT        : 'surah-input',
    AYAH_INPUT         : 'ayah-input',
    PAGE_INPUT         : 'page-input'
};

export const QURAN = {
    TOTAL_SURAHS: 114,
    TOTAL_PAGES: 604,
    TOTAL_AYAT: 6236
};

export const AUDIO = {
    SAMPLE_RATE: 44100,
    BUFFER_SIZE: 4096,
    MAX_RECORDING_TIME: 60000 // 1 minute (ms)
};

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};
