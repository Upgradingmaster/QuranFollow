let logContainer, logStatusBar, logExpanded;

function initializeLogger(elements) {
    logContainer = elements.logContainer;
    logStatusBar = elements.logStatusBar;
    logExpanded  = elements.logExpanded ;
}

function log(msg, error = null, internal = false) {
    if (msg) console.log(msg);
    if (msg && logContainer && !internal) {
        let history = logContainer.dataset.history || '';
        history += msg + '\n';
        logContainer.dataset.history = history;

        // Update status bar with latest message
        if (logStatusBar) {
            logStatusBar.textContent = msg;
        }

        // Update the expanded log immediately if it is expanded
        const isExpanded = logContainer.classList.contains('expanded');
        if (isExpanded) {
            logExpanded.textContent = history;
            logExpanded.scrollTop = logExpanded.scrollHeight;
        }
    }

    if (error) { console.error(error); }
}

export { initializeLogger, log }
