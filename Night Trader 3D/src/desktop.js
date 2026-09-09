class DesktopUI {
    constructor() {
        this.activeApp = null;
        this.selectedCategory = 'all';
        this.chartEngine = null;

        this.init();
    }

    init() {
        this.chartEngine = new window.ChartEngine('trading-canvas');
        this.bindEvents();
        this.renderAssetList();
        this.renderHistory();
        this.renderStats();
        this.renderRanking();
        this.renderNews();
        this.updateHeader();
        this.startClock();

        window.marketEngine.subscribe((asset, candles) => {
            this.updateHeader();
            if (this.activeApp === 'trading') {
                this.chartEngine.setActiveTrades(window.tradingEngine.activeTrades);
                this.chartEngine.render(asset, candles);
            }
            this.updateActiveTradesList();
        });

        window.tradingEngine.onTradeUpdate = () => {
            this.updateHeader();
            this.updateActiveTradesList();
            this.renderHistory();
            this.renderStats();
            this.renderRanking();
        };

        window.notifyTradeResult = (trade) => {
            this.showNotification(trade);
        };
    }

    bindEvents() {
        document.querySelectorAll('.desktop-icon, .desktop-quick-btn').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const app = e.currentTarget.dataset.app;
                this.openApp(app);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.win-btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const app = e.currentTarget.dataset.app;
                this.closeApp(app);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.app-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const app = e.currentTarget.dataset.tab;
                if (this.activeApp === app) {
                    this.closeApp(app);
                } else {
                    this.openApp(app);
                }
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                if (window.roomScene) {
                    window.roomScene.setGraphicsQuality(preset);
                }
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedCategory = e.target.dataset.category;
                this.renderAssetList();
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const tf = e.target.dataset.tf;
                window.marketEngine.setSelectedTimeframe(tf);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.chartEngine.setChartType(e.target.dataset.type);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.ind-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.classList.toggle('active');
                const ind = e.target.dataset.indicator;
                this.chartEngine.toggleIndicator(ind);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.amt-quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.dataset.amount;
                const input = document.getElementById('input-trade-amount');
                if (val === 'max') {
                    input.value = Math.floor(window.tradingEngine.balance);
                } else {
                    input.value = val;
                }
                window.tradingEngine.setAmount(input.value);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        const inputAmt = document.getElementById('input-trade-amount');
        if (inputAmt) {
            inputAmt.addEventListener('input', (e) => {
                window.tradingEngine.setAmount(e.target.value);
            });
        }

        document.querySelectorAll('.exp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.exp-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const dur = parseInt(e.target.dataset.seconds, 10);
                window.tradingEngine.setDuration(dur);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        const btnCall = document.getElementById('btn-action-call');
        if (btnCall) {
            btnCall.addEventListener('click', () => {
                const curAsset = window.marketEngine.getSelectedAsset();
                const res = window.tradingEngine.executeTrade(curAsset, 'SUBIR');
                if (!res.success) {
                    alert(res.message);
                }
            });
        }

        const btnPut = document.getElementById('btn-action-put');
        if (btnPut) {
            btnPut.addEventListener('click', () => {
                const curAsset = window.marketEngine.getSelectedAsset();
                const res = window.tradingEngine.executeTrade(curAsset, 'DESCER');
                if (!res.success) {
                    alert(res.message);
                }
            });
        }

        const btnReset = document.getElementById('btn-reset-account');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm('Deseja realmente reiniciar seu saldo virtual para R$ 10.000,00?')) {
                    window.tradingEngine.resetAccount();
                    this.updateHeader();
                    this.renderHistory();
                    this.renderStats();
                    this.renderRanking();
                    if (window.soundEngine) window.soundEngine.playClick();
                }
            });
        }

        const btnAudio = document.getElementById('btn-toggle-audio');
        if (btnAudio) {
            btnAudio.addEventListener('click', () => {
                const isMuted = window.soundEngine.toggleMute();
                btnAudio.textContent = isMuted ? 'AUDIO: MUDO' : 'AUDIO: LIGADO';
                btnAudio.classList.toggle('muted', isMuted);
            });
        }
    }

    openApp(appName) {
        this.activeApp = appName;

        document.querySelectorAll('.desktop-window').forEach(win => {
            if (win.dataset.window === appName) {
                win.classList.remove('hidden');
            } else {
                win.classList.add('hidden');
            }
        });

        document.querySelectorAll('.app-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === appName);
        });

        if (appName === 'trading') {
            setTimeout(() => {
                this.chartEngine.resize();
                const curAsset = window.marketEngine.getSelectedAsset();
                const candles = window.marketEngine.history[window.marketEngine.selectedAssetId][window.marketEngine.selectedTimeframe];
                this.chartEngine.render(curAsset, candles);
            }, 60);
        } else if (appName === 'history') {
            this.renderHistory();
        } else if (appName === 'stats') {
            this.renderStats();
        } else if (appName === 'ranking') {
            this.renderRanking();
        } else if (appName === 'news') {
            this.renderNews();
        } else if (appName === 'settings') {
            if (window.roomScene) {
                window.roomScene.updateGraphicsUI();
            }
        }
    }

    closeApp(appName) {
        document.querySelectorAll('.desktop-window').forEach(win => {
            if (win.dataset.window === appName) {
                win.classList.add('hidden');
            }
        });

        document.querySelectorAll('.app-nav-btn').forEach(btn => {
            if (btn.dataset.tab === appName) {
                btn.classList.remove('active');
            }
        });

        if (this.activeApp === appName) {
            this.activeApp = null;
        }
    }

    startClock() {
        const clockEl = document.getElementById('system-clock');
        const update = () => {
            if (clockEl) {
                const d = new Date();
                clockEl.textContent = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
        };
        update();
        setInterval(update, 1000);
    }

    updateHeader() {
        const asset = window.marketEngine.getSelectedAsset();
        const curPriceEl = document.getElementById('header-current-price');
        const assetNameEl = document.getElementById('header-asset-name');
        const payoutEl = document.getElementById('header-payout-badge');
        const balanceEl = document.getElementById('header-user-balance');
        const var24hEl = document.getElementById('header-var-24h');

        if (assetNameEl) assetNameEl.textContent = asset.name;
        if (payoutEl) payoutEl.textContent = `RETORNO: +${asset.payout}%`;
        if (balanceEl) balanceEl.textContent = `R$ ${window.tradingEngine.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const wallpaperBal = document.getElementById('wallpaper-user-balance');
        if (wallpaperBal) wallpaperBal.textContent = `R$ ${window.tradingEngine.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (curPriceEl) {
            curPriceEl.textContent = asset.currentPrice.toFixed(asset.decimals);
        }

        if (var24hEl) {
            const diff = asset.currentPrice - asset.previousClose;
            const pct = (diff / asset.previousClose) * 100;
            const sign = pct >= 0 ? '+' : '';
            var24hEl.textContent = `${sign}${pct.toFixed(2)}%`;
            var24hEl.className = pct >= 0 ? 'badge-pos' : 'badge-neg';
        }

        const callReturnEl = document.getElementById('calc-call-return');
        const putReturnEl = document.getElementById('calc-put-return');
        const amt = window.tradingEngine.selectedAmount;
        const profit = amt * (asset.payout / 100);
        const total = amt + profit;

        if (callReturnEl) callReturnEl.textContent = `+R$ ${profit.toFixed(2)} (R$ ${total.toFixed(2)})`;
        if (putReturnEl) putReturnEl.textContent = `+R$ ${profit.toFixed(2)} (R$ ${total.toFixed(2)})`;
    }

    renderAssetList() {
        const listEl = document.getElementById('asset-list-container');
        if (!listEl) return;

        const cat = this.selectedCategory;
        const filtered = window.marketEngine.assets.filter(a => {
            if (cat === 'all') return true;
            return a.categoryKey === cat;
        });

        listEl.innerHTML = '';
        filtered.forEach(asset => {
            const item = document.createElement('div');
            item.className = `asset-item ${asset.id === window.marketEngine.selectedAssetId ? 'active' : ''}`;
            const diff = asset.currentPrice - asset.previousClose;
            const pct = (diff / asset.previousClose) * 100;
            const sign = pct >= 0 ? '+' : '';
            const colorClass = pct >= 0 ? 'text-pos' : 'text-neg';

            item.innerHTML = `
                <div class="asset-info-left">
                    <span class="asset-symbol">${asset.id.replace('_', '/')}</span>
                    <span class="asset-title">${asset.name}</span>
                </div>
                <div class="asset-info-right">
                    <span class="asset-price">${asset.currentPrice.toFixed(asset.decimals)}</span>
                    <span class="asset-var ${colorClass}">${sign}${pct.toFixed(2)}%</span>
                </div>
                <div class="asset-payout-tag">+${asset.payout}%</div>
            `;

            item.addEventListener('click', () => {
                window.marketEngine.setSelectedAsset(asset.id);
                this.renderAssetList();
                this.updateHeader();
                if (window.soundEngine) window.soundEngine.playClick();
            });

            listEl.appendChild(item);
        });
    }

    updateActiveTradesList() {
        const container = document.getElementById('active-trades-container');
        if (!container) return;

        const trades = window.tradingEngine.activeTrades;
        if (trades.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma ordem ativa no momento.</div>';
            return;
        }

        let html = '';
        trades.forEach(t => {
            const asset = window.marketEngine.assets.find(a => a.id === t.assetId);
            const curP = asset ? asset.currentPrice : t.strikePrice;
            const isCall = t.direction === 'SUBIR';
            const inMoney = isCall ? (curP > t.strikePrice) : (curP < t.strikePrice);
            const remain = Math.max(0, Math.ceil((t.expiresAt - Date.now()) / 1000));
            const statusClass = inMoney ? 'text-pos' : 'text-neg';
            const badgeClass = isCall ? 'badge-call' : 'badge-put';

            html += `
                <div class="active-trade-card">
                    <div class="atc-header">
                        <span class="${badgeClass}">${t.direction}</span>
                        <span class="atc-asset">${t.assetName}</span>
                        <span class="atc-timer">${remain}s</span>
                    </div>
                    <div class="atc-body">
                        <div>Entrada: <strong>${t.strikePrice.toFixed(t.decimals)}</strong></div>
                        <div>Atual: <strong class="${statusClass}">${curP.toFixed(t.decimals)}</strong></div>
                        <div>Valor: <strong>R$ ${t.amount.toFixed(2)}</strong></div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    renderHistory() {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;

        const list = window.tradingEngine.history;
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhuma operacao realizada ainda.</td></tr>';
            return;
        }

        let html = '';
        list.forEach(item => {
            const isWin = item.result === 'VITORIA';
            const isLoss = item.result === 'DERROTA';
            const resClass = isWin ? 'text-pos' : (isLoss ? 'text-neg' : 'text-neutral');
            const dirClass = item.direction === 'SUBIR' ? 'badge-call' : 'badge-put';
            const profitStr = (item.profit >= 0 ? '+R$ ' : '-R$ ') + Math.abs(item.profit).toFixed(2);

            html += `
                <tr>
                    <td>${item.timestamp}</td>
                    <td><strong>${item.assetName}</strong></td>
                    <td><span class="${dirClass}">${item.direction}</span></td>
                    <td>${item.strikePrice.toFixed(item.decimals)}</td>
                    <td>${item.closePrice.toFixed(item.decimals)}</td>
                    <td>R$ ${item.amount.toFixed(2)}</td>
                    <td><strong class="${resClass}">${item.result}</strong></td>
                    <td><strong class="${resClass}">${profitStr}</strong></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    renderStats() {
        const stats = window.tradingEngine.stats;
        const winRate = window.tradingEngine.getWinRate();

        const elWinRate = document.getElementById('stat-win-rate');
        const elTotalTrades = document.getElementById('stat-total-trades');
        const elWins = document.getElementById('stat-wins');
        const elLosses = document.getElementById('stat-losses');
        const elCurStreak = document.getElementById('stat-cur-streak');
        const elBestStreak = document.getElementById('stat-best-streak');
        const elTotalProfit = document.getElementById('stat-total-profit');

        if (elWinRate) elWinRate.textContent = `${winRate.toFixed(1)}%`;
        if (elTotalTrades) elTotalTrades.textContent = stats.totalTrades;
        if (elWins) elWins.textContent = stats.wins;
        if (elLosses) elLosses.textContent = stats.losses;
        if (elCurStreak) elCurStreak.textContent = stats.currentStreak;
        if (elBestStreak) elBestStreak.textContent = stats.bestStreak;
        if (elTotalProfit) {
            const p = stats.totalProfit;
            elTotalProfit.textContent = (p >= 0 ? '+R$ ' : '-R$ ') + Math.abs(p).toFixed(2);
            elTotalProfit.className = p >= 0 ? 'text-pos' : 'text-neg';
        }
    }

    renderRanking() {
        const tbody = document.getElementById('ranking-table-body');
        if (!tbody) return;

        const list = window.tradingEngine.rankingList;
        let html = '';
        list.forEach(item => {
            const isUser = item.name.includes('Voce');
            const rowClass = isUser ? 'ranking-user-row' : '';

            html += `
                <tr class="${rowClass}">
                    <td><strong>#${item.rank}</strong></td>
                    <td><strong>${item.name}</strong></td>
                    <td>R$ ${item.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${item.winRate.toFixed(1)}%</td>
                    <td>${item.streak} V</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    renderNews() {
        const listEl = document.getElementById('news-list-container');
        const fullListEl = document.getElementById('news-full-list');
        const news = window.marketEngine.newsList;

        let html = '';
        news.forEach(n => {
            html += `
                <div class="news-item">
                    <div class="news-time">${n.time}</div>
                    <div class="news-content">${n.text}</div>
                </div>
            `;
        });

        if (listEl) listEl.innerHTML = html;
        if (fullListEl) fullListEl.innerHTML = html;
    }

    showNotification(trade) {
        const toast = document.createElement('div');
        const isWin = trade.result === 'VITORIA';
        const isLoss = trade.result === 'DERROTA';
        const cls = isWin ? 'toast-win' : (isLoss ? 'toast-loss' : 'toast-tie');
        const sign = trade.profit >= 0 ? '+R$ ' : '-R$ ';

        toast.className = `trade-toast ${cls}`;
        toast.innerHTML = `
            <div class="toast-title">${trade.result}: ${trade.assetName}</div>
            <div class="toast-desc">Direcao: ${trade.direction} | Entrada: ${trade.strikePrice.toFixed(trade.decimals)} | Fechamento: ${trade.closePrice.toFixed(trade.decimals)}</div>
            <div class="toast-profit">${sign}${Math.abs(trade.profit).toFixed(2)}</div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}

window.DesktopUI = DesktopUI;
