class VectorGame {
    constructor() {
        this.container = document.getElementById('viewport');
        this.instructionsOverlay = document.getElementById('overlay-instructions');
        this.dockedModal = document.getElementById('docked-modal');
        this.dockingBanner = document.getElementById('docking-banner');
        this.btnStart = document.getElementById('btn-start');
        this.btnUndock = document.getElementById('btn-undock');

        this.hudSpeed = document.getElementById('hud-speed');
        this.hudDistance = document.getElementById('hud-distance');
        this.hudSector = document.getElementById('hud-sector');
        this.hudCam = document.getElementById('hud-cam');
        this.barBoost = document.getElementById('bar-boost');
        this.barThrottle = document.getElementById('bar-throttle');
        this.radarNeedle = document.getElementById('radar-needle');

        this.damageFlash = document.getElementById('damage-flash');
        this.gameoverModal = document.getElementById('gameover-modal');
        this.btnRespawn = document.getElementById('btn-respawn');
        this.hudHullText = document.getElementById('hud-hull-text');
        this.hudHullPct = document.getElementById('hud-hull-pct');
        this.barHull = document.getElementById('bar-hull');
        this.hudHitmarker = document.getElementById('hud-hitmarker');
        this.hudKills = document.getElementById('hud-kills');
        this.hudGrapple = document.getElementById('hud-grapple');
        this.hudMissile = document.getElementById('hud-missile');

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.audio = new VectorAudio();
        this.ship = null;
        this.mothership = null;
        this.world = null;
        this.grapple = null;
        this.missile = null;

        this.isPointerLocked = false;
        this.isDocked = false;
        this.trauma = 0;
        this.kills = 0;
        this.isMouseDown = false;
        this.hitmarkerTimer = null;
        this.keys = {};
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;

        this.scratchForward = new THREE.Vector3();
        this.scratchToMother = new THREE.Vector3();
        this.scratchFlatForward = new THREE.Vector3();
        this.scratchFlatTarget = new THREE.Vector3();
        this.scratchAimRay = new THREE.Raycaster();
        this.scratchAimVecA = new THREE.Vector3();
        this.scratchAimVecB = new THREE.Vector3();

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020206);

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(65, aspect, 0.5, 3000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.mothership = new Mothership(this.scene);
        this.ship = new PlayerShip(this.scene, this.camera);
        this.world = new SpaceWorld(this.scene);
        this.grapple = new GrappleSystem(this.scene, this.ship, this.camera, this.world, this.audio, this);
        this.missile = new MissileSystem(this.scene, this.ship, this.world, this.audio, this);

        this.setupEvents();
        this.animate();
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.btnStart.addEventListener('click', () => {
            this.audio.init();
            this.container.requestPointerLock();
            this.instructionsOverlay.style.display = 'none';
        });

        this.btnUndock.addEventListener('click', () => {
            this.performUndock();
        });

        this.btnRespawn.addEventListener('click', () => {
            this.performRespawn();
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = (document.pointerLockElement === this.container);
            if (!this.isPointerLocked) {
                this.isMouseDown = false;
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.isPointerLocked && !this.isDocked && !this.ship.isDestroyed) {
                this.isMouseDown = true;
            }
            if (e.button === 1 && this.isPointerLocked && !this.isDocked && !this.ship.isDestroyed) {
                e.preventDefault();
                const aimPoint = this.getAimPoint(550);
                if (this.missile) this.missile.fire(aimPoint);
            }
            if (e.button === 2 && this.isPointerLocked && !this.isDocked && !this.ship.isDestroyed) {
                e.preventDefault();
                const aimTarget = this.getAimTarget(550);
                this.grapple.handleMouseDown(aimTarget);
            }
        });

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isMouseDown = false;
            }
            if (e.button === 2 && this.isPointerLocked && !this.isDocked && !this.ship.isDestroyed) {
                e.preventDefault();
                const aimTarget = this.getAimTarget(550);
                this.grapple.handleMouseUp(aimTarget);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked && !this.isDocked && !this.ship.isDestroyed) {
                this.mouseDeltaX += e.movementX;
                this.mouseDeltaY += e.movementY;
            }
        });

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'KeyG' && !this.isDocked && !this.ship.isDestroyed) {
                const aimPoint = this.getAimPoint(550);
                if (this.missile) this.missile.fire(aimPoint);
            }

            if (e.code === 'KeyC' && !this.isDocked) {
                if (this.grapple) this.grapple.setReeling(true);
            }

            if (e.code === 'KeyX' && !this.isDocked) {
                if (this.grapple) this.grapple.cutCable();
            }

            if (e.code === 'KeyV' && !this.isDocked) {
                this.ship.toggleCamera();
                this.hudCam.textContent = this.ship.cameraMode.toUpperCase();
            }

            if (e.code === 'KeyF') {
                if (this.isDocked) {
                    this.performUndock();
                } else {
                    this.tryDock();
                }
            }

            if (e.code === 'KeyR') {
                if (this.ship.isDestroyed) {
                    this.performRespawn();
                } else if (!this.isDocked) {
                    this.ship.reset();
                    if (this.grapple) this.grapple.reset();
                }
            }

            if (e.code === 'Space' && this.isDocked) {
                this.performUndock();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;

            if (e.code === 'KeyC') {
                if (this.grapple) this.grapple.setReeling(false);
            }
        });
    }

    getAimTarget(maxDistance = 550) {
        this.scratchAimRay.setFromCamera({ x: 0, y: 0 }, this.camera);
        const rayOrigin = this.camera.position;
        const rayDir = this.scratchAimRay.ray.direction;

        let closestDist = maxDistance;
        let closestHit = null;
        let targetObject = null;
        let isMothership = false;

        for (const chunkGroup of this.world.activeChunks.values()) {
            const asteroids = chunkGroup.userData.asteroids;
            if (!asteroids) continue;
            for (let i = 0; i < asteroids.length; i++) {
                const ast = asteroids[i];
                const toAst = this.scratchAimVecA.copy(ast.position).sub(rayOrigin);
                const proj = toAst.dot(rayDir);
                if (proj > 4.0 && proj < closestDist + ast.radius) {
                    const perpSq = Math.max(0, toAst.lengthSq() - proj * proj);
                    const hitRad = ast.radius + 6.0;
                    if (perpSq < hitRad * hitRad) {
                        const surfaceOffset = Math.sqrt(Math.max(0, ast.radius * ast.radius - perpSq));
                        const hitDist = Math.max(2.0, proj - surfaceOffset);
                        if (hitDist < closestDist) {
                            closestDist = hitDist;
                            targetObject = ast;
                            isMothership = false;
                            closestHit = this.scratchAimVecB.copy(rayOrigin).addScaledVector(rayDir, hitDist);
                        }
                    }
                }
            }
        }

        if (this.mothership) {
            const motherDist = rayOrigin.distanceTo(this.mothership.position);
            if (motherDist > 55.0) {
                const toMother = this.scratchAimVecA.copy(this.mothership.position).sub(rayOrigin);
                const projMother = toMother.dot(rayDir);
                if (projMother > 20.0 && projMother < closestDist) {
                    const perpSq = Math.max(0, toMother.lengthSq() - projMother * projMother);
                    if (perpSq < 38.0 * 38.0) {
                        closestDist = projMother;
                        targetObject = this.mothership;
                        isMothership = true;
                        closestHit = this.scratchAimVecB.copy(rayOrigin).addScaledVector(rayDir, projMother);
                    }
                }
            }
        }

        if (closestHit) {
            return {
                point: closestHit.clone(),
                target: targetObject,
                isMothership: isMothership
            };
        }

        return {
            point: this.scratchAimVecB.copy(rayOrigin).addScaledVector(rayDir, maxDistance).clone(),
            target: null,
            isMothership: false
        };
    }

    getAimPoint(maxDistance = 500) {
        return this.getAimTarget(maxDistance).point;
    }

    tryDock() {
        this.ship.getForwardVector(this.scratchForward);
        const status = this.mothership.checkDockingStatus(this.ship.position, this.scratchForward, this.ship.currentSpeed);
        if (status.readyToDock) {
            this.performDock();
        }
    }

    performDock() {
        this.isDocked = true;
        if (this.grapple) this.grapple.reset();
        if (this.missile) this.missile.reset();
        this.mothership.dock(this.ship);
        this.dockedModal.style.display = 'flex';
        this.dockingBanner.style.display = 'none';
        this.audio.playDockingClamp();
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    performUndock() {
        this.isDocked = false;
        this.dockedModal.style.display = 'none';
        this.mothership.undock(this.ship);
        this.audio.playUndock();
        this.container.requestPointerLock();
    }

    performRespawn() {
        this.ship.respawn();
        if (this.grapple) this.grapple.reset();
        if (this.missile) this.missile.reset();
        this.gameoverModal.style.display = 'none';
        this.mothership.dock(this.ship);
        this.isDocked = true;
        this.isMouseDown = false;
        this.dockedModal.style.display = 'flex';
        this.trauma = 0;
        this.updateHUD();
    }

    addTrauma(amount) {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }

    checkCollisions() {
        if (this.isDocked || this.ship.isDestroyed) return;

        const projectileHits = this.world.testProjectileCollisions(this.ship.projectiles);
        for (let i = 0; i < projectileHits.length; i++) {
            const hit = projectileHits[i];
            this.kills++;
            this.hudKills.textContent = this.kills;

            const distToShip = this.ship.position.distanceTo(hit.position);
            if (hit.type === 'fragment') {
                this.audio.playFragmentHit(distToShip);
                const proximityShake = Math.max(0.12, Math.min(0.65, 0.7 - (distToShip / 300)));
                this.addTrauma(proximityShake);
            } else {
                this.audio.playAsteroidExplosion(distToShip);
                const proximityShake = Math.max(0.18, Math.min(0.95, 1.0 - (distToShip / 320)));
                this.addTrauma(proximityShake);
            }

            this.triggerHitmarker();
        }

        const motherHit = this.mothership.checkCollision(this.ship.position, 2.5, this.ship.currentSpeed);
        if (motherHit) {
            const result = this.ship.applyCollision(motherHit.normal, motherHit.depth);
            this.handleCollisionFeedback(result);
            return;
        }

        const asteroidHit = this.world.checkAsteroidCollisions(this.ship.position, 2.5);
        if (asteroidHit) {
            const result = this.ship.applyCollision(asteroidHit.normal, asteroidHit.depth);
            this.handleCollisionFeedback(result);
        }
    }

    triggerHitmarker() {
        this.hudHitmarker.classList.add('active');
        if (this.hitmarkerTimer) clearTimeout(this.hitmarkerTimer);
        this.hitmarkerTimer = setTimeout(() => {
            this.hudHitmarker.classList.remove('active');
        }, 110);
    }

    handleCollisionFeedback(result) {
        const intensity = Math.min(1.0, 0.35 + (result.speed / 100) * 0.65);
        this.addTrauma(intensity);
        this.audio.playImpact(intensity);

        this.damageFlash.style.opacity = '1';
        setTimeout(() => {
            this.damageFlash.style.opacity = '0';
        }, 120);

        if (this.ship.isDestroyed) {
            this.audio.playExplosion();
            this.addTrauma(1.0);
            setTimeout(() => {
                this.gameoverModal.style.display = 'flex';
                if (document.exitPointerLock) {
                    document.exitPointerLock();
                }
            }, 400);
        }
    }

    applyCameraShake(delta) {
        if (this.trauma > 0) {
            const shake = this.trauma * this.trauma;
            this.camera.position.x += (Math.random() * 2 - 1) * 0.55 * shake;
            this.camera.position.y += (Math.random() * 2 - 1) * 0.55 * shake;
            this.camera.position.z += (Math.random() * 2 - 1) * 0.35 * shake;
            this.camera.rotation.z += (Math.random() * 2 - 1) * 0.04 * shake;
            this.trauma = Math.max(0, this.trauma - delta * 1.6);
        }
    }

    handleFlightInput(delta) {
        if (this.isDocked || this.ship.isDestroyed) return;

        if (this.isMouseDown) {
            const aimPoint = this.getAimPoint(500);
            if (this.ship.fire(aimPoint)) {
                this.audio.playLaser();
                this.addTrauma(0.08);
            }
        }

        let pitch = 0;
        let yaw = 0;
        let roll = 0;
        let throttle = 0;
        let boost = false;

        if (this.isPointerLocked) {
            pitch = -this.mouseDeltaY * 0.055;
            yaw = -this.mouseDeltaX * 0.055;
            this.mouseDeltaX *= 0.15;
            this.mouseDeltaY *= 0.15;
        }

        if (this.keys['KeyW']) throttle += 1;
        if (this.keys['KeyS']) throttle -= 1;
        if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) throttle -= 1.5;

        if (this.keys['KeyA']) roll += 1;
        if (this.keys['KeyD']) roll -= 1;

        if (this.keys['KeyQ']) yaw += 0.8;
        if (this.keys['KeyE']) yaw -= 0.8;

        if (this.keys['ArrowUp']) pitch -= 0.8;
        if (this.keys['ArrowDown']) pitch += 0.8;
        if (this.keys['ArrowLeft']) yaw += 0.8;
        if (this.keys['ArrowRight']) yaw -= 0.8;

        if (this.keys['Space']) boost = true;

        this.ship.setInputs(pitch, yaw, roll, throttle, boost);
    }

    updateHUD() {
        const speed = Math.round(this.ship.currentSpeed);
        this.hudSpeed.textContent = speed;

        const hull = Math.round(this.ship.hull);
        this.hudHullText.textContent = `${hull}%`;
        this.hudHullPct.textContent = `${hull}%`;
        this.barHull.style.width = `${hull}%`;

        if (hull <= 30) {
            this.barHull.classList.add('danger');
            this.hudHullText.style.color = '#ff2a2a';
        } else {
            this.barHull.classList.remove('danger');
            this.hudHullText.style.color = '#00ff66';
        }

        const throttleRatio = Math.max(0, Math.min(1, this.ship.currentSpeed / this.ship.maxNormalSpeed));
        this.barThrottle.style.width = `${Math.round(throttleRatio * 100)}%`;

        const boostRatio = this.ship.boostEnergy / this.ship.maxBoostEnergy;
        this.barBoost.style.width = `${Math.round(boostRatio * 100)}%`;

        const dist = Math.round(this.ship.position.distanceTo(this.mothership.position));
        this.hudDistance.textContent = `${dist.toLocaleString()} M`;

        const cx = Math.floor(this.ship.position.x / this.world.chunkSize);
        const cy = Math.floor(this.ship.position.y / this.world.chunkSize);
        const cz = Math.floor(this.ship.position.z / this.world.chunkSize);
        this.hudSector.textContent = `[${cx}, ${cy}, ${cz}]`;

        if (this.hudGrapple && this.grapple) {
            const activeCount = this.grapple.activeTethers ? this.grapple.activeTethers.length : 0;
            const state = this.grapple.state;
            const reeling = this.grapple.isReeling;

            if (reeling && activeCount > 0) {
                this.hudGrapple.textContent = `APERTANDO ${activeCount} CABO(S)! [C]`;
                this.hudGrapple.style.color = '#ff3300';
            } else if (state === 'FIRING_FIRST') {
                this.hudGrapple.textContent = activeCount > 0 ? `LANÇANDO 1 [${activeCount} ATIVOS]` : 'LANÇANDO 1';
                this.hudGrapple.style.color = '#00f0ff';
            } else if (state === 'TARGETING_SECOND') {
                this.hudGrapple.textContent = 'ALVO 1 OK! MIRA NO 2 E SOLTE BOTÃO DIR.';
                this.hudGrapple.style.color = '#ffcc00';
            } else if (state === 'FIRING_SECOND') {
                this.hudGrapple.textContent = activeCount > 0 ? `LANÇANDO 2 [${activeCount} ATIVOS]` : 'LANÇANDO 2';
                this.hudGrapple.style.color = '#00f0ff';
            } else if (activeCount > 0) {
                this.hudGrapple.textContent = `${activeCount} CABO(S) ATIVOS | [C] APERTAR TODOS | [X] CORTAR`;
                this.hudGrapple.style.color = '#ffea00';
            } else {
                this.hudGrapple.textContent = 'GANCHO PRONTO';
                this.hudGrapple.style.color = '#00ff66';
            }
        }

        if (this.hudMissile && this.missile) {
            if (this.missile.fireCooldown > 0) {
                const secs = (Math.ceil(this.missile.fireCooldown * 10) / 10).toFixed(1);
                this.hudMissile.textContent = `RECARREGANDO (${secs}s)`;
                this.hudMissile.style.color = '#ffaa00';
            } else {
                this.hudMissile.textContent = 'PRONTO [G / SCROLL]';
                this.hudMissile.style.color = '#00f0ff';
            }
        }

        this.updateRadarAndDocking(dist);
    }

    updateRadarAndDocking(dist) {
        this.scratchToMother.subVectors(this.mothership.position, this.ship.position);
        this.ship.getForwardVector(this.scratchForward);

        const facingScore = this.scratchForward.dot(this.scratchToMother.clone().normalize());

        const camQuatInv = this.camera.quaternion.clone().invert();
        const localTargetDir = this.scratchToMother.clone().applyQuaternion(camQuatInv);
        const angle = Math.atan2(localTargetDir.x, -localTargetDir.z);
        const deg = (angle * 180) / Math.PI;
        this.radarNeedle.style.transform = `rotate(${deg}deg)`;

        this.audio.triggerBeaconPing(dist, facingScore);

        if (!this.isDocked && !this.ship.isDestroyed) {
            const status = this.mothership.checkDockingStatus(this.ship.position, this.scratchForward, this.ship.currentSpeed);
            if (status.inRange) {
                this.dockingBanner.style.display = 'block';
                const alignPercent = Math.round(status.alignment * 100);
                if (status.readyToDock) {
                    this.dockingBanner.innerHTML = `
                        <h2 style="color: #00ff66;">TRAVAMENTO DISPONÍVEL</h2>
                        <p>Pressione <strong style="color: #ffaa00;">[F]</strong> para acoplar à Nave-Mãe</p>
                    `;
                } else {
                    this.dockingBanner.innerHTML = `
                        <h2>CORREDOR DE POUSO DETECTADO</h2>
                        <p>Alinhamento: ${alignPercent}% | Reduza a velocidade abaixo de 35 M/S</p>
                    `;
                }
            } else {
                this.dockingBanner.style.display = 'none';
            }
        } else {
            this.dockingBanner.style.display = 'none';
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(0.08, this.clock.getDelta());
        const time = this.clock.getElapsedTime();

        this.handleFlightInput(delta);

        if (!this.isDocked) {
            this.checkCollisions();
            this.ship.update(delta);
            this.grapple.update(delta);
            if (this.missile) this.missile.update(delta);
        }

        this.mothership.update(delta, time);
        this.world.update(delta, this.ship.position);

        const speedRatio = Math.abs(this.ship.currentSpeed) / this.ship.maxNormalSpeed;
        this.audio.updateEngine(speedRatio, this.ship.isBoosting);

        this.updateHUD();
        this.applyCameraShake(delta);
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new VectorGame();
});

