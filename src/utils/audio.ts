/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private ambianceOsc: OscillatorNode | null = null;
  private ambianceGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playFlicker() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Create buzz/spark noises - LOUDER and more severe as requested
    for (let i = 0; i < 8; i++) {
      const offset = i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      // Alternate high and low crackling frequencies
      osc.frequency.setValueAtTime(i % 2 === 0 ? 80 : 250, now + offset);
      
      // Louder (0.4 gain instead of 0.15)
      gain.gain.setValueAtTime(0.4, now + offset);
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.1);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    }
  }

  private radioInterval: any = null;
  private radioSequenceIndex = 0;

  startRadioMusic() {
    this.init();
    if (!this.ctx || this.radioInterval) return;

    // A beautiful, catchy, spooky minor synthwave theme
    // Chords: Am -> F -> C -> E7
    const melody = [
      440.00, 0, 440.00, 523.25, 493.88, 0, 392.00, 440.00, // Am: A A C B G A
      440.00, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25, // F: A C D E D C
      523.25, 0, 523.25, 659.25, 587.33, 0, 493.88, 523.25, // C: C C E D B C
      493.88, 0, 440.00, 415.30, 493.88, 587.33, 493.88, 415.30 // E7: B A G# B D B G#
    ];

    const bass = [
      110.00, 110.00, 110.00, 110.00, 110.00, 110.00, 110.00, 110.00, // A
      87.31, 87.31, 87.31, 87.31, 87.31, 87.31, 87.31, 87.31, // F
      130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 130.81, // C
      82.41, 82.41, 82.41, 82.41, 82.41, 82.41, 82.41, 82.41 // E
    ];

    this.radioSequenceIndex = 0;

    const playStep = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const step = this.radioSequenceIndex % melody.length;

      const note = melody[step];
      const bassNote = bass[step];

      // Play melody note if not 0
      if (note > 0) {
        // Lead Voice - Triangle for warmth
        const oscLead = this.ctx.createOscillator();
        const gainLead = this.ctx.createGain();
        oscLead.type = 'triangle';
        oscLead.frequency.setValueAtTime(note, now);
        
        // Sweet filter to make it sound vintage/lo-fi
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        oscLead.connect(filter);
        filter.connect(gainLead);
        gainLead.connect(this.ctx.destination);
        
        gainLead.gain.setValueAtTime(0.06, now);
        gainLead.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        oscLead.start(now);
        oscLead.stop(now + 0.4);

        // Echo/Delay effect
        const delayOsc = this.ctx.createOscillator();
        const delayGain = this.ctx.createGain();
        delayOsc.type = 'sine';
        delayOsc.frequency.setValueAtTime(note, now + 0.18);
        delayOsc.connect(delayGain);
        delayGain.connect(this.ctx.destination);
        delayGain.gain.setValueAtTime(0.02, now + 0.18);
        delayGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        delayOsc.start(now + 0.18);
        delayOsc.stop(now + 0.5);
      }

      // Bass Voice - Fat sine wave
      const oscBass = this.ctx.createOscillator();
      const gainBass = this.ctx.createGain();
      oscBass.type = 'sine';
      oscBass.frequency.setValueAtTime(bassNote, now);
      oscBass.connect(gainBass);
      gainBass.connect(this.ctx.destination);
      gainBass.gain.setValueAtTime(0.08, now);
      gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      oscBass.start(now);
      oscBass.stop(now + 0.4);

      // Snare/Percussion on beats 2 and 6 of each 8-beat bar
      const barStep = this.radioSequenceIndex % 8;
      if (barStep === 2 || barStep === 6) {
        // Noise snare
        const oscSnare = this.ctx.createOscillator();
        const gainSnare = this.ctx.createGain();
        oscSnare.type = 'triangle';
        oscSnare.frequency.setValueAtTime(150, now);
        oscSnare.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        
        // High-frequency snap
        const oscSnap = this.ctx.createOscillator();
        const gainSnap = this.ctx.createGain();
        oscSnap.type = 'sine';
        oscSnap.frequency.setValueAtTime(8000, now);
        
        oscSnare.connect(gainSnare);
        gainSnare.connect(this.ctx.destination);
        gainSnare.gain.setValueAtTime(0.03, now);
        gainSnare.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        oscSnap.connect(gainSnap);
        gainSnap.connect(this.ctx.destination);
        gainSnap.gain.setValueAtTime(0.015, now);
        gainSnap.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        oscSnare.start(now);
        oscSnare.stop(now + 0.08);
        oscSnap.start(now);
        oscSnap.stop(now + 0.04);
      } else {
        // Subtle hi-hat on other steps
        const oscHat = this.ctx.createOscillator();
        const gainHat = this.ctx.createGain();
        oscHat.type = 'sine';
        oscHat.frequency.setValueAtTime(10000, now);
        oscHat.connect(gainHat);
        gainHat.connect(this.ctx.destination);
        gainHat.gain.setValueAtTime(0.008, now);
        gainHat.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        oscHat.start(now);
        oscHat.stop(now + 0.03);
      }

      this.radioSequenceIndex++;
    };

    // Play initial immediately
    playStep();
    this.radioInterval = setInterval(playStep, 210);
  }

  stopRadioMusic() {
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }

  playKey() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playUnlock() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playMonsterRush(durationSecs: number) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Create a scary low roaring noise using low frequency oscillators and high gains
    const osc = this.ctx.createOscillator();
    const oscMod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(45, now + durationSecs);

    oscMod.frequency.setValueAtTime(30, now);
    oscMod.frequency.linearRampToValueAtTime(10, now + durationSecs);
    modGain.gain.setValueAtTime(40, now);

    oscMod.connect(modGain);
    modGain.connect(osc.frequency);

    osc.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    // Fade-in, swell at center, fade-out
    mainGain.gain.setValueAtTime(0.01, now);
    mainGain.gain.linearRampToValueAtTime(0.4, now + durationSecs * 0.4); // Peak rush loudness
    mainGain.gain.linearRampToValueAtTime(0.4, now + durationSecs * 0.6);
    mainGain.gain.linearRampToValueAtTime(0.01, now + durationSecs);

    osc.start(now);
    oscMod.start(now);

    osc.stop(now + durationSecs);
    oscMod.stop(now + durationSecs);
  }

  playDeath() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Jumpscare loud crash
    const osc = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.exponentialRampToValueAtTime(15, now + 1.5);

    osc.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.start(now);
    osc.stop(now + 1.5);

    // Squeal pitch
    const squeal = this.ctx.createOscillator();
    const squealGain = this.ctx.createGain();
    squeal.type = 'sine';
    squeal.frequency.setValueAtTime(2000, now);
    squeal.frequency.linearRampToValueAtTime(500, now + 0.6);

    squeal.connect(squealGain);
    squealGain.connect(this.ctx.destination);
    squealGain.gain.setValueAtTime(0.3, now);
    squealGain.gain.linearRampToValueAtTime(0.001, now + 0.6);

    squeal.start(now);
    squeal.stop(now + 0.6);
  }

  playVictory() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sweet elevator ding
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5 ding
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc1.start(now);
    osc1.stop(now + 1.5);

    // Warm chord resolution
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C major chord
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      gain.gain.setValueAtTime(0.1, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0 + idx * 0.1);
      osc.start(now + 0.3);
      osc.stop(now + 2.0 + idx * 0.1);
    });
  }

  playHeal() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    // Sliding upwards frequency
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playCoin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    // Classic double chime
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playBanish() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Distorted holy chime & explosive banish
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 1.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.start(now);
    osc.stop(now + 1.5);

    // Added low holy rumble
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(150, now);
    rumble.frequency.linearRampToValueAtTime(50, now + 1.5);
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);
    rumbleGain.gain.setValueAtTime(0.2, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    rumble.start(now);
    rumble.stop(now + 1.5);
  }

  startAmbiance() {
    this.init();
    if (!this.ctx || this.ambianceOsc) return;

    const now = this.ctx.currentTime;
    this.ambianceOsc = this.ctx.createOscillator();
    this.ambianceGain = this.ctx.createGain();

    this.ambianceOsc.type = 'triangle';
    this.ambianceOsc.frequency.setValueAtTime(45, now); // very low ominous rumble

    this.ambianceOsc.connect(this.ambianceGain);
    this.ambianceGain.connect(this.ctx.destination);

    this.ambianceGain.gain.setValueAtTime(0.06, now);

    this.ambianceOsc.start(now);
  }

  stopAmbiance() {
    if (this.ambianceOsc) {
      try {
        this.ambianceOsc.stop();
      } catch (e) {}
      this.ambianceOsc = null;
    }
    this.ambianceGain = null;
  }
}

export const sound = new SoundManager();
