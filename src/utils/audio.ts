/**
 * Procedural Web Audio API sound generator for tactile feedback.
 * Zero external audio files, zero latency, 100% offline resilient.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Simulates a heavy traditional wooden stamp slamming onto parchment.
 * Combines a high-frequency wooden clack with a low-frequency resonant thud.
 */
export function playStampSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Transient click/clack (sharp wooden contact)
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. Heavy wooden desk impact (low-frequency resonance)
    const oscThump = ctx.createOscillator();
    const thumpGain = ctx.createGain();

    oscThump.type = 'triangle';
    oscThump.frequency.setValueAtTime(140, now);
    oscThump.frequency.exponentialRampToValueAtTime(45, now + 0.16);

    thumpGain.gain.setValueAtTime(0.9, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    oscThump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    oscThump.start(now);
    oscThump.stop(now + 0.25);

    // 3. Mid-frequency wood body resonance
    const oscWood = ctx.createOscillator();
    const woodGain = ctx.createGain();

    oscWood.type = 'sine';
    oscWood.frequency.setValueAtTime(320, now);
    oscWood.frequency.exponentialRampToValueAtTime(160, now + 0.09);

    woodGain.gain.setValueAtTime(0.5, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    oscWood.connect(woodGain);
    woodGain.connect(ctx.destination);
    oscWood.start(now);
    oscWood.stop(now + 0.14);
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

/**
 * Gentle melodic chime for celebration or title unlock
 */
export function playChimeSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  } catch (e) {
    console.warn('Audio chime playback error:', e);
  }
}
