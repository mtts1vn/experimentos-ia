class StoreEngine {
    constructor() {
        this.activeCategory = 'all';
        this.catalog = [
            {
                id: 'gpu_1660',
                name: 'NVIDIA GTX 1660 Super',
                category: 'hardware',
                price: 1200.00,
                hashrate: 60,
                power: 125,
                icon: '📼',
                desc: 'GPU de entrada ideal para iniciar sua rig de mineracao de BTC.',
                tag: '60 MH/s'
            },
            {
                id: 'gpu_3070',
                name: 'NVIDIA RTX 3070 8GB',
                category: 'hardware',
                price: 3500.00,
                hashrate: 140,
                power: 220,
                icon: '🎴',
                desc: 'Placa intermediaria com alto rendimento e eficiencia energetica.',
                tag: '140 MH/s'
            },
            {
                id: 'gpu_4090',
                name: 'NVIDIA RTX 4090 Ti 24GB',
                category: 'hardware',
                price: 12000.00,
                hashrate: 380,
                power: 450,
                icon: '⚡',
                desc: 'O monstro do poder computacional. Hashrate massivo para mineracao pesada.',
                tag: '380 MH/s'
            },
            {
                id: 'asic_s19',
                name: 'Antminer S19 Pro 110TH',
                category: 'hardware',
                price: 28000.00,
                hashrate: 850,
                power: 3250,
                icon: '🏭',
                desc: 'Servidor ASIC industrial dedicado. Hashrate extremo para acumulacao de Bitcoin.',
                tag: '850 MH/s'
            },
            {
                id: 'rig_frame',
                name: 'Estrutura Rig Aluminio RGB',
                category: 'hardware',
                price: 1500.00,
                icon: '🗄️',
                permanent: true,
                desc: 'Chassi profissional aberto com fans RGB sincronizados no quarto 3D.',
                tag: 'DECORACAO 3D'
            },
            {
                id: 'cigarettes',
                name: 'Maco Lucky Strike Red',
                category: 'consumable',
                price: 15.00,
                doses: 20,
                icon: '🚬',
                desc: 'Alivia abstinencia de nicotina instantaneamente, eliminando tremedeira e tosse.',
                tag: '20 CIGARROS'
            },
            {
                id: 'zippo',
                name: 'Isqueiro Zippo Vintage Metal',
                category: 'consumable',
                price: 80.00,
                permanent: true,
                icon: '🔥',
                desc: 'Isqueiro de aco cromado com estalo metalico classico.',
                tag: 'PERMANENTE'
            },
            {
                id: 'energy_drink',
                name: 'Monster Energy Cyber Punch',
                category: 'consumable',
                price: 12.00,
                doses: 1,
                icon: '🥤',
                desc: 'Aumenta sua velocidade de digitacao e foco temporariamente.',
                tag: '+50% VELOCIDADE'
            },
            {
                id: 'whisky',
                name: 'Garrafa Johnnie Walker Black',
                category: 'consumable',
                price: 160.00,
                doses: 10,
                icon: '🥃',
                desc: 'Whisky 12 anos. Reduz o estresse das oscilacoes de mercado.',
                tag: '10 DOSES'
            },
            {
                id: 'coffee',
                name: 'Cafe Expresso Italiano Duplo',
                category: 'consumable',
                price: 8.00,
                doses: 1,
                icon: '☕',
                desc: 'Dose forte de cafeina para restaurar a concentracao do trader.',
                tag: 'CONCENTRACAO'
            },
            {
                id: 'ashtray',
                name: 'Cinzeiro de Cristal Escuro',
                category: 'decoration',
                price: 120.00,
                permanent: true,
                icon: '🥣',
                desc: 'Cinzeiro sofisticado colocado sobre a mesa ao lado do monitor.',
                tag: 'MESA 3D'
            },
            {
                id: 'whisky_glass',
                name: 'Copo de Whisky com Gelo',
                category: 'decoration',
                price: 90.00,
                permanent: true,
                icon: '🍸',
                desc: 'Copo de cristal lapidado decorativo posicionado na mesa.',
                tag: 'MESA 3D'
            }
        ];

        this.inventory = this.loadInventory();
        this.eventsBound = false;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    loadInventory() {
        try {
            const raw = localStorage.getItem('night_trader_store_inventory');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            cigarettes: 5,
            zippo: 1
        };
    }

    saveInventory() {
        try {
            localStorage.setItem('night_trader_store_inventory', JSON.stringify(this.inventory));
        } catch (e) {}
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
            this.showToast('Saldo insuficiente para comprar este item!', 'error');
            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            return;
        }

        if (this.deductWallet(item.price)) {
            const qtyToAdd = item.doses ? item.doses : 1;
            this.inventory[id] = (this.inventory[id] || 0) + qtyToAdd;
            this.saveInventory();

            if (window.soundEngine && window.soundEngine.playTradeOpen) {
                window.soundEngine.playTradeOpen();
            }

            this.showToast('Comprado com sucesso: ' + item.name + '!', 'success');

            if (window.miningEngine && typeof window.miningEngine.onHardwareUpdated === 'function') {
                window.miningEngine.onHardwareUpdated();
            }
            if (window.roomScene && typeof window.roomScene.updateRoomAccessories === 'function') {
                window.roomScene.updateRoomAccessories();
            }

            this.render();
        }
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
            this.showToast('Voce testa a chama do Zippo.', 'info');
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
                        (isOwnedPermanent ? 'ADQUIRIDO' : 'COMPRAR') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    renderInventory() {
        const grid = document.getElementById('store-inventory-grid');
        if (!grid) return;

        const ownedKeys = Object.keys(this.inventory).filter(k => this.inventory[k] > 0);
        if (ownedKeys.length === 0) {
            grid.innerHTML = '<div class="store-empty-inv">Seu inventario esta vazio. Compre consumiveis e hardware na loja acima.</div>';
            return;
        }

        grid.innerHTML = ownedKeys.map(k => {
            const item = this.getItem(k);
            if (!item) return '';
            const qty = this.inventory[k];
            const isConsumable = item.category === 'consumable' && !item.permanent;

            return '<div class="store-inv-item">' +
                '<span class="inv-icon">' + item.icon + '</span>' +
                '<div class="inv-info">' +
                    '<span class="inv-name">' + item.name + '</span>' +
                    '<span class="inv-qty">Quantidade: <strong>' + qty + '</strong> ' + (item.doses ? 'unidades/doses' : '') + '</span>' +
                '</div>' +
                (isConsumable ? ('<button class="btn-store-use" data-use-item="' + item.id + '">USAR / CONSUMIR</button>') : '<span class="inv-tag-active">ATIVO</span>') +
            '</div>';
        }).join('');
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'trade-toast ' + (type === 'success' ? 'toast-win' : (type === 'info' ? 'toast-tie' : 'toast-loss'));
        toast.innerHTML = '<div class="toast-title">DARKSTORE HARDWARE &amp; CARE</div><div class="toast-desc">' + msg + '</div>';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
}

window.StoreEngine = StoreEngine;
window.storeEngine = new StoreEngine();