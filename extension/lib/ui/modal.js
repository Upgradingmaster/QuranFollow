export class ModalModule {
    constructor(helpText, controlPanelModal) {
        this.helpText = helpText;
        this.controlPanelModal = controlPanelModal;
        this.helpModal = null;
    }

    showHelp() {
        // Remove existing help modal if any
        this.hideHelp();

        // Create help modal
        this.helpModal = document.createElement('div');
        this.helpModal.className = 'keybind-help-modal modal-backdrop show';
        this.helpModal.innerHTML = `
            <div class="keybind-help-content control-modal">
                <div class="modal-header">
                    <h3>Keyboard Shortcuts</h3>
                    <button class="close-button">×</button>
                </div>
                <div class="keybind-help-body">
                    <pre>${this.helpText}</pre>
                </div>
            </div>
        `;

        document.body.appendChild(this.helpModal);

        // Close on close button click
        const closeButton = this.helpModal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            this.hideHelp();
        });

        // Close on backdrop click
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.hideHelp();
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideHelp();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    hideHelp() {
        if (this.helpModal) {
            this.helpModal.remove();
            this.helpModal = null;
        }
    }

    toggleHelp() {
        if (this.helpModal) {
            this.hideHelp();
        } else {
            this.showHelp();
        }
    }


    showControlPanel() {
        this.controlPanelModal.classList.add('show');
    }

    hideControlPanel() {
        this.controlPanelModal.classList.remove('show');
    }

    toggleControlPanel() {
        if (this.controlPanelModal.classList.contains('show')) {
            this.hideControlPanel();
        } else {
            this.showControlPanel();
        }
    }

}
