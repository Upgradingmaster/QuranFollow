.PHONY: all chrome firefox clean

# Default target
all: chrome firefox

# Clean previous builds
clean:
	rm -rf dist/

native-messenger:
# Build Chrome extension
chrome: clean-chrome
	@echo "Building Chrome extension..."
	mkdir -p dist/chrome

	cp -r assets data lib sidepanel dist/chrome/
	cp manifest-chrome.json dist/chrome/manifest.json
	cp background-chrome.js dist/chrome/background.js

# Build Firefox extension
firefox: clean-firefox
	@echo "Building Firefox extension..."
	mkdir -p dist/firefox
	cp -r assets data lib sidepanel dist/firefox/
	cp manifest-firefox.json dist/firefox/manifest.json
	cp background-firefox.js dist/firefox/background.js

# Partial clean targets
clean-chrome:
	rm -rf dist/chrome/

clean-firefox:
	rm -rf dist/firefox/

# Success message
all: chrome firefox
	@echo ""
	@echo "All extensions built successfully!"
	@echo "Chrome: dist/chrome/"
	@echo "Firefox: dist/firefox/"
