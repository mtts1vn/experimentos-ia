class SpaceWorld {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 900;
        this.activeChunks = new Map();
        this.currentChunkCoord = { x: null, y: null, z: null };

        this.dustCount = 3000;
        this.dustRange = 400;
        this.dustPositions = new Float32Array(this.dustCount * 3);
        this.dustColors = new Float32Array(this.dustCount * 3);
        this.dustGeometry = null;
        this.dustPoints = null;

        this.asteroidMeshGeometries = [];
        this.asteroidGeometries = [];
        this.asteroidMaterials = [];
        this.activeRotators = [];

        this.explosionFragments = [];
        this.shockwaves = [];
        this.fragmentGroup = new THREE.Group();
        this.scene.add(this.fragmentGroup);

        this.shardGeometries = [
            new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(2.0, 0)),
            new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.8, 0)),
            new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.5, 0))
        ];

        this.occluderMaterial = new THREE.MeshBasicMaterial({
            color: 0x020206,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });

        this.scratchPos = new THREE.Vector3();

        this.initDust();
        this.initGeometryTemplates();
    }

    initDust() {
        for (let i = 0; i < this.dustCount; i++) {
            const i3 = i * 3;
            this.dustPositions[i3] = (Math.random() * 2 - 1) * this.dustRange;
            this.dustPositions[i3 + 1] = (Math.random() * 2 - 1) * this.dustRange;
            this.dustPositions[i3 + 2] = (Math.random() * 2 - 1) * this.dustRange;

            const isBright = Math.random() > 0.85;
            this.dustColors[i3] = isBright ? 0.9 : 0.2;
            this.dustColors[i3 + 1] = isBright ? 1.0 : 0.5;
            this.dustColors[i3 + 2] = 1.0;
        }

        this.dustGeometry = new THREE.BufferGeometry();
        this.dustGeometry.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
        this.dustGeometry.setAttribute('color', new THREE.BufferAttribute(this.dustColors, 3));

        const dustMat = new THREE.PointsMaterial({
            size: 1.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });

        this.dustPoints = new THREE.Points(this.dustGeometry, dustMat);
        this.dustPoints.frustumCulled = false;
        this.scene.add(this.dustPoints);
    }

    initGeometryTemplates() {
        const colors = [0x00f0ff, 0xffa500, 0x00ff88, 0xff0077, 0x9955ff];
        for (let i = 0; i < colors.length; i++) {
            this.asteroidMaterials.push(
                new THREE.LineBasicMaterial({ color: colors[i], transparent: true, opacity: 0.85 })
            );
        }

        const geo1 = new THREE.IcosahedronGeometry(12, 0);
        this.deformGeometry(geo1, 0.35);
        this.asteroidMeshGeometries.push(geo1);
        this.asteroidGeometries.push(new THREE.EdgesGeometry(geo1));

        const geo2 = new THREE.DodecahedronGeometry(14, 0);
        this.deformGeometry(geo2, 0.3);
        this.asteroidMeshGeometries.push(geo2);
        this.asteroidGeometries.push(new THREE.EdgesGeometry(geo2));

        const geo3 = new THREE.OctahedronGeometry(10, 0);
        this.deformGeometry(geo3, 0.4);
        this.asteroidMeshGeometries.push(geo3);
        this.asteroidGeometries.push(new THREE.EdgesGeometry(geo3));
    }

    deformGeometry(geom, amount) {
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const factor = 1.0 + (Math.random() * 2 - 1) * amount;
            pos.setXYZ(i, pos.getX(i) * factor, pos.getY(i) * factor, pos.getZ(i) * factor);
        }
        geom.computeVertexNormals();
    }

    hashCoord(x, y, z) {
        let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^ (h >>> 16)) >>> 0;
    }

    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    updateChunks(playerPos) {
        const cx = Math.floor(playerPos.x / this.chunkSize);
        const cy = Math.floor(playerPos.y / this.chunkSize);
        const cz = Math.floor(playerPos.z / this.chunkSize);

        if (cx === this.currentChunkCoord.x && cy === this.currentChunkCoord.y && cz === this.currentChunkCoord.z) {
            return;
        }

        this.currentChunkCoord.x = cx;
        this.currentChunkCoord.y = cy;
        this.currentChunkCoord.z = cz;

        const neededKeys = new Set();
        const range = 1;

        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                for (let dz = -range; dz <= range; dz++) {
                    const kx = cx + dx;
                    const ky = cy + dy;
                    const kz = cz + dz;
                    const key = `${kx},${ky},${kz}`;
                    neededKeys.add(key);

                    if (!this.activeChunks.has(key)) {
                        const chunkGroup = this.generateChunk(kx, ky, kz);
                        this.activeChunks.set(key, chunkGroup);
                        this.scene.add(chunkGroup);
                    }
                }
            }
        }

        for (const [key, chunkGroup] of this.activeChunks.entries()) {
            if (!neededKeys.has(key)) {
                this.scene.remove(chunkGroup);
                this.removeChunkRotators(chunkGroup);
                this.activeChunks.delete(key);
            }
        }
    }

    removeChunkRotators(chunkGroup) {
        this.activeRotators = this.activeRotators.filter(item => item.parent !== chunkGroup);
    }

    removeAsteroidRotator(mesh) {
        this.activeRotators = this.activeRotators.filter(item => item.mesh !== mesh);
    }

    generateChunk(cx, cy, cz) {
        const chunkGroup = new THREE.Group();
        chunkGroup.userData.asteroids = [];
        const baseSeed = this.hashCoord(cx, cy, cz);
        let currentSeed = baseSeed;

        const rnd = () => {
            currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
            return currentSeed / 4294967296;
        };

        const originX = cx * this.chunkSize;
        const originY = cy * this.chunkSize;
        const originZ = cz * this.chunkSize;

        const isHomeSector = (cx === 0 && cy === 0 && cz === 0);

        if (!isHomeSector && rnd() > 0.68) {
            const planet = this.createWireframePlanet(rnd);
            planet.position.set(
                originX + (rnd() - 0.5) * this.chunkSize * 0.65,
                originY + (rnd() - 0.5) * this.chunkSize * 0.65,
                originZ + (rnd() - 0.5) * this.chunkSize * 0.65
            );
            chunkGroup.add(planet);
            this.activeRotators.push({ mesh: planet, rx: 0.02, ry: 0.06, rz: 0.01, parent: chunkGroup });
        }

        const asteroidCount = isHomeSector ? 12 : Math.floor(18 + rnd() * 26);
        for (let i = 0; i < asteroidCount; i++) {
            const geoIdx = Math.floor(rnd() * this.asteroidGeometries.length);
            const matIdx = Math.floor(rnd() * this.asteroidMaterials.length);

            const asteroidGroup = new THREE.Group();

            const occluder = new THREE.Mesh(
                this.asteroidMeshGeometries[geoIdx],
                this.occluderMaterial
            );
            asteroidGroup.add(occluder);

            const wire = new THREE.LineSegments(
                this.asteroidGeometries[geoIdx],
                this.asteroidMaterials[matIdx]
            );
            asteroidGroup.add(wire);

            const scale = 0.8 + rnd() * 3.6;
            asteroidGroup.scale.set(scale, scale, scale);

            const posX = originX + (rnd() - 0.5) * this.chunkSize;
            const posY = originY + (rnd() - 0.5) * this.chunkSize;
            const posZ = originZ + (rnd() - 0.5) * this.chunkSize;

            if (isHomeSector && Math.hypot(posX, posY, posZ) < 180) {
                continue;
            }

            asteroidGroup.position.set(posX, posY, posZ);
            asteroidGroup.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
            chunkGroup.add(asteroidGroup);

            chunkGroup.userData.asteroids.push({
                mesh: asteroidGroup,
                position: asteroidGroup.position,
                radius: 11.5 * scale,
                scale: scale,
                velocity: new THREE.Vector3(0, 0, 0),
                mass: scale * scale * 25.0,
                chunkGroup: chunkGroup
            });

            this.activeRotators.push({
                mesh: asteroidGroup,
                rx: (rnd() - 0.5) * 0.35,
                ry: (rnd() - 0.5) * 0.35,
                rz: (rnd() - 0.5) * 0.35,
                parent: chunkGroup
            });
        }

        return chunkGroup;
    }

    createWireframePlanet(rnd) {
        const planetGroup = new THREE.Group();
        const radius = 60 + rnd() * 80;

        const sphereGeo = new THREE.IcosahedronGeometry(radius, 2);

        const sphereMesh = new THREE.Mesh(sphereGeo, this.occluderMaterial);
        planetGroup.add(sphereMesh);

        const sphereEdges = new THREE.EdgesGeometry(sphereGeo);
        const sphereMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 });
        const sphere = new THREE.LineSegments(sphereEdges, sphereMat);
        planetGroup.add(sphere);

        if (rnd() > 0.3) {
            const ringCount = 3 + Math.floor(rnd() * 4);
            const ringColor = rnd() > 0.5 ? 0xffb700 : 0xff00aa;
            for (let r = 0; r < ringCount; r++) {
                const ringRadius = radius * (1.5 + r * 0.28);
                const circleGeo = new THREE.BufferGeometry();
                const circlePoints = [];
                const segments = 64;
                for (let s = 0; s <= segments; s++) {
                    const theta = (s / segments) * Math.PI * 2;
                    circlePoints.push(new THREE.Vector3(Math.cos(theta) * ringRadius, 0, Math.sin(theta) * ringRadius));
                }
                circleGeo.setFromPoints(circlePoints);
                const ringMat = new THREE.LineBasicMaterial({ color: ringColor, transparent: true, opacity: 0.55 });
                const ring = new THREE.Line(circleGeo, ringMat);
                ring.rotation.x = 0.45;
                ring.rotation.z = 0.25;
                planetGroup.add(ring);
            }
        }

        return planetGroup;
    }

    update(delta, playerPos) {
        this.updateChunks(playerPos);

        for (let i = 0; i < this.activeRotators.length; i++) {
            const rot = this.activeRotators[i];
            rot.mesh.rotation.x += rot.rx * delta;
            rot.mesh.rotation.y += rot.ry * delta;
            rot.mesh.rotation.z += rot.rz * delta;
        }

        const halfRange = this.dustRange;
        const doubleRange = halfRange * 2;
        const posAttr = this.dustGeometry.attributes.position;
        const array = posAttr.array;

        for (let i = 0; i < this.dustCount; i++) {
            const i3 = i * 3;
            let px = array[i3];
            let py = array[i3 + 1];
            let pz = array[i3 + 2];

            while (px - playerPos.x > halfRange) px -= doubleRange;
            while (px - playerPos.x < -halfRange) px += doubleRange;
            while (py - playerPos.y > halfRange) py -= doubleRange;
            while (py - playerPos.y < -halfRange) py += doubleRange;
            while (pz - playerPos.z > halfRange) pz -= doubleRange;
            while (pz - playerPos.z < -halfRange) pz += doubleRange;

            array[i3] = px;
            array[i3 + 1] = py;
            array[i3 + 2] = pz;
        }

        posAttr.needsUpdate = true;
        this.updateExplosions(delta);

        for (const chunkGroup of this.activeChunks.values()) {
            const asteroids = chunkGroup.userData.asteroids;
            if (!asteroids) continue;
            for (let i = 0; i < asteroids.length; i++) {
                const ast = asteroids[i];
                if (ast.velocity && ast.velocity.lengthSq() > 0.0001) {
                    ast.position.addScaledVector(ast.velocity, delta);
                    ast.velocity.multiplyScalar(Math.pow(0.985, delta * 60));
                }
            }
        }
    }

    destroyAsteroidDirect(targetAsteroid) {
        if (!targetAsteroid) return null;
        for (const chunkGroup of this.activeChunks.values()) {
            const asteroids = chunkGroup.userData.asteroids;
            if (!asteroids) continue;
            const idx = asteroids.indexOf(targetAsteroid);
            if (idx !== -1) {
                return this.destroyAsteroid(chunkGroup, idx);
            }
        }
        return null;
    }

    destroyAsteroid(chunkGroup, aIdx) {
        const ast = chunkGroup.userData.asteroids[aIdx];
        if (!ast) return null;

        const pos = ast.position.clone();
        const baseRadius = ast.radius;

        chunkGroup.remove(ast.mesh);
        this.removeAsteroidRotator(ast.mesh);
        chunkGroup.userData.asteroids.splice(aIdx, 1);

        const colors = [0xffb700, 0x00ffff, 0xffffff, 0xff00aa, 0x00ff88];
        const shardCount = Math.floor(22 + Math.random() * 8);

        for (let i = 0; i < shardCount; i++) {
            const geo = this.shardGeometries[Math.floor(Math.random() * this.shardGeometries.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const mat = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1.0
            });
            const shard = new THREE.LineSegments(geo, mat);

            const shardScale = 0.5 + Math.random() * (baseRadius * 0.22);
            shard.scale.set(shardScale, shardScale, shardScale);

            shard.position.copy(pos);
            this.fragmentGroup.add(shard);

            const speed = 30 + Math.random() * 95;
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(speed);

            this.explosionFragments.push({
                mesh: shard,
                vel: vel,
                rot: new THREE.Vector3(
                    (Math.random() - 0.5) * 14,
                    (Math.random() - 0.5) * 14,
                    (Math.random() - 0.5) * 14
                ),
                life: 2.2,
                radius: Math.max(2.8, shardScale * 1.6),
                scale: shardScale,
                canSplit: shardScale > 2.0
            });
        }

        const ringPoints = [];
        const segments = 36;
        for (let s = 0; s <= segments; s++) {
            const theta = (s / segments) * Math.PI * 2;
            ringPoints.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
        }
        const shockGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
        const shockMat = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.95
        });
        const shockRing = new THREE.Line(shockGeo, shockMat);
        shockRing.position.copy(pos);
        shockRing.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        this.fragmentGroup.add(shockRing);

        this.shockwaves.push({
            mesh: shockRing,
            radius: baseRadius * 0.5,
            expandRate: 95 + baseRadius * 4,
            maxRadius: baseRadius * 4.0 + 50,
            life: 1.0
        });

        return pos;
    }

    destroyFragment(fragIndex) {
        const frag = this.explosionFragments[fragIndex];
        if (!frag) return null;

        const pos = frag.mesh.position.clone();
        const scale = frag.scale || 1.0;
        const baseColor = (frag.mesh.material && frag.mesh.material.color) ? frag.mesh.material.color.getHex() : 0x00ffff;

        this.fragmentGroup.remove(frag.mesh);
        if (!this.shardGeometries.includes(frag.mesh.geometry)) {
            frag.mesh.geometry.dispose();
        }
        if (frag.mesh.material) {
            frag.mesh.material.dispose();
        }
        this.explosionFragments.splice(fragIndex, 1);

        if (frag.canSplit && scale > 1.8) {
            const subCount = Math.floor(3 + Math.random() * 2);
            for (let i = 0; i < subCount; i++) {
                const geo = this.shardGeometries[Math.floor(Math.random() * this.shardGeometries.length)];
                const mat = new THREE.LineBasicMaterial({
                    color: baseColor,
                    transparent: true,
                    opacity: 1.0
                });
                const subShard = new THREE.LineSegments(geo, mat);
                const subScale = scale * (0.35 + Math.random() * 0.25);
                subShard.scale.set(subScale, subScale, subScale);
                subShard.position.copy(pos);
                this.fragmentGroup.add(subShard);

                const speed = 45 + Math.random() * 75;
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(speed);

                this.explosionFragments.push({
                    mesh: subShard,
                    vel: vel,
                    rot: new THREE.Vector3(
                        (Math.random() - 0.5) * 18,
                        (Math.random() - 0.5) * 18,
                        (Math.random() - 0.5) * 18
                    ),
                    life: 1.2,
                    radius: Math.max(2.0, subScale * 1.5),
                    scale: subScale,
                    canSplit: false
                });
            }
        } else {
            const sparkPoints = [];
            const sparkCount = 6;
            for (let s = 0; s < sparkCount; s++) {
                sparkPoints.push(new THREE.Vector3(0, 0, 0));
                const dir = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(2.2 + Math.random() * 2.8);
                sparkPoints.push(dir);
            }
            const sparkGeo = new THREE.BufferGeometry().setFromPoints(sparkPoints);
            const sparkMat = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0
            });
            const spark = new THREE.LineSegments(sparkGeo, sparkMat);
            spark.position.copy(pos);
            this.fragmentGroup.add(spark);

            this.explosionFragments.push({
                mesh: spark,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 35,
                    (Math.random() - 0.5) * 35,
                    (Math.random() - 0.5) * 35
                ),
                rot: new THREE.Vector3(8, 8, 8),
                life: 0.4,
                radius: 0,
                scale: 0.4,
                canSplit: false
            });
        }

        const ringPoints = [];
        const segments = 16;
        for (let s = 0; s <= segments; s++) {
            const theta = (s / segments) * Math.PI * 2;
            ringPoints.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
        }
        const shockGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
        const shockMat = new THREE.LineBasicMaterial({
            color: 0xffea00,
            transparent: true,
            opacity: 0.95
        });
        const shockRing = new THREE.Line(shockGeo, shockMat);
        shockRing.position.copy(pos);
        shockRing.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        this.fragmentGroup.add(shockRing);

        this.shockwaves.push({
            mesh: shockRing,
            radius: 1.0,
            expandRate: 50,
            maxRadius: 15,
            life: 0.35
        });

        return pos;
    }

    updateExplosions(delta) {
        for (let i = this.explosionFragments.length - 1; i >= 0; i--) {
            const f = this.explosionFragments[i];
            f.life -= delta * 0.65;
            f.mesh.position.addScaledVector(f.vel, delta);
            f.mesh.rotation.x += f.rot.x * delta;
            f.mesh.rotation.y += f.rot.y * delta;
            f.mesh.rotation.z += f.rot.z * delta;
            if (f.mesh.material) {
                f.mesh.material.opacity = Math.max(0, f.life);
            }

            if (f.life <= 0) {
                this.fragmentGroup.remove(f.mesh);
                if (!this.shardGeometries.includes(f.mesh.geometry)) {
                    f.mesh.geometry.dispose();
                }
                if (f.mesh.material) {
                    f.mesh.material.dispose();
                }
                this.explosionFragments.splice(i, 1);
            }
        }

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.expandRate * delta;
            sw.mesh.scale.set(sw.radius, sw.radius, sw.radius);
            const fade = Math.max(0, 1 - (sw.radius / sw.maxRadius));
            if (sw.mesh.material) {
                sw.mesh.material.opacity = fade * 0.85;
            }

            if (sw.radius >= sw.maxRadius || fade <= 0) {
                this.fragmentGroup.remove(sw.mesh);
                sw.mesh.geometry.dispose();
                if (sw.mesh.material) {
                    sw.mesh.material.dispose();
                }
                this.shockwaves.splice(i, 1);
            }
        }
    }

    testProjectileCollisions(projectiles) {
        const hits = [];
        for (let pIdx = 0; pIdx < projectiles.length; pIdx++) {
            const p = projectiles[pIdx];
            if (p.life <= 0) continue;

            let hitOccurred = false;
            for (const chunkGroup of this.activeChunks.values()) {
                const asteroids = chunkGroup.userData.asteroids;
                if (!asteroids) continue;

                for (let aIdx = asteroids.length - 1; aIdx >= 0; aIdx--) {
                    const ast = asteroids[aIdx];
                    const hitRadius = ast.radius + 3.0;

                    const vX = p.pos.x - p.prevPos.x;
                    const vY = p.pos.y - p.prevPos.y;
                    const vZ = p.pos.z - p.prevPos.z;
                    const segLenSq = vX * vX + vY * vY + vZ * vZ;

                    let distSq;
                    if (segLenSq > 0.0001) {
                        const dX = ast.position.x - p.prevPos.x;
                        const dY = ast.position.y - p.prevPos.y;
                        const dZ = ast.position.z - p.prevPos.z;
                        const t = Math.max(0, Math.min(1, (dX * vX + dY * vY + dZ * vZ) / segLenSq));
                        const closeX = p.prevPos.x + t * vX;
                        const closeY = p.prevPos.y + t * vY;
                        const closeZ = p.prevPos.z + t * vZ;
                        const diffX = ast.position.x - closeX;
                        const diffY = ast.position.y - closeY;
                        const diffZ = ast.position.z - closeZ;
                        distSq = diffX * diffX + diffY * diffY + diffZ * diffZ;
                    } else {
                        distSq = p.pos.distanceToSquared(ast.position);
                    }

                    if (distSq < hitRadius * hitRadius) {
                        const hitPos = this.destroyAsteroid(chunkGroup, aIdx);
                        if (hitPos) {
                            hits.push({
                                type: 'asteroid',
                                position: hitPos
                            });
                        }
                        p.life = 0;
                        hitOccurred = true;
                        break;
                    }
                }
                if (hitOccurred) break;
            }

            if (hitOccurred) continue;

            for (let fIdx = this.explosionFragments.length - 1; fIdx >= 0; fIdx--) {
                const f = this.explosionFragments[fIdx];
                if (!f.radius || f.radius <= 0) continue;

                const fPos = f.mesh.position;
                const hitRadius = f.radius + 2.8;

                const vX = p.pos.x - p.prevPos.x;
                const vY = p.pos.y - p.prevPos.y;
                const vZ = p.pos.z - p.prevPos.z;
                const segLenSq = vX * vX + vY * vY + vZ * vZ;

                let distSq;
                if (segLenSq > 0.0001) {
                    const dX = fPos.x - p.prevPos.x;
                    const dY = fPos.y - p.prevPos.y;
                    const dZ = fPos.z - p.prevPos.z;
                    const t = Math.max(0, Math.min(1, (dX * vX + dY * vY + dZ * vZ) / segLenSq));
                    const closeX = p.prevPos.x + t * vX;
                    const closeY = p.prevPos.y + t * vY;
                    const closeZ = p.prevPos.z + t * vZ;
                    const diffX = fPos.x - closeX;
                    const diffY = fPos.y - closeY;
                    const diffZ = fPos.z - closeZ;
                    distSq = diffX * diffX + diffY * diffY + diffZ * diffZ;
                } else {
                    distSq = p.pos.distanceToSquared(fPos);
                }

                if (distSq < hitRadius * hitRadius) {
                    const hitPos = this.destroyFragment(fIdx);
                    if (hitPos) {
                        hits.push({
                            type: 'fragment',
                            position: hitPos
                        });
                    }
                    p.life = 0;
                    break;
                }
            }
        }
        return hits;
    }

    checkAsteroidCollisions(shipPos, shipRadius = 2.5) {
        for (const chunkGroup of this.activeChunks.values()) {
            const asteroids = chunkGroup.userData.asteroids;
            if (!asteroids) continue;
            for (let i = 0; i < asteroids.length; i++) {
                const ast = asteroids[i];
                const dx = shipPos.x - ast.position.x;
                const dy = shipPos.y - ast.position.y;
                const dz = shipPos.z - ast.position.z;
                const radiusSum = shipRadius + ast.radius;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < radiusSum * radiusSum) {
                    const dist = Math.sqrt(distSq) || 0.001;
                    const normal = this.scratchPos.set(dx / dist, dy / dist, dz / dist);
                    return {
                        collided: true,
                        normal: normal.clone(),
                        depth: radiusSum - dist
                    };
                }
            }
        }
        return null;
    }
}

