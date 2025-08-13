# Qurʾān Locator Firefox Extension

A Firefox extension that brings the Quran locator functionality to your browser as a convenient sidepanel.

## Prerequisites

1. **Python Server**: The extension requires the local Python server to be running for ASR functionality.
   ```bash
   cd ../src
   python server.py
   ```
   Server should be running on `http://localhost:5000`

## Installation Instructions

### Method 1: Load as Temporary Extension (Development)

1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Navigate to this `extension` folder and select `manifest.json`
6. The extension icon should appear in your Firefox toolbar

### Method 2: Package for Permanent Installation

1. Zip the entire `extension` folder contents
2. Rename the zip file to `quran-locater.xpi`
3. Drag and drop the `.xpi` file into Firefox to install

## Usage

1. **Start the Python server** (from the main project directory):
   ```bash
   python src/server.py
   ```

2. **Click the extension icon** in Firefox toolbar to open the sidepanel

3. **Use the interface** exactly like the web version:
   - Load audio files or use the default recitation
   - Navigate by page, verse, or surah
   - Use "Analyse current position" for ASR functionality

## Features

- ✅ Complete Quran text rendering
- ✅ Page navigation (1-604)
- ✅ Verse context viewing
- ✅ Full surah rendering
- ✅ Audio playback and ASR analysis
- ✅ All original functionality preserved
- ✅ Runs offline (except ASR which needs local server)

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── sidepanel/             # Main sidepanel interface
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── sidepanel.css
├── lib/                   # JavaScript modules
├── data/                  # Quran data (JSON files)
└── assets/                # Fonts and icons
```

## Troubleshooting

1. **Extension won't load**: Check that `manifest.json` is valid
2. **Audio/ASR not working**: Ensure Python server is running on localhost:5000
3. **Quran text not displaying**: Check browser console for JavaScript errors
4. **Font issues**: Verify `uthmanic-hafs.woff2` is in `assets/fonts/`

## Next Steps

- Add proper extension icons
- Implement tab audio capture
- Add offline ASR capabilities
- Package for Firefox Add-ons store