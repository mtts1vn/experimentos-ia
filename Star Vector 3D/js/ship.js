class PlayerShip {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.position = this.group.position;
        this.quaternion = this.group.quaternion;

        this.velocity = new THREE.Vector3();
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.maxNormalSpeed = 90;
        this.maxBoostSpeed = 190;
        this.accelerationRate = 50;
        this.decelerationRate = 40;
        this.damping = 0.985;

        this.pitchSpeed = 1.4;
        this.yawSpeed = 1.4;
        this.rollSpeed = 2.2;

        this.pitchInput = 0;
        this.yawInput = 0;
        this.rollInput = 0;
        this.throttleInput = 0;

        this.boostEnergy = 100;
        this.maxBoostEnergy = 100;
        this.isBoosting = false;

        this.cameraMode = 'chase';
        this.chaseOffset = new THREE.Vector3(0, 4.2, 12.5);
        this.chaseLookOffset = new THREE.Vector3(0, 0.8, -15);
        this.cockpitOffset = new THREE.Vector3(0, 0.9, -0.6);

        this.scratchVectorA = new THREE.Vector3();
        this.scratchVectorB = new THREE.Vector3();
        this.scratchVectorC = new THREE.Vector3();
        this.scratchQuat = new THREE.Quaternion();
        this.scratchEuler = new THREE.Euler(0, 0, 0, 'YXZ');

        this.thrusters = [];
        this.cockpitReticleMesh = null;
        this.occluderMat = new THREE.MeshBasicMaterial({
            color: 0x020206,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });

        this.visualGroup = new THREE.Group();
        this.group.add(this.visualGroup);

        this.hull = 100;
        this.maxHull = 100;
        this.isDestroyed = false;

        this.debrisGroup = new THREE.Group();
        this.scene.add(this.debrisGroup);
        this.debrisParticles = [];

        this.projectiles = [];
        this.projectileGroup = new THREE.Group();
        this.scene.add(this.projectileGroup);
        this.fireCooldown = 0;
        this.fireRate = 0.15;
        this.currentCannonSide = 1;
        this.laserMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });

        this.buildModel();
        this.reset();
    }

    reset() {
        this.position.set(0, 16, 45);
        this.quaternion.identity();
        this.velocity.set(0, 0, 0);
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.boostEnergy = 100;
        this.isBoosting = false;
    }

    buildModel() {
        const bodyGeo = new THREE.ConeGeometry(2.0, 7.5, 4);
        bodyGeo.rotateX(Math.PI / 2);
        bodyGeo.rotateZ(Math.PI / 4);

        const bodyMesh = new THREE.Mesh(bodyGeo, this.occluderMat);
        this.visualGroup.add(bodyMesh);

        const bodyEdges = new THREE.EdgesGeometry(bodyGeo);
        const bodyMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.95 });
        const bodyWire = new THREE.LineSegments(bodyEdges, bodyMat);
        bodyWire.position.set(0, 0, 0);
        this.visualGroup.add(bodyWire);

        const wingMeshGeo = new THREE.BufferGeometry();
        const wingVertices = new Float32Array([
            0, 0, -1.0, -6.5, -0.3, 3.2, -1.8, 0, 2.5,
            0, 0, -1.0, -1.8, 0, 2.5, -6.5, -0.3, 3.2,
            0, 0, -1.0, 1.8, 0, 2.5, 6.5, -0.3, 3.2,
            0, 0, -1.0, 6.5, -0.3, 3.2, 1.8, 0, 2.5,
            -6.5, -0.3, 3.2, -6.5, 1.2, 3.2, -1.8, 0, 2.5,
            -6.5, -0.3, 3.2, -1.8, 0, 2.5, -6.5, 1.2, 3.2,
            6.5, -0.3, 3.2, 1.8, 0, 2.5, 6.5, 1.2, 3.2,
            6.5, -0.3, 3.2, 6.5, 1.2, 3.2, 1.8, 0, 2.5
        ]);
        wingMeshGeo.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
        const wingMesh = new THREE.Mesh(wingMeshGeo, this.occluderMat);
        this.visualGroup.add(wingMesh);

        const wingPoints = [
            new THREE.Vector3(0, 0, -1.0),
            new THREE.Vector3(-6.5, -0.3, 3.2),
            new THREE.Vector3(-6.5, 1.2, 3.2),
            new THREE.Vector3(-1.8, 0, 2.5),
            new THREE.Vector3(0, 0, -1.0),

            new THREE.Vector3(0, 0, -1.0),
            new THREE.Vector3(6.5, -0.3, 3.2),
            new THREE.Vector3(6.5, 1.2, 3.2),
            new THREE.Vector3(1.8, 0, 2.5),
            new THREE.Vector3(0, 0, -1.0)
        ];
        const wingGeo = new THREE.BufferGeometry().setFromPoints(wingPoints);
        const wingMat = new THREE.LineBasicMaterial({ color: 0x00d4ff });
        const wings = new THREE.Line(wingGeo, wingMat);
        this.visualGroup.add(wings);

        const finMeshGeo = new THREE.BufferGeometry();
        const finVertices = new Float32Array([
            0, 0.5, 0.5, 0, 2.8, 3.2, 0, 0.4, 3.0,
            0, 0.5, 0.5, 0, 0.4, 3.0, 0, 2.8, 3.2
        ]);
        finMeshGeo.setAttribute('position', new THREE.BufferAttribute(finVertices, 3));
        const finMesh = new THREE.Mesh(finMeshGeo, this.occluderMat);
        this.visualGroup.add(finMesh);

        const finPoints = [
            new THREE.Vector3(0, 0.5, 0.5),
            new THREE.Vector3(0, 2.8, 3.2),
            new THREE.Vector3(0, 0.4, 3.0),
            new THREE.Vector3(0, 0.5, 0.5)
        ];
        const finGeo = new THREE.BufferGeometry().setFromPoints(finPoints);
        const finMat = new THREE.LineBasicMaterial({ color: 0xffaa00 });
        const fin = new THREE.Line(finGeo, finMat);
        this.visualGroup.add(fin);

        const canopyGeo = new THREE.BoxGeometry(1.0, 0.8, 2.2);
        const canopyMesh = new THREE.Mesh(canopyGeo, this.occluderMat);
        canopyMesh.position.set(0, 0.7, -0.8);
        this.visualGroup.add(canopyMesh);

        const canopyEdges = new THREE.EdgesGeometry(canopyGeo);
        const canopyMat = new THREE.LineBasicMaterial({ color: 0xffdd44 });
        const canopy = new THREE.LineSegments(canopyEdges, canopyMat);
        canopy.position.set(0, 0.7, -0.8);
        this.visualGroup.add(canopy);

        this.createThrusterNozzle(-1.3, -0.1, 3.6);
        this.createThrusterNozzle(1.3, -0.1, 3.6);

        this.buildCockpitInterior();
    }

    createThrusterNozzle(x, y, z) {
        const nozGeo = new THREE.CylinderGeometry(0.35, 0.55, 1.2, 6, 1, false);
        nozGeo.rotateX(Math.PI / 2);

        const nozMesh = new THREE.Mesh(nozGeo, this.occluderMat);
        nozMesh.position.set(x, y, z);
        this.visualGroup.add(nozMesh);

        const nozEdges = new THREE.EdgesGeometry(nozGeo);
        const nozMat = new THREE.LineBasicMaterial({ color: 0xff0066 });
        const nozzle = new THREE.LineSegments(nozEdges, nozMat);
        nozzle.position.set(x, y, z);
        this.visualGroup.add(nozzle);

        const flamePoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 2.4),
            new THREE.Vector3(-0.35, 0, 1.0),
            new THREE.Vector3(0.35, 0, 1.0),
            new THREE.Vector3(0, 0, 2.4),
            new THREE.Vector3(0, -0.35, 1.0),
            new THREE.Vector3(0, 0.35, 1.0),
            new THREE.Vector3(0, 0, 2.4)
        ];
        const flameGeo = new THREE.BufferGeometry().setFromPoints(flamePoints);
        const flameMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
        const flame = new THREE.LineSegments(flameGeo, flameMat);
        flame.position.set(x, y, z + 0.6);
        this.visualGroup.add(flame);
        this.thrusters.push(flame);
    }

    buildCockpitInterior() {
        const hudFramePoints = [
            new THREE.Vector3(-0.9, -0.6, -1.8),
            new THREE.Vector3(-0.7, 0.6, -1.8),
            new THREE.Vector3(0.7, 0.6, -1.8),
            new THREE.Vector3(0.9, -0.6, -1.8),
            new THREE.Vector3(-0.9, -0.6, -1.8)
        ];
        const hudGeo = new THREE.BufferGeometry().setFromPoints(hudFramePoints);
        const hudMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.45 });
        this.cockpitReticleMesh = new THREE.Line(hudGeo, hudMat);
        this.cockpitReticleMesh.visible = false;
        this.group.add(this.cockpitReticleMesh);
    }

    toggleCamera() {
        if (this.isDestroyed) return;
        this.cameraMode = this.cameraMode === 'chase' ? 'cockpit' : 'chase';
        this.cockpitReticleMesh.visible = (this.cameraMode === 'cockpit');
    }

    setInputs(pitch, yaw, roll, throttle, boost) {
        if (this.isDestroyed) return;
        this.pitchInput = pitch;
        this.yawInput = yaw;
        this.rollInput = roll;
        this.throttleInput = throttle;
        this.isBoosting = boost && this.boostEnergy > 5;
    }

    applyCollision(normal, depth) {
        if (this.isDestroyed) return { damage: 0, speed: 0 };

        this.position.addScaledVector(normal, depth + 0.6);

        const impactSpeed = Math.abs(this.currentSpeed);
        const damage = Math.max(14, Math.round(impactSpeed * 0.55));
        this.takeDamage(damage);

        this.targetSpeed = -this.targetSpeed * 0.45;
        this.currentSpeed = -this.currentSpeed * 0.45;

        this.scratchQuat.setFromAxisAngle(normal, 0.35);
        this.quaternion.multiply(this.scratchQuat);
        this.quaternion.normalize();

        return { damage, speed: impactSpeed };
    }

    takeDamage(amount) {
        if (this.isDestroyed) return;
        this.hull = Math.max(0, this.hull - amount);
        if (this.hull <= 0) {
            this.explode();
        }
    }

    explode() {
        this.isDestroyed = true;
        this.visualGroup.visible = false;
        this.cockpitReticleMesh.visible = false;
        this.currentSpeed = 0;
        this.targetSpeed = 0;

        const colors = [0x00f0ff, 0xffa500, 0xff0066, 0xffffff];
        const shardCount = 38;
        for (let i = 0; i < shardCount; i++) {
            const shardGeo = new THREE.BufferGeometry();
            const p1 = new THREE.Vector3(0, 0, 0);
            const p2 = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            );
            shardGeo.setFromPoints([p1, p2]);

            const mat = new THREE.LineBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 1.0
            });
            const line = new THREE.Line(shardGeo, mat);
            line.position.copy(this.position);
            this.debrisGroup.add(line);

            const speed = 12 + Math.random() * 32;
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(speed);

            this.debrisParticles.push({
                mesh: line,
                vel: vel,
                rot: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
                life: 1.0
            });
        }
    }

    updateDebris(delta) {
        for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
            const d = this.debrisParticles[i];
            d.life -= delta * 0.42;
            d.mesh.position.addScaledVector(d.vel, delta);
            d.mesh.rotation.x += d.rot.x * delta;
            d.mesh.rotation.y += d.rot.y * delta;
            d.mesh.material.opacity = Math.max(0, d.life);

            if (d.life <= 0) {
                this.debrisGroup.remove(d.mesh);
                d.mesh.geometry.dispose();
                d.mesh.material.dispose();
                this.debrisParticles.splice(i, 1);
            }
        }
    }

    fire(aimPoint) {
        if (this.isDestroyed || this.fireCooldown > 0) return false;
        this.fireCooldown = this.fireRate;

        const offset = this.scratchVectorA.set(this.currentCannonSide * 5.6, -0.1, 1.2);
        this.currentCannonSide *= -1;

        const spawnPos = offset.applyQuaternion(this.quaternion).add(this.position);
        const fireDir = this.scratchVectorB;
        if (aimPoint) {
            fireDir.copy(aimPoint).sub(spawnPos).normalize();
        } else {
            this.getForwardVector(fireDir);
        }

        const boltPoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -10.0)
        ];
        const boltGeo = new THREE.BufferGeometry().setFromPoints(boltPoints);
        const bolt = new THREE.Line(boltGeo, this.laserMat);
        bolt.position.copy(spawnPos);
        bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), fireDir);
        this.projectileGroup.add(bolt);

        const speed = Math.max(0, this.currentSpeed) + 480;
        const vel = fireDir.clone().multiplyScalar(speed);

        this.projectiles.push({
            mesh: bolt,
            pos: bolt.position,
            prevPos: spawnPos.clone(),
            vel: vel,
            life: 2.0
        });

        this.currentSpeed = Math.max(-20, this.currentSpeed - 1.2);
        return true;
    }

    updateProjectiles(delta) {
        if (this.fireCooldown > 0) {
            this.fireCooldown -= delta;
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= delta;
            p.prevPos.copy(p.pos);
            p.pos.addScaledVector(p.vel, delta);

            if (p.life <= 0) {
                this.projectileGroup.remove(p.mesh);
                p.mesh.geometry.dispose();
                this.projectiles.splice(i, 1);
            }
        }
    }

    respawn() {
        this.reset();
        this.hull = 100;
        this.isDestroyed = false;
        this.visualGroup.visible = true;
        this.cameraMode = 'chase';

        for (let i = 0; i < this.debrisParticles.length; i++) {
            const d = this.debrisParticles[i];
            this.debrisGroup.remove(d.mesh);
            d.mesh.geometry.dispose();
            d.mesh.material.dispose();
        }
        this.debrisParticles = [];

        for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            this.projectileGroup.remove(p.mesh);
            p.mesh.geometry.dispose();
        }
        this.projectiles = [];
    }

    update(delta) {
        this.updateDebris(delta);
        this.updateProjectiles(delta);

        if (this.isDestroyed) {
            this.updateCamera(delta);
            return;
        }
        if (this.isBoosting) {
            this.boostEnergy = Math.max(0, this.boostEnergy - delta * 35);
            if (this.boostEnergy <= 0) this.isBoosting = false;
        } else {
            this.boostEnergy = Math.min(this.maxBoostEnergy, this.boostEnergy + delta * 15);
        }

        const maxSpeed = this.isBoosting ? this.maxBoostSpeed : this.maxNormalSpeed;
        if (this.throttleInput > 0) {
            this.targetSpeed = Math.min(maxSpeed, this.targetSpeed + this.accelerationRate * delta * (this.isBoosting ? 2.5 : 1.0));
        } else if (this.throttleInput < 0) {
            this.targetSpeed = Math.max(-20, this.targetSpeed - this.decelerationRate * delta);
        } else {
            this.targetSpeed *= Math.pow(this.damping, delta * 60);
        }

        this.currentSpeed += (this.targetSpeed - this.currentSpeed) * Math.min(1.0, delta * 8.0);

        const pitchDelta = this.pitchInput * this.pitchSpeed * delta;
        const yawDelta = this.yawInput * this.yawSpeed * delta;
        const rollDelta = this.rollInput * this.rollSpeed * delta;

        this.scratchQuat.setFromAxisAngle(this.scratchVectorA.set(1, 0, 0), pitchDelta);
        this.quaternion.multiply(this.scratchQuat);

        this.scratchQuat.setFromAxisAngle(this.scratchVectorB.set(0, 1, 0), yawDelta);
        this.quaternion.multiply(this.scratchQuat);

        this.scratchQuat.setFromAxisAngle(this.scratchVectorC.set(0, 0, 1), rollDelta);
        this.quaternion.multiply(this.scratchQuat);

        this.quaternion.normalize();

        const forwardDir = this.scratchVectorA.set(0, 0, -1).applyQuaternion(this.quaternion);
        this.velocity.copy(forwardDir).multiplyScalar(this.currentSpeed);
        this.position.addScaledVector(this.velocity, delta);

        this.updateThrusters(delta);
        this.updateCamera(delta);
    }

    updateThrusters(delta) {
        const throttleRatio = Math.max(0.15, Math.abs(this.currentSpeed) / this.maxNormalSpeed);
        const boostMultiplier = this.isBoosting ? 2.2 : 1.0;
        const flameLength = throttleRatio * boostMultiplier * (0.8 + Math.random() * 0.4);

        for (let i = 0; i < this.thrusters.length; i++) {
            const thruster = this.thrusters[i];
            thruster.scale.set(1.0, 1.0, flameLength);
            thruster.material.opacity = Math.min(1.0, 0.4 + throttleRatio * 0.6);
            if (this.isBoosting) {
                thruster.material.color.setHex(0xffffff);
            } else {
                thruster.material.color.setHex(0x00ffff);
            }
        }
    }

    updateCamera(delta) {
        if (this.cameraMode === 'cockpit' && !this.isDestroyed) {
            const eyePos = this.scratchVectorA.copy(this.cockpitOffset).applyQuaternion(this.quaternion).add(this.position);
            this.camera.position.copy(eyePos);
            this.camera.quaternion.copy(this.quaternion);
        } else {
            const targetCamPos = this.scratchVectorA.copy(this.chaseOffset).applyQuaternion(this.quaternion).add(this.position);
            const targetLookAt = this.scratchVectorB.copy(this.chaseLookOffset).applyQuaternion(this.quaternion).add(this.position);

            this.camera.position.lerp(targetCamPos, Math.min(1.0, delta * 12.0));
            this.camera.up.set(0, 1, 0).applyQuaternion(this.quaternion);
            this.camera.lookAt(targetLookAt);
        }
    }

    getForwardVector(outVector) {
        return outVector.set(0, 0, -1).applyQuaternion(this.quaternion);
    }
}

