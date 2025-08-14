import { AppModule } from '../lib/core/app.js';

// Initialize and start the application
const app = new AppModule();

// Start the application
app.initialize().then(success => {
    if (!success) {
        console.error('Failed to initialize application');
    }
}).catch(error => {
    console.error('Application startup error:', error);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    app.destroy();
});
