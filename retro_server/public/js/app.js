
    // Detectar URL del servidor automáticamente (producción vs desarrollo)
    const SERVER_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000' 
      : window.location.origin;
    
    let DEFAULT_OWNER_TOKEN = null; // Se cargará dinámicamente desde el servidor
    const OWNER_TOKEN_KEY = 'retro_owner_token'; // sigue permitiendo lectura local para fallback privado
    const STORAGE_KEY = 'retro_inbox';
    const PROFILE_KEY = 'retro_profile';

    // util
    function qsel(s) { return document.querySelector(s) }
    function qselAll(s) { return Array.from(document.querySelectorAll(s)); }
    function getUrlParam(name) { const u = new URL(location.href); return u.searchParams.get(name); }

    // Mobile tabs utility
    function initMobileTabs(tabsData) {
      // Check if mobile - TEMPORARILY DISABLED FOR TESTING
      console.log('🔍 Checking mobile tabs. Window width:', window.innerWidth);
      
      // TEMPORARIO: Activar tabs en todas las pantallas para testing
      // if (window.innerWidth > 768) {
      //   console.log('❌ Desktop mode - tabs disabled');
      //   return;
      // }

      console.log('✅ Mobile mode - initializing tabs');
      
      const container = qsel('.max-w-6xl');
      const desktopGrid = qsel('.desktop-grid');
      
      if (!container || !desktopGrid) {
        console.error('❌ Container or desktop grid not found');
        return;
      }

      // Add class to hide desktop grid on mobile
      desktopGrid.classList.add('use-mobile-tabs');
      console.log('✅ Desktop grid hidden, tabs should be visible');

      // Create tabs container
      const tabsContainer = document.createElement('div');
      tabsContainer.className = 'mobile-tabs';
      
      // Create tabs header
      const tabsHeader = document.createElement('div');
      tabsHeader.className = 'mobile-tabs-header';
      
      tabsData.forEach((tab, index) => {
        const button = document.createElement('button');
        button.className = 'mobile-tab-button' + (index === 0 ? ' active' : '');
        button.textContent = tab.label;
        button.dataset.tabId = tab.id;
        button.addEventListener('click', () => switchMobileTab(tab.id));
        tabsHeader.appendChild(button);
      });
      
      tabsContainer.appendChild(tabsHeader);
      
      // Create tabs content
      tabsData.forEach((tab, index) => {
        const content = document.createElement('div');
        content.className = 'mobile-tab-content' + (index === 0 ? ' active' : '');
        content.id = 'mobile-tab-' + tab.id;
        content.innerHTML = tab.content;
        tabsContainer.appendChild(content);
      });
      
      // Insert tabs before desktop grid
      container.insertBefore(tabsContainer, desktopGrid);
      
      // Execute any initialization callbacks
      tabsData.forEach(tab => {
        if (tab.onInit) {
          tab.onInit();
        }
      });
    }

    function switchMobileTab(tabId) {
      // Update buttons
      qselAll('.mobile-tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tabId === tabId);
      });
      
      // Update content
      qselAll('.mobile-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'mobile-tab-' + tabId);
      });
    }

    // Retro Modal/Alert System
    function showRetroAlert(message, type = 'info') {
      const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      };

      const titles = {
        info: 'Información',
        success: 'Éxito',
        warning: 'Advertencia',
        error: 'Error'
      };

      const overlay = document.createElement('div');
      overlay.className = 'retro-modal-overlay';
      overlay.innerHTML = `
      <div class="retro-modal">
        <div class="retro-modal-title">
          <div class="title-dot"></div>
          <span>${titles[type]}</span>
        </div>
        <div class="retro-modal-body">
          <div class="retro-modal-icon">${icons[type]}</div>
          <div class="retro-modal-text">${message}</div>
        </div>
        <div class="retro-modal-footer">
          <button class="btn-retro" id="modal-close-btn">Aceptar</button>
        </div>
      </div>
    `;

      document.body.appendChild(overlay);

      // Function to close modal with fadeOut animation
      const closeModal = () => {
        // Remove event listeners first to prevent double-triggering
        document.removeEventListener('keydown', handleEscape);
        overlay.removeEventListener('click', overlayClickHandler);
        
        // Add fadeOut class and remove after animation
        overlay.style.animation = 'fadeOut 0.3s ease forwards';
        overlay.style.pointerEvents = 'none'; // Prevent interactions during close
        
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.remove();
          }
        }, 300);
      };

      // Close button
      overlay.querySelector('#modal-close-btn').addEventListener('click', closeModal);

      // Close on overlay click
      const overlayClickHandler = (e) => {
        if (e.target === overlay) closeModal();
      };
      overlay.addEventListener('click', overlayClickHandler);

      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      document.addEventListener('keydown', handleEscape);
    }

    // token handling (no UI to change) - still stored locally for fallback if you set owner token beforehand in localStorage
    function getStoredOwnerToken() { return localStorage.getItem(OWNER_TOKEN_KEY) || DEFAULT_OWNER_TOKEN; }
    function setStoredOwnerTokenForSetupOnly(t) { localStorage.setItem(OWNER_TOKEN_KEY, t); }

    // storage helpers (local fallback)
    function loadInboxLocal() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; } }
    function saveInboxLocal(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
    function pushItemLocal(item) { const arr = loadInboxLocal(); arr.push(item); saveInboxLocal(arr); }

    // profile helpers
    function loadProfileLocal() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch (e) { return null; } }
    function saveProfileLocal(p) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }

    // id
    function newid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

    // owner check
    function isOwner() { 
      const token = getUrlParam('owner');
      const isValid = token && DEFAULT_OWNER_TOKEN && token === DEFAULT_OWNER_TOKEN;
      
      // Guardar token en localStorage si es válido
      if (isValid && token) {
        localStorage.setItem(OWNER_TOKEN_KEY, token);
      }
      
      return isValid;
    }

    // ========== RENDER ==========
    function render() { const root = qsel('#view-root'); root.innerHTML = ''; if (isOwner()) renderOwnerView(root); else renderAnonView(root); }

    /* ------------------ Anonymous view ------------------ */
    function renderAnonView(root) {
      root.innerHTML = `
      <h2 class="font-bold" style="font-size:16px; margin-bottom:12px; color: var(--jp-soft-purple);">Enviar mensaje anónimo</h2>
      <p style="font-size:10px; margin-bottom:12px; color: #ff3333; opacity: 0.9; animation: flicker 7s infinite; letter-spacing: 1px; text-shadow: 0 0 10px var(--horror-glow);">⚠ WARNING: TRANSMISSION MAY BE INTERCEPTED ⚠ SENDER IDENTITY: UNKNOWN ⚠</p>
      <input id="nickInput" type="text" maxlength="20"
         placeholder="> who.are.you?" 
         class="w-full" style="margin-bottom:12px;" />
      <div class="mt-3">
        <textarea id="anon-text" rows="4" class="w-full" placeholder="> they.can.hear.you... type.carefully..."></textarea>
      </div>
      <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <h4 class="font-semibold" style="font-size:11px; margin-bottom:8px; color: #ff0000; letter-spacing: 2px; text-shadow: 0 0 10px var(--horror-glow);">DRAW_ATTACHMENT</h4>
          <canvas id="draw-canvas" width="400" height="200" class="w-full" style="max-width: 100%; height: auto; background: var(--horror-black);"></canvas>
          <div class="mt-2 space-y-2">
            <div class="flex gap-2 items-center flex-wrap" style="font-size:12px;">
              <label class="flex items-center gap-1">
                <span style="font-size:10px; color: #f0f0f0;">COLOR:</span>
                <input id="brush-color" type="color" value="#ff0000" class="cursor-pointer" />
              </label>
              <label class="flex items-center gap-1">
                <span style="font-size:10px; color: #f0f0f0;">SIZE:</span>
                <input id="brush-size" type="range" min="1" max="20" value="3" class="w-20" />
                <span id="brush-size-value" class="w-4" style="color: #f0f0f0;">3</span>
              </label>
              <button id="undo-stroke" class="btn-retro">UNDO</button>
              <button id="clear-canvas" class="btn-retro">CLEAR</button>
            </div>
            <div class="flex gap-2">
              <button id="save-drawing" class="btn-retro">ATTACH</button>
              <button id="fullscreen-canvas" class="btn-retro">⛶ FULLSCREEN</button>
            </div>
          </div>
          <p id="drawing-hint" style="font-size:9px; margin-top:6px; opacity:0.6; color: #ff3333; text-shadow: 0 0 5px var(--horror-glow);">[ DRAW WITH MOUSE/TOUCH ]</p>
        </div>
        <div>
          <h4 class="font-semibold" style="font-size:11px; margin-bottom:8px; color: #ff0000; letter-spacing: 2px; text-shadow: 0 0 10px var(--horror-glow);">TRANSMISSION</h4>
          <div id="attachment-list" class="p-3 message-box min-h-[120px]" style="font-size:10px;"></div>
          <div class="mt-3">
            <button id="send-msg" class="btn-retro">SEND</button>
          </div>
        </div>
      </div>
      <div class="divider-retro mt-4"></div>
    `;

      // Setup mobile tabs for anonymous view
      // TEMPORARIO: Activado para todas las pantallas (testing)
      // if (window.innerWidth <= 768) {
        setupAnonMobileTabs();
      // } else {
      //   // Initialize form normally for desktop
      //   initAnonFormListeners();
      // }
    }

    function initAnonFormListeners() {
      // drawing logic with undo, color picker, and brush size
      const canvas = qsel('#draw-canvas');
      const ctx = canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true  // Better performance on mobile
      });
      let drawing = false;
      let strokes = []; // Array to store each stroke for undo functionality
      let currentStroke = [];
      let lastDrawTime = 0;
      const drawThrottle = 16; // ~60fps throttling for mobile performance

      // Initial brush settings
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ff0000';

      // Clear canvas with black background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches && e.touches[0];
        const clientX = touch ? touch.clientX : e.clientX;
        const clientY = touch ? touch.clientY : e.clientY;

        // Calculate scale factor between canvas resolution and display size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      }

      function startDrawing(e) {
        drawing = true;
        currentStroke = [];
        const p = getPos(e);
        currentStroke.push({
          x: p.x,
          y: p.y,
          color: ctx.strokeStyle,
          lineWidth: ctx.lineWidth,
          isStart: true
        });
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      }

      function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        
        // Throttle drawing for better mobile performance
        const now = Date.now();
        if (now - lastDrawTime < drawThrottle) return;
        lastDrawTime = now;
        
        const p = getPos(e);
        currentStroke.push({
          x: p.x,
          y: p.y,
          color: ctx.strokeStyle,
          lineWidth: ctx.lineWidth
        });
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      function stopDrawing() {
        if (drawing) {
          drawing = false;
          ctx.closePath();
          if (currentStroke.length > 0) {
            strokes.push([...currentStroke]);
            currentStroke = [];
          }
        }
      }

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      canvas.addEventListener('touchend', stopDrawing);

      // Brush color change
      qsel('#brush-color').addEventListener('input', (e) => {
        ctx.strokeStyle = e.target.value;
      });

      // Brush size change
      qsel('#brush-size').addEventListener('input', (e) => {
        ctx.lineWidth = e.target.value;
        qsel('#brush-size-value').textContent = e.target.value;
      });

      // Undo last stroke
      qsel('#undo-stroke').addEventListener('click', () => {
        if (strokes.length === 0) return;
        strokes.pop();
        redrawCanvas();
      });

      function redrawCanvas() {
        // Use requestAnimationFrame for smoother redraw
        requestAnimationFrame(() => {
          // Clear canvas
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Redraw all strokes
          strokes.forEach(stroke => {
            if (stroke.length === 0) return;
            ctx.strokeStyle = stroke[0].color;
            ctx.lineWidth = stroke[0].lineWidth;
            ctx.beginPath();
            stroke.forEach((point, idx) => {
              if (point.isStart || idx === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            ctx.stroke();
            ctx.closePath();
          });
        });
      }

      qsel('#clear-canvas').addEventListener('click', () => {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        strokes = [];
        currentStroke = [];
        qsel('#attachment-list').innerHTML = '';
        currentAttachment = null;
      });

      let currentAttachment = null; // dataURL or File object

      // Function to check if canvas is empty
      function isCanvasEmpty() {
        return strokes.length === 0;
      }

      qsel('#save-drawing').addEventListener('click', () => {
        // Check if canvas is empty
        if (isCanvasEmpty()) {
          showRetroAlert('⚠ CREATE_DRAWING_FIRST ⚠', 'warning');
          return;
        }

        const data = canvas.toDataURL('image/png');
        currentAttachment = data;
        qsel('#attachment-list').innerHTML = `<div style="font-size:12px; color: var(--jp-soft-purple); text-align:center; padding:20px;">✅ ¡Dibujo adjuntado! <br><button id="remove-att" class="mt-2 btn-retro">✕ Quitar</button></div>`;
        qsel('#remove-att').addEventListener('click', () => {
          currentAttachment = null;
          qsel('#attachment-list').innerHTML = '';
        });
      });

      // Fullscreen canvas mode
      qsel('#fullscreen-canvas').addEventListener('click', () => {
        // Prevent fullscreen on mobile devices
        if (window.innerWidth <= 768) {
          showRetroAlert('⚠ FULLSCREEN_NOT_AVAILABLE_ON_MOBILE ⚠', 'warning');
          return;
        }
        openFullscreenCanvas();
      });

      async function openFullscreenCanvas() {
        // Double check - prevent on mobile
        if (window.innerWidth <= 768) {
          return;
        }
        // Save current canvas state
        const savedData = canvas.toDataURL();

        // Save current brush color and size
        const currentColor = ctx.strokeStyle;
        const currentSize = ctx.lineWidth;

        // Create fullscreen overlay
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'fullscreen-canvas-mode';
        fullscreenDiv.innerHTML = `
        <div class="fullscreen-toolbar">
          <div class="tool-group">
            <span class="tool-label">TOOLS:</span>
            <button class="tool-btn active" id="fs-tool-pen" title="Pen">✏️</button>
            <button class="tool-btn" id="fs-tool-eraser" title="Eraser">🧹</button>
            <button class="tool-btn" id="fs-tool-line" title="Line">📏</button>
            <button class="tool-btn" id="fs-tool-rect" title="Rectangle">▢</button>
            <button class="tool-btn" id="fs-tool-circle" title="Circle">○</button>
            <button class="tool-btn" id="fs-tool-fill" title="Fill">🪣</button>
          </div>
          
          <div class="tool-group">
            <span class="tool-label">COLORS:</span>
            <div class="color-palette">
              <div class="color-swatch active" data-color="#ff0000" style="background: #ff0000;" title="Red"></div>
              <div class="color-swatch" data-color="#ffffff" style="background: #ffffff;" title="White"></div>
              <div class="color-swatch" data-color="#000000" style="background: #000000;" title="Black"></div>
              <div class="color-swatch" data-color="#00ff00" style="background: #00ff00;" title="Green"></div>
              <div class="color-swatch" data-color="#0000ff" style="background: #0000ff;" title="Blue"></div>
              <div class="color-swatch" data-color="#ffff00" style="background: #ffff00;" title="Yellow"></div>
              <div class="color-swatch" data-color="#ff00ff" style="background: #ff00ff;" title="Magenta"></div>
              <div class="color-swatch" data-color="#00ffff" style="background: #00ffff;" title="Cyan"></div>
            </div>
            <input type="color" id="fs-color-picker" value="#ff0000" title="Custom Color" style="width: 32px; height: 32px; cursor: pointer;">
          </div>
          
          <div class="tool-group mobile-hide">
            <span class="tool-label">SIZE:</span>
            <input type="range" id="fs-brush-size" min="1" max="50" value="3" style="width: 100px;">
            <span id="fs-size-value" style="color: var(--horror-text); min-width: 30px; font-size: 12px;">3px</span>
          </div>
          
          <div class="tool-group mobile-hide">
            <button class="btn-retro" id="fs-undo">↶ UNDO</button>
            <button class="btn-retro" id="fs-redo">↷ REDO</button>
            <button class="btn-retro" id="fs-clear">🗑 CLEAR</button>
          </div>
          
          <div class="tool-group mobile-hide" style="margin-left: auto;">
            <button class="btn-retro" id="fs-save">✓ APPLY</button>
            <button class="btn-retro" id="fs-cancel">✕ CANCEL</button>
          </div>
        </div>
        
        <div class="fullscreen-canvas-container">
          <!-- Floating controls for mobile -->
          <div class="floating-controls">
            <!-- Row 1: Brush size -->
            <div class="floating-controls-row">
              <input type="range" id="fs-brush-size-mobile" min="1" max="50" value="3" style="width: 120px;">
              <span id="fs-size-value-mobile" style="color: var(--horror-text); font-size: 12px; min-width: 35px;">3px</span>
            </div>
            <!-- Row 2: Action buttons -->
            <div class="floating-controls-row">
              <button class="tool-btn" id="fs-undo-mobile" title="Undo">↶</button>
              <button class="tool-btn" id="fs-redo-mobile" title="Redo">↷</button>
              <button class="tool-btn" id="fs-clear-mobile" title="Clear">🗑</button>
              <button class="btn-retro" id="fs-save-mobile" title="Apply">✓</button>
              <button class="btn-retro" id="fs-cancel-mobile" title="Cancel">✕</button>
            </div>
          </div>
          <canvas id="fs-canvas" style="background: var(--horror-black);"></canvas>
        </div>
      `;

        document.body.appendChild(fullscreenDiv);

        // Enter native fullscreen mode
        try {
          if (fullscreenDiv.requestFullscreen) {
            await fullscreenDiv.requestFullscreen();
          } else if (fullscreenDiv.webkitRequestFullscreen) {
            await fullscreenDiv.webkitRequestFullscreen();
          } else if (fullscreenDiv.mozRequestFullScreen) {
            await fullscreenDiv.mozRequestFullScreen();
          } else if (fullscreenDiv.msRequestFullscreen) {
            await fullscreenDiv.msRequestFullscreen();
          }
        } catch (err) {
          console.warn('Fullscreen not supported or denied', err);
        }

        // Prevent scrolling
        document.body.style.overflow = 'hidden';

        const fsCanvas = qsel('#fs-canvas');

        // Set canvas size to maximum available space
        const toolbar = qsel('.fullscreen-toolbar');
        const container = qsel('.fullscreen-canvas-container');

        // Wait a bit for fullscreen to activate, then set size
        setTimeout(() => {
          const toolbarHeight = toolbar.offsetHeight;
          const availableWidth = window.innerWidth - 40; // 20px padding on each side
          const availableHeight = window.innerHeight - toolbarHeight - 40;

          // Check if mobile - also check for touch support
          const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
          const toolbarWidth = isMobile ? 80 : 0;
          
          // Set canvas dimensions based on device
          if (isMobile) {
            // Mobile: Use ALL available space
            // Calculate available space first
            const availableContainerWidth = window.innerWidth - toolbarWidth - 20;
            const availableContainerHeight = window.innerHeight - 120; // Account for floating controls
            
            // Since we'll rotate 90°:
            // canvas.width will become visual HEIGHT (should use availableContainerHeight)
            // canvas.height will become visual WIDTH (should use availableContainerWidth)
            
            // Use ALL available space for maximum canvas size
            fsCanvas.width = availableContainerHeight;  // This becomes visual height after rotation
            fsCanvas.height = availableContainerWidth;  // This becomes visual width after rotation
            
            // Scale should be 1.0 since we're matching the available space
            const scale = 1.0;
            
            fsCanvas.style.transform = `rotate(90deg) scale(${scale})`;
            fsCanvas.style.transformOrigin = 'center center';
            fsCanvas.style.width = fsCanvas.width + 'px';
            fsCanvas.style.height = fsCanvas.height + 'px';
            
            // Adjust container to accommodate rotated canvas
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
          } else {
            // Desktop: Use large dimensions
            fsCanvas.width = Math.max(1600, availableWidth);
            fsCanvas.height = Math.max(900, availableHeight);
            fsCanvas.style.transform = 'none';
            fsCanvas.style.width = 'auto';
            fsCanvas.style.height = 'auto';
          }

          // Redraw with new size
          fsCtx.fillStyle = '#0a0a0a';
          fsCtx.fillRect(0, 0, fsCanvas.width, fsCanvas.height);

          // Reload saved image WITHOUT SCALING - draw at original size
          const img = new Image();
          img.onload = () => {
            // Draw at original canvas size (400x200) without scaling
            fsCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
            if (strokes.length > 0) {
              // Scale strokes to new canvas size
              const scaleX = fsCanvas.width / canvas.width;
              const scaleY = fsCanvas.height / canvas.height;

              fsStrokes = strokes.map(stroke => {
                if (Array.isArray(stroke)) {
                  // Scale pen/eraser strokes
                  return stroke.map(point => ({
                    ...point,
                    x: point.x * scaleX,
                    y: point.y * scaleY
                  }));
                } else if (stroke.tool === 'line' || stroke.tool === 'rect' || stroke.tool === 'circle') {
                  // Scale shape strokes
                  return {
                    ...stroke,
                    start: { x: stroke.start.x * scaleX, y: stroke.start.y * scaleY },
                    end: { x: stroke.end.x * scaleX, y: stroke.end.y * scaleY }
                  };
                } else {
                  return stroke;
                }
              });

              // Redraw with scaled strokes
              redrawFsCanvas();
            }
          };
          img.src = savedData;
        }, 100);

        const fsCtx = fsCanvas.getContext('2d', {
          alpha: false,
          desynchronized: true  // Better performance especially on mobile
        });
        let fsDrawing = false;
        let fsStrokes = [];
        let fsRedoStack = [];
        let fsCurrentStroke = [];
        let fsTool = 'pen';
        let fsStartPos = null;
        let fsTempCanvas = null;
        let savedColor = currentColor; // Save the color for when switching from eraser
        let fsLastDrawTime = 0;
        const fsDrawThrottle = 16; // ~60fps throttling
        
        // Save current tool and color state (for undo/redo restoration)
        let currentToolState = {
          tool: 'pen',
          color: currentColor,
          size: currentSize
        };

        // Initial settings - use current canvas settings
        fsCtx.lineWidth = currentSize;
        fsCtx.lineCap = 'round';
        fsCtx.strokeStyle = currentColor;

        // Update UI to match current settings
        qsel('#fs-brush-size').value = currentSize;
        qsel('#fs-size-value').textContent = currentSize + 'px';
        qsel('#fs-color-picker').value = currentColor;

        // Update mobile controls if they exist
        const mobileBrushSizeInit = qsel('#fs-brush-size-mobile');
        if (mobileBrushSizeInit) {
          mobileBrushSizeInit.value = currentSize;
          qsel('#fs-size-value-mobile').textContent = currentSize + 'px';
        }

        // Set active color swatch if it matches
        qselAll('.color-swatch').forEach(swatch => {
          if (swatch.dataset.color.toLowerCase() === currentColor.toLowerCase()) {
            swatch.classList.add('active');
          }
        });

        // Tool selection
        qselAll('.tool-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            qselAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const previousTool = fsTool;
            fsTool = btn.id.replace('fs-tool-', '');

            // Handle color when switching tools
            if (fsTool === 'eraser') {
              // Save current color before switching to eraser
              if (previousTool !== 'eraser') {
                savedColor = fsCtx.strokeStyle;
              }
            } else if (previousTool === 'eraser') {
              // Restore saved color when switching from eraser
              fsCtx.strokeStyle = savedColor;
              fsCtx.fillStyle = savedColor;
              qsel('#fs-color-picker').value = savedColor;

              // Update active color swatch
              qselAll('.color-swatch').forEach(swatch => {
                swatch.classList.remove('active');
                if (swatch.dataset.color.toLowerCase() === savedColor.toLowerCase()) {
                  swatch.classList.add('active');
                }
              });
            }
            
            // Update current tool state
            currentToolState.tool = fsTool;
            currentToolState.color = fsCtx.strokeStyle;
            currentToolState.size = fsCtx.lineWidth;
          });
        });

        // Color selection
        qselAll('.color-swatch').forEach(swatch => {
          swatch.addEventListener('click', () => {
            qselAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            const color = swatch.dataset.color;
            fsCtx.strokeStyle = color;
            fsCtx.fillStyle = color;
            qsel('#fs-color-picker').value = color;
            // Save color when not in eraser mode
            if (fsTool !== 'eraser') {
              savedColor = color;
            }
            // Update current tool state
            currentToolState.color = color;
          });
        });

        qsel('#fs-color-picker').addEventListener('input', (e) => {
          qselAll('.color-swatch').forEach(s => s.classList.remove('active'));
          fsCtx.strokeStyle = e.target.value;
          fsCtx.fillStyle = e.target.value;
          // Save color when not in eraser mode
          if (fsTool !== 'eraser') {
            savedColor = e.target.value;
          }
          // Update current tool state
          currentToolState.color = e.target.value;
        });

        // Brush size
        qsel('#fs-brush-size').addEventListener('input', (e) => {
          fsCtx.lineWidth = e.target.value;
          qsel('#fs-size-value').textContent = e.target.value + 'px';
          // Sync with mobile slider
          const mobileSlider = qsel('#fs-brush-size-mobile');
          if (mobileSlider) {
            mobileSlider.value = e.target.value;
            qsel('#fs-size-value-mobile').textContent = e.target.value + 'px';
          }
          // Update current tool state
          currentToolState.size = e.target.value;
        });

        // Mobile brush size (duplicate for floating controls)
        const mobileBrushSize = qsel('#fs-brush-size-mobile');
        if (mobileBrushSize) {
          mobileBrushSize.addEventListener('input', (e) => {
            fsCtx.lineWidth = e.target.value;
            qsel('#fs-size-value-mobile').textContent = e.target.value + 'px';
            // Sync with desktop slider
            qsel('#fs-brush-size').value = e.target.value;
            qsel('#fs-size-value').textContent = e.target.value + 'px';
            // Update current tool state
            currentToolState.size = e.target.value;
          });
        }

        // Drawing functions
        function getFsPos(e) {
          const rect = fsCanvas.getBoundingClientRect();
          const touch = e.touches && e.touches[0];
          const clientX = touch ? touch.clientX : e.clientX;
          const clientY = touch ? touch.clientY : e.clientY;
          
          // Get position relative to canvas
          let x = clientX - rect.left;
          let y = clientY - rect.top;
          
          // Check if canvas is rotated (mobile)
          const isMobile = window.innerWidth <= 768;
          if (isMobile) {
            // Canvas is rotated 90° clockwise
            // Transform coordinates: rotate -90° around center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Translate to origin
            x -= centerX;
            y -= centerY;
            
            // Rotate -90° (swap and negate)
            const rotatedX = y;
            const rotatedY = -x;
            
            // Translate back and scale to canvas coordinates
            const scaleX = fsCanvas.width / rect.height; // swapped
            const scaleY = fsCanvas.height / rect.width; // swapped
            
            return {
              x: (rotatedX + rect.height / 2) * scaleX,
              y: (rotatedY + rect.width / 2) * scaleY
            };
          } else {
            // Desktop: normal scaling
            const scaleX = fsCanvas.width / rect.width;
            const scaleY = fsCanvas.height / rect.height;
            return {
              x: x * scaleX,
              y: y * scaleY
            };
          }
        }

        function startFsDrawing(e) {
          fsDrawing = true;
          const pos = getFsPos(e);
          fsStartPos = pos;

          if (fsTool === 'pen' || fsTool === 'eraser') {
            fsCurrentStroke = [];
            fsCurrentStroke.push({
              x: pos.x,
              y: pos.y,
              color: fsTool === 'eraser' ? '#0a0a0a' : fsCtx.strokeStyle,
              lineWidth: fsCtx.lineWidth,
              isStart: true,
              tool: fsTool
            });
            fsCtx.beginPath();
            fsCtx.moveTo(pos.x, pos.y);
          } else if (fsTool === 'fill') {
            // Simple fill (just fill with current color)
            fsCtx.fillStyle = fsCtx.strokeStyle;
            fsCtx.fillRect(0, 0, fsCanvas.width, fsCanvas.height);
            fsStrokes.push({ tool: 'fill', color: fsCtx.strokeStyle });
            fsRedoStack = [];
            fsDrawing = false;
          } else {
            // For shapes, save current canvas state
            fsTempCanvas = fsCtx.getImageData(0, 0, fsCanvas.width, fsCanvas.height);
          }
        }

        function drawFs(e) {
          if (!fsDrawing) return;
          
          // Throttle drawing for better mobile performance
          const now = Date.now();
          if (now - fsLastDrawTime < fsDrawThrottle) return;
          fsLastDrawTime = now;
          
          const pos = getFsPos(e);

          if (fsTool === 'pen' || fsTool === 'eraser') {
            fsCurrentStroke.push({
              x: pos.x,
              y: pos.y,
              color: fsTool === 'eraser' ? '#0a0a0a' : fsCtx.strokeStyle,
              lineWidth: fsCtx.lineWidth,
              tool: fsTool
            });
            fsCtx.strokeStyle = fsTool === 'eraser' ? '#0a0a0a' : fsCurrentStroke[0].color;
            fsCtx.lineTo(pos.x, pos.y);
            fsCtx.stroke();
          } else if (fsTool === 'line' || fsTool === 'rect' || fsTool === 'circle') {
            // Restore canvas and draw preview
            if (fsTempCanvas) {
              fsCtx.putImageData(fsTempCanvas, 0, 0);
            }

            fsCtx.strokeStyle = fsCtx.strokeStyle; // Preserve color
            fsCtx.lineWidth = fsCtx.lineWidth; // Preserve line width
            fsCtx.beginPath();

            if (fsTool === 'line') {
              fsCtx.moveTo(fsStartPos.x, fsStartPos.y);
              fsCtx.lineTo(pos.x, pos.y);
              fsCtx.stroke();
            } else if (fsTool === 'rect') {
              fsCtx.strokeRect(fsStartPos.x, fsStartPos.y, pos.x - fsStartPos.x, pos.y - fsStartPos.y);
            } else if (fsTool === 'circle') {
              const radius = Math.sqrt(Math.pow(pos.x - fsStartPos.x, 2) + Math.pow(pos.y - fsStartPos.y, 2));
              fsCtx.arc(fsStartPos.x, fsStartPos.y, radius, 0, 2 * Math.PI);
              fsCtx.stroke();
            }
          }
        }

        function stopFsDrawing(e) {
          if (!fsDrawing) return;

          const pos = getFsPos(e || { clientX: fsStartPos?.x || 0, clientY: fsStartPos?.y || 0 });

          if (fsTool === 'pen' || fsTool === 'eraser') {
            if (fsCurrentStroke.length > 0) {
              fsStrokes.push([...fsCurrentStroke]);
              fsRedoStack = [];
            }
          } else if (fsTool === 'line' || fsTool === 'rect' || fsTool === 'circle') {
            // Save shape as stroke
            const shapeData = {
              tool: fsTool,
              start: { x: fsStartPos.x, y: fsStartPos.y },
              end: { x: pos.x, y: pos.y },
              color: fsCtx.strokeStyle,
              lineWidth: fsCtx.lineWidth
            };
            fsStrokes.push(shapeData);
            fsRedoStack = [];
          }

          fsDrawing = false;
          fsCtx.closePath();
          fsCurrentStroke = [];
          fsTempCanvas = null;
        }

        // Event listeners
        fsCanvas.addEventListener('mousedown', startFsDrawing);
        fsCanvas.addEventListener('mousemove', drawFs);
        fsCanvas.addEventListener('mouseup', (e) => stopFsDrawing(e));
        fsCanvas.addEventListener('mouseleave', (e) => stopFsDrawing(e));
        fsCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startFsDrawing(e); }, { passive: false });
        fsCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); drawFs(e); }, { passive: false });
        fsCanvas.addEventListener('touchend', (e) => { e.preventDefault(); stopFsDrawing(e); }, { passive: false });

        // Undo/Redo
        qsel('#fs-undo').addEventListener('click', () => {
          if (fsStrokes.length === 0) return;
          fsRedoStack.push(fsStrokes.pop());
          redrawFsCanvas();
          // Restore current tool state after redraw
          restoreToolState();
        });

        qsel('#fs-redo').addEventListener('click', () => {
          if (fsRedoStack.length === 0) return;
          fsStrokes.push(fsRedoStack.pop());
          redrawFsCanvas();
          // Restore current tool state after redraw
          restoreToolState();
        });

        // Mobile undo/redo (duplicate for floating controls)
        const mobileUndo = qsel('#fs-undo-mobile');
        if (mobileUndo) {
          mobileUndo.addEventListener('click', () => {
            if (fsStrokes.length === 0) return;
            fsRedoStack.push(fsStrokes.pop());
            redrawFsCanvas();
            // Restore current tool state after redraw
            restoreToolState();
          });
        }

        const mobileRedo = qsel('#fs-redo-mobile');
        if (mobileRedo) {
          mobileRedo.addEventListener('click', () => {
            if (fsRedoStack.length === 0) return;
            fsStrokes.push(fsRedoStack.pop());
            redrawFsCanvas();
            // Restore current tool state after redraw
            restoreToolState();
          });
        }

        // Function to restore tool state after undo/redo
        function restoreToolState() {
          fsCtx.strokeStyle = currentToolState.color;
          fsCtx.fillStyle = currentToolState.color;
          fsCtx.lineWidth = currentToolState.size;
          
          // Update UI controls
          qsel('#fs-color-picker').value = currentToolState.color;
          qsel('#fs-brush-size').value = currentToolState.size;
          qsel('#fs-size-value').textContent = currentToolState.size + 'px';
          
          const mobileBrushSizeRestore = qsel('#fs-brush-size-mobile');
          if (mobileBrushSizeRestore) {
            mobileBrushSizeRestore.value = currentToolState.size;
            qsel('#fs-size-value-mobile').textContent = currentToolState.size + 'px';
          }
          
          // Restore active color swatch
          qselAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('active');
            if (swatch.dataset.color.toLowerCase() === currentToolState.color.toLowerCase()) {
              swatch.classList.add('active');
            }
          });
          
          // Restore active tool button
          qselAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === 'fs-tool-' + currentToolState.tool) {
              btn.classList.add('active');
            }
          });
          
          fsTool = currentToolState.tool;
        }

        function redrawFsCanvas() {
          fsCtx.fillStyle = '#0a0a0a';
          fsCtx.fillRect(0, 0, fsCanvas.width, fsCanvas.height);

          fsStrokes.forEach(stroke => {
            if (Array.isArray(stroke)) {
              // Regular pen/eraser stroke
              if (stroke.length === 0) return;
              fsCtx.strokeStyle = stroke[0].color;
              fsCtx.lineWidth = stroke[0].lineWidth;
              fsCtx.beginPath();
              stroke.forEach((point, idx) => {
                if (point.isStart || idx === 0) {
                  fsCtx.moveTo(point.x, point.y);
                } else {
                  fsCtx.lineTo(point.x, point.y);
                }
              });
              fsCtx.stroke();
              fsCtx.closePath();
            } else if (stroke.tool === 'fill') {
              fsCtx.fillStyle = stroke.color;
              fsCtx.fillRect(0, 0, fsCanvas.width, fsCanvas.height);
            } else if (stroke.tool === 'line') {
              fsCtx.strokeStyle = stroke.color;
              fsCtx.lineWidth = stroke.lineWidth;
              fsCtx.beginPath();
              fsCtx.moveTo(stroke.start.x, stroke.start.y);
              fsCtx.lineTo(stroke.end.x, stroke.end.y);
              fsCtx.stroke();
              fsCtx.closePath();
            } else if (stroke.tool === 'rect') {
              fsCtx.strokeStyle = stroke.color;
              fsCtx.lineWidth = stroke.lineWidth;
              fsCtx.beginPath();
              fsCtx.strokeRect(stroke.start.x, stroke.start.y, stroke.end.x - stroke.start.x, stroke.end.y - stroke.start.y);
              fsCtx.closePath();
            } else if (stroke.tool === 'circle') {
              fsCtx.strokeStyle = stroke.color;
              fsCtx.lineWidth = stroke.lineWidth;
              fsCtx.beginPath();
              const radius = Math.sqrt(Math.pow(stroke.end.x - stroke.start.x, 2) + Math.pow(stroke.end.y - stroke.start.y, 2));
              fsCtx.arc(stroke.start.x, stroke.start.y, radius, 0, 2 * Math.PI);
              fsCtx.stroke();
              fsCtx.closePath();
            }
          });
        }

        // Clear
        qsel('#fs-clear').addEventListener('click', () => {
          fsCtx.fillStyle = '#0a0a0a';
          fsCtx.fillRect(0, 0, fsCanvas.width, fsCanvas.height);
          fsStrokes = [];
          fsRedoStack = [];
        });

        // Mobile clear (duplicate for floating controls)
        const mobileClear = qsel('#fs-clear-mobile');
        if (mobileClear) {
          mobileClear.addEventListener('click', () => {
            fsCtx.fillStyle = '#0a0a0a';
            fsCtx.fillRect(0, 0, fsCanvas.width, fsCanvas.height);
            fsStrokes = [];
            fsRedoStack = [];
          });
        }

        // Exit fullscreen function
        async function exitFullscreenMode() {
          // Restore scrolling
          document.body.style.overflow = '';

          // Exit fullscreen
          try {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
              await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
              await document.msExitFullscreen();
            }
          } catch (err) {
            console.warn('Error exiting fullscreen', err);
          }

          fullscreenDiv.style.animation = 'fadeOut 0.3s ease';
          setTimeout(() => fullscreenDiv.remove(), 300);
        }

        // Save and apply
        qsel('#fs-save').addEventListener('click', async () => {
          // Transfer fullscreen canvas to main canvas
          const fsData = fsCanvas.toDataURL();
          const imgTemp = new Image();
          imgTemp.onload = () => {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Draw the fullscreen canvas scaled down to fit the original canvas
            ctx.drawImage(imgTemp, 0, 0, canvas.width, canvas.height);

            // Scale strokes back to original canvas size
            const scaleX = canvas.width / fsCanvas.width;
            const scaleY = canvas.height / fsCanvas.height;

            strokes = fsStrokes.map(stroke => {
              if (Array.isArray(stroke)) {
                // Scale pen/eraser strokes
                return stroke.map(point => ({
                  ...point,
                  x: point.x * scaleX,
                  y: point.y * scaleY
                }));
              } else if (stroke.tool === 'line' || stroke.tool === 'rect' || stroke.tool === 'circle') {
                // Scale shape strokes
                return {
                  ...stroke,
                  start: { x: stroke.start.x * scaleX, y: stroke.start.y * scaleY },
                  end: { x: stroke.end.x * scaleX, y: stroke.end.y * scaleY }
                };
              } else {
                return stroke;
              }
            });

            // Update main canvas color and size to match fullscreen
            ctx.strokeStyle = fsCtx.strokeStyle;
            ctx.lineWidth = fsCtx.lineWidth;
          };
          imgTemp.src = fsData;

          await exitFullscreenMode();
        });

        // Cancel
        qsel('#fs-cancel').addEventListener('click', async () => {
          await exitFullscreenMode();
        });

        // Mobile save/cancel (duplicate for floating controls)
        const mobileSave = qsel('#fs-save-mobile');
        if (mobileSave) {
          mobileSave.addEventListener('click', async () => {
            // Transfer fullscreen canvas to main canvas
            const fsData = fsCanvas.toDataURL();
            const imgTemp = new Image();
            imgTemp.onload = () => {
              ctx.fillStyle = '#0a0a0a';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(imgTemp, 0, 0, canvas.width, canvas.height);

              const scaleX = canvas.width / fsCanvas.width;
              const scaleY = canvas.height / fsCanvas.height;

              strokes = fsStrokes.map(stroke => {
                if (Array.isArray(stroke)) {
                  return stroke.map(point => ({
                    ...point,
                    x: point.x * scaleX,
                    y: point.y * scaleY
                  }));
                } else if (stroke.tool === 'line' || stroke.tool === 'rect' || stroke.tool === 'circle') {
                  return {
                    ...stroke,
                    start: { x: stroke.start.x * scaleX, y: stroke.start.y * scaleY },
                    end: { x: stroke.end.x * scaleX, y: stroke.end.y * scaleY }
                  };
                } else {
                  return stroke;
                }
              });

              ctx.strokeStyle = fsCtx.strokeStyle;
              ctx.lineWidth = fsCtx.lineWidth;
            };
            imgTemp.src = fsData;

            await exitFullscreenMode();
          });
        }

        const mobileCancel = qsel('#fs-cancel-mobile');
        if (mobileCancel) {
          mobileCancel.addEventListener('click', async () => {
            await exitFullscreenMode();
          });
        }

        // Handle fullscreen change (when user presses ESC or exits manually)
        const handleFullscreenChange = async () => {
          if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            // User exited fullscreen, close the editor
            document.body.style.overflow = '';
            fullscreenDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => fullscreenDiv.remove(), 300);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
          }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        // Handle window resize in fullscreen
        const handleResize = () => {
          if (document.fullscreenElement || document.webkitFullscreenElement ||
            document.mozFullScreenElement || document.msFullscreenElement) {
            const toolbar = qsel('.fullscreen-toolbar');
            if (toolbar && fsCanvas) {
              const isMobile = window.innerWidth <= 768;
              const toolbarHeight = isMobile ? 0 : toolbar.offsetHeight;
              const toolbarWidth = isMobile ? 80 : 0;
              const availableWidth = window.innerWidth - 40 - toolbarWidth;
              const availableHeight = window.innerHeight - toolbarHeight - 40;

              const oldWidth = fsCanvas.width;
              const oldHeight = fsCanvas.height;

              // Save current canvas
              const tempData = fsCtx.getImageData(0, 0, oldWidth, oldHeight);

              // Set dimensions based on device
              if (isMobile) {
                const availableContainerWidth = window.innerWidth - toolbarWidth - 20;
                const availableContainerHeight = window.innerHeight - 120;
                
                // Use ALL available space
                fsCanvas.width = availableContainerHeight;
                fsCanvas.height = availableContainerWidth;
                
                const scale = 1.0;
                
                fsCanvas.style.transform = `rotate(90deg) scale(${scale})`;
                fsCanvas.style.transformOrigin = 'center center';
                fsCanvas.style.width = fsCanvas.width + 'px';
                fsCanvas.style.height = fsCanvas.height + 'px';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
              } else {
                fsCanvas.width = Math.max(1600, availableWidth);
                fsCanvas.height = Math.max(900, availableHeight);
                fsCanvas.style.transform = 'none';
                fsCanvas.style.width = 'auto';
                fsCanvas.style.height = 'auto';
              }

              // Restore canvas
              fsCtx.fillStyle = '#0a0a0a';
              fsCtx.fillRect(0, 0, fsCanvas.width, fsCanvas.height);
              fsCtx.putImageData(tempData, 0, 0);
            }
          }
        };

        window.addEventListener('resize', handleResize);

        // Clean up resize listener when closing
        fullscreenDiv.addEventListener('remove', () => {
          window.removeEventListener('resize', handleResize);
        });
      }

      qsel('#send-msg').addEventListener('click', async () => {
        const text = qsel('#anon-text').value.trim();
        const nick = qsel('#nickInput').value.trim() || 'Anónimo';
        if (!text && !currentAttachment) {
          showRetroAlert('⚠ TRANSMISSION_EMPTY // ADD_MESSAGE_OR_DRAWING ⚠', 'warning');
          return;
        }

        const formData = new FormData();
        formData.append('text', `[${nick}]: ${text}`);

        if (currentAttachment && currentAttachment.startsWith('data:')) {
          const blob = dataURLtoBlob(currentAttachment);
          formData.append('drawing', blob, `${Date.now()}.png`);
        }

        try {
          const res = await fetch(SERVER_URL + '/api/messages', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Falló el envío');
          showRetroAlert('✓ TRANSMISSION_SENT // SIGNAL_RECEIVED ✓', 'success');
        } catch (err) {
          console.error(err);
          showRetroAlert('✗ TRANSMISSION_FAILED // RETRY_CONNECTION ✗', 'error');
        }

        qsel('#anon-text').value = '';
        qsel('#attachment-list').innerHTML = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentAttachment = null;
      });
    }

    function setupAnonMobileTabs() {
      // Get profile HTML from sidebar
      const sidebar = qsel('aside.retro-panel');
      const profileHtml = sidebar ? sidebar.innerHTML : '';
      
      // Get message form HTML from main
      const mainContent = qsel('#view-root');
      const messageFormHtml = mainContent ? mainContent.innerHTML : '';
      
      const tabsData = [
        {
          id: 'profile',
          label: '👤 PERFIL',
          content: profileHtml
        },
        {
          id: 'message',
          label: '✉️ MENSAJE',
          content: messageFormHtml,
          onInit: () => {
            // Re-initialize all event listeners for the message form
            setTimeout(() => initAnonFormListeners(), 100);
          }
        }
      ];
      
      initMobileTabs(tabsData);
    }

    function setupOwnerMobileTabs() {
      // Get profile HTML from sidebar
      const sidebar = qsel('aside.retro-panel');
      const profileHtml = sidebar ? sidebar.innerHTML : '';
      
      // Get edit profile HTML
      const editProfilePanel = qsel('.mt-4.retro-panel');
      const editProfileHtml = editProfilePanel ? editProfilePanel.innerHTML : '';
      
      // Get inbox HTML
      const inboxList = qsel('#inbox-list');
      const refreshBtn = qsel('#refresh-inbox');
      const downloadBtn = qsel('#download-all');
      
      const inboxHtml = `
        <div class="flex flex-wrap gap-2 mb-3">
          <button id="refresh-inbox-mobile" class="btn-retro">⟳ REFRESH</button>
          <button id="download-all-mobile" class="btn-retro">💾 SAVE_ALL</button>
        </div>
        <div id="inbox-list-mobile" class="space-y-3 max-h-[70vh] overflow-auto" style="padding: 8px;"></div>
      `;
      
      const tabsData = [
        {
          id: 'profile',
          label: '👤 PERFIL',
          content: profileHtml
        },
        {
          id: 'edit',
          label: '✏️ EDITAR',
          content: `<h3 class="font-semibold" style="font-size:14px; margin-bottom:12px; color: var(--horror-red); letter-spacing: 2px; text-shadow: 0 0 10px var(--horror-glow);">PUBLIC_PROFILE_DATA</h3>${editProfileHtml}`,
          onInit: () => {
            setTimeout(() => initOwnerProfileListeners(), 100);
          }
        },
        {
          id: 'inbox',
          label: '📬 INBOX',
          content: inboxHtml,
          onInit: () => {
            setTimeout(() => {
              // Re-attach inbox event listeners
              const refreshMobile = qsel('#refresh-inbox-mobile');
              const downloadMobile = qsel('#download-all-mobile');
              
              if (refreshMobile) {
                refreshMobile.addEventListener('click', renderInboxItemsMobile);
              }
              if (downloadMobile) {
                downloadMobile.addEventListener('click', downloadAllDrawings);
              }
              
              // Render inbox items in mobile tab
              renderInboxItemsMobile();
            }, 100);
          }
        }
      ];
      
      initMobileTabs(tabsData);
    }

    /* ------------------ Owner view ------------------ */
    function renderOwnerView(root) {
      root.innerHTML = `
      <div class="flex justify-between items-start gap-4">
        <div>
          <h2 class="font-bold" style="font-size:16px; margin-bottom:12px; color: var(--horror-red); letter-spacing: 2px; text-shadow: 0 0 10px var(--horror-glow);">ADMIN_CONTROL_PANEL</h2>
          <p style="font-size:12px; color: var(--horror-text); animation: flicker 8s infinite;">[ MONITORING INCOMING TRANSMISSIONS... ]</p>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button id="refresh-inbox" class="btn-retro">⟳ REFRESH</button>
        <button id="download-all" class="btn-retro">💾 SAVE_ALL</button>
      </div>

      <div class="mt-4 retro-panel p-4">
        <h3 class="font-semibold" style="font-size:14px; margin-bottom:12px; color: var(--horror-red); letter-spacing: 2px; text-shadow: 0 0 10px var(--horror-glow);">PUBLIC_PROFILE_DATA</h3>
        <div class="flex flex-col sm:flex-row gap-3 items-center sm:items-start mt-2">
          <img id="owner-avatar" src="" alt="avatar" class="avatar" />
          <div class="flex-1 w-full">
            <input type="text" id="owner-name" class="w-full" placeholder="> name" style="margin-bottom:10px;" />
            <input type="text" id="owner-web" class="w-full" placeholder="> location" style="margin-bottom:10px;" />
            <textarea id="owner-bio" class="w-full" rows="2" placeholder="> status" style="margin-bottom:10px;"></textarea>
            <div class="mt-2 space-y-2">
              <div class="flex flex-col sm:flex-row gap-2">
                <input id="owner-avatar-file" type="file" accept="image/*" class="hidden" />
                <label for="owner-avatar-file" class="btn-retro cursor-pointer text-center w-full sm:w-auto inline-block">
                  CHANGE_AVATAR
                </label>
                <button id="save-profile" class="btn-retro w-full sm:w-auto">SAVE_PROFILE</button>
              </div>
              <div id="avatar-filename" style="font-size:9px; opacity:0.6; font-style:italic; color: var(--horror-text);"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="inbox-list" class="mt-4 space-y-3 max-h-[420px] overflow-auto" style="padding: 8px;"></div>
    `;

      qsel('#refresh-inbox').addEventListener('click', renderInboxItems);
      qsel('#download-all').addEventListener('click', downloadAllDrawings);

      initOwnerProfileListeners();

      // Start polling for new messages
      startPolling(renderInboxItems);
      renderInboxItems();
      
      // Setup mobile tabs for owner view
      // TEMPORARIO: Activado para todas las pantallas (testing)
      // if (window.innerWidth <= 768) {
        setupOwnerMobileTabs();
      // }
    }

    function initOwnerProfileListeners() {
      // profile wiring - load from server
      const ownerAvatarEl = qsel('#owner-avatar');
      
      if (!ownerAvatarEl) return; // Safety check

      // Load profile from server
      if (SERVER_URL) {
        fetch(SERVER_URL + '/api/profile')
          .then(r => r.json())
          .then(profile => {
            if (profile) {
              qsel('#owner-name').value = profile.name || '';
              qsel('#owner-web').value = profile.web || '';
              qsel('#owner-bio').value = profile.bio || '';
              ownerAvatarEl.src = profile.avatar || qsel('#profile-avatar').src;
            }
          })
          .catch(err => console.warn('Could not load profile from server', err));
      } else {
        const profile = loadProfileLocal() || { name: 'Owner', web: '', bio: '', avatar: '' };
        qsel('#owner-name').value = profile.name || '';
        qsel('#owner-web').value = profile.web || '';
        qsel('#owner-bio').value = profile.bio || '';
        ownerAvatarEl.src = profile.avatar || qsel('#profile-avatar').src;
      }

      qsel('#owner-avatar-file').addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) return;

        // Update filename display
        const filenameDisplay = qsel('#avatar-filename');
        filenameDisplay.textContent = `Archivo seleccionado: ${f.name}`;

        // Load and display image
        const reader = new FileReader();
        reader.onload = () => { ownerAvatarEl.src = reader.result; };
        reader.readAsDataURL(f);
      });
      qsel('#save-profile').addEventListener('click', async () => {
        const profile = { 
          name: qsel('#owner-name').value, 
          web: qsel('#owner-web').value, 
          bio: qsel('#owner-bio').value, 
          avatar: ownerAvatarEl.src 
        };
        
        if (SERVER_URL) {
          try {
            const response = await fetch(SERVER_URL + '/api/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-owner-token': getStoredOwnerToken()
              },
              body: JSON.stringify(profile)
            });
            
            if (!response.ok) {
              throw new Error('Failed to save profile');
            }
            
            showRetroAlert('✓ PROFILE_DATA_SAVED ✓', 'success');
          }
          catch (error) { 
            console.error('Error saving profile to server:', error);
            showRetroAlert('✗ SAVE_ERROR // CONNECTION_LOST ✗', 'error'); 
            saveProfileLocal(profile); 
          }
        } else { 
          saveProfileLocal(profile); 
          showRetroAlert('✓ PROFILE_DATA_SAVED ✓', 'success'); 
        }
        
        // Update sidebar to reflect changes
        qsel('#profile-name').textContent = profile.name; 
        qsel('#profile-bio').textContent = profile.bio;
        
        const webLink = qsel('#profile-web');
        webLink.textContent = profile.web || 'mipagina.oldschool';
        webLink.href = profile.web || '#';
        if (profile.web && !profile.web.startsWith('http')) {
          webLink.href = 'https://' + profile.web;
        }
        
        qsel('#profile-avatar').src = profile.avatar;
      });
    }

    // Render inbox items (from server or local storage)
    async function renderInboxItems() {
      const list = qsel('#inbox-list');
      const scrollTop = list.scrollTop; // Preserve scroll position
      
      let messages = [];
      if (SERVER_URL) {
        try { 
          const response = await fetch(SERVER_URL + '/api/messages', { 
            headers: { 'x-owner-token': getStoredOwnerToken() } 
          }); 
          if (response.ok) { 
            messages = await response.json(); 
          } else { 
            throw new Error('Failed to fetch messages'); 
          } 
        } catch (error) { 
          console.warn('Error fetching from server, fallback to local', error); 
          messages = loadInboxLocal(); 
        }
      } else {
        messages = loadInboxLocal();
      }
      
      // Sort by timestamp descending (newest first)
      messages = messages.sort((a, b) => b.ts - a.ts);
      
      if (messages.length === 0) {
        list.innerHTML = '<div class="p-4 message-box" style="font-size:13px; text-align:center; color: var(--horror-text);">⚠ NO TRANSMISSIONS DETECTED ⚠</div>';
        return;
      }
      
      list.innerHTML = '';
      
      for (const message of messages) {
        const messageElement = document.createElement('div');
        messageElement.className = 'p-4 message-box flex gap-3 items-start';
        messageElement.style.cssText = 'background: var(--horror-gray); border: 1px solid var(--horror-blood); position: relative;';
        
        const drawingUrl = message.drawingUrl || message.drawing;
        const fullDrawingUrl = drawingUrl && SERVER_URL && !drawingUrl.startsWith('data:') 
          ? SERVER_URL + drawingUrl 
          : drawingUrl;
        
        messageElement.innerHTML = `
        <div class="w-2/3" style="font-size:12px; padding-left: 8px;">
          <div class="font-semibold" style="margin-bottom:6px; color: var(--horror-red); letter-spacing: 1px; text-shadow: 0 0 10px var(--horror-glow);">⚠ TRANSMISSION_${message.id.toUpperCase().slice(0, 6)} · ${new Date(message.ts).toLocaleString()}</div>
          <div class="mt-1 break-words" style="color: var(--horror-text); line-height: 1.6; padding-left: 4px;">${message.text ? escapeHtml(message.text) : '<i style="opacity:0.6; color: var(--horror-blood);">[NO_TEXT_DATA]</i>'}</div>
        </div>
        <div class="w-1/3 flex flex-col items-end gap-2">
          ${fullDrawingUrl ? `<div class="flex justify-end"><img src="${fullDrawingUrl}" style="max-width:140px; border: 2px solid var(--horror-red); border-radius: 0; box-shadow: 0 0 15px var(--horror-shadow); filter: grayscale(0.3) contrast(1.2);" /></div>` : ''}
          <button class="btn-retro mark-read" data-id="${message.id}">${message.read ? '✓ READ' : '○ MARK_READ'}</button>
          ${fullDrawingUrl ? `<a class="btn-retro" href="${fullDrawingUrl}" download="transmission_${message.id}.png" style="text-decoration:none;">⬇ SAVE</a>` : ''}
        </div>
      `;
        list.appendChild(messageElement);
      }

      qselAll('.mark-read').forEach(button => {
        button.addEventListener('click', (event) => { 
          const messageId = event.currentTarget.dataset.id; 
          markRead(messageId); 
        });
      });
      
      // Restore scroll position after rebuilding
      list.scrollTop = scrollTop;
    }

    async function renderInboxItemsMobile() {
      const list = qsel('#inbox-list-mobile');
      if (!list) return; // Safety check for desktop
      
      const scrollTop = list.scrollTop; // Preserve scroll position
      
      let messages = [];
      if (SERVER_URL) {
        try { 
          const response = await fetch(SERVER_URL + '/api/messages', { 
            headers: { 'x-owner-token': getStoredOwnerToken() } 
          }); 
          if (response.ok) { 
            messages = await response.json(); 
          } else { 
            throw new Error('Failed to fetch messages'); 
          } 
        } catch (error) { 
          console.warn('Error fetching from server, fallback to local', error); 
          messages = loadInboxLocal(); 
        }
      } else {
        messages = loadInboxLocal();
      }
      
      // Sort by timestamp descending (newest first)
      messages = messages.sort((a, b) => b.ts - a.ts);
      
      if (messages.length === 0) {
        list.innerHTML = '<div class="p-4 message-box" style="font-size:13px; text-align:center; color: var(--horror-text);">⚠ NO TRANSMISSIONS DETECTED ⚠</div>';
        return;
      }
      
      list.innerHTML = '';
      
      for (const message of messages) {
        const messageElement = document.createElement('div');
        messageElement.className = 'p-4 message-box flex gap-3 items-start';
        messageElement.style.cssText = 'background: var(--horror-gray); border: 1px solid var(--horror-blood); position: relative;';
        
        const drawingUrl = message.drawingUrl || message.drawing;
        const fullDrawingUrl = drawingUrl && SERVER_URL && !drawingUrl.startsWith('data:') 
          ? SERVER_URL + drawingUrl 
          : drawingUrl;
        
        messageElement.innerHTML = `
        <div class="w-2/3" style="font-size:12px; padding-left: 8px;">
          <div class="font-semibold" style="margin-bottom:6px; color: var(--horror-red); letter-spacing: 1px; text-shadow: 0 0 10px var(--horror-glow);">⚠ TRANSMISSION_${message.id.toUpperCase().slice(0, 6)} · ${new Date(message.ts).toLocaleString()}</div>
          <div class="mt-1 break-words" style="color: var(--horror-text); line-height: 1.6; padding-left: 4px;">${message.text ? escapeHtml(message.text) : '<i style="opacity:0.6; color: var(--horror-blood);">[NO_TEXT_DATA]</i>'}</div>
        </div>
        <div class="w-1/3 flex flex-col items-end gap-2">
          ${fullDrawingUrl ? `<div class="flex justify-end"><img src="${fullDrawingUrl}" style="max-width:140px; border: 2px solid var(--horror-red); border-radius: 0; box-shadow: 0 0 15px var(--horror-shadow); filter: grayscale(0.3) contrast(1.2);" /></div>` : ''}
          <button class="btn-retro mark-read" data-id="${message.id}">${message.read ? '✓ READ' : '○ MARK_READ'}</button>
          ${fullDrawingUrl ? `<a class="btn-retro" href="${fullDrawingUrl}" download="transmission_${message.id}.png" style="text-decoration:none;">⬇ SAVE</a>` : ''}
        </div>
      `;
        list.appendChild(messageElement);
      }

      qselAll('.mark-read').forEach(button => {
        button.addEventListener('click', (event) => { 
          const messageId = event.currentTarget.dataset.id; 
          markRead(messageId); 
        });
      });
      
      // Restore scroll position after rebuilding
      list.scrollTop = scrollTop;
    }

    function markRead(messageId) {
      if (SERVER_URL) {
        fetch(SERVER_URL + '/api/messages/' + messageId + '/read', {
          method: 'POST',
          headers: { 'x-owner-token': getStoredOwnerToken() }
        })
          .then(() => {
            renderInboxItems();
            // Also update mobile inbox if it exists
            if (qsel('#inbox-list-mobile')) {
              renderInboxItemsMobile();
            }
          })
          .catch(() => {
            // Fallback to local storage
            const messages = loadInboxLocal();
            const index = messages.findIndex(msg => msg.id === messageId);
            if (index >= 0) {
              messages[index].read = true;
              saveInboxLocal(messages);
              renderInboxItems();
              if (qsel('#inbox-list-mobile')) {
                renderInboxItemsMobile();
              }
            }
          });
      } else {
        const messages = loadInboxLocal();
        const index = messages.findIndex(msg => msg.id === messageId);
        if (index >= 0) {
          messages[index].read = true;
          saveInboxLocal(messages);
          renderInboxItems();
          if (qsel('#inbox-list-mobile')) {
            renderInboxItemsMobile();
          }
        }
      }
    }

    function downloadAllDrawings() {
      if (SERVER_URL) {
        fetch(SERVER_URL + '/api/messages')
          .then(response => response.json())
          .then(messages => {
            messages
              .filter(msg => msg.drawingUrl)
              .forEach(msg => {
                const anchor = document.createElement('a');
                anchor.href = SERVER_URL + msg.drawingUrl;
                anchor.download = 'transmission_' + msg.id + '.png';
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
              });
          })
          .catch(() => showRetroAlert('✗ DOWNLOAD_FAILED // NO_CONNECTION ✗', 'error'));
      } else {
        const messages = loadInboxLocal().filter(msg => msg.drawing);
        if (messages.length === 0) {
          showRetroAlert('⚠ NO_DRAWINGS_AVAILABLE ⚠', 'info');
          return;
        }
        messages.forEach((msg) => {
          const anchor = document.createElement('a');
          anchor.href = msg.drawing;
          anchor.download = `transmission_${msg.id}.png`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
        });
      }
    }

    // polling util - optimizado
    let pollHandle = null;
    function startPolling(cb) { 
      if (pollHandle) clearInterval(pollHandle); 
      pollHandle = setInterval(() => { 
        cb(); 
      }, 10000); // 10 segundos
    }

    // helper to escape HTML in messages
    function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, "&#39;"); }

    // dataURL -> Blob
    function dataURLtoBlob(dataurl) { 
      const parts = dataurl.split(','); 
      const mime = parts[0].match(/:(.*?);/)[1]; 
      const bytes = atob(parts[1]); 
      const length = bytes.length;
      const buffer = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        buffer[i] = bytes.charCodeAt(i);
      }
      return new Blob([buffer], { type: mime }); 
    }

    // Load configuration from server
    async function loadConfig() {
      if (!SERVER_URL) {
        console.warn('⚠️ SERVER_URL is empty, cannot load config');
        return;
      }
      
      console.log('🔧 Loading config from:', SERVER_URL);
      try {
        const response = await fetch(SERVER_URL + '/api/config');
        console.log('📡 Config response:', response.status, response.ok);
        
        if (response.ok) {
          const config = await response.json();
          DEFAULT_OWNER_TOKEN = config.ownerToken;
          console.log('✅ Configuration loaded successfully. Token:', DEFAULT_OWNER_TOKEN);
        } else {
          console.error('❌ Error loading config, status:', response.status);
        }
      } catch (error) {
        console.error('⚠️ Could not load server configuration', error);
      }
    }

    // Initialize sidebar profile on page load
    (async function initSidebarProfile() {
      // First, load configuration from server
      await loadConfig();

      let profile = null;

      // Try to load profile from server first
      if (SERVER_URL) {
        try {
          const response = await fetch(SERVER_URL + '/api/profile');
          if (response.ok) {
            profile = await response.json();
          }
        } catch (error) {
          console.warn('Could not load profile from server, using local fallback', error);
        }
      }

      // Fallback to local storage if server fetch failed
      if (!profile) {
        profile = loadProfileLocal();
      }

      // Update sidebar with profile data
      if (profile) {
        qsel('#profile-name').textContent = profile.name || qsel('#profile-name').textContent;
        qsel('#profile-bio').textContent = profile.bio || qsel('#profile-bio').textContent;
        
        const webLink = qsel('#profile-web');
        webLink.textContent = profile.web || webLink.textContent;
        webLink.href = profile.web || '#';
        if (profile.web && !profile.web.startsWith('http')) {
          webLink.href = 'https://' + profile.web;
        }
        
        if (profile.avatar) {
          qsel('#profile-avatar').src = profile.avatar;
        }
      }

      // Render the appropriate view after everything is loaded
      render();
    })();

