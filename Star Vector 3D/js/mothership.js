class Mothership {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.position = this.group.position;
        this.quaternion = this.group.quaternion;
        this.position.set(0, 0, 0);

        this.dockingPadLocal = new THREE.Vector3(0, 10.5, 12);
        this.dockingWorldPos = new THREE.Vector3();
        this.dockingRadius = 45;

        this.runwayLights = [];
        this.radarAntenna = null;
        this.beaconWave = null;
        this.beaconScale = 1;

        this.scratchVecA = new THREE.Vector3();
        this.scratchVecB = new THREE.Vector3();
        this.scratchVecC = new THREE.Vector3();

        this.occluderMat = new THREE.MeshBasicMaterial({
            color: 0x020206,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });

        this.buildModel();
    }

    buildModel() {
        const hullGeo = new THREE.BoxGeometry(65, 28, 260);
        const hullMesh = new THREE.Mesh(hullGeo, this.occluderMat);
        hullMesh.position.set(0, 0, 0);
        this.group.add(hullMesh);

        const hullEdges = new THREE.EdgesGeometry(hullGeo);
        const hullMat = new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.9 });
        const hull = new THREE.LineSegments(hullEdges, hullMat);
        hull.position.set(0, 0, 0);
        this.group.add(hull);

        const bowGeo = new THREE.ConeGeometry(38, 70, 4);
        bowGeo.rotateX(Math.PI / 2);
        bowGeo.rotateZ(Math.PI / 4);

        const bowMesh = new THREE.Mesh(bowGeo, this.occluderMat);
        bowMesh.position.set(0, 0, -165);
        this.group.add(bowMesh);

        const bowEdges = new THREE.EdgesGeometry(bowGeo);
        const bowMat = new THREE.LineBasicMaterial({ color: 0x00ffaa });
        const bow = new THREE.LineSegments(bowEdges, bowMat);
        bow.position.set(0, 0, -165);
        this.group.add(bow);

        const deckGeo = new THREE.BoxGeometry(42, 4, 180);
        const deckMesh = new THREE.Mesh(deckGeo, this.occluderMat);
        deckMesh.position.set(0, 12, 10);
        this.group.add(deckMesh);

        const deckEdges = new THREE.EdgesGeometry(deckGeo);
        const deckMat = new THREE.LineBasicMaterial({ color: 0xffd700 });
        const flightDeck = new THREE.LineSegments(deckEdges, deckMat);
        flightDeck.position.set(0, 12, 10);
        this.group.add(flightDeck);

        for (let z = -65; z <= 85; z += 25) {
            const archPoints = [
                new THREE.Vector3(-22, 12, z),
                new THREE.Vector3(-22, 26, z),
                new THREE.Vector3(-14, 32, z),
                new THREE.Vector3(14, 32, z),
                new THREE.Vector3(22, 26, z),
                new THREE.Vector3(22, 12, z)
            ];
            const archGeo = new THREE.BufferGeometry().setFromPoints(archPoints);
            const archMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 });
            const arch = new THREE.Line(archGeo, archMat);
            this.group.add(arch);

            const lightGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-19, 13.5, z),
                new THREE.Vector3(-19, 14.5, z),
                new THREE.Vector3(19, 13.5, z),
                new THREE.Vector3(19, 14.5, z)
            ]);
            const lightMat = new THREE.LineBasicMaterial({ color: 0x00ff88 });
            const light = new THREE.LineSegments(lightGeo, lightMat);
            this.group.add(light);
            this.runwayLights.push(light);
        }

        const bridgeGeo = new THREE.BoxGeometry(26, 32, 44);
        const bridgeMesh = new THREE.Mesh(bridgeGeo, this.occluderMat);
        bridgeMesh.position.set(0, 30, 95);
        this.group.add(bridgeMesh);

        const bridgeEdges = new THREE.EdgesGeometry(bridgeGeo);
        const bridgeMat = new THREE.LineBasicMaterial({ color: 0x00e5ff });
        const bridge = new THREE.LineSegments(bridgeEdges, bridgeMat);
        bridge.position.set(0, 30, 95);
        this.group.add(bridge);

        const towerGeo = new THREE.CylinderGeometry(2, 6, 28, 4);
        const towerMesh = new THREE.Mesh(towerGeo, this.occluderMat);
        towerMesh.position.set(0, 56, 95);
        this.group.add(towerMesh);

        const towerEdges = new THREE.EdgesGeometry(towerGeo);
        const towerMat = new THREE.LineBasicMaterial({ color: 0xffaa00 });
        const tower = new THREE.LineSegments(towerEdges, towerMat);
        tower.position.set(0, 56, 95);
        this.group.add(tower);

        const dishGeo = new THREE.CircleGeometry(10, 8);
        const dishEdges = new THREE.EdgesGeometry(dishGeo);
        const dishMat = new THREE.LineBasicMaterial({ color: 0xffdd44 });
        this.radarAntenna = new THREE.LineSegments(dishEdges, dishMat);
        this.radarAntenna.position.set(0, 70, 95);
        this.group.add(this.radarAntenna);

        this.createEngineBlock(-22, -2, 135);
        this.createEngineBlock(22, -2, 135);

        const waveGeo = new THREE.IcosahedronGeometry(20, 1);
        const waveEdges = new THREE.EdgesGeometry(waveGeo);
        const waveMat = new THREE.LineBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.35 });
        this.beaconWave = new THREE.LineSegments(waveEdges, waveMat);
        this.beaconWave.position.set(0, 70, 95);
        this.group.add(this.beaconWave);

        this.buildWarpCore();
        this.buildDefenseTurrets();
        this.setupCollisionBoxes();
    }

    buildWarpCore() {
        this.warpCore = new THREE.Group();
        this.warpCore.position.set(0, -18, 10);

        const coreGeo = new THREE.OctahedronGeometry(8, 0);
        const coreEdges = new THREE.EdgesGeometry(coreGeo);
        const coreMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 });
        const coreMesh = new THREE.LineSegments(coreEdges, coreMat);
        this.warpCore.add(coreMesh);

        for (let r = 0; r < 3; r++) {
            const ringRadius = 12 + r * 3.5;
            const ringGeo = new THREE.BufferGeometry();
            const points = [];
            for (let s = 0; s <= 32; s++) {
                const a = (s / 32) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(a) * ringRadius, 0, Math.sin(a) * ringRadius));
            }
            ringGeo.setFromPoints(points);
            const ringMat = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.7 });
            const ring = new THREE.Line(ringGeo, ringMat);
            ring.rotation.x = 0.3 * (r + 1);
            this.warpCore.add(ring);
        }

        this.group.add(this.warpCore);
    }

    buildDefenseTurrets() {
        const turretPositions = [
            new THREE.Vector3(-35, 8, 30),
            new THREE.Vector3(35, 8, 30),
            new THREE.Vector3(-35, 8, -50),
            new THREE.Vector3(35, 8, -50)
        ];

        for (let i = 0; i < turretPositions.length; i++) {
            const pos = turretPositions[i];
            const baseGeo = new THREE.CylinderGeometry(3, 4, 3, 6);
            const baseEdges = new THREE.EdgesGeometry(baseGeo);
            const baseMat = new THREE.LineBasicMaterial({ color: 0xffb700 });
            const base = new THREE.LineSegments(baseEdges, baseMat);
            base.position.copy(pos);
            this.group.add(base);

            const barrelPoints = [
                new THREE.Vector3(pos.x, pos.y + 1.5, pos.z),
                new THREE.Vector3(pos.x + (pos.x > 0 ? 6 : -6), pos.y + 2.5, pos.z - 4)
            ];
            const barrelGeo = new THREE.BufferGeometry().setFromPoints(barrelPoints);
            const barrelMat = new THREE.LineBasicMaterial({ color: 0x00f0ff });
            const barrel = new THREE.Line(barrelGeo, barrelMat);
            this.group.add(barrel);
        }
    }

    setupCollisionBoxes() {
        this.collisionBoxes = [
            { min: new THREE.Vector3(-33, -14, -135), max: new THREE.Vector3(33, 14, 135) },
            { min: new THREE.Vector3(-22, -18, -200), max: new THREE.Vector3(22, 18, -135) },
            { min: new THREE.Vector3(-14, 14, 70), max: new THREE.Vector3(14, 48, 120) },
            { min: new THREE.Vector3(-5, 48, 88), max: new THREE.Vector3(5, 72, 102) },
            { min: new THREE.Vector3(-34, -12, 115), max: new THREE.Vector3(-10, 12, 160) },
            { min: new THREE.Vector3(10, -12, 115), max: new THREE.Vector3(34, 12, 160) }
        ];

        this.landingZone = {
            min: new THREE.Vector3(-20, 10, -65),
            max: new THREE.Vector3(20, 36, 85)
        };
    }

    checkCollision(shipPos, shipRadius = 2.5, shipSpeed = 0) {
        const localPos = this.scratchVecA.copy(shipPos).sub(this.position);
        const invQuat = this.scratchVecB;
        invQuat.set(0, 0, 0);

        const isInsideLandingZone = (
            localPos.x >= this.landingZone.min.x && localPos.x <= this.landingZone.max.x &&
            localPos.y >= this.landingZone.min.y && localPos.y <= this.landingZone.max.y &&
            localPos.z >= this.landingZone.min.z && localPos.z <= this.landingZone.max.z
        );

        if (isInsideLandingZone && Math.abs(shipSpeed) <= 38) {
            return null;
        }

        for (let i = 0; i < this.collisionBoxes.length; i++) {
            const box = this.collisionBoxes[i];
            const cx = Math.max(box.min.x, Math.min(box.max.x, localPos.x));
            const cy = Math.max(box.min.y, Math.min(box.max.y, localPos.y));
            const cz = Math.max(box.min.z, Math.min(box.max.z, localPos.z));

            const distSq = (localPos.x - cx) ** 2 + (localPos.y - cy) ** 2 + (localPos.z - cz) ** 2;
            if (distSq < shipRadius * shipRadius) {
                const dist = Math.sqrt(distSq) || 0.001;
                const localNormal = this.scratchVecC.set(
                    (localPos.x - cx) / dist,
                    (localPos.y - cy) / dist,
                    (localPos.z - cz) / dist
                );
                if (localNormal.lengthSq() < 0.1) {
                    localNormal.set(0, 1, 0);
                }
                const worldNormal = localNormal.applyQuaternion(this.quaternion);
                return {
                    collided: true,
                    normal: worldNormal.clone(),
                    depth: shipRadius - dist
                };
            }
        }
        return null;
    }

    createEngineBlock(x, y, z) {
        const engGeo = new THREE.CylinderGeometry(14, 18, 40, 8);
        engGeo.rotateX(Math.PI / 2);

        const engMesh = new THREE.Mesh(engGeo, this.occluderMat);
        engMesh.position.set(x, y, z);
        this.group.add(engMesh);

        const engEdges = new THREE.EdgesGeometry(engGeo);
        const engMat = new THREE.LineBasicMaterial({ color: 0xff0077 });
        const eng = new THREE.LineSegments(engEdges, engMat);
        eng.position.set(x, y, z);
        this.group.add(eng);

        const glowPoints = [
            new THREE.Vector3(x, y, z + 20),
            new THREE.Vector3(x - 6, y, z + 32),
            new THREE.Vector3(x + 6, y, z + 32),
            new THREE.Vector3(x, y, z + 20),
            new THREE.Vector3(x, y - 6, z + 32),
            new THREE.Vector3(x, y + 6, z + 32),
            new THREE.Vector3(x, y, z + 20)
        ];
        const glowGeo = new THREE.BufferGeometry().setFromPoints(glowPoints);
        const glowMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
        const glow = new THREE.Line(glowGeo, glowMat);
        this.group.add(glow);
    }

    getDockingWorldPosition(outVector) {
        return outVector.copy(this.dockingPadLocal).applyQuaternion(this.quaternion).add(this.position);
    }

    checkDockingStatus(shipPos, shipForward, shipSpeed) {
        this.getDockingWorldPosition(this.dockingWorldPos);
        const dist = shipPos.distanceTo(this.dockingWorldPos);

        if (dist > this.dockingRadius) {
            return { inRange: false, readyToDock: false, distance: dist, alignment: 0 };
        }

        const runwayForward = this.scratchVecA.set(0, 0, -1).applyQuaternion(this.quaternion);
        const dot = shipForward.dot(runwayForward);
        const alignment = Math.max(0, dot);
        const slowEnough = Math.abs(shipSpeed) <= 35;
        const readyToDock = dist < 22 && alignment > 0.65 && slowEnough;

        return {
            inRange: true,
            readyToDock: readyToDock,
            distance: dist,
            alignment: alignment
        };
    }

    dock(ship) {
        this.getDockingWorldPosition(this.dockingWorldPos);
        ship.position.copy(this.dockingWorldPos);
        ship.quaternion.copy(this.quaternion);
        ship.velocity.set(0, 0, 0);
        ship.currentSpeed = 0;
        ship.targetSpeed = 0;
        ship.boostEnergy = ship.maxBoostEnergy;
    }

    undock(ship) {
        const forward = this.scratchVecA.set(0, 0, -1).applyQuaternion(this.quaternion);
        ship.position.addScaledVector(forward, 25);
        ship.velocity.copy(forward).multiplyScalar(65);
        ship.currentSpeed = 65;
        ship.targetSpeed = 65;
        ship.boostEnergy = ship.maxBoostEnergy;
    }

    update(delta, time) {
        if (this.radarAntenna) {
            this.radarAntenna.rotation.y += delta * 1.2;
        }

        if (this.warpCore) {
            this.warpCore.rotation.y += delta * 1.5;
            this.warpCore.rotation.z += delta * 0.7;
        }

        if (this.beaconWave) {
            this.beaconScale += delta * 18.0;
            if (this.beaconScale > 45.0) {
                this.beaconScale = 1.0;
            }
            this.beaconWave.scale.set(this.beaconScale, this.beaconScale, this.beaconScale);
            this.beaconWave.material.opacity = Math.max(0, 0.45 * (1 - this.beaconScale / 45.0));
        }

        const lightSequence = Math.floor(time * 6) % this.runwayLights.length;
        for (let i = 0; i < this.runwayLights.length; i++) {
            const light = this.runwayLights[i];
            if (i === lightSequence) {
                light.material.color.setHex(0xffffff);
            } else {
                light.material.color.setHex(0x00ff88);
            }
        }
    }
}

