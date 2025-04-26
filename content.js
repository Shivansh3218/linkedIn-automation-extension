let isAutomationRunning = false;
let isPaused = false;

// Log initialization
console.log('Content script initialized on LinkedIn page');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request.action);

    // Send response immediately to acknowledge receipt
    sendResponse({ received: true });

    switch (request.action) {
        case 'startAutomation':
            console.log('Starting LinkedIn automation from content script...');
            startLinkedInAutomation();
            break;
        case 'pauseAutomation':
            console.log('Pausing LinkedIn automation from content script...');
            pauseLinkedInAutomation();
            break;
        case 'stopAutomation':
            console.log('Stopping LinkedIn automation from content script...');
            stopLinkedInAutomation();
            break;
        case 'resumeAutomation':
            console.log('Resuming LinkedIn automation from content script...');
            resumeLinkedInAutomation();
            break;
    }

    // Return true to indicate we'll send a response asynchronously
    return true;
});

async function startLinkedInAutomation() {
    if (isAutomationRunning) {
        console.log('Automation is already running');
        return;
    }

    console.log('Initializing LinkedIn automation...');
    isAutomationRunning = true;
    isPaused = false;

    // Get settings
    const settings = await chrome.storage.local.get(['delay', 'dailyLimit']);
    const delay = (settings.delay || 5) * 1000; // Convert to milliseconds
    const dailyLimit = settings.dailyLimit || 50;

    console.log(`Settings loaded - Delay: ${delay / 1000}s, Daily Limit: ${dailyLimit}`);

    let connectionsSent = 0;

    while (isAutomationRunning && connectionsSent < dailyLimit) {
        if (isPaused) {
            console.log('Automation paused, waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }

        try {
            // Find "Connect" buttons using multiple selectors
            const connectButtons = document.querySelectorAll('button[aria-label*="Invite"][aria-label*="connect"], button[aria-label*="Connect"]');
            console.log(`Found ${connectButtons.length} connect buttons on the page`);

            if (connectButtons.length === 0) {
                console.log('No connect buttons found, scrolling to load more...');
                window.scrollBy(0, window.innerHeight);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            for (const button of connectButtons) {
                if (!isAutomationRunning || isPaused) {
                    console.log('Breaking out of button loop - automation stopped or paused');
                    break;
                }

                // Get user's name from aria-label
                const name = button.getAttribute('aria-label')?.replace('Invite ', '').replace(' to connect', '') || 'Unknown';
                console.log(`Processing connection request for: ${name}`);

                // Log button details
                console.log('Button details:', {
                    classList: button.classList.toString(),
                    ariaLabel: button.getAttribute('aria-label'),
                    disabled: button.disabled,
                    visible: isElementVisible(button)
                });

                // Check if button is visible and clickable
                if (!isElementVisible(button) || button.disabled) {
                    console.log('Button not visible or disabled, skipping...');
                    continue;
                }

                // Scroll to the button
                console.log('Scrolling to connect button...');
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Random delay before clicking
                const clickDelay = Math.random() * 2000 + 1000;
                console.log(`Waiting ${Math.round(clickDelay / 1000)}s before clicking...`);
                await new Promise(resolve => setTimeout(resolve, clickDelay));

                try {
                    // Click the button
                    console.log('Attempting to click connect button...');
                    button.click();
                    console.log('Button clicked successfully');

                    // Wait for the modal to appear
                    console.log('Waiting for connection modal...');
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Find and click "Add a note" button
                    const addNoteButton = document.querySelector('button[aria-label="Add a note"]');
                    if (addNoteButton) {
                        console.log('Found "Add a note" button, clicking...');
                        addNoteButton.click();

                        // Wait for the note textarea to appear
                        console.log('Waiting for note textarea...');
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Generate personalized message
                        const message = generatePersonalizedMessage(name, '');
                        console.log('Generated message:', message);

                        // Find and fill the note textarea
                        const noteTextarea = document.querySelector('textarea[name="message"]');
                        if (noteTextarea) {
                            console.log('Filling note textarea...');
                            noteTextarea.value = message;

                            // Wait before sending
                            const sendDelay = Math.random() * 2000 + 1000;
                            console.log(`Waiting ${Math.round(sendDelay / 1000)}s before sending...`);
                            await new Promise(resolve => setTimeout(resolve, sendDelay));

                            // Click send button
                            const sendButton = document.querySelector('button[aria-label="Send now"]');
                            if (sendButton) {
                                console.log('Sending connection request...');
                                sendButton.click();
                                connectionsSent++;

                                console.log(`Connection request sent! (${connectionsSent}/${dailyLimit})`);

                                // Update progress
                                chrome.storage.local.set({
                                    progress: `${connectionsSent}/${dailyLimit}`,
                                    successRate: `${Math.round((connectionsSent / dailyLimit) * 100)}%`
                                });
                            } else {
                                console.error('Send button not found!');
                            }
                        } else {
                            console.error('Note textarea not found!');
                        }
                    } else {
                        console.error('"Add a note" button not found!');
                    }
                } catch (error) {
                    console.error('Error clicking button:', error);
                }

                // Random delay between actions
                const actionDelay = delay + Math.random() * 2000;
                console.log(`Waiting ${Math.round(actionDelay / 1000)}s before next action...`);
                await new Promise(resolve => setTimeout(resolve, actionDelay));
            }

            // Scroll down to load more results
            console.log('Scrolling to load more results...');
            window.scrollBy(0, window.innerHeight);
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error('Automation error:', error);
            // Continue with next iteration
        }
    }

    console.log('Automation completed or stopped');
    stopLinkedInAutomation();
}

// Helper function to check if element is visible
function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0;
}

function pauseLinkedInAutomation() {
    console.log('Pausing automation...');
    isPaused = true;
}

function resumeLinkedInAutomation() {
    console.log('Resuming automation...');
    isPaused = false;
}

function stopLinkedInAutomation() {
    console.log('Stopping automation...');
    isAutomationRunning = false;
    isPaused = false;
}

function generatePersonalizedMessage(name, industry) {
    const firstName = name.split(' ')[0];
    const templates = [
        `Hi ${firstName}, I noticed your profile and would love to connect and learn more about your experience.`,
        `Hello ${firstName}, I came across your profile and was impressed by your background. Would love to connect and exchange insights.`,
        `Hi ${firstName}, I see you're working in an interesting field. I'm always interested in connecting with professionals like you.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
} 