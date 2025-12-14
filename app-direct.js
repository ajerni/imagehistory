// TEMPORARY TEST VERSION - Connects directly to n8n (for testing only)
// This bypasses the PHP proxy to test if n8n is working

const API_CONFIG = {
    // Direct connection to n8n (will have CORS issues if n8n doesn't allow it)
    url: 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833',
    headers: {
        'x-api-key': 'andi-secret-chats'
    },
    useDemoData: false,
    imageBaseUrl: 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833'
};

// ... rest of your app.js code below ...
// (This is just the config change - copy the rest from app.js)

