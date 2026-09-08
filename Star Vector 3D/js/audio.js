class VectorAudio {
    constructor() {
        this.ctx = null;
        this.engineOsc = null;
        this.engineSub = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.boostGain = null;
        this.boostNoise = null;
        this.isInitialized = false;
        this.lastBeaconTime = 0;
    }

    init() {
        if (this.isInitialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

        this.engineSub = this.ctx.createOscillator();
        this.engineSub.type = 'triangle';
        this.engineSub.frequency.setValueAtTime(27.5, this.ctx.currentTime);

        this.engineOsc.connect(this.engineFilter);
        this.engineSub.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        this.engineOsc.start();
        this.engineSub.start();

        this.setupBoostNoise();
        this.isInitialized = true;
    }

    setupBoostNoise() {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        this.boostNoise = this.ctx.createBufferSource();
        this.boostNoise.buffer = noiseBuffer;
        this.boostNoise.loop = true;

        const boostFilter = this.ctx.createBiquadFilter();
        boostFilter.type = 'bandpass';
        boostFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
        boostFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

        this.boostGain = this.ctx.createGain();
        this.boostGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

        this.boostNoise.connect(boostFilter);
        boostFilter.connect(this.boostGain);
        this.boostGain.connect(this.ctx.destination);
        this.boostNoise.start();
    }

    updateEngine(speedRatio, isBoosting) {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const baseFreq = 48 + speedRatio * 85;
        this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
        this.engineSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);

        const targetVolume = Math.min(0.2, 0.03 + speedRatio * 0.15);
        this.engineGain.gain.setTargetAtTime(targetVolume, now, 0.08);
        this.engineFilter.frequency.setTargetAtTime(120 + speedRatio * 380, now, 0.08);

        if (isBoosting) {
            this.boostGain.gain.setTargetAtTime(0.22, now, 0.06);
        } else {
            this.boostGain.gain.setTargetAtTime(0.0001, now, 0.12);
        }
    }

    triggerBeaconPing(distance, facingScore) {
        if (!this.isInitialized || !this.ctx) return;
        const now = performance.now();
        const interval = Math.max(700, Math.min(2600, distance * 3.5));
        if (now - this.lastBeaconTime < interval) return;
        this.lastBeaconTime = now;

        const audioNow = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const basePitch = facingScore > 0.8 ? 880 : 520;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(basePitch, audioNow);
        osc.frequency.exponentialRampToValueAtTime(basePitch * 1.35, audioNow + 0.12);

        const volume = Math.max(0.02, Math.min(0.16, 0.22 - distance / 2500));
        gain.gain.setValueAtTime(volume, audioNow);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioNow + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(audioNow);
        osc.stop(audioNow + 0.2);
    }

    playDockingClamp() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, now + 0.1);
        osc2.frequency.setValueAtTime(880, now + 0.22);
        osc2.frequency.setValueAtTime(1174, now + 0.35);

        gain2.gain.setValueAtTime(0.0001, now);
        gain2.gain.setValueAtTime(0.18, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.55);
    }

    playUndock() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.38);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
    }

    playImpact(intensity = 0.5) {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const clamped = Math.max(0.1, Math.min(1.0, intensity));

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180 * clamped + 70, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);

        gain.gain.setValueAtTime(0.4 * clamped, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);

        const noiseOsc = this.ctx.createOscillator();
        const noiseFilter = this.ctx.createBiquadFilter();
        const noiseGain = this.ctx.createGain();

        noiseOsc.type = 'square';
        noiseOsc.frequency.setValueAtTime(45, now);
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(320, now);
        noiseFilter.Q.setValueAtTime(2.0, now);

        noiseGain.gain.setValueAtTime(0.25 * clamped, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        noiseOsc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseOsc.start(now);
        noiseOsc.stop(now + 0.28);
    }

    playExplosion() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(22, now + 1.2);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.4);

        const oscSub = this.ctx.createOscillator();
        const gainSub = this.ctx.createGain();
        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(65, now);
        oscSub.frequency.exponentialRampToValueAtTime(18, now + 1.5);

        gainSub.gain.setValueAtTime(0.7, now);
        gainSub.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        oscSub.connect(gainSub);
        gainSub.connect(this.ctx.destination);
        oscSub.start(now);
        oscSub.stop(now + 1.65);
    }

    playLaser() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1250, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    playAsteroidExplosion(distance = 100) {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const volume = Math.max(0.08, Math.min(0.45, 0.45 - (distance / 1200)));

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.65);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.75);

        const noiseOsc = this.ctx.createOscillator();
        const noiseFilter = this.ctx.createBiquadFilter();
        const noiseGain = this.ctx.createGain();

        noiseOsc.type = 'square';
        noiseOsc.frequency.setValueAtTime(60, now);
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(260, now);
        noiseFilter.Q.setValueAtTime(1.8, now);

        noiseGain.gain.setValueAtTime(volume * 0.75, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        noiseOsc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseOsc.start(now);
        noiseOsc.stop(now + 0.6);
    }

    playFragmentHit(distance = 100) {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const volume = Math.max(0.06, Math.min(0.35, 0.35 - (distance / 1200)));

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(540, now);
        osc2.frequency.exponentialRampToValueAtTime(110, now + 0.2);

        gain2.gain.setValueAtTime(volume * 0.7, now);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.23);
    }

    playGrappleLaunch() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1280, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.28);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);

        const noiseOsc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const noiseGain = this.ctx.createGain();

        noiseOsc.type = 'square';
        noiseOsc.frequency.setValueAtTime(140, now);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);

        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

        noiseOsc.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noiseOsc.start(now);
        noiseOsc.stop(now + 0.28);
    }

    playGrappleLatch() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1850, now);
        osc2.frequency.exponentialRampToValueAtTime(440, now + 0.25);

        gain2.gain.setValueAtTime(0.35, now);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.32);
    }

    playGrappleDetach() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playWinchSound() {
        if (!this.isInitialized || !this.ctx) return;
        const now = performance.now();
        if (this.lastWinchTime && now - this.lastWinchTime < 90) return;
        this.lastWinchTime = now;

        const audioNow = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260 + Math.random() * 40, audioNow);
        osc.frequency.linearRampToValueAtTime(380 + Math.random() * 50, audioNow + 0.08);

        gain.gain.setValueAtTime(0.2, audioNow);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioNow + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(audioNow);
        osc.stop(audioNow + 0.11);
    }

    playCableSnap() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2600, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(3200, now);
        osc2.frequency.exponentialRampToValueAtTime(400, now + 0.08);

        gain2.gain.setValueAtTime(0.35, now);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.11);
    }

    playMissileLaunch() {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.35);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(2800, now + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.48);

        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(95, now);
        sub.frequency.exponentialRampToValueAtTime(45, now + 0.4);

        subGain.gain.setValueAtTime(0.5, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        sub.connect(subGain);
        subGain.connect(this.ctx.destination);
        sub.start(now);
        sub.stop(now + 0.48);
    }

    playHanabiBoom(generation = 1, distance = 100) {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const atten = Math.max(0.08, Math.min(1.0, 1.0 - (distance / 650)));

        if (generation <= 1) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(88, now);
            osc.frequency.exponentialRampToValueAtTime(22, now + 1.1);

            gain.gain.setValueAtTime(0.75 * atten, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.3);

            const crackle = this.ctx.createOscillator();
            const crackleGain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            crackle.type = 'sawtooth';
            crackle.frequency.setValueAtTime(450, now);
            crackle.frequency.exponentialRampToValueAtTime(80, now + 0.4);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.Q.setValueAtTime(3.0, now);

            crackleGain.gain.setValueAtTime(0.4 * atten, now);
            crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

            crackle.connect(filter);
            filter.connect(crackleGain);
            crackleGain.connect(this.ctx.destination);
            crackle.start(now);
            crackle.stop(now + 0.5);
        } else {
            const pitch = 300 + generation * 220 + Math.random() * 180;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(pitch, now);
            osc.frequency.exponentialRampToValueAtTime(pitch * 0.35, now + 0.16);

            const vol = Math.max(0.05, (0.35 - generation * 0.05)) * atten;
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    }
}

