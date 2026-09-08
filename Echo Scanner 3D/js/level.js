class EchoLevel {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.beacons = [];
        this.exitGate = null;
        this.exitActive = false;

        this.blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        this.buildLevel();
    }

    addBox(x, y, z, w, h, d, type = 'wall') {
        const geom = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geom, this.blackMat);
        mesh.position.set(x, y, z);
        mesh.userData = { type: type, w: w, h: h, d: d };
        this.scene.add(mesh);
        this.colliders.push(mesh);
        return mesh;
    }

    addCylinder(x, y, z, rTop, rBot, h, type = 'pillar') {
        const geom = new THREE.CylinderGeometry(rTop, rBot, h, 16);
        const mesh = new THREE.Mesh(geom, this.blackMat);
        mesh.position.set(x, y, z);
        mesh.userData = { type: type };
        this.scene.add(mesh);
        this.colliders.push(mesh);
        return mesh;
    }

    buildLevel() {
        this.addBox(0, -0.5, 0, 120, 1, 120, 'floor');
        this.addBox(0, 8.5, 0, 120, 1, 120, 'ceiling');

        this.addBox(0, 4, -60, 120, 8, 2, 'wall');
        this.addBox(0, 4, 60, 120, 8, 2, 'wall');
        this.addBox(-60, 4, 0, 2, 8, 120, 'wall');
        this.addBox(60, 4, 0, 2, 8, 120, 'wall');

        const pillarPositions = [
            [-12, -12], [12, -12], [-12, 12], [12, 12],
            [-6, -6], [6, -6], [-6, 6], [6, 6]
        ];
        pillarPositions.forEach(([px, pz]) => {
            this.addCylinder(px, 4, pz, 1.2, 1.2, 8, 'pillar');
        });

        this.addBox(0, 4, -18, 20, 8, 2, 'wall');
        this.addBox(0, 4, 18, 20, 8, 2, 'wall');
        this.addBox(-18, 4, 0, 2, 8, 20, 'wall');
        this.addBox(18, 4, 0, 2, 8, 20, 'wall');

        this.addBox(35, 4, -25, 40, 8, 2, 'wall');
        this.addBox(35, 4, 0, 2, 8, 30, 'wall');
        this.addBox(42, 4, 25, 30, 8, 2, 'wall');

        this.addBox(-35, 4, -25, 40, 8, 2, 'wall');
        this.addBox(-35, 4, 0, 2, 8, 30, 'wall');
        this.addBox(-42, 4, 25, 30, 8, 2, 'wall');

        this.addBox(0, 4, -40, 50, 8, 2, 'wall');
        this.addBox(-25, 4, -50, 2, 8, 20, 'wall');
        this.addBox(25, 4, -50, 2, 8, 20, 'wall');

        this.addBox(0, 4, 38, 40, 8, 2, 'wall');
        this.addBox(-20, 4, 48, 2, 8, 20, 'wall');
        this.addBox(20, 4, 48, 2, 8, 20, 'wall');

        this.addBox(-45, 1, -45, 12, 2, 12, 'platform');
        this.addBox(-45, 2, -45, 6, 2, 6, 'platform');
        this.addBox(45, 1, -45, 12, 2, 12, 'platform');
        this.addBox(45, 2, -45, 6, 2, 6, 'platform');

        this.addCylinder(-45, 4, 15, 1.8, 1.8, 8, 'pillar');
        this.addCylinder(45, 4, 15, 1.8, 1.8, 8, 'pillar');
        this.addCylinder(-35, 4, -45, 1.5, 1.5, 8, 'pillar');
        this.addCylinder(35, 4, -45, 1.5, 1.5, 8, 'pillar');

        this.createBeacon(-48, 2.5, -48, 'Alfa');
        this.createBeacon(48, 2.5, -48, 'Beta');
        this.createBeacon(0, 1.5, -52, 'Gama');

        this.createExitGate(0, 3, 54);
    }

    createBeacon(x, y, z, name) {
        const pedGeom = new THREE.CylinderGeometry(0.8, 1.1, 1.2, 8);
        const pedestal = new THREE.Mesh(pedGeom, this.blackMat);
        pedestal.position.set(x, y - 0.6, z);
        pedestal.userData = { type: 'beacon_pedestal' };
        this.scene.add(pedestal);
        this.colliders.push(pedestal);

        const crystalGeom = new THREE.OctahedronGeometry(0.8, 0);
        const crystal = new THREE.Mesh(crystalGeom, this.blackMat);
        crystal.position.set(x, y + 0.6, z);
        crystal.userData = { type: 'beacon_crystal', beaconId: name };
        this.scene.add(crystal);
        this.colliders.push(crystal);

        this.beacons.push({
            name: name,
            x: x,
            y: y + 0.6,
            z: z,
            mesh: crystal,
            collected: false
        });
    }

    createExitGate(x, y, z) {
        const archGeom = new THREE.BoxGeometry(8, 6, 2);
        const archMesh = new THREE.Mesh(archGeom, this.blackMat);
        archMesh.position.set(x, y, z);
        archMesh.userData = { type: 'exit_arch' };
        this.scene.add(archMesh);
        this.colliders.push(archMesh);

        this.exitGate = {
            x: x,
            y: y,
            z: z,
            active: false
        };
    }

    checkBeaconCollection(playerPos, radius = 2.5) {
        for (const beacon of this.beacons) {
            if (!beacon.collected) {
                const dist = Math.hypot(playerPos.x - beacon.x, playerPos.z - beacon.z);
                if (dist < radius) {
                    beacon.collected = true;
                    if (beacon.mesh) {
                        this.scene.remove(beacon.mesh);
                        const idx = this.colliders.indexOf(beacon.mesh);
                        if (idx !== -1) this.colliders.splice(idx, 1);
                    }
                    return beacon;
                }
            }
        }
        return null;
    }

    allBeaconsCollected() {
        return this.beacons.every(b => b.collected);
    }

    checkExit(playerPos, radius = 3.0) {
        if (!this.exitGate || !this.exitGate.active) return false;
        const dist = Math.hypot(playerPos.x - this.exitGate.x, playerPos.z - this.exitGate.z);
        return dist < radius;
    }

    activateExit() {
        if (this.exitGate) {
            this.exitGate.active = true;
        }
    }
}

window.EchoLevel = EchoLevel;

