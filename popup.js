const toggleBtn = document.getElementById('toggle');
const optionsBtn = document.getElementById('options');
const statusDiv = document.getElementById('status');

function showStatus(message, duration = 2000) {
  console.log('[Popup] Status:', message);
  statusDiv.textContent = message;
  if (duration > 0) {
    setTimeout(() => {
      statusDiv.textContent = '';
    }, duration);
  }
}

function updateBtn(enabled) {
  console.log('[Popup] Updating button, enabled:', enabled);
  if (enabled) {
    toggleBtn.textContent = "Disable Extension";
    toggleBtn.className = "primary";
  } else {
    toggleBtn.textContent = "Enable Extension";
    toggleBtn.className = "disabled";
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] DOMContentLoaded');
  
  // Load current state
  chrome.storage.sync.get(['enabled'], (data) => {
    console.log('[Popup] Storage data:', data);
    const enabled = data.enabled !== undefined ? data.enabled : true;
    console.log('[Popup] Current enabled state:', enabled);
    updateBtn(enabled);
  });
  
  // Toggle button
  toggleBtn.addEventListener('click', () => {
    console.log('[Popup] Toggle button clicked');
    showStatus('Processing...', 0);
    
    chrome.storage.sync.get(['enabled'], (data) => {
      const currentState = data.enabled !== undefined ? data.enabled : true;
      const newState = !currentState;
      console.log('[Popup] Toggling from', currentState, 'to', newState);
      
      chrome.storage.sync.set({ enabled: newState }, () => {
        if (chrome.runtime.lastError) {
          console.error('[Popup] Storage error:', chrome.runtime.lastError);
          showStatus('Error: ' + chrome.runtime.lastError.message);
          return;
        }
        
        updateBtn(newState);
        showStatus(newState ? 'Extension enabled' : 'Extension disabled');
        console.log('[Popup] Extension', newState ? 'enabled' : 'disabled');
      });
    });
  });
  
  // Options button
  optionsBtn.addEventListener('click', () => {
    console.log('[Popup] Options button clicked');
    showStatus('Opening settings...', 0);
    
    try {
      chrome.runtime.openOptionsPage((result) => {
        if (chrome.runtime.lastError) {
          console.error('[Popup] Options page error:', chrome.runtime.lastError);
          showStatus('Error opening settings');
        } else {
          console.log('[Popup] Options page opened successfully');
          showStatus('Settings opened');
        }
      });
    } catch (error) {
      console.error('[Popup] Exception opening options:', error);
      showStatus('Error: ' + error.message);
    }
  });
  
  console.log('[Popup] Event listeners attached');
});
