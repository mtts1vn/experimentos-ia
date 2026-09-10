class MiningEngine {
    constructor() {
        this.isRunning = true;
        this.unminedBtc = 0;
        this.totalBtcMined = 0;
        this.totalHashrate = 0;
        this.totalPower = 0;
        this.rigTemp = 42;
        this.lastTickTime = Date.now();
        this.tickInterval = null;
        this.eventsBound = false;
        this.loadState();
        this.calculateHardwareStats();
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
        this.startMiningLoop();
    }

    loadState() {
        try {
            const raw = localStorage.getItem('night_trader_mining_state');
            if (raw) {
                const data = JSON.parse(raw);
                this.isRunning = data.isRunning !== undefined ? data.isRunning : true;
                this.unminedBtc = data.unminedBtc || 0;
                this.totalBtcMined = data.totalBtcMined || 0;
            }
        } catch (e) {}
    }

    saveState() {
        try {
            const data = {
                isRunning: this.isRunning,
                unminedBtc: this.unminedBtc,
                totalBtcMined: this.totalBtcMined
            };
            localStorage.setItem('night_trader_mining_state', JSON.stringify(data));
        } catch (e) {}
    }

    calculateHardwareStats() {
        let hashrate = 0;
        let power = 0;
        if (window.storeEngine && window.storeEngine.inventory) {
            const inv = window.storeEngine.inventory;
            if (inv.gpu_1660) { hashrate += inv.gpu_1660 * 60; power += inv.gpu_1660 * 125; }
            if (inv.gpu_3070) { hashrate += inv.gpu_3070 * 140; power += inv.gpu_3070 * 220; }
            if (inv.gpu_4090) { hashrate += inv.gpu_4090 * 380; power += inv.gpu_4090 * 450; }
            if (inv.asic_s19) { hashrate += inv.asic_s19 * 850; power += inv.asic_s19 * 3250; }
        }
        this.totalHashrate = hashrate;
        this.totalPower = power;
        this.rigTemp = hashrate > 0 && this.isRunning ? Math.min(84, 45 + Math.floor(hashrate / 40)) : 34;

        if (window.soundEngine && typeof window.soundEngine.playMiningFans === 'function') {
            window.soundEngine.playMiningFans(this.isRunning && this.totalHashrate > 0);
        }
    }

    onHardwareUpdated() {
        this.calculateHardwareStats();
        this.render();
    }

    startMiningLoop() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.lastTickTime = Date.now();
        this.tickInterval = setInterval(() => {
            this.tick();
        }, 1000);
    }

    tick() {
        const now = Date.now();
        const deltaSec = (now - this.lastTickTime) / 1000;
        this.lastTickTime = now;

        if (this.isRunning && this.totalHashrate > 0) {
            const btcPerSec = (this.totalHashrate / 1000) * 0.000000035;
            const mined = btcPerSec * deltaSec;
            this.unminedBtc += mined;
            this.totalBtcMined += mined;
            this.saveState();
        }

        this.updateLiveDisplays();
    }

    getBtcPriceInBrl() {
        if (window.tradingEngine && window.tradingEngine.assets) {
            const btc = window.tradingEngine.assets.find(a => a.symbol === 'BTC/USDT' || a.id === 'btc');
            if (btc && btc.price) return btc.price;
        }
        return 385000.00;
    }

    getEstimatedBrlValue() {
        return this.unminedBtc * this.getBtcPriceInBrl();
    }

    transferBtcToWallet() {
        if (this.unminedBtc <= 0.000001) {
            this.showToast('Nenhum Bitcoin minerado disponivel para transferir!', 'error');
            return;
        }

        const brlAmount = this.getEstimatedBrlValue();
        const btcTransferred = this.unminedBtc;
        this.unminedBtc = 0;
        this.saveState();

        if (window.tradingEngine && window.tradingEngine.wallet) {
            window.tradingEngine.wallet.balance += brlAmount;
            window.tradingEngine.wallet.totalProfit += brlAmount;
            if (window.tradingEngine.saveState) {
                window.tradingEngine.saveState();
            } else if (window.tradingEngine.saveWallet) {
                window.tradingEngine.saveWallet();
            }
        }

        if (window.desktopUI) {
            if (typeof window.desktopUI.updateHeader === 'function') window.desktopUI.updateHeader();
            if (typeof window.desktopUI.updateExchangeSummary === 'function') window.desktopUI.updateExchangeSummary();
        }

        if (window.soundEngine && window.soundEngine.playWin) {
            window.soundEngine.playWin();
        }

        const btcStr = btcTransferred.toFixed(7);
        const brlStr = brlAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        this.showToast('Transferido ' + btcStr + ' BTC (~R$ ' + brlStr + ') para sua carteira!', 'success');
        this.render();
    }

    togglePower() {
        this.isRunning = !this.isRunning;
        this.saveState();
        this.calculateHardwareStats();
        if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
        this.render();
        const statusStr = this.isRunning ? 'LIGADA' : 'DESLIGADA';
        this.showToast('Rig de mineracao ' + statusStr, this.isRunning ? 'success' : 'info');
    }

    bindEvents() {
        this.eventsBound = true;

        const btnTransfer = document.getElementById('btn-mining-transfer');
        if (btnTransfer) {
            btnTransfer.addEventListener('click', () => this.transferBtcToWallet());
        }

        const btnToggle = document.getElementById('btn-mining-power-toggle');
        if (btnToggle) {
            btnToggle.addEventListener('click', () => this.togglePower());
        }
    }

    render() {
        if (!this.eventsBound) this.bindEvents();
        this.calculateHardwareStats();
        this.updateLiveDisplays();
        this.renderGpuList();
    }

    updateLiveDisplays() {
        const hashrateEl = document.getElementById('mining-hashrate-val');
        const btcUnminedEl = document.getElementById('mining-unmined-btc-val');
        const brlEstEl = document.getElementById('mining-unmined-brl-val');
        const powerEl = document.getElementById('mining-power-val');
        const tempEl = document.getElementById('mining-temp-val');
        const statusEl = document.getElementById('mining-status-badge');
        const btnToggle = document.getElementById('btn-mining-power-toggle');

        if (hashrateEl) {
            hashrateEl.textContent = this.totalHashrate.toLocaleString('pt-BR') + ' MH/s';
        }

        if (btcUnminedEl) {
            btcUnminedEl.textContent = this.unminedBtc.toFixed(8) + ' BTC';
        }

        if (brlEstEl) {
            const brl = this.getEstimatedBrlValue();
            brlEstEl.textContent = '~ R$ ' + brl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        if (powerEl) {
            powerEl.textContent = (this.isRunning ? this.totalPower : 0) + ' W';
        }

        if (tempEl) {
            tempEl.textContent = this.rigTemp + '°C';
            tempEl.className = this.rigTemp > 75 ? 'stat-val text-neg' : 'stat-val text-pos';
        }

        if (statusEl) {
            if (!this.isRunning) {
                statusEl.textContent = 'DESLIGADA';
                statusEl.className = 'status-badge badge-offline';
            } else if (this.totalHashrate === 0) {
                statusEl.textContent = 'SEM GPUS';
                statusEl.className = 'status-badge badge-warning';
            } else {
                statusEl.textContent = 'MINERANDO';
                statusEl.className = 'status-badge badge-online';
            }
        }

        if (btnToggle) {
            btnToggle.textContent = this.isRunning ? 'DESLIGAR RIG' : 'LIGAR RIG';
            btnToggle.className = this.isRunning ? 'btn-power-off' : 'btn-power-on';
        }
    }

    renderGpuList() {
        const container = document.getElementById('mining-active-gpus-list');
        if (!container) return;

        if (this.totalHashrate === 0) {
            container.innerHTML = '<div class="mining-no-gpus">' +
                '<span>Nenhuma GPU ou ASIC instalado na Rig.</span>' +
                '<p>Abra o <strong>DarkStore</strong> na Area de Trabalho e compre placas de video para iniciar a mineracao de Bitcoin.</p>' +
            '</div>';
            return;
        }

        const inv = window.storeEngine ? window.storeEngine.inventory : {};
        const items = [
            { id: 'gpu_1660', name: 'NVIDIA GTX 1660 Super', count: inv.gpu_1660 || 0, hashrate: 60, icon: '📼' },
            { id: 'gpu_3070', name: 'NVIDIA RTX 3070 8GB', count: inv.gpu_3070 || 0, hashrate: 140, icon: '🎴' },
            { id: 'gpu_4090', name: 'NVIDIA RTX 4090 Ti 24GB', count: inv.gpu_4090 || 0, hashrate: 380, icon: '⚡' },
            { id: 'asic_s19', name: 'Antminer S19 Pro 110TH', count: inv.asic_s19 || 0, hashrate: 850, icon: '🏭' }
        ].filter(i => i.count > 0);

        container.innerHTML = items.map(item => '<div class="mining-gpu-card">' +
            '<span class="gpu-card-icon">' + item.icon + '</span>' +
            '<div class="gpu-card-details">' +
                '<span class="gpu-card-name">' + item.name + '</span>' +
                '<span class="gpu-card-specs">Quantidade: <strong>' + item.count + 'x</strong> | Total: <strong>' + (item.count * item.hashrate) + ' MH/s</strong></span>' +
            '</div>' +
            '<div class="gpu-card-status">' +
                '<span class="dot-online ' + (this.isRunning ? 'pulse' : 'off') + '">●</span>' +
                '<span>' + (this.isRunning ? 'ATIVO' : 'STANDBY') + '</span>' +
            '</div>' +
        '</div>').join('');
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'trade-toast ' + (type === 'success' ? 'toast-win' : (type === 'info' ? 'toast-tie' : 'toast-loss'));
        toast.innerHTML = '<div class="toast-title">CRYPTOMINER PRO</div><div class="toast-desc">' + msg + '</div>';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}

window.MiningEngine = MiningEngine;
window.miningEngine = new MiningEngine();