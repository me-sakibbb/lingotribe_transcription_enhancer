// content.js
// The core logic for handling text input, UI injection, and text manipulation.

(async function() {
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

  const getInputSelection = (el) => {
    let start = 0, end = 0, normalizedValue, range, textInputRange, len, endRange;
    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
      start = el.selectionStart;
      end = el.selectionEnd;
    } else {
      range = document.selection.createRange();
      if (range && range.parentElement() == el) {
        len = el.value.length;
        normalizedValue = el.value.replace(/\r\n/g, "\n");
        textInputRange = el.createTextRange();
        textInputRange.moveToBookmark(range.getBookmark());
        endRange = el.createTextRange();
        endRange.collapse(false);
        if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
          start = end = len;
        } else {
          start = -textInputRange.moveStart("character", -len);
          start += normalizedValue.slice(0, start).split("\n").length - 1;
          if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
            end = len;
          } else {
            end = -textInputRange.moveEnd("character", -len);
            end += normalizedValue.slice(0, end).split("\n").length - 1;
          }
        }
      }
    }
    return { start, end };
  };

  const insertTextAtCursor = (text) => {
    if (!activeElement) return;

    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      const val = activeElement.value;
      const sel = getInputSelection(activeElement);
      const start = sel.start;
      const end = sel.end;
      activeElement.value = val.substring(0, start) + text + val.substring(end);
      activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
      activeElement.dispatchEvent(new Event('input', { bubbles: true })); // Trigger frameworks like React
    } else if (activeElement.isContentEditable) {
      document.execCommand('insertText', false, text);
    }
  };

  const replaceLastWord = (original, replacement) => {
    if (!activeElement) return;
    
    console.log('[Content Script] replaceLastWord called:', original, '->', replacement);
    
    // Use keyboard simulation for all element types - works better with modern editors
    simulateTyping(activeElement, original, replacement);
  };
  
  // --- Coordinate Calculation (The Hard Part) ---
  // Needed to place the dropdown exactly under the caret
  
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
      applyFormatting();
      return;
    }

    // Hotkey for Replacements: Alt+R
    if (e.altKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      applyReplacementsToActiveElement();
      return;
    }

    // Hotkey for Word Picker: Alt+P
    if (e.altKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
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

    // Autocomplete Navigation
    if (autocompleteOverlay && autocompleteOverlay.style.display === 'block') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        suggestionIndex = (suggestionIndex + 1) % filteredSuggestions.length;
        renderSuggestions();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        suggestionIndex = (suggestionIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
        renderSuggestions();
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        confirmSuggestion();
      } else if (e.key === 'Escape') {
        hideSuggestions();
      }
    }
  }, true); // Capture phase to preempt default handling if autocomplete is open

  document.addEventListener('input', (e) => {
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
          const replacement = settings.replacements && settings.replacements[finishedWord.toLowerCase()];
          console.log('[Content Script] Checking replacements for:', finishedWord, 'found:', replacement);
          if (replacement !== undefined) {
            console.log('[Content Script] Auto-replacement triggered for', finishedWord, '->', replacement);
            // Delete the word AND the trigger character, then insert replacement + space
            replaceLastWord(finishedWord + charBefore, replacement + charBefore);
          } else if (settings.removedWords && settings.removedWords.includes(finishedWord.toLowerCase())) {
            console.log('[Content Script] Auto-remove triggered for', finishedWord);
            // Delete the word AND the trigger character, then insert just the trigger
            replaceLastWord(finishedWord + charBefore, charBefore);
          }
        }
      }
    } else {
      // Fallback: if we can't detect cursor position, do nothing
      console.log('[Content Script] Could not detect cursor position');
    }
  });

  // Replace all configured replacement keys inside the active element (used by Alt+R)
  function applyReplacementsToActiveElement() {
    if (!activeElement || !settings.replacements) return;
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      let val = activeElement.value;
      Object.keys(settings.replacements).forEach(k => {
        const escaped = escapeRegExp(k);
        const re = new RegExp('\\b' + escaped + '\\b', 'gi');
        val = val.replace(re, settings.replacements[k]);
      });
      if (val !== activeElement.value) {
        activeElement.value = val;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else if (activeElement.isContentEditable) {
      // Replace on a per-text-node basis to preserve markup
      try {
        const sel = window.getSelection();
        const hadSel = sel && sel.rangeCount > 0;
        let caretOffset = null;
        if (hadSel) {
          const range = sel.getRangeAt(0).cloneRange();
          caretOffset = getCharacterOffsetWithin(activeElement, range);
        }

        let madeChange = false;
        // Iterate through replacement keys and apply them by selecting ranges and using execCommand
        for (const k of Object.keys(settings.replacements)) {
          const escaped = escapeRegExp(k);
          const re = new RegExp('\\b' + escaped + '\\b', 'gi');

          // Re-scan text nodes each time because execCommand may modify the DOM
          let nodes = getTextNodes(activeElement);
          let found = true;
          while (found) {
            found = false;
            for (const node of nodes) {
              if (!node.nodeValue) continue;
              const m = re.exec(node.nodeValue);
              if (m) {
                found = true;
                madeChange = true;
                const matchIndex = m.index;
                const matchLen = m[0].length;
                // Build range for this match
                const range = document.createRange();
                range.setStart(node, matchIndex);
                range.setEnd(node, matchIndex + matchLen);
                try {
                  const sel = window.getSelection();
                  sel.removeAllRanges();
                  sel.addRange(range);
                  activeElement.focus();
                  document.execCommand('insertText', false, settings.replacements[k]);
                } catch (err) {
                  console.error('applyReplacementsToActiveElement execCommand failed', err);
                  // Fallback: perform direct node replacement
                  node.nodeValue = node.nodeValue.replace(re, settings.replacements[k]);
                }
                break; // restart scanning for this replacement key
              }
            }
            if (found) {
              nodes = getTextNodes(activeElement);
            }
          }
        }

        if (madeChange && hadSel && caretOffset !== null) {
          // Try to place caret back near previous offset
          setCaretPosition(activeElement, caretOffset);
        }
      } catch (err) {
        console.error('applyReplacementsToActiveElement (contentEditable) failed', err);
      }
    }
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
      console.log('[Content Script] trySlateReplacement called', {root, startIndex, endIndex, replacement});
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

  // Simulate typing by dispatching keyboard events
  function simulateTyping(element, textToDelete, textToType) {
    console.log('[Content Script] Simulating typing: delete', textToDelete.length, 'chars, type:', textToType);
    
    // Focus the element
    element.focus();
    
    // Simulate Backspace keypresses to delete the typed word
    for (let i = 0; i < textToDelete.length; i++) {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        which: 8,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      const keyupEvent = new KeyboardEvent('keyup', {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        which: 8,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      
      element.dispatchEvent(keydownEvent);
      
      // For INPUT/TEXTAREA, manually manipulate value
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        const start = element.selectionStart;
        const end = element.selectionEnd;
        if (start > 0) {
          element.value = element.value.substring(0, start - 1) + element.value.substring(end);
          element.selectionStart = element.selectionEnd = start - 1;
        }
      } else {
        // For contentEditable, use execCommand
        document.execCommand('delete', false, null);
      }
      
      // Dispatch input event
      const inputEvent = new InputEvent('input', {
        inputType: 'deleteContentBackward',
        bubbles: true,
        cancelable: false,
        composed: true
      });
      element.dispatchEvent(inputEvent);
      element.dispatchEvent(keyupEvent);
    }
    
    // Small delay to let the editor process deletions
    setTimeout(() => {
      // Now type each character of the replacement text
      for (let i = 0; i < textToType.length; i++) {
        const char = textToType[i];
        
        const keydownEvent = new KeyboardEvent('keydown', {
          key: char,
          code: 'Key' + char.toUpperCase(),
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0),
          bubbles: true,
          cancelable: true,
          composed: true
        });
        const keypressEvent = new KeyboardEvent('keypress', {
          key: char,
          code: 'Key' + char.toUpperCase(),
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0),
          bubbles: true,
          cancelable: true,
          composed: true
        });
        const keyupEvent = new KeyboardEvent('keyup', {
          key: char,
          code: 'Key' + char.toUpperCase(),
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0),
          bubbles: true,
          cancelable: true,
          composed: true
        });
        
        element.dispatchEvent(keydownEvent);
        element.dispatchEvent(keypressEvent);
        
        // For INPUT/TEXTAREA, manually insert character
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          const start = element.selectionStart;
          const end = element.selectionEnd;
          element.value = element.value.substring(0, start) + char + element.value.substring(end);
          element.selectionStart = element.selectionEnd = start + 1;
        } else {
          // For contentEditable, use execCommand
          document.execCommand('insertText', false, char);
        }
        
        // Dispatch input event
        const inputEvent = new InputEvent('input', {
          data: char,
          inputType: 'insertText',
          bubbles: true,
          cancelable: false,
          composed: true
        });
        element.dispatchEvent(inputEvent);
        element.dispatchEvent(keyupEvent);
      }
      
      console.log('[Content Script] Typing simulation complete');
    }, 10);
  }

  function confirmSuggestion() {
    const item = filteredSuggestions[suggestionIndex];
    if (item) {
      console.log('[Content Script] Confirming autocomplete suggestion:', item.key, '->', item.value);
      
      if (activeElement) {
        // Use keyboard simulation approach - works better with React/Slate/Google Docs
        simulateTyping(activeElement, currentWord, item.value);
      }
    }
    hideSuggestions();
  }

  // --- Formatting Logic ---

  function applyFormatting() {
    if (!activeElement) return;
    
    let text = activeElement.value || activeElement.innerText;
    let newText = text;

    // Step 1: Remove specific words/phrases from formattingRemovedWords list
    if (settings.formattingRemovedWords && Array.isArray(settings.formattingRemovedWords)) {
      settings.formattingRemovedWords.forEach(word => {
        // Escape special regex characters and replace all exact occurrences
        const escapedWord = escapeRegExp(word);
        // Use global flag to replace all occurrences
        const regex = new RegExp(escapedWord, 'g');
        newText = newText.replace(regex, '');
      });
    }

    // Step 2: Process text inside brackets [...]
    // Remove leading/trailing commas and periods, convert to lowercase
    newText = newText.replace(/\[([^\]]+)\]/g, (match, content) => {
      // Remove leading/trailing commas and periods from content
      let cleaned = content.replace(/^[,.\s]+|[,.\s]+$/g, '');
      // Convert to lowercase
      cleaned = cleaned.toLowerCase();
      return '[' + cleaned + ']';
    });

    // Step 3: Ensure single space after punctuation
    if (settings.formatting.spaceAfterPunctuation) {
      // Remove any spaces after punctuation first, then add exactly one space
      // Match punctuation followed by any amount of spaces (or no space) before a non-space character
      newText = newText.replace(/([.!?,;:])(\s*)(?=\S)/g, '$1 ');
    }

    // Step 4: Remove double spaces
    if (settings.formatting.removeDoubleSpaces) {
      newText = newText.replace(/ +/g, ' ');
    }

    // Step 5: Auto-capitalize sentences
    if (settings.formatting.autoCapitalize) {
      // Capitalize start of sentences
      newText = newText.replace(/(?:^|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());
    }

    // Smart quotes (optional, can be placed anywhere)
    if (settings.formatting.smartQuotes) {
      newText = newText.replace(/"/g, '\u201C').replace(/'/g, '\u2019'); // simplified
    }

    // Final cleanup: trim whitespace
    newText = newText.trim();

    // Apply changes
    if (newText !== text) {
      if (activeElement.value !== undefined) {
        activeElement.value = newText;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        activeElement.innerText = newText;
      }
    }
  }

})();