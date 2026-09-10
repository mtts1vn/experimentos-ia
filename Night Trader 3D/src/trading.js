class TradingEngine {
    constructor() {
        this.walletKey = 'night_trader_wallet';
        this.historyKey = 'night_trader_history';
        this.statsKey = 'night_trader_stats';
        this.activeTradesKey = 'night_trader_active_trades';

        this.wallet = this.loadWallet();
        this.selectedAmount = 100;
        this.selectedDuration = 30;
        this.activeTrades = this.loadActiveTrades();
        this.history = this.loadHistory();
        this.stats = this.loadStats();

        this.minAmount = 10;
        this.maxAmount = 10000;
        this.maxActiveTrades = 10;

        this.rankingList = [
            { rank: 1, name: 'CyberTitan_99', balance: 148520.00, winRate: 78.4, streak: 12 },
            { rank: 2, name: 'MidnightWhale', balance: 94230.50, winRate: 72.1, streak: 9 },
            { rank: 3, name: 'NeonScalper', balance: 67100.00, winRate: 69.8, streak: 7 },
            { rank: 4, name: 'Voce (Investidor Solitario)', balance: this.wallet.balance, winRate: this.getWinRate(), streak: this.stats.currentStreak },
            { rank: 5, name: 'VortexTrader', balance: 48900.00, winRate: 64.2, streak: 6 },
            { rank: 6, name: 'AeroPip', balance: 39500.00, winRate: 61.5, streak: 5 },
            { rank: 7, name: 'ShadowBull', balance: 28400.00, winRate: 59.3, streak: 4 },
            { rank: 8, name: 'QuantumWolf', balance: 19200.00, winRate: 57.0, streak: 4 },
            { rank: 9, name: 'AlphaPulse', balance: 12500.00, winRate: 54.2, streak: 3 },
            { rank: 10, name: 'MatrixBear', balance: 8400.00, winRate: 51.1, streak: 2 }
        ];

        this.onTradeUpdate = null;
        this.checkPendingExpirations();
        this.startTimerLoop();
    }

    get balance() {
        return this.wallet.balance;
    }

    set balance(val) {
        this.wallet.balance = val;
    }

    loadWallet() {
        const saved = localStorage.getItem(this.walletKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (typeof parsed.balance === 'number') {
                    return {
                        balance: parsed.balance,
                        totalDeposited: parsed.totalDeposited || 10000.00,
                        totalProfit: parsed.totalProfit || 0.00,
                        totalLoss: parsed.totalLoss || 0.00
                    };
                }
            } catch (e) {}
        }

        const legacyBalance = parseFloat(localStorage.getItem('night_trader_balance'));
        const initBalance = !isNaN(legacyBalance) ? legacyBalance : 10000.00;
        return {
            balance: initBalance,
            totalDeposited: 10000.00,
            totalProfit: 0.00,
            totalLoss: 0.00
        };
    }

    loadActiveTrades() {
        const saved = localStorage.getItem(this.activeTradesKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {}
        }
        return [];
    }

    loadHistory() {
        const saved = localStorage.getItem(this.historyKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {}
        }
        return [];
    }

    loadStats() {
        const saved = localStorage.getItem(this.statsKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed.totalTrades === 'number') return parsed;
            } catch (e) {}
        }
        return {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalProfit: 0.00
        };
    }

    saveState() {
        localStorage.setItem(this.walletKey, JSON.stringify(this.wallet));
        localStorage.setItem('night_trader_balance', this.wallet.balance.toFixed(2));
        localStorage.setItem(this.activeTradesKey, JSON.stringify(this.activeTrades));
        localStorage.setItem(this.historyKey, JSON.stringify(this.history.slice(0, 100)));
        localStorage.setItem(this.statsKey, JSON.stringify(this.stats));
    }

    saveWallet() {
        this.saveState();
    }

    resetAccount() {
        this.wallet = {
            balance: 10000.00,
            totalDeposited: 10000.00,
            totalProfit: 0.00,
            totalLoss: 0.00
        };
        this.history = [];
        this.activeTrades = [];
        this.stats = {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalProfit: 0.00
        };
        this.saveState();
        this.updateRanking();
    }

    setAmount(val) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
            this.selectedAmount = Math.max(this.minAmount, Math.min(this.wallet.balance, num));
        }
    }

    setDuration(seconds) {
        this.selectedDuration = parseInt(seconds, 10) || 30;
    }

    getWinRate() {
        if (this.stats.totalTrades === 0) return 0.0;
        return ((this.stats.wins / this.stats.totalTrades) * 100);
    }

    executeTrade(asset, rawDirection) {
        if (!asset) {
            return { success: false, message: 'Nenhum ativo selecionado.' };
        }

        if (this.activeTrades.length >= this.maxActiveTrades) {
            return { success: false, message: 'Limite maximo de 10 ordens simultaneas atingido.' };
        }

        const amount = Math.floor(this.selectedAmount);
        if (amount < this.minAmount) {
            return { success: false, message: `Valor minimo por operacao e R$ ${this.minAmount},00.` };
        }

        if (amount > this.maxAmount) {
            return { success: false, message: `Valor maximo por operacao e R$ ${this.maxAmount},00.` };
        }

        if (this.wallet.balance < amount) {
            return { success: false, message: 'Saldo insuficiente na carteira para esta operacao.' };
        }

        const direction = (rawDirection === 'CALL' || rawDirection === 'SUBIR') ? 'CALL' : 'PUT';
        this.wallet.balance -= amount;

        const now = Date.now();
        const trade = {
            id: 'TRD_' + now + '_' + Math.floor(Math.random() * 100000),
            assetId: asset.id,
            assetName: asset.name,
            decimals: asset.decimals,
            direction: direction,
            displayDirection: direction === 'CALL' ? 'SUBIR' : 'DESCER',
            entryPrice: asset.currentPrice,
            strikePrice: asset.currentPrice,
            closePrice: null,
            amount: amount,
            payout: asset.payout || 88,
            openedAt: now,
            duration: this.selectedDuration,
            expiresAt: now + (this.selectedDuration * 1000),
            status: 'OPEN',
            settledAt: null,
            profit: 0
        };

        this.activeTrades.push(trade);
        this.saveState();

        if (window.soundEngine) {
            window.soundEngine.playTradeOpen();
        }

        if (this.onTradeUpdate) this.onTradeUpdate();
        return { success: true, trade };
    }

    checkPendingExpirations() {
        const now = Date.now();
        const pending = [];
        this.activeTrades = this.activeTrades.filter(t => {
            if (t.status === 'OPEN' && now >= t.expiresAt) {
                pending.push(t);
                return false;
            }
            return t.status === 'OPEN';
        });

        if (pending.length > 0) {
            pending.forEach(trade => this.settleTrade(trade));
            this.saveState();
            if (this.onTradeUpdate) this.onTradeUpdate();
        }
    }

    startTimerLoop() {
        setInterval(() => {
            if (this.activeTrades.length === 0) return;
            const now = Date.now();
            const settled = [];

            this.activeTrades = this.activeTrades.filter(trade => {
                if (trade.status === 'OPEN' && now >= trade.expiresAt) {
                    settled.push(trade);
                    return false;
                }
                return trade.status === 'OPEN';
            });

            if (settled.length > 0) {
                settled.forEach(trade => this.settleTrade(trade));
                this.saveState();
                if (this.onTradeUpdate) this.onTradeUpdate();
            }
        }, 100);
    }

    settleTrade(trade) {
        if (trade.settledAt || trade.status !== 'OPEN') return;

        let closePrice = trade.entryPrice;
        if (window.marketEngine && window.marketEngine.assets) {
            const asset = window.marketEngine.assets.find(a => a.id === trade.assetId);
            if (asset && typeof asset.currentPrice === 'number') {
                closePrice = asset.currentPrice;
            }
        }

        trade.closePrice = closePrice;
        trade.settledAt = Date.now();

        let status = 'LOST';
        let profit = -trade.amount;
        let returnAmount = 0;

        if (trade.direction === 'CALL') {
            if (closePrice > trade.entryPrice) {
                status = 'WON';
                profit = trade.amount * (trade.payout / 100);
                returnAmount = trade.amount + profit;
            } else if (closePrice === trade.entryPrice) {
                status = 'DRAW';
                profit = 0;
                returnAmount = trade.amount;
            }
        } else if (trade.direction === 'PUT') {
            if (closePrice < trade.entryPrice) {
                status = 'WON';
                profit = trade.amount * (trade.payout / 100);
                returnAmount = trade.amount + profit;
            } else if (closePrice === trade.entryPrice) {
                status = 'DRAW';
                profit = 0;
                returnAmount = trade.amount;
            }
        }

        trade.status = status;
        trade.profit = profit;

        this.wallet.balance += returnAmount;
        if (status === 'WON') {
            this.wallet.totalProfit += profit;
            this.stats.wins++;
            this.stats.currentStreak++;
            if (this.stats.currentStreak > this.stats.bestStreak) {
                this.stats.bestStreak = this.stats.currentStreak;
            }
            if (window.soundEngine) window.soundEngine.playTradeWin();
        } else if (status === 'LOST') {
            this.wallet.totalLoss += trade.amount;
            this.stats.losses++;
            this.stats.currentStreak = 0;
            if (window.soundEngine) window.soundEngine.playTradeLoss();
        } else {
            this.stats.ties++;
        }

        this.stats.totalTrades++;
        this.stats.totalProfit += profit;

        const resultLabel = status === 'WON' ? 'VITORIA' : (status === 'LOST' ? 'DERROTA' : 'EMPATE');
        const historyItem = {
            id: trade.id,
            assetName: trade.assetName,
            direction: trade.displayDirection || (trade.direction === 'CALL' ? 'SUBIR' : 'DESCER'),
            strikePrice: trade.entryPrice,
            closePrice: trade.closePrice,
            decimals: trade.decimals,
            amount: trade.amount,
            payout: trade.payout,
            result: resultLabel,
            status: status,
            profit: profit,
            timestamp: new Date(trade.settledAt).toLocaleTimeString('pt-BR')
        };

        this.history.unshift(historyItem);
        if (this.history.length > 100) this.history.pop();

        this.saveState();
        this.updateRanking();

        if (window.notifyTradeResult) {
            window.notifyTradeResult(historyItem);
        }
    }

    updateRanking() {
        const playerItem = this.rankingList.find(r => r.name.includes('Voce'));
        if (playerItem) {
            playerItem.balance = this.wallet.balance;
            playerItem.winRate = parseFloat(this.getWinRate().toFixed(1));
            playerItem.streak = this.stats.bestStreak;
        }

        this.rankingList.sort((a, b) => b.balance - a.balance);
        this.rankingList.forEach((item, idx) => {
            item.rank = idx + 1;
        });
    }
}

window.tradingEngine = new TradingEngine();

