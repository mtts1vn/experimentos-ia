class MissileSystem {
    constructor(scene, ship, world, audio, game) {
        this.scene = scene;
        this.ship = ship;
        this.world = world;
        this.audio = audio;
        this.game = game;

        this.missiles = [];
        this.smokeRings = [];
        this.fragments = [];

        this.fireCooldown = 0;
        this.maxCooldown = 2.0;

        this.missileGroup = new THREE.Group();
        this.smokeGroup = new THREE.Group();
        this.hanabiGroup = new THREE.Group();

        this.scene.add(this.missileGroup);
        this.scene.add(this.smokeGroup);
        this.scene.add(this.hanabiGroup);

        this.palettes = [
            [0x00f0ff, 0xff00aa, 0xffea00],
            [0xffa500, 0x00ff88, 0xff0055],
            [0xaa44ff, 0x00ffff, 0xffffff],
            [0xff1493, 0x7fff00, 0x00bfff],
            [0xffd700, 0xff4500, 0x9400d3]
        ];

        this.patterns = ['KIKU', 'BOTAN', 'YANAGI', 'HACHINOKO', 'SATURN', 'SENRIN'];

        this.shardGeometries = [
            new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(1.6, 0)),
            new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.4, 0)),
            new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.2, 0))
        ];

        this.smokeGeometries = [];
        for (let sides of [5, 6, 8]) {
            const pts = [];
            for (let i = 0; i <= sides; i++) {
                const a = (i / sides) * Math.PI * 2;
                pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
            }
            this.smokeGeometries.push(new THREE.BufferGeometry().setFromPoints(pts));
        }

        this.scratchVecA = new THREE.Vector3();
        this.scratchVecB = new THREE.Vector3();
        this.scratchVecC = new THREE.Vector3();
        this.scratchVecD = new THREE.Vector3();
        this.scratchQuat = new THREE.Quaternion();
    }

    createMissileMesh() {
        const group = new THREE.Group();

        const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 4.5, 6, 1, false);
        bodyGeo.rotateX(Math.PI / 2);
        const bodyEdges = new THREE.EdgesGeometry(bodyGeo);
        const bodyMat = new THREE.LineBasicMaterial({ color: 0xff3300 });
        const bodyWire = new THREE.LineSegments(bodyEdges, bodyMat);
        group.add(bodyWire);

        const noseGeo = new THREE.ConeGeometry(0.45, 1.6, 6, 1, false);
        noseGeo.rotateX(-Math.PI / 2);
        const noseEdges = new THREE.EdgesGeometry(noseGeo);
        const noseMat = new THREE.LineBasicMaterial({ color: 0xffea00 });
        const noseWire = new THREE.LineSegments(noseEdges, noseMat);
        noseWire.position.set(0, 0, -2.8);
        group.add(noseWire);

        const finPts = [];
        for (let i = 0; i < 4; i++) {
            const ang = (i / 4) * Math.PI * 2;
            const ca = Math.cos(ang);
            const sa = Math.sin(ang);

            finPts.push(new THREE.Vector3(ca * 0.45, sa * 0.45, 0.8));
            finPts.push(new THREE.Vector3(ca * 1.5, sa * 1.5, 2.2));

            finPts.push(new THREE.Vector3(ca * 1.5, sa * 1.5, 2.2));
            finPts.push(new THREE.Vector3(ca * 0.45, sa * 0.45, 2.2));
        }
        const finGeo = new THREE.BufferGeometry().setFromPoints(finPts);
        const finMat = new THREE.LineBasicMaterial({ color: 0x00f0ff });
        const finWire = new THREE.LineSegments(finGeo, finMat);
        group.add(finWire);

        return group;
    }

    canFire() {
        return this.fireCooldown <= 0 && !this.ship.isDestroyed;
    }

    fire(aimPoint) {
        if (!this.canFire()) return false;
        this.fireCooldown = this.maxCooldown;

        const spawnPos = this.scratchVecA.set(0, -1.2, 0).applyQuaternion(this.ship.quaternion).add(this.ship.position);

        const flyDir = this.scratchVecB;
        if (aimPoint) {
            flyDir.copy(aimPoint).sub(spawnPos).normalize();
        } else {
            this.ship.getForwardVector(flyDir);
        }

        const initialSpeed = Math.max(0, this.ship.currentSpeed) + 420.0;
        const velocity = flyDir.clone().multiplyScalar(initialSpeed);

        const mesh = this.createMissileMesh();
        mesh.position.copy(spawnPos);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), flyDir);
        this.missileGroup.add(mesh);

        this.missiles.push({
            mesh: mesh,
            pos: mesh.position,
            prevPos: spawnPos.clone(),
            vel: velocity,
            dir: flyDir.clone(),
            life: 3.2,
            smokeTimer: 0,
            speed: initialSpeed
        });

        this.audio.playMissileLaunch();
        this.game.addTrauma(0.18);
        return true;
    }

    spawnSmoke(pos, dir) {
        const geo = this.smokeGeometries[Math.floor(Math.random() * this.smokeGeometries.length)];
        const mat = new THREE.LineBasicMaterial({
            color: Math.random() > 0.4 ? 0x00f0ff : 0xffaa00,
            transparent: true,
            opacity: 0.95
        });
        const ring = new THREE.Line(geo, mat);
        ring.position.copy(pos);

        this.scratchVecC.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, -1).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        ring.quaternion.copy(quat);

        const rotAngle = Math.random() * Math.PI * 2;
        ring.rotateZ(rotAngle);

        this.smokeGroup.add(ring);

        const drift = dir.clone().multiplyScalar(-15).add(
            new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12)
        );

        this.smokeRings.push({
            mesh: ring,
            vel: drift,
            rotSpeed: (Math.random() - 0.5) * 5.0,
            radius: 0.9,
            expandRate: 14.0 + Math.random() * 18.0,
            life: 0.85,
            maxLife: 0.85
        });
    }

    detonateMissile(missile, hitPos) {
        const pos = hitPos ? hitPos.clone() : missile.pos.clone();
        const palette = this.palettes[Math.floor(Math.random() * this.palettes.length)];
        const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];

        this.spawnHanabiPattern(pos, pattern, palette, 1, missile.dir);

        const distToShip = this.ship.position.distanceTo(pos);
        this.audio.playHanabiBoom(1, distToShip);
        this.game.addTrauma(0.95);
        this.game.triggerHitmarker();

        missile.life = 0;
    }

    spawnHanabiPattern(origin, pattern, palette, generation, forwardDir) {
        const countByGen = [0, 16, 3, 2, 2, 2];
        const count = generation === 1 ? 20 : (countByGen[generation] || 2);
        const baseSpeed = generation === 1 ? 160.0 : Math.max(35.0, 140.0 - generation * 22.0);

        for (let i = 0; i < count; i++) {
            const vel = new THREE.Vector3();
            const colIdx = (i + generation) % palette.length;
            const color = palette[colIdx];

            if (pattern === 'KIKU') {
                const theta = Math.acos(2 * (i / count) - 1);
                const phi = Math.sqrt(count * Math.PI) * (i / count) * Math.PI * 2;
                vel.set(
                    Math.sin(theta) * Math.cos(phi),
                    Math.sin(theta) * Math.sin(phi),
                    Math.cos(theta)
                ).normalize().multiplyScalar(baseSpeed * (0.85 + Math.random() * 0.3));

            } else if (pattern === 'BOTAN') {
                const isInner = (i % 2 === 0);
                const radiusMult = isInner ? 0.6 : 1.0;
                vel.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(baseSpeed * radiusMult * (0.9 + Math.random() * 0.2));

            } else if (pattern === 'YANAGI') {
                const ang = (i / count) * Math.PI * 2;
                const spread = Math.random() * 0.7;
                vel.set(
                    Math.cos(ang) * (0.8 + spread),
                    0.5 + Math.random() * 0.8,
                    Math.sin(ang) * (0.8 + spread)
                ).normalize().multiplyScalar(baseSpeed * (0.9 + Math.random() * 0.3));

            } else if (pattern === 'HACHINOKO') {
                const armAngle = (i / count) * Math.PI * 6;
                const r = (i / count) * 1.5;
                vel.set(
                    Math.cos(armAngle) * r,
                    (Math.random() - 0.5) * 1.2,
                    Math.sin(armAngle) * r
                ).normalize().multiplyScalar(baseSpeed * (0.9 + Math.random() * 0.35));

            } else if (pattern === 'SATURN') {
                if (i < count * 0.4) {
                    vel.set(
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2
                    ).normalize().multiplyScalar(baseSpeed * 0.6);
                } else {
                    const theta = ((i - count * 0.4) / (count * 0.6)) * Math.PI * 2;
                    vel.set(
                        Math.cos(theta) * 1.4,
                        Math.sin(theta) * 0.3,
                        Math.sin(theta) * 1.4
                    ).normalize().multiplyScalar(baseSpeed * 1.15);
                }

            } else {
                vel.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(baseSpeed * (0.5 + Math.random() * 0.9));
            }

            const geo = this.shardGeometries[Math.floor(Math.random() * this.shardGeometries.length)];
            const mat = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1.0
            });
            const mesh = new THREE.LineSegments(geo, mat);

            const scale = Math.max(0.4, 2.2 - generation * 0.38);
            mesh.scale.set(scale, scale, scale);
            mesh.position.copy(origin);
            this.hanabiGroup.add(mesh);

            const lifeDuration = generation === 1 ? 0.38 : (0.28 + Math.random() * 0.14);

            this.fragments.push({
                mesh: mesh,
                pos: mesh.position,
                prevPos: origin.clone(),
                vel: vel,
                rot: new THREE.Vector3(
                    (Math.random() - 0.5) * 16,
                    (Math.random() - 0.5) * 16,
                    (Math.random() - 0.5) * 16
                ),
                generation: generation,
                pattern: pattern,
                palette: palette,
                life: lifeDuration,
                maxLife: lifeDuration,
                scale: scale,
                radius: Math.max(2.5, scale * 2.0),
                isGravity: pattern === 'YANAGI'
            });
        }
    }

    splitFragment(parent) {
        if (parent.generation >= 5) return;

        const nextGen = parent.generation + 1;
        const pos = parent.pos.clone();
        this.spawnHanabiPattern(pos, parent.pattern, parent.palette, nextGen, parent.vel);

        const distToShip = this.ship.position.distanceTo(pos);
        this.audio.playHanabiBoom(nextGen, distToShip);
        this.game.addTrauma(Math.max(0.08, 0.45 - nextGen * 0.08));
    }

    update(delta) {
        if (this.fireCooldown > 0) {
            this.fireCooldown = Math.max(0, this.fireCooldown - delta);
        }

        this.updateMissiles(delta);
        this.updateSmoke(delta);
        this.updateHanabiFragments(delta);
    }

    updateMissiles(delta) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const m = this.missiles[i];
            m.life -= delta;

            m.speed = Math.min(780.0, m.speed + 380.0 * delta);
            m.vel.copy(m.dir).multiplyScalar(m.speed);

            m.prevPos.copy(m.pos);
            m.pos.addScaledVector(m.vel, delta);
            m.mesh.position.copy(m.pos);

            m.smokeTimer += delta;
            if (m.smokeTimer >= 0.035) {
                m.smokeTimer = 0;
                const exhaustOffset = this.scratchVecC.copy(m.dir).multiplyScalar(-2.4);
                const exhaustPos = this.scratchVecD.copy(m.pos).add(exhaustOffset);
                this.spawnSmoke(exhaustPos, m.dir);
            }

            const hitResult = this.checkMissileCollision(m.prevPos, m.pos);
            if (hitResult) {
                if (hitResult.asteroid) {
                    this.world.destroyAsteroidDirect(hitResult.asteroid);
                    this.game.kills++;
                    this.game.hudKills.textContent = this.game.kills;
                }
                this.detonateMissile(m, hitResult.hitPos);
                this.missileGroup.remove(m.mesh);
                m.mesh.geometry && m.mesh.geometry.dispose();
                this.missiles.splice(i, 1);
                continue;
            }

            if (m.life <= 0) {
                this.detonateMissile(m, m.pos);
                this.missileGroup.remove(m.mesh);
                m.mesh.geometry && m.mesh.geometry.dispose();
                this.missiles.splice(i, 1);
            }
        }
    }

    checkMissileCollision(p0, p1) {
        const vX = p1.x - p0.x;
        const vY = p1.y - p0.y;
        const vZ = p1.z - p0.z;
        const segLenSq = vX * vX + vY * vY + vZ * vZ;

        for (const chunkGroup of this.world.activeChunks.values()) {
            const asteroids = chunkGroup.userData.asteroids;
            if (!asteroids) continue;

            for (let i = 0; i < asteroids.length; i++) {
                const ast = asteroids[i];
                const hitRadius = ast.radius + 4.0;
                let distSq = 0;
                let t = 0;

                if (segLenSq > 0.0001) {
                    const dX = ast.position.x - p0.x;
                    const dY = ast.position.y - p0.y;
                    const dZ = ast.position.z - p0.z;
                    t = Math.max(0, Math.min(1, (dX * vX + dY * vY + dZ * vZ) / segLenSq));
                    const closeX = p0.x + t * vX;
                    const closeY = p0.y + t * vY;
                    const closeZ = p0.z + t * vZ;
                    const diffX = ast.position.x - closeX;
                    const diffY = ast.position.y - closeY;
                    const diffZ = ast.position.z - closeZ;
                    distSq = diffX * diffX + diffY * diffY + diffZ * diffZ;
                } else {
                    distSq = p1.distanceToSquared(ast.position);
                    t = 1.0;
                }

                if (distSq < hitRadius * hitRadius) {
                    const hitPos = new THREE.Vector3(p0.x + t * vX, p0.y + t * vY, p0.z + t * vZ);
                    return {
                        asteroid: ast,
                        hitPos: hitPos
                    };
                }
            }
        }

        const mothership = this.game.mothership;
        if (mothership) {
            const localP = this.scratchVecA.copy(p1).sub(mothership.position);
            for (let i = 0; i < mothership.collisionBoxes.length; i++) {
                const box = mothership.collisionBoxes[i];
                if (localP.x >= box.min.x && localP.x <= box.max.x &&
                    localP.y >= box.min.y && localP.y <= box.max.y &&
                    localP.z >= box.min.z && localP.z <= box.max.z) {
                    return {
                        asteroid: null,
                        hitPos: p1.clone()
                    };
                }
            }
        }

        return null;
    }

    updateSmoke(delta) {
        for (let i = this.smokeRings.length - 1; i >= 0; i--) {
            const s = this.smokeRings[i];
            s.life -= delta;

            s.radius += s.expandRate * delta;
            s.mesh.scale.set(s.radius, s.radius, s.radius);
            s.mesh.position.addScaledVector(s.vel, delta);
            s.mesh.rotation.z += s.rotSpeed * delta;

            const alpha = Math.max(0, s.life / s.maxLife);
            s.mesh.material.opacity = alpha * 0.9;

            if (s.life <= 0) {
                this.smokeGroup.remove(s.mesh);
                s.mesh.material.dispose();
                this.smokeRings.splice(i, 1);
            }
        }
    }

    updateHanabiFragments(delta) {
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const f = this.fragments[i];
            f.life -= delta;

            if (f.isGravity) {
                f.vel.y -= 38.0 * delta;
            }

            f.prevPos.copy(f.pos);
            f.pos.addScaledVector(f.vel, delta);
            f.mesh.position.copy(f.pos);

            f.mesh.rotation.x += f.rot.x * delta;
            f.mesh.rotation.y += f.rot.y * delta;
            f.mesh.rotation.z += f.rot.z * delta;

            const alpha = Math.max(0, f.life / f.maxLife);
            if (f.mesh.material) {
                f.mesh.material.opacity = alpha;
            }

            const hitAsteroid = this.checkFragmentAsteroidHit(f.prevPos, f.pos, f.radius);
            if (hitAsteroid) {
                const boomPos = hitAsteroid.position.clone();
                this.world.destroyAsteroidDirect(hitAsteroid);
                this.game.kills++;
                this.game.hudKills.textContent = this.game.kills;

                const distToShip = this.ship.position.distanceTo(boomPos);
                this.audio.playAsteroidExplosion(distToShip);
                this.game.addTrauma(0.7);
                this.game.triggerHitmarker();

                this.splitFragment(f);
                this.hanabiGroup.remove(f.mesh);
                if (f.mesh.material) f.mesh.material.dispose();
                this.fragments.splice(i, 1);
                continue;
            }

            if (f.life <= 0) {
                this.splitFragment(f);
                this.hanabiGroup.remove(f.mesh);
                if (f.mesh.material) f.mesh.material.dispose();
                this.fragments.splice(i, 1);
            }
        }
    }

    checkFragmentAsteroidHit(p0, p1, fragRadius) {
        const vX = p1.x - p0.x;
        const vY = p1.y - p0.y;
        const vZ = p1.z - p0.z;
        const segLenSq = vX * vX + vY * vY + vZ * vZ;

        for (const chunkGroup of this.world.activeChunks.values()) {
            const asteroids = chunkGroup.userData.asteroids;
            if (!asteroids) continue;

            for (let aIdx = asteroids.length - 1; aIdx >= 0; aIdx--) {
                const ast = asteroids[aIdx];
                const hitRadius = ast.radius + fragRadius + 2.0;
                let distSq = 0;

                if (segLenSq > 0.0001) {
                    const dX = ast.position.x - p0.x;
                    const dY = ast.position.y - p0.y;
                    const dZ = ast.position.z - p0.z;
                    const t = Math.max(0, Math.min(1, (dX * vX + dY * vY + dZ * vZ) / segLenSq));
                    const closeX = p0.x + t * vX;
                    const closeY = p0.y + t * vY;
                    const closeZ = p0.z + t * vZ;
                    const diffX = ast.position.x - closeX;
                    const diffY = ast.position.y - closeY;
                    const diffZ = ast.position.z - closeZ;
                    distSq = diffX * diffX + diffY * diffY + diffZ * diffZ;
                } else {
                    distSq = p1.distanceToSquared(ast.position);
                }

                if (distSq < hitRadius * hitRadius) {
                    return ast;
                }
            }
        }
        return null;
    }

    reset() {
        this.fireCooldown = 0;

        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const m = this.missiles[i];
            this.missileGroup.remove(m.mesh);
        }
        this.missiles.length = 0;

        for (let i = this.smokeRings.length - 1; i >= 0; i--) {
            const s = this.smokeRings[i];
            this.smokeGroup.remove(s.mesh);
            s.mesh.material.dispose();
        }
        this.smokeRings.length = 0;

        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const f = this.fragments[i];
            this.hanabiGroup.remove(f.mesh);
            if (f.mesh.material) f.mesh.material.dispose();
        }
        this.fragments.length = 0;
    }
}

