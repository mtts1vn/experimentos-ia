class SoundEngine {
    constructor() {
        this.ctx = null;
        this.ambientGain = null;
        this.effectsGain = null;
        this.ambientRunning = false;
        this.muted = false;
    }

    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.ambientGain.connect(this.ctx.destination);

        this.effectsGain = this.ctx.createGain();
        this.effectsGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        this.effectsGain.connect(this.ctx.destination);

        this.startAmbient();
    }

    toggleMute() {
        this.muted = !this.muted;
        if (!this.ctx) return this.muted;
        this.ambientGain.gain.setTargetAtTime(this.muted ? 0 : 0.08, this.ctx.currentTime, 0.05);
        this.effectsGain.gain.setTargetAtTime(this.muted ? 0 : 0.18, this.ctx.currentTime, 0.05);
        return this.muted;
    }

    startAmbient() {
        if (this.ambientRunning || !this.ctx) return;
        this.ambientRunning = true;

        const bufferSize = this.ctx.sampleRate * 3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(90, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        noise.connect(filter);
        filter.connect(this.ambientGain);
        noise.start();
    }

    playKeyClick() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        const freq = 1200 + Math.random() * 800;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.025);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.025);
    }

    playTradeOpen() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    playTradeWin() {
        if (this.muted || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + (idx * 0.08);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

            osc.connect(gain);
            gain.connect(this.effectsGain);
            osc.start(now);
            osc.stop(now + 0.25);
        });
    }

    playTradeLoss() {
        if (this.muted || !this.ctx) return;
        const notes = [440.0, 370.0, 311.13];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + (idx * 0.1);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.effectsGain);
            osc.start(now);
            osc.stop(now + 0.2);
        });
    }

    playClick() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.04);
    }
}

window.soundEngine = new SoundEngine();

