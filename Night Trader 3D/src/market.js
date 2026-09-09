class MarketEngine {
    constructor() {
        this.assets = [
            {
                id: 'BTC_USD',
                name: 'Bitcoin / USD',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 64280.00,
                currentPrice: 64280.00,
                previousClose: 63800.00,
                volatility: 0.0018,
                payout: 88,
                decimals: 2,
                trend: 0.0001,
                high24h: 65120.00,
                low24h: 63450.00,
                volume24h: 38450.2
            },
            {
                id: 'ETH_USD',
                name: 'Ethereum / USD',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 3450.00,
                currentPrice: 3450.00,
                previousClose: 3410.00,
                volatility: 0.0022,
                payout: 87,
                decimals: 2,
                trend: -0.00005,
                high24h: 3520.00,
                low24h: 3390.00,
                volume24h: 124500.8
            },
            {
                id: 'SOL_USD',
                name: 'Solana / USD',
                category: 'Criptomoedas',
                categoryKey: 'crypto',
                basePrice: 152.40,
                currentPrice: 152.40,
                previousClose: 147.20,
                volatility: 0.0035,
                payout: 90,
                decimals: 2,
                trend: 0.0002,
                high24h: 158.90,
                low24h: 145.10,
                volume24h: 890400
            },
            {
                id: 'EUR_USD',
                name: 'EUR / USD',
                category: 'Forex',
                categoryKey: 'forex',
                basePrice: 1.08450,
                currentPrice: 1.08450,
                previousClose: 1.08380,
                volatility: 0.0004,
                payout: 85,
                decimals: 5,
                trend: 0.00001,
                high24h: 1.08620,
                low24h: 1.08290,
                volume24h: 5400000
            },
            {
                id: 'USD_JPY',
                name: 'USD / JPY',
                category: 'Forex',
                categoryKey: 'forex',
                basePrice: 156.820,
                currentPrice: 156.820,
                previousClose: 157.100,
                volatility: 0.0006,
                payout: 84,
                decimals: 3,
                trend: -0.00003,
                high24h: 157.450,
                low24h: 156.200,
                volume24h: 4200000
            },
            {
                id: 'GBP_USD',
                name: 'GBP / USD',
                category: 'Forex',
                categoryKey: 'forex',
                basePrice: 1.27340,
                currentPrice: 1.27340,
                previousClose: 1.27110,
                volatility: 0.0005,
                payout: 86,
                decimals: 5,
                trend: 0.00002,
                high24h: 1.27680,
                low24h: 1.26950,
                volume24h: 3100000
            },
            {
                id: 'TECH_CORP',
                name: 'TechCorp Dynamics',
                category: 'Acoes',
                categoryKey: 'stocks',
                basePrice: 214.50,
                currentPrice: 214.50,
                previousClose: 210.00,
                volatility: 0.0016,
                payout: 89,
                decimals: 2,
                trend: 0.00015,
                high24h: 218.00,
                low24h: 209.20,
                volume24h: 1450000
            },
            {
                id: 'APEX_BIO',
                name: 'Apex Bio Labs',
                category: 'Acoes',
                categoryKey: 'stocks',
                basePrice: 88.25,
                currentPrice: 88.25,
                previousClose: 91.00,
                volatility: 0.0028,
                payout: 91,
                decimals: 2,
                trend: -0.0002,
                high24h: 92.40,
                low24h: 86.10,
                volume24h: 920000
            },
            {
                id: 'NOVA_ENG',
                name: 'Nova Clean Energy',
                category: 'Acoes',
                categoryKey: 'stocks',
                basePrice: 46.80,
                currentPrice: 46.80,
                previousClose: 45.90,
                volatility: 0.0020,
                payout: 85,
                decimals: 2,
                trend: 0.0001,
                high24h: 47.90,
                low24h: 45.40,
                volume24h: 670000
            },
            {
                id: 'GOLD_OZ',
                name: 'Ouro Spot / USD',
                category: 'Commodities',
                categoryKey: 'commodities',
                basePrice: 2360.50,
                currentPrice: 2360.50,
                previousClose: 2348.00,
                volatility: 0.0009,
                payout: 86,
                decimals: 2,
                trend: 0.00008,
                high24h: 2374.00,
                low24h: 2342.00,
                volume24h: 410000
            },
            {
                id: 'OIL_BRENT',
                name: 'Petroleo Brent',
                category: 'Commodities',
                categoryKey: 'commodities',
                basePrice: 82.40,
                currentPrice: 82.40,
                previousClose: 83.90,
                volatility: 0.0017,
                payout: 85,
                decimals: 2,
                trend: -0.00012,
                high24h: 84.50,
                low24h: 81.60,
                volume24h: 820000
            },
            {
                id: 'SILVER_OZ',
                name: 'Prata Spot / USD',
                category: 'Commodities',
                categoryKey: 'commodities',
                basePrice: 30.45,
                currentPrice: 30.45,
                previousClose: 29.80,
                volatility: 0.0024,
                payout: 87,
                decimals: 2,
                trend: 0.0001,
                high24h: 31.10,
                low24h: 29.50,
                volume24h: 290000
            },
            {
                id: 'QUANTUM_AI',
                name: 'Quantum AI Index',
                category: 'Tendencia',
                categoryKey: 'trending',
                basePrice: 1420.00,
                currentPrice: 1420.00,
                previousClose: 1360.00,
                volatility: 0.0045,
                payout: 92,
                decimals: 2,
                trend: 0.0003,
                high24h: 1465.00,
                low24h: 1340.00,
                volume24h: 2300000
            },
            {
                id: 'CYBER_SHIELD',
                name: 'CyberShield Systems',
                category: 'Tendencia',
                categoryKey: 'trending',
                basePrice: 340.80,
                currentPrice: 340.80,
                previousClose: 332.00,
                volatility: 0.0038,
                payout: 91,
                decimals: 2,
                trend: 0.00025,
                high24h: 349.50,
                low24h: 328.00,
                volume24h: 1150000
            }
        ];

        this.selectedAssetId = 'BTC_USD';
        this.timeframes = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '1h': 3600
        };
        this.selectedTimeframe = '1m';

        this.history = {};
        this.subscribers = [];
        this.newsList = [];
        this.initHistory();
        this.startEngine();
        this.startNewsCycle();
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

    startEngine() {
        setInterval(() => {
            this.tick();
        }, 300);
    }

    tick() {
        const now = Math.floor(Date.now() / 1000);

        this.assets.forEach(asset => {
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
        const candles = this.history[this.selectedAssetId][this.selectedTimeframe] || [];
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
            this.notifySubscribers();
        }
    }

    setSelectedTimeframe(tf) {
        if (this.timeframes[tf]) {
            this.selectedTimeframe = tf;
            this.notifySubscribers();
        }
    }
}

window.marketEngine = new MarketEngine();

