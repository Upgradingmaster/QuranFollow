// ============================================================================
// Verse Navigation and Target Management
// ============================================================================

import { RenderingState } from './quran-data.js';

// ============================================================================
// Target Verse Management
// ============================================================================

/**
 * Dynamically changes the target verse without re-rendering
 * @param {number} newTargetVerse - New verse number to highlight (null to clear)
 * @param {boolean} scrollIntoView - Whether to scroll to the new target verse (default: true)
 */
function setTargetVerse(newTargetVerse, scrollIntoView = true) {
    try {
        if (!RenderingState.isReady()) {
            console.error('Rendering state not ready. Render content first.');
            return false;
        }
        
        if (!RenderingState.supportsTargetVerse()) {
            console.error(`Current mode '${RenderingState.getMode()}' does not support target verses.`);
            return false;
        }
        
        const currentSurah = RenderingState.getSurah();
        const currentTargetVerse = RenderingState.getTargetVerse();
        
        // Remove existing target verse styling
        if (currentTargetVerse !== null) {
            const targetElement = findTargetVerseElement();
            if (targetElement) {
                targetElement.classList.remove('target-verse');
            }
        }
        
        // Add new target verse styling
        if (newTargetVerse !== null) {
            const newTargetElement = findVerseElements(currentSurah, newTargetVerse, false);
            if (newTargetElement) {
                newTargetElement.classList.add('target-verse');
            }

            // Scroll to the new target verse
            if (scrollIntoView) {
                scrollToTargetVerse(true, 100);
            }
        }
        
        // Update state
        RenderingState.setTargetVerse(newTargetVerse);
        return true;
    } catch (error) {
        console.error('Error setting target verse:', error.message);
        return false;
    }
}

/**
 * Gets the current target verse
 * @returns {number|null} Current target verse number or null
 */
function getCurrentTargetVerse() {
    return RenderingState.getTargetVerse();
}

/**
 * Gets the current rendering state
 * @returns {Object} Current rendering state
 */
function getCurrentRenderingState() {
    return RenderingState.getState();
}

// ============================================================================
// Scrolling Utilities
// ============================================================================

/**
 * Scrolls to the target verse in the current container
 * @param {boolean} scrollIntoView - Whether to scroll (default: true)
 * @param {number} delay - Delay before scrolling in ms (default: 100)
 */
function scrollToTargetVerse(scrollIntoView = true, delay = 100) {
    if (!scrollIntoView || !RenderingState.isReady()) {
        return;
    }
    
    setTimeout(() => {
        const targetElement = findTargetVerseElement();
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, delay);
}

/**
 * Scrolls to a specific verse by surah and ayah numbers
 * @param {number} surah - Surah number
 * @param {number} ayah - Ayah number
 * @param {boolean} scrollIntoView - Whether to scroll (default: true)
 * @param {number} delay - Delay before scrolling in ms (default: 100)
 */
function scrollToVerse(surah, ayah, scrollIntoView = true, delay = 100) {
    if (!scrollIntoView || !RenderingState.isReady()) {
        return;
    }
    
    setTimeout(() => {
        const verseElement = findVerseElements(surah, ayah, false);
        if (verseElement) {
            verseElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, delay);
}

// ============================================================================
// DOM Query Utilities
// ============================================================================

/**
 * Finds verse elements by surah and ayah numbers in the current container
 * @param {number} surah - Surah number
 * @param {number} ayah - Ayah number
 * @param {boolean} all - Whether to return all matches or just the first (default: true)
 * @returns {NodeList|Element|null} Matching elements or null if not found
 */
function findVerseElements(surah, ayah, all = false) {
    if (!RenderingState.isReady()) {
        return all ? [] : null;
    }
    
    const containerElement = RenderingState.getContainerElement();
    const selector = `[data-surah="${surah}"][data-ayah="${ayah}"]`;
    
    if (all) {
        return containerElement.querySelectorAll(selector);
    } else {
        return containerElement.querySelector(selector);
    }
}

/**
 * Finds the current target verse element
 * @returns {Element|null} Target verse element or null if not found
 */
function findTargetVerseElement() {
    if (!RenderingState.isReady()) {
        return null;
    }
    
    const containerElement = RenderingState.getContainerElement();
    return containerElement.querySelector('.target-verse');
}

/**
 * Finds verse elements for the current target verse
 * @param {boolean} all - Whether to return all matches or just the first (default: true)
 * @returns {NodeList|Element|null} Target verse elements or null
 */
function findCurrentTargetVerseElements(all = true) {
    const targetVerse = RenderingState.getTargetVerse();
    const surah = RenderingState.getSurah();
    
    if (targetVerse === null || surah === null) {
        return all ? [] : null;
    }
    
    return findVerseElements(surah, targetVerse, all);
}

export {
    // Target verse functions
    setTargetVerse,
    getCurrentTargetVerse,
    getCurrentRenderingState,

    // Scrolling utilities
    scrollToTargetVerse,
    scrollToVerse,
    
    // DOM query utilities
    findVerseElements,
    findTargetVerseElement,
    findCurrentTargetVerseElements
};
