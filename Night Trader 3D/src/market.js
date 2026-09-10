class MarketEngine {
    constructor() {
        this.dataSource = localStorage.getItem('night_trader_data_source') || 'real';

        this.realAssets = [
            {
                id: 'BTC_USDT',
                name: 'Bitcoin / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 90000.00,
                currentPrice: 90000.00,
                previousClose: 89200.00,
                volatility: 0.0018,
                payout: 88,
                decimals: 2,
                trend: 0.0001,
                high24h: 91500.00,
                low24h: 88400.00,
                volume24h: 42000.5
            },
            {
                id: 'ETH_USDT',
                name: 'Ethereum / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 2700.00,
                currentPrice: 2700.00,
                previousClose: 2650.00,
                volatility: 0.0022,
                payout: 87,
                decimals: 2,
                trend: 0.00005,
                high24h: 2780.00,
                low24h: 2620.00,
                volume24h: 180000.0
            },
            {
                id: 'SOL_USDT',
                name: 'Solana / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 190.00,
                currentPrice: 190.00,
                previousClose: 184.00,
                volatility: 0.0035,
                payout: 90,
                decimals: 2,
                trend: 0.0002,
                high24h: 198.50,
                low24h: 181.00,
                volume24h: 950000.0
            },
            {
                id: 'BNB_USDT',
                name: 'BNB / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 650.00,
                currentPrice: 650.00,
                previousClose: 638.00,
                volatility: 0.0020,
                payout: 87,
                decimals: 2,
                trend: 0.0001,
                high24h: 665.00,
                low24h: 630.00,
                volume24h: 410000.0
            },
            {
                id: 'XRP_USDT',
                name: 'XRP / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 1.4500,
                currentPrice: 1.4500,
                previousClose: 1.3800,
                volatility: 0.0030,
                payout: 85,
                decimals: 4,
                trend: 0.0001,
                high24h: 1.5200,
                low24h: 1.3500,
                volume24h: 18500000.0
            },
            {
                id: 'DOGE_USDT',
                name: 'Dogecoin / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 0.2200,
                currentPrice: 0.2200,
                previousClose: 0.2100,
                volatility: 0.0040,
                payout: 86,
                decimals: 4,
                trend: 0.0002,
                high24h: 0.2350,
                low24h: 0.2050,
                volume24h: 22000000.0
            },
            {
                id: 'ADA_USDT',
                name: 'Cardano / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 0.7200,
                currentPrice: 0.7200,
                previousClose: 0.6900,
                volatility: 0.0032,
                payout: 86,
                decimals: 4,
                trend: 0.0001,
                high24h: 0.7600,
                low24h: 0.6700,
                volume24h: 12000000.0
            },
            {
                id: 'AVAX_USDT',
                name: 'Avalanche / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 28.50,
                currentPrice: 28.50,
                previousClose: 27.20,
                volatility: 0.0035,
                payout: 88,
                decimals: 2,
                trend: 0.00015,
                high24h: 29.80,
                low24h: 26.80,
                volume24h: 1500000.0
            },
            {
                id: 'LINK_USDT',
                name: 'Chainlink / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 18.20,
                currentPrice: 18.20,
                previousClose: 17.50,
                volatility: 0.0030,
                payout: 87,
                decimals: 2,
                trend: 0.0001,
                high24h: 19.10,
                low24h: 17.10,
                volume24h: 890000.0
            },
            {
                id: 'DOT_USDT',
                name: 'Polkadot / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 7.80,
                currentPrice: 7.80,
                previousClose: 7.40,
                volatility: 0.0032,
                payout: 86,
                decimals: 2,
                trend: 0.0001,
                high24h: 8.20,
                low24h: 7.20,
                volume24h: 750000.0
            },
            {
                id: 'NEAR_USDT',
                name: 'NEAR / USDT',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 5.400,
                currentPrice: 5.400,
                previousClose: 5.150,
                volatility: 0.0038,
                payout: 89,
                decimals: 3,
                trend: 0.0002,
                high24h: 5.750,
                low24h: 5.050,
                volume24h: 1900000.0
            },
            {
                id: 'PAXG_USDT',
                name: 'Paxos Gold / USDT',
                category: 'Commodities',
                categoryKey: 'commodities',
                basePrice: 2700.00,
                currentPrice: 2700.00,
                previousClose: 2685.00,
                volatility: 0.0008,
                payout: 86,
                decimals: 2,
                trend: 0.00005,
                high24h: 2720.00,
                low24h: 2670.00,
                volume24h: 32000.0
            },
            {
                id: 'EUR_USDT',
                name: 'EUR / USDT',
                category: 'Forex',
                categoryKey: 'forex',
                basePrice: 1.0520,
                currentPrice: 1.0520,
                previousClose: 1.0500,
                volatility: 0.0004,
                payout: 85,
                decimals: 4,
                trend: 0.00001,
                high24h: 1.0560,
                low24h: 1.0480,
                volume24h: 4500000.0
            }
        ];

        this.simulatedAssets = [
            {
                id: 'BTC_OTC',
                name: 'Bitcoin / USDT (OTC)',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 90000.00,
                currentPrice: 90000.00,
                previousClose: 89500.00,
                volatility: 0.0022,
                payout: 88,
                decimals: 2,
                trend: 0.0001,
                high24h: 91200.00,
                low24h: 88800.00,
                volume24h: 45000
            },
            {
                id: 'ETH_OTC',
                name: 'Ethereum / USDT (OTC)',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 2700.00,
                currentPrice: 2700.00,
                previousClose: 2670.00,
                volatility: 0.0025,
                payout: 87,
                decimals: 2,
                trend: 0.0001,
                high24h: 2760.00,
                low24h: 2640.00,
                volume24h: 160000
            },
            {
                id: 'SOL_OTC',
                name: 'Solana / USDT (OTC)',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 190.00,
                currentPrice: 190.00,
                previousClose: 185.00,
                volatility: 0.0035,
                payout: 90,
                decimals: 2,
                trend: 0.0002,
                high24h: 196.00,
                low24h: 182.00,
                volume24h: 820000
            },
            {
                id: 'EUR_USD_OTC',
                name: 'EUR / USD (OTC)',
                category: 'Forex',
                categoryKey: 'forex',
                basePrice: 1.0520,
                currentPrice: 1.0520,
                previousClose: 1.0505,
                volatility: 0.0006,
                payout: 85,
                decimals: 4,
                trend: 0.00001,
                high24h: 1.0550,
                low24h: 1.0490,
                volume24h: 5200000
            },
            {
                id: 'USD_JPY_OTC',
                name: 'USD / JPY (OTC)',
                category: 'Forex',
                categoryKey: 'forex',
                basePrice: 154.500,
                currentPrice: 154.500,
                previousClose: 154.100,
                volatility: 0.0008,
                payout: 84,
                decimals: 3,
                trend: -0.00002,
                high24h: 155.100,
                low24h: 153.800,
                volume24h: 4100000
            },
            {
                id: 'GOLD_OTC',
                name: 'Ouro Spot (OTC)',
                category: 'Commodities',
                categoryKey: 'commodities',
                basePrice: 2700.00,
                currentPrice: 2700.00,
                previousClose: 2685.00,
                volatility: 0.0012,
                payout: 86,
                decimals: 2,
                trend: 0.00008,
                high24h: 2720.00,
                low24h: 2675.00,
                volume24h: 390000
            },
            {
                id: 'OIL_OTC',
                name: 'Petroleo Brent (OTC)',
                category: 'Commodities',
                categoryKey: 'commodities',
                basePrice: 74.50,
                currentPrice: 74.50,
                previousClose: 75.20,
                volatility: 0.0020,
                payout: 85,
                decimals: 2,
                trend: -0.0001,
                high24h: 76.00,
                low24h: 73.80,
                volume24h: 680000
            },
            {
                id: 'TECH_CORP_OTC',
                name: 'TechCorp Dynamics (OTC)',
                category: 'Acoes',
                categoryKey: 'stocks',
                basePrice: 215.00,
                currentPrice: 215.00,
                previousClose: 211.00,
                volatility: 0.0022,
                payout: 89,
                decimals: 2,
                trend: 0.00015,
                high24h: 219.00,
                low24h: 210.00,
                volume24h: 1250000
            },
            {
                id: 'QUANTUM_AI_OTC',
                name: 'Quantum AI Index (OTC)',
                category: 'Tendencia',
                categoryKey: 'trending',
                basePrice: 1420.00,
                currentPrice: 1420.00,
                previousClose: 1390.00,
                volatility: 0.0040,
                payout: 92,
                decimals: 2,
                trend: 0.0003,
                high24h: 1460.00,
                low24h: 1370.00,
                volume24h: 2100000
            }
        ];

        this.binanceSymbolMap = {
            'BTC_USDT': 'btcusdt',
            'ETH_USDT': 'ethusdt',
            'SOL_USDT': 'solusdt',
            'BNB_USDT': 'bnbusdt',
            'XRP_USDT': 'xrpusdt',
            'DOGE_USDT': 'dogeusdt',
            'ADA_USDT': 'adausdt',
            'AVAX_USDT': 'avaxusdt',
            'LINK_USDT': 'linkusdt',
            'DOT_USDT': 'dotusdt',
            'NEAR_USDT': 'nearusdt',
            'PAXG_USDT': 'paxgusdt',
            'EUR_USDT': 'eurusdt'
        };

        this.symbolToAssetId = {};
        Object.keys(this.binanceSymbolMap).forEach(k => {
            this.symbolToAssetId[this.binanceSymbolMap[k]] = k;
        });

        this.selectedAssetId = this.dataSource === 'real' ? 'BTC_USDT' : 'BTC_OTC';
        this.timeframes = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '1h': 3600
        };
        this.selectedTimeframe = '1m';

        this.ws = null;
        this.wsReconnectTimeout = null;
        this.isWsConnected = false;

        this.history = {};
        this.subscribers = [];
        this.newsList = [];

        this.initHistory();
        this.startEngine();
        this.startNewsCycle();

        if (this.dataSource === 'real') {
            this.initBinanceWebSocket();
            this.fetchAllBinanceHistory();
        }
    }

    get assets() {
        return this.dataSource === 'real' ? this.realAssets : this.simulatedAssets;
    }

    initHistory() {
        const now = Math.floor(Date.now() / 1000);
        this.assets.forEach(asset => {
            this.history[asset.id] = {
                '1m': [],
                '5m': [],
                '15m': [],
                '1h': []
            };

            Object.keys(this.timeframes).forEach(tf => {
                const interval = this.timeframes[tf];
                let price = asset.basePrice * (1 + (Math.random() * 0.04 - 0.02));
                const candlesCount = 100;
                const startTime = now - (candlesCount * interval);

                for (let i = 0; i < candlesCount; i++) {
                    const candleTime = startTime + (i * interval);
                    const delta = (Math.random() - 0.49 + asset.trend * 10) * asset.volatility * price * Math.sqrt(interval / 60);
                    const open = price;
                    const close = Math.max(price * 0.1, open + delta);
                    const high = Math.max(open, close) + Math.random() * asset.volatility * price * 0.8;
                    const low = Math.min(open, close) - Math.random() * asset.volatility * price * 0.8;
                    const volume = Math.floor(100 + Math.random() * 900);

                    this.history[asset.id][tf].push({
                        time: candleTime,
                        open,
                        high,
                        low,
                        close,
                        volume
                    });

                    price = close;
                }
            });

            asset.currentPrice = this.history[asset.id]['1m'][this.history[asset.id]['1m'].length - 1].close;
        });
    }

    fetchAllBinanceHistory() {
        Object.keys(this.binanceSymbolMap).forEach(assetId => {
            this.fetchBinanceHistory(assetId, this.selectedTimeframe);
        });
    }

    fetchBinanceHistory(assetId, timeframe) {
        const symbol = this.binanceSymbolMap[assetId];
        if (!symbol) return;
        const tf = timeframe || this.selectedTimeframe;
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${tf}&limit=100`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const candles = data.map(item => ({
                        time: Math.floor(item[0] / 1000),
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                        volume: parseFloat(item[5])
                    })).filter(c => Number.isFinite(c.open) && Number.isFinite(c.close) && c.open > 0 && c.close > 0);

                    if (candles.length > 0) {
                        if (!this.history[assetId]) {
                            this.history[assetId] = {};
                        }
                        this.history[assetId][tf] = candles;

                        const asset = this.assets.find(a => a.id === assetId);
                        if (asset) {
                            asset.currentPrice = candles[candles.length - 1].close;
                            asset.previousClose = candles[0].open;
                        }

                        if (assetId === this.selectedAssetId && tf === this.selectedTimeframe) {
                            this.notifySubscribers();
                        }
                    }
                }
            })
            .catch(() => {});
    }

    initBinanceWebSocket() {
        if (this.ws) {
            try { this.ws.close(); } catch (e) {}
            this.ws = null;
        }
        if (this.dataSource !== 'real') return;

        const streams = [];
        Object.values(this.binanceSymbolMap).forEach(sym => {
            streams.push(`${sym}@aggTrade`);
            streams.push(`${sym}@kline_1m`);
            streams.push(`${sym}@miniTicker`);
        });

        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.isWsConnected = true;
                this.updateConnectionStatus(true);
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (!msg || !msg.data) return;
                    const d = msg.data;

                    if (d.e === 'aggTrade') {
                        const symbol = d.s.toLowerCase();
                        const assetId = this.symbolToAssetId[symbol];
                        if (!assetId) return;

                        const price = parseFloat(d.p);
                        const qty = parseFloat(d.q);
                        if (!Number.isFinite(price) || price <= 0) return;

                        const asset = this.assets.find(a => a.id === assetId);
                        if (asset) {
                            asset.currentPrice = price;
                            if (price > asset.high24h) asset.high24h = price;
                            if (price < asset.low24h) asset.low24h = price;
                        }

                        if (!this.history[assetId]) {
                            this.history[assetId] = { '1m': [], '5m': [], '15m': [], '1h': [] };
                        }

                        const list = this.history[assetId][this.selectedTimeframe] || this.history[assetId]['1m'];
                        if (list && list.length > 0) {
                            const last = list[list.length - 1];
                            last.close = price;
                            if (price > last.high) last.high = price;
                            if (price < last.low) last.low = price;
                            if (Number.isFinite(qty)) last.volume += qty;
                        }

                        if (assetId === this.selectedAssetId) {
                            this.notifySubscribers();
                        }
                    } else if (d.e === 'kline') {
                        const symbol = d.s.toLowerCase();
                        const assetId = this.symbolToAssetId[symbol];
                        if (!assetId) return;

                        const k = d.k;
                        const candleTime = Math.floor(k.t / 1000);
                        const open = parseFloat(k.o);
                        const high = parseFloat(k.h);
                        const low = parseFloat(k.l);
                        const close = parseFloat(k.c);
                        const volume = parseFloat(k.v);

                        if (!Number.isFinite(close) || close <= 0) return;

                        const asset = this.assets.find(a => a.id === assetId);
                        if (asset) {
                            asset.currentPrice = close;
                        }

                        if (!this.history[assetId]) {
                            this.history[assetId] = { '1m': [], '5m': [], '15m': [], '1h': [] };
                        }

                        const list = this.history[assetId]['1m'];
                        if (list && list.length > 0) {
                            const last = list[list.length - 1];
                            if (last.time === candleTime) {
                                last.high = Math.max(last.high, high);
                                last.low = Math.min(last.low, low);
                                last.close = close;
                                last.volume = volume;
                            } else if (candleTime > last.time) {
                                list.push({ time: candleTime, open, high, low, close, volume });
                                if (list.length > 140) list.shift();
                            }
                        } else {
                            this.history[assetId]['1m'] = [{ time: candleTime, open, high, low, close, volume }];
                        }

                        if (assetId === this.selectedAssetId && this.selectedTimeframe === '1m') {
                            this.notifySubscribers();
                        }
                    } else if (d.e === '24hrMiniTicker' || d.e === '24hrTicker') {
                        const symbol = d.s.toLowerCase();
                        const assetId = this.symbolToAssetId[symbol];
                        if (!assetId) return;

                        const asset = this.assets.find(a => a.id === assetId);
                        if (asset) {
                            const closeP = parseFloat(d.c);
                            const openP = parseFloat(d.o);
                            if (Number.isFinite(closeP)) asset.currentPrice = closeP;
                            if (Number.isFinite(openP)) asset.previousClose = openP;
                            if (d.h) asset.high24h = parseFloat(d.h);
                            if (d.l) asset.low24h = parseFloat(d.l);
                            if (d.v) asset.volume24h = parseFloat(d.v);

                            if (assetId === this.selectedAssetId) {
                                this.notifySubscribers();
                            }
                        }
                    }
                } catch (err) {}
            };

            this.ws.onclose = () => {
                this.isWsConnected = false;
                this.updateConnectionStatus(false);
                if (this.dataSource === 'real') {
                    clearTimeout(this.wsReconnectTimeout);
                    this.wsReconnectTimeout = setTimeout(() => {
                        this.initBinanceWebSocket();
                    }, 3000);
                }
            };

            this.ws.onerror = () => {
                this.isWsConnected = false;
                this.updateConnectionStatus(false);
            };
        } catch (e) {
            this.isWsConnected = false;
            this.updateConnectionStatus(false);
        }
    }

    setDataSource(source) {
        this.dataSource = source;
        try {
            localStorage.setItem('night_trader_data_source', source);
        } catch (e) {}

        if (!this.assets.some(a => a.id === this.selectedAssetId)) {
            this.selectedAssetId = this.assets[0].id;
        }

        if (source === 'real') {
            this.initHistory();
            this.initBinanceWebSocket();
            this.fetchAllBinanceHistory();
        } else {
            if (this.ws) {
                try { this.ws.close(); } catch (e) {}
                this.ws = null;
            }
            this.initHistory();
        }
        this.updateConnectionStatus(source === 'real' ? this.isWsConnected : true);
        this.notifySubscribers();
        if (window.desktopUI) {
            window.desktopUI.renderAssetList();
            window.desktopUI.updateHeader();
        }
    }

    updateConnectionStatus(connected) {
        const modeLabel = document.getElementById('wallpaper-market-mode');
        if (modeLabel) {
            if (this.dataSource === 'real') {
                modeLabel.textContent = connected ? 'BINANCE LIVE (REAL)' : 'BINANCE RECONECTANDO...';
                modeLabel.className = connected ? 'val status-green' : 'val status-gold';
            } else {
                modeLabel.textContent = 'SIMULADOR OTC (OFFLINE)';
                modeLabel.className = 'val status-blue';
            }
        }

        const taskbarStatus = document.getElementById('system-status-text');
        if (taskbarStatus) {
            if (this.dataSource === 'real') {
                taskbarStatus.textContent = connected ? 'BINANCE WS' : 'RECONECTANDO';
            } else {
                taskbarStatus.textContent = 'OTC SIMULADO';
            }
        }

        document.querySelectorAll('.data-source-card').forEach(card => {
            card.classList.toggle('active', card.dataset.source === this.dataSource);
        });
    }

    startEngine() {
        setInterval(() => {
            this.tick();
        }, 300);
    }

    tick() {
        const now = Math.floor(Date.now() / 1000);

        this.assets.forEach(asset => {
            if (this.dataSource === 'real' && this.binanceSymbolMap[asset.id] && this.isWsConnected) {
                return;
            }

            const shock = (Math.random() - 0.495 + asset.trend) * asset.volatility * asset.currentPrice * 0.15;
            const newPrice = Math.max(asset.basePrice * 0.05, asset.currentPrice + shock);
            asset.currentPrice = newPrice;

            if (newPrice > asset.high24h) asset.high24h = newPrice;
            if (newPrice < asset.low24h) asset.low24h = newPrice;

            Object.keys(this.timeframes).forEach(tf => {
                const interval = this.timeframes[tf];
                const list = this.history[asset.id][tf];
                if (!list || list.length === 0) return;

                const currentCandle = list[list.length - 1];
                const candleSlot = Math.floor(now / interval) * interval;

                if (currentCandle.time === candleSlot) {
                    currentCandle.close = newPrice;
                    if (newPrice > currentCandle.high) currentCandle.high = newPrice;
                    if (newPrice < currentCandle.low) currentCandle.low = newPrice;
                    currentCandle.volume += Math.floor(Math.random() * 3 + 1);
                } else if (candleSlot > currentCandle.time) {
                    list.push({
                        time: candleSlot,
                        open: currentCandle.close,
                        high: Math.max(currentCandle.close, newPrice),
                        low: Math.min(currentCandle.close, newPrice),
                        close: newPrice,
                        volume: 1
                    });
                    if (list.length > 140) {
                        list.shift();
                    }
                }
            });
        });

        this.notifySubscribers();
    }

    startNewsCycle() {
        const sampleNews = [
            { text: 'Volume de negociacao institucional atinge pico historico nas exchanges globais.', impact: 'neutro' },
            { text: 'Banco Central projeta estabilidade na taxa de juros para o proximo trimestre.', impact: 'positivo' },
            { text: 'Relatorios corporativos de tecnologia superam projecoes de analistas.', impact: 'positivo' },
            { text: 'Ajuste de liquidez nos mercados de derivativos eleva volatilidade a curto prazo.', impact: 'neutro' },
            { text: 'Setor de energia renovavel registra novos aportes de capital de risco.', impact: 'positivo' },
            { text: 'Mercado de cambio absorve fluxo de encerramento de posicoes em moedas fortes.', impact: 'neutro' },
            { text: 'Indices de commodities refletem reequilibrio entre oferta e demanda global.', impact: 'positivo' }
        ];

        sampleNews.forEach(n => this.addNews(n.text, n.impact));

        setInterval(() => {
            const randomItem = sampleNews[Math.floor(Math.random() * sampleNews.length)];
            const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.addNews(`[${timeStr}] ${randomItem.text}`, randomItem.impact);

            const randomAsset = this.assets[Math.floor(Math.random() * this.assets.length)];
            randomAsset.trend = (Math.random() * 0.0006 - 0.0003);
        }, 18000);
    }

    addNews(text, impact) {
        this.newsList.unshift({
            id: Date.now() + Math.random(),
            text,
            impact,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
        if (this.newsList.length > 25) {
            this.newsList.pop();
        }
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notifySubscribers() {
        const currentAsset = this.getSelectedAsset();
        const candles = (this.history[this.selectedAssetId] && this.history[this.selectedAssetId][this.selectedTimeframe]) || [];
        for (let i = 0; i < this.subscribers.length; i++) {
            this.subscribers[i](currentAsset, candles);
        }
    }

    getSelectedAsset() {
        return this.assets.find(a => a.id === this.selectedAssetId) || this.assets[0];
    }

    setSelectedAsset(assetId) {
        if (this.assets.some(a => a.id === assetId)) {
            this.selectedAssetId = assetId;
            if (this.dataSource === 'real' && this.binanceSymbolMap[assetId]) {
                this.fetchBinanceHistory(assetId, this.selectedTimeframe);
            }
            this.notifySubscribers();
        }
    }

    setSelectedTimeframe(tf) {
        if (this.timeframes[tf]) {
            this.selectedTimeframe = tf;
            if (this.dataSource === 'real' && this.binanceSymbolMap[this.selectedAssetId]) {
                this.fetchBinanceHistory(this.selectedAssetId, tf);
            }
            this.notifySubscribers();
        }
    }
}

window.marketEngine = new MarketEngine();

