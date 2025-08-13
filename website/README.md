# Quran Locator Website

This is the web version of the Quran Locator application.

## Structure

```
website/
├── index.html              # Main HTML page
├── app.js                  # Main application logic
├── styles.css              # Application styles
├── assets/                 # Static assets
│   ├── fonts/             # Font files
│   └── recitation.mp3     # Audio file
├── data/                  # Quran data files
│   ├── layouts/           # Page layout data
│   ├── scripts/           # Text and word data
│   └── translations/      # Translation data
└── lib/                   # JavaScript modules
    ├── quran-data.js      # Data loading and state management
    ├── quran-navigation.js # Verse navigation and targeting
    ├── quran-renderer.js   # Main rendering API
    ├── quran-renderers.js  # HTML generation and DOM updates
    └── wav-encoder.js      # Audio encoding utilities
```

## Usage

1. Open `index.html` in a web browser
2. The application will automatically load the required data files
3. Use the controls to navigate through the Quran content
4. Upload audio files for analysis and verse matching

## Features

- **Mushaf page rendering** - Display pages as they appear in traditional Quran
- **Verse context view** - Show verses with surrounding context
- **Full surah rendering** - Display complete chapters
- **Audio analysis** - Upload audio and find matching verses
- **Interactive highlighting** - Hover over words to highlight verses
- **Responsive navigation** - Jump to specific pages, verses, or surahs