class EchoAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.3;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
        } catch (e) {}
    }

    ensureContext() {
        if (!this.initialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playBeamShot() {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);

        gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);

        this.playNoise(0.1, 2400, 0.2);
    }

    playEchoPing(distance = 5) {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const delayTime = Math.min(0.25, Math.max(0.02, distance * 0.008));
        const now = this.ctx.currentTime + delayTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = Math.max(220, 1100 - distance * 28);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.12);

        const vol = Math.max(0.05, 0.35 - distance * 0.008);
        gain.gain.setValueAtTime(this.masterVolume * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    playRadialPulse() {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.7);

        gain.gain.setValueAtTime(this.masterVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.72);

        this.playNoise(0.45, 1200, 0.4);
    }

    playBeaconCollect() {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.08;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(this.masterVolume * 0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.41);
        });
    }

    playEnergyEmpty() {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.setValueAtTime(70, now + 0.05);

        gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);
    }

    playVictory() {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chords = [
            [440, 554, 659],
            [493, 622, 740],
            [554, 698, 830],
            [659, 830, 987],
            [880, 1108, 1318]
        ];

        chords.forEach((chord, step) => {
            const t = now + step * 0.18;
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(this.masterVolume * 0.25, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.52);
            });
        });
    }

    playNoise(duration = 0.1, filterFreq = 1200, volume = 0.2) {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.masterVolume * volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }
}

window.echoAudio = new EchoAudio();

