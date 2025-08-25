(function () {
    if (document.getElementById('quran-locater-frame')) return;

const frame = document.createElement('iframe');
frame.id = 'quran-locater-frame';
frame.style.position = 'fixed';


frame.style.zIndex = 2147483647;
frame.style.border = 'none';
frame.style.borderRadius = '12px';
frame.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';

// frame.style.top = '50%';
// frame.style.left = '50%';
// frame.style.transform = 'translate(-50%, -50%)'; // centers it
frame.style.top = 0;
frame.style.right = 0;

frame.style.width = '25%';
frame.style.height = '100%';

frame.allow = 'display-capture';

    frame.src = chrome.runtime.getURL('../../sidepanel/sidepanel.html');

    document.documentElement.appendChild(frame);
})();
