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

  // Function to render array-based list (for formattingRemovedWords)
  function renderArrayList(containerId, array) {
    const container = $(containerId);
    container.innerHTML = '';
    if (!array || !Array.isArray(array)) return;

    array.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'row';

      const itemInput = document.createElement('input');
      itemInput.type = 'text';
      itemInput.value = item;
      itemInput.readOnly = true;
      itemInput.style.background = '#f4f4f4';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.textContent = 'X';
      removeBtn.addEventListener('click', () => removeArrayItem(index));

      row.appendChild(itemInput);
      row.appendChild(removeBtn);

      container.appendChild(row);
    });
  }

  function addFormattingRemovedWord() {
    const input = $('new-formatting-removed');
    if (!input) return;

    const word = input.value.trim();
    if (!word) return;

    chrome.storage.sync.get(null, (data) => {
      const arr = data.formattingRemovedWords || [];
      if (!arr.includes(word)) {
        arr.push(word);
        chrome.storage.sync.set({ formattingRemovedWords: arr }, () => {
          input.value = '';
          renderArrayList('formatting-removed-list', arr);
        });
      }
    });
  }

  function removeArrayItem(index) {
    chrome.storage.sync.get(null, (data) => {
      const arr = data.formattingRemovedWords || [];
      arr.splice(index, 1);
      chrome.storage.sync.set({ formattingRemovedWords: arr }, () => {
        renderArrayList('formatting-removed-list', arr);
      });
    });
  }

  // Attach click handlers safely
  const addShortcutBtn = $('add-shortcut');
  const addReplaceBtn = $('add-replace');
  const addFormattingRemovedBtn = $('add-formatting-removed');
  const saveBtn = $('save-btn');
  if (addShortcutBtn) addShortcutBtn.addEventListener('click', () => addItem('shortcut'));
  if (addReplaceBtn) addReplaceBtn.addEventListener('click', () => addItem('replace'));
  if (addFormattingRemovedBtn) addFormattingRemovedBtn.addEventListener('click', addFormattingRemovedWord);

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const config = {
        enabled: $('enabled') ? $('enabled').checked : true,
        wordPickerItems: $('picker-items') ? $('picker-items').value.split('\n').filter(x => x.trim()) : [],
        formatting: {
          autoCapitalize: $('fmt-caps') ? $('fmt-caps').checked : true,
          removeDoubleSpaces: $('fmt-space') ? $('fmt-space').checked : true,
          spaceAfterPunctuation: $('fmt-punctuation') ? $('fmt-punctuation').checked : true,
          smartQuotes: $('fmt-quote') ? $('fmt-quote').checked : true,
          removeWords: $('fmt-remove-words') ? $('fmt-remove-words').checked : true,
          convertWordNumbers: $('fmt-convert-numbers') ? $('fmt-convert-numbers').checked : false
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
        renderArrayList('formatting-removed-list', data.formattingRemovedWords);
        if ($('picker-items')) $('picker-items').value = (data.wordPickerItems || []).join('\n');
        if (data.formatting) {
          if ($('fmt-caps')) $('fmt-caps').checked = !!data.formatting.autoCapitalize;
          if ($('fmt-space')) $('fmt-space').checked = !!data.formatting.removeDoubleSpaces;
          if ($('fmt-punctuation')) $('fmt-punctuation').checked = !!data.formatting.spaceAfterPunctuation;
          if ($('fmt-quote')) $('fmt-quote').checked = !!data.formatting.smartQuotes;
          if ($('fmt-remove-words')) $('fmt-remove-words').checked = !!data.formatting.removeWords;
          if ($('fmt-convert-numbers')) $('fmt-convert-numbers').checked = !!data.formatting.convertWordNumbers;
        }
      } catch (innerErr) {
        console.error('Error initializing options UI', innerErr);
      }
    });
  } catch (err) {
    console.error('chrome.storage access error', err);
  }
});