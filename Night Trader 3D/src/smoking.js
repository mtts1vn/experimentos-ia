class SmokingViewModel {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.cigarGroup = null;
        this.filterMesh = null;
        this.paperMesh = null;
        this.ashMesh = null;
        this.emberMesh = null;
        this.emberLight = null;
        this.smokeTexture = null;
        this.particles = [];
        this.animFrameId = null;
        this.isSmoking = false;
        this.isPuffing = false;
        this.puffProgress = 0;
        this.burnProgress = 0;
        this.smokeDuration = 32000;
        this.smokeStartTime = 0;
        this.puffTimers = [];
        this.tipTimer = 0;
        this.lastTime = performance.now();
        this.mouseSwayX = 0;
        this.mouseSwayY = 0;
        this.targetSwayX = 0;
        this.targetSwayY = 0;
        this.whiskyGlassGroup = null;
        this.liquidMesh = null;
        this.isDrinking = false;
        this.drinkStartTime = 0;
        this.drinkDuration = 4400;
        this.init();
    }

    init() {
        let cvs = document.getElementById('smoking-3d-canvas');
        if (!cvs) {
            cvs = document.createElement('canvas');
            cvs.id = 'smoking-3d-canvas';
            cvs.style.position = 'fixed';
            cvs.style.top = '0';
            cvs.style.left = '0';
            cvs.style.width = '100vw';
            cvs.style.height = '100vh';
            cvs.style.pointerEvents = 'none';
            cvs.style.zIndex = '999990';
            cvs.style.display = 'none';
            document.body.appendChild(cvs);
        }
        this.canvas = cvs;

        const w = window.innerWidth;
        const h = window.innerHeight;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(48, w / h, 0.02, 50);
        this.camera.position.set(0, 0, 0);

        const amb = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(amb);

        const dir = new THREE.DirectionalLight(0xfff5ea, 0.65);
        dir.position.set(1, 2, 1);
        this.scene.add(dir);

        this.smokeTexture = this.generateSmokeTexture();
        this.buildCigarette();
        this.buildWhiskyGlass();

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => {
            if (!this.isSmoking) return;
            const nx = (e.clientX / window.innerWidth - 0.5) * 2;
            const ny = (e.clientY / window.innerHeight - 0.5) * 2;
            this.targetSwayX = nx * 0.012;
            this.targetSwayY = -ny * 0.012;
        }, { passive: true });

        window.addEventListener('keydown', (e) => {
            if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const target = e.target;
                if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                    return;
                }
                if (this.isSmoking && !this.isPuffing) {
                    this.performPuff();
                } else if (!this.isSmoking && window.addictionEngine) {
                    window.addictionEngine.smokeCigarette();
                }
            }
        });
    }

    onResize() {
        if (!this.renderer || !this.camera) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    generateSmokeTexture() {
        const size = 128;
        const cvs = document.createElement('canvas');
        cvs.width = size;
        cvs.height = size;
        const ctx = cvs.getContext('2d');

        const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
        grad.addColorStop(0, 'rgba(235, 242, 250, 0.85)');
        grad.addColorStop(0.25, 'rgba(220, 230, 240, 0.55)');
        grad.addColorStop(0.55, 'rgba(200, 215, 230, 0.22)');
        grad.addColorStop(0.85, 'rgba(180, 200, 220, 0.06)');
        grad.addColorStop(1, 'rgba(160, 180, 205, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 7; i++) {
            const px = size * 0.5 + (Math.random() - 0.5) * 36;
            const py = size * 0.5 + (Math.random() - 0.5) * 36;
            const rad = 20 + Math.random() * 26;
            const pGrad = ctx.createRadialGradient(px, py, 0, px, py, rad);
            pGrad.addColorStop(0, 'rgba(240, 245, 255, 0.25)');
            pGrad.addColorStop(1, 'rgba(200, 220, 240, 0)');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(px, py, rad, 0, Math.PI * 2);
            ctx.fill();
        }

        return new THREE.CanvasTexture(cvs);
    }

    generateCorkTexture() {
        const cvs = document.createElement('canvas');
        cvs.width = 64;
        cvs.height = 64;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#c57e3c';
        ctx.fillRect(0, 0, 64, 64);

        for (let i = 0; i < 280; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const w = 1 + Math.random() * 2;
            const h = 1 + Math.random() * 2;
            ctx.fillStyle = Math.random() > 0.5 ? '#a86227' : '#d99757';
            ctx.fillRect(x, y, w, h);
        }

        const tex = new THREE.CanvasTexture(cvs);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    generatePaperTexture() {
        const cvs = document.createElement('canvas');
        cvs.width = 64;
        cvs.height = 64;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#f6f7f9';
        ctx.fillRect(0, 0, 64, 64);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
        for (let y = 0; y < 64; y += 6) {
            ctx.fillRect(0, y, 64, 1.2);
        }

        const tex = new THREE.CanvasTexture(cvs);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    buildCigarette() {
        this.cigarGroup = new THREE.Group();

        const corkTex = this.generateCorkTexture();
        const paperTex = this.generatePaperTexture();

        const filterGeo = new THREE.CylinderGeometry(0.0072, 0.0072, 0.038, 20);
        filterGeo.rotateX(Math.PI * 0.5);
        const filterMat = new THREE.MeshStandardMaterial({
            map: corkTex,
            roughness: 0.85,
            metalness: 0.05
        });
        this.filterMesh = new THREE.Mesh(filterGeo, filterMat);
        this.filterMesh.position.set(0, 0, -0.019);
        this.cigarGroup.add(this.filterMesh);

        const ringGeo = new THREE.CylinderGeometry(0.0073, 0.0073, 0.003, 20);
        ringGeo.rotateX(Math.PI * 0.5);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.85,
            roughness: 0.25
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, 0, -0.0395);
        this.cigarGroup.add(ringMesh);

        const paperGeo = new THREE.CylinderGeometry(0.0071, 0.0071, 0.105, 20);
        paperGeo.rotateX(Math.PI * 0.5);
        const paperMat = new THREE.MeshStandardMaterial({
            map: paperTex,
            roughness: 0.75,
            metalness: 0.02
        });
        this.paperMesh = new THREE.Mesh(paperGeo, paperMat);
        this.paperMesh.position.set(0, 0, -0.093);
        this.cigarGroup.add(this.paperMesh);

        const ashGeo = new THREE.CylinderGeometry(0.0069, 0.0071, 0.008, 16);
        ashGeo.rotateX(Math.PI * 0.5);
        const ashMat = new THREE.MeshStandardMaterial({
            color: 0x33373e,
            roughness: 0.95,
            metalness: 0.0
        });
        this.ashMesh = new THREE.Mesh(ashGeo, ashMat);
        this.ashMesh.position.set(0, 0, -0.149);
        this.cigarGroup.add(this.ashMesh);

        const emberGeo = new THREE.SphereGeometry(0.0067, 16, 12);
        const emberMat = new THREE.MeshStandardMaterial({
            color: 0x220500,
            emissive: 0xff3700,
            emissiveIntensity: 2.2,
            roughness: 0.7
        });
        this.emberMesh = new THREE.Mesh(emberGeo, emberMat);
        this.emberMesh.position.set(0, 0, -0.154);
        this.emberMesh.scale.set(1, 1, 0.6);
        this.cigarGroup.add(this.emberMesh);

        this.emberLight = new THREE.PointLight(0xff4500, 0.45, 0.65);
        this.emberLight.position.set(0, 0, -0.158);
        this.cigarGroup.add(this.emberLight);

        this.baseCigarPos = new THREE.Vector3(0.12, -0.18, -0.38);
        this.baseCigarRot = new THREE.Euler(0.04, -0.06, 0.02);

        this.cigarGroup.position.copy(this.baseCigarPos);
        this.cigarGroup.rotation.copy(this.baseCigarRot);

        this.scene.add(this.cigarGroup);
        this.cigarGroup.visible = false;
    }

    buildWhiskyGlass() {
        this.whiskyGlassGroup = new THREE.Group();

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xdbeafe,
            transparent: true,
            opacity: 0.42,
            roughness: 0.1,
            metalness: 0.1
        });

        const glassGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.075, 24, 1, true);
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        this.whiskyGlassGroup.add(glassMesh);

        const baseGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.012, 24);
        const baseMesh = new THREE.Mesh(baseGeo, glassMat);
        baseMesh.position.y = -0.032;
        this.whiskyGlassGroup.add(baseMesh);

        const liquidGeo = new THREE.CylinderGeometry(0.036, 0.031, 0.042, 24);
        const liquidMat = new THREE.MeshStandardMaterial({
            color: 0xb45309,
            emissive: 0x78350f,
            emissiveIntensity: 0.35,
            roughness: 0.2,
            transparent: true,
            opacity: 0.88
        });
        this.liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
        this.liquidMesh.position.y = -0.012;
        this.whiskyGlassGroup.add(this.liquidMesh);

        const iceMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.68,
            roughness: 0.15,
            metalness: 0.1
        });
        const ice1 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.018), iceMat);
        ice1.position.set(0.008, 0.004, 0.006);
        ice1.rotation.set(0.3, 0.5, 0.2);
        this.whiskyGlassGroup.add(ice1);
        this.ice1Mesh = ice1;

        const ice2 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.016), iceMat);
        ice2.position.set(-0.009, 0.012, -0.005);
        ice2.rotation.set(0.6, -0.4, 0.3);
        this.whiskyGlassGroup.add(ice2);
        this.ice2Mesh = ice2;

        this.baseGlassPos = new THREE.Vector3(0.08, -0.16, -0.32);
        this.whiskyGlassGroup.position.set(0.08, -0.45, -0.32);
        this.whiskyGlassGroup.visible = false;
        this.scene.add(this.whiskyGlassGroup);
    }

    startDrinking() {
        if (this.isDrinking) return;
        this.isDrinking = true;
        this.drinkStartTime = performance.now();
        this.drinkDuration = 4400;

        if (this.canvas) {
            this.canvas.style.display = 'block';
        }

        if (this.whiskyGlassGroup) {
            this.whiskyGlassGroup.visible = true;
            this.whiskyGlassGroup.position.set(0.08, -0.45, -0.32);
            this.whiskyGlassGroup.rotation.set(0, 0, 0);
            if (this.liquidMesh) {
                this.liquidMesh.scale.set(1, 1, 1);
                this.liquidMesh.position.y = -0.012;
            }
        }

        if (window.soundEngine && window.soundEngine.playDrink) {
            setTimeout(() => {
                window.soundEngine.playDrink();
            }, 1000);
        }

        this.startLoop();
    }

    startSmoking(duration = 32000) {
        this.clearTimers();
        this.isSmoking = true;
        this.isPuffing = false;
        this.puffProgress = 0;
        this.burnProgress = 0;
        this.smokeDuration = duration;
        this.smokeStartTime = performance.now();
        this.lastTime = performance.now();

        if (this.canvas) {
            this.canvas.style.display = 'block';
        }

        if (this.cigarGroup) {
            this.cigarGroup.visible = true;
            this.cigarGroup.position.set(0.12, -0.45, -0.38);
        }

        if (window.soundEngine && window.soundEngine.playLighter) {
            window.soundEngine.playLighter();
        }

        this.startLoop();

        const planned = [2000, 7500, 13500, 20000, 26500];
        planned.forEach(ms => {
            const t = setTimeout(() => {
                if (this.isSmoking && !this.isPuffing) {
                    this.performPuff();
                }
            }, ms);
            this.puffTimers.push(t);
        });

        const endT = setTimeout(() => {
            this.finishSmoking();
        }, duration);
        this.puffTimers.push(endT);
    }

    clearTimers() {
        this.puffTimers.forEach(t => clearTimeout(t));
        this.puffTimers = [];
    }

    performPuff() {
        if (this.isPuffing || !this.isSmoking) return;
        this.isPuffing = true;
        this.puffProgress = 0;

        if (window.soundEngine && typeof window.soundEngine.playCigaretteInhale === 'function') {
            window.soundEngine.playCigaretteInhale();
        }

        if (this.emberMesh) {
            this.emberMesh.material.emissive.setHex(0xffaa22);
            this.emberMesh.material.emissiveIntensity = 8.5;
        }
        if (this.emberLight) {
            this.emberLight.color.setHex(0xff7700);
            this.emberLight.intensity = 2.4;
        }

        setTimeout(() => {
            if (!this.isSmoking) return;

            if (this.emberMesh) {
                this.emberMesh.material.emissive.setHex(0xff3700);
                this.emberMesh.material.emissiveIntensity = 2.2;
            }
            if (this.emberLight) {
                this.emberLight.color.setHex(0xff4500);
                this.emberLight.intensity = 0.45;
            }

            this.burnProgress = Math.min(1.0, this.burnProgress + 0.16);
            if (this.paperMesh) {
                const s = Math.max(0.35, 1.0 - this.burnProgress * 0.65);
                this.paperMesh.scale.z = s;
                this.paperMesh.position.z = -0.04 - (0.052 * s);
                if (this.ashMesh) {
                    this.ashMesh.position.z = this.paperMesh.position.z - (0.052 * s) - 0.004;
                }
                if (this.emberMesh) {
                    this.emberMesh.position.z = this.paperMesh.position.z - (0.052 * s) - 0.009;
                }
                if (this.emberLight) {
                    this.emberLight.position.z = this.emberMesh.position.z - 0.004;
                }
            }

            if (window.soundEngine && typeof window.soundEngine.playCigaretteExhale === 'function') {
                window.soundEngine.playCigaretteExhale();
            }

            this.spawnExhaleCloud();

            if (window.addictionEngine) {
                window.addictionEngine.onPuffTaken();
            }

            if (window.roomScene && typeof window.roomScene.onSmokeTriggered === 'function') {
                window.roomScene.onSmokeTriggered();
            }

            this.isPuffing = false;
        }, 1350);
    }

    spawnExhaleCloud() {
        const mouthPos = new THREE.Vector3(0.08, -0.14, -0.28);
        const count = 120;

        for (let i = 0; i < count; i++) {
            const spreadAngle = (Math.random() - 0.5) * 0.6;
            const elevationAngle = (Math.random() - 0.5) * 0.35;
            const forwardSpeed = 0.38 + Math.random() * 0.65;

            const vx = Math.sin(spreadAngle) * forwardSpeed + (Math.random() - 0.5) * 0.06;
            const vy = 0.06 + Math.sin(elevationAngle) * forwardSpeed + Math.random() * 0.12;
            const vz = -Math.cos(spreadAngle) * forwardSpeed - 0.15;

            const mat = new THREE.SpriteMaterial({
                map: this.smokeTexture,
                transparent: true,
                opacity: 0.65 + Math.random() * 0.25,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            const sprite = new THREE.Sprite(mat);
            const startScale = 0.035 + Math.random() * 0.03;
            sprite.scale.set(startScale, startScale, 1);

            const delayOffset = Math.random() * 0.25;
            sprite.position.copy(mouthPos).add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.03,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.03
            ));

            this.scene.add(sprite);

            this.particles.push({
                sprite: sprite,
                vx: vx,
                vy: vy,
                vz: vz,
                scale: startScale,
                growth: 0.22 + Math.random() * 0.26,
                drag: 0.94,
                buoyancy: 0.055 + Math.random() * 0.045,
                opacity: mat.opacity,
                decay: 0.22 + Math.random() * 0.14,
                delay: delayOffset,
                rotSpeed: (Math.random() - 0.5) * 1.2
            });
        }
    }

    spawnTipSmoke() {
        if (!this.emberMesh) return;
        const tipPos = new THREE.Vector3();
        this.emberMesh.getWorldPosition(tipPos);

        const count = 2;
        for (let i = 0; i < count; i++) {
            const mat = new THREE.SpriteMaterial({
                map: this.smokeTexture,
                transparent: true,
                opacity: 0.35 + Math.random() * 0.15,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            const sprite = new THREE.Sprite(mat);
            const s = 0.012 + Math.random() * 0.01;
            sprite.scale.set(s, s, 1);
            sprite.position.copy(tipPos).add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005
            ));

            this.scene.add(sprite);

            this.particles.push({
                sprite: sprite,
                vx: (Math.random() - 0.5) * 0.04 + 0.01,
                vy: 0.09 + Math.random() * 0.08,
                vz: (Math.random() - 0.5) * 0.04,
                scale: s,
                growth: 0.06 + Math.random() * 0.06,
                drag: 0.98,
                buoyancy: 0.04,
                opacity: mat.opacity,
                decay: 0.35 + Math.random() * 0.2,
                delay: 0,
                rotSpeed: (Math.random() - 0.5) * 0.8
            });
        }
    }

    startLoop() {
        if (this.animFrameId) return;

        const loop = (now) => {
            const delta = Math.min(0.06, (now - this.lastTime) * 0.001);
            this.lastTime = now;

            if (!this.isSmoking && !this.isDrinking && this.particles.length === 0) {
                this.stopLoop();
                return;
            }

            this.update(delta, now);
            this.renderer.render(this.scene, this.camera);

            this.animFrameId = requestAnimationFrame(loop);
        };

        this.animFrameId = requestAnimationFrame(loop);
    }

    stopLoop() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.canvas) {
            this.canvas.style.display = 'none';
        }
        if (this.cigarGroup) {
            this.cigarGroup.visible = false;
        }
        if (this.whiskyGlassGroup) {
            this.whiskyGlassGroup.visible = false;
        }
    }

    update(delta, now) {
        this.mouseSwayX += (this.targetSwayX - this.mouseSwayX) * 0.1;
        this.mouseSwayY += (this.targetSwayY - this.mouseSwayY) * 0.1;

        if (this.isDrinking && this.whiskyGlassGroup) {
            const elapsed = now - this.drinkStartTime;
            const t = Math.min(1.0, elapsed / this.drinkDuration);

            if (t < 0.22) {
                const p = t / 0.22;
                const ease = Math.sin(p * Math.PI * 0.5);
                this.whiskyGlassGroup.position.y = -0.45 + (-0.16 - -0.45) * ease;
                this.whiskyGlassGroup.position.x = 0.08 + this.mouseSwayX;
                this.whiskyGlassGroup.position.z = -0.32;
                this.whiskyGlassGroup.rotation.set(0, 0, 0);
            } else if (t < 0.75) {
                const p = (t - 0.22) / 0.53;
                const tilt = Math.sin(p * Math.PI);
                this.whiskyGlassGroup.position.y = -0.16 + tilt * 0.03;
                this.whiskyGlassGroup.position.x = 0.08 + this.mouseSwayX;
                this.whiskyGlassGroup.rotation.x = tilt * 0.72;
                this.whiskyGlassGroup.rotation.z = tilt * 0.12;

                if (this.liquidMesh) {
                    const drain = Math.max(0.1, 1.0 - p * 0.9);
                    this.liquidMesh.scale.y = drain;
                    this.liquidMesh.position.y = -0.012 - (1 - drain) * 0.016;
                }
            } else if (t < 0.88) {
                this.whiskyGlassGroup.position.y = -0.16;
                this.whiskyGlassGroup.position.x = 0.08 + this.mouseSwayX;
                this.whiskyGlassGroup.rotation.set(0, 0, 0);
            } else if (t < 1.0) {
                const p = (t - 0.88) / 0.12;
                this.whiskyGlassGroup.position.y = -0.16 - 0.35 * (p * p);
            } else {
                this.isDrinking = false;
                this.whiskyGlassGroup.visible = false;
            }
        }

        if (this.cigarGroup && this.isSmoking) {
            let targetY = this.baseCigarPos.y;
            let targetZ = this.baseCigarPos.z;
            let targetRotX = this.baseCigarRot.x;

            if (this.isPuffing) {
                targetY += 0.018;
                targetZ += 0.025;
                targetRotX -= 0.04;
            }

            const breathBob = Math.sin(now * 0.002) * 0.0025;
            this.cigarGroup.position.x = this.baseCigarPos.x + this.mouseSwayX;
            this.cigarGroup.position.y += (targetY + breathBob + this.mouseSwayY - this.cigarGroup.position.y) * 0.15;
            this.cigarGroup.position.z += (targetZ - this.cigarGroup.position.z) * 0.15;
            this.cigarGroup.rotation.x += (targetRotX - this.cigarGroup.rotation.x) * 0.15;

            if (this.emberLight) {
                const flicker = (Math.random() - 0.5) * 0.08;
                const baseInt = this.isPuffing ? 2.4 : 0.45;
                this.emberLight.intensity = Math.max(0.1, baseInt + flicker);
            }

            this.tipTimer += delta;
            if (this.tipTimer > 0.065) {
                this.tipTimer = 0;
                this.spawnTipSmoke();
            }
        }

        const remaining = [];
        const pLen = this.particles.length;

        for (let i = 0; i < pLen; i++) {
            const p = this.particles[i];
            if (p.delay > 0) {
                p.delay -= delta;
                remaining.push(p);
                continue;
            }

            p.vx *= p.drag;
            p.vz *= p.drag;
            p.vy += p.buoyancy * delta;

            p.sprite.position.x += p.vx * delta;
            p.sprite.position.y += p.vy * delta;
            p.sprite.position.z += p.vz * delta;

            p.scale += p.growth * delta;
            p.sprite.scale.set(p.scale, p.scale, 1);

            p.sprite.material.rotation += p.rotSpeed * delta;
            p.opacity -= p.decay * delta;

            if (p.opacity > 0.005) {
                p.sprite.material.opacity = Math.max(0, p.opacity);
                remaining.push(p);
            } else {
                this.scene.remove(p.sprite);
                if (p.sprite.material) p.sprite.material.dispose();
            }
        }

        this.particles = remaining;
    }

    finishSmoking() {
        this.clearTimers();
        this.isSmoking = false;
        this.isPuffing = false;

        if (this.cigarGroup) {
            const drop = () => {
                this.cigarGroup.position.y -= 0.01;
                if (this.cigarGroup.position.y > -0.5) {
                    requestAnimationFrame(drop);
                } else {
                    this.cigarGroup.visible = false;
                }
            };
            drop();
        }
    }
}

window.SmokingViewModel = SmokingViewModel;
window.smokingViewModel = new SmokingViewModel();
