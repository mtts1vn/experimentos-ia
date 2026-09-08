class EchoGame {
    constructor() {
        this.container = document.getElementById('viewport');
        this.blocker = document.getElementById('blocker');
        this.instructions = document.getElementById('instructions');

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.level = null;
        this.scanner = null;
        this.weaponMesh = null;

        this.energy = 100;
        this.maxEnergy = 100;
        this.energyRegen = 22;

        this.beaconsCollected = 0;
        this.totalBeacons = 3;
        this.isGameOver = false;

        this.keys = {};
        this.mouseLook = {
            yaw: 0,
            pitch: 0,
            sensitivity: 0.0022
        };
        this.isLocked = false;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.playerHeight = 1.6;
        this.isOnGround = true;

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
        this.camera.position.set(0, this.playerHeight, 0);
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.level = new EchoLevel(this.scene);
        this.scanner = new EchoScanner(this.scene, 35000);

        this.buildWeaponViewModel();
        this.setupEvents();
        this.updateHUD();

        window.addEventListener('resize', () => this.onResize());

        this.animate();
    }

    buildWeaponViewModel() {
        this.weaponGroup = new THREE.Group();

        const bodyGeom = new THREE.BoxGeometry(0.12, 0.14, 0.45);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0x11161a, wireframe: true });
        const body = new THREE.Mesh(bodyGeom, bodyMat);

        const barrelGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8);
        const barrelMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true });
        const barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.32);

        const ringGeom = new THREE.TorusGeometry(0.08, 0.012, 6, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
        this.scannerRing = new THREE.Mesh(ringGeom, ringMat);
        this.scannerRing.position.set(0, 0.02, -0.42);

        const coreGeom = new THREE.OctahedronGeometry(0.03, 0);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        this.emitterCore = new THREE.Mesh(coreGeom, coreMat);
        this.emitterCore.position.set(0, 0.02, -0.42);

        this.weaponGroup.add(body);
        this.weaponGroup.add(barrel);
        this.weaponGroup.add(this.scannerRing);
        this.weaponGroup.add(this.emitterCore);

        this.weaponGroup.traverse((child) => {
            if (child.isMesh) child.frustumCulled = false;
        });

        this.weaponGroup.position.set(0.28, -0.22, -0.55);
        this.camera.add(this.weaponGroup);
    }

    setupEvents() {
        if (this.instructions) {
            this.instructions.addEventListener('click', () => {
                this.container.requestPointerLock();
                if (window.echoAudio) window.echoAudio.ensureContext();
            });
        }

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.container) {
                this.isLocked = true;
                if (this.blocker) this.blocker.style.display = 'none';
            } else {
                this.isLocked = false;
                if (this.blocker && !this.isGameOver) this.blocker.style.display = 'flex';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isLocked) return;

            this.mouseLook.yaw -= e.movementX * this.mouseLook.sensitivity;
            this.mouseLook.pitch -= e.movementY * this.mouseLook.sensitivity;

            const maxPitch = Math.PI / 2 - 0.05;
            this.mouseLook.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.mouseLook.pitch));

            this.camera.rotation.set(0, 0, 0);
            this.camera.rotation.y = this.mouseLook.yaw;
            this.camera.rotation.x = this.mouseLook.pitch;
            this.camera.rotation.order = 'YXZ';
        });

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyQ' && this.isLocked) {
                this.triggerRadialPulse();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousedown', (e) => {
            if (!this.isLocked) return;
            if (e.button === 0) {
                this.triggerBeamShot();
            } else if (e.button === 2) {
                this.triggerRadialPulse();
            }
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());

        const btnFire = document.getElementById('mobile-fire-btn');
        if (btnFire) {
            btnFire.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerBeamShot();
            });
        }

        const btnPulse = document.getElementById('mobile-pulse-btn');
        if (btnPulse) {
            btnPulse.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerRadialPulse();
            });
        }

        const restartBtn = document.getElementById('btn-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }

    triggerBeamShot() {
        if (this.isGameOver) return;
        const cost = 12;

        if (this.energy < cost) {
            if (window.echoAudio) window.echoAudio.playEnergyEmpty();
            this.flashReticle('empty');
            return;
        }

        this.energy -= cost;
        this.updateHUD();

        if (window.echoAudio) window.echoAudio.playBeamShot();
        this.recoilWeapon();

        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);

        const dist = this.scanner.fireBeam(this.camera.position, forward, 110, this.level.colliders);

        if (dist < 40 && window.echoAudio) {
            window.echoAudio.playEchoPing(dist);
        }
    }

    triggerRadialPulse() {
        if (this.isGameOver) return;
        const cost = 38;

        if (this.energy < cost) {
            if (window.echoAudio) window.echoAudio.playEnergyEmpty();
            this.flashReticle('empty');
            return;
        }

        this.energy -= cost;
        this.updateHUD();

        if (window.echoAudio) window.echoAudio.playRadialPulse();
        this.recoilWeapon(0.12);

        this.scanner.fireRadialPulse(this.camera.position, 340, this.level.colliders);
    }

    recoilWeapon(amount = 0.06) {
        if (!this.weaponGroup) return;
        this.weaponGroup.position.z += amount;
        setTimeout(() => {
            if (this.weaponGroup) this.weaponGroup.position.z = -0.55;
        }, 120);
    }

    flashReticle(type = 'empty') {
        const ret = document.getElementById('reticle');
        if (!ret) return;
        ret.classList.add(`reticle-${type}`);
        setTimeout(() => {
            ret.classList.remove(`reticle-${type}`);
        }, 200);
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updatePlayerMovement(delta) {
        const speed = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) ? 11 : 6.5;

        this.direction.set(0, 0, 0);

        if (this.keys['KeyW'] || this.keys['ArrowUp']) this.direction.z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) this.direction.z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.direction.x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) this.direction.x += 1;

        this.direction.normalize();

        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mouseLook.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mouseLook.yaw);

        const moveVector = new THREE.Vector3();
        moveVector.addScaledVector(forward, -this.direction.z);
        moveVector.addScaledVector(right, this.direction.x);

        const targetX = this.camera.position.x + moveVector.x * speed * delta;
        const targetZ = this.camera.position.z + moveVector.z * speed * delta;

        if (!this.checkCollision(targetX, this.camera.position.z)) {
            this.camera.position.x = targetX;
        }
        if (!this.checkCollision(this.camera.position.x, targetZ)) {
            this.camera.position.z = targetZ;
        }

        if (this.keys['Space'] && this.isOnGround) {
            this.velocity.y = 5.5;
            this.isOnGround = false;
        }

        if (!this.isOnGround) {
            this.velocity.y -= 16 * delta;
            this.camera.position.y += this.velocity.y * delta;
            if (this.camera.position.y <= this.playerHeight) {
                this.camera.position.y = this.playerHeight;
                this.velocity.y = 0;
                this.isOnGround = true;
            }
        }
    }

    checkCollision(x, z) {
        if (x < -58 || x > 58 || z < -58 || z > 58) return true;

        for (const col of this.level.colliders) {
            if (col.userData && col.userData.type === 'wall' && col.userData.w && col.userData.d) {
                const halfW = col.userData.w / 2 + 0.6;
                const halfD = col.userData.d / 2 + 0.6;
                if (Math.abs(x - col.position.x) < halfW && Math.abs(z - col.position.z) < halfD) {
                    return true;
                }
            } else if (col.userData && col.userData.type === 'pillar') {
                const dist = Math.hypot(x - col.position.x, z - col.position.z);
                if (dist < 1.8) return true;
            }
        }
        return false;
    }

    updateGameplay(delta) {
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen * delta);
            this.updateHUD();
        }

        const collected = this.level.checkBeaconCollection(this.camera.position);
        if (collected) {
            this.beaconsCollected++;
            if (window.echoAudio) window.echoAudio.playBeaconCollect();
            this.logMessage(`BALIZA DE RESSONÂNCIA [${collected.name}] RECOLHIDA! (${this.beaconsCollected}/3)`);
            this.updateHUD();

            if (this.level.allBeaconsCollected()) {
                this.level.activateExit();
                this.logMessage("ALERTA: TODAS AS BALIZAS RECOLHIDAS! PORTAL DE EXTRAÇÃO ATIVADO AO SUL (Z: 54)!");
                const objEl = document.getElementById('hud-objective');
                if (objEl) objEl.textContent = "OBJETIVO: ALCANCE O PORTAL DE EXTRAÇÃO!";
            }
        }

        if (this.level.checkExit(this.camera.position)) {
            this.triggerVictory();
        }

        if (this.scannerRing) {
            this.scannerRing.rotation.z += delta * 4;
        }
    }

    triggerVictory() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        document.exitPointerLock();

        if (window.echoAudio) window.echoAudio.playVictory();

        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) victoryScreen.style.display = 'flex';
    }

    logMessage(text) {
        const logEl = document.getElementById('hud-log');
        if (!logEl) return;
        logEl.textContent = text;
        logEl.style.opacity = '1';
        setTimeout(() => {
            logEl.style.opacity = '0.8';
        }, 4000);
    }

    updateHUD() {
        const energyBar = document.getElementById('energy-fill');
        const energyVal = document.getElementById('energy-val');
        const beaconVal = document.getElementById('beacon-val');

        if (energyBar) energyBar.style.width = `${(this.energy / this.maxEnergy) * 100}%`;
        if (energyVal) energyVal.textContent = `${Math.floor(this.energy)}%`;
        if (beaconVal) beaconVal.textContent = `${this.beaconsCollected} / ${this.totalBeacons}`;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (this.isLocked && !this.isGameOver) {
            this.updatePlayerMovement(delta);
            this.updateGameplay(delta);
        }

        if (this.scanner) {
            this.scanner.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new EchoGame();
});

