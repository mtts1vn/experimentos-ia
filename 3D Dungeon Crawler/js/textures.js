class TextureGenerator {
    constructor() {
        this.cache = {};
    }

    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { canvas, ctx };
    }

    canvasToTexture(canvas) {
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createWallTexture(isMossy = false) {
        const key = isMossy ? 'wall_mossy' : 'wall_stone';
        if (this.cache[key]) return this.cache[key];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#141416';
        ctx.fillRect(0, 0, size, size);

        const rows = 8;
        const rowHeight = size / rows;
        const brickColors = isMossy
            ? ['#4a4f47', '#3d443b', '#565c52', '#353a32', '#41473d']
            : ['#4e4b48', '#3f3d3b', '#5a5752', '#363433', '#474542'];

        for (let r = 0; r < rows; r++) {
            const y = r * rowHeight;
            const cols = 4;
            const brickWidth = size / (cols / 2);
            const offset = (r % 2) * (brickWidth / 2);

            for (let c = -1; c <= cols + 1; c++) {
                const x = c * (brickWidth / 2) + offset;
                const bw = brickWidth / 2 - 2;
                const bh = rowHeight - 2;

                const baseColor = brickColors[(r * 3 + c + 10) % brickColors.length];
                ctx.fillStyle = baseColor;
                ctx.fillRect(x + 1, y + 1, bw, bh);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.fillRect(x + 1, y + 1, bw, 2);
                ctx.fillRect(x + 1, y + 1, 2, bh);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.fillRect(x + 1, y + bh - 1, bw, 2);
                ctx.fillRect(x + bw - 1, y + 1, 2, bh);

                for (let i = 0; i < 20; i++) {
                    const nx = x + 2 + Math.floor(Math.random() * (bw - 4));
                    const ny = y + 2 + Math.floor(Math.random() * (bh - 4));
                    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)';
                    ctx.fillRect(nx, ny, 2, 2);
                }
            }
        }

        if (isMossy) {
            ctx.fillStyle = '#2d5022';
            for (let i = 0; i < 30; i++) {
                const mx = Math.floor(Math.random() * size);
                const my = Math.floor(Math.random() * (size - 10));
                const mw = 3 + Math.floor(Math.random() * 6);
                const mh = 4 + Math.floor(Math.random() * 12);
                ctx.fillRect(mx, my, mw, mh);
                ctx.fillStyle = '#3f6d30';
                ctx.fillRect(mx + 1, my + 1, mw - 2, mh - 2);
            }
        }

        const texture = this.canvasToTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    createFloorTexture() {
        if (this.cache['floor']) return this.cache['floor'];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#1e1c1a';
        ctx.fillRect(0, 0, size, size);

        const tileSize = 32;
        for (let y = 0; y < size; y += tileSize) {
            for (let x = 0; x < size; x += tileSize) {
                const tone = 40 + Math.floor(Math.random() * 20);
                ctx.fillStyle = `rgb(${tone}, ${tone - 3}, ${tone - 6})`;
                ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(x + 2, y + 2, tileSize - 4, 2);
                ctx.fillRect(x + 2, y + 2, 2, tileSize - 4);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(x + 2, y + tileSize - 4, tileSize - 4, 2);
                ctx.fillRect(x + tileSize - 4, y + 2, 2, tileSize - 4);

                if ((x + y) % 64 === 0) {
                    ctx.fillStyle = '#11100f';
                    ctx.fillRect(x + 8, y + 10, 10, 2);
                    ctx.fillRect(x + 16, y + 12, 6, 2);
                }
            }
        }

        const texture = this.canvasToTexture(canvas);
        this.cache['floor'] = texture;
        return texture;
    }

    createCeilingTexture() {
        if (this.cache['ceiling']) return this.cache['ceiling'];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#161412';
        ctx.fillRect(0, 0, size, size);

        const plankHeight = 16;
        for (let y = 0; y < size; y += plankHeight) {
            const woodTone = 30 + Math.floor(Math.random() * 15);
            ctx.fillStyle = `rgb(${woodTone + 15}, ${woodTone + 5}, ${woodTone})`;
            ctx.fillRect(0, y + 1, size, plankHeight - 2);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for (let g = 0; g < 4; g++) {
                const gy = y + 2 + g * 3;
                ctx.fillRect(0, gy, size, 1);
            }
        }

        for (let x = 0; x < size; x += 64) {
            ctx.fillStyle = '#221914';
            ctx.fillRect(x, 0, 12, size);
            ctx.fillStyle = '#3a2b22';
            ctx.fillRect(x + 2, 0, 8, size);

            ctx.fillStyle = '#0a0a0a';
            for (let ny = 16; ny < size; ny += 32) {
                ctx.fillRect(x + 5, ny, 3, 3);
            }
        }

        const texture = this.canvasToTexture(canvas);
        this.cache['ceiling'] = texture;
        return texture;
    }

    createWoodDoorTexture() {
        if (this.cache['door_wood']) return this.cache['door_wood'];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#3a3734';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#100e0d';
        ctx.fillRect(8, 4, size - 16, size - 4);

        const planks = 5;
        const plankW = (size - 24) / planks;
        for (let i = 0; i < planks; i++) {
            const px = 12 + i * plankW;
            ctx.fillStyle = i % 2 === 0 ? '#5a3d28' : '#4e3422';
            ctx.fillRect(px, 8, plankW - 2, size - 8);

            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(px + 4, 8, 2, size - 8);
            ctx.fillRect(px + 12, 8, 1, size - 8);
        }

        const bandY = [24, 64, 104];
        bandY.forEach(by => {
            ctx.fillStyle = '#26282b';
            ctx.fillRect(10, by, size - 20, 10);
            ctx.fillStyle = '#4b4e54';
            ctx.fillRect(10, by + 1, size - 20, 2);

            ctx.fillStyle = '#8a9099';
            for (let bx = 16; bx < size - 20; bx += 20) {
                ctx.fillRect(bx, by + 3, 4, 4);
                ctx.fillStyle = '#111';
                ctx.fillRect(bx + 1, by + 4, 2, 2);
                ctx.fillStyle = '#8a9099';
            }
        });

        ctx.fillStyle = '#1a1c1e';
        ctx.beginPath();
        ctx.arc(size - 32, 68, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(size - 32, 68, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#100e0d';
        ctx.beginPath();
        ctx.arc(size - 32, 68, 3, 0, Math.PI * 2);
        ctx.fill();

        const texture = this.canvasToTexture(canvas);
        this.cache['door_wood'] = texture;
        return texture;
    }

    createIronDoorTexture() {
        if (this.cache['door_iron']) return this.cache['door_iron'];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#3a3734';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#08080a';
        ctx.fillRect(10, 8, size - 20, size - 8);

        for (let x = 20; x < size - 20; x += 14) {
            ctx.fillStyle = '#1d2126';
            ctx.fillRect(x - 1, 8, 8, size - 8);
            ctx.fillStyle = '#4f555e';
            ctx.fillRect(x + 1, 8, 3, size - 8);
            ctx.fillStyle = '#8a939e';
            ctx.fillRect(x + 2, 8, 1, size - 8);
        }

        [25, 65, 105].forEach(y => {
            ctx.fillStyle = '#252a30';
            ctx.fillRect(10, y, size - 20, 8);
            ctx.fillStyle = '#616975';
            ctx.fillRect(10, y + 1, size - 20, 2);
        });

        ctx.fillStyle = '#9e7828';
        ctx.fillRect(size / 2 - 10, 60, 20, 22);
        ctx.fillStyle = '#e8b84b';
        ctx.fillRect(size / 2 - 8, 62, 16, 18);
        ctx.fillStyle = '#1a1408';
        ctx.beginPath();
        ctx.arc(size / 2, 69, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(size / 2 - 2, 69, 4, 6);

        const texture = this.canvasToTexture(canvas);
        this.cache['door_iron'] = texture;
        return texture;
    }

    createStairsTexture() {
        if (this.cache['stairs']) return this.cache['stairs'];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#050506';
        ctx.fillRect(0, 0, size, size);

        const steps = 8;
        const stepH = size / steps;
        for (let i = 0; i < steps; i++) {
            const y = i * stepH;
            const brightness = Math.max(15, 120 - i * 14);

            ctx.fillStyle = `rgb(${brightness}, ${brightness - 5}, ${brightness - 10})`;
            ctx.fillRect(8, y, size - 16, stepH - 4);

            ctx.fillStyle = `rgb(${brightness + 40}, ${brightness + 35}, ${brightness + 30})`;
            ctx.fillRect(8, y, size - 16, 2);

            ctx.fillStyle = '#000000';
            ctx.fillRect(8, y + stepH - 4, size - 16, 4);
        }

        ctx.fillStyle = '#3a3835';
        ctx.fillRect(0, 0, 8, size);
        ctx.fillRect(size - 8, 0, 8, size);

        const texture = this.canvasToTexture(canvas);
        this.cache['stairs'] = texture;
        return texture;
    }

    createTrapTexture(isActive = false) {
        const key = isActive ? 'trap_active' : 'trap_inactive';
        if (this.cache[key]) return this.cache[key];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#262422';
        ctx.fillRect(0, 0, size, size);

        const holes = 4;
        const spacing = size / (holes + 1);

        for (let r = 1; r <= holes; r++) {
            for (let c = 1; c <= holes; c++) {
                const cx = c * spacing;
                const cy = r * spacing;

                ctx.fillStyle = '#0a0a0a';
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                ctx.fill();

                if (isActive) {
                    ctx.fillStyle = '#7a818c';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - 10);
                    ctx.lineTo(cx - 4, cy + 4);
                    ctx.lineTo(cx + 4, cy + 4);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = '#8a1111';
                    ctx.fillRect(cx - 1, cy - 10, 3, 5);
                }
            }
        }

        const texture = this.canvasToTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    createChestTexture() {
        if (this.cache['chest']) return this.cache['chest'];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#4a2d18';
        ctx.fillRect(0, 0, size, size);

        for (let y = 0; y < size; y += 32) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, y, size, 2);
        }

        ctx.fillStyle = '#b8860b';
        ctx.fillRect(0, 0, size, 12);
        ctx.fillRect(0, size - 12, size, 12);
        ctx.fillRect(0, 0, 12, size);
        ctx.fillRect(size - 12, 0, 12, size);

        ctx.fillStyle = '#ffd700';
        ctx.fillRect(size / 2 - 16, size / 2 - 14, 32, 28);
        ctx.fillStyle = '#8b6508';
        ctx.fillRect(size / 2 - 14, size / 2 - 12, 28, 24);

        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2 - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(size / 2 - 2, size / 2 - 2, 4, 8);

        ctx.fillStyle = '#ffe066';
        [[6, 6], [size - 8, 6], [6, size - 8], [size - 8, size - 8]].forEach(([x, y]) => {
            ctx.fillRect(x - 2, y - 2, 5, 5);
        });

        const texture = this.canvasToTexture(canvas);
        this.cache['chest'] = texture;
        return texture;
    }

    createTorchSprite() {
        if (this.cache['torch_sprite']) return this.cache['torch_sprite'];

        const size = 64;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.fillStyle = '#1a1c1e';
        ctx.fillRect(28, 36, 8, 22);
        ctx.fillRect(24, 34, 16, 6);
        ctx.fillRect(26, 56, 12, 4);

        ctx.fillStyle = '#4a2f1b';
        ctx.fillRect(26, 24, 12, 12);

        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(32, 20, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.arc(32, 18, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffff66';
        ctx.beginPath();
        ctx.arc(32, 16, 4, 0, Math.PI * 2);
        ctx.fill();

        const texture = this.canvasToTexture(canvas);
        this.cache['torch_sprite'] = texture;
        return texture;
    }

    createSlimeSprite(frame = 0) {
        const key = `monster_slime_${frame}`;
        if (this.cache[key]) return this.cache[key];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        const squish = Math.sin(frame * Math.PI) * 4;
        const cx = 64;
        const cy = 76 + squish;
        const rx = 44 + squish;
        const ry = 36 - squish;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, 112, 42, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a5c1a';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2db82d';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, rx - 6, ry - 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#66ff66';
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 8, rx - 16, ry - 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(cx - 24, cy - 20, 10, 6);
        ctx.fillRect(cx - 20, cy - 24, 6, 4);

        [cx - 16, cx + 16].forEach(ex => {
            ctx.fillStyle = '#ffff33';
            ctx.beginPath();
            ctx.ellipse(ex, cy - 4, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#111111';
            ctx.fillRect(ex - 1, cy - 10, 3, 12);
        });

        const texture = this.canvasToTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    createSkeletonSprite(frame = 0) {
        const key = `monster_skeleton_${frame}`;
        if (this.cache[key]) return this.cache[key];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        const bob = Math.sin(frame * Math.PI) * 2;
        const cx = 64;
        const cy = 60 + bob;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, 118, 32, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d8d4c7';
        ctx.beginPath();
        ctx.arc(cx, cy - 26, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillRect(cx - 8, cy - 14, 16, 8);

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(cx - 10, cy - 28, 7, 7);
        ctx.fillRect(cx + 3, cy - 28, 7, 7);

        ctx.fillStyle = '#ff1100';
        ctx.fillRect(cx - 7, cy - 25, 3, 3);
        ctx.fillRect(cx + 5, cy - 25, 3, 3);

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(cx - 6, cy - 9, 12, 2);
        for (let t = -5; t <= 5; t += 3) {
            ctx.fillRect(cx + t, cy - 11, 1, 4);
        }

        ctx.fillStyle = '#c7c2b3';
        ctx.fillRect(cx - 3, cy - 6, 6, 28);

        for (let r = 0; r < 4; r++) {
            const ry = cy - 2 + r * 6;
            ctx.fillRect(cx - 14 + r, ry, 28 - r * 2, 3);
        }

        ctx.fillRect(cx - 10, cy + 22, 20, 6);

        ctx.fillRect(cx - 8, cy + 28, 4, 28);
        ctx.fillRect(cx + 4, cy + 28, 4, 28);

        ctx.fillRect(cx - 18, cy - 2, 4, 20);
        ctx.fillRect(cx + 14, cy - 2, 4, 20);

        ctx.fillStyle = '#734d3b';
        ctx.fillRect(cx + 18, cy - 25, 5, 45);
        ctx.fillStyle = '#c9a44b';
        ctx.fillRect(cx + 14, cy + 8, 13, 3);
        ctx.fillStyle = '#4a2f1b';
        ctx.fillRect(cx + 19, cy + 11, 3, 8);

        const texture = this.canvasToTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    createGoblinSprite(frame = 0) {
        const key = `monster_goblin_${frame}`;
        if (this.cache[key]) return this.cache[key];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        const bob = Math.sin(frame * Math.PI) * 2;
        const cx = 64;
        const cy = 68 + bob;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, 116, 28, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3f7331';
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy - 24);
        ctx.lineTo(cx - 32, cy - 30);
        ctx.lineTo(cx - 16, cy - 14);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 14, cy - 24);
        ctx.lineTo(cx + 32, cy - 30);
        ctx.lineTo(cx + 16, cy - 14);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4f8a3e';
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(cx - 10, cy - 24, 6, 6);
        ctx.fillRect(cx + 4, cy - 24, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - 8, cy - 23, 2, 4);
        ctx.fillRect(cx + 6, cy - 23, 2, 4);

        ctx.fillStyle = '#1c0808';
        ctx.fillRect(cx - 9, cy - 11, 18, 5);
        ctx.fillStyle = '#ffffee';
        ctx.fillRect(cx - 6, cy - 13, 3, 4);
        ctx.fillRect(cx + 3, cy - 13, 3, 4);

        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(cx - 12, cy - 2, 24, 24);

        ctx.fillStyle = '#22150b';
        ctx.fillRect(cx - 13, cy + 14, 26, 5);
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(cx - 3, cy + 13, 6, 7);

        ctx.fillStyle = '#3f7331';
        ctx.fillRect(cx - 10, cy + 22, 6, 22);
        ctx.fillRect(cx + 4, cy + 22, 6, 22);

        ctx.fillStyle = '#99a3a4';
        ctx.fillRect(cx - 24, cy - 10, 4, 20);
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(cx - 23, cy - 8, 2, 16);

        const texture = this.canvasToTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    createDemonSprite(frame = 0) {
        const key = `monster_demon_${frame}`;
        if (this.cache[key]) return this.cache[key];

        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);

        const floatY = Math.sin(frame * Math.PI) * 4;
        const cx = 64;
        const cy = 56 + floatY;

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, 118, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2b1010';
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 24);
        ctx.lineTo(cx - 36, cy - 46);
        ctx.lineTo(cx - 12, cy - 30);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 20, cy - 24);
        ctx.lineTo(cx + 36, cy - 46);
        ctx.lineTo(cx + 12, cy - 30);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#7a1717';
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#9e2222';
        ctx.beginPath();
        ctx.arc(cx, cy, 27, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffd0';
        ctx.beginPath();
        ctx.arc(cx, cy - 4, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#c42525';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy - 4);
        ctx.lineTo(cx - 8, cy - 2);
        ctx.moveTo(cx + 15, cy - 4);
        ctx.lineTo(cx + 8, cy - 6);
        ctx.stroke();

        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(cx, cy - 4, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.fillRect(cx - 2, cy - 12, 4, 16);

        ctx.fillStyle = '#170303';
        ctx.beginPath();
        ctx.arc(cx, cy + 16, 15, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffdd';
        for (let tx = -12; tx <= 12; tx += 4) {
            ctx.beginPath();
            ctx.moveTo(cx + tx, cy + 16);
            ctx.lineTo(cx + tx + 2, cy + 23);
            ctx.lineTo(cx + tx + 4, cy + 16);
            ctx.fill();
        }

        const texture = this.canvasToTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    createKeySprite(type = 'iron') {
        const key = `key_${type}`;
        if (this.cache[key]) return this.cache[key];

        const size = 64;
        const { canvas, ctx } = this.createCanvas(size, size);

        const isGold = type === 'gold';
        const mainColor = isGold ? '#ffd700' : '#bdc3c7';
        const shadowColor = isGold ? '#996515' : '#566573';

        const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
        grad.addColorStop(0, isGold ? 'rgba(255, 215, 0, 0.4)' : 'rgba(180, 200, 255, 0.3)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = shadowColor;
        ctx.beginPath();
        ctx.arc(32, 18, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(32, 18, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(32, 18, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = mainColor;
        ctx.fillRect(30, 27, 4, 25);
        ctx.fillStyle = shadowColor;
        ctx.fillRect(33, 27, 2, 25);

        ctx.fillStyle = mainColor;
        ctx.fillRect(34, 42, 7, 3);
        ctx.fillRect(34, 48, 9, 4);

        const texture = this.canvasToTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    createPotionSprite(type = 'health') {
        const key = `potion_${type}`;
        if (this.cache[key]) return this.cache[key];

        const size = 64;
        const { canvas, ctx } = this.createCanvas(size, size);

        const isHp = type === 'health';
        const liquidColor = isHp ? '#e74c3c' : '#3498db';
        const brightColor = isHp ? '#ff7675' : '#74b9ff';

        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(28, 12, 8, 6);

        ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
        ctx.fillRect(29, 18, 6, 8);

        ctx.beginPath();
        ctx.arc(32, 38, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220, 240, 255, 0.4)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(32, 39, 13, 0, Math.PI * 2);
        ctx.fillStyle = liquidColor;
        ctx.fill();

        ctx.fillStyle = brightColor;
        ctx.beginPath();
        ctx.arc(28, 36, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, 38, 14, Math.PI * 1.1, Math.PI * 1.6);
        ctx.stroke();

        const texture = this.canvasToTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    createWeaponOverlay() {
        const size = 256;
        const { canvas, ctx } = this.createCanvas(size, size);

        ctx.save();
        ctx.translate(180, 260);
        ctx.rotate(-Math.PI / 4);

        ctx.fillStyle = '#4a2c11';
        ctx.fillRect(-8, 30, 16, 50);

        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(0, 85, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c59b27';
        ctx.fillRect(-35, 22, 70, 12);

        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(-16, 22);
        ctx.lineTo(-14, -180);
        ctx.lineTo(0, -210);
        ctx.lineTo(14, -180);
        ctx.lineTo(16, 22);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.moveTo(-16, 22);
        ctx.lineTo(-14, -180);
        ctx.lineTo(0, -210);
        ctx.lineTo(0, 22);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-2, -170, 4, 190);

        ctx.restore();

        return canvas.toDataURL();
    }
}

window.textureGen = new TextureGenerator();
