import * as Log from '../core/log.js';
/* Theme */
function setTheme(theme) {
    if (!isValidTheme(theme)) {
        Log.log(undefined, `Invalid Theme ${theme}`);
        setTheme('sepia');
        return;
    }

    document.body.setAttribute('data-theme' , theme);
    localStorage.setItem('data-theme'       , theme);
    Log.log(`Set theme to '${theme}'`);
}

function setThemeFromLocalStorage(defaultTheme = 'sepia') {
    const themeFromLocalStorage = localStorage.getItem('data-theme');
    if (!themeFromLocalStorage) {
        setTheme(defaultTheme);
    } else {
        setTheme(themeFromLocalStorage);
    }
};

function toggleTheme() {
    let currentTheme = document.body.getAttribute('data-theme');
    switch (currentTheme) {
    case 'dark':
        setTheme('sepia');
        break;
    case 'sepia':
        setTheme('dark');
        break;
    default: throw new Error('UNREACHABLE');
    }
}

function isValidTheme(theme) {
    return theme && theme != '' && ['dark', 'sepia'].includes(theme);
}

export {
    setTheme,
    setThemeFromLocalStorage,
    toggleTheme,
    isValidTheme
}
