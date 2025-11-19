document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  function renderList(containerId, map, type) {
    const container = $(containerId);
    container.innerHTML = '';
    if (!map) return;

    Object.keys(map).forEach(key => {
      const row = document.createElement('div');
      row.className = 'row';

      const keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.value = key;
      keyInput.readOnly = true;
      keyInput.style.background = '#f4f4f4';
      keyInput.style.maxWidth = '100px';

      const valInput = document.createElement('input');
      valInput.type = 'text';
      valInput.value = map[key];
      valInput.readOnly = true;
      valInput.style.background = '#f4f4f4';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.textContent = 'X';
      removeBtn.addEventListener('click', () => removeItem(type, key));

      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(removeBtn);

      container.appendChild(row);
    });
  }

  function addItem(type) {
    const keyInput = type === 'shortcut' ? $('new-shortcut-key') : $('new-replace-key');
    const valInput = type === 'shortcut' ? $('new-shortcut-val') : $('new-replace-val');
    if (!keyInput || !valInput) return console.error('Missing input elements for', type);

    const key = keyInput.value.trim();
    const val = valInput.value.trim();
    if (!key || !val) return; // ignore empty

    chrome.storage.sync.get(null, (data) => {
      const map = type === 'shortcut' ? (data.shortcuts || {}) : (data.replacements || {});
      map[key] = val;
      const update = type === 'shortcut' ? { shortcuts: map } : { replacements: map };
      chrome.storage.sync.set(update, () => {
        keyInput.value = '';
        valInput.value = '';
        renderList(type === 'shortcut' ? 'shortcuts-list' : 'replacements-list', map, type);
      });
    });
  }

  function removeItem(type, key) {
    chrome.storage.sync.get(null, (data) => {
      const map = type === 'shortcut' ? (data.shortcuts || {}) : (data.replacements || {});
      delete map[key];
      const update = type === 'shortcut' ? { shortcuts: map } : { replacements: map };
      chrome.storage.sync.set(update, () => {
        renderList(type === 'shortcut' ? 'shortcuts-list' : 'replacements-list', map, type);
      });
    });
  }

  // Expose for use by remove buttons
  window.removeItem = removeItem;

  // Attach click handlers safely
  const addShortcutBtn = $('add-shortcut');
  const addReplaceBtn = $('add-replace');
  const saveBtn = $('save-btn');
  if (addShortcutBtn) addShortcutBtn.addEventListener('click', () => addItem('shortcut'));
  if (addReplaceBtn) addReplaceBtn.addEventListener('click', () => addItem('replace'));

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const config = {
        enabled: $('enabled') ? $('enabled').checked : true,
        wordPickerItems: $('picker-items') ? $('picker-items').value.split('\n').filter(x => x.trim()) : [],
        formatting: {
          autoCapitalize: $('fmt-caps') ? $('fmt-caps').checked : true,
          removeDoubleSpaces: $('fmt-space') ? $('fmt-space').checked : true,
          smartQuotes: $('fmt-quote') ? $('fmt-quote').checked : true
        }
      };
      chrome.storage.sync.set(config, () => {
        const toast = $('toast');
        if (toast) {
          toast.style.opacity = 1;
          setTimeout(() => toast.style.opacity = 0, 2000);
        }
      });
    });
  }

  // Initial load (wrapped in try/catch to surface issues)
  try {
    chrome.storage.sync.get(null, (data) => {
      try {
        if ($('enabled')) $('enabled').checked = !!data.enabled;
        renderList('shortcuts-list', data.shortcuts, 'shortcut');
        renderList('replacements-list', data.replacements, 'replace');
        if ($('picker-items')) $('picker-items').value = (data.wordPickerItems || []).join('\n');
        if (data.formatting) {
          if ($('fmt-caps')) $('fmt-caps').checked = !!data.formatting.autoCapitalize;
          if ($('fmt-space')) $('fmt-space').checked = !!data.formatting.removeDoubleSpaces;
          if ($('fmt-quote')) $('fmt-quote').checked = !!data.formatting.smartQuotes;
        }
      } catch (innerErr) {
        console.error('Error initializing options UI', innerErr);
      }
    });
  } catch (err) {
    console.error('chrome.storage access error', err);
  }
});