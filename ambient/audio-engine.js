/**
 * AmbientFlow Audio Engine
 * Pure Web Audio API synthesis & procedural sound generator
 * 100% Offline, Zero-Dependency, Instant Loading
 * (c) IAMGREATER.net
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.analyser = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.isPlaying = false;

    // Track states: volume (0-1), enabled (bool)
    this.tracks = {
      rain: { volume: 0.5, enabled: false, nodes: null },
      thunder: { volume: 0.4, enabled: false, nodes: null },
      vinyl: { volume: 0.35, enabled: false, nodes: null },
      cafe: { volume: 0.3, enabled: false, nodes: null },
      lofi: { volume: 0.5, enabled: false, nodes: null },
      brown: { volume: 0.6, enabled: false, nodes: null }
    };

    // Shared noise buffers for CPU efficiency
    this.buffers = {};

    // Thunder state
    this.thunderTimer = null;
    this.thunderNextMinSec = 18;
    this.thunderNextMaxSec = 38;

    // Lo-Fi Chords state
    this.lofiTimer = null;
    this.lofiChordIndex = 0;
    this.lofiProgressionKey = 'neoSoul';
    this.lofiPlayMode = 'keys'; // 'keys' (strummed) or 'pad' (sustained)
    this.currentChordNotes = [];
    this.onChordChange = null;

    // Timer / Pomodoro state
    this.timerInterval = null;
    this.timerSecondsRemaining = 0;
    this.timerTotalSeconds = 0;
    this.timerIsRunning = false;
    this.timerFadeEnabled = true;
    this.timerOriginalVolume = 0.8;
    this.onTimerTick = null;
    this.onTimerComplete = null;

    // Lo-Fi Chord progressions
    this.progressions = {
      neoSoul: {
        name: 'Neo-Soul Dusk',
        chords: [
          { name: 'E♭maj9', notes: [155.56, 196.00, 233.08, 293.66, 349.23] },
          { name: 'Cm7',    notes: [130.81, 196.00, 233.08, 311.13, 392.00] },
          { name: 'Fm9',    notes: [174.61, 207.65, 261.63, 311.13, 392.00] },
          { name: 'B♭13',   notes: [116.54, 207.65, 261.63, 293.66, 392.00] }
        ]
      },
      rainyTokyo: {
        name: 'Rainy Tokyo',
        chords: [
          { name: 'Dmaj7',   notes: [146.83, 220.00, 277.18, 329.63, 369.99] },
          { name: 'Badd9',   notes: [123.47, 185.00, 246.94, 277.18, 369.99] },
          { name: 'Gmaj7',   notes: [98.00,  196.00, 246.94, 293.66, 369.99] },
          { name: 'A7sus4',  notes: [110.00, 220.00, 293.66, 329.63, 440.00] }
        ]
      },
      midnightCode: {
        name: 'Midnight Terminal',
        chords: [
          { name: 'Fmaj7#11', notes: [174.61, 220.00, 261.63, 329.63, 493.88] },
          { name: 'Em7',      notes: [164.81, 196.00, 246.94, 293.66, 392.00] },
          { name: 'Dm9',      notes: [146.83, 174.61, 220.00, 261.63, 329.63] },
          { name: 'Am7/G',    notes: [98.00,  164.81, 220.00, 261.63, 329.63] }
        ]
      },
      sleepSanctuary: {
        name: 'Deep Slumber',
        chords: [
          { name: 'D♭maj7', notes: [138.59, 174.61, 207.65, 261.63, 349.23] },
          { name: 'A♭maj7', notes: [103.83, 155.56, 207.65, 261.63, 311.13] },
          { name: 'B♭m9',   notes: [116.54, 174.61, 207.65, 277.18, 349.23] },
          { name: 'G♭maj7', notes: [92.50,  185.00, 220.00, 277.18, 349.23] }
        ]
      }
    };
  }

  /**
   * Initializes the AudioContext upon user gesture.
   */
  initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Compressor to prevent clipping & give smooth warm glue
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    // Analyser Node for visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

    // Routing: TrackGains -> MasterGain -> Compressor -> Analyser -> Destination
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Pre-generate procedural noise buffers
    this.generateBuffers();

    // Initialize all track nodes
    this.initBrownNoise();
    this.initRain();
    this.initThunder();
    this.initVinyl();
    this.initCafe();
    this.initLoFi();
  }

  /**
   * Generates reusable looping audio buffers for noise generation.
   */
  generateBuffers() {
    const sampleRate = this.ctx.sampleRate;
    const lengthSeconds = 8;
    const bufferLength = sampleRate * lengthSeconds;

    // 1. Brown Noise Buffer (Stereo)
    const brownBuffer = this.ctx.createBuffer(2, bufferLength, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = brownBuffer.getChannelData(channel);
      let lastVal = 0.0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = (lastVal + (0.022 * white)) / 1.022;
        data[i] = lastVal * 3.2; // Gain adjust
      }
    }
    this.buffers.brown = brownBuffer;

    // 2. Pink Noise Buffer (Stereo, Paul Kellet 7-pole algorithm)
    const pinkBuffer = this.ctx.createBuffer(2, bufferLength, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = pinkBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
        b6 = white * 0.115926;
      }
    }
    this.buffers.pink = pinkBuffer;

    // 3. Vinyl Surface Noise & Dust Buffer (Stereo)
    const vinylBuffer = this.ctx.createBuffer(2, bufferLength, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = vinylBuffer.getChannelData(channel);
      for (let i = 0; i < bufferLength; i++) {
        // Faint underlying groove hiss
        let hiss = (Math.random() * 2 - 1) * 0.007;

        // Random micro-pops and crackles (sparse Poisson distribution)
        const rand = Math.random();
        if (rand < 0.0006) {
          // Sharp dust pop
          const popMag = (Math.random() * 0.4 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
          hiss += popMag;
        } else if (rand < 0.0035) {
          // Tiny surface friction click
          hiss += (Math.random() * 0.08 - 0.04);
        }
        data[i] = hiss;
      }
    }
    this.buffers.vinyl = vinylBuffer;
  }

  /* =========================================================================
     1. BROWN NOISE ENGINE
     Smooth, deep relaxation and focus background noise
     ========================================================================= */
  initBrownNoise() {
    const track = this.tracks.brown;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    // Warm Lowpass Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers.brown;
    source.loop = true;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(0);
    track.nodes = { gainNode, filter, source };
  }

  /* =========================================================================
     2. RAIN ON WINDOW ENGINE
     Dual-layer: Filtered pink noise bed + randomized window droplet clicks
     ========================================================================= */
  initRain() {
    const track = this.tracks.rain;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    // Rain continuous bed
    const bedFilter1 = this.ctx.createBiquadFilter();
    bedFilter1.type = 'bandpass';
    bedFilter1.frequency.setValueAtTime(1400, this.ctx.currentTime);
    bedFilter1.Q.setValueAtTime(0.85, this.ctx.currentTime);

    const bedFilter2 = this.ctx.createBiquadFilter();
    bedFilter2.type = 'highpass';
    bedFilter2.frequency.setValueAtTime(380, this.ctx.currentTime);

    const bedGain = this.ctx.createGain();
    bedGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    const bedSource = this.ctx.createBufferSource();
    bedSource.buffer = this.buffers.pink;
    bedSource.loop = true;

    bedSource.connect(bedFilter1);
    bedFilter1.connect(bedFilter2);
    bedFilter2.connect(bedGain);
    bedGain.connect(gainNode);
    bedSource.start(0);

    // Droplets layer (synthesized tap clicks)
    const dropletGain = this.ctx.createGain();
    dropletGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    dropletGain.connect(gainNode);

    // Rain droplet scheduler
    let dropletTimer = null;
    const scheduleDroplet = () => {
      if (this.ctx && track.enabled && this.isPlaying) {
        this.triggerDroplet(dropletGain);
      }
      // Interval between 30ms and 110ms for realistic randomized rain patter
      const delay = 35 + Math.random() * 85;
      dropletTimer = setTimeout(scheduleDroplet, delay);
    };
    scheduleDroplet();

    gainNode.connect(this.masterGain);
    track.nodes = { gainNode, bedSource, dropletGain, dropletTimer };
  }

  /**
   * Generates a single organic water droplet click tapping on glass
   */
  triggerDroplet(destinationGain) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const dur = 0.025 + Math.random() * 0.035;

    // Filtered noise impulse
    const osc = this.ctx.createOscillator();
    osc.type = Math.random() > 0.4 ? 'triangle' : 'sine';
    // Frequency between 1600Hz and 3600Hz
    const startFreq = 1800 + Math.random() * 1800;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.65, t + dur);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(startFreq, t);
    filter.Q.setValueAtTime(5 + Math.random() * 5, t);

    const gain = this.ctx.createGain();
    const peakGain = 0.04 + Math.random() * 0.08;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    // Stereo Panning
    let panNode = null;
    if (this.ctx.createStereoPanner) {
      panNode = this.ctx.createStereoPanner();
      panNode.pan.setValueAtTime((Math.random() * 2 - 1) * 0.75, t);
    }

    osc.connect(filter);
    filter.connect(gain);
    if (panNode) {
      gain.connect(panNode);
      panNode.connect(destinationGain);
    } else {
      gain.connect(destinationGain);
    }

    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  /* =========================================================================
     3. DISTANT THUNDER ENGINE
     Deep chest-rumbling resonant noise bursts at randomized intervals
     ========================================================================= */
  initThunder() {
    const track = this.tracks.thunder;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.connect(this.masterGain);

    track.nodes = { gainNode };

    // Schedule random distant thunder rumbles
    this.scheduleNextThunder();
  }

  scheduleNextThunder() {
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
    }
    const delayMs = (this.thunderNextMinSec + Math.random() * (this.thunderNextMaxSec - this.thunderNextMinSec)) * 1000;
    this.thunderTimer = setTimeout(() => {
      if (this.tracks.thunder.enabled && this.isPlaying) {
        this.triggerThunder();
      }
      this.scheduleNextThunder();
    }, delayMs);
  }

  /**
   * Generates a realistic rolling distant thunder strike
   */
  triggerThunder() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const track = this.tracks.thunder;
    if (!track.nodes) return;

    const t = this.ctx.currentTime;
    const duration = 6.5 + Math.random() * 3.0; // 6.5 to 9.5s long rumble

    // 1. Noise source for the crack and rolling rumble
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.buffers.pink;
    noiseSource.loop = true;

    // Resonant lowpass filter simulating sound traveling miles through humid air
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseCutoff = 65 + Math.random() * 40; // 65-105Hz
    filter.frequency.setValueAtTime(baseCutoff * 1.8, t);
    filter.frequency.exponentialRampToValueAtTime(baseCutoff, t + 1.8);
    filter.frequency.exponentialRampToValueAtTime(45, t + duration);
    filter.Q.setValueAtTime(3.8, t);

    // 2. Sub-bass sine oscillator for deep body rumble
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    const subStartFreq = 48 + Math.random() * 12;
    subOsc.frequency.setValueAtTime(subStartFreq, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + duration);

    // Sub gain envelope
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, t);
    subGain.gain.linearRampToValueAtTime(0.4, t + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.7);

    // Noise envelope with multiple secondary peaks (rolling clouds/hills echoes)
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    // Initial strike swell
    noiseGain.gain.linearRampToValueAtTime(0.9, t + 0.25);
    noiseGain.gain.exponentialRampToValueAtTime(0.45, t + 1.1);
    // Secondary echo roll
    noiseGain.gain.linearRampToValueAtTime(0.65, t + 1.8);
    noiseGain.gain.exponentialRampToValueAtTime(0.3, t + 3.2);
    // Third distant reflection
    noiseGain.gain.linearRampToValueAtTime(0.4, t + 4.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    // Stereo Panner
    let panner = null;
    if (this.ctx.createStereoPanner) {
      panner = this.ctx.createStereoPanner();
      const panPos = (Math.random() * 2 - 1) * 0.65;
      panner.pan.setValueAtTime(panPos, t);
      panner.pan.linearRampToValueAtTime(panPos * -0.4, t + duration);
    }

    // Connect nodes
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    subOsc.connect(subGain);

    const thunderMix = this.ctx.createGain();
    thunderMix.gain.setValueAtTime(1.0, t);
    noiseGain.connect(thunderMix);
    subGain.connect(thunderMix);

    if (panner) {
      thunderMix.connect(panner);
      panner.connect(track.nodes.gainNode);
    } else {
      thunderMix.connect(track.nodes.gainNode);
    }

    noiseSource.start(t);
    subOsc.start(t);
    noiseSource.stop(t + duration + 0.1);
    subOsc.stop(t + duration + 0.1);
  }

  /* =========================================================================
     4. VINYL CRACKLE ENGINE
     Authentic record player surface noise and needle crackles
     ========================================================================= */
  initVinyl() {
    const track = this.tracks.vinyl;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    // Warm highpass filter to keep only vintage surface grit
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers.vinyl;
    source.loop = true;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(0);
    track.nodes = { gainNode, filter, source };
  }

  /* =========================================================================
     5. CAFE HUM ENGINE
     Multiband conversational room warmth & gentle shifting murmur
     ========================================================================= */
  initCafe() {
    const track = this.tracks.cafe;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    // Formant filters simulating distant coffee shop speech murmur
    const formants = [
      { freq: 340,  q: 2.8, gain: 0.55 },
      { freq: 820,  q: 3.2, gain: 0.40 },
      { freq: 1750, q: 3.0, gain: 0.28 },
      { freq: 2600, q: 2.5, gain: 0.18 }
    ];

    const cafeMix = this.ctx.createGain();
    cafeMix.gain.setValueAtTime(1.0, this.ctx.currentTime);

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers.pink;
    source.loop = true;

    formants.forEach((f, idx) => {
      const bq = this.ctx.createBiquadFilter();
      bq.type = 'bandpass';
      bq.frequency.setValueAtTime(f.freq, this.ctx.currentTime);
      bq.Q.setValueAtTime(f.q, this.ctx.currentTime);

      const fGain = this.ctx.createGain();
      fGain.gain.setValueAtTime(f.gain, this.ctx.currentTime);

      // Subtle slow modulation to simulate conversational dynamics
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12 + idx * 0.08, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(f.gain * 0.25, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(fGain.gain);
      lfo.start(0);

      source.connect(bq);
      bq.connect(fGain);
      fGain.connect(cafeMix);
    });

    cafeMix.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(0);

    track.nodes = { gainNode, source, cafeMix };
  }

  /* =========================================================================
     6. LO-FI CHORDS ENGINE
     Warm vintage 7th/9th jazz chord progression generator with tape warble
     ========================================================================= */
  initLoFi() {
    const track = this.tracks.lofi;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    // Warm Lowpass Filter (Tape warmth)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.1, this.ctx.currentTime);

    // Tape warble LFO (slow pitch vibrato ~0.4Hz)
    const warbleLFO = this.ctx.createOscillator();
    warbleLFO.frequency.setValueAtTime(0.42, this.ctx.currentTime);
    const warbleGain = this.ctx.createGain();
    warbleGain.gain.setValueAtTime(6.0, this.ctx.currentTime); // cents detune
    warbleLFO.connect(warbleGain);
    warbleLFO.start(0);

    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    track.nodes = { gainNode, filter, warbleGain, warbleLFO };

    // Start chord progression loop
    this.startLoFiChordCycle();
  }

  /**
   * Sets the active chord progression
   */
  setLoFiProgression(progressionKey) {
    if (this.progressions[progressionKey]) {
      this.lofiProgressionKey = progressionKey;
      this.lofiChordIndex = 0;
      if (this.isPlaying && this.tracks.lofi.enabled) {
        this.playCurrentLoFiChord();
      }
    }
  }

  /**
   * Sets the play mode ('keys' = strummed vintage e-piano, 'pad' = sustained pad)
   */
  setLoFiPlayMode(mode) {
    this.lofiPlayMode = mode;
  }

  /**
   * Schedules repeating chord changes (every 4.8 seconds)
   */
  startLoFiChordCycle() {
    if (this.lofiTimer) clearInterval(this.lofiTimer);

    const stepChord = () => {
      if (this.isPlaying && this.tracks.lofi.enabled && this.ctx && this.ctx.state === 'running') {
        this.playCurrentLoFiChord();
        const progression = this.progressions[this.lofiProgressionKey];
        this.lofiChordIndex = (this.lofiChordIndex + 1) % progression.chords.length;
      }
    };

    // Every 4.8s advance to next chord
    this.lofiTimer = setInterval(stepChord, 4800);
  }

  /**
   * Synthesizes the active Lo-Fi chord with warm envelope and tape warble
   */
  playCurrentLoFiChord() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const track = this.tracks.lofi;
    if (!track.nodes) return;

    const progression = this.progressions[this.lofiProgressionKey];
    const chord = progression.chords[this.lofiChordIndex];
    const t = this.ctx.currentTime;
    const duration = 4.7; // slightly overlapping

    if (this.onChordChange) {
      this.onChordChange(chord.name, progression.name);
    }

    const isKeysMode = this.lofiPlayMode === 'keys';

    // Play each voice in the chord
    chord.notes.forEach((freq, i) => {
      // Gentle strum offset (45ms per note if keys mode, else simultaneous)
      const noteDelay = isKeysMode ? i * 0.045 : 0;
      const noteStart = t + noteDelay;

      // 1. Primary Warm Triangle Oscillator
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, noteStart);

      // 2. Soft Sine Oscillator for body & sub warmth
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 0.5, noteStart); // Sub octave

      // Connect Tape Warble LFO to detune
      track.nodes.warbleGain.connect(osc1.detune);
      track.nodes.warbleGain.connect(osc2.detune);

      // Per-note gain envelope
      const noteGain = this.ctx.createGain();
      const peakAmp = 0.14 / Math.sqrt(chord.notes.length);

      noteGain.gain.setValueAtTime(0.0001, noteStart);
      if (isKeysMode) {
        // E-Piano punchy gentle attack and slow decay
        noteGain.gain.linearRampToValueAtTime(peakAmp, noteStart + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(peakAmp * 0.45, noteStart + 1.2);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);
      } else {
        // Pad slow swell and long lush release
        noteGain.gain.linearRampToValueAtTime(peakAmp, noteStart + 0.8);
        noteGain.gain.setValueAtTime(peakAmp, noteStart + duration - 1.2);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);
      }

      // Voice stereo panning for wide spaciousness
      let panner = null;
      if (this.ctx.createStereoPanner) {
        panner = this.ctx.createStereoPanner();
        // Distribute voices across stereo spectrum
        const panValue = ((i / (chord.notes.length - 1)) * 2 - 1) * 0.6;
        panner.pan.setValueAtTime(panValue, noteStart);
      }

      osc1.connect(noteGain);
      osc2.connect(noteGain);

      if (panner) {
        noteGain.connect(panner);
        panner.connect(track.nodes.filter);
      } else {
        noteGain.connect(track.nodes.filter);
      }

      osc1.start(noteStart);
      osc2.start(noteStart);
      osc1.stop(noteStart + duration + 0.1);
      osc2.stop(noteStart + duration + 0.1);
    });
  }

  /* =========================================================================
     GLOBAL PLAYBACK & TRACK MANAGEMENT
     ========================================================================= */

  /**
   * Starts all active audio generators
   */
  start() {
    this.initContext();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;

    // Apply track gains
    Object.keys(this.tracks).forEach(key => {
      this.updateTrackGain(key);
    });

    if (this.tracks.lofi.enabled) {
      this.playCurrentLoFiChord();
    }
  }

  /**
   * Pauses all audio playback cleanly
   */
  pause() {
    if (!this.ctx) return;
    this.isPlaying = false;

    // Smoothly fade out track gains
    const t = this.ctx.currentTime;
    Object.keys(this.tracks).forEach(key => {
      const track = this.tracks[key];
      if (track.nodes && track.nodes.gainNode) {
        track.nodes.gainNode.gain.cancelScheduledValues(t);
        track.nodes.gainNode.gain.linearRampToValueAtTime(0, t + 0.15);
      }
    });
  }

  /**
   * Toggles Play / Pause
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  /**
   * Enables or disables a specific sound track
   */
  setTrackEnabled(key, enabled) {
    if (!this.tracks[key]) return;
    this.tracks[key].enabled = enabled;
    if (this.isPlaying) {
      this.updateTrackGain(key);
      if (key === 'lofi' && enabled) {
        this.playCurrentLoFiChord();
      }
    }
  }

  /**
   * Sets the volume of a specific sound track (0.0 to 1.0)
   */
  setTrackVolume(key, volume) {
    if (!this.tracks[key]) return;
    this.tracks[key].volume = Math.max(0, Math.min(1, volume));
    if (this.isPlaying && this.tracks[key].enabled) {
      this.updateTrackGain(key);
    }
  }

  /**
   * Internal helper to smoothly transition track volume
   */
  updateTrackGain(key) {
    const track = this.tracks[key];
    if (!this.ctx || !track.nodes || !track.nodes.gainNode) return;

    const t = this.ctx.currentTime;
    const targetGain = (track.enabled && this.isPlaying) ? track.volume : 0;
    track.nodes.gainNode.gain.cancelScheduledValues(t);
    track.nodes.gainNode.gain.linearRampToValueAtTime(targetGain, t + 0.08);
  }

  /**
   * Sets master volume (0.0 to 1.0)
   */
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain && !this.isMuted) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, t + 0.05);
    }
  }

  /**
   * Toggles master mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, t + 0.08);
    }
    return this.isMuted;
  }

  /* =========================================================================
     POMODORO / SLEEP TIMER WITH FADE-OUT
     ========================================================================= */

  startTimer(minutes, enableFade = true) {
    this.stopTimer();
    this.timerTotalSeconds = Math.round(minutes * 60);
    this.timerSecondsRemaining = this.timerTotalSeconds;
    this.timerFadeEnabled = enableFade;
    this.timerOriginalVolume = this.masterVolume;
    this.timerIsRunning = true;

    if (!this.isPlaying) {
      this.start();
    }

    if (this.onTimerTick) {
      this.onTimerTick(this.timerSecondsRemaining, this.timerTotalSeconds);
    }

    this.timerInterval = setInterval(() => {
      this.timerSecondsRemaining--;

      // Gradual fade out in the last 60 seconds (or remaining time if under 60s)
      if (this.timerFadeEnabled && this.timerSecondsRemaining <= 60 && this.timerSecondsRemaining > 0) {
        const fadeRatio = this.timerSecondsRemaining / 60;
        this.setMasterVolume(this.timerOriginalVolume * fadeRatio);
      }

      if (this.onTimerTick) {
        this.onTimerTick(this.timerSecondsRemaining, this.timerTotalSeconds);
      }

      if (this.timerSecondsRemaining <= 0) {
        this.finishTimer();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerIsRunning = false;
    this.timerSecondsRemaining = 0;
    if (this.timerFadeEnabled && this.timerOriginalVolume) {
      this.setMasterVolume(this.timerOriginalVolume);
    }
  }

  finishTimer() {
    this.stopTimer();
    this.pause();
    this.playTimerChime();
    if (this.onTimerComplete) {
      this.onTimerComplete();
    }
  }

  /**
   * Synthesizes a soothing 3-tone Solfeggio / Tibetan singing bowl chime
   */
  playTimerChime() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime + 0.1;
    // Harmonic frequencies: 528Hz (Love/Restoration), 792Hz, 1056Hz
    const freqs = [528, 792, 1056];
    const duration = 4.0;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      const peak = 0.25 / (idx + 1);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.08 + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.compressor || this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration + 0.1);
    });
  }

  /**
   * Reads frequency data for the Visualizer
   */
  getVisualizerData() {
    if (!this.analyser) return null;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

// Export for module or global use
window.AmbientAudioEngine = AmbientAudioEngine;
