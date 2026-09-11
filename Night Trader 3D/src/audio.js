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

    playChip() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.035);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.035);
    }

    playCard() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playWin() {
        this.playTradeWin();
    }

    playLoss() {
        this.playTradeLoss();
    }

    playBigWin() {
        if (this.muted || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + (idx * 0.07);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.effectsGain);
            osc.start(now);
            osc.stop(now + 0.35);
        });
    }

    playReelSpin() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.02);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.02);
    }

    playReelStop() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playRouletteSpin() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.03);
    }

    playLighter() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(3200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playSmoke() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.6;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, now);
        filter.Q.setValueAtTime(1.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.effectsGain);
        noise.start(now);
    }

    playCigaretteInhale() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = 1.4;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            let crackle = 0;
            if (Math.random() < 0.035) {
                crackle = (Math.random() * 2 - 1) * 0.45;
            }
            const wind = (Math.random() * 2 - 1) * 0.15;
            const env = Math.sin(t * Math.PI);
            data[i] = (wind + crackle) * env;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.linearRampToValueAtTime(1800, now + duration * 0.6);
        filter.frequency.linearRampToValueAtTime(1000, now + duration);
        filter.Q.setValueAtTime(1.8, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.12, now + duration * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.effectsGain);
        source.start(now);
        source.stop(now + duration);
    }

    playCigaretteExhale() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = 1.8;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const env = Math.sin(t * Math.PI) * Math.exp(-t * 1.5);
            data[i] = (Math.random() * 2 - 1) * env * 0.2;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, now);
        filter.frequency.exponentialRampToValueAtTime(350, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.effectsGain);
        source.start(now);
        source.stop(now + duration);
    }

    playDrink() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const time = now + (i * 0.09);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 - (i * 80), time);
            osc.frequency.exponentialRampToValueAtTime(300, time + 0.06);

            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

            osc.connect(gain);
            gain.connect(this.effectsGain);
            osc.start(time);
            osc.stop(time + 0.06);
        }
    }

    playCough() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        for (let burst = 0; burst < 3; burst++) {
            const t = now + (burst * 0.28);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180 + Math.random() * 40, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.14);

            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

            osc.connect(gain);
            gain.connect(this.effectsGain);
            osc.start(t);
            osc.stop(t + 0.16);
        }
    }

    playMiningFans(enabled) {
        if (!this.ctx) return;
        if (!enabled) {
            if (this.miningFanGain) {
                this.miningFanGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
            }
            return;
        }

        if (this.miningFanRunning) {
            if (this.miningFanGain) {
                this.miningFanGain.gain.setTargetAtTime(this.muted ? 0 : 0.05, this.ctx.currentTime, 0.2);
            }
            return;
        }

        this.miningFanRunning = true;
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(420, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

        this.miningFanGain = this.ctx.createGain();
        this.miningFanGain.gain.setValueAtTime(this.muted ? 0 : 0.05, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(this.miningFanGain);
        this.miningFanGain.connect(this.effectsGain);
        noise.start();
    }

    playBoxOpen() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.effectsGain);
        noise.start(now);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);
        oscGain.gain.setValueAtTime(0.12, now + 0.04);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(oscGain);
        oscGain.connect(this.effectsGain);
        osc.start(now + 0.04);
        osc.stop(now + 0.16);
    }

    playPcieSnap() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(2400, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.03);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc1.connect(gain1);
        gain1.connect(this.effectsGain);
        osc1.start(now);
        osc1.stop(now + 0.03);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(450, now + 0.025);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gain2.gain.setValueAtTime(0.2, now + 0.025);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc2.connect(gain2);
        gain2.connect(this.effectsGain);
        osc2.start(now + 0.025);
        osc2.stop(now + 0.08);
    }

    playPcieRemove() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.effectsGain);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    playRouletteSpin() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = 4.2;
        const totalClicks = 32;
        for (let i = 0; i < totalClicks; i++) {
            const progress = i / totalClicks;
            const timeOffset = Math.pow(progress, 1.8) * duration;
            const time = now + timeOffset;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400 - progress * 400, time);
            osc.frequency.exponentialRampToValueAtTime(600, time + 0.02);
            gain.gain.setValueAtTime(0.04, time);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);
            osc.connect(gain);
            gain.connect(this.effectsGain);
            osc.start(time);
            osc.stop(time + 0.02);
        }
    }

    playRouletteDrop() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const time = now + (i * 0.08);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(900 - i * 150, time);
            osc.frequency.exponentialRampToValueAtTime(400, time + 0.04);
            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
            osc.connect(gain);
            gain.connect(this.effectsGain);
            osc.start(time);
            osc.stop(time + 0.04);
        }
    }
}

window.soundEngine = new SoundEngine();

