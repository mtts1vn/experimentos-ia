class CasinoEngine {
    constructor() {
        this.activeGame = 'lobby';
        this.selectedChip = 50;
        this.chipValues = [10, 25, 50, 100, 500, 1000];

        this.jackpotAmount = 2481930.00;
        this.jackpotInterval = null;

        this.rouletteBets = {};
        this.rouletteLastNumbers = [17, 32, 0, 7, 21, 4];
        this.rouletteSpinning = false;
        this.rouletteAngle = 0;
        this.rouletteBallAngle = 0;
        this.rouletteBallRadius = 0;

        this.bjState = 'betting';
        this.bjDeck = [];
        this.bjPlayerCards = [];
        this.bjDealerCards = [];
        this.bjBet = 50;

        this.slotSpinning = false;
        this.slotBet = 50;
        this.slotSymbols = ['7', 'DIAMOND', 'BELL', 'CLOVER', 'CHERRY', 'BOLT'];
        this.slotCurrent = ['7', '7', '7'];

        this.crashState = 'idle';
        this.crashBet = 50;
        this.crashMultiplier = 1.00;
        this.crashPoint = 2.00;
        this.crashStartTime = 0;
        this.crashAnimId = null;
        this.crashCashedOut = false;
        this.crashParticles = [];
        this.crashExplosionParticles = [];

        this.minesState = 'idle';
        this.minesBet = 50;
        this.minesCount = 3;
        this.minesGrid = [];
        this.minesRevealed = [];
        this.minesDiamondsFound = 0;

        this.bacState = 'idle';
        this.bacBetType = 'player';
        this.bacBetAmount = 50;
        this.bacPlayerCards = [];
        this.bacBankerCards = [];

        this.pokerState = 'deal';
        this.pokerBet = 50;
        this.pokerDeck = [];
        this.pokerHand = [];
        this.pokerHeld = [false, false, false, false, false];
        this.eventsBound = false;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
        this.startJackpotTicker();
    }

    startJackpotTicker() {
        if (this.jackpotInterval) clearInterval(this.jackpotInterval);
        this.jackpotInterval = setInterval(() => {
            const delta = (Math.random() * 2.85) + 0.15;
            this.jackpotAmount += delta;
            const el = document.getElementById('lobby-jackpot-counter');
            if (el) {
                el.textContent = `R$ ${this.jackpotAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        }, 1200);
    }

    getWalletBalance() {
        if (window.tradingEngine && window.tradingEngine.wallet) {
            return window.tradingEngine.wallet.balance;
        }
        return 10000;
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
            this.updateBalanceDisplays();
            return true;
        }
        return false;
    }

    addWallet(amount, isProfit = true) {
        if (window.tradingEngine && window.tradingEngine.wallet) {
            window.tradingEngine.wallet.balance += amount;
            if (isProfit) {
                window.tradingEngine.wallet.totalProfit += amount;
            }
            if (window.tradingEngine.saveState) {
                window.tradingEngine.saveState();
            } else if (window.tradingEngine.saveWallet) {
                window.tradingEngine.saveWallet();
            }
            if (window.desktopUI) {
                if (typeof window.desktopUI.updateHeader === 'function') window.desktopUI.updateHeader();
                if (typeof window.desktopUI.updateExchangeSummary === 'function') window.desktopUI.updateExchangeSummary();
            }
            this.updateBalanceDisplays();
        }
    }

    updateBalanceDisplays() {
        const bal = this.getWalletBalance();
        const str = `R$ ${bal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.querySelectorAll('.casino-wallet-val').forEach(el => {
            el.textContent = str;
        });
        if (this.selectedChip === 'allin') {
            this.updateChipDisplay();
        }
    }

    updateChipDisplay() {
        const displayEl = document.getElementById('casino-selected-chip-display');
        if (!displayEl) return;
        if (this.selectedChip === 'allin') {
            const currentBal = this.getWalletBalance();
            displayEl.textContent = `ALL IN (R$ ${currentBal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
        } else {
            const num = Number(this.selectedChip) || 50;
            displayEl.textContent = `R$ ${num.toLocaleString('pt-BR')}`;
        }
    }

    render() {
        if (!this.eventsBound) {
            this.bindEvents();
        }
        this.updateBalanceDisplays();
        this.updateChipDisplay();
        this.switchGame(this.activeGame);
    }

    bindEvents() {
        this.eventsBound = true;

        const backBtn = document.getElementById('btn-casino-back-lobby');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.switchGame('lobby');
                if (window.soundEngine && window.soundEngine.playClick) {
                    window.soundEngine.playClick();
                }
            });
        }

        document.querySelectorAll('[data-launch-game]').forEach(card => {
            card.addEventListener('click', (e) => {
                const game = e.currentTarget.dataset.launchGame;
                this.switchGame(game);
                if (window.soundEngine && window.soundEngine.playClick) {
                    window.soundEngine.playClick();
                }
            });
        });

        document.querySelectorAll('.casino-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const game = e.currentTarget.dataset.game;
                this.switchGame(game);
                if (window.soundEngine && window.soundEngine.playClick) {
                    window.soundEngine.playClick();
                }
            });
        });

        document.querySelectorAll('.casino-chip-selector .casino-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.casino-chip-selector .casino-chip').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const val = e.currentTarget.dataset.value;
                this.selectedChip = val === 'allin' ? 'allin' : parseInt(val, 10);
                this.updateChipDisplay();
                if (window.soundEngine && window.soundEngine.playChip) {
                    window.soundEngine.playChip();
                }
            });
        });

        this.bindRoulette();
        this.bindBlackjack();
        this.bindSlots();
        this.bindCrash();
        this.bindMines();
        this.bindBaccarat();
        this.bindPoker();
    }

    getSelectedChipValue() {
        if (this.selectedChip === 'allin') {
            return Math.max(10, Math.floor(this.getWalletBalance()));
        }
        return Number(this.selectedChip) || 50;
    }

    switchGame(gameName) {
        this.activeGame = gameName;

        const backBtn = document.getElementById('btn-casino-back-lobby');
        if (backBtn) {
            backBtn.classList.toggle('hidden', gameName === 'lobby');
        }

        const gameMeta = {
            lobby: { title: 'ROYALE CASINO RESORT', subtitle: 'HUB DE JOGOS • CARTEIRA UNIFICADA', icon: '👑' },
            slots: { title: 'CYBER SLOTS 777', subtitle: 'CAÇA-NÍQUEIS PROGRESSIVO • JACKPOT 100X', icon: '🎰' },
            crash: { title: 'CRASH MULTIPLIER', subtitle: 'FOGUETE EM TEMPO REAL • MULTIPLICADOR ATÉ 100X', icon: '🚀' },
            roulette: { title: 'ROLETA EUROPEIA', subtitle: 'MESA COM ZERO ÚNICO • PAGA 36X', icon: '🎲' },
            blackjack: { title: 'BLACKJACK 21', subtitle: 'MESA VIP DO DEALER • PAGA 3:2', icon: '🃏' },
            mines: { title: 'CAMPO MINADO (MINES)', subtitle: 'ESTRATÉGIA & DIAMANTES • RESGATE LIVRE', icon: '💣' },
            baccarat: { title: 'BACCARAT VIP', subtitle: 'PONTO & BANCA HIGH ROLLER • EMPATE 8:1', icon: '🃏' },
            poker: { title: 'VIDEO POKER', subtitle: 'JACKS OR BETTER • ROYAL FLUSH 250X', icon: '♠' }
        };

        const meta = gameMeta[gameName] || gameMeta.lobby;
        const titleEl = document.getElementById('casino-title-text');
        const subEl = document.getElementById('casino-sub-text');
        const iconEl = document.getElementById('casino-brand-icon');

        if (titleEl) titleEl.textContent = meta.title;
        if (subEl) subEl.textContent = meta.subtitle;
        if (iconEl) iconEl.textContent = meta.icon;

        document.querySelectorAll('.casino-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.game === gameName);
        });

        document.querySelectorAll('.casino-game-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.dataset.game !== gameName);
        });

        this.updateChipDisplay();

        if (gameName === 'roulette') this.renderRoulette();
        else if (gameName === 'blackjack') this.renderBlackjack();
        else if (gameName === 'slots') this.renderSlots();
        else if (gameName === 'crash') this.renderCrash();
        else if (gameName === 'mines') this.renderMines();
        else if (gameName === 'baccarat') this.renderBaccarat();
        else if (gameName === 'poker') this.renderPoker();
    }

    bindRoulette() {
        const felt = document.getElementById('roulette-felt-grid');
        if (felt) {
            felt.addEventListener('click', (e) => {
                const target = e.target.closest('[data-roulette-bet]');
                if (!target || this.rouletteSpinning) return;
                const betKey = target.dataset.rouletteBet;
                const curBalance = this.getWalletBalance();
                const totalCurrentBet = Object.values(this.rouletteBets).reduce((a, b) => a + b, 0);

                const chipVal = this.getSelectedChipValue();
                if (totalCurrentBet + chipVal > curBalance) {
                    this.showCasinoToast('Saldo insuficiente para esta ficha!', 'error');
                    return;
                }

                this.rouletteBets[betKey] = (this.rouletteBets[betKey] || 0) + chipVal;
                if (window.soundEngine && window.soundEngine.playChip) {
                    window.soundEngine.playChip();
                }
                this.renderRouletteBets();
            });
        }

        const btnSpin = document.getElementById('btn-spin-roulette');
        if (btnSpin) {
            btnSpin.addEventListener('click', () => {
                this.spinRoulette();
            });
        }

        const btnClear = document.getElementById('btn-clear-roulette');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (this.rouletteSpinning) return;
                this.rouletteBets = {};
                this.clearFeltWinnerHighlight();
                this.renderRouletteBets();
            });
        }
    }

    clearFeltWinnerHighlight() {
        document.querySelectorAll('.felt-winner-pulse').forEach(el => {
            el.classList.remove('felt-winner-pulse');
        });
    }

    renderRoulette() {
        this.drawRouletteWheel(this.rouletteAngle, this.rouletteBallAngle, this.rouletteBallRadius);
        this.renderRouletteHistory();
        this.renderRouletteBets();
    }

    drawRouletteWheel(wheelAngle = 0, ballAngle = 0, ballRadiusCustom = 0) {
        const canvas = document.getElementById('roulette-wheel-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = cx - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
        const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
        const numPockets = numbers.length;
        const arc = (Math.PI * 2) / numPockets;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(wheelAngle);

        ctx.beginPath();
        ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = '#b8860b';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#d4af37';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();

        for (let i = 0; i < numPockets; i++) {
            const num = numbers[i];
            const startAngle = i * arc;
            const endAngle = startAngle + arc;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();

            if (num === 0) ctx.fillStyle = '#107c41';
            else if (redNumbers.has(num)) ctx.fillStyle = '#c5221f';
            else ctx.fillStyle = '#111827';

            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
            ctx.stroke();

            ctx.save();
            ctx.rotate(startAngle + arc / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(num.toString(), radius - 8, 3);
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0d14';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#d4af37';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#d4af37';
        ctx.fill();

        ctx.restore();

        if (this.rouletteSpinning || ballAngle !== 0) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(ballAngle);
            const ballDist = ballRadiusCustom > 0 ? ballRadiusCustom : (radius * 0.76);
            ctx.beginPath();
            ctx.arc(ballDist, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();
            ctx.restore();
        }
    }

    renderRouletteHistory() {
        const el = document.getElementById('roulette-history-list');
        if (!el) return;
        const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
        el.innerHTML = this.rouletteLastNumbers.map(n => {
            const cls = n === 0 ? 'badge-zero' : (redNumbers.has(n) ? 'badge-red' : 'badge-black');
            return `<span class="roulette-num-pill ${cls}">${n}</span>`;
        }).join('');
    }

    renderRouletteBets() {
        document.querySelectorAll('#roulette-felt-grid [data-roulette-bet]').forEach(el => {
            const betKey = el.dataset.rouletteBet;
            const existing = el.querySelector('.felt-chip-stack');
            if (existing) existing.remove();

            const amount = this.rouletteBets[betKey];
            if (amount && amount > 0) {
                const badge = document.createElement('div');
                badge.className = 'felt-chip-stack';
                badge.textContent = amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount;
                el.appendChild(badge);
            }
        });

        const totalBet = Object.values(this.rouletteBets).reduce((a, b) => a + b, 0);
        const totalEl = document.getElementById('roulette-total-bet-val');
        if (totalEl) {
            totalEl.textContent = `R$ ${totalBet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
    }

    spinRoulette() {
        if (this.rouletteSpinning) return;
        const totalBet = Object.values(this.rouletteBets).reduce((a, b) => a + b, 0);
        if (totalBet <= 0) {
            this.showCasinoToast('Faça pelo menos uma aposta na mesa!', 'error');
            return;
        }

        if (!this.deductWallet(totalBet)) {
            this.showCasinoToast('Saldo insuficiente!', 'error');
            return;
        }

        this.clearFeltWinnerHighlight();
        this.rouletteSpinning = true;
        const btnSpin = document.getElementById('btn-spin-roulette');
        if (btnSpin) btnSpin.disabled = true;

        if (window.soundEngine && window.soundEngine.playRouletteSpin) {
            window.soundEngine.playRouletteSpin();
        }

        const numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
        const winningIndex = Math.floor(Math.random() * numbers.length);
        const winningNumber = numbers[winningIndex];

        const duration = 4000;
        const start = performance.now();
        const numPockets = numbers.length;
        const arc = (Math.PI * 2) / numPockets;
        const targetWheelSpins = 5;
        const targetBallSpins = 12;
        const finalPocketAngle = (numPockets - winningIndex) * arc - (arc / 2);

        const canvas = document.getElementById('roulette-wheel-canvas');
        const outerRadius = canvas ? (canvas.width / 2 - 14) : 95;
        const pocketRadius = outerRadius * 0.70;

        const animateWheel = (now) => {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const easeOutWheel = 1 - Math.pow(1 - progress, 3);
            const easeOutBall = 1 - Math.pow(1 - progress, 2.5);

            this.rouletteAngle = easeOutWheel * (targetWheelSpins * Math.PI * 2) + (finalPocketAngle * 0.5);
            this.rouletteBallAngle = -(easeOutBall * (targetBallSpins * Math.PI * 2) - finalPocketAngle);

            const spiralFactor = Math.pow(progress, 1.8);
            this.rouletteBallRadius = outerRadius - (outerRadius - pocketRadius) * spiralFactor;

            this.drawRouletteWheel(this.rouletteAngle, this.rouletteBallAngle, this.rouletteBallRadius);

            if (progress < 1) {
                requestAnimationFrame(animateWheel);
            } else {
                this.finishRoulette(winningNumber);
            }
        };

        requestAnimationFrame(animateWheel);
    }

    finishRoulette(winningNumber) {
        this.rouletteSpinning = false;
        const btnSpin = document.getElementById('btn-spin-roulette');
        if (btnSpin) btnSpin.disabled = false;

        this.rouletteLastNumbers.unshift(winningNumber);
        if (this.rouletteLastNumbers.length > 8) this.rouletteLastNumbers.pop();
        this.renderRouletteHistory();

        const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
        const isRed = redNumbers.has(winningNumber);
        const isBlack = winningNumber !== 0 && !isRed;
        const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
        const isOdd = winningNumber !== 0 && winningNumber % 2 !== 0;
        const isLow = winningNumber >= 1 && winningNumber <= 18;
        const isHigh = winningNumber >= 19 && winningNumber <= 36;
        const is1st12 = winningNumber >= 1 && winningNumber <= 12;
        const is2nd12 = winningNumber >= 13 && winningNumber <= 24;
        const is3rd12 = winningNumber >= 25 && winningNumber <= 36;
        const col = winningNumber % 3;

        let totalPayout = 0;

        for (const [bet, amt] of Object.entries(this.rouletteBets)) {
            if (bet === winningNumber.toString()) totalPayout += amt * 36;
            else if (bet === 'red' && isRed) totalPayout += amt * 2;
            else if (bet === 'black' && isBlack) totalPayout += amt * 2;
            else if (bet === 'even' && isEven) totalPayout += amt * 2;
            else if (bet === 'odd' && isOdd) totalPayout += amt * 2;
            else if (bet === '1-18' && isLow) totalPayout += amt * 2;
            else if (bet === '19-36' && isHigh) totalPayout += amt * 2;
            else if (bet === '1st12' && is1st12) totalPayout += amt * 3;
            else if (bet === '2nd12' && is2nd12) totalPayout += amt * 3;
            else if (bet === '3rd12' && is3rd12) totalPayout += amt * 3;
            else if (bet === 'col1' && col === 1) totalPayout += amt * 3;
            else if (bet === 'col2' && col === 2) totalPayout += amt * 3;
            else if (bet === 'col3' && col === 0 && winningNumber !== 0) totalPayout += amt * 3;
        }

        const winningCell = document.querySelector(`#roulette-felt-grid [data-roulette-bet="${winningNumber}"]`);
        if (winningCell) {
            winningCell.classList.add('felt-winner-pulse');
        }

        const colorName = winningNumber === 0 ? 'VERDE (0)' : (isRed ? 'VERMELHO' : 'PRETO');

        if (totalPayout > 0) {
            this.addWallet(totalPayout);
            if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
            this.showCasinoToast(`NUMERO ${winningNumber} (${colorName})! Ganhou R$ ${totalPayout.toFixed(2)}!`, 'success');
        } else {
            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            this.showCasinoToast(`NUMERO ${winningNumber} (${colorName})! Nao foi dessa vez.`, 'error');
        }

        this.rouletteBets = {};
        this.renderRouletteBets();
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];
        suits.forEach(s => {
            ranks.forEach(r => {
                let val = parseInt(r, 10);
                if (r === 'J' || r === 'Q' || r === 'K') val = 10;
                if (r === 'A') val = 11;
                deck.push({ suit: s, rank: r, val, isRed: s === '♥' || s === '♦' });
            });
        });
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    calcHandScore(cards) {
        let total = 0;
        let aces = 0;
        cards.forEach(c => {
            total += c.val;
            if (c.rank === 'A') aces++;
        });
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }

    bindBlackjack() {
        const btnDeal = document.getElementById('btn-bj-deal');
        const btnHit = document.getElementById('btn-bj-hit');
        const btnStand = document.getElementById('btn-bj-stand');
        const btnDouble = document.getElementById('btn-bj-double');

        if (btnDeal) {
            btnDeal.addEventListener('click', () => this.startBlackjack());
        }
        if (btnHit) {
            btnHit.addEventListener('click', () => this.hitBlackjack());
        }
        if (btnStand) {
            btnStand.addEventListener('click', () => this.standBlackjack());
        }
        if (btnDouble) {
            btnDouble.addEventListener('click', () => this.doubleBlackjack());
        }
    }

    startBlackjack() {
        this.bjBet = this.getSelectedChipValue();
        if (!this.deductWallet(this.bjBet)) {
            this.showCasinoToast('Saldo insuficiente para a aposta!', 'error');
            return;
        }

        this.bjDeck = this.createDeck();
        this.bjPlayerCards = [this.bjDeck.pop(), this.bjDeck.pop()];
        this.bjDealerCards = [this.bjDeck.pop(), this.bjDeck.pop()];
        this.bjState = 'playing';

        if (window.soundEngine && window.soundEngine.playCard) {
            window.soundEngine.playCard();
        }

        this.renderBlackjack();

        const pScore = this.calcHandScore(this.bjPlayerCards);
        const dScore = this.calcHandScore(this.bjDealerCards);

        if (pScore === 21) {
            if (dScore === 21) {
                this.finishBlackjack('PUSH', 'Ambos com Blackjack natural! Aposta devolvida.');
            } else {
                this.finishBlackjack('BLACKJACK', 'BLACKJACK NATURAL! Pagamento 3:2!');
            }
        }
    }

    hitBlackjack() {
        if (this.bjState !== 'playing') return;
        this.bjPlayerCards.push(this.bjDeck.pop());
        if (window.soundEngine && window.soundEngine.playCard) window.soundEngine.playCard();

        const pScore = this.calcHandScore(this.bjPlayerCards);
        this.renderBlackjack();

        if (pScore > 21) {
            this.finishBlackjack('BUST', 'Estourou 21! O Dealer venceu.');
        } else if (pScore === 21) {
            this.standBlackjack();
        }
    }

    doubleBlackjack() {
        if (this.bjState !== 'playing' || this.bjPlayerCards.length !== 2) return;
        if (!this.deductWallet(this.bjBet)) {
            this.showCasinoToast('Saldo insuficiente para dobrar!', 'error');
            return;
        }
        this.bjBet *= 2;
        this.bjPlayerCards.push(this.bjDeck.pop());
        if (window.soundEngine && window.soundEngine.playCard) window.soundEngine.playCard();

        const pScore = this.calcHandScore(this.bjPlayerCards);
        this.renderBlackjack();

        if (pScore > 21) {
            this.finishBlackjack('BUST', 'Estourou 21 no dobro! O Dealer venceu.');
        } else {
            this.standBlackjack();
        }
    }

    standBlackjack() {
        if (this.bjState !== 'playing') return;
        this.bjState = 'dealer_turn';

        while (this.calcHandScore(this.bjDealerCards) < 17) {
            this.bjDealerCards.push(this.bjDeck.pop());
        }

        const pScore = this.calcHandScore(this.bjPlayerCards);
        const dScore = this.calcHandScore(this.bjDealerCards);

        if (dScore > 21) {
            this.finishBlackjack('WIN', 'Dealer estourou 21! Voce venceu!');
        } else if (pScore > dScore) {
            this.finishBlackjack('WIN', `Voce venceu (${pScore} contra ${dScore})!`);
        } else if (dScore > pScore) {
            this.finishBlackjack('LOSE', `Dealer venceu (${dScore} contra ${pScore}).`);
        } else {
            this.finishBlackjack('PUSH', `Empate em ${pScore} pontos! Aposta devolvida.`);
        }
    }

    finishBlackjack(result, message) {
        this.bjState = 'game_over';
        this.renderBlackjack();

        if (result === 'BLACKJACK') {
            const payout = this.bjBet + (this.bjBet * 1.5);
            this.addWallet(payout);
            if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
            this.showCasinoToast(message, 'success');
        } else if (result === 'WIN') {
            const payout = this.bjBet * 2;
            this.addWallet(payout);
            if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
            this.showCasinoToast(message, 'success');
        } else if (result === 'PUSH') {
            this.addWallet(this.bjBet, false);
            this.showCasinoToast(message, 'info');
        } else {
            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            this.showCasinoToast(message, 'error');
        }
    }

    renderBlackjack() {
        const dContainer = document.getElementById('bj-dealer-cards');
        const pContainer = document.getElementById('bj-player-cards');
        const dScoreEl = document.getElementById('bj-dealer-score');
        const pScoreEl = document.getElementById('bj-player-score');

        const btnDeal = document.getElementById('btn-bj-deal');
        const btnHit = document.getElementById('btn-bj-hit');
        const btnStand = document.getElementById('btn-bj-stand');
        const btnDouble = document.getElementById('btn-bj-double');

        const isPlaying = this.bjState === 'playing';

        if (btnDeal) btnDeal.disabled = isPlaying;
        if (btnHit) btnHit.disabled = !isPlaying;
        if (btnStand) btnStand.disabled = !isPlaying;
        if (btnDouble) btnDouble.disabled = !isPlaying || this.bjPlayerCards.length !== 2;

        if (pContainer) {
            pContainer.innerHTML = this.bjPlayerCards.map((c, i) => `
                <div class="casino-playing-card ${c.isRed ? 'card-red' : 'card-black'} card-dealt" style="animation-delay: ${i * 0.08}s">
                    <span class="card-val-top">${c.rank}<small>${c.suit}</small></span>
                    <span class="card-suit-center">${c.suit}</span>
                    <span class="card-val-bot">${c.rank}<small>${c.suit}</small></span>
                </div>
            `).join('');
            if (pScoreEl) pScoreEl.textContent = this.bjPlayerCards.length ? this.calcHandScore(this.bjPlayerCards) : '0';
        }

        if (dContainer) {
            if (this.bjState === 'playing' && this.bjDealerCards.length > 1) {
                const c1 = this.bjDealerCards[0];
                dContainer.innerHTML = `
                    <div class="casino-playing-card ${c1.isRed ? 'card-red' : 'card-black'} card-dealt">
                        <span class="card-val-top">${c1.rank}<small>${c1.suit}</small></span>
                        <span class="card-suit-center">${c1.suit}</span>
                        <span class="card-val-bot">${c1.rank}<small>${c1.suit}</small></span>
                    </div>
                    <div class="casino-playing-card card-back card-dealt" style="animation-delay: 0.1s">
                        <div class="card-back-pattern">♠ 🎲 ♥</div>
                    </div>
                `;
                if (dScoreEl) dScoreEl.textContent = `${c1.val} + ?`;
            } else {
                dContainer.innerHTML = this.bjDealerCards.map((c, i) => `
                    <div class="casino-playing-card ${c.isRed ? 'card-red' : 'card-black'} card-dealt card-flipped" style="animation-delay: ${i * 0.08}s">
                        <span class="card-val-top">${c.rank}<small>${c.suit}</small></span>
                        <span class="card-suit-center">${c.suit}</span>
                        <span class="card-val-bot">${c.rank}<small>${c.suit}</small></span>
                    </div>
                `).join('');
                if (dScoreEl) dScoreEl.textContent = this.bjDealerCards.length ? this.calcHandScore(this.bjDealerCards) : '0';
            }
        }
    }

    bindSlots() {
        const btnSpin = document.getElementById('btn-spin-slots');
        if (btnSpin) {
            btnSpin.addEventListener('click', () => this.spinSlots());
        }
    }

    spinSlots() {
        if (this.slotSpinning) return;
        this.slotBet = this.getSelectedChipValue();
        if (!this.deductWallet(this.slotBet)) {
            this.showCasinoToast('Saldo insuficiente para girar o slot!', 'error');
            return;
        }

        this.slotSpinning = true;
        const btnSpin = document.getElementById('btn-spin-slots');
        if (btnSpin) btnSpin.disabled = true;

        const frame = document.querySelector('.slots-reels-frame');
        if (frame) frame.classList.remove('slot-reel-glow');

        if (window.soundEngine && window.soundEngine.playReelSpin) {
            window.soundEngine.playReelSpin();
        }

        const symbols = ['7', '7', 'DIAMOND', 'DIAMOND', 'BELL', 'BELL', 'BELL', 'CLOVER', 'CLOVER', 'CHERRY', 'CHERRY', 'CHERRY', 'BOLT', 'BOLT'];
        const r1 = symbols[Math.floor(Math.random() * symbols.length)];
        const r2 = symbols[Math.floor(Math.random() * symbols.length)];
        const r3 = symbols[Math.floor(Math.random() * symbols.length)];

        const reel1El = document.getElementById('slot-reel-1');
        const reel2El = document.getElementById('slot-reel-2');
        const reel3El = document.getElementById('slot-reel-3');

        if (reel1El) { reel1El.classList.remove('slot-bounce'); reel1El.classList.add('slot-spinning'); }
        if (reel2El) { reel2El.classList.remove('slot-bounce'); reel2El.classList.add('slot-spinning'); }
        if (reel3El) { reel3El.classList.remove('slot-bounce'); reel3El.classList.add('slot-spinning'); }

        const cycleTimer1 = setInterval(() => {
            if (reel1El && reel1El.classList.contains('slot-spinning')) {
                reel1El.innerHTML = this.getSlotSymbolHtml(this.slotSymbols[Math.floor(Math.random() * this.slotSymbols.length)]);
            }
        }, 70);

        const cycleTimer2 = setInterval(() => {
            if (reel2El && reel2El.classList.contains('slot-spinning')) {
                reel2El.innerHTML = this.getSlotSymbolHtml(this.slotSymbols[Math.floor(Math.random() * this.slotSymbols.length)]);
            }
        }, 70);

        const cycleTimer3 = setInterval(() => {
            if (reel3El && reel3El.classList.contains('slot-spinning')) {
                reel3El.innerHTML = this.getSlotSymbolHtml(this.slotSymbols[Math.floor(Math.random() * this.slotSymbols.length)]);
            }
        }, 70);

        setTimeout(() => {
            clearInterval(cycleTimer1);
            this.slotCurrent[0] = r1;
            if (reel1El) {
                reel1El.classList.remove('slot-spinning');
                reel1El.innerHTML = this.getSlotSymbolHtml(r1);
                reel1El.classList.add('slot-bounce');
            }
            if (window.soundEngine && window.soundEngine.playReelStop) window.soundEngine.playReelStop();
        }, 900);

        setTimeout(() => {
            clearInterval(cycleTimer2);
            this.slotCurrent[1] = r2;
            if (reel2El) {
                reel2El.classList.remove('slot-spinning');
                reel2El.innerHTML = this.getSlotSymbolHtml(r2);
                reel2El.classList.add('slot-bounce');
            }
            if (window.soundEngine && window.soundEngine.playReelStop) window.soundEngine.playReelStop();
        }, 1500);

        setTimeout(() => {
            clearInterval(cycleTimer3);
            this.slotCurrent[2] = r3;
            if (reel3El) {
                reel3El.classList.remove('slot-spinning');
                reel3El.innerHTML = this.getSlotSymbolHtml(r3);
                reel3El.classList.add('slot-bounce');
            }
            if (window.soundEngine && window.soundEngine.playReelStop) window.soundEngine.playReelStop();
            this.finishSlots();
        }, 2100);
    }

    getSlotSymbolHtml(sym) {
        const map = {
            '7': '<div class="slot-sym sym-7">777</div>',
            'DIAMOND': '<div class="slot-sym sym-diamond">💎</div>',
            'BELL': '<div class="slot-sym sym-bell">🔔</div>',
            'CLOVER': '<div class="slot-sym sym-clover">🍀</div>',
            'CHERRY': '<div class="slot-sym sym-cherry">🍒</div>',
            'BOLT': '<div class="slot-sym sym-bolt">⚡</div>'
        };
        return map[sym] || `<div class="slot-sym">${sym}</div>`;
    }

    finishSlots() {
        this.slotSpinning = false;
        const btnSpin = document.getElementById('btn-spin-slots');
        if (btnSpin) btnSpin.disabled = false;

        const [s1, s2, s3] = this.slotCurrent;
        let multiplier = 0;

        if (s1 === '7' && s2 === '7' && s3 === '7') multiplier = 100;
        else if (s1 === 'DIAMOND' && s2 === 'DIAMOND' && s3 === 'DIAMOND') multiplier = 50;
        else if (s1 === 'BELL' && s2 === 'BELL' && s3 === 'BELL') multiplier = 25;
        else if (s1 === 'CLOVER' && s2 === 'CLOVER' && s3 === 'CLOVER') multiplier = 15;
        else if (s1 === 'CHERRY' && s2 === 'CHERRY' && s3 === 'CHERRY') multiplier = 10;
        else if (s1 === 'BOLT' && s2 === 'BOLT' && s3 === 'BOLT') multiplier = 5;
        else if (s1 === s2 || s2 === s3 || s1 === s3) {
            multiplier = 2;
        }

        if (multiplier > 0) {
            const frame = document.querySelector('.slots-reels-frame');
            if (frame) frame.classList.add('slot-reel-glow');
            const winAmount = this.slotBet * multiplier;
            this.addWallet(winAmount);
            if (window.soundEngine && window.soundEngine.playBigWin) {
                window.soundEngine.playBigWin();
            }
            this.showCasinoToast(`JACKPOT! Multiplicador ${multiplier}x! Ganhou R$ ${winAmount.toFixed(2)}!`, 'success');
        } else {
            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            this.showCasinoToast('Nenhuma combinacao premiada. Tente novamente!', 'error');
        }
    }

    renderSlots() {
        const reel1El = document.getElementById('slot-reel-1');
        const reel2El = document.getElementById('slot-reel-2');
        const reel3El = document.getElementById('slot-reel-3');
        if (reel1El) reel1El.innerHTML = this.getSlotSymbolHtml(this.slotCurrent[0]);
        if (reel2El) reel2El.innerHTML = this.getSlotSymbolHtml(this.slotCurrent[1]);
        if (reel3El) reel3El.innerHTML = this.getSlotSymbolHtml(this.slotCurrent[2]);
    }

    bindCrash() {
        const btnLaunch = document.getElementById('btn-crash-action');
        if (btnLaunch) {
            btnLaunch.addEventListener('click', () => {
                if (this.crashState === 'idle') this.startCrash();
                else if (this.crashState === 'flying' && !this.crashCashedOut) this.cashoutCrash();
            });
        }
    }

    startCrash() {
        if (this.crashState === 'flying') return;
        this.crashBet = this.getSelectedChipValue();
        if (!this.deductWallet(this.crashBet)) {
            this.showCasinoToast('Saldo insuficiente para lancar!', 'error');
            return;
        }

        this.crashState = 'flying';
        this.crashCashedOut = false;
        this.crashMultiplier = 1.00;
        this.crashParticles = [];
        this.crashExplosionParticles = [];

        const e = Math.random() * 95;
        this.crashPoint = Math.max(1.05, parseFloat((99 / (100 - e)).toFixed(2)));

        this.crashStartTime = performance.now();
        const btn = document.getElementById('btn-crash-action');
        if (btn) {
            btn.textContent = 'ENCERRAR APOSTA (CASHOUT)';
            btn.className = 'btn-casino-action btn-casino-cashout';
        }

        if (window.soundEngine && window.soundEngine.playTradeOpen) {
            window.soundEngine.playTradeOpen();
        }

        this.loopCrash();
    }

    loopCrash() {
        const canvas = document.getElementById('crash-graph-canvas');
        if (!canvas) return;
        if (canvas.parentElement && canvas.parentElement.clientWidth > 0) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight || 260;
        }
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        const update = () => {
            if (this.crashState !== 'flying') return;
            const now = performance.now();
            const elapsed = (now - this.crashStartTime) / 1000;

            this.crashMultiplier = parseFloat((1.0 + Math.pow(elapsed * 0.45, 1.8)).toFixed(2));

            const multLabel = document.getElementById('crash-live-multiplier');
            if (multLabel) {
                multLabel.textContent = `${this.crashMultiplier.toFixed(2)}x`;
                multLabel.className = 'crash-multiplier-text' + (this.crashCashedOut ? ' text-pos' : '');
            }

            const btn = document.getElementById('btn-crash-action');
            if (btn && !this.crashCashedOut) {
                const liveWin = (this.crashBet * this.crashMultiplier).toFixed(2);
                btn.textContent = `ENCERRAR: R$ ${liveWin} (${this.crashMultiplier.toFixed(2)}x)`;
            }

            ctx.clearRect(0, 0, w, h);
            this.drawCrashGrid(ctx, w, h);

            const progress = Math.min(1, elapsed / 8);
            const rocketX = 40 + progress * (w - 80);
            const rocketY = (h - 30) - Math.pow(progress, 1.4) * (h - 70);

            const grad = ctx.createLinearGradient(40, h - 30, rocketX, rocketY);
            grad.addColorStop(0, 'rgba(0, 229, 255, 0.1)');
            grad.addColorStop(1, '#00e5ff');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(40, h - 30);
            ctx.quadraticCurveTo(rocketX * 0.5, h - 30, rocketX, rocketY);
            ctx.stroke();

            if (Math.random() < 0.7) {
                this.crashParticles.push({
                    x: rocketX - 6,
                    y: rocketY + 4,
                    vx: -(Math.random() * 2 + 1),
                    vy: Math.random() * 2 - 1,
                    alpha: 1.0,
                    size: Math.random() * 4 + 2,
                    color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444'
                });
            }

            for (let i = this.crashParticles.length - 1; i >= 0; i--) {
                const p = this.crashParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.04;
                if (p.alpha <= 0) {
                    this.crashParticles.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            ctx.save();
            ctx.translate(rocketX, rocketY);
            ctx.rotate(-0.4);

            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-8, -6);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-8, 6);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(-12, -3);
            ctx.lineTo(-10, 0);
            ctx.lineTo(-12, 3);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            if (this.crashMultiplier >= this.crashPoint) {
                this.explodeCrash(rocketX, rocketY, ctx, w, h);
            } else {
                this.crashAnimId = requestAnimationFrame(update);
            }
        };

        this.crashAnimId = requestAnimationFrame(update);
    }

    drawCrashGrid(ctx, w, h) {
        ctx.strokeStyle = '#141e30';
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        for (let x = 0; x < w; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
    }

    cashoutCrash() {
        if (this.crashState !== 'flying' || this.crashCashedOut) return;
        this.crashCashedOut = true;
        const win = this.crashBet * this.crashMultiplier;
        this.addWallet(win);
        if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
        this.showCasinoToast(`CASHOUT REALIZADO! Ganhou R$ ${win.toFixed(2)} (${this.crashMultiplier.toFixed(2)}x)!`, 'success');

        const btn = document.getElementById('btn-crash-action');
        if (btn) {
            btn.textContent = `GANHOU R$ ${win.toFixed(2)}!`;
            btn.disabled = true;
        }
    }

    explodeCrash(lastX, lastY, ctx, w, h) {
        this.crashState = 'idle';
        if (this.crashAnimId) cancelAnimationFrame(this.crashAnimId);

        this.crashExplosionParticles = [];
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.crashExplosionParticles.push({
                x: lastX,
                y: lastY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1.0,
                size: Math.random() * 6 + 3,
                color: ['#ef4444', '#f59e0b', '#facc15', '#ffffff'][Math.floor(Math.random() * 4)]
            });
        }

        const blastAnim = () => {
            if (!this.crashExplosionParticles.length) return;
            ctx.clearRect(0, 0, w, h);
            this.drawCrashGrid(ctx, w, h);

            for (let i = this.crashExplosionParticles.length - 1; i >= 0; i--) {
                const p = this.crashExplosionParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.035;
                if (p.alpha <= 0) {
                    this.crashExplosionParticles.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            if (this.crashExplosionParticles.length > 0) {
                requestAnimationFrame(blastAnim);
            }
        };
        requestAnimationFrame(blastAnim);

        const multLabel = document.getElementById('crash-live-multiplier');
        if (multLabel) {
            multLabel.textContent = `CRASHOU EM ${this.crashPoint.toFixed(2)}x!`;
            multLabel.className = 'crash-multiplier-text text-neg';
        }

        const btn = document.getElementById('btn-crash-action');
        if (btn) {
            btn.textContent = 'NOVO LANCAMENTO';
            btn.className = 'btn-casino-action btn-casino-launch';
            btn.disabled = false;
        }

        if (!this.crashCashedOut) {
            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            this.showCasinoToast(`Foguete explodiu em ${this.crashPoint.toFixed(2)}x!`, 'error');
        }
    }

    renderCrash() {
        const multLabel = document.getElementById('crash-live-multiplier');
        if (multLabel) {
            multLabel.textContent = '1.00x';
            multLabel.className = 'crash-multiplier-text';
        }
        const canvas = document.getElementById('crash-graph-canvas');
        if (canvas) {
            if (canvas.parentElement && canvas.parentElement.clientWidth > 0) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight || 260;
            }
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.drawCrashGrid(ctx, canvas.width, canvas.height);
        }
    }

    bindMines() {
        const btnStart = document.getElementById('btn-mines-start');
        const btnCashout = document.getElementById('btn-mines-cashout');
        const gridEl = document.getElementById('mines-grid-board');

        if (btnStart) {
            btnStart.addEventListener('click', () => this.startMines());
        }
        if (btnCashout) {
            btnCashout.addEventListener('click', () => this.cashoutMines());
        }
        if (gridEl) {
            gridEl.addEventListener('click', (e) => {
                const tile = e.target.closest('.mines-tile');
                if (!tile || this.minesState !== 'playing') return;
                const idx = parseInt(tile.dataset.tileIndex, 10);
                this.clickMineTile(idx);
            });
        }

        document.querySelectorAll('.mines-count-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.minesState === 'playing') return;
                document.querySelectorAll('.mines-count-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.minesCount = parseInt(e.target.dataset.mines, 10);
                if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
            });
        });
    }

    startMines() {
        this.minesBet = this.getSelectedChipValue();
        if (!this.deductWallet(this.minesBet)) {
            this.showCasinoToast('Saldo insuficiente para iniciar o Campo Minado!', 'error');
            return;
        }

        const gridArea = document.querySelector('.mines-grid-area');
        if (gridArea) gridArea.classList.remove('shake-board');

        this.minesState = 'playing';
        this.minesDiamondsFound = 0;
        this.minesRevealed = new Array(25).fill(false);
        this.minesGrid = new Array(25).fill('diamond');

        let placedMines = 0;
        while (placedMines < this.minesCount) {
            const r = Math.floor(Math.random() * 25);
            if (this.minesGrid[r] !== 'mine') {
                this.minesGrid[r] = 'mine';
                placedMines++;
            }
        }

        if (window.soundEngine && window.soundEngine.playTradeOpen) window.soundEngine.playTradeOpen();
        this.renderMines();
    }

    clickMineTile(idx) {
        if (this.minesState !== 'playing' || this.minesRevealed[idx]) return;
        this.minesRevealed[idx] = true;

        if (this.minesGrid[idx] === 'mine') {
            this.minesState = 'exploded';
            this.minesRevealed.fill(true);

            const gridArea = document.querySelector('.mines-grid-area');
            if (gridArea) {
                gridArea.classList.add('shake-board');
                setTimeout(() => gridArea.classList.remove('shake-board'), 600);
            }

            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            this.showCasinoToast('BOOM! Voce pisou em uma mina.', 'error');
        } else {
            this.minesDiamondsFound++;
            if (window.soundEngine && window.soundEngine.playKeyClick) window.soundEngine.playKeyClick();
            if (this.minesDiamondsFound === 25 - this.minesCount) {
                this.cashoutMines();
                return;
            }
        }

        this.renderMines();
    }

    calcMinesMultiplier() {
        if (this.minesDiamondsFound === 0) return 1.0;
        let mult = 1.0;
        for (let i = 0; i < this.minesDiamondsFound; i++) {
            mult *= (25 - i) / (25 - this.minesCount - i);
        }
        return parseFloat((mult * 0.97).toFixed(2));
    }

    cashoutMines() {
        if (this.minesState !== 'playing' || this.minesDiamondsFound === 0) return;
        this.minesState = 'cashed_out';
        const mult = this.calcMinesMultiplier();
        const win = this.minesBet * mult;
        this.addWallet(win);
        this.minesRevealed.fill(true);
        if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
        this.showCasinoToast(`CASHOUT! ${this.minesDiamondsFound} diamantes! Ganhou R$ ${win.toFixed(2)} (${mult}x)!`, 'success');
        this.renderMines();
    }

    renderMines() {
        const gridEl = document.getElementById('mines-grid-board');
        const btnStart = document.getElementById('btn-mines-start');
        const btnCashout = document.getElementById('btn-mines-cashout');
        const pnlEl = document.getElementById('mines-current-pnl');

        const isPlaying = this.minesState === 'playing';
        if (btnStart) btnStart.disabled = isPlaying;
        if (btnCashout) {
            btnCashout.disabled = !isPlaying || this.minesDiamondsFound === 0;
            const mult = this.calcMinesMultiplier();
            const curWin = (this.minesBet * mult).toFixed(2);
            btnCashout.textContent = `RETIRAR: R$ ${curWin} (${mult}x)`;
        }

        if (pnlEl) {
            const mult = this.calcMinesMultiplier();
            pnlEl.textContent = `${this.minesDiamondsFound} Diamantes | Multiplicador: ${mult}x`;
        }

        if (gridEl) {
            gridEl.innerHTML = '';
            for (let i = 0; i < 25; i++) {
                const tile = document.createElement('div');
                tile.className = 'mines-tile';
                tile.dataset.tileIndex = i;

                if (this.minesRevealed[i]) {
                    tile.classList.add('revealed');
                    if (this.minesGrid[i] === 'mine') {
                        tile.classList.add('tile-mine');
                        tile.textContent = '💣';
                    } else {
                        tile.classList.add('tile-diamond');
                        tile.textContent = '💎';
                    }
                }

                gridEl.appendChild(tile);
            }
        }
    }

    bindBaccarat() {
        const btnDeal = document.getElementById('btn-bac-deal');
        if (btnDeal) {
            btnDeal.addEventListener('click', () => this.playBaccarat());
        }

        document.querySelectorAll('.bac-bet-target').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.bac-bet-target').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.bacBetType = e.currentTarget.dataset.target;
                if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
            });
        });

    }

    calcBaccaratScore(cards) {
        let total = 0;
        cards.forEach(c => {
            let v = c.val;
            if (v >= 10) v = 0;
            total += v;
        });
        return total % 10;
    }

    playBaccarat() {
        this.bacBetAmount = this.getSelectedChipValue();
        if (!this.deductWallet(this.bacBetAmount)) {
            this.showCasinoToast('Saldo insuficiente para o Baccarat!', 'error');
            return;
        }

        const deck = this.createDeck();
        this.bacPlayerCards = [deck.pop(), deck.pop()];
        this.bacBankerCards = [deck.pop(), deck.pop()];

        let pScore = this.calcBaccaratScore(this.bacPlayerCards);
        let bScore = this.calcBaccaratScore(this.bacBankerCards);

        if (pScore < 8 && bScore < 8) {
            let pThird = null;
            if (pScore <= 5) {
                pThird = deck.pop();
                this.bacPlayerCards.push(pThird);
                pScore = this.calcBaccaratScore(this.bacPlayerCards);
            }

            if (!pThird) {
                if (bScore <= 5) {
                    this.bacBankerCards.push(deck.pop());
                    bScore = this.calcBaccaratScore(this.bacBankerCards);
                }
            } else {
                const pv = pThird.val >= 10 ? 0 : pThird.val;
                if (bScore <= 2) this.bacBankerCards.push(deck.pop());
                else if (bScore === 3 && pv !== 8) this.bacBankerCards.push(deck.pop());
                else if (bScore === 4 && (pv >= 2 && pv <= 7)) this.bacBankerCards.push(deck.pop());
                else if (bScore === 5 && (pv >= 4 && pv <= 7)) this.bacBankerCards.push(deck.pop());
                else if (bScore === 6 && (pv === 6 || pv === 7)) this.bacBankerCards.push(deck.pop());
                bScore = this.calcBaccaratScore(this.bacBankerCards);
            }
        }

        if (window.soundEngine && window.soundEngine.playCard) window.soundEngine.playCard();
        this.renderBaccarat();

        let winner = 'tie';
        if (pScore > bScore) winner = 'player';
        else if (bScore > pScore) winner = 'banker';

        if (this.bacBetType === winner) {
            let payout = 0;
            if (winner === 'player') payout = this.bacBetAmount * 2;
            else if (winner === 'banker') payout = this.bacBetAmount * 1.95;
            else if (winner === 'tie') payout = this.bacBetAmount * 9;
            this.addWallet(payout);
            if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
            this.showCasinoToast(`VITORIA DO ${winner.toUpperCase()} (${pScore} x ${bScore})! Ganhou R$ ${payout.toFixed(2)}!`, 'success');
        } else {
            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            this.showCasinoToast(`Resultado: ${winner.toUpperCase()} (${pScore} x ${bScore}). Nao foi desta vez.`, 'error');
        }
    }

    renderBaccarat() {
        const pCont = document.getElementById('bac-player-cards');
        const bCont = document.getElementById('bac-banker-cards');
        const pScoreEl = document.getElementById('bac-player-score');
        const bScoreEl = document.getElementById('bac-banker-score');

        if (pCont) {
            pCont.innerHTML = this.bacPlayerCards.map((c, i) => `
                <div class="casino-playing-card ${c.isRed ? 'card-red' : 'card-black'} card-dealt" style="animation-delay: ${i * 0.08}s">
                    <span class="card-val-top">${c.rank}<small>${c.suit}</small></span>
                    <span class="card-suit-center">${c.suit}</span>
                    <span class="card-val-bot">${c.rank}<small>${c.suit}</small></span>
                </div>
            `).join('');
            if (pScoreEl) pScoreEl.textContent = this.calcBaccaratScore(this.bacPlayerCards);
        }

        if (bCont) {
            bCont.innerHTML = this.bacBankerCards.map((c, i) => `
                <div class="casino-playing-card ${c.isRed ? 'card-red' : 'card-black'} card-dealt" style="animation-delay: ${(i + 2) * 0.08}s">
                    <span class="card-val-top">${c.rank}<small>${c.suit}</small></span>
                    <span class="card-suit-center">${c.suit}</span>
                    <span class="card-val-bot">${c.rank}<small>${c.suit}</small></span>
                </div>
            `).join('');
            if (bScoreEl) bScoreEl.textContent = this.calcBaccaratScore(this.bacBankerCards);
        }
    }

    bindPoker() {
        const btnAction = document.getElementById('btn-poker-action');
        const cardsCont = document.getElementById('poker-cards-container');

        if (btnAction) {
            btnAction.addEventListener('click', () => {
                if (this.pokerState === 'deal') this.dealPoker();
                else if (this.pokerState === 'draw') this.drawPoker();
            });
        }

        if (cardsCont) {
            cardsCont.addEventListener('click', (e) => {
                if (this.pokerState !== 'draw') return;
                const cardEl = e.target.closest('.poker-card-slot');
                if (!cardEl) return;
                const idx = parseInt(cardEl.dataset.cardIndex, 10);
                this.pokerHeld[idx] = !this.pokerHeld[idx];
                if (window.soundEngine && window.soundEngine.playKeyClick) window.soundEngine.playKeyClick();
                this.renderPoker();
            });
        }
    }

    dealPoker() {
        this.pokerBet = this.getSelectedChipValue();
        if (!this.deductWallet(this.pokerBet)) {
            this.showCasinoToast('Saldo insuficiente para o Video Poker!', 'error');
            return;
        }

        this.pokerDeck = this.createDeck();
        this.pokerHand = [this.pokerDeck.pop(), this.pokerDeck.pop(), this.pokerDeck.pop(), this.pokerDeck.pop(), this.pokerDeck.pop()];
        this.pokerHeld = [false, false, false, false, false];
        this.pokerState = 'draw';

        if (window.soundEngine && window.soundEngine.playCard) window.soundEngine.playCard();
        this.renderPoker();
    }

    drawPoker() {
        for (let i = 0; i < 5; i++) {
            if (!this.pokerHeld[i]) {
                this.pokerHand[i] = this.pokerDeck.pop();
            }
        }

        this.pokerState = 'deal';
        if (window.soundEngine && window.soundEngine.playCard) window.soundEngine.playCard();
        this.evaluatePoker();
    }

    evaluatePoker() {
        const ranksOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const values = this.pokerHand.map(c => ranksOrder.indexOf(c.rank)).sort((a, b) => a - b);
        const suits = this.pokerHand.map(c => c.suit);

        const isFlush = suits.every(s => s === suits[0]);
        let isStraight = false;

        const isUnique = new Set(values).size === 5;
        if (isUnique) {
            if (values[4] - values[0] === 4) isStraight = true;
            if (values[0] === 0 && values[1] === 1 && values[2] === 2 && values[3] === 3 && values[4] === 12) isStraight = true;
        }

        const counts = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const freq = Object.values(counts).sort((a, b) => b - a);

        let handName = 'NENHUM';
        let mult = 0;

        if (isFlush && isStraight && values[0] === 8) {
            handName = 'ROYAL FLUSH'; mult = 250;
        } else if (isFlush && isStraight) {
            handName = 'STRAIGHT FLUSH'; mult = 50;
        } else if (freq[0] === 4) {
            handName = 'QUADRA (FOUR OF A KIND)'; mult = 25;
        } else if (freq[0] === 3 && freq[1] === 2) {
            handName = 'FULL HOUSE'; mult = 9;
        } else if (isFlush) {
            handName = 'FLUSH'; mult = 6;
        } else if (isStraight) {
            handName = 'SEQUENCIA (STRAIGHT)'; mult = 4;
        } else if (freq[0] === 3) {
            handName = 'TRINCA (THREE OF A KIND)'; mult = 3;
        } else if (freq[0] === 2 && freq[1] === 2) {
            handName = 'DOIS PARES'; mult = 2;
        } else if (freq[0] === 2) {
            const pairVal = parseInt(Object.keys(counts).find(k => counts[k] === 2), 10);
            if (pairVal >= 9) {
                handName = 'JACKS OR BETTER (VALETES OU MAIS)'; mult = 1;
            }
        }

        this.renderPoker(handName);

        if (mult > 0) {
            const win = this.pokerBet * (mult + 1);
            this.addWallet(win);
            if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
            this.showCasinoToast(`${handName}! Ganhou R$ ${win.toFixed(2)} (${mult}x)!`, 'success');
        } else {
            if (window.soundEngine && window.soundEngine.playTradeLoss) window.soundEngine.playTradeLoss();
            this.showCasinoToast('Nao foi desta vez!', 'error');
        }
    }

    renderPoker(handResultText = '') {
        const cont = document.getElementById('poker-cards-container');
        const btnAction = document.getElementById('btn-poker-action');
        const resultEl = document.getElementById('poker-result-label');

        if (btnAction) {
            btnAction.textContent = this.pokerState === 'draw' ? 'TROCAR CARTAS (DRAW)' : 'NOVA DISTRIBUICAO (DEAL)';
        }

        if (resultEl) {
            resultEl.textContent = handResultText ? `RESULTADO: ${handResultText}` : (this.pokerState === 'draw' ? 'CLIQUE NAS CARTAS QUE DESEJA MANTER (HOLD)' : '');
        }

        if (cont) {
            if (!this.pokerHand.length) {
                cont.innerHTML = `
                    <div class="poker-card-slot"><div class="casino-playing-card card-back"><div class="card-back-pattern">POKER</div></div></div>
                    <div class="poker-card-slot"><div class="casino-playing-card card-back"><div class="card-back-pattern">POKER</div></div></div>
                    <div class="poker-card-slot"><div class="casino-playing-card card-back"><div class="card-back-pattern">POKER</div></div></div>
                    <div class="poker-card-slot"><div class="casino-playing-card card-back"><div class="card-back-pattern">POKER</div></div></div>
                    <div class="poker-card-slot"><div class="casino-playing-card card-back"><div class="card-back-pattern">POKER</div></div></div>
                `;
            } else {
                cont.innerHTML = this.pokerHand.map((c, idx) => `
                    <div class="poker-card-slot ${this.pokerHeld[idx] ? 'is-held' : ''}" data-card-index="${idx}">
                        <div class="poker-hold-tag">${this.pokerHeld[idx] ? 'GUARDADO' : 'DESCARTAR'}</div>
                        <div class="casino-playing-card ${c.isRed ? 'card-red' : 'card-black'} card-dealt" style="animation-delay: ${idx * 0.06}s">
                            <span class="card-val-top">${c.rank}<small>${c.suit}</small></span>
                            <span class="card-suit-center">${c.suit}</span>
                            <span class="card-val-bot">${c.rank}<small>${c.suit}</small></span>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    showCasinoToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `trade-toast ${type === 'success' ? 'toast-win' : (type === 'info' ? 'toast-tie' : 'toast-loss')}`;
        toast.innerHTML = `
            <div class="toast-title">CASSINO ROYALE</div>
            <div class="toast-desc">${msg}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}

window.CasinoEngine = CasinoEngine;
window.casinoEngine = new CasinoEngine();

