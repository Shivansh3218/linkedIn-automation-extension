document.addEventListener('DOMContentLoaded', function () {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusDiv = document.getElementById('status');
    const progressSpan = document.getElementById('progress');
    const successRateSpan = document.getElementById('successRate');
    const delayInput = document.getElementById('delay');
    const dailyLimitInput = document.getElementById('dailyLimit');

    // Load saved settings
    chrome.storage.local.get(['delay', 'dailyLimit', 'status', 'progress', 'successRate'], function (data) {
        delayInput.value = data.delay || 5;
        dailyLimitInput.value = data.dailyLimit || 50;
        statusDiv.textContent = `Status: ${data.status || 'Ready'}`;
        progressSpan.textContent = `${data.progress || '0/0'}`;
        successRateSpan.textContent = `${data.successRate || '0%'}`;
    });

    // Save settings when changed
    delayInput.addEventListener('change', saveSettings);
    dailyLimitInput.addEventListener('change', saveSettings);

    function saveSettings() {
        chrome.storage.local.set({
            delay: parseInt(delayInput.value),
            dailyLimit: parseInt(dailyLimitInput.value)
        });
    }

    // Start automation
    startBtn.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'start' });
        statusDiv.textContent = 'Status: Running';
    });

    // Pause automation
    pauseBtn.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'pause' });
        statusDiv.textContent = 'Status: Paused';
    });

    // Stop automation
    stopBtn.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'stop' });
        statusDiv.textContent = 'Status: Stopped';
    });

    // Listen for updates from background script
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type === 'update') {
            statusDiv.textContent = `Status: ${request.status}`;
            progressSpan.textContent = request.progress;
            successRateSpan.textContent = request.successRate;
        }
    });
}); 