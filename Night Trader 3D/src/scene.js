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

        this.miningRigGroup = null;
        this.ashtrayGroup = null;
        this.whiskyGroup = null;
        this.rigFanMeshes = [];
        this.smokeParticles = null;
        this.smokeTimer = 0;

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
        const ambientLight = new THREE.AmbientLight(0x0c1322, 0.75);
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

        const floorLampLight = new THREE.PointLight(0x9ec5ff, 0.65, 4.5);
        floorLampLight.position.set(-2.8, 1.85, 2.4);
        this.scene.add(floorLampLight);

        const bedLampLight = new THREE.PointLight(0x6da4e8, 0.35, 2.5);
        bedLampLight.position.set(0.85, 0.75, 1.25);
        this.scene.add(bedLampLight);

        const artSpotLight = new THREE.PointLight(0x7cb5ec, 0.45, 3.5);
        artSpotLight.position.set(-3.2, 2.4, -0.2);
        this.scene.add(artSpotLight);

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
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.9), deskMat);
        top.position.set(0, 0.75, 0);
        top.castShadow = true;
        top.receiveShadow = true;
        deskGroup.add(top);

        const legMat = new THREE.MeshStandardMaterial({ color: 0x08090d, metalness: 0.8, roughness: 0.3 });
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.8), legMat);
        leg1.position.set(-0.98, 0.375, 0);
        leg1.castShadow = true;
        deskGroup.add(leg1);

        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.8), legMat);
        leg2.position.set(0.98, 0.375, 0);
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
        const monBezel = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.80, 0.03), monFrameMat);
        monBezel.position.set(0, 1.22, -0.2);
        monBezel.castShadow = true;
        deskGroup.add(monBezel);

        const screenTexture = this.createScreenTexture();
        const screenMat = new THREE.MeshBasicMaterial({
            map: screenTexture
        });
        this.screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.76), screenMat);
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
        this.buildWallArt(parent);
        this.buildRugs(parent);
        this.buildNightstand(parent);
        this.buildLoungeCorner(parent);
        this.buildWallShelving(parent);
        this.buildDeskMonitorsAndExtras(parent);
        this.buildArchitecturalLighting(parent);
        this.buildDynamicAccessories(parent);
    }

    buildDynamicAccessories(parent) {
        this.buildMiningRig(parent);
        this.buildAshtrayAndSmoke(parent);
        this.buildWhiskyBar(parent);
        this.updateRoomAccessories();
    }

    buildMiningRig(parent) {
        this.miningRigGroup = new THREE.Group();
        this.miningRigGroup.position.set(-2.5, 0, -1.8);
        this.miningRigGroup.rotation.y = Math.PI * 0.15;

        const frameMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.9, roughness: 0.2 });
        const psuMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, metalness: 0.8, roughness: 0.3 });
        const gpuBodyMat = new THREE.MeshStandardMaterial({ color: 0x182030, metalness: 0.7, roughness: 0.4 });
        const heatsinkMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.2 });
        const rgbMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

        const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.02), frameMat);
        bar1.position.set(0, 0.02, -0.18);
        this.miningRigGroup.add(bar1);
        const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.02), frameMat);
        bar2.position.set(0, 0.02, 0.18);
        this.miningRigGroup.add(bar2);

        const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.02), frameMat);
        bar3.position.set(0, 0.45, -0.18);
        this.miningRigGroup.add(bar3);
        const bar4 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.02), frameMat);
        bar4.position.set(0, 0.45, 0.18);
        this.miningRigGroup.add(bar4);

        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.52, 0.02), frameMat);
            leg.position.set((i % 2 === 0 ? -0.39 : 0.39), 0.26, (i < 2 ? -0.18 : 0.18));
            leg.castShadow = true;
            this.miningRigGroup.add(leg);
        }

        const psu = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.24), psuMat);
        psu.position.set(-0.25, 0.08, 0);
        psu.castShadow = true;
        this.miningRigGroup.add(psu);

        for (let g = 0; g < 4; g++) {
            const gpuGroup = new THREE.Group();
            gpuGroup.position.set(-0.28 + g * 0.18, 0.36, 0);

            const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.34), gpuBodyMat);
            pcb.castShadow = true;
            gpuGroup.add(pcb);

            const heatsink = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.32), heatsinkMat);
            heatsink.position.set(0.02, -0.01, 0);
            gpuGroup.add(heatsink);

            const fan1 = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16), rgbMat);
            fan1.position.set(0.04, 0, -0.075);
            fan1.rotation.y = Math.PI / 2;
            gpuGroup.add(fan1);
            this.rigFanMeshes.push(fan1);

            const fan2 = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16), rgbMat);
            fan2.position.set(0.04, 0, 0.075);
            fan2.rotation.y = Math.PI / 2;
            gpuGroup.add(fan2);
            this.rigFanMeshes.push(fan2);

            this.miningRigGroup.add(gpuGroup);
        }

        this.miningRigLight = new THREE.PointLight(0x00e5ff, 0.8, 2.5);
        this.miningRigLight.position.set(0, 0.4, 0);
        this.miningRigGroup.add(this.miningRigLight);

        this.miningRigGroup.visible = false;
        parent.add(this.miningRigGroup);
    }

    buildAshtrayAndSmoke(parent) {
        this.ashtrayGroup = new THREE.Group();
        this.ashtrayGroup.position.set(-1.42, 0.78, -2.15);

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x111622,
            metalness: 0.1,
            roughness: 0.2,
            transparent: true,
            opacity: 0.85
        });

        const ashtrayDish = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.022, 16), glassMat);
        ashtrayDish.position.y = 0.011;
        ashtrayDish.castShadow = true;
        this.ashtrayGroup.add(ashtrayDish);

        const cigMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        const cigFilterMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
        const cigEmberMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });

        const cig = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.045, 8), cigMat);
        cig.position.set(0.01, 0.018, 0);
        cig.rotation.z = Math.PI * 0.46;
        this.ashtrayGroup.add(cig);

        const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0036, 0.012, 8), cigFilterMat);
        filter.position.set(0.028, 0.02, 0);
        filter.rotation.z = Math.PI * 0.46;
        this.ashtrayGroup.add(filter);

        const ember = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), cigEmberMat);
        ember.position.set(-0.014, 0.016, 0);
        this.ashtrayGroup.add(ember);

        const smokeGeo = new THREE.BufferGeometry();
        const smokeCount = 45;
        const smokePositions = new Float32Array(smokeCount * 3);
        for (let i = 0; i < smokeCount; i++) {
            smokePositions[i * 3] = -1.43 + (Math.random() - 0.5) * 0.02;
            smokePositions[i * 3 + 1] = 0.81 + (i / smokeCount) * 0.45;
            smokePositions[i * 3 + 2] = -2.15 + (Math.random() - 0.5) * 0.02;
        }
        smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
        const smokeMat = new THREE.PointsMaterial({
            color: 0x94a3b8,
            size: 0.025,
            transparent: true,
            opacity: 0.4
        });
        this.smokeParticles = new THREE.Points(smokeGeo, smokeMat);
        this.smokeParticles.visible = false;
        parent.add(this.smokeParticles);

        this.ashtrayGroup.visible = false;
        parent.add(this.ashtrayGroup);
    }

    buildWhiskyBar(parent) {
        this.whiskyGroup = new THREE.Group();
        this.whiskyGroup.position.set(-0.48, 0.78, -2.42);

        const bottleGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0x1c1208,
            metalness: 0.1,
            roughness: 0.15,
            transparent: true,
            opacity: 0.88
        });
        const amberMat = new THREE.MeshStandardMaterial({
            color: 0xb45309,
            emissive: 0x78350f,
            emissiveIntensity: 0.3,
            roughness: 0.2
        });

        const bottle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07), bottleGlassMat);
        bottle.position.y = 0.1;
        bottle.castShadow = true;
        this.whiskyGroup.add(bottle);

        const bottleNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 10), bottleGlassMat);
        bottleNeck.position.y = 0.23;
        this.whiskyGroup.add(bottleNeck);

        const labelMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.8 });
        const label = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.07), labelMat);
        label.position.set(0, 0.1, 0.036);
        this.whiskyGroup.add(label);

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x182030,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1
        });
        const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 12), glassMat);
        glass.position.set(0.12, 0.035, 0.02);
        glass.castShadow = true;
        this.whiskyGroup.add(glass);

        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.035, 12), amberMat);
        liquid.position.set(0.12, 0.02, 0.02);
        this.whiskyGroup.add(liquid);

        this.whiskyGroup.visible = false;
        parent.add(this.whiskyGroup);
    }

    updateRoomAccessories() {
        const inv = window.storeEngine ? window.storeEngine.inventory : {};
        const hasGpu = (inv.gpu_1660 || inv.gpu_3070 || inv.gpu_4090 || inv.asic_s19 || inv.rig_frame);
        if (this.miningRigGroup) {
            this.miningRigGroup.visible = !!hasGpu;
        }

        const hasCig = (inv.cigarettes || inv.ashtray || inv.zippo);
        if (this.ashtrayGroup) {
            this.ashtrayGroup.visible = !!hasCig;
        }

        const hasWhisky = (inv.whisky || inv.whisky_glass);
        if (this.whiskyGroup) {
            this.whiskyGroup.visible = !!hasWhisky;
        }
    }

    onSmokeTriggered() {
        this.smokeTimer = 15.0;
        if (this.smokeParticles) this.smokeParticles.visible = true;
    }

    createArtTexture(type) {
        const canvas = document.createElement('canvas');
        if (type === 'main_abstract') {
            canvas.width = 512;
            canvas.height = 320;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 512, 320);
            grad.addColorStop(0, '#060911');
            grad.addColorStop(0.5, '#0b1322');
            grad.addColorStop(1, '#080d18');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 320);

            ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
            ctx.lineWidth = 1;
            for (let x = 0; x < 512; x += 32) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 320);
                ctx.stroke();
            }
            for (let y = 0; y < 320; y += 32) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(512, y);
                ctx.stroke();
            }

            ctx.fillStyle = '#111e33';
            ctx.beginPath();
            ctx.moveTo(80, 280);
            ctx.lineTo(240, 40);
            ctx.lineTo(360, 180);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(0, 180, 216, 0.25)';
            ctx.beginPath();
            ctx.moveTo(180, 290);
            ctx.lineTo(320, 90);
            ctx.lineTo(440, 260);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(40, 240);
            ctx.lineTo(240, 40);
            ctx.lineTo(470, 270);
            ctx.stroke();

            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(120, 40);
            ctx.lineTo(440, 40);
            ctx.stroke();

            ctx.fillStyle = '#0a101d';
            ctx.beginPath();
            ctx.arc(360, 110, 42, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('MODERN STRUCTURE // 0.42', 40, 300);
            ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
            ctx.font = '9px monospace';
            ctx.fillText('NIGHT TRADER COLLECTION · SERIES 01', 280, 300);
        } else if (type === 'diptych_1') {
            canvas.width = 256;
            canvas.height = 384;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#060a12';
            ctx.fillRect(0, 0, 256, 384);

            for (let i = 0; i < 18; i++) {
                ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 229, 255, 0.4)' : 'rgba(148, 163, 184, 0.25)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let x = 0; x < 256; x += 4) {
                    const y = 192 + Math.sin((x + i * 16) * 0.035) * (30 + i * 4);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(24, 30, 20, 2);
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('HARMONIC FREQUENCY', 52, 34);
            ctx.fillText('01 / MODULATION', 24, 355);
        } else if (type === 'diptych_2') {
            canvas.width = 256;
            canvas.height = 384;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#070c16';
            ctx.fillRect(0, 0, 256, 384);

            const blocks = [
                { x: 35, y: 70, w: 90, h: 140, col: '#0f1d31' },
                { x: 100, y: 140, w: 120, h: 160, col: '#162842' },
                { x: 60, y: 220, w: 140, h: 80, col: '#0a1424' }
            ];
            blocks.forEach(b => {
                ctx.fillStyle = b.col;
                ctx.fillRect(b.x, b.y, b.w, b.h);
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(b.x, b.y, b.w, b.h);
            });

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(35, 70);
            ctx.lineTo(220, 300);
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(24, 30, 20, 2);
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('BRUTALIST EQUATION', 52, 34);
            ctx.fillText('02 / ELEVATION', 24, 355);
        } else if (type === 'panoramic_bed') {
            canvas.width = 512;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            const bgGrad = ctx.createLinearGradient(0, 0, 0, 180);
            bgGrad.addColorStop(0, '#04070e');
            bgGrad.addColorStop(0.6, '#0a1120');
            bgGrad.addColorStop(1, '#050912');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 512, 180);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let y = 20; y < 180; y += 20) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(512, y);
                ctx.stroke();
            }

            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 110);
            ctx.lineTo(512, 110);
            ctx.stroke();

            ctx.fillStyle = '#0f1a2c';
            ctx.beginPath();
            ctx.arc(256, 110, 55, Math.PI, 0);
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('COLD HORIZON // 03:00 AM', 28, 155);
            ctx.fillStyle = '#00e5ff';
            ctx.fillText('42°19\'N · LUNAR ILLUMINATION', 300, 155);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    createRugTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0b0f17';
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = '#141c2b';
        ctx.lineWidth = 4;
        for (let i = -512; i < 1024; i += 48) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 512, 512);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i + 512, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
        }

        ctx.strokeStyle = '#1c283d';
        ctx.lineWidth = 2;
        for (let x = 32; x < 512; x += 64) {
            for (let y = 32; y < 512; y += 64) {
                ctx.strokeRect(x, y, 32, 32);
            }
        }

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, 496, 496);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    createDigitalClockTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#05070c';
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('03:42', 64, 38);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.font = '8px monospace';
        ctx.fillText('AM · NIGHT TRADER', 64, 52);
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    buildWallArt(parent) {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x080a10, metalness: 0.85, roughness: 0.2 });

        const mainArtGroup = new THREE.Group();
        mainArtGroup.position.set(-3.47, 1.7, -0.1);
        mainArtGroup.rotation.y = Math.PI / 2;

        const mainFrame = new THREE.Mesh(new THREE.BoxGeometry(1.86, 1.16, 0.04), frameMat);
        mainFrame.castShadow = true;
        mainArtGroup.add(mainFrame);

        const mainCanvasMat = new THREE.MeshStandardMaterial({
            map: this.createArtTexture('main_abstract'),
            roughness: 0.4
        });
        const mainCanvas = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), mainCanvasMat);
        mainCanvas.position.z = 0.022;
        mainArtGroup.add(mainCanvas);

        const lampRod = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, 0.12), frameMat);
        lampRod.position.set(0, 0.62, 0.06);
        mainArtGroup.add(lampRod);

        const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.03), frameMat);
        lampHead.position.set(0, 0.62, 0.12);
        mainArtGroup.add(lampHead);

        parent.add(mainArtGroup);

        const diptychGroup = new THREE.Group();
        diptychGroup.position.set(0, 1.75, 3.47);
        diptychGroup.rotation.y = Math.PI;

        const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.03), frameMat);
        f1.position.set(-1.4, 0, 0);
        f1.castShadow = true;
        diptychGroup.add(f1);

        const c1Mat = new THREE.MeshStandardMaterial({ map: this.createArtTexture('diptych_1'), roughness: 0.4 });
        const c1 = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 1.14), c1Mat);
        c1.position.set(-1.4, 0, 0.018);
        diptychGroup.add(c1);

        const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.03), frameMat);
        f2.position.set(-0.4, 0, 0);
        f2.castShadow = true;
        diptychGroup.add(f2);

        const c2Mat = new THREE.MeshStandardMaterial({ map: this.createArtTexture('diptych_2'), roughness: 0.4 });
        const c2 = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 1.14), c2Mat);
        c2.position.set(-0.4, 0, 0.018);
        diptychGroup.add(c2);

        parent.add(diptychGroup);

        const bedArtGroup = new THREE.Group();
        bedArtGroup.position.set(3.47, 2.0, 0.2);
        bedArtGroup.rotation.y = -Math.PI / 2;

        const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.66, 0.03), frameMat);
        bedFrame.castShadow = true;
        bedArtGroup.add(bedFrame);

        const bedCanvasMat = new THREE.MeshStandardMaterial({ map: this.createArtTexture('panoramic_bed'), roughness: 0.4 });
        const bedCanvas = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.6), bedCanvasMat);
        bedCanvas.position.z = 0.018;
        bedArtGroup.add(bedCanvas);

        parent.add(bedArtGroup);
    }

    buildRugs(parent) {
        const rugTex = this.createRugTexture();
        const mainRugMat = new THREE.MeshStandardMaterial({
            map: rugTex,
            roughness: 0.88,
            metalness: 0.05
        });
        const mainRug = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.2), mainRugMat);
        mainRug.rotation.x = -Math.PI / 2;
        mainRug.position.set(1.1, 0.005, 0.4);
        mainRug.receiveShadow = true;
        parent.add(mainRug);

        const deskRugMat = new THREE.MeshStandardMaterial({
            color: 0x080b12,
            roughness: 0.95
        });
        const deskRug = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), deskRugMat);
        deskRug.rotation.x = -Math.PI / 2;
        deskRug.position.set(-0.95, 0.006, -1.8);
        deskRug.receiveShadow = true;
        parent.add(deskRug);
    }

    buildNightstand(parent) {
        const nsGroup = new THREE.Group();
        nsGroup.position.set(0.85, 0, 1.25);

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x0c101a, roughness: 0.4, metalness: 0.2 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x08090d, metalness: 0.85, roughness: 0.25 });

        const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.45), woodMat);
        box.position.set(0, 0.31, 0);
        box.castShadow = true;
        box.receiveShadow = true;
        nsGroup.add(box);

        const legGeo = new THREE.BoxGeometry(0.025, 0.12, 0.025);
        const l1 = new THREE.Mesh(legGeo, metalMat);
        l1.position.set(-0.24, 0.06, -0.19);
        nsGroup.add(l1);
        const l2 = new THREE.Mesh(legGeo, metalMat);
        l2.position.set(0.24, 0.06, -0.19);
        nsGroup.add(l2);
        const l3 = new THREE.Mesh(legGeo, metalMat);
        l3.position.set(-0.24, 0.06, 0.19);
        nsGroup.add(l3);
        const l4 = new THREE.Mesh(legGeo, metalMat);
        l4.position.set(0.24, 0.06, 0.19);
        nsGroup.add(l4);

        const clockMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.3 });
        const clockDisplayMat = new THREE.MeshBasicMaterial({ map: this.createDigitalClockTexture() });
        const clockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.06), [
            clockMat, clockMat, clockMat, clockMat, clockDisplayMat, clockMat
        ]);
        clockMesh.position.set(-0.14, 0.53, 0.05);
        clockMesh.rotation.y = -Math.PI / 6;
        clockMesh.castShadow = true;
        nsGroup.add(clockMesh);

        const bookMat1 = new THREE.MeshStandardMaterial({ color: 0x121b2d, roughness: 0.7 });
        const bookMat2 = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.28), bookMat1);
        book1.position.set(0.12, 0.515, -0.04);
        book1.rotation.y = 0.1;
        book1.castShadow = true;
        nsGroup.add(book1);
        const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.26), bookMat2);
        book2.position.set(0.12, 0.542, -0.04);
        book2.rotation.y = 0.04;
        book2.castShadow = true;
        nsGroup.add(book2);

        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 12), metalMat);
        lampBase.position.set(0.08, 0.51, 0.12);
        nsGroup.add(lampBase);

        const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.28, 8), metalMat);
        lampStem.position.set(0.08, 0.65, 0.12);
        nsGroup.add(lampStem);

        const shadeMat = new THREE.MeshStandardMaterial({
            color: 0x131d2e,
            roughness: 0.5,
            emissive: 0x6da4e8,
            emissiveIntensity: 0.15
        });
        const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.14, 12), shadeMat);
        lampShade.position.set(0.08, 0.76, 0.12);
        lampShade.castShadow = true;
        nsGroup.add(lampShade);

        parent.add(nsGroup);
    }

    buildLoungeCorner(parent) {
        const loungeGroup = new THREE.Group();
        loungeGroup.position.set(-2.4, 0, 1.8);
        loungeGroup.rotation.y = Math.PI * 0.28;

        const frameMat = new THREE.MeshStandardMaterial({ color: 0x08090d, metalness: 0.9, roughness: 0.2 });
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.65 });
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0x13243d, roughness: 0.85 });

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 0.68), leatherMat);
        seat.position.set(0, 0.38, 0);
        seat.castShadow = true;
        loungeGroup.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.6, 0.1), leatherMat);
        back.position.set(0, 0.66, 0.32);
        back.rotation.x = -0.12;
        back.castShadow = true;
        loungeGroup.add(back);

        const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.12), pillowMat);
        pillow.position.set(0, 0.52, 0.24);
        pillow.rotation.x = 0.1;
        pillow.castShadow = true;
        loungeGroup.add(pillow);

        const legGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8);
        const l1 = new THREE.Mesh(legGeo, frameMat);
        l1.position.set(-0.3, 0.17, -0.3);
        l1.castShadow = true;
        loungeGroup.add(l1);
        const l2 = new THREE.Mesh(legGeo, frameMat);
        l2.position.set(0.3, 0.17, -0.3);
        l2.castShadow = true;
        loungeGroup.add(l2);
        const l3 = new THREE.Mesh(legGeo, frameMat);
        l3.position.set(-0.3, 0.17, 0.3);
        l3.castShadow = true;
        loungeGroup.add(l3);
        const l4 = new THREE.Mesh(legGeo, frameMat);
        l4.position.set(0.3, 0.17, 0.3);
        l4.castShadow = true;
        loungeGroup.add(l4);

        parent.add(loungeGroup);

        const tableGroup = new THREE.Group();
        tableGroup.position.set(-1.55, 0, 1.85);

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x141f30,
            metalness: 0.1,
            roughness: 0.15,
            transmission: 0.6,
            transparent: true,
            opacity: 0.85
        });
        const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 16), glassMat);
        tableTop.position.set(0, 0.44, 0);
        tableTop.castShadow = true;
        tableGroup.add(tableTop);

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.43, 8), frameMat);
        stem.position.set(0, 0.22, 0);
        tableGroup.add(stem);

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.015, 16), frameMat);
        base.position.set(0, 0.01, 0);
        tableGroup.add(base);

        const cupMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
        const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.11, 10), cupMat);
        tumbler.position.set(0.05, 0.505, 0.02);
        tumbler.castShadow = true;
        tableGroup.add(tumbler);

        parent.add(tableGroup);

        const lampGroup = new THREE.Group();
        lampGroup.position.set(-2.8, 0, 2.4);

        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 16), frameMat);
        lampBase.position.set(0, 0.015, 0);
        lampGroup.add(lampBase);

        const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.85, 8), frameMat);
        lampPole.position.set(0, 0.94, 0);
        lampGroup.add(lampPole);

        const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.5), frameMat);
        lampArm.position.set(0.15, 1.86, -0.2);
        lampArm.rotation.y = -Math.PI / 4;
        lampGroup.add(lampArm);

        const lampDomeMat = new THREE.MeshStandardMaterial({
            color: 0x0c111a,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x9ec5ff,
            emissiveIntensity: 0.2
        });
        const lampDome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), lampDomeMat);
        lampDome.position.set(0.3, 1.84, -0.35);
        lampDome.rotation.x = Math.PI;
        lampDome.castShadow = true;
        lampGroup.add(lampDome);

        parent.add(lampGroup);
    }

    buildWallShelving(parent) {
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x090c14, metalness: 0.75, roughness: 0.3 });

        const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 1.3), shelfMat);
        s1.position.set(-3.38, 1.45, -1.8);
        s1.castShadow = true;
        parent.add(s1);

        const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 1.3), shelfMat);
        s2.position.set(-3.38, 2.05, -1.8);
        s2.castShadow = true;
        parent.add(s2);

        const colors = [0x1e293b, 0x0f172a, 0x334155, 0x1e3a5f, 0x111827];
        for (let i = 0; i < 5; i++) {
            const bMat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.6 });
            const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.04), bMat);
            b.position.set(-3.38, 1.58, -2.25 + i * 0.045);
            b.castShadow = true;
            parent.add(b);
        }

        const sculptureMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.08 });
        const sculpture = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), sculptureMat);
        sculpture.position.set(-3.38, 1.54, -1.45);
        sculpture.rotation.set(0.4, 0.6, 0.2);
        sculpture.castShadow = true;
        parent.add(sculpture);

        const potMat = new THREE.MeshStandardMaterial({ color: 0x121722, roughness: 0.7 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.09, 12), potMat);
        pot.position.set(-3.38, 2.11, -2.15);
        pot.castShadow = true;
        parent.add(pot);

        const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b3834, roughness: 0.5 });
        const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07, 1), leafMat);
        plant.position.set(-3.38, 2.19, -2.15);
        parent.add(plant);

        const frameMini = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.12), shelfMat);
        frameMini.position.set(-3.37, 2.14, -1.55);
        frameMini.rotation.y = 0.1;
        parent.add(frameMini);
    }

    buildDeskMonitorsAndExtras(parent) {
        const spkMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.4, metalness: 0.4 });
        const coneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.7 });
        const cyanLedMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

        const createSpeaker = (x, z, rotY) => {
            const spkGroup = new THREE.Group();
            spkGroup.position.set(x, 0.78, z);
            spkGroup.rotation.y = rotY;

            const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.18), spkMat);
            box.position.y = 0.14;
            box.castShadow = true;
            spkGroup.add(box);

            const woofer = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 14), coneMat);
            woofer.position.set(0, 0.1, 0.09);
            woofer.rotation.x = Math.PI / 2;
            spkGroup.add(woofer);

            const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 12), spkMat);
            tweeter.position.set(0, 0.2, 0.09);
            tweeter.rotation.x = Math.PI / 2;
            spkGroup.add(tweeter);

            const led = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.005, 0.005), cyanLedMat);
            led.position.set(0, 0.03, 0.091);
            spkGroup.add(led);

            return spkGroup;
        };

        const leftSpk = createSpeaker(-1.75, -2.15, 0.2);
        parent.add(leftSpk);
        const rightSpk = createSpeaker(-0.15, -2.15, -0.2);
        parent.add(rightSpk);

        const mugMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.3 });
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.095, 12), mugMat);
        mug.position.set(-1.55, 0.83, -2.05);
        mug.castShadow = true;
        parent.add(mug);

        const acMat = new THREE.MeshStandardMaterial({ color: 0x121620, roughness: 0.3, metalness: 0.6 });
        const acGroup = new THREE.Group();
        acGroup.position.set(2.2, 2.85, -3.42);

        const acBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.25, 0.18), acMat);
        acBody.castShadow = true;
        acGroup.add(acBody);

        const acLed = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.006, 0.01), cyanLedMat);
        acLed.position.set(0.15, -0.06, 0.091);
        acGroup.add(acLed);

        parent.add(acGroup);
    }

    buildArchitecturalLighting(parent) {
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x172c4a });
        const strip1 = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.02, 0.02), lineMat);
        strip1.position.set(0, 3.18, 3.48);
        parent.add(strip1);

        const strip2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 6.9), lineMat);
        strip2.position.set(-3.48, 3.18, 0);
        parent.add(strip2);
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

    createScreenTexture() {
        this.screenCanvas = document.createElement('canvas');
        this.screenCanvas.width = 512;
        this.screenCanvas.height = 288;
        this.screenCtx = this.screenCanvas.getContext('2d');
        this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
        this.updateScreenCanvas();
        return this.screenTexture;
    }

    updateScreenCanvas() {
        if (!this.screenCtx) return;
        const ctx = this.screenCtx;
        const w = 512;
        const h = 288;

        ctx.fillStyle = '#060912';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#121a2c';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        ctx.fillStyle = '#0e1728';
        ctx.fillRect(0, 0, w, 26);
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('CYBER_OS v4.2 [TERMINAL ONLINE]', 10, 18);

        const asset = window.marketEngine ? window.marketEngine.getSelectedAsset() : null;
        const price = asset ? asset.currentPrice.toFixed(asset.decimals) : '64280.00';
        const name = asset ? asset.name : 'BTC / USDT';

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(name, 12, 54);

        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(price, 12, 80);

        const candles = window.marketEngine && window.marketEngine.history[window.marketEngine.selectedAssetId] ? 
            window.marketEngine.history[window.marketEngine.selectedAssetId]['1m'] : null;

        if (candles && candles.length > 0) {
            const slice = candles.slice(-24);
            let min = Infinity, max = -Infinity;
            slice.forEach(c => {
                if (c.low < min) min = c.low;
                if (c.high > max) max = c.high;
            });
            const range = (max - min) || 1;
            const chartW = 300;
            const chartH = 130;
            const startX = 190;
            const startY = 60;

            slice.forEach((c, idx) => {
                const cx = startX + (idx * (chartW / slice.length));
                const isGreen = c.close >= c.open;
                ctx.fillStyle = isGreen ? '#00e676' : '#ff3d71';
                ctx.strokeStyle = isGreen ? '#00e676' : '#ff3d71';

                const highY = startY + chartH - ((c.high - min) / range) * chartH;
                const lowY = startY + chartH - ((c.low - min) / range) * chartH;
                const openY = startY + chartH - ((c.open - min) / range) * chartH;
                const closeY = startY + chartH - ((c.close - min) / range) * chartH;

                ctx.beginPath();
                ctx.moveTo(cx + 4, highY);
                ctx.lineTo(cx + 4, lowY);
                ctx.stroke();

                const topY = Math.min(openY, closeY);
                const botY = Math.max(openY, closeY);
                ctx.fillRect(cx, topY, 8, Math.max(2, botY - topY));
            });
        }

        ctx.fillStyle = '#0b101c';
        ctx.fillRect(0, h - 24, w, 24);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText('[E] SENTAR NO COMPUTADOR', 12, h - 8);

        if (this.screenTexture) {
            this.screenTexture.needsUpdate = true;
        }
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
        if (desktopOverlay) {
            desktopOverlay.classList.add('hidden');
            desktopOverlay.classList.remove('monitor-embedded');
        }

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
            this.screenUpdateTimer = (this.screenUpdateTimer || 0) + delta;
            if (this.screenUpdateTimer > 0.4) {
                this.screenUpdateTimer = 0;
                this.updateScreenCanvas();
            }
        } else if (this.state === 'sitting_down') {
            this.transitionProgress += delta / this.transitionDuration;
            const t = Math.min(1.0, this.transitionProgress);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const targetPos = new THREE.Vector3(-0.95, 1.20, -1.48);
            const targetLook = new THREE.Vector3(-0.95, 1.20, -2.28);

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
                if (desktopOverlay) {
                    desktopOverlay.classList.remove('hidden');
                    desktopOverlay.classList.add('monitor-embedded');
                    if (window.desktopUI && window.desktopUI.chartEngine) {
                        window.desktopUI.chartEngine.resize();
                    }
                }
            }
        } else if (this.state === 'standing_up') {
            this.transitionProgress += delta / (this.transitionDuration * 0.85);
            const t = Math.min(1.0, this.transitionProgress);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const seatedPos = new THREE.Vector3(-0.95, 1.20, -1.48);
            const standingPos = new THREE.Vector3(-0.95, 1.65, -0.6);
            const seatedLook = new THREE.Vector3(-0.95, 1.20, -2.28);
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

        if (this.miningRigGroup && this.miningRigGroup.visible) {
            const isRunning = window.miningEngine ? window.miningEngine.isRunning : true;
            if (isRunning) {
                const rgbHue = (time * 0.4) % 1;
                const rgbColor = new THREE.Color().setHSL(rgbHue, 0.9, 0.55);
                this.rigFanMeshes.forEach(fan => {
                    fan.material.color = rgbColor;
                    fan.rotation.z += delta * 15;
                });
                if (this.miningRigLight) {
                    this.miningRigLight.color = rgbColor;
                    this.miningRigLight.intensity = 0.6 + Math.sin(time * 6.0) * 0.2;
                }
            }
        }

        if (this.smokeParticles && this.smokeParticles.visible) {
            if (this.smokeTimer > 0) {
                this.smokeTimer -= delta;
                const pos = this.smokeParticles.geometry.attributes.position.array;
                for (let i = 0; i < pos.length; i += 3) {
                    pos[i + 1] += delta * 0.08;
                    pos[i] += Math.sin(time * 2 + i) * delta * 0.015;
                    if (pos[i + 1] > 1.3) {
                        pos[i + 1] = 0.81;
                        pos[i] = -1.43 + (Math.random() - 0.5) * 0.02;
                    }
                }
                this.smokeParticles.geometry.attributes.position.needsUpdate = true;
            } else {
                this.smokeParticles.visible = false;
            }
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
        if (window.desktopUI && typeof window.desktopUI.updateGraphicsButtonUI === 'function') {
            window.desktopUI.updateGraphicsButtonUI(this.graphicsQuality);
        }

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
