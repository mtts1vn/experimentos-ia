class MiningEngine {
    constructor() {
        this.isRunning = true;
        this.totalHashrate = 0;
        this.totalPower = 0;
        this.farmTemp = 42;
        this.activeRigIndex = 0;
        this.activeTab = 'racks';
        this.lastTickTime = Date.now();
        this.tickInterval = null;
        this.eventsBound = false;

        this.availableCoins = [
            {
                id: 'btc',
                assetId: 'BTC_USDT',
                symbol: 'BTC',
                name: 'Bitcoin',
                icon: '₿',
                algorithm: 'SHA-256',
                difficultyDisplay: '88.50 T',
                globalHashrateDisplay: '670 EH/s',
                blockTime: 600,
                blockReward: 3.125,
                unitDecimals: 8,
                algoEfficiency: 0.000000035
            },
            {
                id: 'eth',
                assetId: 'ETH_USDT',
                symbol: 'ETH',
                name: 'Ethereum',
                icon: '⟠',
                algorithm: 'Ethash',
                difficultyDisplay: '185.20 GH',
                globalHashrateDisplay: '1.15 TH/s',
                blockTime: 13,
                blockReward: 2.05,
                unitDecimals: 6,
                algoEfficiency: 0.00000092
            },
            {
                id: 'doge',
                assetId: 'DOGE_USDT',
                symbol: 'DOGE',
                name: 'Dogecoin',
                icon: '🐕',
                algorithm: 'Scrypt',
                difficultyDisplay: '17.20 MH',
                globalHashrateDisplay: '1.20 TH/s',
                blockTime: 60,
                blockReward: 10000,
                unitDecimals: 2,
                algoEfficiency: 0.0084
            },
            {
                id: 'sol',
                assetId: 'SOL_USDT',
                symbol: 'SOL',
                name: 'Solana',
                icon: '☀️',
                algorithm: 'PoH Validator',
                difficultyDisplay: '432K Slots',
                globalHashrateDisplay: '2.4K TPS',
                blockTime: 0.4,
                blockReward: 0.05,
                unitDecimals: 5,
                algoEfficiency: 0.000015
            }
        ];

        this.selectedCoinId = 'btc';
        this.unminedCoins = { btc: 0, eth: 0, doge: 0, sol: 0 };
        this.totalMinedCoins = { btc: 0, eth: 0, doge: 0, sol: 0 };

        this.rigPresets = [
            { id: 'desk_left', name: 'Ao Lado da Bancada (Esquerda)', x: -2.5, z: -1.8, rotY: 0.45 },
            { id: 'window_corner', name: 'Canto da Janela Cyber (Vista da Cidade)', x: -2.6, z: -3.1, rotY: 0.1 },
            { id: 'shelf_side', name: 'Próximo à Estante de Livros', x: -3.0, z: -0.4, rotY: 1.57 },
            { id: 'bed_front', name: 'Frente da Cama (Canto Direito)', x: 0.8, z: 2.2, rotY: -1.2 },
            { id: 'lounge_corner', name: 'Lounge Cyberpunk', x: -1.8, z: 2.4, rotY: 2.3 }
        ];

        this.rigs = this.loadState();
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

    getActiveCoin() {
        return this.availableCoins.find(c => c.id === this.selectedCoinId) || this.availableCoins[0];
    }

    selectCoin(coinId) {
        const found = this.availableCoins.find(c => c.id === coinId);
        if (!found) return;

        this.selectedCoinId = coinId;
        this.saveState();

        if (window.soundEngine && window.soundEngine.playClick) {
            window.soundEngine.playClick();
        }

        this.showToast('Moeda de mineração alterada para: ' + found.name + ' (' + found.symbol + ')', 'info');

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }

        this.render();
    }

    loadState() {
        try {
            const raw = localStorage.getItem('night_trader_mining_state_v2');
            if (raw) {
                const data = JSON.parse(raw);
                this.isRunning = data.isRunning !== undefined ? data.isRunning : true;
                this.selectedCoinId = data.selectedCoinId || 'btc';

                if (data.unminedCoins && typeof data.unminedCoins === 'object') {
                    this.unminedCoins = Object.assign({ btc: 0, eth: 0, doge: 0, sol: 0 }, data.unminedCoins);
                } else if (data.unminedBtc) {
                    this.unminedCoins.btc = data.unminedBtc;
                }

                if (data.totalMinedCoins && typeof data.totalMinedCoins === 'object') {
                    this.totalMinedCoins = Object.assign({ btc: 0, eth: 0, doge: 0, sol: 0 }, data.totalMinedCoins);
                } else if (data.totalBtcMined) {
                    this.totalMinedCoins.btc = data.totalBtcMined;
                }

                if (Array.isArray(data.rigs) && data.rigs.length > 0) {
                    return data.rigs;
                }
            }
        } catch (e) {}

        return [
            {
                id: 'rig_1',
                name: 'Rig Rack Alpha (4 Slots)',
                type: 'rig_frame_4',
                slotsCount: 4,
                slots: [null, null, null, null],
                pos: { x: -2.5, y: 0, z: -1.8, rotY: 0.45 },
                presetId: 'desk_left',
                isRunning: true
            }
        ];
    }

    saveState() {
        try {
            const data = {
                isRunning: this.isRunning,
                selectedCoinId: this.selectedCoinId,
                unminedCoins: this.unminedCoins,
                totalMinedCoins: this.totalMinedCoins,
                rigs: this.rigs
            };
            localStorage.setItem('night_trader_mining_state_v2', JSON.stringify(data));
        } catch (e) {}
    }

    addNewRig(typeId, name, slotsCount) {
        const newIndex = this.rigs.length + 1;
        const preset = this.rigPresets[(newIndex - 1) % this.rigPresets.length] || this.rigPresets[0];
        const newRig = {
            id: 'rig_' + Date.now(),
            name: name || ('Rig Rack #' + newIndex),
            type: typeId || 'rig_frame_4',
            slotsCount: slotsCount || 4,
            slots: new Array(slotsCount || 4).fill(null),
            pos: { x: preset.x, y: 0, z: preset.z, rotY: preset.rotY },
            presetId: preset.id,
            isRunning: true
        };

        this.rigs.push(newRig);
        this.saveState();
        this.calculateHardwareStats();
        this.render();

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }
    }

    getGpuSpec(gpuId) {
        if (!gpuId) return null;
        if (window.storeEngine) {
            const it = window.storeEngine.getItem(gpuId);
            if (it) return it;
        }
        const fallback = {
            gpu_1660: { name: 'GTX 1660 Super', hashrate: 60, power: 125, icon: '📼' },
            gpu_3070: { name: 'RTX 3070 8GB', hashrate: 140, power: 220, icon: '🎴' },
            gpu_4090: { name: 'RTX 4090 Ti', hashrate: 380, power: 450, icon: '⚡' },
            asic_s19: { name: 'Antminer S19 Pro', hashrate: 850, power: 3250, icon: '🏭' }
        };
        return fallback[gpuId] || { name: gpuId, hashrate: 50, power: 100, icon: '⚡' };
    }

    slotGpu(rigId, slotIndex, gpuId) {
        const rig = this.rigs.find(r => r.id === rigId);
        if (!rig) return;
        if (!window.storeEngine || !window.storeEngine.inventory.uninstalled_hardware) return;

        const uninstalled = window.storeEngine.inventory.uninstalled_hardware;
        const itemIdx = uninstalled.indexOf(gpuId);
        if (itemIdx === -1) {
            this.showToast('Esta GPU nao esta mais disponivel no estoque desinstalado!', 'error');
            return;
        }

        uninstalled.splice(itemIdx, 1);
        window.storeEngine.saveInventory();

        if (rig.slots[slotIndex]) {
            uninstalled.push(rig.slots[slotIndex]);
            window.storeEngine.saveInventory();
        }

        rig.slots[slotIndex] = gpuId;
        this.saveState();
        this.calculateHardwareStats();

        if (window.soundEngine && window.soundEngine.playPcieSnap) {
            window.soundEngine.playPcieSnap();
        }

        const spec = this.getGpuSpec(gpuId);
        this.showToast('🔌 ' + spec.name + ' encaixada no Slot #' + (slotIndex + 1) + ' da ' + rig.name + '!', 'success');

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }

        this.render();
    }

    unslotGpu(rigId, slotIndex) {
        const rig = this.rigs.find(r => r.id === rigId);
        if (!rig) return;
        const gpuId = rig.slots[slotIndex];
        if (!gpuId) return;

        rig.slots[slotIndex] = null;
        if (!window.storeEngine.inventory.uninstalled_hardware) {
            window.storeEngine.inventory.uninstalled_hardware = [];
        }
        window.storeEngine.inventory.uninstalled_hardware.push(gpuId);
        window.storeEngine.saveInventory();

        this.saveState();
        this.calculateHardwareStats();

        if (window.soundEngine && window.soundEngine.playPcieRemove) {
            window.soundEngine.playPcieRemove();
        }

        const spec = this.getGpuSpec(gpuId);
        this.showToast('🔓 ' + spec.name + ' desencaixada e guardada no estoque.', 'info');

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }

        this.render();
    }

    setRigPreset(rigId, presetId) {
        const rig = this.rigs.find(r => r.id === rigId);
        const preset = this.rigPresets.find(p => p.id === presetId);
        if (!rig || !preset) return;

        rig.presetId = presetId;
        rig.pos = { x: preset.x, y: 0, z: preset.z, rotY: preset.rotY };
        this.saveState();

        if (window.soundEngine && window.soundEngine.playClick) {
            window.soundEngine.playClick();
        }

        this.showToast('📍 ' + rig.name + ' movida para: ' + preset.name, 'success');

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }

        this.render();
    }

    setRigFinePosition(rigId, x, z, rotY) {
        const rig = this.rigs.find(r => r.id === rigId);
        if (!rig) return;

        rig.pos.x = Math.max(-2.8, Math.min(2.8, parseFloat(x) || 0));
        rig.pos.z = Math.max(-2.8, Math.min(2.8, parseFloat(z) || 0));
        rig.pos.rotY = parseFloat(rotY) || 0;
        rig.presetId = 'custom';
        this.saveState();

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }
    }

    nudgeRig(rigId, dx, dz, dRotYDeg) {
        const rig = this.rigs.find(r => r.id === rigId);
        if (!rig) return;

        const currentRotDeg = (rig.pos.rotY * (180 / Math.PI)) + (dRotYDeg || 0);
        const newRotY = (currentRotDeg * Math.PI) / 180;
        const newX = (rig.pos.x || 0) + (dx || 0);
        const newZ = (rig.pos.z || 0) + (dz || 0);

        this.setRigFinePosition(rigId, newX, newZ, newRotY);
        this.render();
    }

    startMoveRigInFirstPerson(rigId) {
        if (!window.roomScene) return;

        const miningWin = document.querySelector('.desktop-window[data-window="mining"]');
        if (miningWin) {
            miningWin.classList.add('hidden');
        }

        if (typeof window.roomScene.startStandAnimation === 'function' && window.roomScene.state === 'pc') {
            window.roomScene.startStandAnimation();
        }

        setTimeout(() => {
            if (typeof window.roomScene.startMovingRig === 'function') {
                window.roomScene.startMovingRig(rigId);
            }
        }, 350);
    }

    toggleRigPower(rigId) {
        const rig = this.rigs.find(r => r.id === rigId);
        if (!rig) return;

        rig.isRunning = !rig.isRunning;
        this.saveState();
        this.calculateHardwareStats();

        if (window.soundEngine && window.soundEngine.playClick) {
            window.soundEngine.playClick();
        }

        this.showToast((rig.isRunning ? '⚡ ' : '🔌 ') + rig.name + ' ' + (rig.isRunning ? 'LIGADA' : 'DESLIGADA'), rig.isRunning ? 'success' : 'info');

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }

        this.render();
    }

    calculateHardwareStats() {
        let hashrate = 0;
        let power = 0;

        if (this.isRunning) {
            this.rigs.forEach(rig => {
                if (rig.isRunning) {
                    rig.slots.forEach(gpuId => {
                        if (gpuId) {
                            const spec = this.getGpuSpec(gpuId);
                            if (spec) {
                                hashrate += spec.hashrate || 0;
                                power += spec.power || 0;
                            }
                        }
                    });
                }
            });
        }

        this.totalHashrate = hashrate;
        this.totalPower = power;
        this.farmTemp = hashrate > 0 && this.isRunning ? Math.min(85, 42 + Math.floor(hashrate / 45)) : 32;

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

        const activeCoin = this.getActiveCoin();

        if (this.isRunning && this.totalHashrate > 0 && activeCoin) {
            const mined = (this.totalHashrate * activeCoin.algoEfficiency * (deltaSec / 10));
            this.unminedCoins[activeCoin.id] = (this.unminedCoins[activeCoin.id] || 0) + mined;
            this.totalMinedCoins[activeCoin.id] = (this.totalMinedCoins[activeCoin.id] || 0) + mined;
            this.saveState();
        }

        this.updateLiveDisplays();
    }

    getCoinPriceInBrl(coin) {
        const target = coin || this.getActiveCoin();
        if (window.marketEngine && window.marketEngine.assets) {
            const asset = window.marketEngine.assets.find(a => a.id === target.assetId);
            if (asset && asset.currentPrice > 0) return asset.currentPrice;
        }
        const fallbacks = {
            btc: 540000.00,
            eth: 16200.00,
            doge: 1.25,
            sol: 1140.00
        };
        return fallbacks[target.id] || 100.00;
    }

    getEstimatedBrlValue(coin) {
        const target = coin || this.getActiveCoin();
        const unmined = this.unminedCoins[target.id] || 0;
        return unmined * this.getCoinPriceInBrl(target);
    }

    transferMinedToSpotWallet() {
        const activeCoin = this.getActiveCoin();
        const unmined = this.unminedCoins[activeCoin.id] || 0;

        if (unmined <= 0.00000001) {
            this.showToast('Nenhuma quantidade de ' + activeCoin.name + ' minerada para resgatar!', 'error');
            return;
        }

        const coinAmount = unmined;
        this.unminedCoins[activeCoin.id] = 0;
        this.saveState();

        if (window.portfolioEngine) {
            const res = window.portfolioEngine.depositMined(activeCoin.assetId, coinAmount);
            if (window.soundEngine && window.soundEngine.playWin) {
                window.soundEngine.playWin();
            }
            this.showToast('⚡ ' + res.message + ' Acesse a Corretora Spot para manter ou vender.', 'success');
        }

        this.render();
    }

    toggleMasterPower() {
        this.isRunning = !this.isRunning;
        this.saveState();
        this.calculateHardwareStats();
        if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
        this.render();
        const statusStr = this.isRunning ? 'FAZENDA DE MINERACAO ATIVADA' : 'FAZENDA DE MINERACAO PAUSADA';
        this.showToast(statusStr, this.isRunning ? 'success' : 'info');
    }

    bindEvents() {
        this.eventsBound = true;

        const btnTransfer = document.getElementById('btn-mining-transfer');
        if (btnTransfer) {
            btnTransfer.addEventListener('click', () => this.transferMinedToSpotWallet());
        }

        const btnToggle = document.getElementById('btn-mining-power-toggle');
        if (btnToggle) {
            btnToggle.addEventListener('click', () => this.toggleMasterPower());
        }

        document.querySelectorAll('.mining-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mining-tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.activeTab = e.currentTarget.dataset.miningTab;
                if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
                this.renderTabs();
            });
        });

        const activeRigsContainer = document.getElementById('mining-active-gpus-list');
        if (activeRigsContainer) {
            activeRigsContainer.addEventListener('click', (e) => {
                const btnSlotGpu = e.target.closest('[data-slot-pick]');
                if (btnSlotGpu) {
                    const rigId = btnSlotGpu.dataset.rigId;
                    const slotIndex = parseInt(btnSlotGpu.dataset.slotIndex, 10);
                    const gpuId = btnSlotGpu.dataset.gpuId;
                    this.slotGpu(rigId, slotIndex, gpuId);
                    return;
                }

                const btnUnslot = e.target.closest('[data-unslot-gpu]');
                if (btnUnslot) {
                    const rigId = btnUnslot.dataset.rigId;
                    const slotIndex = parseInt(btnUnslot.dataset.slotIndex, 10);
                    this.unslotGpu(rigId, slotIndex);
                    return;
                }

                const btnToggleRig = e.target.closest('[data-toggle-rig]');
                if (btnToggleRig) {
                    const rigId = btnToggleRig.dataset.toggleRig;
                    this.toggleRigPower(rigId);
                    return;
                }

                const btnPreset = e.target.closest('[data-set-preset]');
                if (btnPreset) {
                    const rigId = btnPreset.dataset.rigId;
                    const presetId = btnPreset.dataset.setPreset;
                    this.setRigPreset(rigId, presetId);
                    return;
                }

                const btnCarry = e.target.closest('[data-carry-rig]');
                if (btnCarry) {
                    const rigId = btnCarry.dataset.carryRig;
                    this.startMoveRigInFirstPerson(rigId);
                    return;
                }

                const btnNudge = e.target.closest('[data-nudge-rig]');
                if (btnNudge) {
                    const rigId = btnNudge.dataset.rigId;
                    const dx = parseFloat(btnNudge.dataset.dx) || 0;
                    const dz = parseFloat(btnNudge.dataset.dz) || 0;
                    const dRot = parseFloat(btnNudge.dataset.drot) || 0;
                    this.nudgeRig(rigId, dx, dz, dRot);
                    return;
                }
            });

            activeRigsContainer.addEventListener('input', (e) => {
                const slider = e.target.closest('.rig-coord-slider');
                if (slider) {
                    const rigId = slider.dataset.rigId;
                    const axis = slider.dataset.axis;
                    const rig = this.rigs.find(r => r.id === rigId);
                    if (!rig) return;

                    let newX = rig.pos.x;
                    let newZ = rig.pos.z;
                    let newRot = rig.pos.rotY;

                    if (axis === 'x') newX = parseFloat(slider.value);
                    if (axis === 'z') newZ = parseFloat(slider.value);
                    if (axis === 'rot') newRot = (parseFloat(slider.value) * Math.PI) / 180;

                    this.setRigFinePosition(rigId, newX, newZ, newRot);

                    const labelVal = slider.parentElement.querySelector('.slider-val-readout');
                    if (labelVal) {
                        if (axis === 'rot') {
                            labelVal.textContent = Math.round(parseFloat(slider.value)) + '°';
                        } else {
                            labelVal.textContent = parseFloat(slider.value).toFixed(2) + 'm';
                        }
                    }
                }
            });
        }

        const coinSelectorContainer = document.getElementById('mining-coins-selector');
        if (coinSelectorContainer) {
            coinSelectorContainer.addEventListener('click', (e) => {
                const btnCoin = e.target.closest('[data-coin-id]');
                if (btnCoin) {
                    this.selectCoin(btnCoin.dataset.coinId);
                }
            });
        }
    }

    render() {
        if (!this.eventsBound) this.bindEvents();
        this.calculateHardwareStats();
        this.updateLiveDisplays();
        this.renderCoinSelector();
        this.renderTabs();
    }

    renderCoinSelector() {
        const container = document.getElementById('mining-coins-selector');
        if (!container) return;

        const activeCoin = this.getActiveCoin();

        container.innerHTML = this.availableCoins.map(coin => {
            const isSelected = coin.id === activeCoin.id;
            const unmined = this.unminedCoins[coin.id] || 0;
            return `
                <button class="mining-coin-chip ${isSelected ? 'active' : ''}" data-coin-id="${coin.id}">
                    <span class="coin-chip-icon">${coin.icon}</span>
                    <div class="coin-chip-meta">
                        <span class="coin-chip-title">${coin.name} (${coin.symbol})</span>
                        <span class="coin-chip-diff">${coin.difficultyDisplay} · ${coin.algorithm}</span>
                    </div>
                    <span class="coin-chip-balance">${unmined.toFixed(coin.unitDecimals > 4 ? 6 : coin.unitDecimals)} ${coin.symbol}</span>
                </button>
            `;
        }).join('');
    }

    updateLiveDisplays() {
        const activeCoin = this.getActiveCoin();

        const hashrateEl = document.getElementById('mining-hashrate-val');
        const coinUnminedEl = document.getElementById('mining-unmined-btc-val');
        const coinSymbolLabel = document.getElementById('mining-active-coin-label');
        const brlEstEl = document.getElementById('mining-unmined-brl-val');
        const powerEl = document.getElementById('mining-power-val');
        const tempEl = document.getElementById('mining-temp-val');
        const statusEl = document.getElementById('mining-status-badge');
        const btnToggle = document.getElementById('btn-mining-power-toggle');
        const btnTransfer = document.getElementById('btn-mining-transfer');

        const diffEl = document.getElementById('mining-net-difficulty-val');
        const globalHashEl = document.getElementById('mining-global-hash-val');
        const algoEl = document.getElementById('mining-algo-val');

        if (hashrateEl) {
            hashrateEl.textContent = this.totalHashrate.toLocaleString('pt-BR') + ' MH/s';
        }

        if (coinSymbolLabel) {
            coinSymbolLabel.textContent = `${activeCoin.icon} ${activeCoin.name.toUpperCase()} MINERADO`;
        }

        if (coinUnminedEl) {
            const unmined = this.unminedCoins[activeCoin.id] || 0;
            coinUnminedEl.textContent = unmined.toFixed(activeCoin.unitDecimals) + ' ' + activeCoin.symbol;
        }

        if (brlEstEl) {
            const brl = this.getEstimatedBrlValue();
            brlEstEl.textContent = '~ R$ ' + brl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        if (powerEl) {
            powerEl.textContent = (this.isRunning ? this.totalPower : 0) + ' W';
        }

        if (tempEl) {
            tempEl.textContent = this.farmTemp + '°C';
            tempEl.className = this.farmTemp > 75 ? 'metric-val text-neg' : 'metric-val text-pos';
        }

        if (diffEl) diffEl.textContent = activeCoin.difficultyDisplay;
        if (globalHashEl) globalHashEl.textContent = activeCoin.globalHashrateDisplay;
        if (algoEl) algoEl.textContent = activeCoin.algorithm;

        if (btnTransfer) {
            btnTransfer.innerHTML = `&#9889; RESGATAR ${activeCoin.symbol} PARA CARTEIRA SPOT`;
        }

        if (statusEl) {
            if (!this.isRunning) {
                statusEl.textContent = 'PAUSADA';
                statusEl.className = 'status-badge badge-offline';
            } else if (this.totalHashrate === 0) {
                statusEl.textContent = 'SLOTS VAZIOS';
                statusEl.className = 'status-badge badge-warning';
            } else {
                statusEl.textContent = 'MINERANDO ' + activeCoin.symbol;
                statusEl.className = 'status-badge badge-online';
            }
        }

        if (btnToggle) {
            btnToggle.textContent = this.isRunning ? 'PAUSAR MINERACAO' : 'ATIVAR MINERACAO';
            btnToggle.className = this.isRunning ? 'btn-power-off' : 'btn-power-on';
        }
    }

    renderTabs() {
        const container = document.getElementById('mining-active-gpus-list');
        if (!container) return;

        const uninstalled = (window.storeEngine && window.storeEngine.inventory.uninstalled_hardware) || [];

        if (this.activeTab === 'placement') {
            this.renderRoomPlacementTab(container);
            return;
        }

        let html = '';

        if (this.rigs.length === 0) {
            container.innerHTML = '<div class="mining-empty-panel">' +
                '<div class="empty-icon">🗄️</div>' +
                '<div class="empty-title">NENHUMA ESTRUTURA DE RIG ADQUIRIDA</div>' +
                '<p>Visite a <strong>DarkStore</strong> para adquirir um Chassi de Mineração Open-Air e encaixar suas GPUs.</p>' +
            '</div>';
            return;
        }

        this.rigs.forEach((rig, rIndex) => {
            let rigHashrate = 0;
            let rigPower = 0;
            let populatedSlots = 0;

            rig.slots.forEach(gid => {
                if (gid) {
                    populatedSlots++;
                    const spec = this.getGpuSpec(gid);
                    if (spec) {
                        rigHashrate += spec.hashrate;
                        rigPower += spec.power;
                    }
                }
            });

            const isRigActive = this.isRunning && rig.isRunning;

            html += '<div class="mining-rig-wrapper ' + (isRigActive ? 'rig-active' : 'rig-offline') + '">' +
                '<div class="mining-rig-header">' +
                    '<div class="rig-header-left">' +
                        '<span class="rig-badge-tag">RACK #' + (rIndex + 1) + '</span>' +
                        '<span class="rig-title-text">' + rig.name + '</span>' +
                        '<span class="rig-slots-count">(' + populatedSlots + '/' + rig.slotsCount + ' Slots Ocupados)</span>' +
                    '</div>' +
                    '<div class="rig-header-metrics">' +
                        '<span class="rig-mini-metric">⚡ <strong>' + (isRigActive ? rigHashrate : 0) + ' MH/s</strong></span>' +
                        '<span class="rig-mini-metric">🔋 <strong>' + (isRigActive ? rigPower : 0) + ' W</strong></span>' +
                        '<button class="btn-rig-power-toggle ' + (rig.isRunning ? 'active' : '') + '" data-toggle-rig="' + rig.id + '">' +
                            (rig.isRunning ? 'LIGADO' : 'DESLIGADO') +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="mining-slots-grid">';

            for (let s = 0; s < rig.slotsCount; s++) {
                const gpuId = rig.slots[s];
                if (gpuId) {
                    const spec = this.getGpuSpec(gpuId);
                    const temp = isRigActive ? (52 + (s * 3) + Math.floor(spec.hashrate / 50)) : 28;
                    html += '<div class="pcie-slot-card occupied ' + (isRigActive ? 'active' : 'off') + '">' +
                        '<div class="slot-header">' +
                            '<span class="slot-num">SLOT PCIe #' + (s + 1) + '</span>' +
                            '<span class="slot-status-dot ' + (isRigActive ? 'dot-active' : '') + '">●</span>' +
                        '</div>' +
                        '<div class="slot-gpu-hero">' +
                            '<span class="gpu-hero-icon">' + spec.icon + '</span>' +
                            '<div class="gpu-hero-info">' +
                                '<span class="gpu-hero-name">' + spec.name + '</span>' +
                                '<span class="gpu-hero-hash">' + spec.hashrate + ' MH/s · ' + spec.power + 'W</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="slot-telemetry">' +
                            '<div class="telemetry-item">' +
                                '<span class="tel-label">TEMP</span>' +
                                '<span class="tel-val ' + (temp > 74 ? 'text-neg' : 'text-pos') + '">' + temp + '°C</span>' +
                            '</div>' +
                            '<div class="telemetry-item">' +
                                '<span class="tel-label">COOLER</span>' +
                                '<span class="tel-val">' + (isRigActive ? '<span class="fan-spin-icon">🌀</span> 85%' : '0%') + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<button class="btn-unslot-gpu" data-unslot-gpu="true" data-rig-id="' + rig.id + '" data-slot-index="' + s + '">DESENCAIXAR GPU</button>' +
                    '</div>';
                } else {
                    html += '<div class="pcie-slot-card empty">' +
                        '<div class="slot-header">' +
                            '<span class="slot-num">SLOT PCIe #' + (s + 1) + '</span>' +
                            '<span class="slot-empty-tag">DISPONIVEL</span>' +
                        '</div>' +
                        '<div class="slot-empty-body">' +
                            '<span class="pcie-gold-pins">═══════════</span>' +
                            '<span class="slot-empty-hint">Slot PCIe 4.0 Pronto</span>' +
                        '</div>';

                    if (uninstalled.length > 0) {
                        html += '<div class="slot-quick-pick-box">' +
                            '<span class="pick-label">Encaixar GPU do estoque:</span>' +
                            '<div class="pick-options">';
                        const uniqueGpus = Array.from(new Set(uninstalled));
                        uniqueGpus.forEach(gid => {
                            const spec = this.getGpuSpec(gid);
                            html += '<button class="btn-quick-slot" data-slot-pick="true" data-rig-id="' + rig.id + '" data-slot-index="' + s + '" data-gpu-id="' + gid + '">' +
                                spec.icon + ' ' + spec.name +
                            '</button>';
                        });
                        html += '</div></div>';
                    } else {
                        html += '<div class="slot-no-stock-hint">Nenhuma GPU no estoque desinstalado. Compre placas no DarkStore.</div>';
                    }

                    html += '</div>';
                }
            }

            html += '</div></div>';
        });

        container.innerHTML = html;
    }

    renderRoomPlacementTab(container) {
        let html = '<div class="room-placement-container">' +
            '<div class="placement-header">' +
                '<span class="placement-title">🏠 ORGANIZACAO LIVRE DOS RIGS NO QUARTO 3D</span>' +
                '<p class="placement-desc">Mova e rotacione a sua rig com precisao milimetrica no quarto ou entre no modo de transporte em primeira pessoa para carregar e colocar a rig onde desejar.</p>' +
            '</div>' +
            '<div class="rigs-placement-list">';

        this.rigs.forEach((rig, rIndex) => {
            const rotDeg = Math.round((rig.pos.rotY * (180 / Math.PI)) % 360);
            const normalizedRotDeg = rotDeg < 0 ? rotDeg + 360 : rotDeg;

            html += `
                <div class="rig-placement-card" data-rig-card-id="${rig.id}">
                    <div class="placement-card-top">
                        <div>
                            <span class="placement-rig-name">🗄️ ${rig.name} (Rack #${rIndex + 1})</span>
                            <span class="placement-current-zone">Posição: <strong>X: ${rig.pos.x.toFixed(2)}m | Z: ${rig.pos.z.toFixed(2)}m | ${normalizedRotDeg}°</strong></span>
                        </div>
                        <button class="btn-placement-carry" data-carry-rig="${rig.id}">
                            🚚 CARREGAR &amp; MOVER NO QUARTO 3D
                        </button>
                    </div>

                    <div class="placement-free-controls">
                        <div class="control-row">
                            <span class="slider-title">EIXO X (Leste / Oeste):</span>
                            <input type="range" class="rig-coord-slider" data-rig-id="${rig.id}" data-axis="x" min="-2.7" max="2.7" step="0.05" value="${rig.pos.x.toFixed(2)}">
                            <span class="slider-val-readout">${rig.pos.x.toFixed(2)}m</span>
                        </div>
                        <div class="control-row">
                            <span class="slider-title">EIXO Z (Norte / Sul):</span>
                            <input type="range" class="rig-coord-slider" data-rig-id="${rig.id}" data-axis="z" min="-2.7" max="2.7" step="0.05" value="${rig.pos.z.toFixed(2)}">
                            <span class="slider-val-readout">${rig.pos.z.toFixed(2)}m</span>
                        </div>
                        <div class="control-row">
                            <span class="slider-title">ROTACAO (Ângulo Y):</span>
                            <input type="range" class="rig-coord-slider" data-rig-id="${rig.id}" data-axis="rot" min="0" max="360" step="5" value="${normalizedRotDeg}">
                            <span class="slider-val-readout">${normalizedRotDeg}°</span>
                        </div>
                    </div>

                    <div class="placement-nudge-bar">
                        <span class="nudge-title">AJUSTE FINO DIRECIONAL:</span>
                        <div class="nudge-btn-group">
                            <button class="btn-nudge" data-nudge-rig="true" data-rig-id="${rig.id}" data-dx="0" data-dz="-0.15" data-drot="0" title="Mover para Frente (Norte)">⬆ Frente</button>
                            <button class="btn-nudge" data-nudge-rig="true" data-rig-id="${rig.id}" data-dx="0" data-dz="0.15" data-drot="0" title="Mover para Trás (Sul)">⬇ Trás</button>
                            <button class="btn-nudge" data-nudge-rig="true" data-rig-id="${rig.id}" data-dx="-0.15" data-dz="0" data-drot="0" title="Mover para Esquerda (Oeste)">⬅ Esquerda</button>
                            <button class="btn-nudge" data-nudge-rig="true" data-rig-id="${rig.id}" data-dx="0.15" data-dz="0" data-drot="0" title="Mover para Direita (Leste)">➡ Direita</button>
                            <button class="btn-nudge btn-nudge-rot" data-nudge-rig="true" data-rig-id="${rig.id}" data-dx="0" data-dz="0" data-drot="45" title="Girar 45 graus">⟲ Girar 45°</button>
                        </div>
                    </div>

                    <div class="preset-buttons-row">
                        <span class="presets-row-label">ZONAS FAVORITAS:</span>
                        <div class="presets-grid">
            `;

            this.rigPresets.forEach(preset => {
                const isActive = rig.presetId === preset.id;
                html += `
                    <button class="btn-placement-preset ${isActive ? 'active' : ''}" data-set-preset="${preset.id}" data-rig-id="${rig.id}">
                        ${preset.name}
                    </button>
                `;
            });

            html += `
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'trade-toast ' + (type === 'success' ? 'toast-win' : (type === 'info' ? 'toast-tie' : 'toast-loss'));
        toast.innerHTML = '<div class="toast-title">CRYPTOMINER PRO FARM</div><div class="toast-desc">' + msg + '</div>';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}

window.MiningEngine = MiningEngine;
window.miningEngine = new MiningEngine();