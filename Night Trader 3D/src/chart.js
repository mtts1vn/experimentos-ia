class ChartEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.width = 0;
        this.height = 0;

        this.indicators = {
            sma: true,
            bollinger: false,
            rsi: false,
            macd: false,
            volume: true
        };

        this.chartType = 'candles';
        this.activeTrades = [];

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : null;
        const clientW = rect && rect.width > 0 ? rect.width : (this.canvas.clientWidth || window.innerWidth * 0.6);
        const clientH = rect && rect.height > 0 ? rect.height : (this.canvas.clientHeight || window.innerHeight * 0.6);

        const dpr = window.devicePixelRatio || 1;
        this.width = Math.max(300, Math.floor(clientW));
        this.height = Math.max(200, Math.floor(clientH));

        const targetW = Math.floor(this.width * dpr);
        const targetH = Math.floor(this.height * dpr);

        if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
            this.canvas.width = targetW;
            this.canvas.height = targetH;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
        }

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.imageSmoothingEnabled = true;
    }

    setChartType(type) {
        this.chartType = type;
    }

    toggleIndicator(name) {
        if (name in this.indicators) {
            this.indicators[name] = !this.indicators[name];
        }
    }

    setActiveTrades(trades) {
        this.activeTrades = trades || [];
    }

    calculateSMA(candles, period) {
        const result = [];
        for (let i = 0; i < candles.length; i++) {
            if (i < period - 1) {
                result.push(null);
                continue;
            }
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += candles[i - j].close;
            }
            result.push(sum / period);
        }
        return result;
    }

    calculateBollinger(candles, period = 20, multiplier = 2) {
        const upper = [];
        const middle = [];
        const lower = [];

        for (let i = 0; i < candles.length; i++) {
            if (i < period - 1) {
                upper.push(null);
                middle.push(null);
                lower.push(null);
                continue;
            }
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += candles[i - j].close;
            }
            const avg = sum / period;
            let varianceSum = 0;
            for (let j = 0; j < period; j++) {
                varianceSum += Math.pow(candles[i - j].close - avg, 2);
            }
            const stdDev = Math.sqrt(varianceSum / period);
            middle.push(avg);
            upper.push(avg + (multiplier * stdDev));
            lower.push(avg - (multiplier * stdDev));
        }

        return { upper, middle, lower };
    }

    calculateRSI(candles, period = 14) {
        const result = [];
        if (candles.length < period + 1) {
            return candles.map(() => null);
        }

        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= period; i++) {
            const diff = candles[i].close - candles[i - 1].close;
            if (diff >= 0) gains += diff;
            else losses -= diff;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = 0; i <= period; i++) {
            result.push(null);
        }

        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result.push(100 - (100 / (1 + rs)));

        for (let i = period + 1; i < candles.length; i++) {
            const diff = candles[i].close - candles[i - 1].close;
            const currentGain = diff > 0 ? diff : 0;
            const currentLoss = diff < 0 ? -diff : 0;

            avgGain = (avgGain * (period - 1) + currentGain) / period;
            avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

            rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            result.push(100 - (100 / (1 + rs)));
        }

        return result;
    }

    calculateMACD(candles, fastP = 12, slowP = 26, signalP = 9) {
        const calcEMA = (data, p) => {
            const k = 2 / (p + 1);
            const ema = [data[0]];
            for (let i = 1; i < data.length; i++) {
                ema.push(data[i] * k + ema[i - 1] * (1 - k));
            }
            return ema;
        };

        const closes = candles.map(c => c.close);
        if (closes.length < slowP) {
            return { macd: [], signal: [], hist: [] };
        }

        const fastEMA = calcEMA(closes, fastP);
        const slowEMA = calcEMA(closes, slowP);
        const macdLine = [];
        for (let i = 0; i < closes.length; i++) {
            macdLine.push(fastEMA[i] - slowEMA[i]);
        }

        const signalLine = calcEMA(macdLine, signalP);
        const hist = [];
        for (let i = 0; i < closes.length; i++) {
            hist.push(macdLine[i] - signalLine[i]);
        }

        return { macd: macdLine, signal: signalLine, hist };
    }

    render(asset, candles) {
        if (!this.canvas || !this.ctx || !candles || candles.length === 0) return;

        const parentRect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : null;
        if (parentRect && parentRect.width > 0 && parentRect.height > 0) {
            if (Math.floor(parentRect.width) !== this.width || Math.floor(parentRect.height) !== this.height) {
                this.resize();
            }
        }

        const dpr = window.devicePixelRatio || 1;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.fillStyle = '#080b12';
        ctx.fillRect(0, 0, w, h);

        const subpanelHeight = (this.indicators.rsi || this.indicators.macd) ? Math.floor(h * 0.22) : 0;
        const mainH = h - subpanelHeight - 24;
        const padRight = 80;
        const padTop = 18;
        const padLeft = 14;
        const plotW = Math.max(50, w - padLeft - padRight);
        const plotH = Math.max(50, mainH - padTop);

        const maxCandles = Math.min(candles.length, Math.max(30, Math.floor(plotW / 11)));
        const visibleCandles = candles.slice(candles.length - maxCandles);
        const candleStep = plotW / maxCandles;
        const candleBarWidth = Math.max(4, candleStep * 0.68);

        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let maxVolume = 1;

        for (let i = 0; i < visibleCandles.length; i++) {
            const c = visibleCandles[i];
            if (Number.isFinite(c.low) && c.low > 0 && c.low < minPrice) minPrice = c.low;
            if (Number.isFinite(c.high) && c.high > 0 && c.high > maxPrice) maxPrice = c.high;
            if (Number.isFinite(c.volume) && c.volume > maxVolume) maxVolume = c.volume;
        }

        for (let i = 0; i < this.activeTrades.length; i++) {
            const t = this.activeTrades[i];
            if (t.assetId === asset.id && Number.isFinite(t.strikePrice) && t.strikePrice > 0) {
                if (t.strikePrice < minPrice) minPrice = t.strikePrice;
                if (t.strikePrice > maxPrice) maxPrice = t.strikePrice;
            }
        }

        if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || minPrice <= 0 || maxPrice <= 0) {
            const curP = asset.currentPrice || 100;
            minPrice = curP * 0.99;
            maxPrice = curP * 1.01;
        } else if (maxPrice - minPrice < 0.00001) {
            minPrice = minPrice * 0.995;
            maxPrice = maxPrice * 1.005;
        }

        const priceSpan = Math.max(0.00001, maxPrice - minPrice);
        minPrice -= priceSpan * 0.08;
        maxPrice += priceSpan * 0.08;
        const totalSpan = Math.max(0.00001, maxPrice - minPrice);

        const getY = (price) => {
            const p = Number.isFinite(price) ? price : asset.currentPrice;
            const ratio = (p - minPrice) / totalSpan;
            return padTop + plotH - (Math.max(-0.5, Math.min(1.5, ratio)) * plotH);
        };

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridRows = 6;
        for (let r = 0; r <= gridRows; r++) {
            const gy = padTop + (plotH / gridRows) * r;
            ctx.beginPath();
            ctx.moveTo(padLeft, gy);
            ctx.lineTo(w - padRight, gy);
            ctx.stroke();

            const pVal = maxPrice - (totalSpan / gridRows) * r;
            ctx.fillStyle = '#64748b';
            ctx.font = '11px Consolas, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(pVal.toFixed(asset.decimals), w - padRight + 6, gy + 3.5);
        }

        const gridCols = 8;
        for (let c = 0; c <= gridCols; c++) {
            const gx = padLeft + (plotW / gridCols) * c;
            ctx.beginPath();
            ctx.moveTo(gx, padTop);
            ctx.lineTo(gx, padTop + plotH);
            ctx.stroke();
        }

        if (this.indicators.volume) {
            const volMaxH = plotH * 0.18;
            for (let i = 0; i < visibleCandles.length; i++) {
                const c = visibleCandles[i];
                const cx = padLeft + i * candleStep + candleStep / 2;
                const vH = (c.volume / maxVolume) * volMaxH;
                const vy = padTop + plotH - vH;
                ctx.fillStyle = c.close >= c.open ? 'rgba(0, 230, 118, 0.22)' : 'rgba(255, 61, 113, 0.22)';
                ctx.fillRect(cx - candleBarWidth / 2, vy, candleBarWidth, vH);
            }
        }

        if (this.indicators.bollinger) {
            const bb = this.calculateBollinger(candles);
            const visBB = {
                upper: bb.upper.slice(candles.length - maxCandles),
                middle: bb.middle.slice(candles.length - maxCandles),
                lower: bb.lower.slice(candles.length - maxCandles)
            };

            ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
            ctx.lineWidth = 1.2;
            ['upper', 'middle', 'lower'].forEach(band => {
                ctx.beginPath();
                let started = false;
                for (let i = 0; i < visibleCandles.length; i++) {
                    const val = visBB[band][i];
                    if (val === null) continue;
                    const cx = padLeft + i * candleStep + candleStep / 2;
                    const cy = getY(val);
                    if (!started) {
                        ctx.moveTo(cx, cy);
                        started = true;
                    } else {
                        ctx.lineTo(cx, cy);
                    }
                }
                ctx.stroke();
            });
        }

        if (this.indicators.sma) {
            const sma9 = this.calculateSMA(candles, 9).slice(candles.length - maxCandles);
            const sma21 = this.calculateSMA(candles, 21).slice(candles.length - maxCandles);

            ctx.lineWidth = 1.8;
            ctx.strokeStyle = '#ffd700';
            ctx.beginPath();
            let started9 = false;
            for (let i = 0; i < visibleCandles.length; i++) {
                if (sma9[i] === null) continue;
                const cx = padLeft + i * candleStep + candleStep / 2;
                const cy = getY(sma9[i]);
                if (!started9) { ctx.moveTo(cx, cy); started9 = true; }
                else { ctx.lineTo(cx, cy); }
            }
            ctx.stroke();

            ctx.strokeStyle = '#ff9100';
            ctx.beginPath();
            let started21 = false;
            for (let i = 0; i < visibleCandles.length; i++) {
                if (sma21[i] === null) continue;
                const cx = padLeft + i * candleStep + candleStep / 2;
                const cy = getY(sma21[i]);
                if (!started21) { ctx.moveTo(cx, cy); started21 = true; }
                else { ctx.lineTo(cx, cy); }
            }
            ctx.stroke();
        }

        if (this.chartType === 'line') {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            for (let i = 0; i < visibleCandles.length; i++) {
                const cx = padLeft + i * candleStep + candleStep / 2;
                const cy = getY(visibleCandles[i].close);
                if (i === 0) ctx.moveTo(cx, cy);
                else ctx.lineTo(cx, cy);
            }
            ctx.stroke();

            const lastX = padLeft + (visibleCandles.length - 1) * candleStep + candleStep / 2;
            ctx.lineTo(lastX, padTop + plotH);
            ctx.lineTo(padLeft + candleStep / 2, padTop + plotH);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
            grad.addColorStop(0, 'rgba(0, 229, 255, 0.28)');
            grad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');
            ctx.fillStyle = grad;
            ctx.fill();
        } else {
            for (let i = 0; i < visibleCandles.length; i++) {
                const c = visibleCandles[i];
                const prev = i > 0 ? visibleCandles[i - 1] : null;
                const cx = padLeft + i * candleStep + candleStep / 2;
                const isBull = c.close > c.open || (c.close === c.open && (!prev || c.close >= prev.close));
                const isDoji = Math.abs(c.close - c.open) < 0.000001;
                const color = isDoji ? '#94a3b8' : (isBull ? '#00e676' : '#ff3d71');

                const highY = getY(c.high);
                const lowY = getY(c.low);
                const openY = getY(c.open);
                const closeY = getY(c.close);

                ctx.strokeStyle = color;
                ctx.lineWidth = 1.4;

                const effectiveHighY = (highY === lowY) ? highY - 2.5 : highY;
                const effectiveLowY = (highY === lowY) ? lowY + 2.5 : lowY;

                ctx.beginPath();
                ctx.moveTo(cx, effectiveHighY);
                ctx.lineTo(cx, effectiveLowY);
                ctx.stroke();

                const barTop = Math.min(openY, closeY);
                const barHeight = Math.max(isDoji ? 1.5 : 2, Math.abs(closeY - openY));

                ctx.fillStyle = color;
                ctx.fillRect(cx - candleBarWidth / 2, barTop, candleBarWidth, barHeight);
            }
        }

        const curPrice = asset.currentPrice;
        const curY = getY(curPrice);

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, curY);
        ctx.lineTo(w - padRight, curY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(w - padRight, curY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(w - padRight, curY - 10, padRight - 4, 20);
        ctx.fillStyle = '#040d1a';
        ctx.font = 'bold 11px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(curPrice.toFixed(asset.decimals), w - padRight + 4, curY + 4);

        for (let i = 0; i < this.activeTrades.length; i++) {
            const t = this.activeTrades[i];
            if (t.assetId !== asset.id) continue;

            const strike = typeof t.entryPrice === 'number' ? t.entryPrice : t.strikePrice;
            const tY = getY(strike);
            const isUp = t.direction === 'CALL' || t.direction === 'SUBIR';
            const color = isUp ? '#00e676' : '#ff3d71';

            ctx.strokeStyle = color;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([6, 3]);
            ctx.beginPath();
            ctx.moveTo(padLeft, tY);
            ctx.lineTo(w - padRight, tY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = color;
            ctx.fillRect(padLeft + 6, tY - 10, 105, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Consolas, monospace';
            ctx.textAlign = 'left';
            const remain = Math.max(0, Math.ceil((t.expiresAt - Date.now()) / 1000));
            const tag = t.displayDirection || (t.direction === 'CALL' ? 'SUBIR' : 'DESCER');
            ctx.fillText(`${tag} ${remain}s`, padLeft + 10, tY + 4);
        }

        if (subpanelHeight > 0) {
            const subY = mainH;
            ctx.fillStyle = '#06080e';
            ctx.fillRect(0, subY, w, subpanelHeight);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, subY);
            ctx.lineTo(w, subY);
            ctx.stroke();

            if (this.indicators.rsi) {
                const rsi = this.calculateRSI(candles).slice(candles.length - maxCandles);
                const rsiTop = subY + 12;
                const rsiH = subpanelHeight - 24;

                const getRsiY = (val) => rsiTop + rsiH - (val / 100) * rsiH;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.setLineDash([3, 3]);
                [70, 30].forEach(level => {
                    const ly = getRsiY(level);
                    ctx.beginPath();
                    ctx.moveTo(padLeft, ly);
                    ctx.lineTo(w - padRight, ly);
                    ctx.stroke();
                });
                ctx.setLineDash([]);

                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                let startedRsi = false;
                for (let i = 0; i < visibleCandles.length; i++) {
                    if (rsi[i] === null) continue;
                    const cx = padLeft + i * candleStep + candleStep / 2;
                    const cy = getRsiY(rsi[i]);
                    if (!startedRsi) { ctx.moveTo(cx, cy); startedRsi = true; }
                    else { ctx.lineTo(cx, cy); }
                }
                ctx.stroke();

                ctx.fillStyle = '#c084fc';
                ctx.font = '11px Consolas, monospace';
                ctx.textAlign = 'left';
                const lastRsi = rsi[rsi.length - 1];
                ctx.fillText(`RSI(14): ${lastRsi ? lastRsi.toFixed(1) : '--'}`, padLeft + 6, subY + 14);
            } else if (this.indicators.macd) {
                const macdObj = this.calculateMACD(candles);
                const visMacd = macdObj.macd.slice(candles.length - maxCandles);
                const visSignal = macdObj.signal.slice(candles.length - maxCandles);
                const visHist = macdObj.hist.slice(candles.length - maxCandles);

                let maxMacd = 0.0001;
                visHist.forEach(v => {
                    if (Math.abs(v) > maxMacd) maxMacd = Math.abs(v);
                });

                const macdCenter = subY + subpanelHeight / 2;
                const scale = (subpanelHeight * 0.4) / maxMacd;

                for (let i = 0; i < visibleCandles.length; i++) {
                    const hVal = visHist[i];
                    if (hVal === undefined) continue;
                    const cx = padLeft + i * candleStep + candleStep / 2;
                    const bH = hVal * scale;
                    ctx.fillStyle = hVal >= 0 ? '#00e676' : '#ff3d71';
                    ctx.fillRect(cx - 2, macdCenter - bH, 4, bH);
                }

                ctx.fillStyle = '#00e5ff';
                ctx.font = '11px Consolas, monospace';
                ctx.textAlign = 'left';
                ctx.fillText('MACD (12, 26, 9)', padLeft + 6, subY + 14);
            }
        }
    }
}

window.ChartEngine = ChartEngine;
