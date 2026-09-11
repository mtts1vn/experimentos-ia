class StoreEngine {
    constructor() {
        this.activeCategory = 'all';
        this.catalog = [
            {
                id: 'gpu_1660',
                name: 'NVIDIA GTX 1660 Super 6GB',
                category: 'hardware',
                type: 'gpu',
                price: 1200.00,
                hashrate: 60,
                power: 125,
                icon: '📼',
                desc: 'GPU de entrada compacta. 6GB GDDR6, ideal para iniciar sua rig de mineracao de BTC.',
                tag: '60 MH/s · 125W'
            },
            {
                id: 'gpu_3070',
                name: 'NVIDIA RTX 3070 8GB OC',
                category: 'hardware',
                type: 'gpu',
                price: 3500.00,
                hashrate: 140,
                power: 220,
                icon: '🎴',
                desc: 'Excelente eficiencia energetica com dual-fan RGB. Alta estabilidade de hashrate.',
                tag: '140 MH/s · 220W'
            },
            {
                id: 'gpu_4090',
                name: 'NVIDIA RTX 4090 Ti 24GB Beast',
                category: 'hardware',
                type: 'gpu',
                price: 12000.00,
                hashrate: 380,
                power: 450,
                icon: '⚡',
                desc: 'O ápice da computacao gráfica. Triplo cooler, 24GB GDDR6X e forca bruta de mineracao.',
                tag: '380 MH/s · 450W'
            },
            {
                id: 'asic_s19',
                name: 'Antminer S19 Pro 110TH ASIC',
                category: 'hardware',
                type: 'gpu',
                price: 28000.00,
                hashrate: 850,
                power: 3250,
                icon: '🏭',
                desc: 'Modulo industrial especializado SHA-256 com refrigeracao forçada de alta pressao.',
                tag: '850 MH/s · 3250W'
            },
            {
                id: 'rig_frame_4',
                name: 'Rig Rack Compacto (4 Slots PCIe)',
                category: 'hardware',
                type: 'rig',
                price: 1200.00,
                slots: 4,
                icon: '🗄️',
                desc: 'Chassi de aluminio open-air para ate 4 GPUs. Pode ser posicionado livremente no quarto 3D.',
                tag: 'CHASSI 4 GPUS'
            },
            {
                id: 'rig_frame_6',
                name: 'Rig Rack Pro RGB (6 Slots PCIe)',
                category: 'hardware',
                type: 'rig',
                price: 2400.00,
                slots: 6,
                icon: '🖥️',
                desc: 'Estrutura reforcada de 6 slots com distribuicao de energia de alta voltagem e iluminacao RGB.',
                tag: 'CHASSI 6 GPUS'
            },
            {
                id: 'rig_frame_8',
                name: 'Rig Server Torre (8 Slots PCIe)',
                category: 'hardware',
                type: 'rig',
                price: 4800.00,
                slots: 8,
                icon: '🏢',
                desc: 'Gabinete industrial de 8 slots para mineracao em larga escala. Alto fluxo de ar.',
                tag: 'CHASSI 8 GPUS'
            },
            {
                id: 'cigarettes',
                name: 'Maco Dunhill Cyber Red',
                category: 'consumable',
                type: 'consumable',
                price: 15.00,
                doses: 20,
                icon: '🚬',
                desc: 'Alivia abstinencia de nicotina instantaneamente, eliminando tremedeiras e crises de tosse.',
                tag: '20 CIGARROS'
            },
            {
                id: 'zippo',
                name: 'Isqueiro Zippo Titanio Escovado',
                category: 'consumable',
                type: 'consumable',
                price: 80.00,
                permanent: true,
                icon: '🔥',
                desc: 'Isqueiro vintage resistente ao vento com acabamento metalico no quarto.',
                tag: 'PERMANENTE'
            },
            {
                id: 'energy_drink',
                name: 'Monster Energy Cyber Punch',
                category: 'consumable',
                type: 'consumable',
                price: 12.00,
                doses: 1,
                icon: '🥤',
                desc: 'Aumenta sua velocidade de digitacao e foco em 50% temporariamente.',
                tag: '+50% VELOCIDADE'
            },
            {
                id: 'whisky',
                name: 'Garrafa Johnnie Walker Black 12A',
                category: 'consumable',
                type: 'consumable',
                price: 160.00,
                doses: 10,
                icon: '🥃',
                desc: 'Whisky escoces envelhecido. Estabiliza a ansiedade em momentos de alta volatilidade.',
                tag: '10 DOSES'
            },
            {
                id: 'coffee',
                name: 'Cafe Expresso Italiano Duplo',
                category: 'consumable',
                type: 'consumable',
                price: 8.00,
                doses: 1,
                icon: '☕',
                desc: 'Extrato duplo de cafeina pura para restaurar a concentracao do trader.',
                tag: 'CONCENTRACAO'
            },
            {
                id: 'ashtray',
                name: 'Cinzeiro de Cristal Negro',
                category: 'decoration',
                type: 'decoration',
                price: 120.00,
                permanent: true,
                icon: '🥣',
                desc: 'Cinzeiro de luxo colocado sobre a bancada ao lado do monitor.',
                tag: 'MESA 3D'
            },
            {
                id: 'whisky_glass',
                name: 'Copo de Cristal com Gelo',
                category: 'decoration',
                type: 'decoration',
                price: 90.00,
                permanent: true,
                icon: '🍸',
                desc: 'Copo lapidado decorativo posicionado na mesa de negociacao.',
                tag: 'MESA 3D'
            }
        ];

        this.inventory = this.loadInventory();
        this.deliveries = this.loadDeliveries();
        this.eventsBound = false;
        this.deliveryInterval = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
        this.startDeliveryChecker();
    }

    loadInventory() {
        try {
            const raw = localStorage.getItem('night_trader_store_inventory');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            cigarettes: 10,
            zippo: 1,
            uninstalled_hardware: []
        };
    }

    saveInventory() {
        try {
            localStorage.setItem('night_trader_store_inventory', JSON.stringify(this.inventory));
        } catch (e) {}
    }

    loadDeliveries() {
        try {
            const raw = localStorage.getItem('night_trader_store_deliveries');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }

    saveDeliveries() {
        try {
            localStorage.setItem('night_trader_store_deliveries', JSON.stringify(this.deliveries));
        } catch (e) {}
    }

    startDeliveryChecker() {
        if (this.deliveryInterval) clearInterval(this.deliveryInterval);
        this.deliveryInterval = setInterval(() => {
            const now = Date.now();
            let changed = false;
            this.deliveries.forEach(del => {
                if (del.status === 'shipping' && now >= del.eta) {
                    del.status = 'delivered';
                    changed = true;
                    this.showToast('Encomenda entregue na porta: ' + del.name + '!', 'success');
                    if (window.soundEngine && window.soundEngine.playTradeWin) window.soundEngine.playTradeWin();
                }
            });
            if (changed) {
                this.saveDeliveries();
                this.render();
                if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
                    window.roomScene.updateRoomAccessories();
                }
            }
        }, 1000);
    }

    getWalletBalance() {
        if (window.tradingEngine && window.tradingEngine.wallet) {
            return window.tradingEngine.wallet.balance;
        }
        return 0;
    }

    deductWallet(amount) {
        if (window.tradingEngine && window.tradingEngine.wallet) {
            if (window.tradingEngine.wallet.balance < amount) return false;
            window.tradingEngine.wallet.balance -= amount;
            if (window.tradingEngine.saveState) {
                window.tradingEngine.saveState();
            } else if (window.tradingEngine.saveWallet) {
                window.tradingEngine.saveWallet();
            }
            if (window.desktopUI) {
                if (typeof window.desktopUI.updateHeader === 'function') window.desktopUI.updateHeader();
                if (typeof window.desktopUI.updateExchangeSummary === 'function') window.desktopUI.updateExchangeSummary();
            }
            return true;
        }
        return false;
    }

    getItem(id) {
        return this.catalog.find(item => item.id === id);
    }

    getOwnedQuantity(id) {
        if (id.startsWith('gpu_') || id.startsWith('asic_')) {
            let count = 0;
            if (this.inventory.uninstalled_hardware) {
                count += this.inventory.uninstalled_hardware.filter(h => h === id).length;
            }
            if (window.miningEngine && window.miningEngine.rigs) {
                window.miningEngine.rigs.forEach(rig => {
                    if (rig.slots) {
                        count += rig.slots.filter(s => s === id).length;
                    }
                });
            }
            return count;
        }
        return this.inventory[id] || 0;
    }

    buyItem(id) {
        const item = this.getItem(id);
        if (!item) return;

        if (item.permanent && this.getOwnedQuantity(id) > 0) {
            this.showToast('Voce ja possui este item permanente!', 'info');
            return;
        }

        const bal = this.getWalletBalance();
        if (bal < item.price) {
            this.showToast('Saldo insuficiente para realizar este pedido!', 'error');
            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            return;
        }

        if (this.deductWallet(item.price)) {
            const deliveryId = 'pkg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const deliveryEta = Date.now() + 3500;

            this.deliveries.push({
                id: deliveryId,
                itemId: item.id,
                name: item.name,
                icon: item.icon,
                type: item.type,
                tag: item.tag,
                status: 'shipping',
                orderedAt: Date.now(),
                eta: deliveryEta
            });
            this.saveDeliveries();

            if (window.soundEngine && window.soundEngine.playTradeOpen) {
                window.soundEngine.playTradeOpen();
            }

            this.showToast('Pedido confirmado! Envio expresso a caminho: ' + item.name, 'success');
            this.render();
        }
    }

    openDeliveryBox(deliveryId) {
        const idx = this.deliveries.findIndex(d => d.id === deliveryId);
        if (idx === -1) return;
        const delivery = this.deliveries[idx];
        const item = this.getItem(delivery.itemId);

        if (window.soundEngine && window.soundEngine.playBoxOpen) {
            window.soundEngine.playBoxOpen();
        }

        if (item.type === 'gpu') {
            if (!this.inventory.uninstalled_hardware) this.inventory.uninstalled_hardware = [];
            this.inventory.uninstalled_hardware.push(item.id);
            this.showToast('📦 Unboxing concluido! ' + item.name + ' adicionada ao estoque de GPUs.', 'success');
        } else if (item.type === 'rig') {
            if (window.miningEngine && typeof window.miningEngine.addNewRig === 'function') {
                window.miningEngine.addNewRig(item.id, item.name, item.slots);
            }
            this.showToast('📦 Unboxing concluido! ' + item.name + ' montada no quarto 3D.', 'success');
        } else {
            const qtyToAdd = item.doses ? item.doses : 1;
            this.inventory[item.id] = (this.inventory[item.id] || 0) + qtyToAdd;
            this.showToast('📦 Unboxing concluido! ' + item.name + ' pronto para uso.', 'success');
        }

        this.deliveries.splice(idx, 1);
        this.saveDeliveries();
        this.saveInventory();

        if (window.miningEngine && typeof window.miningEngine.onHardwareUpdated === 'function') {
            window.miningEngine.onHardwareUpdated();
        }
        if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
            window.roomScene.updateRoomAccessories();
        }

        if (window.consumablesHotbar) {
            window.consumablesHotbar.update();
        }

        this.render();
    }

    useItem(id) {
        const count = this.getOwnedQuantity(id);
        if (count <= 0) {
            this.showToast('Item esgotado no seu inventario!', 'error');
            return;
        }

        if (id === 'cigarettes') {
            if (window.addictionEngine) {
                window.addictionEngine.smokeCigarette();
            }
        } else if (id === 'whisky') {
            if (window.addictionEngine) {
                window.addictionEngine.drinkWhisky();
            }
        } else if (id === 'energy_drink') {
            if (window.addictionEngine) {
                window.addictionEngine.drinkEnergy();
            }
        } else if (id === 'coffee') {
            if (window.addictionEngine) {
                window.addictionEngine.drinkCoffee();
            }
        } else if (id === 'zippo') {
            if (window.soundEngine && window.soundEngine.playLighter) {
                window.soundEngine.playLighter();
            }
            this.showToast('Voce acende o isqueiro Zippo.', 'info');
        }

        if (window.consumablesHotbar) {
            window.consumablesHotbar.update();
        }

        this.render();
    }

    bindEvents() {
        this.eventsBound = true;

        document.querySelectorAll('.store-cat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.store-cat-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.activeCategory = e.currentTarget.dataset.category;
                if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
                this.renderCatalog();
            });
        });

        const catGrid = document.getElementById('store-catalog-grid');
        if (catGrid) {
            catGrid.addEventListener('click', (e) => {
                const buyBtn = e.target.closest('[data-buy-item]');
                if (buyBtn) {
                    const id = buyBtn.dataset.buyItem;
                    this.buyItem(id);
                }
            });
        }

        const invGrid = document.getElementById('store-inventory-grid');
        if (invGrid) {
            invGrid.addEventListener('click', (e) => {
                const useBtn = e.target.closest('[data-use-item]');
                if (useBtn) {
                    const id = useBtn.dataset.useItem;
                    this.useItem(id);
                }
                const openBtn = e.target.closest('[data-open-delivery]');
                if (openBtn) {
                    const id = openBtn.dataset.openDelivery;
                    this.openDeliveryBox(id);
                }
            });
        }
    }

    render() {
        if (!this.eventsBound) this.bindEvents();
        this.renderBalance();
        this.renderCatalog();
        this.renderInventory();
    }

    renderBalance() {
        const bal = this.getWalletBalance();
        const str = 'R$ ' + bal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.querySelectorAll('.store-wallet-val').forEach(el => el.textContent = str);
    }

    renderCatalog() {
        const grid = document.getElementById('store-catalog-grid');
        if (!grid) return;

        const filtered = this.catalog.filter(item => {
            if (this.activeCategory === 'all') return true;
            return item.category === this.activeCategory;
        });

        grid.innerHTML = filtered.map(item => {
            const owned = this.getOwnedQuantity(item.id);
            const isOwnedPermanent = item.permanent && owned > 0;
            const priceStr = 'R$ ' + item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const ownedBadge = owned > 0 ? ('<span class="store-owned-badge">POSSUI: ' + owned + '</span>') : '';

            return '<div class="store-item-card ' + (isOwnedPermanent ? 'is-owned' : '') + '">' +
                '<div class="store-card-header">' +
                    '<span class="store-item-icon">' + item.icon + '</span>' +
                    '<div class="store-card-badges">' +
                        '<span class="store-item-tag">' + item.tag + '</span>' +
                        ownedBadge +
                    '</div>' +
                '</div>' +
                '<div class="store-card-body">' +
                    '<div class="store-item-name">' + item.name + '</div>' +
                    '<div class="store-item-desc">' + item.desc + '</div>' +
                '</div>' +
                '<div class="store-card-footer">' +
                    '<div class="store-price-box">' +
                        '<span class="store-price-label">PRECO</span>' +
                        '<span class="store-price-val">' + priceStr + '</span>' +
                    '</div>' +
                    '<button class="btn-store-buy ' + (isOwnedPermanent ? 'btn-disabled' : '') + '" data-buy-item="' + item.id + '" ' + (isOwnedPermanent ? 'disabled' : '') + '>' +
                        (isOwnedPermanent ? 'ADQUIRIDO' : 'COMPRAR &amp; ENTREGAR') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    renderInventory() {
        const grid = document.getElementById('store-inventory-grid');
        if (!grid) return;

        let html = '';

        if (this.deliveries.length > 0) {
            html += '<div class="store-deliveries-section">' +
                '<div class="store-sec-subtitle">📦 PACOTES EM RASTREIO / ENTREGUES</div>';
            this.deliveries.forEach(del => {
                const isReady = del.status === 'delivered' || Date.now() >= del.eta;
                html += '<div class="store-delivery-card ' + (isReady ? 'ready' : 'shipping') + '">' +
                    '<div class="del-icon">' + del.icon + '</div>' +
                    '<div class="del-info">' +
                        '<span class="del-name">' + del.name + '</span>' +
                        '<span class="del-status">' + (isReady ? '✅ ENTREGUE NA PORTA' : '🚚 A CAMINHO...') + '</span>' +
                    '</div>' +
                    '<button class="btn-open-package ' + (isReady ? '' : 'btn-disabled') + '" data-open-delivery="' + del.id + '" ' + (isReady ? '' : 'disabled') + '>' +
                        (isReady ? 'ABRIR CAIXA (UNBOXING)' : 'EM TRANSITO...') +
                    '</button>' +
                '</div>';
            });
            html += '</div>';
        }

        const uninstalledGpus = this.inventory.uninstalled_hardware || [];
        if (uninstalledGpus.length > 0) {
            html += '<div class="store-uninstalled-section">' +
                '<div class="store-sec-subtitle">🔌 ESTOQUE DE GPUS DESENCAIXADAS</div>';
            const gpuMap = {};
            uninstalledGpus.forEach(gid => {
                gpuMap[gid] = (gpuMap[gid] || 0) + 1;
            });
            Object.keys(gpuMap).forEach(gid => {
                const item = this.getItem(gid);
                if (item) {
                    html += '<div class="store-inv-item hardware-stock">' +
                        '<span class="inv-icon">' + item.icon + '</span>' +
                        '<div class="inv-info">' +
                            '<span class="inv-name">' + item.name + '</span>' +
                            '<span class="inv-qty">Desinstaladas: <strong>' + gpuMap[gid] + 'x</strong> (Prontas para encaixar na Rig)</span>' +
                        '</div>' +
                        '<span class="inv-tag-stock">NO ESTOQUE</span>' +
                    '</div>';
                }
            });
            html += '</div>';
        }

        const consumableKeys = Object.keys(this.inventory).filter(k => k !== 'uninstalled_hardware' && this.inventory[k] > 0);
        if (consumableKeys.length > 0) {
            html += '<div class="store-consumables-section">' +
                '<div class="store-sec-subtitle">🍸 CONSUMIVEIS &amp; CUIDADOS</div>';
            consumableKeys.forEach(k => {
                const item = this.getItem(k);
                if (item) {
                    const qty = this.inventory[k];
                    const isConsumable = item.category === 'consumable' && !item.permanent;
                    html += '<div class="store-inv-item">' +
                        '<span class="inv-icon">' + item.icon + '</span>' +
                        '<div class="inv-info">' +
                            '<span class="inv-name">' + item.name + '</span>' +
                            '<span class="inv-qty">Quantidade: <strong>' + qty + '</strong> ' + (item.doses ? 'unidades/doses' : '') + '</span>' +
                        '</div>' +
                        (isConsumable ? ('<button class="btn-store-use" data-use-item="' + item.id + '">USAR / CONSUMIR</button>') : '<span class="inv-tag-active">ATIVO</span>') +
                    '</div>';
                }
            });
            html += '</div>';
        }

        if (html === '') {
            grid.innerHTML = '<div class="store-empty-inv">Seu inventario esta vazio. Compre consumiveis, placas de video e rigs no catalogo acima.</div>';
            return;
        }

        grid.innerHTML = html;
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'trade-toast ' + (type === 'success' ? 'toast-win' : (type === 'info' ? 'toast-tie' : 'toast-loss'));
        toast.innerHTML = '<div class="toast-title">DARKSTORE HARDWARE &amp; LOGISTICS</div><div class="toast-desc">' + msg + '</div>';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}

window.StoreEngine = StoreEngine;
window.storeEngine = new StoreEngine();