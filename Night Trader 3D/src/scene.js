class RoomScene {
    constructor() {
        this.container = document.getElementById('viewport');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.player = {
            pos: new THREE.Vector3(0.5, 1.65, 1.8),
            yaw: 0.0,
            pitch: -0.08,
            speed: 3.5,
            velocity: new THREE.Vector3(),
            isWalking: false,
            bobTimer: 0
        };

        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        this.isPointerLocked = false;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.state = 'walk';
        this.transitionProgress = 0;
        this.transitionDuration = 1.2;
        this.transitionStartPos = new THREE.Vector3();
        this.transitionStartTarget = new THREE.Vector3();

        this.chairGroup = null;
        this.chairDefaultZ = 0.65;
        this.chairCurrentZ = 0.65;
        this.screenMesh = null;
        this.screenLight = null;
        this.moonLight = null;
        this.dustParticles = null;
        this.beaconLights = [];
        this.graphicsQuality = 'high';

        this.init();
    }

    init() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x02040a);
        this.scene.fog = new THREE.FogExp2(0x040814, 0.015);

        this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
        this.updateCameraFromPlayer();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(w, h);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;

        this.container.appendChild(this.renderer.domElement);

        this.setupLighting();
        this.buildRoom();
        this.buildCity();
        this.buildDustParticles();
        this.bindEvents();

        const savedGfx = localStorage.getItem('night_trader_graphics') || 'high';
        this.setGraphicsQuality(savedGfx);

        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x0a1020, 0.7);
        this.scene.add(ambientLight);

        this.moonLight = new THREE.DirectionalLight(0x9ab8f5, 1.8);
        this.moonLight.position.set(6, 12, -18);
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 2048;
        this.moonLight.shadow.mapSize.height = 2048;
        this.moonLight.shadow.camera.near = 0.5;
        this.moonLight.shadow.camera.far = 40;
        this.moonLight.shadow.camera.left = -6;
        this.moonLight.shadow.camera.right = 6;
        this.moonLight.shadow.camera.top = 6;
        this.moonLight.shadow.camera.bottom = -6;
        this.moonLight.shadow.bias = -0.0005;
        this.scene.add(this.moonLight);

        this.screenLight = new THREE.PointLight(0x00e5ff, 1.4, 4.5);
        this.screenLight.position.set(-0.95, 1.35, -1.75);
        this.scene.add(this.screenLight);

        const pcTowerLight = new THREE.PointLight(0x00ff88, 0.45, 1.8);
        pcTowerLight.position.set(-0.35, 0.65, -1.75);
        this.scene.add(pcTowerLight);

        const hallwayLight = new THREE.PointLight(0x1a284a, 0.35, 5);
        hallwayLight.position.set(2.8, 1.8, 2.0);
        this.scene.add(hallwayLight);
    }

    createNoiseTexture(w = 256, h = 256, type = 'wood') {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (type === 'wood') {
            ctx.fillStyle = '#100e12';
            ctx.fillRect(0, 0, w, h);
            for (let y = 0; y < h; y += 4) {
                const shade = 12 + Math.floor(Math.random() * 8);
                ctx.fillStyle = `rgb(${shade + 4}, ${shade + 2}, ${shade})`;
                ctx.fillRect(0, y, w, 3);
            }
            for (let i = 0; i < 40; i++) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(Math.random() * w, 0);
                ctx.lineTo(Math.random() * w, h);
                ctx.stroke();
            }
        } else if (type === 'wall') {
            ctx.fillStyle = '#0f121a';
            ctx.fillRect(0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 8;
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
            }
            ctx.putImageData(imgData, 0, 0);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    buildRoom() {
        const roomGroup = new THREE.Group();

        const woodTex = this.createNoiseTexture(512, 512, 'wood');
        woodTex.repeat.set(4, 4);

        const floorMat = new THREE.MeshStandardMaterial({
            map: woodTex,
            roughness: 0.6,
            metalness: 0.1
        });
        const floorGeo = new THREE.PlaneGeometry(7.0, 7.0);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, 0);
        floor.receiveShadow = true;
        roomGroup.add(floor);

        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0x07090e,
            roughness: 0.95
        });
        const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 3.2, 0);
        roomGroup.add(ceiling);

        const wallTex = this.createNoiseTexture(256, 256, 'wall');
        wallTex.repeat.set(3, 2);
        const wallMat = new THREE.MeshStandardMaterial({
            map: wallTex,
            color: 0x111622,
            roughness: 0.85
        });

        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 3.2), wallMat);
        backWall.position.set(0, 1.6, 3.5);
        backWall.rotation.y = Math.PI;
        backWall.receiveShadow = true;
        roomGroup.add(backWall);

        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 3.2), wallMat);
        rightWall.position.set(3.5, 1.6, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        roomGroup.add(rightWall);

        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 3.2), wallMat);
        leftWall.position.set(-3.5, 1.6, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        roomGroup.add(leftWall);

        const winWallMat = new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.9 });
        const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.2), winWallMat);
        leftPillar.position.set(-2.7, 1.6, -3.5);
        leftPillar.castShadow = true;
        leftPillar.receiveShadow = true;
        roomGroup.add(leftPillar);

        const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.2, 0.2), winWallMat);
        rightPillar.position.set(3.0, 1.6, -3.5);
        rightPillar.castShadow = true;
        rightPillar.receiveShadow = true;
        roomGroup.add(rightPillar);

        const topPillar = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 0.2), winWallMat);
        topPillar.position.set(0.3, 3.0, -3.5);
        topPillar.castShadow = true;
        roomGroup.add(topPillar);

        const bottomPillar = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, 0.2), winWallMat);
        bottomPillar.position.set(0.3, 0.15, -3.5);
        bottomPillar.receiveShadow = true;
        roomGroup.add(bottomPillar);

        const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x1a1d24, metalness: 0.8, roughness: 0.3 });
        const winDivider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.6, 0.1), windowFrameMat);
        winDivider.position.set(0.3, 1.5, -3.48);
        winDivider.castShadow = true;
        roomGroup.add(winDivider);

        const winGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88bbff,
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.85,
            ior: 1.5
        });
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.6), winGlassMat);
        glass.position.set(0.3, 1.5, -3.47);
        roomGroup.add(glass);

        this.buildBed(roomGroup);
        this.buildDeskSetup(roomGroup);
        this.buildDecorations(roomGroup);

        this.scene.add(roomGroup);
    }

    buildBed(parent) {
        const bedGroup = new THREE.Group();
        bedGroup.position.set(2.1, 0, 0.2);

        const frameMat = new THREE.MeshStandardMaterial({ color: 0x18141c, roughness: 0.7 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 2.6), frameMat);
        frame.position.set(0, 0.15, 0);
        frame.castShadow = true;
        frame.receiveShadow = true;
        bedGroup.add(frame);

        const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 0.15), frameMat);
        headboard.position.set(0, 0.75, 1.25);
        headboard.castShadow = true;
        bedGroup.add(headboard);

        const mattressMat = new THREE.MeshStandardMaterial({ color: 0x1f2638, roughness: 0.9 });
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.35, 2.4), mattressMat);
        mattress.position.set(0, 0.45, -0.05);
        mattress.castShadow = true;
        mattress.receiveShadow = true;
        bedGroup.add(mattress);

        const duvetMat = new THREE.MeshStandardMaterial({ color: 0x121724, roughness: 0.85 });
        const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.2, 1.6), duvetMat);
        duvet.position.set(0, 0.58, -0.4);
        duvet.castShadow = true;
        duvet.receiveShadow = true;
        bedGroup.add(duvet);

        const pillowMat = new THREE.MeshStandardMaterial({ color: 0x222a3d, roughness: 0.9 });
        const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.45), pillowMat);
        pillow1.position.set(-0.45, 0.68, 0.85);
        pillow1.rotation.x = 0.15;
        pillow1.castShadow = true;
        bedGroup.add(pillow1);

        const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.45), pillowMat);
        pillow2.position.set(0.45, 0.68, 0.85);
        pillow2.rotation.x = 0.15;
        pillow2.castShadow = true;
        bedGroup.add(pillow2);

        parent.add(bedGroup);
    }

    buildDeskSetup(parent) {
        const deskGroup = new THREE.Group();
        deskGroup.position.set(-0.95, 0, -2.1);

        const deskMat = new THREE.MeshStandardMaterial({ color: 0x0f1118, roughness: 0.4, metalness: 0.2 });
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.9), deskMat);
        top.position.set(0, 0.75, 0);
        top.castShadow = true;
        top.receiveShadow = true;
        deskGroup.add(top);

        const legMat = new THREE.MeshStandardMaterial({ color: 0x08090d, metalness: 0.8, roughness: 0.3 });
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.8), legMat);
        leg1.position.set(-0.88, 0.375, 0);
        leg1.castShadow = true;
        deskGroup.add(leg1);

        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.8), legMat);
        leg2.position.set(0.88, 0.375, 0);
        leg2.castShadow = true;
        deskGroup.add(leg2);

        const padMat = new THREE.MeshStandardMaterial({ color: 0x090b10, roughness: 0.95 });
        const mousePad = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.005, 0.45), padMat);
        mousePad.position.set(0, 0.783, 0.08);
        mousePad.receiveShadow = true;
        deskGroup.add(mousePad);

        const kbMat = new THREE.MeshStandardMaterial({
            color: 0x12151f,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.18,
            roughness: 0.5
        });
        const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.015, 0.15), kbMat);
        keyboard.position.set(-0.08, 0.79, 0.12);
        keyboard.castShadow = true;
        deskGroup.add(keyboard);

        const mouseMat = new THREE.MeshStandardMaterial({ color: 0x181c29, roughness: 0.4 });
        const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.11), mouseMat);
        mouse.position.set(0.32, 0.79, 0.12);
        mouse.castShadow = true;
        deskGroup.add(mouse);

        const monStand = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.2), legMat);
        monStand.position.set(0, 0.79, -0.22);
        deskGroup.add(monStand);

        const monPole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.05), legMat);
        monPole.position.set(0, 0.95, -0.22);
        monPole.castShadow = true;
        deskGroup.add(monPole);

        const monFrameMat = new THREE.MeshStandardMaterial({ color: 0x0a0c12, metalness: 0.5, roughness: 0.5 });
        const monBezel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.48, 0.03), monFrameMat);
        monBezel.position.set(0, 1.22, -0.2);
        monBezel.castShadow = true;
        deskGroup.add(monBezel);

        const screenMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.95
        });
        this.screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.11, 0.44), screenMat);
        this.screenMesh.position.set(0, 1.22, -0.184);
        deskGroup.add(this.screenMesh);

        const pcCaseMat = new THREE.MeshStandardMaterial({ color: 0x08090d, roughness: 0.3, metalness: 0.7 });
        const pcCase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 0.46), pcCaseMat);
        pcCase.position.set(0.68, 0.23, 0.1);
        pcCase.castShadow = true;
        deskGroup.add(pcCase);

        this.chairGroup = new THREE.Group();
        this.chairGroup.position.set(0, 0, this.chairDefaultZ);

        const chairSeatMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.7 });
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.5), chairSeatMat);
        seat.position.set(0, 0.5, 0);
        seat.castShadow = true;
        this.chairGroup.add(seat);

        const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.06), chairSeatMat);
        backrest.position.set(0, 0.84, 0.24);
        backrest.rotation.x = -0.08;
        backrest.castShadow = true;
        this.chairGroup.add(backrest);

        const chairPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 8), legMat);
        chairPole.position.set(0, 0.23, 0);
        chairPole.castShadow = true;
        this.chairGroup.add(chairPole);

        const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 5), legMat);
        chairBase.position.set(0, 0.03, 0);
        this.chairGroup.add(chairBase);

        deskGroup.add(this.chairGroup);
        parent.add(deskGroup);
    }

    buildDecorations(parent) {
        const mugMat = new THREE.MeshStandardMaterial({ color: 0x222b3d, roughness: 0.5 });
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 12), mugMat);
        mug.position.set(-1.55, 0.8, -2.1);
        mug.castShadow = true;
        parent.add(mug);

        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x11141c, roughness: 0.7 });
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.24), shelfMat);
        shelf.position.set(-0.95, 2.2, -3.38);
        shelf.castShadow = true;
        parent.add(shelf);

        const plantPotMat = new THREE.MeshStandardMaterial({ color: 0x1b202e, roughness: 0.8 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.1, 10), plantPotMat);
        pot.position.set(-1.4, 2.27, -3.38);
        parent.add(pot);

        const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b3b2b, roughness: 0.6 });
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 1), leafMat);
        leaves.position.set(-1.4, 2.36, -3.38);
        parent.add(leaves);
    }

    createBuildingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#060810';
        ctx.fillRect(0, 0, 128, 256);

        const rows = 28;
        const cols = 8;
        const wWin = 8;
        const hWin = 5;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() < 0.28) {
                    const tint = Math.random();
                    if (tint < 0.6) {
                        ctx.fillStyle = 'rgba(255, 220, 130, 0.85)';
                    } else if (tint < 0.85) {
                        ctx.fillStyle = 'rgba(150, 220, 255, 0.9)';
                    } else {
                        ctx.fillStyle = 'rgba(255, 120, 100, 0.75)';
                    }
                } else {
                    ctx.fillStyle = 'rgba(10, 15, 28, 0.95)';
                }
                ctx.fillRect(8 + c * 14, 8 + r * 8.5, wWin, hWin);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    buildCity() {
        const cityGroup = new THREE.Group();
        cityGroup.position.set(0, -30, -35);

        const bTex = this.createBuildingTexture();

        const buildingGeos = [
            new THREE.BoxGeometry(6, 45, 6),
            new THREE.BoxGeometry(8, 65, 8),
            new THREE.BoxGeometry(5, 35, 5),
            new THREE.BoxGeometry(10, 80, 10),
            new THREE.BoxGeometry(7, 55, 7)
        ];

        const bMat = new THREE.MeshStandardMaterial({
            map: bTex,
            roughness: 0.3,
            metalness: 0.6
        });

        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });

        for (let x = -80; x <= 80; x += 9) {
            for (let z = -70; z <= 15; z += 11) {
                if (Math.abs(x) < 5 && z > 0) continue;

                const geo = buildingGeos[Math.floor(Math.random() * buildingGeos.length)];
                const mesh = new THREE.Mesh(geo, bMat);

                const jitterX = (Math.random() - 0.5) * 4;
                const jitterZ = (Math.random() - 0.5) * 4;
                const heightY = geo.parameters.height / 2 + (Math.random() * 10 - 5);

                mesh.position.set(x + jitterX, heightY, z + jitterZ);
                cityGroup.add(mesh);

                if (geo.parameters.height >= 55) {
                    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), beaconMat.clone());
                    beacon.position.set(x + jitterX, geo.parameters.height + heightY - 22, z + jitterZ);
                    cityGroup.add(beacon);
                    this.beaconLights.push(beacon);
                }
            }
        }

        const moonGeo = new THREE.SphereGeometry(3.5, 32, 32);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xe6f0ff });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.position.set(35, 75, -120);
        cityGroup.add(moon);

        const moonGlowGeo = new THREE.SphereGeometry(5.2, 16, 16);
        const moonGlowMat = new THREE.MeshBasicMaterial({
            color: 0x88b0ff,
            transparent: true,
            opacity: 0.25,
            side: THREE.BackSide
        });
        const moonGlow = new THREE.Mesh(moonGlowGeo, moonGlowMat);
        moonGlow.position.copy(moon.position);
        cityGroup.add(moonGlow);

        const starsGeo = new THREE.BufferGeometry();
        const starCount = 600;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            starPos[i] = (Math.random() - 0.5) * 400;
            starPos[i + 1] = 30 + Math.random() * 150;
            starPos[i + 2] = -50 - Math.random() * 250;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.8 });
        const starPoints = new THREE.Points(starsGeo, starsMat);
        cityGroup.add(starPoints);

        this.scene.add(cityGroup);
    }

    buildDustParticles() {
        const pCount = 800;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(pCount * 3);

        for (let i = 0; i < pCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 40;
            positions[i + 1] = Math.random() * 24 - 2;
            positions[i + 2] = -3.8 - Math.random() * 45;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xdae8fc,
            size: 0.09,
            transparent: true,
            opacity: 0.75
        });

        this.dustParticles = new THREE.Points(geo, mat);
        this.scene.add(this.dustParticles);
    }

    bindEvents() {
        window.addEventListener('resize', () => this.onResize());

        const handlePointerDown = (e) => {
            if (this.state === 'walk') {
                this.isMouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                if (!this.isPointerLocked && this.container.requestPointerLock) {
                    try {
                        this.container.requestPointerLock();
                    } catch (err) {}
                }
                if (window.soundEngine) window.soundEngine.init();
            }
        };

        window.addEventListener('mousedown', handlePointerDown);

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.container;
            const hint = document.getElementById('room-controls-hint');
            if (hint) {
                hint.classList.toggle('active-mode', this.isPointerLocked);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.state === 'walk') {
                const sensitivity = 0.0024;
                if (this.isPointerLocked) {
                    this.player.yaw -= e.movementX * sensitivity;
                    this.player.pitch -= e.movementY * sensitivity;
                } else if (this.isMouseDown) {
                    const dx = e.clientX - this.lastMouseX;
                    const dy = e.clientY - this.lastMouseY;
                    this.lastMouseX = e.clientX;
                    this.lastMouseY = e.clientY;
                    this.player.yaw -= dx * sensitivity;
                    this.player.pitch -= dy * sensitivity;
                }
                this.player.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.player.pitch));
            }
        });

        const handleKeyDown = (e) => {
            if (this.state === 'walk') {
                const key = e.key.toLowerCase();
                const code = e.code;
                if (key === 'w' || code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
                if (key === 's' || code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
                if (key === 'a' || code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
                if (key === 'd' || code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;

                if (key === 'e' || code === 'KeyE') {
                    const distToDesk = this.player.pos.distanceTo(new THREE.Vector3(-0.95, 1.65, -1.45));
                    if (distToDesk < 2.6) {
                        this.startSitAnimation();
                    }
                }
            } else if (this.state === 'pc') {
                if (e.key === 'Escape') {
                    this.startStandAnimation();
                }
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            const code = e.code;
            if (key === 'w' || code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
            if (key === 's' || code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
            if (key === 'a' || code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
            if (key === 'd' || code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const btnSit = document.getElementById('btn-interact-pc');
        if (btnSit) {
            btnSit.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.state === 'walk') {
                    this.startSitAnimation();
                }
            });
        }

        const btnLeave = document.getElementById('btn-leave-pc');
        if (btnLeave) {
            btnLeave.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.state === 'pc') {
                    this.startStandAnimation();
                }
            });
        }

        const btnRoomGfx = document.getElementById('btn-room-graphics');
        if (btnRoomGfx) {
            btnRoomGfx.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cycleGraphicsQuality();
                if (window.soundEngine) window.soundEngine.playClick();
            });
        }

        const btnDeskGfx = document.getElementById('btn-desktop-graphics');
        if (btnDeskGfx) {
            btnDeskGfx.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cycleGraphicsQuality();
                if (window.soundEngine) window.soundEngine.playClick();
            });
        }
    }

    startSitAnimation() {
        if (this.state !== 'walk') return;
        this.state = 'sitting_down';
        this.transitionProgress = 0;
        this.transitionStartPos.copy(this.player.pos);

        const lookDir = new THREE.Vector3(
            -Math.sin(this.player.yaw) * Math.cos(this.player.pitch),
            Math.sin(this.player.pitch),
            -Math.cos(this.player.yaw) * Math.cos(this.player.pitch)
        );
        this.transitionStartTarget.copy(this.player.pos).add(lookDir);

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        const promptEl = document.getElementById('room-interaction-prompt');
        if (promptEl) promptEl.classList.add('hidden');
        const roomHud = document.getElementById('room-hud');
        if (roomHud) roomHud.classList.add('hidden');
        const reticle = document.getElementById('reticle');
        if (reticle) reticle.classList.add('hidden');

        if (window.soundEngine) {
            window.soundEngine.init();
            window.soundEngine.playClick();
        }
    }

    startStandAnimation() {
        if (this.state !== 'pc') return;
        this.state = 'standing_up';
        this.transitionProgress = 0;

        const desktopOverlay = document.getElementById('desktop-terminal-container');
        if (desktopOverlay) desktopOverlay.classList.add('hidden');

        if (window.soundEngine) {
            window.soundEngine.playClick();
        }
    }

    updateCameraFromPlayer() {
        const bobOffset = Math.sin(this.player.bobTimer) * 0.035;
        this.camera.position.set(
            this.player.pos.x,
            this.player.pos.y + bobOffset,
            this.player.pos.z
        );

        const lookTarget = new THREE.Vector3(
            this.player.pos.x - Math.sin(this.player.yaw) * Math.cos(this.player.pitch),
            this.player.pos.y + bobOffset + Math.sin(this.player.pitch),
            this.player.pos.z - Math.cos(this.player.yaw) * Math.cos(this.player.pitch)
        );

        this.camera.lookAt(lookTarget);
    }

    updatePlayerMovement(delta) {
        let moveX = 0;
        let moveZ = 0;

        if (this.keys.forward) moveZ += 1;
        if (this.keys.backward) moveZ -= 1;
        if (this.keys.left) moveX -= 1;
        if (this.keys.right) moveX += 1;

        this.player.isWalking = (moveX !== 0 || moveZ !== 0);

        if (this.player.isWalking) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;

            const sin = Math.sin(this.player.yaw);
            const cos = Math.cos(this.player.yaw);

            const dx = (moveX * cos - moveZ * sin) * this.player.speed * delta;
            const dz = (-moveX * sin - moveZ * cos) * this.player.speed * delta;

            const nextX = this.player.pos.x + dx;
            const nextZ = this.player.pos.z + dz;

            if (nextX >= -2.8 && nextX <= 2.8) {
                if (!(nextX > 0.6 && nextX < 3.3 && nextZ > -1.6 && nextZ < 1.9) &&
                    !(nextX < -0.1 && nextX > -2.2 && nextZ < -1.4 && nextZ > -3.3)) {
                    this.player.pos.x = nextX;
                }
            }

            if (nextZ >= -2.8 && nextZ <= 2.8) {
                if (!(this.player.pos.x > 0.6 && this.player.pos.x < 3.3 && nextZ > -1.6 && nextZ < 1.9) &&
                    !(this.player.pos.x < -0.1 && this.player.pos.x > -2.2 && nextZ < -1.4 && nextZ > -3.3)) {
                    this.player.pos.z = nextZ;
                }
            }

            this.player.bobTimer += delta * 10;
        } else {
            this.player.bobTimer = 0;
        }

        const distToDesk = this.player.pos.distanceTo(new THREE.Vector3(-0.95, 1.65, -1.45));
        const promptEl = document.getElementById('room-interaction-prompt');
        if (promptEl) {
            if (distToDesk < 2.5) {
                promptEl.classList.remove('hidden');
            } else {
                promptEl.classList.add('hidden');
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();

        if (this.state === 'walk') {
            this.updatePlayerMovement(delta);
            this.updateCameraFromPlayer();
        } else if (this.state === 'sitting_down') {
            this.transitionProgress += delta / this.transitionDuration;
            const t = Math.min(1.0, this.transitionProgress);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const targetPos = new THREE.Vector3(-0.95, 1.24, -1.55);
            const targetLook = new THREE.Vector3(-0.95, 1.22, -2.28);

            this.camera.position.lerpVectors(this.transitionStartPos, targetPos, ease);
            const curLook = new THREE.Vector3().lerpVectors(this.transitionStartTarget, targetLook, ease);
            this.camera.lookAt(curLook);

            if (this.chairGroup) {
                this.chairCurrentZ = THREE.MathUtils.lerp(this.chairDefaultZ, 0.48, ease);
                this.chairGroup.position.z = this.chairCurrentZ;
            }

            if (t >= 1.0) {
                this.state = 'pc';
                const desktopOverlay = document.getElementById('desktop-terminal-container');
                if (desktopOverlay) desktopOverlay.classList.remove('hidden');
            }
        } else if (this.state === 'standing_up') {
            this.transitionProgress += delta / (this.transitionDuration * 0.85);
            const t = Math.min(1.0, this.transitionProgress);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const seatedPos = new THREE.Vector3(-0.95, 1.24, -1.55);
            const standingPos = new THREE.Vector3(-0.95, 1.65, -0.6);
            const seatedLook = new THREE.Vector3(-0.95, 1.22, -2.28);
            const standingLook = new THREE.Vector3(-0.95, 1.6, -2.5);

            this.camera.position.lerpVectors(seatedPos, standingPos, ease);
            const curLook = new THREE.Vector3().lerpVectors(seatedLook, standingLook, ease);
            this.camera.lookAt(curLook);

            if (this.chairGroup) {
                this.chairCurrentZ = THREE.MathUtils.lerp(0.48, this.chairDefaultZ, ease);
                this.chairGroup.position.z = this.chairCurrentZ;
            }

            if (t >= 1.0) {
                this.state = 'walk';
                this.player.pos.copy(standingPos);
                this.player.yaw = 0.0;
                this.player.pitch = -0.05;
                const roomHud = document.getElementById('room-hud');
                if (roomHud) roomHud.classList.remove('hidden');
                const reticle = document.getElementById('reticle');
                if (reticle) reticle.classList.remove('hidden');
            }
        }

        if (this.dustParticles) {
            const positions = this.dustParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= delta * (0.8 + (i % 7) * 0.15);
                positions[i] += Math.sin(time + i) * delta * 0.15;
                if (positions[i + 1] < -2.0) {
                    positions[i + 1] = 22.0;
                    positions[i] = (Math.random() - 0.5) * 40;
                }
            }
            this.dustParticles.geometry.attributes.position.needsUpdate = true;
        }

        const beaconFlash = (Math.sin(time * 3.5) + 1) / 2;
        this.beaconLights.forEach(b => {
            b.material.opacity = beaconFlash > 0.6 ? 1.0 : 0.15;
            b.material.transparent = true;
        });

        if (this.screenLight) {
            this.screenLight.intensity = 1.2 + Math.sin(time * 2.0) * 0.15;
        }

        this.renderer.render(this.scene, this.camera);
    }

    setGraphicsQuality(level) {
        this.graphicsQuality = level;
        try {
            localStorage.setItem('night_trader_graphics', level);
        } catch (e) {}

        const w = window.innerWidth;
        const h = window.innerHeight;

        if (level === 'low') {
            this.renderer.setPixelRatio(0.75);
            this.renderer.shadowMap.enabled = false;
            if (this.dustParticles) this.dustParticles.visible = false;
            if (this.moonLight) this.moonLight.castShadow = false;
        } else if (level === 'medium') {
            this.renderer.setPixelRatio(1.0);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.BasicShadowMap;
            if (this.dustParticles) {
                this.dustParticles.visible = true;
                this.dustParticles.geometry.setDrawRange(0, 250);
            }
            if (this.moonLight) this.moonLight.castShadow = true;
        } else {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            if (this.dustParticles) {
                this.dustParticles.visible = true;
                this.dustParticles.geometry.setDrawRange(0, 800);
            }
            if (this.moonLight) this.moonLight.castShadow = true;
        }

        this.renderer.setSize(w, h);
        this.updateGraphicsUI();
    }

    cycleGraphicsQuality() {
        if (this.graphicsQuality === 'high') {
            this.setGraphicsQuality('medium');
        } else if (this.graphicsQuality === 'medium') {
            this.setGraphicsQuality('low');
        } else {
            this.setGraphicsQuality('high');
        }
    }

    updateGraphicsUI() {
        const labelMap = {
            high: 'ALTO',
            medium: 'MÉDIO',
            low: 'BAIXO'
        };
        const text = `GRAFICOS: ${labelMap[this.graphicsQuality] || 'ALTO'}`;
        const roomBtn = document.getElementById('btn-room-graphics');
        if (roomBtn) roomBtn.textContent = text;
        const deskBtn = document.getElementById('btn-desktop-graphics');
        if (deskBtn) deskBtn.textContent = text;

        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.toggle('active', card.dataset.preset === this.graphicsQuality);
        });
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
}

window.RoomScene = RoomScene;
