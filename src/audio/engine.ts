import type { Settings } from '../game/types';

export type Sfx = 'tap' | 'good' | 'bad' | 'coin' | 'buy' | 'win' | 'lose' | 'chest' | 'levelup' | 'star' | 'pop' | 'whoosh' | 'equip' | 'error';
type Note = [freq: number, start: number, dur: number, type?: OscillatorType, gain?: number];

const SFX: Record<Sfx, Note[]> = {
  tap: [[520, 0, 0.05, 'triangle', 0.18]],
  pop: [[380, 0, 0.07, 'sine', 0.25], [660, 0.04, 0.08, 'sine', 0.2]],
  good: [[523, 0, 0.09, 'triangle', 0.22], [784, 0.08, 0.14, 'triangle', 0.22]],
  bad: [[220, 0, 0.14, 'sawtooth', 0.14], [165, 0.1, 0.2, 'sawtooth', 0.14]],
  error: [[180, 0, 0.12, 'square', 0.12], [150, 0.1, 0.16, 'square', 0.12]],
  coin: [[988, 0, 0.07, 'square', 0.12], [1319, 0.07, 0.18, 'square', 0.12]],
  buy: [[659, 0, 0.08, 'triangle', 0.22], [880, 0.07, 0.08, 'triangle', 0.22], [1175, 0.14, 0.2, 'triangle', 0.22]],
  equip: [[440, 0, 0.06, 'sine', 0.2], [587, 0.05, 0.1, 'sine', 0.2]],
  star: [[880, 0, 0.1, 'sine', 0.25], [1175, 0.1, 0.1, 'sine', 0.25], [1568, 0.2, 0.25, 'sine', 0.25]],
  win: [[523, 0, 0.12, 'triangle', 0.25], [659, 0.12, 0.12, 'triangle', 0.25], [784, 0.24, 0.12, 'triangle', 0.25], [1047, 0.36, 0.4, 'triangle', 0.25]],
  lose: [[392, 0, 0.18, 'triangle', 0.22], [330, 0.18, 0.18, 'triangle', 0.22], [262, 0.36, 0.34, 'triangle', 0.22]],
  chest: [[262, 0, 0.1, 'sawtooth', 0.14], [330, 0.1, 0.1, 'sawtooth', 0.14], [392, 0.2, 0.1, 'sawtooth', 0.14], [523, 0.3, 0.3, 'sawtooth', 0.16], [659, 0.45, 0.4, 'triangle', 0.2]],
  levelup: [[523, 0, 0.1, 'square', 0.14], [659, 0.1, 0.1, 'square', 0.14], [784, 0.2, 0.1, 'square', 0.14], [1047, 0.3, 0.1, 'square', 0.14], [1319, 0.4, 0.45, 'triangle', 0.22]],
  whoosh: [[300, 0, 0.12, 'sine', 0.1], [150, 0.05, 0.14, 'sine', 0.1]],
};

/** Простые мелодии на WebAudio: без файлов, работают офлайн. Ноты — полутона относительно ля. */
const SCALE = [0, 2, 4, 7, 9, 12];
const TRACKS: Record<string, { bpm: number; root: number; pattern: number[]; bass: number[]; wave: OscillatorType }> = {
  home: { bpm: 96, root: 261.6, pattern: [0, 2, 4, 2, 3, 2, 1, -1, 0, 2, 5, 4, 3, 2, 1, -1], bass: [0, 0, 3, 3], wave: 'triangle' },
  base: { bpm: 84, root: 246.9, pattern: [2, -1, 4, -1, 3, -1, 1, -1, 2, -1, 5, 4, 3, -1, 1, -1], bass: [0, 3, 0, 4], wave: 'sine' },
  world1: { bpm: 112, root: 293.7, pattern: [0, 1, 2, 4, 2, 1, 0, -1, 3, 4, 5, 4, 2, 1, 0, -1], bass: [0, 0, 2, 3], wave: 'triangle' },
  world2: { bpm: 100, root: 329.6, pattern: [4, 3, 2, 1, 2, 3, 4, -1, 5, 4, 2, 1, 0, 1, 2, -1], bass: [0, 2, 3, 2], wave: 'sine' },
  world3: { bpm: 108, root: 277.2, pattern: [0, 2, 0, 3, 0, 4, 0, 3, 1, 3, 1, 4, 1, 5, 4, 3], bass: [0, 0, 1, 1], wave: 'square' },
  world4: { bpm: 90, root: 220, pattern: [2, -1, 3, 2, 1, -1, 0, -1, 2, 4, 3, 2, 1, -1, 0, -1], bass: [0, 3, 1, 3], wave: 'sine' },
  world5: { bpm: 120, root: 349.2, pattern: [0, 3, 5, 3, 4, 2, 1, 2, 0, 3, 5, 4, 3, 2, 1, -1], bass: [0, 4, 3, 2], wave: 'triangle' },
  play: { bpm: 128, root: 293.7, pattern: [0, 2, 3, 4, 3, 2, 0, -1, 4, 5, 4, 3, 2, 3, 0, -1], bass: [0, 0, 3, 4], wave: 'square' },
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private settings: Pick<Settings, 'musicOn' | 'sfxOn' | 'master' | 'music' | 'sfx'> = { musicOn: true, sfxOn: true, master: 0.8, music: 0.5, sfx: 0.8 };
  private track: string | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextAt = 0;
  unlocked = false;
  /** Нужен жест пользователя (Safari): вызывается на первом касании. */
  unlock() {
    if (this.unlocked && this.ctx?.state === 'running') return;
    try {
      const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      if (!AC) return;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.musicGain = this.ctx.createGain(); this.sfxGain = this.ctx.createGain();
        this.musicGain.connect(this.master); this.sfxGain.connect(this.master); this.master.connect(this.ctx.destination);
        this.applyGains();
      }
      void this.ctx.resume();
      this.unlocked = true;
      if (this.track) this.startLoop();
    } catch { /* аудио недоступно — игра работает без звука */ }
  }
  apply(s: Pick<Settings, 'musicOn' | 'sfxOn' | 'master' | 'music' | 'sfx'>) { this.settings = s; this.applyGains(); if (!s.musicOn) this.stopLoop(); else if (this.track && this.unlocked) this.startLoop(); }
  private applyGains() {
    if (!this.ctx || !this.master || !this.musicGain || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.settings.master, t, 0.02);
    this.musicGain.gain.setTargetAtTime(this.settings.musicOn ? this.settings.music * 0.35 : 0, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxOn ? this.settings.sfx : 0, t, 0.02);
  }
  private tone(dest: AudioNode, f: number, at: number, dur: number, type: OscillatorType, gain: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, at);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(dest); o.start(at); o.stop(at + dur + 0.03);
  }
  sfx(name: Sfx) {
    if (!this.ctx || !this.sfxGain || !this.settings.sfxOn || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    for (const [f, s, d, type = 'sine', g = 0.2] of SFX[name]) this.tone(this.sfxGain, f, t + s, d, type, g);
  }
  music(name: string | null) {
    if (name === this.track) return;
    this.track = name;
    this.stopLoop();
    if (name && this.unlocked && this.settings.musicOn) this.startLoop();
  }
  private startLoop() {
    if (!this.ctx || !this.track || this.timer !== null || !this.settings.musicOn) return;
    this.step = 0; this.nextAt = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 120);
  }
  private stopLoop() { if (this.timer !== null) { clearInterval(this.timer); this.timer = null; } }
  private schedule() {
    if (!this.ctx || !this.musicGain || !this.track) return;
    const tr = TRACKS[this.track] || TRACKS.home;
    const beat = 60 / tr.bpm / 2;
    while (this.nextAt < this.ctx.currentTime + 0.4) {
      const n = tr.pattern[this.step % tr.pattern.length];
      if (n >= 0) this.tone(this.musicGain, tr.root * Math.pow(2, SCALE[n % SCALE.length] / 12) * (n >= SCALE.length ? 2 : 1), this.nextAt, beat * 1.6, tr.wave, 0.22);
      if (this.step % 4 === 0) { const b = tr.bass[(this.step / 4) % tr.bass.length | 0]; this.tone(this.musicGain, tr.root / 2 * Math.pow(2, SCALE[b % SCALE.length] / 12), this.nextAt, beat * 3.4, 'sine', 0.3); }
      this.nextAt += beat; this.step++;
    }
  }
  /** Пауза при уходе в фон (экономим батарею). */
  suspend() { void this.ctx?.suspend(); }
  resume() { if (this.unlocked) void this.ctx?.resume(); }
}
