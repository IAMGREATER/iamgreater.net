/**
 * AmbientFlow Application Controller
 * Handles UI interactions, visualizer rendering, presets, and timers
 * (c) IAMGREATER.net
 */

(function () {
  'use strict';

  // Instantiate audio engine
  const engine = new window.AmbientAudioEngine();

  // Built-in presets configuration
  const PRESETS = {
    deepFocus: {
      name: 'Deep Focus',
      description: 'Brown noise anchor with gentle rain and warm lo-fi chords',
      volumes: { brown: 0.65, rain: 0.35, lofi: 0.25, vinyl: 0.12, cafe: 0, thunder: 0 },
      enabled: { brown: true, rain: true, lofi: true, vinyl: true, cafe: false, thunder: false },
      lofiProg: 'midnightCode',
      lofiMode: 'pad'
    },
    rainyCafe: {
      name: 'Rainy Cafe',
      description: 'Gentle cafe hum, rain patter against glass, and vinyl warmth',
      volumes: { brown: 0, rain: 0.70, lofi: 0.20, vinyl: 0.35, cafe: 0.60, thunder: 0.15 },
      enabled: { brown: false, rain: true, lofi: true, vinyl: true, cafe: true, thunder: true },
      lofiProg: 'rainyTokyo',
      lofiMode: 'keys'
    },
    midnightCoding: {
      name: 'Midnight Coding',
      description: 'Lush late night lo-fi jazz, distant thunder, rain & vinyl crackle',
      volumes: { brown: 0.35, rain: 0.45, lofi: 0.55, vinyl: 0.28, cafe: 0, thunder: 0.40 },
      enabled: { brown: true, rain: true, lofi: true, vinyl: true, cafe: false, thunder: true },
      lofiProg: 'neoSoul',
      lofiMode: 'keys'
    },
    sleepSanctuary: {
      name: 'Sleep Sanctuary',
      description: 'Deep brownian relaxation wave, soft rain, and soothing chords',
      volumes: { brown: 0.80, rain: 0.30, lofi: 0.15, vinyl: 0, cafe: 0, thunder: 0.10 },
      enabled: { brown: true, rain: true, lofi: true, vinyl: false, cafe: false, thunder: true },
      lofiProg: 'sleepSanctuary',
      lofiMode: 'pad'
    }
  };

  // DOM Elements cache
  const elements = {
    // Master
    playAllBtn: document.getElementById('playAllBtn'),
    playAllIcon: document.getElementById('playAllIcon'),
    playAllText: document.getElementById('playAllText'),
    masterVolumeSlider: document.getElementById('masterVolumeSlider'),
    masterVolumeValue: document.getElementById('masterVolumeValue'),
    muteBtn: document.getElementById('muteBtn'),
    randomizeBtn: document.getElementById('randomizeBtn'),
    resetBtn: document.getElementById('resetBtn'),

    // Presets
    presetButtons: document.querySelectorAll('.preset-btn'),
    savePresetBtn: document.getElementById('savePresetBtn'),
    customPresetsList: document.getElementById('customPresetsList'),
    savePresetModal: document.getElementById('savePresetModal'),
    presetNameInput: document.getElementById('presetNameInput'),
    confirmSavePresetBtn: document.getElementById('confirmSavePresetBtn'),
    cancelSavePresetBtn: document.getElementById('cancelSavePresetBtn'),

    // Visualizer
    canvas: document.getElementById('visualizerCanvas'),
    vizModeSelect: document.getElementById('vizModeSelect'),

    // Tracks
    trackCards: document.querySelectorAll('.track-card'),
    thunderTriggerBtn: document.getElementById('thunderTriggerBtn'),
    lofiProgSelect: document.getElementById('lofiProgSelect'),
    lofiModeKeys: document.getElementById('lofiModeKeys'),
    lofiModePad: document.getElementById('lofiModePad'),
    currentChordBadge: document.getElementById('currentChordBadge'),
    chordProgName: document.getElementById('chordProgName'),

    // Timer
    timerDisplay: document.getElementById('timerDisplay'),
    timerProgress: document.getElementById('timerProgress'),
    timerStartBtn: document.getElementById('timerStartBtn'),
    timerPauseBtn: document.getElementById('timerPauseBtn'),
    timerResetBtn: document.getElementById('timerResetBtn'),
    timerFadeCheck: document.getElementById('timerFadeCheck'),
    timerButtons: document.querySelectorAll('.timer-preset-btn'),
    customMinutesInput: document.getElementById('customMinutesInput'),
    setCustomTimerBtn: document.getElementById('setCustomTimerBtn'),

    // Accessibility & Settings
    dyslexiaToggle: document.getElementById('dyslexiaToggle'),
    shortcutsBtn: document.getElementById('shortcutsBtn'),
    shortcutsModal: document.getElementById('shortcutsModal'),
    closeShortcutsBtn: document.getElementById('closeShortcutsBtn')
  };

  // State
  let currentPresetKey = 'midnightCoding';
  let activeVizMode = 'flow'; // 'flow', 'bars', 'zen'
  let customPresets = [];
  let timerSelectedMinutes = 25;

  /* =========================================================================
     INITIALIZATION
     ========================================================================= */
  function init() {
    loadSavedSettings();
    loadCustomPresets();
    setupCanvas();
    setupEventListeners();
    setupEngineCallbacks();

    // Apply default preset
    applyPreset('midnightCoding', false);

    // Start visualizer animation loop
    requestAnimationFrame(renderVisualizer);
  }

  /* =========================================================================
     AUDIO ENGINE CALLBACKS
     ========================================================================= */
  function setupEngineCallbacks() {
    // When Lo-Fi chord changes
    engine.onChordChange = (chordName, progName) => {
      if (elements.currentChordBadge) {
        elements.currentChordBadge.textContent = chordName;
        elements.currentChordBadge.classList.remove('pulse-chord');
        // Trigger CSS reflow for re-animation
        void elements.currentChordBadge.offsetWidth;
        elements.currentChordBadge.classList.add('pulse-chord');
      }
      if (elements.chordProgName) {
        elements.chordProgName.textContent = progName;
      }
    };

    // When timer updates
    engine.onTimerTick = (secondsRemaining, totalSeconds) => {
      const mins = Math.floor(secondsRemaining / 60);
      const secs = secondsRemaining % 60;
      elements.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      // Update progress bar
      const percent = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
      if (elements.timerProgress) {
        elements.timerProgress.style.width = `${percent}%`;
      }
    };

    // When timer completes
    engine.onTimerComplete = () => {
      updatePlaybackUI(false);
      elements.timerStartBtn.classList.remove('active');
      elements.timerDisplay.textContent = '00:00';
      if (elements.timerProgress) {
        elements.timerProgress.style.width = '100%';
      }
      showToast('✨ Timer completed! Rest, breathe, and reflect.');
    };
  }

  /* =========================================================================
     EVENT LISTENERS
     ========================================================================= */
  function setupEventListeners() {
    // 1. Master Play / Pause
    elements.playAllBtn.addEventListener('click', () => {
      const isPlaying = engine.togglePlayPause();
      updatePlaybackUI(isPlaying);
    });

    // 2. Master Volume
    elements.masterVolumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      engine.setMasterVolume(val);
      elements.masterVolumeValue.textContent = `${Math.round(val * 100)}%`;
      saveCurrentState();
    });

    // 3. Master Mute
    elements.muteBtn.addEventListener('click', () => {
      const isMuted = engine.toggleMute();
      elements.muteBtn.classList.toggle('active', isMuted);
      elements.muteBtn.setAttribute('aria-pressed', isMuted);
      elements.muteBtn.innerHTML = isMuted
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg><span>Muted</span>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg><span>Mute</span>';
    });

    // 4. Randomize Mix
    elements.randomizeBtn.addEventListener('click', randomizeMix);

    // 5. Reset All
    elements.resetBtn.addEventListener('click', resetAll);

    // 6. Track Cards Controls (Toggle & Volume Slider)
    elements.trackCards.forEach(card => {
      const trackKey = card.dataset.track;
      const toggleBtn = card.querySelector('.track-toggle-btn');
      const slider = card.querySelector('.track-slider');
      const valDisplay = card.querySelector('.track-val');

      // Toggle Power Button
      toggleBtn.addEventListener('click', () => {
        const nextState = !card.classList.contains('active');
        setTrackActiveState(trackKey, nextState);
        if (nextState && !engine.isPlaying) {
          engine.start();
          updatePlaybackUI(true);
        }
        saveCurrentState();
      });

      // Volume Slider
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        engine.setTrackVolume(trackKey, val);
        valDisplay.textContent = `${Math.round(val * 100)}%`;
        // If slider moved above 0 while turned off, turn it on
        if (val > 0 && !card.classList.contains('active')) {
          setTrackActiveState(trackKey, true);
          if (!engine.isPlaying) {
            engine.start();
            updatePlaybackUI(true);
          }
        }
        saveCurrentState();
      });
    });

    // 7. Thunder Specific: Trigger Rumble
    if (elements.thunderTriggerBtn) {
      elements.thunderTriggerBtn.addEventListener('click', () => {
        if (!engine.isPlaying) {
          engine.start();
          updatePlaybackUI(true);
        }
        if (!engine.tracks.thunder.enabled) {
          setTrackActiveState('thunder', true);
        }
        engine.triggerThunder();
        elements.thunderTriggerBtn.classList.add('flash-thunder');
        setTimeout(() => elements.thunderTriggerBtn.classList.remove('flash-thunder'), 600);
      });
    }

    // 8. Lo-Fi Specific: Progression & Mode
    if (elements.lofiProgSelect) {
      elements.lofiProgSelect.addEventListener('change', (e) => {
        engine.setLoFiProgression(e.target.value);
        saveCurrentState();
      });
    }
    if (elements.lofiModeKeys && elements.lofiModePad) {
      elements.lofiModeKeys.addEventListener('click', () => {
        elements.lofiModeKeys.classList.add('active');
        elements.lofiModePad.classList.remove('active');
        engine.setLoFiPlayMode('keys');
        saveCurrentState();
      });
      elements.lofiModePad.addEventListener('click', () => {
        elements.lofiModePad.classList.add('active');
        elements.lofiModeKeys.classList.remove('active');
        engine.setLoFiPlayMode('pad');
        saveCurrentState();
      });
    }

    // 9. Built-in Preset Buttons
    elements.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.dataset.preset;
        applyPreset(presetKey, true);
      });
    });

    // 10. Custom Presets Modal & Save
    if (elements.savePresetBtn) {
      elements.savePresetBtn.addEventListener('click', () => {
        elements.savePresetModal.classList.add('open');
        elements.presetNameInput.value = `Custom Mix ${customPresets.length + 1}`;
        elements.presetNameInput.focus();
        elements.presetNameInput.select();
      });
    }
    if (elements.cancelSavePresetBtn) {
      elements.cancelSavePresetBtn.addEventListener('click', () => {
        elements.savePresetModal.classList.remove('open');
      });
    }
    if (elements.confirmSavePresetBtn) {
      elements.confirmSavePresetBtn.addEventListener('click', saveCustomPreset);
    }
    if (elements.presetNameInput) {
      elements.presetNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveCustomPreset();
        if (e.key === 'Escape') elements.savePresetModal.classList.remove('open');
      });
    }

    // 11. Timer Controls
    elements.timerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.timerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        timerSelectedMinutes = parseFloat(btn.dataset.minutes);
        elements.timerDisplay.textContent = `${String(Math.floor(timerSelectedMinutes)).padStart(2, '0')}:00`;
        if (elements.timerProgress) elements.timerProgress.style.width = '0%';
      });
    });

    if (elements.setCustomTimerBtn) {
      elements.setCustomTimerBtn.addEventListener('click', () => {
        const mins = parseFloat(elements.customMinutesInput.value);
        if (mins && mins > 0) {
          timerSelectedMinutes = mins;
          elements.timerButtons.forEach(b => b.classList.remove('active'));
          elements.timerDisplay.textContent = `${String(Math.floor(timerSelectedMinutes)).padStart(2, '0')}:00`;
          if (elements.timerProgress) elements.timerProgress.style.width = '0%';
        }
      });
    }

    elements.timerStartBtn.addEventListener('click', () => {
      const fadeEnabled = elements.timerFadeCheck.checked;
      engine.startTimer(timerSelectedMinutes, fadeEnabled);
      elements.timerStartBtn.classList.add('active');
      updatePlaybackUI(true);
      showToast(`⏳ Timer started: ${timerSelectedMinutes} minutes.`);
    });

    elements.timerPauseBtn.addEventListener('click', () => {
      engine.stopTimer();
      elements.timerStartBtn.classList.remove('active');
      showToast('⏸️ Timer stopped.');
    });

    elements.timerResetBtn.addEventListener('click', () => {
      engine.stopTimer();
      elements.timerStartBtn.classList.remove('active');
      elements.timerDisplay.textContent = `${String(Math.floor(timerSelectedMinutes)).padStart(2, '0')}:00`;
      if (elements.timerProgress) elements.timerProgress.style.width = '0%';
    });

    // 12. Visualizer Mode Selector
    if (elements.vizModeSelect) {
      elements.vizModeSelect.addEventListener('change', (e) => {
        activeVizMode = e.target.value;
      });
    }

    // 13. Dyslexia Mode Toggle
    if (elements.dyslexiaToggle) {
      elements.dyslexiaToggle.addEventListener('click', toggleDyslexiaMode);
    }

    // 14. Keyboard Shortcuts Modal
    if (elements.shortcutsBtn) {
      elements.shortcutsBtn.addEventListener('click', () => {
        elements.shortcutsModal.classList.add('open');
      });
    }
    if (elements.closeShortcutsBtn) {
      elements.closeShortcutsBtn.addEventListener('click', () => {
        elements.shortcutsModal.classList.remove('open');
      });
    }

    // 15. Global Keyboard Shortcuts
    window.addEventListener('keydown', handleKeyboardShortcuts);

    // Close modals on outside click
    window.addEventListener('click', (e) => {
      if (e.target === elements.savePresetModal) {
        elements.savePresetModal.classList.remove('open');
      }
      if (e.target === elements.shortcutsModal) {
        elements.shortcutsModal.classList.remove('open');
      }
    });
  }

  /* =========================================================================
     PLAYBACK & TRACK UI HELPERS
     ========================================================================= */
  function updatePlaybackUI(isPlaying) {
    if (isPlaying) {
      elements.playAllBtn.classList.add('playing');
      elements.playAllIcon.innerHTML = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"></path>';
      elements.playAllText.textContent = 'Pause Soundscape';
    } else {
      elements.playAllBtn.classList.remove('playing');
      elements.playAllIcon.innerHTML = '<path d="M5 3l14 9-14 9V3z"></path>';
      elements.playAllText.textContent = 'Play Soundscape';
    }

    // Update active state visual indicators on track cards
    elements.trackCards.forEach(card => {
      const trackKey = card.dataset.track;
      const isTrackActive = engine.tracks[trackKey].enabled && isPlaying;
      card.classList.toggle('is-sounding', isTrackActive);
    });
  }

  function setTrackActiveState(trackKey, enabled) {
    const card = document.querySelector(`.track-card[data-track="${trackKey}"]`);
    if (!card) return;

    engine.setTrackEnabled(trackKey, enabled);
    card.classList.toggle('active', enabled);
    card.classList.toggle('is-sounding', enabled && engine.isPlaying);

    const toggleBtn = card.querySelector('.track-toggle-btn');
    toggleBtn.setAttribute('aria-pressed', enabled);
  }

  /* =========================================================================
     PRESET SYSTEM
     ========================================================================= */
  function applyPreset(presetKey, autoStart = true) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    currentPresetKey = presetKey;

    // Update preset buttons active state
    elements.presetButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });
    // Remove active state from custom presets
    const customBtns = document.querySelectorAll('.custom-preset-btn');
    customBtns.forEach(btn => btn.classList.remove('active'));

    // Apply track states and volumes
    Object.keys(preset.volumes).forEach(key => {
      const vol = preset.volumes[key];
      const enabled = preset.enabled[key];

      engine.setTrackVolume(key, vol);
      setTrackActiveState(key, enabled);

      const card = document.querySelector(`.track-card[data-track="${key}"]`);
      if (card) {
        const slider = card.querySelector('.track-slider');
        const valDisplay = card.querySelector('.track-val');
        if (slider) slider.value = vol;
        if (valDisplay) valDisplay.textContent = `${Math.round(vol * 100)}%`;
      }
    });

    // Apply Lo-Fi settings
    if (preset.lofiProg && elements.lofiProgSelect) {
      elements.lofiProgSelect.value = preset.lofiProg;
      engine.setLoFiProgression(preset.lofiProg);
    }
    if (preset.lofiMode) {
      engine.setLoFiPlayMode(preset.lofiMode);
      if (elements.lofiModeKeys && elements.lofiModePad) {
        elements.lofiModeKeys.classList.toggle('active', preset.lofiMode === 'keys');
        elements.lofiModePad.classList.toggle('active', preset.lofiMode === 'pad');
      }
    }

    if (autoStart && !engine.isPlaying) {
      engine.start();
      updatePlaybackUI(true);
    }

    showToast(`🎵 Loaded Preset: ${preset.name}`);
    saveCurrentState();
  }

  function randomizeMix() {
    elements.presetButtons.forEach(btn => btn.classList.remove('active'));

    const trackKeys = Object.keys(engine.tracks);
    // Pick 2 to 4 active tracks
    const activeCount = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...trackKeys].sort(() => 0.5 - Math.random());
    const selectedActive = new Set(shuffled.slice(0, activeCount));

    trackKeys.forEach(key => {
      const isActive = selectedActive.has(key);
      const vol = isActive ? (Math.random() * 0.5 + 0.25) : 0;

      engine.setTrackVolume(key, vol);
      setTrackActiveState(key, isActive);

      const card = document.querySelector(`.track-card[data-track="${key}"]`);
      if (card) {
        const slider = card.querySelector('.track-slider');
        const valDisplay = card.querySelector('.track-val');
        if (slider) slider.value = vol;
        if (valDisplay) valDisplay.textContent = `${Math.round(vol * 100)}%`;
      }
    });

    if (!engine.isPlaying) {
      engine.start();
      updatePlaybackUI(true);
    }

    showToast('🎲 Generated harmonious random ambient mix!');
    saveCurrentState();
  }

  function resetAll() {
    Object.keys(engine.tracks).forEach(key => {
      engine.setTrackVolume(key, 0.4);
      setTrackActiveState(key, false);

      const card = document.querySelector(`.track-card[data-track="${key}"]`);
      if (card) {
        const slider = card.querySelector('.track-slider');
        const valDisplay = card.querySelector('.track-val');
        if (slider) slider.value = 0.4;
        if (valDisplay) valDisplay.textContent = '40%';
      }
    });

    engine.pause();
    updatePlaybackUI(false);
    elements.presetButtons.forEach(btn => btn.classList.remove('active'));
    showToast('All tracks muted & reset to default.');
    saveCurrentState();
  }

  /* =========================================================================
     CUSTOM PRESETS MANAGEMENT
     ========================================================================= */
  function saveCustomPreset() {
    const name = elements.presetNameInput.value.trim();
    if (!name) return;

    const presetData = {
      id: 'custom_' + Date.now(),
      name,
      volumes: {},
      enabled: {},
      lofiProg: elements.lofiProgSelect ? elements.lofiProgSelect.value : 'neoSoul',
      lofiMode: elements.lofiModePad.classList.contains('active') ? 'pad' : 'keys'
    };

    Object.keys(engine.tracks).forEach(key => {
      presetData.volumes[key] = engine.tracks[key].volume;
      presetData.enabled[key] = engine.tracks[key].enabled;
    });

    customPresets.push(presetData);
    localStorage.setItem('ambientflow_custom_presets', JSON.stringify(customPresets));
    renderCustomPresets();
    elements.savePresetModal.classList.remove('open');
    showToast(`💾 Preset "${name}" saved!`);
  }

  function deleteCustomPreset(id) {
    customPresets = customPresets.filter(p => p.id !== id);
    localStorage.setItem('ambientflow_custom_presets', JSON.stringify(customPresets));
    renderCustomPresets();
    showToast('Preset deleted.');
  }

  function applyCustomPreset(preset) {
    elements.presetButtons.forEach(btn => btn.classList.remove('active'));

    Object.keys(preset.volumes).forEach(key => {
      const vol = preset.volumes[key];
      const enabled = preset.enabled[key];

      engine.setTrackVolume(key, vol);
      setTrackActiveState(key, enabled);

      const card = document.querySelector(`.track-card[data-track="${key}"]`);
      if (card) {
        const slider = card.querySelector('.track-slider');
        const valDisplay = card.querySelector('.track-val');
        if (slider) slider.value = vol;
        if (valDisplay) valDisplay.textContent = `${Math.round(vol * 100)}%`;
      }
    });

    if (preset.lofiProg && elements.lofiProgSelect) {
      elements.lofiProgSelect.value = preset.lofiProg;
      engine.setLoFiProgression(preset.lofiProg);
    }
    if (preset.lofiMode) {
      engine.setLoFiPlayMode(preset.lofiMode);
      if (elements.lofiModeKeys && elements.lofiModePad) {
        elements.lofiModeKeys.classList.toggle('active', preset.lofiMode === 'keys');
        elements.lofiModePad.classList.toggle('active', preset.lofiMode === 'pad');
      }
    }

    if (!engine.isPlaying) {
      engine.start();
      updatePlaybackUI(true);
    }

    showToast(`🎵 Loaded: ${preset.name}`);
    saveCurrentState();
  }

  function loadCustomPresets() {
    try {
      const stored = localStorage.getItem('ambientflow_custom_presets');
      if (stored) {
        customPresets = JSON.parse(stored);
        renderCustomPresets();
      }
    } catch (e) {
      console.warn('Could not parse custom presets', e);
    }
  }

  function renderCustomPresets() {
    if (!elements.customPresetsList) return;
    elements.customPresetsList.innerHTML = '';

    if (customPresets.length === 0) {
      elements.customPresetsList.innerHTML = '<span class="empty-hint">No custom presets saved yet. Craft your ideal soundscape and click "Save Mix".</span>';
      return;
    }

    customPresets.forEach(preset => {
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-preset-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'custom-preset-btn';
      btn.textContent = preset.name;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.custom-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyCustomPreset(preset);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'delete-preset-btn';
      delBtn.setAttribute('title', 'Delete preset');
      delBtn.innerHTML = '×';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCustomPreset(preset.id);
      });

      wrapper.appendChild(btn);
      wrapper.appendChild(delBtn);
      elements.customPresetsList.appendChild(wrapper);
    });
  }

  /* =========================================================================
     CANVAS AUDIO VISUALIZER
     Fluid glowing waves & frequency ribbon
     ========================================================================= */
  let ctx2d = null;
  let canvasW = 0;
  let canvasH = 0;
  let visualizerPoints = [];

  function setupCanvas() {
    if (!elements.canvas) return;
    ctx2d = elements.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particle pool for 'zen' mode
    for (let i = 0; i < 45; i++) {
      visualizerPoints.push({
        x: Math.random() * 800,
        y: Math.random() * 200,
        radius: Math.random() * 2.5 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  function resizeCanvas() {
    if (!elements.canvas) return;
    const rect = elements.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasW = rect.width;
    canvasH = rect.height;
    elements.canvas.width = canvasW * dpr;
    elements.canvas.height = canvasH * dpr;
    if (ctx2d) {
      ctx2d.scale(dpr, dpr);
    }
  }

  function renderVisualizer() {
    requestAnimationFrame(renderVisualizer);
    if (!ctx2d || canvasW === 0 || canvasH === 0) return;

    // Clear background
    ctx2d.clearRect(0, 0, canvasW, canvasH);

    const freqData = engine.isPlaying ? engine.getVisualizerData() : null;

    if (activeVizMode === 'flow') {
      renderFlowVisualizer(freqData);
    } else if (activeVizMode === 'bars') {
      renderBarsVisualizer(freqData);
    } else {
      renderZenVisualizer(freqData);
    }
  }

  function renderFlowVisualizer(freqData) {
    const centerY = canvasH / 2;
    const count = freqData ? freqData.length : 64;

    // Draw glowing center fluid wave
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.moveTo(0, centerY);

    const step = canvasW / (count / 2);
    for (let i = 0; i < count / 2; i++) {
      const x = i * step;
      let amp = 0;
      if (freqData) {
        amp = (freqData[i] / 255) * (canvasH * 0.42);
      }
      // Gentle sine breathing when sound is paused
      const breathe = Math.sin(Date.now() * 0.002 + i * 0.15) * 3;
      const y = centerY + Math.sin(i * 0.3 + Date.now() * 0.003) * (amp + 2) + breathe;
      ctx2d.lineTo(x, y);
    }

    const grad = ctx2d.createLinearGradient(0, 0, canvasW, 0);
    grad.addColorStop(0, 'rgba(0, 242, 254, 0.8)');
    grad.addColorStop(0.5, 'rgba(79, 172, 254, 0.9)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0.8)');

    ctx2d.strokeStyle = grad;
    ctx2d.lineWidth = 3;
    ctx2d.shadowColor = 'rgba(0, 242, 254, 0.6)';
    ctx2d.shadowBlur = 12;
    ctx2d.stroke();

    // Mirror underwave
    ctx2d.beginPath();
    ctx2d.moveTo(0, centerY);
    for (let i = 0; i < count / 2; i++) {
      const x = i * step;
      let amp = 0;
      if (freqData) {
        amp = (freqData[i] / 255) * (canvasH * 0.35);
      }
      const y = centerY - Math.sin(i * 0.3 + Date.now() * 0.003) * (amp + 2);
      ctx2d.lineTo(x, y);
    }
    ctx2d.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx2d.lineWidth = 1.5;
    ctx2d.shadowBlur = 8;
    ctx2d.stroke();
    ctx2d.restore();
  }

  function renderBarsVisualizer(freqData) {
    const barsCount = 36;
    const barWidth = (canvasW / barsCount) - 3;
    ctx2d.save();

    for (let i = 0; i < barsCount; i++) {
      const x = i * (barWidth + 3);
      let val = 0;
      if (freqData) {
        // Read logarithmic-spaced frequency bins
        const bin = Math.min(freqData.length - 1, Math.floor(Math.pow(i / barsCount, 1.4) * freqData.length));
        val = freqData[bin] / 255;
      }
      const barHeight = Math.max(3, val * (canvasH - 10));
      const y = canvasH - barHeight;

      const grad = ctx2d.createLinearGradient(x, canvasH, x, y);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.15)');
      grad.addColorStop(0.6, 'rgba(79, 172, 254, 0.6)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0.9)');

      ctx2d.fillStyle = grad;
      ctx2d.beginPath();
      ctx2d.roundRect ? ctx2d.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]) : ctx2d.rect(x, y, barWidth, barHeight);
      ctx2d.fill();
    }
    ctx2d.restore();
  }

  function renderZenVisualizer(freqData) {
    let energy = 0;
    if (freqData) {
      let sum = 0;
      for (let i = 0; i < 20; i++) sum += freqData[i];
      energy = sum / 20 / 255;
    }

    ctx2d.save();
    visualizerPoints.forEach(p => {
      p.x += p.vx * (1 + energy * 2);
      p.y += p.vy * (1 + energy * 2);

      if (p.x < 0) p.x = canvasW;
      if (p.x > canvasW) p.x = 0;
      if (p.y < 0) p.y = canvasH;
      if (p.y > canvasH) p.y = 0;

      const r = p.radius + energy * 3;
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx2d.fillStyle = `rgba(0, 242, 254, ${p.alpha * (0.6 + energy * 0.4)})`;
      ctx2d.shadowColor = 'rgba(0, 242, 254, 0.8)';
      ctx2d.shadowBlur = 8;
      ctx2d.fill();
    });
    ctx2d.restore();
  }

  /* =========================================================================
     ACCESSIBILITY & SHORTCUTS
     ========================================================================= */
  function toggleDyslexiaMode() {
    const isDyslexic = document.body.classList.toggle('dyslexia-mode');
    if (elements.dyslexiaToggle) {
      elements.dyslexiaToggle.classList.toggle('active', isDyslexic);
      elements.dyslexiaToggle.setAttribute('aria-pressed', isDyslexic);
    }
    localStorage.setItem('ambientflow_dyslexia', isDyslexic ? 'true' : 'false');
    showToast(isDyslexic ? '📖 Dyslexia-friendly font activated' : 'Standard font restored');
  }

  function handleKeyboardShortcuts(e) {
    // Ignore keystrokes inside text inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        const isPlaying = engine.togglePlayPause();
        updatePlaybackUI(isPlaying);
        break;
      case 'KeyM':
        e.preventDefault();
        const isMuted = engine.toggleMute();
        elements.muteBtn.classList.toggle('active', isMuted);
        showToast(isMuted ? 'Muted' : 'Unmuted');
        break;
      case 'KeyR':
        e.preventDefault();
        randomizeMix();
        break;
      case 'KeyT':
        e.preventDefault();
        if (elements.thunderTriggerBtn) elements.thunderTriggerBtn.click();
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
        e.preventDefault();
        const trackOrder = ['rain', 'thunder', 'vinyl', 'cafe', 'lofi', 'brown'];
        const index = parseInt(e.key, 10) - 1;
        const trackKey = trackOrder[index];
        if (trackKey) {
          const nextState = !engine.tracks[trackKey].enabled;
          setTrackActiveState(trackKey, nextState);
          if (nextState && !engine.isPlaying) {
            engine.start();
            updatePlaybackUI(true);
          }
          saveCurrentState();
        }
        break;
      case 'Escape':
        elements.savePresetModal.classList.remove('open');
        elements.shortcutsModal.classList.remove('open');
        break;
      case 'Slash':
        if (e.shiftKey) { // '?'
          e.preventDefault();
          elements.shortcutsModal.classList.toggle('open');
        }
        break;
    }
  }

  /* =========================================================================
     PERSISTENCE & STATE
     ========================================================================= */
  function saveCurrentState() {
    try {
      const state = {
        masterVolume: engine.masterVolume,
        volumes: {},
        enabled: {},
        lofiProg: elements.lofiProgSelect ? elements.lofiProgSelect.value : 'neoSoul',
        lofiMode: elements.lofiModePad.classList.contains('active') ? 'pad' : 'keys'
      };
      Object.keys(engine.tracks).forEach(key => {
        state.volumes[key] = engine.tracks[key].volume;
        state.enabled[key] = engine.tracks[key].enabled;
      });
      localStorage.setItem('ambientflow_state', JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save state to localStorage', e);
    }
  }

  function loadSavedSettings() {
    // Dyslexia mode preference
    if (localStorage.getItem('ambientflow_dyslexia') === 'true') {
      document.body.classList.add('dyslexia-mode');
      if (elements.dyslexiaToggle) {
        elements.dyslexiaToggle.classList.add('active');
        elements.dyslexiaToggle.setAttribute('aria-pressed', 'true');
      }
    }

    // Saved state
    try {
      const saved = localStorage.getItem('ambientflow_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (typeof state.masterVolume === 'number') {
          engine.masterVolume = state.masterVolume;
          if (elements.masterVolumeSlider) {
            elements.masterVolumeSlider.value = state.masterVolume;
            elements.masterVolumeValue.textContent = `${Math.round(state.masterVolume * 100)}%`;
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore saved state', e);
    }
  }

  /* =========================================================================
     UI TOAST NOTIFICATIONS
     ========================================================================= */
  let toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById('ambientToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ambientToast';
      toast.className = 'ambient-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Self-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
