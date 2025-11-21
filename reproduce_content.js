// content.js
// The core logic for handling text input, UI injection, and text manipulation.

// Attribution Notice
console.log(
  '%c🚀 Lingotribe Transcription Enhancer %cv2.1.0',
  'color: #3e8e41; font-weight: bold; font-size: 14px;',
  'color: #666; font-size: 12px;'
);
console.log(
  '%cCreated by me-sakibbb & NuhalMunawar',
  'color: #999; font-size: 11px;'
);
console.log(
  '%c© 2025 All Rights Reserved | https://github.com/me-sakibbb/lingotribe_transcription_enhancer',
  'color: #999; font-size: 10px;'
);

(async function () {
  // --- State & Config ---
  let settings = {};
  let activeElement = null;
  let autocompleteOverlay = null;
  let wordPicker = null;
  let currentWord = "";
  let suggestionIndex = 0;
  let filteredSuggestions = [];

  // --- Initialization ---

  // Load settings (chrome.storage in MV3 doesn't always return a Promise in all hosts,
  // so wrap the callback API in a Promise to safely await it)
  const loadSettings = async () => {
    settings = await new Promise((resolve) => {
      try {
        chrome.storage.sync.get(null, (items) => resolve(items || {}));
      } catch (e) {
        // Fallback: resolve with empty object to avoid blocking initialization
        resolve({});
      }
    });
  };
  await loadSettings();

  // Listen for changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      loadSettings();
    }
  });

  // --- UI Injection (Shadow DOM) ---

  const createUI = () => {
    const host = document.createElement('div');
    host.id = 'text-enhancer-host';
    host.style.position = 'absolute';
    host.style.top = '0';
    host.style.left = '0';
    host.style.zIndex = '2147483647'; // Max Z-Index
    host.style.pointerEvents = 'none'; // Let clicks pass through wrapper

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .dropdown {
        position: absolute;
        background: #2d2d2d;
        color: #fff;
        border: 1px solid #444;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        font-family: sans-serif;
        font-size: 14px;
        min-width: 150px;
        max-height: 200px;
        overflow-y: auto;
        display: none;
        pointer-events: auto;
      }
      .dropdown-item {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #3d3d3d;
      }
      .dropdown-item:hover, .dropdown-item.active {
        background: #3e8e41;
      }
      .dropdown-item .shortcut {
        font-weight: bold;
        color: #aaffaa;
        margin-right: 8px;
      }
      .word-picker {
        position: fixed;
        bottom: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 90vw;
        background: #fff;
        color: #333;
        border: 2px solid #3e8e41;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        font-family: sans-serif;
        transition: opacity 0.2s;
        resize: both;
        overflow: hidden;
      }
      .picker-header {
        padding: 10px 12px;
        background: linear-gradient(135deg, #3e8e41 0%, #2c662e 100%);
        color: white;
        border-radius: 6px 6px 0 0;
        cursor: move;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
      }
      .picker-header span:first-child {
        font-size: 14px;
      }
      .picker-header span:last-child {
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
        padding: 0 5px;
        border-radius: 3px;
        transition: background 0.2s;
      }
      .picker-header span:last-child:hover {
        background: rgba(255,255,255,0.2);
      }
      .picker-content {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px;
        overflow-y: auto;
        max-height: 300px;
        align-items: flex-start;
      }
      .picker-item {
        padding: 8px 16px;
        cursor: pointer;
        background: #f0f9ff;
        border: 1px solid #3e8e41;
        border-radius: 20px;
        transition: all 0.2s;
        white-space: nowrap;
        font-size: 13px;
        user-select: none;
      }
      .picker-item:hover {
        background: #3e8e41;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(62, 142, 65, 0.3);
      }
      .picker-item:active {
        transform: translateY(0);
      }
      .hidden { display: none !important; }
    `;

    // Autocomplete Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    autocompleteOverlay = dropdown;

    // Floating Word Picker
    const picker = document.createElement('div');
    picker.className = 'word-picker hidden';

    picker.innerHTML = `
      <div class="picker-header">
        <span>📝 Quick Insert</span>
        <span id="close-picker">×</span>
      </div>
      <div class="picker-content" id="picker-list"></div>
    `;

    wordPicker = picker;

    shadow.appendChild(style);
    shadow.appendChild(dropdown);
    shadow.appendChild(picker);
    document.body.appendChild(host);

    // Drag Logic for Picker
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const header = picker.querySelector('.picker-header');
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);

    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
      }
    }
    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        picker.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
    }

    // Populate Picker
    const renderPicker = () => {
      const list = picker.querySelector('#picker-list');
      list.innerHTML = '';
      (settings.wordPickerItems || []).forEach(text => {
        const item = document.createElement('div');
        item.className = 'picker-item';
        item.textContent = text;
        item.onclick = () => insertTextAtCursor(text);
        list.appendChild(item);
      });
    };

    picker.querySelector('#close-picker').onclick = () => {
      picker.classList.add('hidden');
    };

    // Expose render method to update later
    picker.render = renderPicker;
    renderPicker();
  };

  // --- Text Manipulation Helpers ---

  // --- TRACKING CURSOR ---
  let lastRange = null;
  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const activeEl = document.activeElement;
      if (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable) {
        lastRange = selection.getRangeAt(0).cloneRange();
      }
    }
  });

  // --- HELPERS ---
  async function handlePasteLogic(textToPaste, shouldRestoreRange = true) {
    const activeElement = document.activeElement;
    try { await navigator.clipboard.writeText(textToPaste); } catch (err) { console.error("Clipboard write failed", err); }

    if (shouldRestoreRange && lastRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(lastRange);
    }

    if (activeElement) {
      // Dispatch paste event
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
      });
      pasteEvent.clipboardData.setData('text/plain', textToPaste);
      activeElement.dispatchEvent(pasteEvent);

      // Fallback for simple inputs if paste event doesn't work automatically (though usually it requires manual handling in some frameworks)
      // However, for standard inputs, we might still need manual insertion if the event is prevented or not handled natively by the browser in this context.
      // But the user request specifically asked to use the "copy paste logic" from their snippet.
      // Their snippet dispatches the event and then updates lastRange.

      if (shouldRestoreRange) {
        setTimeout(() => {
          const sel = window.getSelection();
          if (sel.rangeCount > 0) lastRange = sel.getRangeAt(0).cloneRange();
        }, 50);
      }
    }
  }

  const insertTextAtCursor = async (text) => {
    if (!activeElement) return;
    console.log('[Content Script] insertTextAtCursor called with:', text);
    activeElement.focus();
    await handlePasteLogic(text, true);
    console.log('[Content Script] insertTextAtCursor complete');
  };

  const replaceLastWord = async (original, replacement, cursorIndex = null) => {
    if (!activeElement) return;

    console.log('[Content Script] replaceLastWord called:', original, '->', replacement, 'at cursor:', cursorIndex);

    const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    if (!isInput && !activeElement.isContentEditable) return;

    let currentText = '';
    if (isInput) {
      currentText = activeElement.value;
    } else {
      currentText = activeElement.innerText || activeElement.textContent || '';
    }

    // If cursorIndex is not provided, try to guess or default to end (legacy behavior, though risky)
    // But ideally we should always have it.
    let searchEndIndex = currentText.length;
    if (cursorIndex !== null) {
      searchEndIndex = cursorIndex;
    } else {
      // Try to get current cursor position if not passed
      const coords = getCaretCoordinates(); // This returns x,y not index. 
      // We need index.
      if (isInput) {
        searchEndIndex = activeElement.selectionStart;
      } else {
        // For contentEditable, it's hard to get absolute index without range.
        // We'll fallback to lastIndexOf entire string if not provided, but warn.
        console.warn('[Content Script] replaceLastWord called without cursorIndex, falling back to global search');
      }
    }

    // Find the last occurrence of the original word BEFORE the cursor
    const textBeforeCursor = currentText.slice(0, searchEndIndex);
    const lastIndex = textBeforeCursor.lastIndexOf(original);

    if (lastIndex === -1) {
      console.log('[Content Script] Word not found before cursor');
      return;
    }

    // Calculate new text
    // We replace the instance found at lastIndex
    // const newText = currentText.substring(0, lastIndex) + replacement + currentText.substring(lastIndex + original.length);

    // Select the word to be replaced
    if (isInput) {
      // Use setRangeText for reliable replacement without selecting all
      try {
        activeElement.setRangeText(replacement, lastIndex, lastIndex + original.length, 'end');

        // Trigger input event manually since setRangeText doesn't
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: false,
          inputType: 'insertText',
          data: replacement
        });
        activeElement.dispatchEvent(inputEvent);
      } catch (e) {
        console.error('[Content Script] setRangeText failed:', e);
        // Fallback to old method if setRangeText fails (unlikely for standard inputs)
        const newText = currentText.substring(0, lastIndex) + replacement + currentText.substring(lastIndex + original.length);
        activeElement.value = newText;
        activeElement.selectionStart = activeElement.selectionEnd = lastIndex + replacement.length;
      }
    } else {
      // For contentEditable - select all and paste new text
      // Recalculate newText for contentEditable
      const newText = currentText.substring(0, lastIndex) + replacement + currentText.substring(lastIndex + original.length);

      try {
        // 1. Write to clipboard FIRST
        try { await navigator.clipboard.writeText(newText); } catch (err) { console.error("Clipboard write failed", err); }

        // 2. Select all
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(activeElement);
        selection.removeAllRanges();
        selection.addRange(range);

        // 3. Wait a bit
        await new Promise(resolve => setTimeout(resolve, 10));

        // 4. Paste
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: new DataTransfer()
        });
        pasteEvent.clipboardData.setData('text/plain', newText);
        activeElement.dispatchEvent(pasteEvent);

        // Attempt to restore cursor (tricky in contentEditable but we can try)
        // We can use the trySlateReplacement logic or similar if needed, 
        // but for now let's rely on the paste event behavior or user interaction.
        // Ideally we should set the caret after the replacement.
      } catch (e) {
        console.error('[Content Script] Error in replaceLastWord:', e);
      }
    }
  };

  const getCaretCoordinates = () => {
    let x = 0, y = 0;
    if (!activeElement) return { x, y };
    const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

    if (isInput) {
      // Using a mirror div method would go here. 
      // For brevity/performance, we approximate or use a library in production.
      // Here is a simple approximation based on element position + basic font math
      const rect = activeElement.getBoundingClientRect();
      // Very rough approximation for demo purposes. 
      // Production would use: https://github.com/component/textarea-caret
      y = rect.bottom + window.scrollY;
      x = rect.left + window.scrollX + 20; // Offset slightly
    } else {
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(true);
        const rect = range.getClientRects()[0];
        if (rect) {
          x = rect.left + window.scrollX;
          y = rect.bottom + window.scrollY;
        }
      }
    }
    return { x, y };
  };

  // --- Event Listeners ---

  document.addEventListener('focusin', (e) => {
    // If focus is inside a contentEditable subtree, use the nearest contentEditable root
    let el = e.target;
    if (el) {
      if (el.nodeType === Node.TEXT_NODE) el = el.parentElement;
      const editableRoot = el.closest && el.closest('[contenteditable="true"]');
      if (editableRoot) {
        activeElement = editableRoot;
        return;
      }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        activeElement = el;
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    // Hotkey for Formatting: Alt+F
    if (e.altKey && e.key === 'f') {
      e.preventDefault();
      e.stopPropagation();
      applyFormatting();
      return;
    }

    // Hotkey for Replacements: Alt+R
    if (e.altKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      e.stopPropagation();
      applyReplacementsToActiveElement();
      return;
    }

    // Hotkey for All (Replacements + Formatting): Alt+A
    if (e.altKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      e.stopPropagation();
      applyAllTransformations();
      return;
    }

    // Hotkey for Number Conversion: Alt+N
    if (e.altKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      e.stopPropagation();
      convertWordsToNumbers();
      return;
    }

    // Hotkey for Word Picker: Alt+P
    if (e.altKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Content Script] Alt+P pressed, wordPicker exists:', !!wordPicker);
      if (!wordPicker) {
        console.log('[Content Script] Creating UI for word picker...');
        createUI();
      }
      if (wordPicker) {
        const wasHidden = wordPicker.classList.contains('hidden');
        wordPicker.classList.toggle('hidden');
        console.log('[Content Script] Word picker toggled:', wasHidden ? 'showing' : 'hiding');
      } else {
        console.log('[Content Script] ERROR: wordPicker still null after createUI');
      }
      return;
    }

    // Autocomplete Navigation - Only handle if autocomplete is visible
    if (autocompleteOverlay && autocompleteOverlay.style.display === 'block') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        suggestionIndex = (suggestionIndex + 1) % filteredSuggestions.length;
        renderSuggestions();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        suggestionIndex = (suggestionIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
        renderSuggestions();
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        confirmSuggestion();
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        hideSuggestions();
      }
    }
  });

  document.addEventListener('input', (e) => {
    // Skip if not enabled
    if (!settings.enabled || !activeElement) return;

    console.log('[Content Script] Input event detected on', activeElement.tagName);
    const text = (activeElement.value || activeElement.innerText || "");
    // Determine cursor position safely
    let cursorPos = null;
    if (activeElement.selectionStart !== undefined) {
      cursorPos = activeElement.selectionStart;
    } else {
      // For contentEditable, calculate total character offset
      try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          cursorPos = getCharacterOffsetWithin(activeElement, range.startContainer, range.startOffset);
          console.log('[Content Script] ContentEditable cursor position:', cursorPos, 'of', text.length);
        }
      } catch (err) {
        console.log('[Content Script] Could not get cursor position:', err);
        cursorPos = null;
      }
    }

    // 1. Autocomplete: detect current word before cursor
    if (cursorPos !== null) {
      const beforeCursor = text.slice(0, cursorPos);
      console.log('[Content Script] Before cursor:', JSON.stringify(beforeCursor));
      const wordMatch = beforeCursor.match(/(\S+)$/);
      if (wordMatch) {
        currentWord = wordMatch[0];
        checkAutocomplete(currentWord);
      } else {
        hideSuggestions();
        currentWord = "";
      }

      // 2. Replacement trigger: check char before cursor (whitespace or punctuation)
      const charBefore = beforeCursor.slice(-1);
      console.log('[Content Script] Char before cursor:', JSON.stringify(charBefore));
      if (/\s|[.?!,;:\)\]]/.test(charBefore)) {
        console.log('[Content Script] Trigger character detected');
        // We consider the user finished a word — get the last word and attempt replacement
        // Get the text WITHOUT the trigger character to find the word
        const textWithoutTrigger = beforeCursor.slice(0, -1);
        const lastWordMatch = textWithoutTrigger.trim().match(/(\S+)$/);
        console.log('[Content Script] Last word match:', lastWordMatch);
        if (lastWordMatch) {
          const finishedWord = lastWordMatch[0];

          // Fix: If this word is also a shortcut, skip auto-replacement to favor "type and tab"
          // This prevents issues where a short prefix (like "sp") configured as both might trigger unwantedly
          if (settings.shortcuts && (settings.shortcuts[finishedWord] || settings.shortcuts[finishedWord.toLowerCase()])) {
            console.log('[Content Script] Skipping auto-replacement for shortcut:', finishedWord);
            return;
          }

          const replacement = settings.replacements && settings.replacements[finishedWord.toLowerCase()];
          console.log('[Content Script] Checking replacements for:', finishedWord, 'found:', replacement);
          if (replacement !== undefined) {
            console.log('[Content Script] Auto-replacement triggered for', finishedWord, '->', replacement);
            // Delete the word AND the trigger character, then insert replacement + space
            replaceLastWord(finishedWord + charBefore, replacement + charBefore, cursorPos);
          } else if (settings.removedWords && settings.removedWords.includes(finishedWord.toLowerCase())) {
            console.log('[Content Script] Auto-remove triggered for', finishedWord);
            // Delete the word AND the trigger character, then insert just the trigger
            replaceLastWord(finishedWord + charBefore, charBefore, cursorPos);
          }
        }
      }
    } else {
      // Fallback: if we can't detect cursor position, do nothing
      console.log('[Content Script] Could not detect cursor position');
    }
  });

  // Helper function for copy-paste method
  async function applyTextTransformation(transformFn, flashColor = '#fffacd') {
    if (!activeElement) return;

    const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    if (!isInput && !activeElement.isContentEditable) return;

    // Flash effect
    const originalBg = activeElement.style.backgroundColor;
    activeElement.style.backgroundColor = flashColor;

    // Read current text
    let currentText = '';
    if (isInput) {
      currentText = activeElement.value;
    } else {
      currentText = activeElement.innerText || activeElement.textContent || '';
    }

    console.log('[Content Script] Original text:', currentText);

    // Apply transformation
    const newText = transformFn(currentText);

    console.log('[Content Script] Transformed text:', newText);

    // If no changes, stop
    if (newText === currentText) {
      console.log('[Content Script] No changes needed');
      setTimeout(() => activeElement.style.backgroundColor = originalBg, 200);
      return;
    }

    // Focus the element first
    activeElement.focus();

    // For INPUT/TEXTAREA - direct manipulation works best
    if (isInput) {
      activeElement.value = newText;
      activeElement.selectionStart = activeElement.selectionEnd = newText.length;

      // Trigger input event so the page knows content changed
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: false,
        inputType: 'insertText',
        data: newText
      });
      activeElement.dispatchEvent(inputEvent);

      console.log('[Content Script] Updated input/textarea value');
    } else {
      // For contentEditable (Slate.js) - select all and dispatch paste event
      try {
        // 1. Write to clipboard FIRST
        try { await navigator.clipboard.writeText(newText); } catch (err) { console.error("Clipboard write failed", err); }

        // 2. Select all content
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(activeElement);
        selection.removeAllRanges();
        selection.addRange(range);

        console.log('[Content Script] Selected all content, dispatching paste');

        // 3. Wait a bit
        await new Promise(resolve => setTimeout(resolve, 10));

        // 4. Dispatch Paste Event
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: new DataTransfer()
        });
        pasteEvent.clipboardData.setData('text/plain', newText);
        activeElement.dispatchEvent(pasteEvent);

        console.log('[Content Script] Paste event dispatched manually');

      } catch (e) {
        console.error('[Content Script] Error updating contentEditable:', e);
      }
    }

    // Cleanup
    setTimeout(() => {
      activeElement.style.backgroundColor = originalBg;
    }, 200);
  }

  async function applyReplacementsToActiveElement() {
    if (!activeElement || !settings.replacements) return;

    console.log('[Content Script] applyReplacementsToActiveElement called (Alt+R)');

    await applyTextTransformation((text) => {
      let newText = text;
      Object.keys(settings.replacements).forEach(k => {
        const escaped = escapeRegExp(k);
        const re = new RegExp('\\b' + escaped + '\\b', 'gi');
        newText = newText.replace(re, settings.replacements[k]);
      });
      return newText;
    });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Dispatch a beforeinput event for editors that listen to it (e.g., Slate).
  // Returns true if the event was cancelled (handled) by the page/editor.
  function dispatchBeforeInputForRange(targetRoot, range, replacement) {
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      // Choose inputType
      const inputType = (replacement === '') ? 'deleteContentBackward' : 'insertText';
      let evt;
      try {
        evt = new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          data: replacement,
          inputType: inputType,
          isComposing: false
        });
      } catch (e) {
        // Older browsers may not support InputEvent constructor
        evt = document.createEvent('Event');
        evt.initEvent('beforeinput', true, true);
        evt.data = replacement;
        evt.inputType = inputType;
      }

      // Dispatch on the editable root so editors like Slate receive it
      const dispatched = targetRoot.dispatchEvent(evt);
      // dispatchEvent returns false if preventDefault was called
      return dispatched === false;
    } catch (err) {
      console.error('dispatchBeforeInputForRange failed', err);
      return false;
    }
  }

  // Helper to find React fiber and call onChange directly
  // This runs in content script context but can access page elements
  function trySlateReplacement(root, startIndex, endIndex, replacement) {
    try {
      console.log('[Content Script] trySlateReplacement called', { root, startIndex, endIndex, replacement });
      if (!root) {
        console.log('[Content Script] No root element');
        return false;
      }

      // Get full text content
      const fullText = root.innerText || root.textContent || '';
      console.log('[Content Script] Current fullText:', JSON.stringify(fullText));
      console.log('[Content Script] Slicing [0,' + startIndex + ']:', JSON.stringify(fullText.slice(0, startIndex)));
      console.log('[Content Script] Slicing [' + startIndex + ',' + endIndex + ']:', JSON.stringify(fullText.slice(startIndex, endIndex)));
      console.log('[Content Script] Slicing [' + endIndex + ',end]:', JSON.stringify(fullText.slice(endIndex)));

      const before = fullText.slice(0, startIndex);
      const after = fullText.slice(endIndex);
      const newText = before + (replacement || '') + after;
      console.log('[Content Script] New text will be:', JSON.stringify(newText));

      // Find React internal fiber on the DOM node
      const keys = Object.keys(root);
      let fiber = null;
      for (const k of keys) {
        if (k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')) {
          fiber = root[k];
          console.log('[Content Script] Found fiber on root via key:', k);
          break;
        }
      }
      if (!fiber) {
        // Try parent nodes
        let p = root.parentElement;
        let depth = 0;
        while (p && !fiber && depth < 10) {
          depth++;
          for (const k of Object.keys(p)) {
            if (k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')) {
              fiber = p[k];
              console.log('[Content Script] Found fiber on parent at depth', depth, 'via key:', k);
              break;
            }
          }
          p = p.parentElement;
        }
      }
      if (!fiber) {
        console.log('[Content Script] No React fiber found');
        return false;
      }

      // Walk up fiber to find a component with props.onChange
      let comp = fiber;
      let attempts = 0;
      while (comp && attempts < 50) {
        attempts++;
        const props = comp.memoizedProps || comp.pendingProps || (comp.stateNode && comp.stateNode.props);
        if (props && typeof props.onChange === 'function') {
          try {
            console.log('[Content Script] Found onChange at attempt', attempts);
            // Try to build a Slate-compatible value structure
            const newValue = [{
              type: 'paragraph',
              children: [{ text: newText }]
            }];

            console.log('[Content Script] Calling onChange with:', newValue);
            props.onChange(newValue);
            console.log('[Content Script] onChange called successfully');

            // Give React a moment to process the state update
            setTimeout(() => {
              // Try to restore cursor position
              const sel = window.getSelection();
              if (sel && root.childNodes.length > 0) {
                try {
                  const targetPos = startIndex + (replacement || '').length;
                  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
                  let currentOffset = 0;
                  let node;
                  while (node = walker.nextNode()) {
                    const len = node.nodeValue.length;
                    if (currentOffset + len >= targetPos) {
                      const range = document.createRange();
                      range.setStart(node, targetPos - currentOffset);
                      range.collapse(true);
                      sel.removeAllRanges();
                      sel.addRange(range);
                      console.log('[Content Script] Cursor restored to position', targetPos);
                      break;
                    }
                    currentOffset += len;
                  }
                } catch (e) {
                  console.log('[Content Script] Cursor restore failed:', e);
                }
              }
            }, 0);

            return true;
          } catch (err) {
            console.log('[Content Script] onChange call failed:', err);
          }
        }
        comp = comp.return;
      }

      console.log('[Content Script] No suitable onChange handler found after', attempts, 'attempts');
      return false;
    } catch (err) {
      console.error('[Content Script] trySlateReplacement error:', err);
      return false;
    }
  }

  // Ensure page helper is injected early
  console.log('[Content Script] Initializing...');

  // --- Helpers for contentEditable text manipulation ---
  function getTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      nodes.push(node);
    }
    return nodes;
  }

  function findNodeForCharacterOffset(root, index) {
    const nodes = getTextNodes(root);
    let count = 0;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const len = n.nodeValue.length;
      if (count + len >= index) {
        return { node: n, offset: index - count };
      }
      count += len;
    }
    // If index at end, return last node end
    if (nodes.length) {
      const last = nodes[nodes.length - 1];
      return { node: last, offset: last.nodeValue.length };
    }
    return null;
  }

  // Get the character offset (number of characters from start of `root`)
  // Accepts either:
  //  - a Range object as the second parameter, or
  //  - a pair (node, offset) where the second parameter is a Node and third is an offset number.
  function getCharacterOffsetWithin(root, a, b) {
    try {
      const r = document.createRange();
      if (a && typeof a.cloneRange === 'function') {
        // a is a Range
        r.selectNodeContents(root);
        r.setEnd(a.endContainer, a.endOffset);
        return r.toString().length;
      }
      // Otherwise assume (node, offset)
      if (a && typeof b === 'number') {
        r.selectNodeContents(root);
        r.setEnd(a, b);
        return r.toString().length;
      }
    } catch (err) {
      console.log('[Content Script] getCharacterOffsetWithin error:', err);
    }
    return null;
  }

  function setCaretPosition(root, chars) {
    const pos = findNodeForCharacterOffset(root, chars);
    if (!pos) return;
    const sel = window.getSelection();
    const range = document.createRange();
    range.setStart(pos.node, pos.offset);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // --- Autocomplete Logic ---

  function checkAutocomplete(input) {
    if (!settings.shortcuts) return;
    if (input.length < 2) {
      hideSuggestions();
      return;
    }

    filteredSuggestions = Object.keys(settings.shortcuts)
      .filter(key => key.startsWith(input))
      .map(key => ({ key, value: settings.shortcuts[key] }));

    if (filteredSuggestions.length > 0) {
      showSuggestions();
    } else {
      hideSuggestions();
    }
  }

  function showSuggestions() {
    if (!autocompleteOverlay) createUI();

    const coords = getCaretCoordinates();
    autocompleteOverlay.style.left = `${coords.x}px`;
    autocompleteOverlay.style.top = `${coords.y + 5}px`; // 5px buffer
    autocompleteOverlay.style.display = 'block';

    suggestionIndex = 0;
    renderSuggestions();
  }

  function hideSuggestions() {
    if (autocompleteOverlay) autocompleteOverlay.style.display = 'none';
  }

  function renderSuggestions() {
    autocompleteOverlay.innerHTML = '';
    filteredSuggestions.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = `dropdown-item ${index === suggestionIndex ? 'active' : ''}`;
      div.innerHTML = `<span class="shortcut">${item.key}</span> ${item.value}`;
      div.onmousedown = (e) => { e.preventDefault(); suggestionIndex = index; confirmSuggestion(); }; // mousedown prevents focus loss
      autocompleteOverlay.appendChild(div);
    });
  }

  function confirmSuggestion() {
    const item = filteredSuggestions[suggestionIndex];
    if (item) {
      console.log('[Content Script] Confirming autocomplete suggestion:', item.key, '->', item.value);

      if (activeElement) {

        // Add a space after the replacement if it doesn't have one
        let replacementValue = item.value;
        if (!replacementValue.endsWith(' ')) {
          replacementValue += ' ';
        }

        replaceLastWord(currentWord, replacementValue, cursorPos);
      }
    }
    hideSuggestions();
  }

  // --- Formatting Logic ---

  async function applyFormatting() {
    if (!activeElement) return;

    console.log('[Content Script] applyFormatting called (Alt+F)');

    await applyTextTransformation((text) => {
      let newText = text;

      // Step 1: Remove specific words/phrases from formattingRemovedWords list
      if (settings.formattingRemovedWords && Array.isArray(settings.formattingRemovedWords)) {
        settings.formattingRemovedWords.forEach(word => {
          const escapedWord = escapeRegExp(word);
          const regex = new RegExp(escapedWord, 'g');
          newText = newText.replace(regex, '');
        });
      }

      // Step 2: Process text inside brackets [...]
      newText = newText.replace(/\[([^\]]+)\]/g, (match, content) => {
        let cleaned = content.replace(/^[,.\s]+|[,.\s]+$/g, '');
        cleaned = cleaned.toLowerCase();
        return '[' + cleaned + ']';
      });

      // Step 3: Ensure single space after punctuation
      if (settings.formatting && settings.formatting.spaceAfterPunctuation) {
        newText = newText.replace(/([.!?,;:])(\s*)(?=\S)/g, '$1 ');
      }

      // Step 4: Remove double spaces
      if (settings.formatting && settings.formatting.removeDoubleSpaces) {
        newText = newText.replace(/ +/g, ' ');
      }

      // Step 5: Auto-capitalize sentences
      if (settings.formatting && settings.formatting.autoCapitalize) {
        newText = newText.replace(/(?:^|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());
      }

      // Smart quotes (optional)
      if (settings.formatting && settings.formatting.smartQuotes) {
        newText = newText.replace(/"/g, '\u201C').replace(/'/g, '\u2019');
      }

      // Final cleanup: trim whitespace
      return newText.trim();
    });
  }

  // --- Alt+A: Apply All Transformations (Replacements + Formatting) ---

  async function applyAllTransformations() {
    if (!activeElement) return;

    console.log('[Content Script] applyAllTransformations called (Alt+A)');

    await applyTextTransformation((text) => {
      let newText = text;

      // Step 1: Apply replacements (Alt+R functionality)
      if (settings.replacements) {
        Object.keys(settings.replacements).forEach(k => {
          const escaped = escapeRegExp(k);
          const re = new RegExp('\\b' + escaped + '\\b', 'gi');
          newText = newText.replace(re, settings.replacements[k]);
        });
      }

      // Step 2: Convert word numbers to digits (Alt+N functionality)
      if (settings.formatting && settings.formatting.convertWordNumbers) {
        const wordToNumber = {
          'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
          'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
          'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
          'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
          'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
          'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
          'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
        };

        Object.keys(wordToNumber).forEach(word => {
          const regex = new RegExp('\\b' + word + '\\b', 'gi');
          newText = newText.replace(regex, wordToNumber[word]);
        });
      }

      // Step 3: Remove specific words/phrases from formattingRemovedWords list (Alt+F functionality)
      if (settings.formattingRemovedWords && Array.isArray(settings.formattingRemovedWords)) {
        settings.formattingRemovedWords.forEach(word => {
          const escapedWord = escapeRegExp(word);
          const regex = new RegExp(escapedWord, 'g');
          newText = newText.replace(regex, '');
        });
      }

      // Step 4: Process text inside brackets [...] (Alt+F functionality)
      newText = newText.replace(/\[([^\]]+)\]/g, (match, content) => {
        let cleaned = content.replace(/^[,.\s]+|[,.\s]+$/g, '');
        cleaned = cleaned.toLowerCase();
        return '[' + cleaned + ']';
      });

      // Step 5: Ensure single space after punctuation (Alt+F functionality)
      if (settings.formatting && settings.formatting.spaceAfterPunctuation) {
        newText = newText.replace(/([.!?,;:])(\s*)(?=\S)/g, '$1 ');
      }

      // Step 6: Remove double spaces (Alt+F functionality)
      if (settings.formatting && settings.formatting.removeDoubleSpaces) {
        newText = newText.replace(/ +/g, ' ');
      }

      // Step 7: Auto-capitalize sentences (Alt+F functionality)
      if (settings.formatting && settings.formatting.autoCapitalize) {
        newText = newText.replace(/(?:^|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());
      }

      // Step 8: Smart quotes (Alt+F functionality)
      if (settings.formatting && settings.formatting.smartQuotes) {
        newText = newText.replace(/"/g, '\u201C').replace(/'/g, '\u2019');
      }

      return newText.trim();
    });
  }

  async function convertWordsToNumbers() {
    if (!activeElement) return;
    if (!settings.formatting || !settings.formatting.convertWordNumbers) return;

    console.log('[Content Script] convertWordsToNumbers called (Alt+N)');

    await applyTextTransformation((text) => {
      const wordToNumber = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
        'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
        'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
        'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
        'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
        'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
      };

      let newText = text;
      Object.keys(wordToNumber).forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        newText = newText.replace(regex, wordToNumber[word]);
      });

      return newText;
    });
  }

})();
