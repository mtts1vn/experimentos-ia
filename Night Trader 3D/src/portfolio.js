class PortfolioEngine {
    constructor() {
        this.portfolioKey = 'night_trader_spot_portfolio';
        this.historyKey = 'night_trader_spot_history';

        this.positions = this.loadPositions();
        this.history = this.loadHistory();
        this.onPortfolioUpdate = null;
    }

    loadPositions() {
        const saved = localStorage.getItem(this.portfolioKey);
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

    saveState() {
        localStorage.setItem(this.portfolioKey, JSON.stringify(this.positions));
        localStorage.setItem(this.historyKey, JSON.stringify(this.history.slice(0, 100)));
    }

    resetPortfolio() {
        this.positions = [];
        this.history = [];
        this.saveState();
        if (this.onPortfolioUpdate) this.onPortfolioUpdate();
    }

    getPosition(assetId) {
        return this.positions.find(p => p.assetId === assetId) || null;
    }

    buy(assetId, amountBrl) {
        const amount = parseFloat(amountBrl);
        if (isNaN(amount) || amount <= 0) {
            return { success: false, message: 'Insira um valor valido para a compra.' };
        }

        if (amount < 10) {
            return { success: false, message: 'Valor minimo de compra e R$ 10,00.' };
        }

        const wallet = window.tradingEngine ? window.tradingEngine.wallet : null;
        if (!wallet || wallet.balance < amount) {
            return { success: false, message: 'Saldo insuficiente na carteira para realizar esta compra.' };
        }

        const asset = window.marketEngine ? window.marketEngine.assets.find(a => a.id === assetId) : null;
        if (!asset || asset.currentPrice <= 0) {
            return { success: false, message: 'Ativo indisponivel ou cotacao invalida.' };
        }

        const quantity = amount / asset.currentPrice;
        wallet.balance -= amount;

        const existing = this.getPosition(assetId);
        const now = Date.now();

        if (existing) {
            const newTotalInvested = existing.totalInvested + amount;
            const newQuantity = existing.quantity + quantity;
            existing.avgBuyPrice = newTotalInvested / newQuantity;
            existing.quantity = newQuantity;
            existing.totalInvested = newTotalInvested;
            existing.lastUpdatedAt = now;
        } else {
            this.positions.push({
                assetId: asset.id,
                assetName: asset.name,
                category: asset.category,
                categoryKey: asset.categoryKey,
                decimals: asset.decimals,
                quantity: quantity,
                totalInvested: amount,
                avgBuyPrice: asset.currentPrice,
                firstBoughtAt: now,
                lastUpdatedAt: now
            });
        }

        const historyItem = {
            id: 'TX_' + now + '_' + Math.floor(Math.random() * 10000),
            type: 'COMPRA',
            assetId: asset.id,
            assetName: asset.name,
            quantity: quantity,
            price: asset.currentPrice,
            totalBrl: amount,
            decimals: asset.decimals,
            timestamp: new Date(now).toLocaleTimeString('pt-BR')
        };
        this.history.unshift(historyItem);

        this.saveState();
        if (window.tradingEngine) window.tradingEngine.saveState();
        if (window.soundEngine) window.soundEngine.playTradeWin();
        if (this.onPortfolioUpdate) this.onPortfolioUpdate();

        return { success: true, message: 'Comprou ' + quantity.toFixed(asset.decimals > 2 ? 6 : 4) + ' ' + asset.name + ' por R$ ' + amount.toFixed(2) };
    }

    sell(assetId, sellRatio = 1.0) {
        const ratio = Math.max(0.01, Math.min(1.0, parseFloat(sellRatio)));
        const posIndex = this.positions.findIndex(p => p.assetId === assetId);
        if (posIndex === -1) {
            return { success: false, message: 'Voce nao possui este ativo em carteira.' };
        }

        const position = this.positions[posIndex];
        const asset = window.marketEngine ? window.marketEngine.assets.find(a => a.id === assetId) : null;
        if (!asset || asset.currentPrice <= 0) {
            return { success: false, message: 'Ativo indisponivel para venda no momento.' };
        }

        const sellQuantity = position.quantity * ratio;
        const currentPrice = asset.currentPrice;
        const grossReturn = sellQuantity * currentPrice;
        const costBasis = position.totalInvested * ratio;
        const realizedPnL = grossReturn - costBasis;

        const wallet = window.tradingEngine ? window.tradingEngine.wallet : null;
        if (wallet) {
            wallet.balance += grossReturn;
            if (realizedPnL >= 0) {
                wallet.totalProfit += realizedPnL;
            } else {
                wallet.totalLoss += Math.abs(realizedPnL);
            }
        }

        const now = Date.now();
        const historyItem = {
            id: 'TX_' + now + '_' + Math.floor(Math.random() * 10000),
            type: 'VENDA',
            assetId: asset.id,
            assetName: asset.name,
            quantity: sellQuantity,
            price: currentPrice,
            totalBrl: grossReturn,
            profit: realizedPnL,
            decimals: asset.decimals,
            timestamp: new Date(now).toLocaleTimeString('pt-BR')
        };
        this.history.unshift(historyItem);

        if (ratio >= 0.9999) {
            this.positions.splice(posIndex, 1);
        } else {
            position.quantity -= sellQuantity;
            position.totalInvested -= costBasis;
            position.lastUpdatedAt = now;
        }

        this.saveState();
        if (window.tradingEngine) window.tradingEngine.saveState();
        if (window.soundEngine) {
            if (realizedPnL >= 0) window.soundEngine.playTradeWin();
            else window.soundEngine.playTradeLoss();
        }
        if (this.onPortfolioUpdate) this.onPortfolioUpdate();

        return { 
            success: true, 
            message: 'Vendeu ' + sellQuantity.toFixed(asset.decimals > 2 ? 6 : 4) + ' ' + asset.name + ' por R$ ' + grossReturn.toFixed(2) + ' (Lucro: ' + (realizedPnL >= 0 ? '+' : '') + 'R$ ' + realizedPnL.toFixed(2) + ')' 
        };
    }

    getSummary() {
        let totalInvested = 0;
        let currentValuation = 0;

        this.positions.forEach(pos => {
            const asset = window.marketEngine ? window.marketEngine.assets.find(a => a.id === pos.assetId) : null;
            const curPrice = asset ? asset.currentPrice : pos.avgBuyPrice;
            const curVal = pos.quantity * curPrice;
            totalInvested += pos.totalInvested;
            currentValuation += curVal;
        });

        const unrealizedPnL = currentValuation - totalInvested;
        const unrealizedPnLPct = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;
        const cashBalance = window.tradingEngine ? window.tradingEngine.wallet.balance : 0;
        const totalNetWorth = cashBalance + currentValuation;

        return {
            totalInvested,
            currentValuation,
            unrealizedPnL,
            unrealizedPnLPct,
            cashBalance,
            totalNetWorth,
            positionsCount: this.positions.length
        };
    }
}

window.portfolioEngine = new PortfolioEngine();
