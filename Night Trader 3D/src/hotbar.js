class ConsumablesHotbar {
    constructor() {
        this.container = null;
        this.selectedIndex = -1;
        this.items = [
            { id: 'cigarettes', name: 'Lucky Strike', icon: '🚬', key: '1' },
            { id: 'whisky', name: 'Whisky 12A', icon: '🥃', key: '2' },
            { id: 'energy_drink', name: 'Monster Energy', icon: '🥤', key: '3' },
            { id: 'coffee', name: 'Cafe Expresso', icon: '☕', key: '4' },
            { id: 'zippo', name: 'Zippo Titanio', icon: '🔥', key: '5' }
        ];
        this.init();
    }

    init() {
        let el = document.getElementById('consumables-hotbar');
        if (!el) {
            el = document.createElement('div');
            el.id = 'consumables-hotbar';
            el.className = 'consumables-hotbar';
            document.body.appendChild(el);
        }
        this.container = el;

        this.bindEvents();
        this.render();
    }

    isGameActive() {
        const launcher = document.getElementById('launcher-modal');
        if (launcher && !launcher.classList.contains('hidden')) {
            return false;
        }
        return document.body.classList.contains('mode-room-3d') || document.body.classList.contains('mode-desktop-only');
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (!this.isGameActive()) return;
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            if (['1', '2', '3', '4', '5'].includes(e.key)) {
                const idx = parseInt(e.key, 10) - 1;
                if (idx >= 0 && idx < this.items.length) {
                    if (this.selectedIndex === idx) {
                        this.selectSlot(-1);
                    } else {
                        this.selectSlot(idx);
                    }
                }
            } else if (e.key === 'q' || e.key === 'Q' || e.code === 'KeyQ') {
                if (this.selectedIndex !== -1) {
                    this.useSelected();
                }
            }
        });

        if (this.container) {
            this.container.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (this.selectedIndex === -1) {
                    this.selectedIndex = e.deltaY > 0 ? 0 : this.items.length - 1;
                } else {
                    if (e.deltaY > 0) {
                        this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
                    } else {
                        this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
                    }
                }
                if (window.soundEngine && window.soundEngine.playKeyClick) {
                    window.soundEngine.playKeyClick();
                }
                this.render();
            }, { passive: false });

            this.container.addEventListener('click', (e) => {
                const slot = e.target.closest('.hotbar-slot');
                if (!slot) return;
                const idx = parseInt(slot.dataset.index, 10);
                if (this.selectedIndex === idx) {
                    this.selectSlot(-1);
                } else {
                    this.selectSlot(idx);
                }
            });
        }
    }

    selectSlot(idx) {
        this.selectedIndex = idx;
        if (window.soundEngine && window.soundEngine.playKeyClick) {
            window.soundEngine.playKeyClick();
        }
        this.render();
    }

    useSelected() {
        if (this.selectedIndex < 0 || this.selectedIndex >= this.items.length) return;
        const item = this.items[this.selectedIndex];
        if (!item) return;

        if (window.storeEngine) {
            window.storeEngine.useItem(item.id);
        }

        this.update();
    }

    update() {
        this.render();
    }

    render() {
        if (!this.container) return;

        if (!this.isGameActive()) {
            this.container.style.display = 'none';
            return;
        }
        this.container.style.display = 'flex';

        let html = '';
        this.items.forEach((item, idx) => {
            const count = window.storeEngine ? window.storeEngine.getOwnedQuantity(item.id) : 0;
            const isSelected = idx === this.selectedIndex;
            const isEmpty = count <= 0 && item.id !== 'zippo';

            html += `
                <div class="hotbar-slot ${isSelected ? 'active' : ''} ${isEmpty ? 'slot-empty' : ''}" data-index="${idx}" title="${item.name}">
                    <span class="hotbar-key">[${item.key}]</span>
                    <span class="hotbar-icon">${item.icon}</span>
                    <span class="hotbar-info">
                        <span class="hotbar-name">${item.name}</span>
                        <span class="hotbar-count">${item.id === 'zippo' ? (count > 0 ? '✓' : '0') : 'x' + count}</span>
                    </span>
                    ${isSelected ? '<span class="hotbar-action-badge">USAR [Q]</span>' : ''}
                </div>
            `;
        });

        this.container.innerHTML = html;
    }
}

window.ConsumablesHotbar = ConsumablesHotbar;
window.consumablesHotbar = new ConsumablesHotbar();

