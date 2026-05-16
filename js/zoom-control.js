/* =============================================
   ZOOM CONTROL — Slider di sisi browser
   Terhubung dengan transform scale phone-device
   Setara dengan Ctrl+Scroll di browser
   js/zoom-control.js
   ============================================= */

(function () {
  const ZOOM_KEY     = 'stm_zoom_level';
  const DEFAULT_ZOOM = 80;
  const MIN_ZOOM     = 40;
  const MAX_ZOOM     = 110;
  const STEP         = 5;

  let currentZoom = parseInt(localStorage.getItem(ZOOM_KEY) || DEFAULT_ZOOM, 10);
  // Pastikan nilai dalam range yang valid
  currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom));

  // =============================================
  // Terapkan zoom ke .phone-device
  // =============================================
  function applyZoom(val) {
    currentZoom = Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, val)));

    const device = document.querySelector('.phone-device');
    if (device) {
      device.style.transform       = `scale(${currentZoom / 100})`;
      device.style.transformOrigin = 'center center';
    }

    // Sinkronkan semua elemen UI zoom panel
    const slider = document.getElementById('zpSlider');
    const label  = document.getElementById('zpValue');
    const fill   = document.getElementById('zpFill');

    if (slider) slider.value = currentZoom;
    if (label)  label.textContent = currentZoom + '%';

    // Update fill track visual (persentase dari MIN ke MAX)
    if (fill) {
      const pct = ((currentZoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;
      fill.style.height = pct + '%';
    }

    // Update ARIA
    if (slider) slider.setAttribute('aria-valuenow', currentZoom);

    // Simpan pilihan user
    localStorage.setItem(ZOOM_KEY, currentZoom);
  }

  // =============================================
  // Inject CSS panel ke <head>
  // =============================================
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* === Zoom Panel Container === */
      .zp-panel {
        position: fixed;
        right: 24px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        z-index: 9999;
        padding: 14px 10px 12px;
        border-radius: 22px;
        min-width: 50px;
        user-select: none;

        /* Dark glass background */
        background: rgba(10, 10, 16, 0.88);
        backdrop-filter: blur(24px) saturate(160%);
        -webkit-backdrop-filter: blur(24px) saturate(160%);
        border: 1px solid rgba(255, 255, 255, 0.09);
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.6),
          0 2px 8px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);

        transition: opacity 0.2s;
      }

      .zp-panel:hover { opacity: 1 !important; }

      /* Ikon lensa */
      .zp-icon {
        color: rgba(255, 255, 255, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 2px;
      }

      /* Tombol + dan − */
      .zp-btn {
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.72);
        font-size: 17px;
        font-weight: 300;
        width: 32px;
        height: 32px;
        min-height: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
        line-height: 1;
        font-family: 'Roboto', sans-serif;
        padding: 0;
        flex-shrink: 0;
      }

      .zp-btn:hover {
        background: rgba(255, 255, 255, 0.14);
        color: white;
        border-color: rgba(255, 255, 255, 0.18);
      }

      .zp-btn:active {
        background: #1259c3;
        border-color: #1259c3;
        color: white;
        transform: scale(0.93);
      }

      /* Wrapper slider vertikal */
      .zp-track-wrapper {
        position: relative;
        width: 32px;
        height: 108px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Background track */
      .zp-track-bg {
        position: absolute;
        width: 4px;
        height: 100%;
        background: rgba(255, 255, 255, 0.12);
        border-radius: 2px;
        left: 50%;
        transform: translateX(-50%);
        overflow: hidden;
      }

      /* Fill track — warna biru sesuai nilai */
      .zp-track-fill {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, #1259c3, #4d8ef0);
        border-radius: 2px;
        transition: height 0.1s;
      }

      /* Input range asli — transparan, di atas track */
      .zp-slider {
        position: absolute;
        -webkit-appearance: none;
        appearance: none;
        width: 108px;
        height: 4px;
        background: transparent;
        outline: none;
        cursor: pointer;
        border: none;
        min-height: unset;
        transform: rotate(-90deg);
        transform-origin: center center;
        z-index: 2;
        padding: 0;
        margin: 0;
      }

      .zp-slider::-webkit-slider-runnable-track {
        background: transparent;
        height: 4px;
      }

      .zp-slider::-moz-range-track {
        background: transparent;
        height: 4px;
        border: none;
      }

      .zp-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        cursor: grab;
        border: 2.5px solid #1259c3;
        box-shadow:
          0 2px 8px rgba(18, 89, 195, 0.55),
          0 0 0 3px rgba(18, 89, 195, 0.15);
        transition: transform 0.12s, box-shadow 0.12s;
      }

      .zp-slider::-webkit-slider-thumb:hover {
        transform: scale(1.18);
        box-shadow:
          0 3px 12px rgba(18, 89, 195, 0.7),
          0 0 0 5px rgba(18, 89, 195, 0.2);
      }

      .zp-slider::-webkit-slider-thumb:active {
        cursor: grabbing;
        background: #1259c3;
      }

      .zp-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        cursor: grab;
        border: 2.5px solid #1259c3;
        box-shadow: 0 2px 8px rgba(18, 89, 195, 0.55);
      }

      /* Nilai persentase */
      .zp-value {
        font-size: 12px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.82);
        font-family: 'Roboto', monospace;
        letter-spacing: 0.5px;
        min-height: unset;
        line-height: 1;
      }

      /* Divider tipis */
      .zp-divider {
        width: 24px;
        height: 1px;
        background: rgba(255,255,255,0.08);
        border-radius: 1px;
      }

      /* Tombol reset */
      .zp-reset {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.38);
        font-size: 9.5px;
        font-family: 'Roboto', sans-serif;
        font-weight: 500;
        letter-spacing: 0.4px;
        padding: 4px 7px;
        cursor: pointer;
        transition: all 0.15s;
        min-height: unset;
        white-space: nowrap;
        text-transform: uppercase;
      }

      .zp-reset:hover {
        border-color: rgba(255, 255, 255, 0.25);
        color: rgba(255, 255, 255, 0.65);
        background: rgba(255,255,255,0.05);
      }

      /* Tooltip hint */
      .zp-hint {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.22);
        font-family: 'Roboto', sans-serif;
        text-align: center;
        line-height: 1.4;
        min-height: unset;
      }

      /* Sembunyikan di layar kecil (fullscreen mode) */
      @media (max-width: 500px) {
        .zp-panel { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // =============================================
  // Buat dan inject HTML panel ke <body>
  // =============================================
  function createPanel() {
    const panel = document.createElement('div');
    panel.className = 'zp-panel';
    panel.id = 'zpPanel';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'Zoom control');

    // Hitung fill awal
    const initPct = ((currentZoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

    panel.innerHTML = `
      <!-- Ikon lensa kaca pembesar -->
      <div class="zp-icon" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </div>

      <!-- Tombol Zoom In (+) -->
      <button class="zp-btn" id="zpBtnIn" aria-label="Zoom in">+</button>

      <!-- Slider vertikal -->
      <div class="zp-track-wrapper">
        <div class="zp-track-bg">
          <div class="zp-track-fill" id="zpFill" style="height:${initPct}%"></div>
        </div>
        <input
          type="range"
          class="zp-slider"
          id="zpSlider"
          min="${MIN_ZOOM}"
          max="${MAX_ZOOM}"
          step="${STEP}"
          value="${currentZoom}"
          aria-label="Zoom level"
          aria-valuemin="${MIN_ZOOM}"
          aria-valuemax="${MAX_ZOOM}"
          aria-valuenow="${currentZoom}"
        >
      </div>

      <!-- Tombol Zoom Out (−) -->
      <button class="zp-btn" id="zpBtnOut" aria-label="Zoom out">−</button>

      <!-- Persentase zoom aktif -->
      <div class="zp-value" id="zpValue" aria-live="polite">${currentZoom}%</div>

      <div class="zp-divider"></div>

      <!-- Reset ke default -->
      <button class="zp-reset" id="zpReset" aria-label="Reset zoom ke ${DEFAULT_ZOOM}%">
        Reset
      </button>

      <!-- Hint shortcut -->
      <div class="zp-hint">Ctrl<br>+Scroll</div>
    `;

    document.body.appendChild(panel);

    // Pasang event handlers
    document.getElementById('zpSlider').addEventListener('input', function () {
      applyZoom(parseInt(this.value, 10));
    });

    document.getElementById('zpBtnIn').addEventListener('click', function () {
      applyZoom(currentZoom + STEP);
    });

    document.getElementById('zpBtnOut').addEventListener('click', function () {
      applyZoom(currentZoom - STEP);
    });

    document.getElementById('zpReset').addEventListener('click', function () {
      applyZoom(DEFAULT_ZOOM);
    });
  }

  // =============================================
  // Ctrl + Mouse Wheel (seperti browser native)
  // =============================================
  window.addEventListener('wheel', function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault(); // Blokir zoom browser native

    // deltaY positif = scroll down = zoom out
    const delta = e.deltaY > 0 ? -STEP : STEP;
    applyZoom(currentZoom + delta);
  }, { passive: false });

  // =============================================
  // Keyboard shortcuts: Ctrl+= / Ctrl+- / Ctrl+0
  // =============================================
  window.addEventListener('keydown', function (e) {
    if (!e.ctrlKey) return;

    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      applyZoom(currentZoom + STEP);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      applyZoom(currentZoom - STEP);
    } else if (e.key === '0') {
      e.preventDefault();
      applyZoom(DEFAULT_ZOOM);
    }
  });

  // =============================================
  // Inisialisasi saat DOM siap
  // =============================================
  function init() {
    injectCSS();
    createPanel();
    applyZoom(currentZoom); // Terapkan nilai tersimpan
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
