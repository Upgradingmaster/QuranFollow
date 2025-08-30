export class ModalModule {
    constructor(helpText, elements) {
        this.helpText = helpText;
        this.elements = elements;
    }

    // TODO this could all be just 3 generic functions

    /* Control Panel */
    showControlPanel() {
        this.elements.controlPanel.classList.add('show');
    }

    hideControlPanel() {
        this.elements.controlPanel.classList.remove('show');
    }

    toggleControlPanel() {
        if (this.elements.controlPanel.classList.contains('show')) {
            this.hideControlPanel();
        } else {
            this.showControlPanel();
        }
    }

    /* Help */
    showHelp() {
        const { help, helpText } = this.elements;
        helpText.innerHTML = this.helpText;
        help.classList.add('show');
    }

    hideHelp() {
        this.elements.help.classList.remove('show');
    }

    toggleHelp() {
        if (this.elements.help.classList.contains('show')) {
            this.hideHelp();
        } else {
            this.showHelp();
        }
    }

    /* Quick Jump */
    showQuickJump() {
        this.elements.quickJump.classList.add('show');
        setTimeout(() => {
            this.elements.quickJumpInput.focus();
        }, 100);
    }

    hideQuickJump() {
        this.elements.quickJump.classList.remove('show');
    }

    toggleQuickJump() {
        if (this.elements.quickJump.classList.contains('show')) {
            this.hideQuickJump();
        } else {
            this.showQuickJump();
        }
    }

    /* Settings */
    showSettings() {
        this.elements.settings.classList.add('show');
    }

    hideSettings() {
        this.elements.settings.classList.remove('show');
    }

    toggleSettings() {
        if (this.elements.settings.classList.contains('show')) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }

}
