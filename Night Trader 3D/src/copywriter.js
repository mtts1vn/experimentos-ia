class CopywriterEngine {
    constructor() {
        this.contracts = [];
        this.activeContract = null;
        this.typedCharIndex = 0;
        this.completedContractsCount = 0;
        this.totalWordsTyped = 0;
        this.totalEarned = 0;
        this.startTime = null;
        this.wpm = 0;
        this.isTypingActive = false;

        this.clients = [
            { name: 'Nexus Capital', tag: 'Venture & Hedge Fund', avatar: '🏢' },
            { name: 'HyperScale Media', tag: 'Agência de Performance', avatar: '🚀' },
            { name: 'Quantum Growth', tag: 'Consultoria de Escala', avatar: '⚡' },
            { name: 'CryptoWhale Alpha', tag: 'Comunidade DeFi VIP', avatar: '🐋' },
            { name: 'Visionary Tech', tag: 'SaaS B2B Inteligência', avatar: '🤖' },
            { name: 'Apex Digital Labs', tag: 'Lançamentos High-Ticket', avatar: '💎' }
        ];

        this.wordPool = [
            'transforme', 'resultados', 'estratégia', 'lucro', 'conversão', 'mercado', 'oportunidade',
            'exclusivo', 'segredo', 'método', 'inovação', 'impacto', 'escala', 'visão', 'crescimento',
            'solução', 'potencial', 'financeiro', 'algoritmo', 'liberdade', 'autoridade', 'garantia',
            'performance', 'retorno', 'investimento', 'vantagem', 'inteligência', 'futuro', 'alta',
            'demanda', 'execução', 'sucesso', 'decisão', 'posicionamento', 'domínio', 'métricas',
            'gatilhos', 'retenção', 'fidelização', 'tráfego', 'qualificado', 'copywriting', 'persuasão',
            'vendas', 'oferta', 'irresistível', 'proposta', 'única', 'posicionamento', 'autoridade',
            'aceleração', 'precisão', 'consistência', 'estrutura', 'revolucionário', 'lucratividade'
        ];

        this.templates = [
            {
                category: 'Página de Vendas VSL',
                prefix: 'Descubra como dominar o mercado financeiro com alta precisão e consistência. Nossa estratégia exclusiva desbloqueia resultados exponenciais através de algoritmos de inteligência e controle rigoroso de risco. Tome a decisão agora e alcance a verdadeira liberdade com suporte de elite.'
            },
            {
                category: 'Email de Conversão Rápida',
                prefix: 'Atenção investidor: esta oportunidade única no mercado cripto foi liberada apenas para nosso grupo restrito. Implemente o método de escala validado para multiplicar suas métricas de conversão e faturamento diário sem depender de sorte.'
            },
            {
                category: 'Anúncio de Alta Performance',
                prefix: 'Pare de perder tempo com estratégias ultrapassadas. Conheça a ferramenta que os maiores traders utilizam para antecipar movimentos de alta liquidez com segurança total e lucros consistentes todos os dias no mercado internacional.'
            },
            {
                category: 'Script Pitch para Investidores',
                prefix: 'Apresentamos uma solução revolucionária que integra tecnologia de ponta e análise preditiva em tempo real. Uma estrutura robusta pronta para escalar operações financeiras com retorno garantido e vantagens competitivas imbatíveis.'
            },
            {
                category: 'Copy de Lançamento VIP',
                prefix: 'As vagas para o treinamento fechado de alta lucratividade estão se esgotando rapidamente. Garanta seu acesso exclusivo aos gatilhos mais poderosos de vendas e domine as melhores técnicas de negociação de ativos.'
            }
        ];

        this.init();
    }

    init() {
        this.generateContractPool();
        this.selectContract(this.contracts[0].id);

        window.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });
    }

    generateContractPool() {
        this.contracts = [];
        for (let i = 0; i < 4; i++) {
            this.contracts.push(this.createRandomContract(i + 1));
        }
    }

    createRandomContract(id) {
        const client = this.clients[Math.floor(Math.random() * this.clients.length)];
        const template = this.templates[Math.floor(Math.random() * this.templates.length)];

        const targetWordCount = Math.floor(Math.random() * 26) + 25;
        let words = template.prefix.split(' ');

        while (words.length < targetWordCount) {
            const nextWord = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
            words.push(nextWord);
        }

        if (words.length > targetWordCount) {
            words = words.slice(0, targetWordCount);
        }

        let fullText = words.join(' ');
        if (!fullText.endsWith('.')) {
            fullText += '.';
        }

        const baseReward = 85;
        const extraPerWord = 0.95;
        const reward = Math.round(baseReward + (words.length - 25) * extraPerWord + (Math.random() * 10 - 5));

        return {
            id: `contract_${Date.now()}_${id}_${Math.floor(Math.random() * 1000)}`,
            title: `${template.category} #${Math.floor(Math.random() * 900 + 100)}`,
            category: template.category,
            clientName: client.name,
            clientTag: client.tag,
            clientAvatar: client.avatar,
            wordCount: words.length,
            text: fullText,
            reward: Math.max(88, Math.min(138, reward))
        };
    }

    selectContract(contractId) {
        const found = this.contracts.find(c => c.id === contractId);
        if (!found) return;

        this.activeContract = found;
        this.typedCharIndex = 0;
        this.startTime = null;
        this.isTypingActive = false;
        this.wpm = 0;
        this.render();
    }

    handleGlobalKeydown(e) {
        const copywriterWindow = document.querySelector('.desktop-window[data-window="copywriter"]');
        if (!copywriterWindow) return;

        const isVisible = !copywriterWindow.classList.contains('hidden') && !copywriterWindow.classList.contains('window-minimized');
        if (!isVisible) return;

        if (window.desktopUI && window.desktopUI.focusedApp !== 'copywriter') {
            return;
        }

        const ignoredKeys = [
            'Alt', 'Control', 'Shift', 'Meta', 'CapsLock', 'Tab', 'Escape',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
            'PageUp', 'PageDown', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7',
            'F8', 'F9', 'F10', 'F11', 'F12', 'Insert', 'NumLock', 'ScrollLock'
        ];

        if (ignoredKeys.includes(e.key)) {
            return;
        }

        e.preventDefault();

        if (!this.activeContract) return;

        if (this.typedCharIndex === 0) {
            this.startTime = performance.now();
            this.isTypingActive = true;
        }

        this.advanceTyping();
    }

    advanceTyping() {
        if (!this.activeContract) return;

        if (this.typedCharIndex < this.activeContract.text.length) {
            this.typedCharIndex++;

            if (window.soundEngine && window.soundEngine.playKeyClick) {
                window.soundEngine.playKeyClick();
            }

            if (this.startTime) {
                const elapsedMinutes = (performance.now() - this.startTime) / 60000;
                if (elapsedMinutes > 0.01) {
                    const wordsCompleted = (this.typedCharIndex / this.activeContract.text.length) * this.activeContract.wordCount;
                    this.wpm = Math.round(wordsCompleted / elapsedMinutes);
                }
            }

            this.updateTypingSheet();
            this.updateProgressBar();

            if (this.typedCharIndex >= this.activeContract.text.length) {
                this.completeActiveContract();
            }
        }
    }

    completeActiveContract() {
        this.isTypingActive = false;
        const reward = this.activeContract.reward;
        const wordCount = this.activeContract.wordCount;

        this.completedContractsCount++;
        this.totalWordsTyped += wordCount;
        this.totalEarned += reward;

        this.addWallet(reward);

        if (window.soundEngine && window.soundEngine.playWin) {
            window.soundEngine.playWin();
        }

        this.showCompletionModal(reward);
        this.showToast(`DOCUMENTO ENTREGUE! +R$ ${reward.toFixed(2)} depositados na carteira!`, 'success');

        this.contracts = this.contracts.filter(c => c.id !== this.activeContract.id);
        this.contracts.push(this.createRandomContract(Date.now()));

        this.renderStatsHeader();
        this.renderContractsList();
    }

    addWallet(amount) {
        if (window.tradingEngine && window.tradingEngine.wallet) {
            window.tradingEngine.wallet.balance += amount;
            window.tradingEngine.wallet.totalProfit += amount;
            if (window.tradingEngine.saveState) {
                window.tradingEngine.saveState();
            } else if (window.tradingEngine.saveWallet) {
                window.tradingEngine.saveWallet();
            }
            if (window.desktopUI) {
                if (typeof window.desktopUI.updateHeader === 'function') window.desktopUI.updateHeader();
                if (typeof window.desktopUI.updateExchangeSummary === 'function') window.desktopUI.updateExchangeSummary();
            }
            if (window.casinoEngine && typeof window.casinoEngine.updateBalanceDisplays === 'function') {
                window.casinoEngine.updateBalanceDisplays();
            }
        }
    }

    showCompletionModal(reward) {
        const overlay = document.getElementById('copywriter-payout-overlay');
        const payoutVal = document.getElementById('copywriter-payout-val');
        const clientVal = document.getElementById('copywriter-payout-client');

        if (payoutVal) {
            payoutVal.textContent = `+ R$ ${reward.toFixed(2)}`;
        }
        if (clientVal && this.activeContract) {
            clientVal.textContent = `${this.activeContract.clientName} • ${this.activeContract.title}`;
        }
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    dismissCompletionModal() {
        const overlay = document.getElementById('copywriter-payout-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        if (this.contracts.length > 0) {
            this.selectContract(this.contracts[0].id);
        }
    }

    render() {
        this.renderStatsHeader();
        this.renderContractsList();
        this.renderActiveContractHeader();
        this.updateTypingSheet();
        this.updateProgressBar();
    }

    renderStatsHeader() {
        const contractsEl = document.getElementById('cw-stat-contracts');
        const earnedEl = document.getElementById('cw-stat-earned');
        const wordsEl = document.getElementById('cw-stat-words');
        const wpmEl = document.getElementById('cw-stat-wpm');

        if (contractsEl) contractsEl.textContent = this.completedContractsCount;
        if (earnedEl) earnedEl.textContent = `R$ ${this.totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        if (wordsEl) wordsEl.textContent = this.totalWordsTyped;
        if (wpmEl) wpmEl.textContent = `${this.wpm} PPM`;
    }

    renderContractsList() {
        const listContainer = document.getElementById('copywriter-contracts-list');
        if (!listContainer) return;

        listContainer.innerHTML = this.contracts.map(c => {
            const isActive = this.activeContract && this.activeContract.id === c.id;
            return `
                <div class="cw-contract-card ${isActive ? 'active' : ''}" data-contract-id="${c.id}">
                    <div class="contract-card-header">
                        <span class="contract-avatar">${c.clientAvatar}</span>
                        <div class="contract-info">
                            <span class="contract-client">${c.clientName}</span>
                            <span class="contract-cat">${c.category}</span>
                        </div>
                        <span class="contract-payout">R$ ${c.reward}</span>
                    </div>
                    <div class="contract-meta">
                        <span class="meta-tag">${c.wordCount} palavras</span>
                        <span class="meta-tag meta-action">${isActive ? 'DIGITANDO' : 'ACEITAR'}</span>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.querySelectorAll('.cw-contract-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.contractId;
                this.selectContract(id);
                if (window.soundEngine && window.soundEngine.playClick) {
                    window.soundEngine.playClick();
                }
            });
        });
    }

    renderActiveContractHeader() {
        if (!this.activeContract) return;

        const titleEl = document.getElementById('cw-active-title');
        const clientEl = document.getElementById('cw-active-client');
        const rewardEl = document.getElementById('cw-active-reward');
        const wordCountEl = document.getElementById('cw-active-wordcount');

        if (titleEl) titleEl.textContent = this.activeContract.title;
        if (clientEl) clientEl.textContent = `${this.activeContract.clientAvatar} ${this.activeContract.clientName} (${this.activeContract.clientTag})`;
        if (rewardEl) rewardEl.textContent = `R$ ${this.activeContract.reward.toFixed(2)}`;
        if (wordCountEl) wordCountEl.textContent = `${this.activeContract.wordCount} Palavras`;
    }

    updateTypingSheet() {
        const sheetEl = document.getElementById('cw-typing-sheet');
        if (!sheetEl || !this.activeContract) return;

        const text = this.activeContract.text;
        const typedPart = text.slice(0, this.typedCharIndex);
        const cursorChar = this.typedCharIndex < text.length ? text[this.typedCharIndex] : '';
        const pendingPart = this.typedCharIndex < text.length ? text.slice(this.typedCharIndex + 1) : '';

        sheetEl.innerHTML = `
            <span class="cw-char-typed">${this.escapeHtml(typedPart)}</span><span class="cw-char-cursor">${this.escapeHtml(cursorChar || ' ')}</span><span class="cw-char-pending">${this.escapeHtml(pendingPart)}</span>
        `;
    }

    updateProgressBar() {
        if (!this.activeContract) return;

        const total = this.activeContract.text.length;
        const current = this.typedCharIndex;
        const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

        const fillEl = document.getElementById('cw-progress-fill');
        const textEl = document.getElementById('cw-progress-text');

        if (fillEl) fillEl.style.width = `${pct}%`;
        if (textEl) textEl.textContent = `${pct}% Concluído (${current}/${total} caracteres)`;
    }

    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `trade-toast ${type === 'success' ? 'toast-win' : 'toast-loss'}`;
        toast.innerHTML = `
            <div class="toast-title">COPYWRITER CENTER</div>
            <div class="toast-desc">${msg}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}

window.CopywriterEngine = CopywriterEngine;
window.copywriterEngine = new CopywriterEngine();

