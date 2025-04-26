let isRunning = false;
let isPaused = false;
let currentTabId = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.action);
    switch (request.action) {
        case 'start':
            startAutomation();
            break;
        case 'pause':
            pauseAutomation();
            break;
        case 'stop':
            stopAutomation();
            break;
    }
});

async function startAutomation() {
    if (isRunning) {
        console.log('Automation is already running');
        return;
    }

    isRunning = true;
    isPaused = false;

    try {
        // Get current tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
            console.error('No active tab found');
            return;
        }

        currentTabId = tabs[0].id;

        // Check if the tab is on LinkedIn
        if (!tabs[0].url.includes('linkedin.com')) {
            console.error('Current tab is not on LinkedIn');
            updateStatus('Error: Not on LinkedIn');
            return;
        }

        // Inject content script if not already injected
        try {
            await chrome.scripting.executeScript({
                target: { tabId: currentTabId },
                files: ['content.js']
            });
            console.log('Content script injected successfully');
        } catch (error) {
            console.error('Error injecting content script:', error);
        }

        // Start the automation process
        try {
            await chrome.tabs.sendMessage(currentTabId, { action: 'startAutomation' });
            console.log('Start automation message sent successfully');
            updateStatus('Running');
        } catch (error) {
            console.error('Error sending start message:', error);
            updateStatus('Error: Could not start automation');
        }
    } catch (error) {
        console.error('Error in startAutomation:', error);
        updateStatus('Error: ' + error.message);
    }
}

function pauseAutomation() {
    if (!isRunning) {
        console.log('Automation is not running');
        return;
    }

    isPaused = true;
    try {
        if (currentTabId) {
            chrome.tabs.sendMessage(currentTabId, { action: 'pauseAutomation' })
                .catch(error => console.error('Error sending pause message:', error));
        }
        updateStatus('Paused');
    } catch (error) {
        console.error('Error in pauseAutomation:', error);
    }
}

function stopAutomation() {
    isRunning = false;
    isPaused = false;
    try {
        if (currentTabId) {
            chrome.tabs.sendMessage(currentTabId, { action: 'stopAutomation' })
                .catch(error => console.error('Error sending stop message:', error));
        }
        updateStatus('Stopped');
    } catch (error) {
        console.error('Error in stopAutomation:', error);
    }
}

function updateStatus(status) {
    console.log('Updating status to:', status);
    chrome.storage.local.set({ status });
    try {
        chrome.runtime.sendMessage({
            type: 'update',
            status,
            progress: '0/0',
            successRate: '0%'
        }).catch(error => console.error('Error sending status update:', error));
    } catch (error) {
        console.error('Error in updateStatus:', error);
    }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes('linkedin.com')) {
        console.log('LinkedIn tab updated:', tabId);
        if (isRunning && !isPaused) {
            try {
                chrome.tabs.sendMessage(tabId, { action: 'resumeAutomation' })
                    .catch(error => console.error('Error sending resume message:', error));
            } catch (error) {
                console.error('Error in tab update listener:', error);
            }
        }
    }
}); 