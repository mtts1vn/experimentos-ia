class MiningEngine {
    constructor() {
        this.isRunning = true;
        this.unminedBtc = 0;
        this.totalBtcMined = 0;
        this.totalHashrate = 0;
        this.totalPower = 0;
        this.farmTemp = 42;
        this.activeRigIndex = 0;
        this.activeTab = 'racks';
        this.lastTickTime = Date.now();
        this.tickInterval = null;
        this.eventsBound = false;

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

    loadState() {
        try {
            const raw = localStorage.getItem('night_trader_mining_state_v2');
            if (raw) {
                const data = JSON.parse(raw);
                this.isRunning = data.isRunning !== undefined ? data.isRunning : true;
                this.unminedBtc = data.unminedBtc || 0;
                this.totalBtcMined = data.totalBtcMined || 0;
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
                unminedBtc: this.unminedBtc,
                totalBtcMined: this.totalBtcMined,
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

        rig.pos.x = parseFloat(x);
        rig.pos.z = parseFloat(z);
        rig.pos.rotY = parseFloat(rotY);
        rig.presetId = 'custom';
        this.saveState();

        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }
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
            btnTransfer.addEventListener('click', () => this.transferBtcToWallet());
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
            });
        }
    }

    render() {
        if (!this.eventsBound) this.bindEvents();
        this.calculateHardwareStats();
        this.updateLiveDisplays();
        this.renderTabs();
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
            tempEl.textContent = this.farmTemp + '°C';
            tempEl.className = this.farmTemp > 75 ? 'metric-val text-neg' : 'metric-val text-pos';
        }

        if (statusEl) {
            if (!this.isRunning) {
                statusEl.textContent = 'PAUSADA';
                statusEl.className = 'status-badge badge-offline';
            } else if (this.totalHashrate === 0) {
                statusEl.textContent = 'SLOTS VAZIOS';
                statusEl.className = 'status-badge badge-warning';
            } else {
                statusEl.textContent = 'MINERANDO ONLINE';
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
                '<span class="placement-title">🏠 ORGANIZACAO DOS RIGS NO QUARTO 3D</span>' +
                '<p class="placement-desc">Escolha onde cada rig físico ficará posicionado dentro do seu quarto. Os modelos 3D com as GPUs encaixadas e luzes RGB serao renderizados instantaneamente em tempo real.</p>' +
            '</div>' +
            '<div class="rigs-placement-list">';

        this.rigs.forEach((rig, rIndex) => {
            html += '<div class="rig-placement-card">' +
                '<div class="placement-card-top">' +
                    '<span class="placement-rig-name">🗄️ ' + rig.name + ' (Rack #' + (rIndex + 1) + ')</span>' +
                    '<span class="placement-current-zone">Local: <strong>' + (this.rigPresets.find(p => p.id === rig.presetId)?.name || 'Personalizado') + '</strong></span>' +
                '</div>' +
                '<div class="preset-buttons-row">' +
                    '<span class="presets-row-label">ZONAS PREDEFINIDAS:</span>' +
                    '<div class="presets-grid">';

            this.rigPresets.forEach(preset => {
                const isActive = rig.presetId === preset.id;
                html += '<button class="btn-placement-preset ' + (isActive ? 'active' : '') + '" data-set-preset="' + preset.id + '" data-rig-id="' + rig.id + '">' +
                    preset.name +
                '</button>';
            });

            html += '</div></div>' +
                '<div class="fine-tuning-box">' +
                    '<span class="fine-label">COORDENADAS 3D:</span>' +
                    '<span class="fine-coords">X: ' + rig.pos.x.toFixed(2) + 'm | Z: ' + rig.pos.z.toFixed(2) + 'm | Rotacao: ' + (rig.pos.rotY * (180 / Math.PI)).toFixed(0) + '°</span>' +
                '</div>' +
            '</div>';
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