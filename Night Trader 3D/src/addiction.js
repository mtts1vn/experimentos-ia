class AddictionEngine {
    constructor() {
        this.nicotine = 80;
        this.alcohol = 0;
        this.stress = 20;
        this.typingBoost = 0;
        this.isCoughing = false;
        this.lastCoughTime = Date.now();
        this.tickInterval = null;
        this.jitterActive = false;
        this.loadState();
        this.init();
    }

    init() {
        this.startLoop();
        this.setupPointerJitter();
    }

    loadState() {
        try {
            const raw = localStorage.getItem('night_trader_addiction_state');
            if (raw) {
                const data = JSON.parse(raw);
                this.nicotine = data.nicotine !== undefined ? data.nicotine : 80;
                this.alcohol = data.alcohol !== undefined ? data.alcohol : 0;
                this.stress = data.stress !== undefined ? data.stress : 20;
            }
        } catch (e) {}
    }

    saveState() {
        try {
            const data = {
                nicotine: this.nicotine,
                alcohol: this.alcohol,
                stress: this.stress
            };
            localStorage.setItem('night_trader_addiction_state', JSON.stringify(data));
        } catch (e) {}
    }

    startLoop() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.tickInterval = setInterval(() => {
            this.tick();
        }, 2000);
    }

    tick() {
        this.nicotine = Math.max(0, this.nicotine - 0.45);
        this.alcohol = Math.max(0, this.alcohol - 0.6);
        this.stress = Math.min(100, Math.max(0, this.stress + (this.nicotine < 25 ? 0.4 : -0.2)));
        if (this.typingBoost > 0) {
            this.typingBoost = Math.max(0, this.typingBoost - 2);
        }

        this.checkWithdrawal();
        this.updateHUD();
        this.saveState();
    }

    checkWithdrawal() {
        const isLowNicotine = this.nicotine < 25;
        this.jitterActive = isLowNicotine;

        const terminal = document.querySelector('.desktop-terminal-container');
        if (terminal) {
            terminal.classList.toggle('hand-shaking', isLowNicotine);
        }

        const now = Date.now();
        if (this.nicotine < 20 && !this.isCoughing && (now - this.lastCoughTime > 45000)) {
            if (Math.random() < 0.45) {
                this.triggerCoughFit();
            }
        }
    }

    setupPointerJitter() {
        let lastJitter = 0;
        window.addEventListener('mousemove', (e) => {
            if (!this.jitterActive || this.isCoughing) return;
            const now = performance.now();
            if (now - lastJitter > 60) {
                lastJitter = now;
                const intensity = (25 - this.nicotine) / 25;
                const jitterX = (Math.random() - 0.5) * 8 * intensity;
                const jitterY = (Math.random() - 0.5) * 8 * intensity;
                if (window.roomScene && window.roomScene.camera) {
                    window.roomScene.camera.position.x += jitterX * 0.002;
                    window.roomScene.camera.position.y += jitterY * 0.002;
                }
            }
        }, { passive: true });
    }

    triggerCoughFit() {
        if (this.isCoughing) return;
        this.isCoughing = true;
        this.lastCoughTime = Date.now();

        if (window.soundEngine && typeof window.soundEngine.playCough === 'function') {
            window.soundEngine.playCough();
        }

        const overlay = document.createElement('div');
        overlay.className = 'cough-overlay cough-screen-shake';
        overlay.innerHTML = '<div class="cough-banner">' +
            '<span class="cough-icon">🫁 💥</span>' +
            '<span class="cough-text">* COF! COF! COF! *</span>' +
            '<span class="cough-sub">Tirando a mao do mouse para tossir...</span>' +
        '</div>';
        document.body.appendChild(overlay);

        const terminal = document.querySelector('.desktop-terminal-container');
        if (terminal) terminal.classList.add('cough-disable-input');

        setTimeout(() => {
            if (overlay.parentElement) overlay.remove();
            if (terminal) terminal.classList.remove('cough-disable-input');
            this.isCoughing = false;
        }, 1800);
    }

    smokeCigarette() {
        if (!window.storeEngine || window.storeEngine.getOwnedQuantity('cigarettes') <= 0) {
            this.showToast('Sem cigarros no inventario!', 'error');
            return;
        }

        window.storeEngine.inventory.cigarettes--;
        window.storeEngine.saveInventory();

        if (window.soundEngine) {
            if (window.soundEngine.playLighter) window.soundEngine.playLighter();
            setTimeout(() => {
                if (window.soundEngine.playSmoke) window.soundEngine.playSmoke();
            }, 300);
        }

        this.nicotine = 100;
        this.stress = Math.max(0, this.stress - 30);
        this.jitterActive = false;

        const terminal = document.querySelector('.desktop-terminal-container');
        if (terminal) terminal.classList.remove('hand-shaking');

        if (window.roomScene && typeof window.roomScene.onSmokeTriggered === 'function') {
            window.roomScene.onSmokeTriggered();
        }

        this.showToast('Voce acendeu um cigarro Lucky Strike. A tremedeira e a tosse pararam.', 'success');
        this.updateHUD();
        this.saveState();
    }

    drinkWhisky() {
        if (!window.storeEngine || window.storeEngine.getOwnedQuantity('whisky') <= 0) {
            this.showToast('Sem doses de whisky no inventario!', 'error');
            return;
        }

        window.storeEngine.inventory.whisky--;
        window.storeEngine.saveInventory();

        if (window.soundEngine && window.soundEngine.playDrink) {
            window.soundEngine.playDrink();
        }

        this.alcohol = Math.min(100, this.alcohol + 35);
        this.stress = Math.max(0, this.stress - 40);

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }

        this.showToast('Voce bebeu uma dose de Johnnie Walker Black. Estresse reduzido.', 'success');
        this.updateHUD();
        this.saveState();
    }

    drinkEnergy() {
        if (!window.storeEngine || window.storeEngine.getOwnedQuantity('energy_drink') <= 0) {
            this.showToast('Sem energetico no inventario!', 'error');
            return;
        }

        window.storeEngine.inventory.energy_drink--;
        window.storeEngine.saveInventory();

        if (window.soundEngine && window.soundEngine.playDrink) {
            window.soundEngine.playDrink();
        }

        this.typingBoost = 100;
        this.showToast('Monster Energy ingerido! Digitacao acelerada no Copywriter.', 'success');
        this.updateHUD();
        this.saveState();
    }

    drinkCoffee() {
        if (!window.storeEngine || window.storeEngine.getOwnedQuantity('coffee') <= 0) {
            this.showToast('Sem cafe expresso no inventario!', 'error');
            return;
        }

        window.storeEngine.inventory.coffee--;
        window.storeEngine.saveInventory();

        if (window.soundEngine && window.soundEngine.playDrink) {
            window.soundEngine.playDrink();
        }

        this.stress = Math.max(0, this.stress - 15);
        this.showToast('Cafe Expresso Italiano tomado! Foco restaurado.', 'success');
        this.updateHUD();
        this.saveState();
    }

    updateHUD() {
        const nicBar = document.getElementById('hud-nicotine-fill');
        const alcBar = document.getElementById('hud-alcohol-fill');
        const statusLabel = document.getElementById('hud-vitals-status');

        if (nicBar) nicBar.style.width = Math.min(100, Math.max(0, this.nicotine)) + '%';
        if (alcBar) alcBar.style.width = Math.min(100, Math.max(0, this.alcohol)) + '%';

        if (statusLabel) {
            if (this.nicotine < 25) {
                statusLabel.textContent = 'ABSTINENCIA (TREMEDEIRA)';
                statusLabel.className = 'vitals-badge badge-danger';
            } else if (this.alcohol > 60) {
                statusLabel.textContent = 'RELAXADO (ALCOOL)';
                statusLabel.className = 'vitals-badge badge-warning';
            } else {
                statusLabel.textContent = 'ESTAVEL';
                statusLabel.className = 'vitals-badge badge-ok';
            }
        }
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'trade-toast ' + (type === 'success' ? 'toast-win' : (type === 'info' ? 'toast-tie' : 'toast-loss'));
        toast.innerHTML = '<div class="toast-title">SISTEMA VITAL DO TRADER</div><div class="toast-desc">' + msg + '</div>';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}

window.AddictionEngine = AddictionEngine;
window.addictionEngine = new AddictionEngine();