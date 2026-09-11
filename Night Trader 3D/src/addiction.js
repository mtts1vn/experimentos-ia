class AddictionEngine {
    constructor() {
        this.nicotine = 0;
        this.addictionLevel = 0;
        this.cigarettesSmokedTotal = 0;
        this.cigarettesSmokedRecent = 0;
        this.alcohol = 0;
        this.stress = 10;
        this.typingBoost = 0;
        this.isCoughing = false;
        this.lastCoughTime = Date.now();
        this.tickInterval = null;
        this.jitterActive = false;
        this.nextDrunkWaveTime = Date.now() + 10000;
        this.isDrunkWaveActive = false;
        this.loadState();
        this.init();
    }

    init() {
        this.startLoop();
        this.setupPointerJitter();
        this.setupQuickSmoke();
    }

    setupQuickSmoke() {
        const nicItem = document.getElementById('status-item-nicotine');
        if (nicItem) {
            nicItem.addEventListener('click', () => {
                this.smokeCigarette();
            });
        }
    }

    loadState() {
        try {
            const raw = localStorage.getItem('night_trader_addiction_state');
            if (raw) {
                const data = JSON.parse(raw);
                this.addictionLevel = typeof data.addictionLevel === 'number' ? data.addictionLevel : 0;
                this.cigarettesSmokedTotal = typeof data.cigarettesSmokedTotal === 'number' ? data.cigarettesSmokedTotal : 0;
                this.cigarettesSmokedRecent = typeof data.cigarettesSmokedRecent === 'number' ? data.cigarettesSmokedRecent : 0;
                this.alcohol = typeof data.alcohol === 'number' ? data.alcohol : 0;
                this.stress = typeof data.stress === 'number' ? data.stress : 10;

                if (this.addictionLevel === 0 && this.cigarettesSmokedTotal === 0) {
                    this.nicotine = 0;
                } else {
                    this.nicotine = typeof data.nicotine === 'number' ? data.nicotine : 0;
                }
            }
        } catch (e) {}
    }

    saveState() {
        try {
            const data = {
                nicotine: this.nicotine,
                addictionLevel: this.addictionLevel,
                cigarettesSmokedTotal: this.cigarettesSmokedTotal,
                cigarettesSmokedRecent: this.cigarettesSmokedRecent,
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
        this.nicotine = Math.max(0, this.nicotine - 0.35);
        this.alcohol = Math.max(0, this.alcohol - 0.5);
        this.cigarettesSmokedRecent = Math.max(0, this.cigarettesSmokedRecent - 0.005);

        if (this.addictionLevel > 0 && this.nicotine < 10) {
            this.addictionLevel = Math.max(0, this.addictionLevel - 0.03);
        }

        if (this.typingBoost > 0) {
            this.typingBoost = Math.max(0, this.typingBoost - 2);
        }

        const isAddicted = this.addictionLevel >= 35;
        if (isAddicted) {
            if (this.nicotine < 25) {
                this.stress = Math.min(100, this.stress + 0.45);
            } else {
                this.stress = Math.max(5, this.stress - 0.2);
            }
        } else {
            this.stress = Math.max(5, this.stress - 0.25);
        }

        if (this.alcohol > 15) {
            const now = Date.now();
            if (now >= this.nextDrunkWaveTime && !this.isDrunkWaveActive) {
                this.triggerDrunkWave();
                this.nextDrunkWaveTime = now + 10000 + Math.random() * 15000;
            }
        } else if (this.isDrunkWaveActive) {
            this.clearDrunkWave();
        }

        this.checkWithdrawal();
        this.updateHUD();
        this.saveState();
    }

    checkWithdrawal() {
        const isAddicted = this.addictionLevel >= 35;
        const isLowNicotine = isAddicted && this.nicotine < 25;
        this.jitterActive = isLowNicotine;

        const terminal = document.querySelector('.desktop-terminal-container');
        if (terminal) {
            terminal.classList.toggle('hand-shaking', isLowNicotine);
        }

        const now = Date.now();
        if (isLowNicotine && this.nicotine < 18 && !this.isCoughing && (now - this.lastCoughTime > 45000)) {
            if (Math.random() < 0.35) {
                this.triggerCoughFit();
            }
        }
    }

    setupPointerJitter() {
        let lastJitter = 0;
        window.addEventListener('mousemove', (e) => {
            if (!this.jitterActive || this.isCoughing || this.addictionLevel < 35) return;
            const now = performance.now();
            if (now - lastJitter > 60) {
                lastJitter = now;
                const addictRatio = Math.min(1.0, this.addictionLevel / 100);
                const nicDeficit = (25 - this.nicotine) / 25;
                const intensity = addictRatio * nicDeficit;
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
            '<span class="cough-sub">Crise de tosse de fumante...</span>' +
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

    triggerDrunkWave() {
        if (this.isDrunkWaveActive) return;
        this.isDrunkWaveActive = true;

        const overlay = document.getElementById('drunk-screen-overlay');
        if (overlay) {
            overlay.classList.add('drunk-blur-active');
        }

        const intensity = Math.min(1.0, this.alcohol / 65);
        let elapsed = 0;
        const duration = 3800;

        const swayStep = () => {
            if (!this.isDrunkWaveActive) return;
            elapsed += 35;
            const t = elapsed / duration;
            if (t >= 1) {
                this.clearDrunkWave();
                return;
            }

            const angle = Math.sin(t * Math.PI * 2) * 0.024 * intensity;
            if (window.roomScene && window.roomScene.camera) {
                window.roomScene.camera.rotation.z = angle;
            }

            setTimeout(swayStep, 35);
        };
        swayStep();
    }

    clearDrunkWave() {
        this.isDrunkWaveActive = false;
        const overlay = document.getElementById('drunk-screen-overlay');
        if (overlay) {
            overlay.classList.remove('drunk-blur-active');
        }
        if (window.roomScene && window.roomScene.camera) {
            window.roomScene.camera.rotation.z = 0;
        }
    }

    smokeCigarette() {
        if (!window.storeEngine || window.storeEngine.getOwnedQuantity('cigarettes') <= 0) {
            this.showToast('Sem cigarros no inventario!', 'error');
            return;
        }

        window.storeEngine.inventory.cigarettes--;
        window.storeEngine.saveInventory();

        this.cigarettesSmokedTotal++;
        this.cigarettesSmokedRecent++;

        const previousAddiction = this.addictionLevel;
        if (this.cigarettesSmokedTotal === 1) {
            this.addictionLevel = 12;
        } else {
            this.addictionLevel = Math.min(100, this.addictionLevel + 16);
        }

        this.nicotine = 100;
        this.stress = Math.max(0, this.stress - 35);
        this.jitterActive = false;

        const terminal = document.querySelector('.desktop-terminal-container');
        if (terminal) terminal.classList.remove('hand-shaking');

        if (window.smokingViewModel) {
            window.smokingViewModel.startSmoking(28000);
        } else if (window.soundEngine && window.soundEngine.playLighter) {
            window.soundEngine.playLighter();
        }

        if (window.roomScene && typeof window.roomScene.onSmokeTriggered === 'function') {
            window.roomScene.onSmokeTriggered();
        }

        if (previousAddiction >= 35) {
            this.showToast('Voce acendeu um Lucky Strike. A abstinencia e a tremedeira cessaram.', 'success');
        } else if (this.addictionLevel >= 35) {
            this.showToast('Voce esta fumando com frequencia. O seu corpo comecou a criar dependencia quimica.', 'info');
        } else {
            this.showToast('Voce acendeu um Lucky Strike. Estresse reduzido.', 'success');
        }

        if (window.consumablesHotbar) {
            window.consumablesHotbar.update();
        }
        this.updateHUD();
        this.saveState();
    }

    onPuffTaken() {
        this.nicotine = Math.min(100, this.nicotine + 4);
        this.stress = Math.max(0, this.stress - 4);
        this.updateHUD();
    }

    drinkWhisky() {
        if (!window.storeEngine || window.storeEngine.getOwnedQuantity('whisky') <= 0) {
            this.showToast('Sem doses de whisky no inventario!', 'error');
            return;
        }

        window.storeEngine.inventory.whisky--;
        window.storeEngine.saveInventory();

        if (window.smokingViewModel && window.smokingViewModel.startDrinking) {
            window.smokingViewModel.startDrinking();
        } else if (window.soundEngine && window.soundEngine.playDrink) {
            window.soundEngine.playDrink();
        }

        this.alcohol = Math.min(100, this.alcohol + 35);
        this.stress = Math.max(0, this.stress - 40);

        setTimeout(() => {
            if (this.alcohol > 15) {
                this.triggerDrunkWave();
            }
        }, 3800);

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }

        if (window.consumablesHotbar) {
            window.consumablesHotbar.update();
        }

        this.showToast('Voce bebeu uma dose de Johnnie Walker Black. Relaxando...', 'success');
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
        if (window.consumablesHotbar) window.consumablesHotbar.update();
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
        if (window.consumablesHotbar) window.consumablesHotbar.update();
        this.showToast('Cafe Expresso Italiano tomado! Foco restaurado.', 'success');
        this.updateHUD();
        this.saveState();
    }

    updateHUD() {
        const nicBar = document.getElementById('hud-nicotine-fill');
        const alcBar = document.getElementById('hud-alcohol-fill');
        const statusLabel = document.getElementById('hud-vitals-status');

        if (nicBar) {
            nicBar.style.width = Math.min(100, Math.max(0, this.nicotine)) + '%';
        }

        if (alcBar) {
            alcBar.style.width = Math.min(100, Math.max(0, this.alcohol)) + '%';
        }

        if (statusLabel) {
            const isAddicted = this.addictionLevel >= 35;
            if (isAddicted && this.nicotine < 25) {
                statusLabel.textContent = 'ABSTINENCIA (TREMEDEIRA)';
                statusLabel.className = 'vitals-badge badge-danger';
            } else if (isAddicted && this.nicotine < 50) {
                statusLabel.textContent = 'VONTADE DE FUMAR';
                statusLabel.className = 'vitals-badge badge-warning';
            } else if (this.alcohol > 55) {
                statusLabel.textContent = 'BEBADO (TONTO)';
                statusLabel.className = 'vitals-badge badge-warning';
            } else if (this.alcohol > 20) {
                statusLabel.textContent = 'LEVEMENTE ALTERADO';
                statusLabel.className = 'vitals-badge badge-warning';
            } else if (isAddicted) {
                statusLabel.textContent = 'SACIADO';
                statusLabel.className = 'vitals-badge badge-ok';
            } else {
                statusLabel.textContent = 'SAUDAVEL';
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