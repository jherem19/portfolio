// Synthesised keyboard "thock" (no audio files). Browsers only allow audio after a real
// click, tap or key press, so the context is created and resumed from unlockKeySound().
let context: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let lastPlayed = 0;

export function unlockKeySound() {
  if (typeof window === "undefined") return false;
  if (!context) {
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return false;
    context = new AudioCtor();
    master = context.createGain();
    master.gain.value = 0.4;
    master.connect(context.destination);
    noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.08), context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (context.state === "suspended") void context.resume();
  return true;
}

export function playKeySound(seed: number, strong = false) {
  if (!context || !master || !noise || context.state !== "running") return;
  const now = context.currentTime;
  if (now - lastPlayed < 0.028) return;
  lastPlayed = now;

  const level = context.createGain();
  level.gain.value = strong ? 0.95 : 0.6;
  level.connect(master);

  // Sharp contact click.
  const click = context.createBufferSource();
  click.buffer = noise;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1600 + (seed % 7) * 190;
  band.Q.value = 1.1;
  const clickGain = context.createGain();
  clickGain.gain.setValueAtTime(0.9, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
  click.connect(band).connect(clickGain).connect(level);
  click.start(now);
  click.stop(now + 0.07);

  // Low body of the keycap bottoming out.
  const body = context.createOscillator();
  body.type = "sine";
  const pitch = (strong ? 120 : 150) + (seed % 5) * 13;
  body.frequency.setValueAtTime(pitch * 1.7, now);
  body.frequency.exponentialRampToValueAtTime(pitch, now + 0.05);
  const bodyGain = context.createGain();
  bodyGain.gain.setValueAtTime(0.75, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  body.connect(bodyGain).connect(level);
  body.start(now);
  body.stop(now + 0.12);
}
