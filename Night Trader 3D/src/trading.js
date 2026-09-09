class TradingEngine {
    constructor() {
        this.balance = parseFloat(localStorage.getItem('night_trader_balance')) || 10000.00;
        this.selectedAmount = 100;
        this.selectedDuration = 30;
        this.activeTrades = [];
        this.history = JSON.parse(localStorage.getItem('night_trader_history')) || [];
        this.stats = JSON.parse(localStorage.getItem('night_trader_stats')) || {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalProfit: 0.00
        };

        this.rankingList = [
            { rank: 1, name: 'CyberTitan_99', balance: 148520.00, winRate: 78.4, streak: 12 },
            { rank: 2, name: 'MidnightWhale', balance: 94230.50, winRate: 72.1, streak: 9 },
            { rank: 3, name: 'NeonScalper', balance: 67100.00, winRate: 69.8, streak: 7 },
            { rank: 4, name: 'Voce (Investidor Solitario)', balance: this.balance, winRate: this.getWinRate(), streak: this.stats.currentStreak },
            { rank: 5, name: 'VortexTrader', balance: 48900.00, winRate: 64.2, streak: 6 },
            { rank: 6, name: 'AeroPip', balance: 39500.00, winRate: 61.5, streak: 5 },
            { rank: 7, name: 'ShadowBull', balance: 28400.00, winRate: 59.3, streak: 4 },
            { rank: 8, name: 'QuantumWolf', balance: 19200.00, winRate: 57.0, streak: 4 },
            { rank: 9, name: 'AlphaPulse', balance: 12500.00, winRate: 54.2, streak: 3 },
            { rank: 10, name: 'MatrixBear', balance: 8400.00, winRate: 51.1, streak: 2 }
        ];

        this.onTradeUpdate = null;
        this.startTimerLoop();
    }

    saveState() {
        localStorage.setItem('night_trader_balance', this.balance.toFixed(2));
        localStorage.setItem('night_trader_history', JSON.stringify(this.history.slice(0, 80)));
        localStorage.setItem('night_trader_stats', JSON.stringify(this.stats));
    }

    resetAccount() {
        this.balance = 10000.00;
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
        if (!isNaN(num) && num > 0) {
            this.selectedAmount = Math.min(this.balance, Math.max(1, num));
        }
    }

    setDuration(seconds) {
        this.selectedDuration = parseInt(seconds, 10) || 30;
    }

    getWinRate() {
        if (this.stats.totalTrades === 0) return 0.0;
        return ((this.stats.wins / this.stats.totalTrades) * 100);
    }

    executeTrade(asset, direction) {
        if (this.balance < this.selectedAmount) {
            return { success: false, message: 'Saldo insuficiente para a operacao.' };
        }

        const amount = this.selectedAmount;
        this.balance -= amount;

        const trade = {
            id: 'TRD_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            assetId: asset.id,
            assetName: asset.name,
            decimals: asset.decimals,
            direction: direction,
            strikePrice: asset.currentPrice,
            amount: amount,
            payout: asset.payout,
            startedAt: Date.now(),
            duration: this.selectedDuration,
            expiresAt: Date.now() + (this.selectedDuration * 1000),
            status: 'EM_ANDAMENTO'
        };

        this.activeTrades.push(trade);
        this.saveState();

        if (window.soundEngine) {
            window.soundEngine.playTradeOpen();
        }

        if (this.onTradeUpdate) this.onTradeUpdate();
        return { success: true, trade };
    }

    startTimerLoop() {
        setInterval(() => {
            if (this.activeTrades.length === 0) return;
            const now = Date.now();
            const settled = [];

            this.activeTrades = this.activeTrades.filter(trade => {
                if (now >= trade.expiresAt) {
                    settled.push(trade);
                    return false;
                }
                return true;
            });

            settled.forEach(trade => this.settleTrade(trade));

            if (this.onTradeUpdate) this.onTradeUpdate();
        }, 200);
    }

    settleTrade(trade) {
        const asset = window.marketEngine.assets.find(a => a.id === trade.assetId);
        const closePrice = asset ? asset.currentPrice : trade.strikePrice;
        let result = 'DERROTA';
        let profit = -trade.amount;

        if (trade.direction === 'SUBIR') {
            if (closePrice > trade.strikePrice) {
                result = 'VITORIA';
                profit = trade.amount * (trade.payout / 100);
                this.balance += trade.amount + profit;
            } else if (closePrice === trade.strikePrice) {
                result = 'EMPATE';
                profit = 0;
                this.balance += trade.amount;
            }
        } else if (trade.direction === 'DESCER') {
            if (closePrice < trade.strikePrice) {
                result = 'VITORIA';
                profit = trade.amount * (trade.payout / 100);
                this.balance += trade.amount + profit;
            } else if (closePrice === trade.strikePrice) {
                result = 'EMPATE';
                profit = 0;
                this.balance += trade.amount;
            }
        }

        this.stats.totalTrades++;
        if (result === 'VITORIA') {
            this.stats.wins++;
            this.stats.currentStreak++;
            if (this.stats.currentStreak > this.stats.bestStreak) {
                this.stats.bestStreak = this.stats.currentStreak;
            }
            if (window.soundEngine) window.soundEngine.playTradeWin();
        } else if (result === 'DERROTA') {
            this.stats.losses++;
            this.stats.currentStreak = 0;
            if (window.soundEngine) window.soundEngine.playTradeLoss();
        } else {
            this.stats.ties++;
        }

        this.stats.totalProfit += profit;

        const historyItem = {
            id: trade.id,
            assetName: trade.assetName,
            direction: trade.direction,
            strikePrice: trade.strikePrice,
            closePrice: closePrice,
            decimals: trade.decimals,
            amount: trade.amount,
            payout: trade.payout,
            result: result,
            profit: profit,
            timestamp: new Date().toLocaleTimeString('pt-BR')
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
            playerItem.balance = this.balance;
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

