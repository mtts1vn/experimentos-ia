class DesktopUI {
    constructor() {
        this.openApps = new Set();
        this.focusedApp = null;
        this.highestZIndex = 100;
        this.selectedCategory = 'all';
        this.selectedExchangeCategory = 'all';
        this.selectedExchangeAssetId = 'BTC_USDT';
        this.activeExchangeTab = 'positions';
        this.chartEngine = null;

        this.appConfigs = {
            trading: {
                title: 'CyberTrader',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00e676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-5 5"/><polyline points="14 9 18 9 18 13"/></svg>',
                defaultLeft: 100, defaultTop: 25, defaultWidth: 940, defaultHeight: 570
            },
            exchange: {
                title: 'Corretora Spot',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="6"/><path d="M15 6l4 3-4 3"/><path d="M19 9H9"/><path d="M9 18l-4-3 4-3"/><path d="M5 15h10"/></svg>',
                defaultLeft: 140, defaultTop: 40, defaultWidth: 900, defaultHeight: 560
            },
            history: {
                title: 'Historico de Operacoes',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/><path d="M4 12a8 8 0 0 1 2.3-5.6L4 4"/></svg>',
                defaultLeft: 180, defaultTop: 55, defaultWidth: 800, defaultHeight: 490
            },
            stats: {
                title: 'Estatisticas & Performance',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
                defaultLeft: 220, defaultTop: 70, defaultWidth: 720, defaultHeight: 460
            },
            ranking: {
                title: 'Ranking Global',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="M18 9h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"/><path d="M6 3h12v7a6 6 0 0 1-12 0V3z"/><path d="M9 21h6"/><path d="M12 16v5"/></svg>',
                defaultLeft: 260, defaultTop: 85, defaultWidth: 680, defaultHeight: 460
            },
            news: {
                title: 'Noticias do Mercado',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>',
                defaultLeft: 300, defaultTop: 100, defaultWidth: 650, defaultHeight: 460
            },
            copywriter: {
                title: 'Copywriter Center',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
                defaultLeft: 160, defaultTop: 35, defaultWidth: 880, defaultHeight: 560
            },
            casino: {
                title: 'Cassino Royale',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="8.5" cy="8.5" r="1.5" fill="#e11d48"/><circle cx="15.5" cy="8.5" r="1.5" fill="#e11d48"/><circle cx="12" cy="12" r="1.5" fill="#e11d48"/><circle cx="8.5" cy="15.5" r="1.5" fill="#e11d48"/><circle cx="15.5" cy="15.5" r="1.5" fill="#e11d48"/></svg>',
                defaultLeft: 120, defaultTop: 30, defaultWidth: 980, defaultHeight: 620
            },
            store: {
                title: 'DarkStore & Hardware',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
                defaultLeft: 140, defaultTop: 35, defaultWidth: 920, defaultHeight: 580
            },
            mining: {
                title: 'CryptoMiner Pro',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="12" r="2.5"/><line x1="12" y1="6" x2="12" y2="18"/></svg>',
                defaultLeft: 170, defaultTop: 45, defaultWidth: 860, defaultHeight: 540
            },
            settings: {
                title: 'Graficos & Configuracoes',
                svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ff8c00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
                defaultLeft: 340, defaultTop: 70, defaultWidth: 660, defaultHeight: 480
            }
        };

        this.init();
    }

    init() {
        this.chartEngine = new window.ChartEngine('trading-canvas');
        this.bindEvents();
        this.setupWindowDragAndResize();
        this.renderAssetList();
        this.renderHistory();
        this.renderStats();
        this.renderRanking();
        this.renderNews();
        this.renderExchange();
        this.updateHeader();
        this.updateAudioButtonUI();
        this.updateGraphicsButtonUI();
        this.startClock();

        window.marketEngine.subscribe((asset, candles) => {
            this.updateHeader();
            if (this.openApps.has('trading')) {
                const trdWin = document.querySelector('.desktop-window[data-window="trading"]');
                if (trdWin && !trdWin.classList.contains('hidden') && !trdWin.classList.contains('window-minimized')) {
                    this.chartEngine.setActiveTrades(window.tradingEngine.activeTrades);
                    this.chartEngine.render(asset, candles);
                }
            }
            this.updateActiveTradesList();
            this.updateAssetListPrices();
            if (this.openApps.has('exchange')) {
                const excWin = document.querySelector('.desktop-window[data-window="exchange"]');
                if (excWin && !excWin.classList.contains('hidden') && !excWin.classList.contains('window-minimized')) {
                    this.updateExchangeSummary();
                    if (this.activeExchangeTab === 'positions') {
                        this.updateExchangePositionsPrices();
                    } else if (this.activeExchangeTab === 'market') {
                        this.updateExchangeMarketPrices();
                        this.updateExchangeBuyPanel();
                    }
                }
            }
        });

        window.tradingEngine.onTradeUpdate = () => {
            this.updateHeader();
            this.updateActiveTradesList();
            this.renderHistory();
            this.renderStats();
            this.renderRanking();
            this.updateExchangeSummary();
            if (this.activeExchangeTab === 'positions') {
                this.updateExchangePositionsPrices();
            }
        };

        if (window.portfolioEngine) {
            window.portfolioEngine.onPortfolioUpdate = () => {
                this.updateHeader();
                this.renderExchange();
            };
        }

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
                e.stopPropagation();
                const app = e.currentTarget.dataset.app;
                this.closeApp(app);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.win-btn-minimize').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const app = e.currentTarget.dataset.app;
                this.minimizeApp(app);
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.win-btn-maximize').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const app = e.currentTarget.dataset.app;
                this.toggleMaximizeApp(app);
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

        document.querySelectorAll('.data-source-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const src = e.currentTarget.dataset.source;
                if (window.marketEngine) {
                    window.marketEngine.setDataSource(src);
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

        document.querySelectorAll('.spot-cat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.spot-cat-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedExchangeCategory = e.target.dataset.category;
                this.renderExchangeMarket();
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.exchange-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.exchange-tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.activeExchangeTab = e.target.dataset.exchangeTab;

                const posTab = document.getElementById('tab-positions-content');
                const mktTab = document.getElementById('tab-market-content');
                const hisTab = document.getElementById('tab-history-content');

                if (posTab) posTab.classList.toggle('hidden', this.activeExchangeTab !== 'positions');
                if (mktTab) mktTab.classList.toggle('hidden', this.activeExchangeTab !== 'market');
                if (hisTab) hisTab.classList.toggle('hidden', this.activeExchangeTab !== 'history');

                if (this.activeExchangeTab === 'positions') this.renderExchangePositions();
                else if (this.activeExchangeTab === 'market') this.renderExchangeMarket();
                else if (this.activeExchangeTab === 'history') this.renderExchangeHistory();

                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        document.querySelectorAll('.spot-quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.dataset.amount;
                const input = document.getElementById('input-spot-buy-amount');
                if (!input) return;
                if (val === 'max') {
                    const balance = window.tradingEngine ? window.tradingEngine.wallet.balance : 0;
                    input.value = Math.floor(balance);
                } else {
                    input.value = val;
                }
                this.updateExchangeBuyPanel();
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });

        const spotBuyInput = document.getElementById('input-spot-buy-amount');
        if (spotBuyInput) {
            spotBuyInput.addEventListener('input', () => {
                this.updateExchangeBuyPanel();
            });
        }

        const btnExecuteBuy = document.getElementById('btn-execute-spot-buy');
        if (btnExecuteBuy) {
            btnExecuteBuy.addEventListener('click', () => {
                const input = document.getElementById('input-spot-buy-amount');
                const amount = parseFloat(input ? input.value : 0);
                if (window.portfolioEngine) {
                    const res = window.portfolioEngine.buy(this.selectedExchangeAssetId, amount);
                    if (!res.success) {
                        alert(res.message);
                    } else {
                        this.showGenericNotification(res.message, 'success');
                        this.renderExchangePositions();
                        this.updateExchangeSummary();
                    }
                }
            });
        }

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
                const res = window.tradingEngine.executeTrade(curAsset, 'CALL');
                if (!res.success) {
                    alert(res.message);
                }
            });
        }

        const btnPut = document.getElementById('btn-action-put');
        if (btnPut) {
            btnPut.addEventListener('click', () => {
                const curAsset = window.marketEngine.getSelectedAsset();
                const res = window.tradingEngine.executeTrade(curAsset, 'PUT');
                if (!res.success) {
                    alert(res.message);
                }
            });
        }

        const btnReset = document.getElementById('btn-reset-account');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                const confirmed = confirm('ATENÇÃO: Deseja realmente formatar o jogo inteiro do zero e restaurar todos os padrões de fábrica?\n\nTodo o saldo, inventário, rigs de mineração, histórico, status e dados serão completamente apagados.');
                if (confirmed) {
                    const explicitKeys = [
                        'night_trader_data_source',
                        'night_trader_graphics',
                        'night_trader_addiction_state',
                        'night_trader_mining_state',
                        'night_trader_portfolio_holdings',
                        'night_trader_portfolio_history',
                        'night_trader_store_inventory',
                        'night_trader_store_deliveries',
                        'night_trader_balance',
                        'night_trader_history',
                        'night_trader_stats',
                        'night_trader_ranking',
                        'night_trader_active_asset'
                    ];
                    explicitKeys.forEach(k => localStorage.removeItem(k));
                    const keys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        if (k && k.toLowerCase().includes('night_trader')) {
                            keys.push(k);
                        }
                    }
                    keys.forEach(k => localStorage.removeItem(k));
                    if (window.soundEngine && window.soundEngine.playClick) {
                        window.soundEngine.playClick();
                    }
                    window.location.reload();
                }
            });
        }

        const btnAudio = document.getElementById('btn-toggle-audio');
        if (btnAudio) {
            btnAudio.addEventListener('click', () => {
                if (window.soundEngine) {
                    window.soundEngine.toggleMute();
                }
                this.updateAudioButtonUI();
                if (window.soundEngine) window.soundEngine.playClick();
            });
        }

        const btnDeskGfx = document.getElementById('btn-desktop-graphics');
        if (btnDeskGfx) {
            btnDeskGfx.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.roomScene) {
                    window.roomScene.cycleGraphicsQuality();
                } else {
                    const cur = localStorage.getItem('night_trader_graphics') || 'high';
                    const next = cur === 'high' ? 'medium' : (cur === 'medium' ? 'low' : 'high');
                    localStorage.setItem('night_trader_graphics', next);
                    this.updateGraphicsButtonUI(next);
                    document.querySelectorAll('.preset-card').forEach(card => {
                        card.classList.toggle('active', card.dataset.preset === next);
                    });
                }
                if (window.soundEngine) window.soundEngine.playClick();
            });
        }

        const btnLauncher = document.getElementById('btn-dock-launcher');
        if (btnLauncher) {
            btnLauncher.addEventListener('click', () => {
                this.openApp('trading');
                if (window.soundEngine) window.soundEngine.playClick();
            });
        }
    }

    setupWindowDragAndResize() {
        const desktopArea = document.querySelector('.desktop-windows-area');

        document.querySelectorAll('.desktop-window').forEach(win => {
            const appName = win.dataset.window;
            const titlebar = win.querySelector('.window-titlebar');
            const resizeHandle = win.querySelector('.win-resize-handle');

            win.addEventListener('pointerdown', () => {
                this.focusWindow(appName);
            });

            if (titlebar) {
                let isDragging = false;
                let startPointerX = 0;
                let startPointerY = 0;
                let startWinLeft = 0;
                let startWinTop = 0;

                titlebar.addEventListener('dblclick', (e) => {
                    if (e.target.closest('.win-btn-control')) return;
                    this.toggleMaximizeApp(appName);
                });

                titlebar.addEventListener('pointerdown', (e) => {
                    if (e.target.closest('.win-btn-control')) return;
                    this.focusWindow(appName);

                    if (win.classList.contains('window-maximized')) {
                        const rect = win.getBoundingClientRect();
                        win.classList.remove('window-maximized');
                        this.updateMaximizeButtonUI(win, false);

                        const newWidth = parseFloat(win.dataset.preMaxWidth) || 800;
                        const newHeight = parseFloat(win.dataset.preMaxHeight) || 500;
                        win.style.width = `${newWidth}px`;
                        win.style.height = `${newHeight}px`;

                        const ratio = (e.clientX - rect.left) / rect.width;
                        const newLeft = Math.max(0, e.clientX - (newWidth * ratio));
                        win.style.left = `${newLeft}px`;
                        win.style.top = '10px';
                    }

                    isDragging = true;
                    startPointerX = e.clientX;
                    startPointerY = e.clientY;
                    startWinLeft = win.offsetLeft;
                    startWinTop = win.offsetTop;
                    titlebar.setPointerCapture(e.pointerId);
                });

                titlebar.addEventListener('pointermove', (e) => {
                    if (!isDragging) return;
                    const dx = e.clientX - startPointerX;
                    const dy = e.clientY - startPointerY;
                    const containerWidth = desktopArea ? desktopArea.clientWidth : window.innerWidth;
                    const containerHeight = desktopArea ? desktopArea.clientHeight : window.innerHeight;

                    const newLeft = Math.min(Math.max(-win.offsetWidth + 80, startWinLeft + dx), containerWidth - 80);
                    const newTop = Math.min(Math.max(0, startWinTop + dy), containerHeight - 40);

                    win.style.left = `${newLeft}px`;
                    win.style.top = `${newTop}px`;
                });

                const stopDrag = (e) => {
                    if (isDragging) {
                        isDragging = false;
                        try { titlebar.releasePointerCapture(e.pointerId); } catch (_) {}
                    }
                };

                titlebar.addEventListener('pointerup', stopDrag);
                titlebar.addEventListener('pointercancel', stopDrag);
            }

            if (resizeHandle) {
                let isResizing = false;
                let startPointerX = 0;
                let startPointerY = 0;
                let startWidth = 0;
                let startHeight = 0;

                resizeHandle.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                    if (win.classList.contains('window-maximized')) return;
                    this.focusWindow(appName);
                    isResizing = true;
                    startPointerX = e.clientX;
                    startPointerY = e.clientY;
                    startWidth = win.offsetWidth;
                    startHeight = win.offsetHeight;
                    resizeHandle.setPointerCapture(e.pointerId);
                });

                resizeHandle.addEventListener('pointermove', (e) => {
                    if (!isResizing) return;
                    const dx = e.clientX - startPointerX;
                    const dy = e.clientY - startPointerY;
                    const containerWidth = desktopArea ? desktopArea.clientWidth : window.innerWidth;
                    const containerHeight = desktopArea ? desktopArea.clientHeight : window.innerHeight;

                    const newWidth = Math.min(Math.max(380, startWidth + dx), containerWidth - win.offsetLeft);
                    const newHeight = Math.min(Math.max(240, startHeight + dy), containerHeight - win.offsetTop);

                    win.style.width = `${newWidth}px`;
                    win.style.height = `${newHeight}px`;

                    if (appName === 'trading' && this.chartEngine) {
                        this.chartEngine.resize();
                    }
                });

                const stopResize = (e) => {
                    if (isResizing) {
                        isResizing = false;
                        try { resizeHandle.releasePointerCapture(e.pointerId); } catch (_) {}
                        if (appName === 'trading' && this.chartEngine) {
                            this.chartEngine.resize();
                        }
                    }
                };

                resizeHandle.addEventListener('pointerup', stopResize);
                resizeHandle.addEventListener('pointercancel', stopResize);
            }
        });
    }

    openApp(appName) {
        const win = document.querySelector(`.desktop-window[data-window="${appName}"]`);
        if (!win) return;

        const config = this.appConfigs[appName];
        if (!this.openApps.has(appName)) {
            this.openApps.add(appName);
            if (!win.dataset.initializedPos && config) {
                win.style.left = `${config.defaultLeft}px`;
                win.style.top = `${config.defaultTop}px`;
                win.style.width = `${config.defaultWidth}px`;
                win.style.height = `${config.defaultHeight}px`;
                win.dataset.initializedPos = 'true';
            }
        }

        win.classList.remove('hidden', 'window-minimized');
        this.focusWindow(appName);
        this.updateTaskbar();

        if (appName === 'trading') {
            setTimeout(() => {
                if (this.chartEngine) this.chartEngine.resize();
                const curAsset = window.marketEngine.getSelectedAsset();
                const candles = window.marketEngine.history[window.marketEngine.selectedAssetId][window.marketEngine.selectedTimeframe];
                this.chartEngine.render(curAsset, candles);
            }, 60);
        } else if (appName === 'exchange') {
            this.renderExchange();
        } else if (appName === 'history') {
            this.renderHistory();
        } else if (appName === 'stats') {
            this.renderStats();
        } else if (appName === 'ranking') {
            this.renderRanking();
        } else if (appName === 'news') {
            this.renderNews();
        } else if (appName === 'copywriter') {
            if (window.copywriterEngine) window.copywriterEngine.render();
        } else if (appName === 'casino') {
            if (window.casinoEngine) window.casinoEngine.render();
        } else if (appName === 'store') {
            if (window.storeEngine) window.storeEngine.render();
        } else if (appName === 'mining') {
            if (window.miningEngine) window.miningEngine.render();
        } else if (appName === 'settings') {
            if (window.roomScene) window.roomScene.updateGraphicsUI();
            if (window.marketEngine) window.marketEngine.updateConnectionStatus(window.marketEngine.isWsConnected);
        }
    }

    focusWindow(appName) {
        const win = document.querySelector(`.desktop-window[data-window="${appName}"]`);
        if (!win || win.classList.contains('hidden')) return;

        if (win.classList.contains('window-minimized')) {
            win.classList.remove('window-minimized');
        }

        this.highestZIndex += 2;
        win.style.zIndex = this.highestZIndex;

        document.querySelectorAll('.desktop-window').forEach(w => {
            w.classList.toggle('window-focused', w === win);
        });

        this.focusedApp = appName;
        this.updateTaskbar();
    }

    minimizeApp(appName) {
        const win = document.querySelector(`.desktop-window[data-window="${appName}"]`);
        if (!win) return;

        win.classList.add('window-minimized');
        win.classList.remove('window-focused');

        if (this.focusedApp === appName) {
            this.focusedApp = null;
            let nextWin = null;
            let highestZ = -1;
            this.openApps.forEach(otherApp => {
                if (otherApp !== appName) {
                    const otherEl = document.querySelector(`.desktop-window[data-window="${otherApp}"]`);
                    if (otherEl && !otherEl.classList.contains('hidden') && !otherEl.classList.contains('window-minimized')) {
                        const z = parseInt(otherEl.style.zIndex, 10) || 0;
                        if (z > highestZ) {
                            highestZ = z;
                            nextWin = otherApp;
                        }
                    }
                }
            });
            if (nextWin) {
                this.focusWindow(nextWin);
            }
        }

        this.updateTaskbar();
    }

    toggleMaximizeApp(appName) {
        const win = document.querySelector(`.desktop-window[data-window="${appName}"]`);
        if (!win) return;

        const isMaximized = win.classList.toggle('window-maximized');
        this.updateMaximizeButtonUI(win, isMaximized);

        if (isMaximized) {
            win.dataset.preMaxWidth = win.offsetWidth;
            win.dataset.preMaxHeight = win.offsetHeight;
            win.dataset.preMaxLeft = win.offsetLeft;
            win.dataset.preMaxTop = win.offsetTop;
        } else {
            const w = parseFloat(win.dataset.preMaxWidth) || 800;
            const h = parseFloat(win.dataset.preMaxHeight) || 500;
            const l = parseFloat(win.dataset.preMaxLeft) || 50;
            const t = parseFloat(win.dataset.preMaxTop) || 50;
            win.style.width = `${w}px`;
            win.style.height = `${h}px`;
            win.style.left = `${l}px`;
            win.style.top = `${t}px`;
        }

        if (appName === 'trading' && this.chartEngine) {
            setTimeout(() => this.chartEngine.resize(), 50);
        }

        this.focusWindow(appName);
    }

    closeApp(appName) {
        const win = document.querySelector(`.desktop-window[data-window="${appName}"]`);
        if (win) {
            win.classList.add('hidden');
            win.classList.remove('window-focused', 'window-minimized', 'window-maximized');
            this.updateMaximizeButtonUI(win, false);
        }

        this.openApps.delete(appName);

        if (this.focusedApp === appName) {
            this.focusedApp = null;
            let nextWin = null;
            let highestZ = -1;
            this.openApps.forEach(otherApp => {
                const otherEl = document.querySelector(`.desktop-window[data-window="${otherApp}"]`);
                if (otherEl && !otherEl.classList.contains('hidden') && !otherEl.classList.contains('window-minimized')) {
                    const z = parseInt(otherEl.style.zIndex, 10) || 0;
                    if (z > highestZ) {
                        highestZ = z;
                        nextWin = otherApp;
                    }
                }
            });
            if (nextWin) {
                this.focusWindow(nextWin);
            }
        }

        this.updateTaskbar();
    }

    updateTaskbar() {
        const container = document.getElementById('dynamic-taskbar-apps');
        if (!container) return;

        container.innerHTML = '';
        this.openApps.forEach(appName => {
            const config = this.appConfigs[appName] || { title: appName, svg: '' };
            const win = document.querySelector(`.desktop-window[data-window="${appName}"]`);
            const isMinimized = win ? win.classList.contains('window-minimized') : false;
            const isFocused = this.focusedApp === appName && !isMinimized;

            const btn = document.createElement('div');
            btn.className = `dock-app-item ${isFocused ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`;
            btn.dataset.app = appName;
            btn.title = config.title;
            btn.innerHTML = `
                <span class="dock-app-indicator"></span>
                <div class="dock-app-icon-wrap">${config.svg}</div>
            `;

            btn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playClick();
                if (this.focusedApp === appName && !isMinimized) {
                    this.minimizeApp(appName);
                } else {
                    this.openApp(appName);
                }
            });

            container.appendChild(btn);
        });
    }

    startClock() {
        const clockEl = document.getElementById('system-clock');
        const update = () => {
            if (clockEl) {
                const d = new Date();
                clockEl.textContent = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
        const cwBal = document.getElementById('copywriter-wallet-balance');
        if (cwBal) cwBal.textContent = `R$ ${window.tradingEngine.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (window.storeEngine) window.storeEngine.renderBalance();
        if (window.casinoEngine) window.casinoEngine.updateBalanceDisplays();
        if (window.miningEngine) window.miningEngine.updateLiveDisplays();
        if (window.addictionEngine) window.addictionEngine.updateHUD();

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

    updateAssetListPrices() {
        const listEl = document.getElementById('asset-list-container');
        if (!listEl) return;
        const items = listEl.querySelectorAll('.asset-item');
        items.forEach(item => {
            const symEl = item.querySelector('.asset-symbol');
            if (!symEl) return;
            const assetId = symEl.textContent.replace('/', '_');
            const asset = window.marketEngine.assets.find(a => a.id === assetId);
            if (asset) {
                const priceEl = item.querySelector('.asset-price');
                const varEl = item.querySelector('.asset-var');
                if (priceEl) priceEl.textContent = asset.currentPrice.toFixed(asset.decimals);
                if (varEl) {
                    const diff = asset.currentPrice - asset.previousClose;
                    const pct = (diff / asset.previousClose) * 100;
                    const sign = pct >= 0 ? '+' : '';
                    varEl.textContent = `${sign}${pct.toFixed(2)}%`;
                    varEl.className = `asset-var ${pct >= 0 ? 'text-pos' : 'text-neg'}`;
                }
                item.classList.toggle('active', asset.id === window.marketEngine.selectedAssetId);
            }
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
            const strike = typeof t.entryPrice === 'number' ? t.entryPrice : t.strikePrice;
            const curP = asset ? asset.currentPrice : strike;
            const isCall = t.direction === 'CALL' || t.direction === 'SUBIR';
            const inMoney = isCall ? (curP > strike) : (curP < strike);
            const remain = Math.max(0, Math.ceil((t.expiresAt - Date.now()) / 1000));
            const statusClass = inMoney ? 'text-pos' : 'text-neg';
            const badgeClass = isCall ? 'badge-call' : 'badge-put';
            const dirLabel = t.displayDirection || (isCall ? 'SUBIR' : 'DESCER');

            html += `
                <div class="active-trade-card">
                    <div class="atc-header">
                        <span class="${badgeClass}">${dirLabel}</span>
                        <span class="atc-asset">${t.assetName}</span>
                        <span class="atc-timer">${remain}s</span>
                    </div>
                    <div class="atc-body">
                        <div>Entrada: <strong>${strike.toFixed(t.decimals)}</strong></div>
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

    renderExchange() {
        this.updateExchangeSummary();
        if (this.activeExchangeTab === 'positions') {
            this.renderExchangePositions();
        } else if (this.activeExchangeTab === 'market') {
            this.renderExchangeMarket();
        } else if (this.activeExchangeTab === 'history') {
            this.renderExchangeHistory();
        }
        this.updateExchangeBuyPanel();
    }

    updateExchangeSummary() {
        if (!window.portfolioEngine) return;
        const summary = window.portfolioEngine.getSummary();

        const elNetWorth = document.getElementById('exchange-total-networth');
        const elCash = document.getElementById('exchange-cash-balance');
        const elPillCash = document.getElementById('pill-cash-balance');
        const elPillVal = document.getElementById('pill-crypto-valuation');
        const elPillInv = document.getElementById('pill-total-invested');
        const elPillPnl = document.getElementById('pill-unrealized-pnl');

        const netStr = `R$ ${summary.totalNetWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const cashStr = `R$ ${summary.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const valStr = `R$ ${summary.currentValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const invStr = `R$ ${summary.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const pnlSign = summary.unrealizedPnL >= 0 ? '+' : '';
        const pnlPctSign = summary.unrealizedPnLPct >= 0 ? '+' : '';
        const pnlStr = `${pnlSign}R$ ${summary.unrealizedPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pnlPctSign}${summary.unrealizedPnLPct.toFixed(2)}%)`;

        if (elNetWorth) elNetWorth.textContent = netStr;
        if (elCash) elCash.textContent = cashStr;
        if (elPillCash) elPillCash.textContent = cashStr;
        if (elPillVal) elPillVal.textContent = valStr;
        if (elPillInv) elPillInv.textContent = invStr;
        if (elPillPnl) {
            elPillPnl.textContent = pnlStr;
            elPillPnl.className = `pill-val ${summary.unrealizedPnL >= 0 ? 'text-pos' : 'text-neg'}`;
        }
    }

    renderExchangePositions() {
        const container = document.getElementById('exchange-positions-container');
        if (!container || !window.portfolioEngine) return;

        const positions = window.portfolioEngine.positions;
        if (positions.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center;">Sua carteira spot esta vazia. Clique na aba <strong>COMPRAR ATIVOS</strong> para adquirir criptomoedas, moedas e acoes.</div>';
            return;
        }

        let html = '';
        positions.forEach(pos => {
            const asset = window.marketEngine ? window.marketEngine.assets.find(a => a.id === pos.assetId) : null;
            const currentPrice = asset ? asset.currentPrice : pos.avgBuyPrice;
            const currentVal = pos.quantity * currentPrice;
            const pnl = currentVal - pos.totalInvested;
            const pnlPct = pos.totalInvested > 0 ? (pnl / pos.totalInvested) * 100 : 0;

            const isPos = pnl >= 0;
            const pnlColorClass = isPos ? 'badge-pos' : 'badge-neg';
            const sign = isPos ? '+' : '';
            const qtyStr = pos.quantity.toFixed(pos.decimals > 2 ? 6 : 4);

            html += `
                <div class="position-card" data-asset-id="${pos.assetId}">
                    <div class="pos-card-header">
                        <div>
                            <div class="pos-asset-symbol">${pos.assetId.replace('_', '/')}</div>
                            <div class="pos-asset-category">${pos.assetName}</div>
                        </div>
                        <div class="pos-pnl-badge ${pnlColorClass}">
                            ${sign}${pnlPct.toFixed(2)}%
                        </div>
                    </div>
                    <div class="pos-card-metrics">
                        <div class="pos-metric">
                            <span class="pos-metric-label">QUANTIDADE</span>
                            <span class="pos-metric-value pos-val-qty">${qtyStr}</span>
                        </div>
                        <div class="pos-metric">
                            <span class="pos-metric-label">VALOR ATUAL</span>
                            <span class="pos-metric-value pos-val-current">R$ ${currentVal.toFixed(2)}</span>
                        </div>
                        <div class="pos-metric">
                            <span class="pos-metric-label">PRECO MEDIO</span>
                            <span class="pos-metric-value pos-val-avg">${pos.avgBuyPrice.toFixed(pos.decimals)}</span>
                        </div>
                        <div class="pos-metric">
                            <span class="pos-metric-label">COTACAO ATUAL</span>
                            <span class="pos-metric-value pos-val-price">${currentPrice.toFixed(pos.decimals)}</span>
                        </div>
                        <div class="pos-metric">
                            <span class="pos-metric-label">TOTAL INVESTIDO</span>
                            <span class="pos-metric-value pos-val-invested">R$ ${pos.totalInvested.toFixed(2)}</span>
                        </div>
                        <div class="pos-metric">
                            <span class="pos-metric-label">LUCRO / PREJUIZO</span>
                            <span class="pos-metric-value pos-val-pnl ${isPos ? 'text-pos' : 'text-neg'}">${sign}R$ ${pnl.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="pos-card-actions">
                        <button class="btn-pos-action btn-pos-buy-more" data-action="buy-more" data-asset-id="${pos.assetId}">+ COMPRAR</button>
                        <button class="btn-pos-action btn-pos-sell-half" data-action="sell-50" data-asset-id="${pos.assetId}">VENDER 50%</button>
                        <button class="btn-pos-action btn-pos-sell-all" data-action="sell-100" data-asset-id="${pos.assetId}">VENDER 100%</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        container.querySelectorAll('.btn-pos-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const assetId = e.currentTarget.dataset.assetId;

                if (action === 'buy-more') {
                    this.selectedExchangeAssetId = assetId;
                    const tabBtn = document.querySelector('.exchange-tab-btn[data-exchange-tab="market"]');
                    if (tabBtn) tabBtn.click();
                } else if (action === 'sell-50') {
                    if (window.portfolioEngine) {
                        const res = window.portfolioEngine.sell(assetId, 0.5);
                        this.showGenericNotification(res.message, res.success ? 'success' : 'error');
                        this.renderExchange();
                    }
                } else if (action === 'sell-100') {
                    if (window.portfolioEngine) {
                        const res = window.portfolioEngine.sell(assetId, 1.0);
                        this.showGenericNotification(res.message, res.success ? 'success' : 'error');
                        this.renderExchange();
                    }
                }
            });
        });
    }

    updateExchangePositionsPrices() {
        const container = document.getElementById('exchange-positions-container');
        if (!container || !window.portfolioEngine) return;

        const positions = window.portfolioEngine.positions;
        if (positions.length === 0) return;

        const cards = container.querySelectorAll('.position-card');
        cards.forEach(card => {
            const assetId = card.dataset.assetId;
            const pos = positions.find(p => p.assetId === assetId);
            if (!pos) return;

            const asset = window.marketEngine ? window.marketEngine.assets.find(a => a.id === pos.assetId) : null;
            const currentPrice = asset ? asset.currentPrice : pos.avgBuyPrice;
            const currentVal = pos.quantity * currentPrice;
            const pnl = currentVal - pos.totalInvested;
            const pnlPct = pos.totalInvested > 0 ? (pnl / pos.totalInvested) * 100 : 0;

            const isPos = pnl >= 0;
            const pnlColorClass = isPos ? 'badge-pos' : 'badge-neg';
            const sign = isPos ? '+' : '';

            const badgeEl = card.querySelector('.pos-pnl-badge');
            if (badgeEl) {
                badgeEl.className = `pos-pnl-badge ${pnlColorClass}`;
                badgeEl.textContent = `${sign}${pnlPct.toFixed(2)}%`;
            }

            const currentValEl = card.querySelector('.pos-val-current');
            if (currentValEl) currentValEl.textContent = `R$ ${currentVal.toFixed(2)}`;

            const priceEl = card.querySelector('.pos-val-price');
            if (priceEl) priceEl.textContent = currentPrice.toFixed(pos.decimals);

            const pnlEl = card.querySelector('.pos-val-pnl');
            if (pnlEl) {
                pnlEl.className = `pos-metric-value pos-val-pnl ${isPos ? 'text-pos' : 'text-neg'}`;
                pnlEl.textContent = `${sign}R$ ${pnl.toFixed(2)}`;
            }
        });
    }

    renderExchangeMarket() {
        const container = document.getElementById('exchange-market-assets');
        if (!container || !window.marketEngine) return;

        const cat = this.selectedExchangeCategory;
        const filtered = window.marketEngine.assets.filter(a => {
            if (cat === 'all') return true;
            return a.categoryKey === cat;
        });

        let html = '';
        filtered.forEach(asset => {
            const isSelected = asset.id === this.selectedExchangeAssetId;
            const diff = asset.currentPrice - asset.previousClose;
            const pct = (diff / asset.previousClose) * 100;
            const sign = pct >= 0 ? '+' : '';
            const colorClass = pct >= 0 ? 'text-pos' : 'text-neg';

            html += `
                <div class="spot-market-item ${isSelected ? 'active' : ''}" data-asset-id="${asset.id}">
                    <div class="spot-item-left">
                        <span class="spot-item-sym">${asset.id.replace('_', '/')}</span>
                        <span class="spot-item-name">${asset.name}</span>
                    </div>
                    <div class="spot-item-right">
                        <span class="spot-item-price">${asset.currentPrice.toFixed(asset.decimals)}</span>
                        <span class="asset-var ${colorClass}">${sign}${pct.toFixed(2)}%</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        container.querySelectorAll('.spot-market-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.selectedExchangeAssetId = e.currentTarget.dataset.assetId;
                this.renderExchangeMarket();
                this.updateExchangeBuyPanel();
                if (window.soundEngine) window.soundEngine.playClick();
            });
        });
    }

    updateExchangeMarketPrices() {
        const container = document.getElementById('exchange-market-assets');
        if (!container) return;
        const items = container.querySelectorAll('.spot-market-item');
        items.forEach(item => {
            const assetId = item.dataset.assetId;
            const asset = window.marketEngine ? window.marketEngine.assets.find(a => a.id === assetId) : null;
            if (asset) {
                const priceEl = item.querySelector('.spot-item-price');
                const varEl = item.querySelector('.asset-var');
                if (priceEl) priceEl.textContent = asset.currentPrice.toFixed(asset.decimals);
                if (varEl) {
                    const diff = asset.currentPrice - asset.previousClose;
                    const pct = (diff / asset.previousClose) * 100;
                    const sign = pct >= 0 ? '+' : '';
                    varEl.textContent = `${sign}${pct.toFixed(2)}%`;
                    varEl.className = `asset-var ${pct >= 0 ? 'text-pos' : 'text-neg'}`;
                }
                item.classList.toggle('active', asset.id === this.selectedExchangeAssetId);
            }
        });
    }

    updateExchangeBuyPanel() {
        const asset = window.marketEngine ? window.marketEngine.assets.find(a => a.id === this.selectedExchangeAssetId) : null;
        if (!asset) return;

        const symEl = document.getElementById('buy-asset-symbol');
        const nameEl = document.getElementById('buy-asset-name');
        const priceEl = document.getElementById('buy-asset-price');
        const estimateEl = document.getElementById('buy-estimate-qty');
        const input = document.getElementById('input-spot-buy-amount');

        if (symEl) symEl.textContent = asset.id.replace('_', '/');
        if (nameEl) nameEl.textContent = asset.name;
        if (priceEl) priceEl.textContent = `R$ ${asset.currentPrice.toFixed(asset.decimals)}`;

        const amount = parseFloat(input ? input.value : 0);
        if (estimateEl && asset.currentPrice > 0) {
            if (!isNaN(amount) && amount > 0) {
                const qty = amount / asset.currentPrice;
                const sym = asset.id.split('_')[0];
                estimateEl.textContent = `${qty.toFixed(asset.decimals > 2 ? 6 : 4)} ${sym}`;
            } else {
                estimateEl.textContent = `0.00`;
            }
        }
    }

    renderExchangeHistory() {
        const tbody = document.getElementById('spot-history-table-body');
        if (!tbody || !window.portfolioEngine) return;

        const list = window.portfolioEngine.history;
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma ordem spot realizada ainda.</td></tr>';
            return;
        }

        let html = '';
        list.forEach(tx => {
            const isBuy = tx.type === 'COMPRA';
            const badgeClass = isBuy ? 'badge-call' : 'badge-put';
            const profitStr = tx.profit !== undefined ? ((tx.profit >= 0 ? '+R$ ' : '-R$ ') + Math.abs(tx.profit).toFixed(2)) : '--';
            const profitClass = tx.profit !== undefined ? (tx.profit >= 0 ? 'text-pos' : 'text-neg') : '';

            html += `
                <tr>
                    <td>${tx.timestamp}</td>
                    <td><span class="${badgeClass}">${tx.type}</span></td>
                    <td><strong>${tx.assetName}</strong></td>
                    <td>${tx.quantity.toFixed(tx.decimals > 2 ? 6 : 4)}</td>
                    <td>${tx.price.toFixed(tx.decimals)}</td>
                    <td>R$ ${tx.totalBrl.toFixed(2)}</td>
                    <td><strong class="${profitClass}">${profitStr}</strong></td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    showGenericNotification(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `trade-toast ${type === 'success' ? 'toast-win' : 'toast-loss'}`;
        toast.innerHTML = `
            <div class="toast-title">ORDEM EXECUTADA</div>
            <div class="toast-desc">${msg}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
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

    updateAudioButtonUI() {
        const btnAudio = document.getElementById('btn-toggle-audio');
        if (!btnAudio) return;
        const isMuted = window.soundEngine ? window.soundEngine.muted : false;
        btnAudio.classList.toggle('muted', isMuted);
        if (isMuted) {
            btnAudio.title = 'Audio: Mudo (Clique para ativar som)';
            btnAudio.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff3d71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
        } else {
            btnAudio.title = 'Audio: Ligado (Clique para mutar)';
            btnAudio.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        }
    }

    updateGraphicsButtonUI(quality) {
        const q = quality || (window.roomScene ? window.roomScene.graphicsQuality : (localStorage.getItem('night_trader_graphics') || 'high'));
        const deskBtn = document.getElementById('btn-desktop-graphics');
        if (!deskBtn) return;
        if (q === 'low') {
            deskBtn.title = 'Graficos: Baixo / Max FPS (Clique para alternar)';
            deskBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="13 7 10 11 14 11 11 15"/></svg>';
        } else if (q === 'medium') {
            deskBtn.title = 'Graficos: Medio / Equilibrado (Clique para alternar)';
            deskBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="6" y1="10" x2="18" y2="10"/></svg>';
        } else {
            deskBtn.title = 'Graficos: Alto / Maxima Fidelidade (Clique para alternar)';
            deskBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00e676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><circle cx="7" cy="8" r="1.5" fill="#00e676"/><path d="M12 7l2 6 3-3"/></svg>';
        }
    }

    updateMaximizeButtonUI(win, isMaximized) {
        const maxBtn = win ? win.querySelector('.win-btn-maximize') : null;
        if (!maxBtn) return;
        if (isMaximized) {
            maxBtn.title = 'Restaurar Janela';
            maxBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="4" width="13" height="13" rx="1"/><polyline points="4 8 4 20 16 20"/></svg>';
        } else {
            maxBtn.title = 'Maximizar Janela';
            maxBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>';
        }
    }
}

window.DesktopUI = DesktopUI;
