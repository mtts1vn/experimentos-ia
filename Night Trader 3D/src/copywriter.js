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
            { name: 'Apex Digital Labs', tag: 'Lançamentos High-Ticket', avatar: '💎' },
            { name: 'Vanguard Trading Desk', tag: 'Mesa Proprietária Global', avatar: '📈' },
            { name: 'CyberPulse Media', tag: 'Growth & Tráfego Pago', avatar: '🌐' },
            { name: 'BlackSwan Intelligence', tag: 'Relatórios Macroeconômicos', avatar: '🦅' },
            { name: 'Aether Web3 Protocols', tag: 'Ecossistema Blockchain & DAO', avatar: '⛓️' },
            { name: 'Titanium Mind Academy', tag: 'Treinamento de Alta Performance', avatar: '🧠' },
            { name: 'BullRun Press', tag: 'Portal de Notícias Financeiras', avatar: '🐂' },
            { name: 'OmniChannel Syndicate', tag: 'E-commerce & Logística Global', avatar: '📦' },
            { name: 'IronClad Audits', tag: 'Auditoria e Cibersegurança', avatar: '🛡️' },
            { name: 'Vortex AI Labs', tag: 'Algoritmos Preditivos & Quant', avatar: '🔮' },
            { name: 'Zenith Private Wealth', tag: 'Gestão Exclusiva de Patrimônio', avatar: '🏛️' }
        ];

        this.templates = [
            {
                category: 'Página de Vendas VSL',
                text: 'Descubra o método validado por mais de quinhentos operadores profissionais para extrair lucros consistentes do mercado financeiro todos os dias. Nossa metodologia combina análise de fluxo institucional, gerenciamento rigoroso de capital e psicologia comportamental avançada. Clique no botão abaixo e desbloqueie seu acesso imediato à sala de operações ao vivo.'
            },
            {
                category: 'Página de Vendas VSL',
                text: 'Se você continua operando no escuro e devolvendo seus ganhos para o mercado no final da tarde, precisa conhecer esta nova ferramenta de inteligência quantitativa. Ela detecta zonas ocultas de liquidez antes dos grandes players agirem. Pare de arriscar seu patrimônio sem vantagem estatística e comece a lucrar com precisão cirúrgica agora.'
            },
            {
                category: 'Email de Conversão Rápida',
                text: 'A janela de oportunidade identificada pela nossa mesa proprietária está prestes a fechar. Os indicadores macroeconômicos apontam para um movimento direcional de alta volatilidade nas próximas quarenta e oito horas. Posicione sua carteira estrategicamente antes que o anúncio oficial seja divulgado e aproveite as margens extraordinárias deste ciclo.'
            },
            {
                category: 'Email de Conversão Rápida',
                text: 'Apenas hoje você tem a chance de acessar o nosso ecossistema fechado com condições nunca antes disponibilizadas. Analisamos centenas de ativos para entregar somente as três operações de maior assimetria positiva desta semana. Abra o link seguro agora e veja o relatório completo antes da abertura do pregão.'
            },
            {
                category: 'Anúncio de Alta Performance',
                text: 'Pare de tentar adivinhar topos e fundos no gráfico. Traders experientes não dependem de intuição, mas de algoritmos matemáticos que encontram desequilíbrios de oferta em frações de segundo. Toque em saiba mais e descubra como aplicar essa mesma tecnologia em suas operações diárias com taxa de acerto surpreendente.'
            },
            {
                category: 'Anúncio de Alta Performance',
                text: 'O mercado financeiro mudou completamente e as estratégias tradicionais já não funcionam como antes. Quem domina análise de fluxo e inteligência artificial está capturando os melhores movimentos com risco mínimo. Assista à nossa aula prática gratuita e aprenda a identificar acumulações institucionais em tempo real.'
            },
            {
                category: 'Script Pitch para Investidores',
                text: 'Apresentamos uma solução escalável de inteligência preditiva que processa milhões de ordens por segundo para capturar microineficiências no mercado global de capitais. Com uma equipe experiente e infraestrutura de baixíssima latência, oferecemos retornos assimétricos e sólida proteção de patrimônio contra eventos de cisne negro.'
            },
            {
                category: 'Script Pitch para Investidores',
                text: 'Nosso modelo proprietário de liquidez descentralizada une governança algorítmica e yield farming automatizado para oferecer rentabilidade consistente a investidores qualificados. Projetamos um crescimento exponencial para os próximos trimestres impulsionado pela expansão para os mercados internacionais e parcerias com grandes formadores de mercado.'
            },
            {
                category: 'Copy de Lançamento VIP',
                text: 'Chegou o momento de dar o próximo passo na sua carreira no mercado financeiro. As inscrições para a mentoria exclusiva da nossa mesa de operações estão abertas por tempo estritamente limitado. Você receberá acompanhamento diário com gestores renomados e ferramentas profissionais de análise técnica avançada.'
            },
            {
                category: 'Copy de Lançamento VIP',
                text: 'Restam menos de vinte vagas para a nossa sala de mentoria presencial deste semestre. Desenvolva disciplina operacional de ferro, aprenda a blindar suas emoções e opere lado a lado com os maiores especialistas do país. Garanta sua vaga exclusiva antes do esgotamento definitivo dos acessos.'
            },
            {
                category: 'Roteiro Viral de Reels & TikTok',
                text: 'O que os traders que faturam cinco dígitos por mês não te contam sobre o gerenciamento de risco? Eles nunca arriscam mais de um por cento da banca por operação. Salve este vídeo agora mesmo e aplique esta regra simples amanhã para nunca mais quebrar a sua conta no mercado.'
            },
            {
                category: 'Roteiro Viral de Reels & TikTok',
                text: 'Três erros fatais que destroem noventa por cento dos traders iniciantes logo na primeira semana: operar alavancado sem stop loss, tentar recuperar prejuízos por impulso e ignorar o calendário econômico global. Compartilhe este alerta com um amigo antes que ele cometa esses deslizes no pregão.'
            },
            {
                category: 'Advertorial & Caso de Estudo',
                text: 'Como um analista independente conseguiu transformar uma banca modesta em patrimônio sólido utilizando apenas leitura de fluxo e paciência calculada. Neste estudo de caso detalhado, revelamos as métricas exatas, os indicadores proprietários e a rotina diária que tornaram esses resultados possíveis sem atalhos mágicos.'
            },
            {
                category: 'Advertorial & Caso de Estudo',
                text: 'Descubra a história real de quem quase desistiu do day trade após consecutivas perdas, mas virou a chave ao implementar um modelo estruturado de gestão estatística de risco. Entenda o ponto exato da virada e confira o relatório de auditoria que comprova mais de doze meses de consistência positiva.'
            },
            {
                category: 'Carta de Vendas High-Ticket',
                text: 'Se a sua meta é operar capital institucional de sete dígitos com o respaldo de uma infraestrutura bancária de elite, esta convocação é para você. Selecionamos profissionais disciplinados para gerenciar contas financiadas por nossa empresa com repasse de até oitenta por cento do lucro líquido gerado.'
            },
            {
                category: 'Carta de Vendas High-Ticket',
                text: 'A consultoria executiva da nossa boutique de investimentos é personalizada para empresários e investidores com patrimônio relevante que buscam dolarização inteligente de ativos e proteção patrimonial contra oscilações cambiais severas. Agende uma reunião confidencial com nossos diretores sêniores ainda hoje.'
            },
            {
                category: 'Sequência de Escassez & Urgência',
                text: 'Este é o último aviso antes do encerramento definitivo desta rodada promocional. O cronômetro na página principal está nos minutos finais e as condições especiais não serão renovadas sob nenhuma hipótese. Conclua sua inscrição imediatamente e não fique de fora desta oportunidade transformadora.'
            },
            {
                category: 'Sequência de Escassez & Urgência',
                text: 'Restam apenas três licenças ativas para o nosso robô quantitativo de arbitragem neste trimestre. Uma vez preenchidas essas vagas, fecharemos os novos acessos para preservar a liquidez das operações e a rentabilidade dos usuários atuais. Tome a sua decisão agora.'
            },
            {
                category: 'Landing Page de Captura',
                text: 'Baixe gratuitamente o guia definitivo com as dez regras fundamentais de sobrevivência no mercado financeiro moderno. Aprenda a ler os movimentos das grandes instituições, proteja seu capital da inflação e comece a construir uma mentalidade vitoriosa hoje mesmo preenchendo o formulário abaixo.'
            },
            {
                category: 'Landing Page de Captura',
                text: 'Cadastre seu melhor email para receber nosso relatório semanal confidencial com a análise técnica dos principais ativos do mercado internacional. Informações precisas, projeções econômicas e oportunidades selecionadas diretamente dos nossos analistas para a sua caixa de entrada.'
            },
            {
                category: 'Comunicado de Governança DeFi',
                text: 'A proposta de melhoria do protocolo foi aprovada por ampla maioria dos detentores de tokens de governança. As novas taxas de staking dinâmico e o mecanismo aprimorado de queima deflacionária entrarão em vigor nas próximas semanas, fortalecendo a liquidez e garantindo sustentabilidade ao ecossistema.'
            },
            {
                category: 'Comunicado de Governança DeFi',
                text: 'Convocamos todos os validadores da rede para o teste de estresse da nova camada de escalabilidade modular. Essa atualização reduzirá as taxas de transação em mais de noventa por cento e aumentará a taxa de transferência para mais de dez mil transações simultâneas por segundo.'
            },
            {
                category: 'Boletim Macroeconômico',
                text: 'A decisão sobre as taxas de juros globais gerou forte volatilidade nas bolsas internacionais nesta manhã. Nosso comitê de política monetária recomenda cautela na exposição a ativos de risco e reforça posições estratégicas em títulos soberanos de curto prazo para capturar retornos atrativos com liquidez imediata.'
            },
            {
                category: 'Boletim Macroeconômico',
                text: 'A divulgação dos índices de inflação ao consumidor surpreendeu positivamente as projeções do mercado, indicando possível alívio nas pressões de custos. Observamos um influxo recorde de capital estrangeiro nos mercados emergentes, abrindo oportunidades táticas em ações de alta liquidez e commodities negociadas internacionalmente.'
            },
            {
                category: 'Onboarding de Produto SaaS',
                text: 'Seja muito bem-vindo à nossa plataforma analítica de alta velocidade. Para começar a extrair o potencial máximo do seu terminal financeiro, recomendamos configurar seus pares de negociação favoritos e ativar os alertas preditivos de volume no painel lateral de preferências.'
            },
            {
                category: 'Onboarding de Produto SaaS',
                text: 'Sua conta corporativa foi ativada com sucesso no ambiente em nuvem de baixa latência. Conecte suas chaves de integração segura agora mesmo e comece a monitorar ordens executadas, métricas de rentabilidade e relatórios fiscais em um único painel centralizado e interativo.'
            },
            {
                category: 'Campanha de Remarketing Agressivo',
                text: 'Notamos que você visitou nossa página de inscrição, mas não finalizou seu cadastro. Sabemos que tomar uma grande decisão financeira exige segurança, por isso liberamos um desconto exclusivo de vinte por cento válido apenas até a meia-noite de hoje. Volte agora e conclua seu acesso.'
            },
            {
                category: 'Campanha de Remarketing Agressivo',
                text: 'Você deixou sua vaga reservada no carrinho e faltam poucos minutos para ela ser liberada para a lista de espera. Não permita que o medo ou a procrastinação impeçam você de conquistar a liberdade financeira com um método testado e comprovado por centenas de alunos.'
            },
            {
                category: 'Manifesto de Marca Exclusiva',
                text: 'Nós não acreditamos em fórmulas fáceis ou promessas milagrosas de enriquecimento rápido. Acreditamos na disciplina inegociável, no estudo aprofundado dos dados e na execução metódica de planos operacionais rigorosos. Aqui formamos os traders que moldam o futuro do mercado financeiro mundial.'
            },
            {
                category: 'Manifesto de Marca Exclusiva',
                text: 'Liberdade não é trabalhar pouco, é ter o poder irrestrito de escolher onde, quando e com quem você deseja construir riqueza. Criamos uma infraestrutura onde a meritocracia é absoluta e o seu resultado depende única e exclusivamente da sua dedicação e precisão técnica.'
            },
            {
                category: 'Proposta Comercial B2B',
                text: 'Nossa proposta técnica contempla a integração completa de pipelines de dados em tempo real com os sistemas legados de sua tesouraria corporativa. Garantimos conformidade regulatória rigorosa, redundância de servidores em múltiplos data centers e suporte técnico especializado vinte e quatro horas por dia.'
            },
            {
                category: 'Proposta Comercial B2B',
                text: 'Oferecemos uma solução sob medida para otimizar o fluxo de pagamentos internacionais da sua empresa, reduzindo spreads de câmbio e eliminando burocracias intermediárias. Descubra como economizar milhares de reais por mês em operações transfronteiriças com nossa tecnologia.'
            },
            {
                category: 'Roteiro de Fechamento por WhatsApp',
                text: 'Olá, percebi que você solicitou mais informações sobre nossa assessoria de investimentos. Temos uma condição especial reservada para o seu perfil patrimonial que vence hoje. Se tiver cinco minutos, posso te apresentar os detalhes agora mesmo pelo telefone ou por mensagem.'
            },
            {
                category: 'Roteiro de Fechamento por WhatsApp',
                text: 'Boa tarde, acabei de analisar suas respostas no questionário de alocação de ativos e identifiquei dois pontos de melhoria urgente na sua carteira atual. Podemos agendar uma conversa rápida de quinze minutos para alinhar sua estratégia com nosso especialista de plantão?'
            },
            {
                category: 'Storytelling de Superação Financeira',
                text: 'Há três anos eu operava em um notebook antigo, sem qualquer orientação e acumulando frustrações diárias. A virada aconteceu quando parei de buscar atalhos e passei a seguir um plano de gerenciamento rigoroso de risco. Hoje compartilho essa jornada para mostrar que a consistência é construída tijolo por tijolo.'
            },
            {
                category: 'Storytelling de Superação Financeira',
                text: 'Muitos acham que o sucesso no mercado é sorte, mas ninguém vê as madrugadas estudando gráficos e refinando estratégias quando o resto do mundo está dormindo. Se você tem determinação para pagar o preço da disciplina diária, o mercado recompensará todo o seu esforço com juros compostos.'
            },
            {
                category: 'Newsletter Alpha Semanal',
                text: 'Bem-vindo ao boletim semanal com os principais insights da nossa mesa de operações. Nesta edição detalhamos o reposicionamento dos grandes fundos globais frente à recente valorização das commodities e apontamos os setores da economia com maior potencial de valorização defensiva nas próximas semanas.'
            },
            {
                category: 'Copy de Tráfego Direto',
                text: 'Você já calculou quanto dinheiro perde todos os meses pagando taxas abusivas de corretagem e aceitando spreads desvantajosos? Desenvolvemos uma plataforma direta sem intermediários que conecta sua ordem à ponta da liquidez global com custo operacional quase zero. Faça o teste hoje mesmo.'
            },
            {
                category: 'Pitch de Parceria Estratégica',
                text: 'Buscamos sinergia operacional com plataformas que compartilham nossa obsessão por inovação tecnológica e atendimento de alto padrão. Ao unir nossa liquidez proprietária à sua base de usuários ativos, podemos criar uma experiência incomparável de negociação e multiplicar a receita de ambos os lados.'
            },
            {
                category: 'Roteiro de Vídeo Institucional',
                text: 'Por trás de cada gráfico e de cada vela que se move na tela, existem bilhões de reais trocando de mãos em frações de segundo. Nós fornecemos a tecnologia, os dados e a infraestrutura para você competir em igualdade com as maiores tesourarias do planeta. O futuro do trading começa aqui.'
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
        const usedTexts = [];
        for (let i = 0; i < 4; i++) {
            const contract = this.createRandomContract(i + 1, usedTexts);
            usedTexts.push(contract.text);
            this.contracts.push(contract);
        }
    }

    createRandomContract(id, excludeTexts = []) {
        const client = this.clients[Math.floor(Math.random() * this.clients.length)];
        let pool = this.templates.filter(t => !excludeTexts.includes(t.text));
        if (pool.length === 0) {
            pool = this.templates;
        }
        const template = pool[Math.floor(Math.random() * pool.length)];
        const text = template.text;
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        const baseReward = 85;
        const extraPerWord = 1.15;
        const reward = Math.round(baseReward + (wordCount - 25) * extraPerWord + (Math.random() * 8 - 4));

        return {
            id: `contract_${Date.now()}_${id}_${Math.floor(Math.random() * 1000)}`,
            title: `${template.category} #${Math.floor(Math.random() * 900 + 100)}`,
            category: template.category,
            clientName: client.name,
            clientTag: client.tag,
            clientAvatar: client.avatar,
            wordCount: wordCount,
            text: text,
            reward: Math.max(88, Math.min(185, reward))
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

        const existingTexts = this.contracts.map(c => c.text);
        this.contracts = this.contracts.filter(c => c.id !== this.activeContract.id);
        this.contracts.push(this.createRandomContract(Date.now(), existingTexts));

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

