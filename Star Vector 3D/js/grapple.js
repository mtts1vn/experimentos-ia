class GrappleSystem {
    constructor(scene, ship, camera, world, audio, game) {
        this.scene = scene;
        this.ship = ship;
        this.camera = camera;
        this.world = world;
        this.audio = audio;
        this.game = game;

        this.pendingState = 'IDLE';
        this.isRightMouseDown = false;
        this.isReeling = false;

        this.maxTethers = 8;
        this.pool = [];
        this.activeTethers = [];

        this.pendingSlot = null;
        this.pendingHookVelA = new THREE.Vector3();
        this.pendingHookVelB = new THREE.Vector3();
        this.pendingHookPrevPosA = new THREE.Vector3();
        this.pendingHookPrevPosB = new THREE.Vector3();
        this.pendingIntendedTargetA = null;
        this.pendingIntendedTargetB = null;
        this.pendingSecondAim = null;

        this.shipAnchorOffset = new THREE.Vector3(0, -0.6, -2.5);
        this.shipAnchorWorld = new THREE.Vector3();

        this.hookSpeed = 640.0;
        this.maxDistance = 550.0;
        this.retractSpeed = 680.0;
        this.reelContractSpeed = 120.0;

        this.nodeCount = 16;
        this.curveSampleCount = 32;
        this.braidRadius = 0.42;
        this.twistRate = 0.72;

        this.scratchVecA = new THREE.Vector3();
        this.scratchVecB = new THREE.Vector3();
        this.scratchVecC = new THREE.Vector3();
        this.scratchVecD = new THREE.Vector3();
        this.scratchQuatA = new THREE.Quaternion();
        this.scratchQuatB = new THREE.Quaternion();
        this.scratchTang = new THREE.Vector3();
        this.scratchNorm = new THREE.Vector3();
        this.scratchBinorm = new THREE.Vector3();
        this.scratchUp = new THREE.Vector3(0, 1, 0);
        this.scratchAltUp = new THREE.Vector3(1, 0, 0);

        this.initPool();
        this.reset();
    }

    get state() {
        return this.pendingState;
    }

    createHookMesh(wireColor) {
        const group = new THREE.Group();

        const spikeGeo = new THREE.ConeGeometry(0.7, 3.2, 5, 1, false);
        spikeGeo.rotateX(-Math.PI / 2);

        const spikeOccluder = new THREE.Mesh(spikeGeo, this.ship.occluderMat);
        group.add(spikeOccluder);

        const spikeEdges = new THREE.EdgesGeometry(spikeGeo);
        const spikeMat = new THREE.LineBasicMaterial({ color: wireColor });
        const spikeWire = new THREE.LineSegments(spikeEdges, spikeMat);
        group.add(spikeWire);

        const clawPoints = [];
        const clawCount = 4;
        for (let i = 0; i < clawCount; i++) {
            const angle = (i / clawCount) * Math.PI * 2;
            const x0 = Math.cos(angle) * 0.4;
            const y0 = Math.sin(angle) * 0.4;
            const z0 = -0.6;

            const xMid = Math.cos(angle) * 1.5;
            const yMid = Math.sin(angle) * 1.5;
            const zMid = 0.5;

            const xTip = Math.cos(angle) * 1.8;
            const yTip = Math.sin(angle) * 1.8;
            const zTip = 1.3;

            clawPoints.push(new THREE.Vector3(x0, y0, z0));
            clawPoints.push(new THREE.Vector3(xMid, yMid, zMid));

            clawPoints.push(new THREE.Vector3(xMid, yMid, zMid));
            clawPoints.push(new THREE.Vector3(xTip, yTip, zTip));
        }

        const clawGeo = new THREE.BufferGeometry().setFromPoints(clawPoints);
        const clawMat = new THREE.LineBasicMaterial({ color: 0x00f0ff });
        const clawWire = new THREE.LineSegments(clawGeo, clawMat);
        group.add(clawWire);

        group.visible = false;
        this.scene.add(group);
        return group;
    }

    initPool() {
        const m = this.curveSampleCount;
        const strandLines = 3 * (m - 1);
        const ringLines = 3 * m;
        const diagonalLines = 3 * (m - 1);
        const totalSegments = strandLines + ringLines + diagonalLines;
        const vertexCount = totalSegments * 2;

        for (let idx = 0; idx < this.maxTethers; idx++) {
            const nodes = [];
            for (let i = 0; i < this.nodeCount; i++) {
                nodes.push({
                    pos: new THREE.Vector3(),
                    oldPos: new THREE.Vector3()
                });
            }

            const curvePoints = [];
            for (let i = 0; i < m; i++) {
                curvePoints.push(new THREE.Vector3());
            }

            const strandPoints = [[], [], []];
            for (let k = 0; k < 3; k++) {
                for (let i = 0; i < m; i++) {
                    strandPoints[k].push(new THREE.Vector3());
                }
            }

            const ropePositions = new Float32Array(vertexCount * 3);
            const ropeGeometry = new THREE.BufferGeometry();
            ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));

            const ropeMaterial = new THREE.LineBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.92,
                blending: THREE.AdditiveBlending
            });

            const ropeMesh = new THREE.LineSegments(ropeGeometry, ropeMaterial);
            ropeMesh.frustumCulled = false;
            ropeMesh.visible = false;
            this.scene.add(ropeMesh);

            const hookMeshA = this.createHookMesh(0xffaa00);
            const hookMeshB = this.createHookMesh(0x00f0ff);

            this.pool.push({
                id: idx,
                active: false,
                type: 'DUAL',
                anchorA: {
                    target: null,
                    isMothership: false,
                    localOffset: new THREE.Vector3(),
                    worldPos: new THREE.Vector3()
                },
                anchorB: {
                    target: null,
                    isMothership: false,
                    localOffset: new THREE.Vector3(),
                    worldPos: new THREE.Vector3()
                },
                hookPosA: new THREE.Vector3(),
                hookPosB: new THREE.Vector3(),
                restLength: 70.0,
                minRestLength: 0.5,
                cableStiffness: 280.0,
                cableDamping: 18.0,
                nodes: nodes,
                curvePoints: curvePoints,
                strandPoints: strandPoints,
                ropePositions: ropePositions,
                ropeGeometry: ropeGeometry,
                ropeMaterial: ropeMaterial,
                ropeMesh: ropeMesh,
                hookMeshA: hookMeshA,
                hookMeshB: hookMeshB
            });
        }
    }

    obtainSlot() {
        for (let i = 0; i < this.pool.length; i++) {
            const slot = this.pool[i];
            if (!slot.active && slot !== this.pendingSlot) {
                return slot;
            }
        }
        return null;
    }

    releaseSlot(slot) {
        if (!slot) return;
        slot.active = false;
        slot.anchorA.target = null;
        slot.anchorB.target = null;
        slot.ropeMesh.visible = false;
        slot.hookMeshA.visible = false;
        slot.hookMeshB.visible = false;

        const idx = this.activeTethers.indexOf(slot);
        if (idx !== -1) {
            this.activeTethers.splice(idx, 1);
        }

        if (this.pendingSlot === slot) {
            this.pendingSlot = null;
            this.pendingState = 'IDLE';
            this.pendingIntendedTargetA = null;
            this.pendingIntendedTargetB = null;
            this.pendingSecondAim = null;
        }
    }

    reset() {
        this.pendingState = 'IDLE';
        this.isRightMouseDown = false;
        this.isReeling = false;
        this.pendingSlot = null;
        this.pendingIntendedTargetA = null;
        this.pendingIntendedTargetB = null;
        this.pendingSecondAim = null;

        this.activeTethers.length = 0;
        for (let i = 0; i < this.pool.length; i++) {
            const slot = this.pool[i];
            slot.active = false;
            slot.anchorA.target = null;
            slot.anchorB.target = null;
            slot.ropeMesh.visible = false;
            slot.hookMeshA.visible = false;
            slot.hookMeshB.visible = false;
            slot.ropeMaterial.color.setHex(0x00f0ff);
        }
    }

    handleMouseDown(aimTarget) {
        if (this.ship.isDestroyed) return;
        this.isRightMouseDown = true;

        if (this.pendingState === 'IDLE') {
            this.launchHookA(aimTarget);
        } else if (this.pendingState === 'TARGETING_SECOND') {
            if (aimTarget && aimTarget.target && aimTarget.target !== this.pendingSlot.anchorA.target) {
                this.launchHookB(aimTarget);
            }
        }
    }

    handleMouseUp(currentAimTarget) {
        this.isRightMouseDown = false;

        if (this.pendingState === 'TARGETING_SECOND') {
            this.launchHookB(currentAimTarget);
        } else if (this.pendingState === 'FIRING_FIRST') {
            if (currentAimTarget && currentAimTarget.target && currentAimTarget.target !== this.pendingIntendedTargetA) {
                this.pendingSecondAim = currentAimTarget;
            }
        }
    }

    setReeling(active) {
        this.isReeling = active && this.activeTethers.length > 0;
    }

    launchHookA(aimTarget) {
        const slot = this.obtainSlot();
        if (!slot) return;

        this.pendingSlot = slot;
        this.shipAnchorWorld.copy(this.shipAnchorOffset).applyQuaternion(this.ship.quaternion).add(this.ship.position);

        slot.hookPosA.copy(this.shipAnchorWorld);
        this.pendingHookPrevPosA.copy(this.shipAnchorWorld);
        slot.hookPosB.copy(this.shipAnchorWorld);
        this.pendingHookPrevPosB.copy(this.shipAnchorWorld);

        this.pendingIntendedTargetA = aimTarget ? aimTarget.target : null;

        const aimPoint = aimTarget ? aimTarget.point : null;
        const launchDir = this.scratchVecA;
        if (aimPoint) {
            launchDir.copy(aimPoint).sub(this.shipAnchorWorld).normalize();
        } else {
            this.ship.getForwardVector(launchDir);
        }

        const initialSpeed = Math.max(0, this.ship.currentSpeed) + this.hookSpeed;
        this.pendingHookVelA.copy(launchDir).multiplyScalar(initialSpeed);

        slot.hookMeshA.position.copy(slot.hookPosA);
        slot.hookMeshA.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), launchDir);
        slot.hookMeshA.visible = true;
        slot.hookMeshB.visible = false;

        for (let i = 0; i < this.nodeCount; i++) {
            slot.nodes[i].pos.copy(this.shipAnchorWorld);
            slot.nodes[i].oldPos.copy(this.shipAnchorWorld);
        }

        slot.ropeMaterial.color.setHex(0x00f0ff);
        slot.ropeMesh.visible = true;

        this.pendingState = 'FIRING_FIRST';
        this.audio.playGrappleLaunch();
    }

    latchHookA(target, hitPos, isMothership = false) {
        if (!this.pendingSlot) return;
        const slot = this.pendingSlot;

        if (isMothership) {
            slot.anchorA.localOffset.copy(hitPos).sub(target.position);
        } else {
            const invQuat = this.scratchQuatA.copy(target.mesh.quaternion).invert();
            slot.anchorA.localOffset.copy(hitPos).sub(target.position).applyQuaternion(invQuat);
        }

        slot.anchorA.target = target;
        slot.anchorA.isMothership = isMothership;
        slot.anchorA.worldPos.copy(hitPos);

        slot.hookPosA.copy(hitPos);
        this.pendingHookPrevPosA.copy(hitPos);
        slot.hookMeshA.position.copy(slot.hookPosA);

        this.audio.playGrappleLatch();

        if (this.pendingSecondAim) {
            const secondAim = this.pendingSecondAim;
            this.pendingSecondAim = null;
            this.launchHookB(secondAim);
        } else if (this.isRightMouseDown) {
            this.pendingState = 'TARGETING_SECOND';
        } else {
            slot.type = 'SHIP';
            slot.anchorB.target = this.ship;
            slot.anchorB.isMothership = false;
            slot.anchorB.localOffset.copy(this.shipAnchorOffset);
            slot.anchorB.worldPos.copy(this.shipAnchorWorld);

            const dist = this.shipAnchorWorld.distanceTo(slot.hookPosA);
            slot.restLength = Math.max(30.0, dist * 0.88);
            slot.active = true;
            this.activeTethers.push(slot);

            this.pendingSlot = null;
            this.pendingState = 'IDLE';
            this.pendingIntendedTargetA = null;
            this.pendingSecondAim = null;
        }
    }

    launchHookB(aimTarget) {
        if (!this.pendingSlot || !this.pendingSlot.anchorA.target) {
            this.cancelPending();
            return;
        }

        const slot = this.pendingSlot;
        this.shipAnchorWorld.copy(this.shipAnchorOffset).applyQuaternion(this.ship.quaternion).add(this.ship.position);

        slot.hookPosB.copy(this.shipAnchorWorld);
        this.pendingHookPrevPosB.copy(this.shipAnchorWorld);

        this.pendingIntendedTargetB = aimTarget ? aimTarget.target : null;

        const aimPoint = aimTarget ? aimTarget.point : null;
        const launchDir = this.scratchVecA;
        if (aimPoint) {
            launchDir.copy(aimPoint).sub(this.shipAnchorWorld).normalize();
        } else {
            this.ship.getForwardVector(launchDir);
        }

        const initialSpeed = Math.max(0, this.ship.currentSpeed) + this.hookSpeed;
        this.pendingHookVelB.copy(launchDir).multiplyScalar(initialSpeed);

        slot.hookMeshB.position.copy(slot.hookPosB);
        slot.hookMeshB.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), launchDir);
        slot.hookMeshB.visible = true;

        this.pendingState = 'FIRING_SECOND';
        this.audio.playGrappleLaunch();
    }

    latchHookB(target, hitPos, isMothership = false) {
        if (!this.pendingSlot || !this.pendingSlot.anchorA.target) {
            this.cancelPending();
            return;
        }

        const slot = this.pendingSlot;

        if (isMothership) {
            slot.anchorB.localOffset.copy(hitPos).sub(target.position);
        } else {
            const invQuat = this.scratchQuatA.copy(target.mesh.quaternion).invert();
            slot.anchorB.localOffset.copy(hitPos).sub(target.position).applyQuaternion(invQuat);
        }

        slot.anchorB.target = target;
        slot.anchorB.isMothership = isMothership;
        slot.anchorB.worldPos.copy(hitPos);

        slot.hookPosB.copy(hitPos);
        this.pendingHookPrevPosB.copy(hitPos);
        slot.hookMeshB.position.copy(slot.hookPosB);

        slot.type = 'DUAL';
        const dist = slot.hookPosA.distanceTo(slot.hookPosB);
        slot.restLength = Math.max(25.0, dist);
        slot.active = true;
        this.activeTethers.push(slot);

        this.pendingSlot = null;
        this.pendingState = 'IDLE';
        this.pendingIntendedTargetA = null;
        this.pendingIntendedTargetB = null;
        this.pendingSecondAim = null;

        this.audio.playGrappleLatch();
    }

    cancelPending() {
        if (!this.pendingSlot) return;
        const slot = this.pendingSlot;
        this.pendingSlot = null;
        this.pendingState = 'IDLE';
        this.pendingIntendedTargetA = null;
        this.pendingIntendedTargetB = null;
        this.pendingSecondAim = null;
        this.releaseSlot(slot);
    }

    cutCable() {
        if (this.activeTethers.length > 0 || this.pendingState !== 'IDLE') {
            this.audio.playCableSnap();
        }

        this.cancelPending();

        for (let i = this.activeTethers.length - 1; i >= 0; i--) {
            const slot = this.activeTethers[i];
            this.releaseSlot(slot);
        }
        this.activeTethers.length = 0;
        this.isReeling = false;
    }

    onTargetDestroyed(destroyedAsteroid) {
        if (this.pendingSlot) {
            if (this.pendingSlot.anchorA.target === destroyedAsteroid || this.pendingSlot.anchorB.target === destroyedAsteroid) {
                this.cancelPending();
            }
        }

        for (let i = this.activeTethers.length - 1; i >= 0; i--) {
            const slot = this.activeTethers[i];
            if (slot.anchorA.target === destroyedAsteroid || slot.anchorB.target === destroyedAsteroid) {
                this.releaseSlot(slot);
            }
        }
    }

    update(delta) {
        this.shipAnchorWorld.copy(this.shipAnchorOffset).applyQuaternion(this.ship.quaternion).add(this.ship.position);

        if (this.ship.isDestroyed) {
            this.reset();
            return;
        }

        this.updatePendingTether(delta);
        this.updateActiveTethers(delta);
    }

    updatePendingTether(delta) {
        if (!this.pendingSlot || this.pendingState === 'IDLE') return;

        const slot = this.pendingSlot;

        if (this.pendingState === 'FIRING_FIRST') {
            this.pendingHookPrevPosA.copy(slot.hookPosA);
            slot.hookPosA.addScaledVector(this.pendingHookVelA, delta);
            slot.hookMeshA.position.copy(slot.hookPosA);

            const flyDir = this.scratchVecA.copy(this.pendingHookVelA).normalize();
            slot.hookMeshA.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), flyDir);

            const targetHit = this.checkHookCollision(this.pendingHookPrevPosA, slot.hookPosA, null, this.pendingIntendedTargetA);
            if (targetHit) {
                this.latchHookA(targetHit.target, targetHit.hitPos, targetHit.isMothership);
                return;
            }

            const totalDist = this.shipAnchorWorld.distanceTo(slot.hookPosA);
            if (totalDist > this.maxDistance) {
                this.cancelPending();
                return;
            }

            this.updateRopeVerlet(slot, this.shipAnchorWorld, slot.hookPosA, delta);
            this.updateBraidedRopeMesh(slot);

        } else if (this.pendingState === 'TARGETING_SECOND') {
            if (!slot.anchorA.target) {
                this.cancelPending();
                return;
            }

            this.updateAnchorWorldPos(slot.anchorA, slot.hookPosA);
            slot.hookMeshA.position.copy(slot.hookPosA);

            const toShip = this.scratchVecA.copy(this.shipAnchorWorld).sub(slot.hookPosA).normalize();
            slot.hookMeshA.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), toShip);

            this.updateRopeVerlet(slot, this.shipAnchorWorld, slot.hookPosA, delta);
            this.updateBraidedRopeMesh(slot);

        } else if (this.pendingState === 'FIRING_SECOND') {
            if (!slot.anchorA.target) {
                this.cancelPending();
                return;
            }

            this.updateAnchorWorldPos(slot.anchorA, slot.hookPosA);
            slot.hookMeshA.position.copy(slot.hookPosA);

            this.pendingHookPrevPosB.copy(slot.hookPosB);
            slot.hookPosB.addScaledVector(this.pendingHookVelB, delta);
            slot.hookMeshB.position.copy(slot.hookPosB);

            const flyDir = this.scratchVecA.copy(this.pendingHookVelB).normalize();
            slot.hookMeshB.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), flyDir);

            const targetHit = this.checkHookCollision(this.pendingHookPrevPosB, slot.hookPosB, slot.anchorA.target, this.pendingIntendedTargetB);
            if (targetHit) {
                this.latchHookB(targetHit.target, targetHit.hitPos, targetHit.isMothership);
                return;
            }

            const totalDist = this.shipAnchorWorld.distanceTo(slot.hookPosB);
            if (totalDist > this.maxDistance) {
                slot.type = 'SHIP';
                slot.anchorB.target = this.ship;
                slot.anchorB.isMothership = false;
                slot.anchorB.localOffset.copy(this.shipAnchorOffset);
                slot.anchorB.worldPos.copy(this.shipAnchorWorld);

                const dist = this.shipAnchorWorld.distanceTo(slot.hookPosA);
                slot.restLength = Math.max(30.0, dist * 0.88);
                slot.hookMeshB.visible = false;
                slot.active = true;
                this.activeTethers.push(slot);

                this.pendingSlot = null;
                this.pendingState = 'IDLE';
                this.pendingIntendedTargetA = null;
                this.pendingIntendedTargetB = null;
                this.pendingSecondAim = null;
                return;
            }

            this.updateRopeVerlet(slot, slot.hookPosA, slot.hookPosB, delta);
            this.updateBraidedRopeMesh(slot);
        }
    }

    updateActiveTethers(delta) {
        if (this.activeTethers.length === 0) {
            this.isReeling = false;
            return;
        }

        if (this.isReeling) {
            this.audio.playWinchSound();
        }

        for (let idx = this.activeTethers.length - 1; idx >= 0; idx--) {
            const slot = this.activeTethers[idx];

            if (slot.type === 'SHIP') {
                this.updateActiveShipTether(slot, delta);
            } else {
                this.updateActiveDualTether(slot, delta);
            }

            if (!slot.active) {
                this.releaseSlot(slot);
                continue;
            }

            if (slot.type === 'SHIP') {
                this.updateRopeVerlet(slot, this.shipAnchorWorld, slot.hookPosA, delta);
            } else {
                this.updateRopeVerlet(slot, slot.hookPosA, slot.hookPosB, delta);
            }
            this.updateBraidedRopeMesh(slot);
        }
    }

    updateActiveShipTether(slot, delta) {
        if (!slot.anchorA || !slot.anchorA.target) {
            slot.active = false;
            return;
        }

        if (!slot.anchorA.isMothership && !slot.anchorA.target.mesh.parent) {
            slot.active = false;
            return;
        }

        this.updateAnchorWorldPos(slot.anchorA, slot.hookPosA);
        slot.hookMeshA.position.copy(slot.hookPosA);
        slot.hookMeshB.visible = false;

        if (this.isReeling) {
            slot.restLength = Math.max(15.0, slot.restLength - delta * this.reelContractSpeed * 0.75);
            slot.ropeMaterial.color.setRGB(1.0, 0.28, 0.0);
        }

        const toShip = this.scratchVecB.copy(this.shipAnchorWorld).sub(slot.hookPosA);
        const dist = toShip.length();
        if (dist > 0.001) {
            this.scratchVecA.copy(toShip).normalize();
            slot.hookMeshA.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.scratchVecA);
        }

        if (dist > slot.restLength) {
            const stretch = dist - slot.restLength;
            const pullDir = toShip.normalize();

            const target = slot.anchorA.target;
            const targetVel = target.velocity || this.scratchVecD.set(0, 0, 0);
            const relVel = this.scratchVecC.copy(this.ship.velocity).sub(targetVel);
            const dampForce = relVel.dot(pullDir) * slot.cableDamping;
            const tension = Math.max(0, stretch * slot.cableStiffness + dampForce);

            if (!slot.anchorA.isMothership) {
                const astMass = target.mass || 35.0;
                const astAcc = this.scratchVecC.copy(pullDir).multiplyScalar((tension / astMass) * delta);
                if (!target.velocity) target.velocity = new THREE.Vector3();
                target.velocity.add(astAcc);
            }

            const shipDrag = Math.min(0.65, tension / 1600.0);
            this.ship.position.addScaledVector(pullDir, -shipDrag * delta * 8.0);
            this.ship.currentSpeed *= Math.pow(0.98, delta * 60);

            if (!this.isReeling) {
                const tensionRatio = Math.min(1.0, stretch / 65.0);
                slot.ropeMaterial.color.setRGB(tensionRatio * 1.0, 0.94 - tensionRatio * 0.35, 1.0 - tensionRatio * 0.9);
            }
        } else if (!this.isReeling) {
            slot.ropeMaterial.color.setHex(0x00f0ff);
        }
    }

    updateActiveDualTether(slot, delta) {
        if (!slot.anchorA || !slot.anchorA.target || !slot.anchorB || !slot.anchorB.target) {
            slot.active = false;
            return;
        }

        if (!slot.anchorA.isMothership && !slot.anchorA.target.mesh.parent) {
            slot.active = false;
            return;
        }
        if (!slot.anchorB.isMothership && !slot.anchorB.target.mesh.parent) {
            slot.active = false;
            return;
        }

        this.updateAnchorWorldPos(slot.anchorA, slot.hookPosA);
        this.updateAnchorWorldPos(slot.anchorB, slot.hookPosB);

        slot.hookMeshA.position.copy(slot.hookPosA);
        slot.hookMeshB.position.copy(slot.hookPosB);
        slot.hookMeshA.visible = true;
        slot.hookMeshB.visible = true;

        const vecAtoB = this.scratchVecA.copy(slot.hookPosB).sub(slot.hookPosA);
        const dist = vecAtoB.length();

        if (dist > 0.001) {
            const dirAtoB = this.scratchVecB.copy(vecAtoB).normalize();
            slot.hookMeshA.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirAtoB);
            this.scratchVecC.copy(dirAtoB).negate();
            slot.hookMeshB.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.scratchVecC);
        }

        if (this.isReeling) {
            slot.restLength = Math.max(slot.minRestLength, slot.restLength - delta * this.reelContractSpeed);
            slot.ropeMaterial.color.setRGB(1.0, 0.2, 0.0);
        }

        if (dist > slot.restLength) {
            const stretch = dist - slot.restLength;
            const pullDirAtoB = vecAtoB.normalize();

            const velA = slot.anchorA.target.velocity || this.scratchVecC.set(0, 0, 0);
            const velB = slot.anchorB.target.velocity || this.scratchVecD.set(0, 0, 0);
            const relVel = this.scratchVecC.copy(velB).sub(velA);
            const dampForce = relVel.dot(pullDirAtoB) * slot.cableDamping;

            const tensionStiffness = this.isReeling ? slot.cableStiffness * 2.6 : slot.cableStiffness;
            const tension = Math.max(0, stretch * tensionStiffness + dampForce);

            if (!slot.anchorA.isMothership) {
                const massA = slot.anchorA.target.mass || 35.0;
                const accA = this.scratchVecC.copy(pullDirAtoB).multiplyScalar((tension / massA) * delta);
                if (!slot.anchorA.target.velocity) slot.anchorA.target.velocity = new THREE.Vector3();
                slot.anchorA.target.velocity.add(accA);
            }

            if (!slot.anchorB.isMothership) {
                const massB = slot.anchorB.target.mass || 35.0;
                const accB = this.scratchVecC.copy(pullDirAtoB).multiplyScalar((-tension / massB) * delta);
                if (!slot.anchorB.target.velocity) slot.anchorB.target.velocity = new THREE.Vector3();
                slot.anchorB.target.velocity.add(accB);
            }

            if (!this.isReeling) {
                const tensionRatio = Math.min(1.0, stretch / 75.0);
                slot.ropeMaterial.color.setRGB(tensionRatio * 1.0, 0.94 - tensionRatio * 0.4, 1.0 - tensionRatio * 0.9);
            }
        } else if (!this.isReeling) {
            slot.ropeMaterial.color.setHex(0x00f0ff);
        }

        this.checkDualSmash(slot, dist);
    }

    checkDualSmash(slot, hookDist) {
        const targetA = slot.anchorA.target;
        const targetB = slot.anchorB.target;
        if (!targetA || !targetB) return;

        if (!slot.anchorA.isMothership && !slot.anchorB.isMothership) {
            const radA = targetA.radius || 10.0;
            const radB = targetB.radius || 10.0;
            const centerDist = targetA.position.distanceTo(targetB.position);

            if (centerDist < (radA + radB + 3.0) || hookDist < 6.0) {
                const midPoint = this.scratchVecA.copy(targetA.position).add(targetB.position).multiplyScalar(0.5);

                this.world.destroyAsteroidDirect(targetA);
                this.world.destroyAsteroidDirect(targetB);

                if (this.game) {
                    this.game.kills += 2;
                    this.game.hudKills.textContent = this.game.kills;
                    const distToShip = this.ship.position.distanceTo(midPoint);
                    this.audio.playAsteroidExplosion(distToShip);
                    this.game.addTrauma(1.0);
                    this.game.triggerHitmarker();
                }

                this.onTargetDestroyed(targetA);
                this.onTargetDestroyed(targetB);
            }
        } else {
            const asteroidTarget = slot.anchorA.isMothership ? targetB : targetA;
            const motherTarget = slot.anchorA.isMothership ? targetA : targetB;
            const astRad = asteroidTarget.radius || 10.0;
            const distToMother = asteroidTarget.position.distanceTo(motherTarget.position);

            if (distToMother < (astRad + 45.0) || hookDist < 6.0) {
                const smashPos = asteroidTarget.position.clone();
                this.world.destroyAsteroidDirect(asteroidTarget);

                if (this.game) {
                    this.game.kills += 1;
                    this.game.hudKills.textContent = this.game.kills;
                    const distToShip = this.ship.position.distanceTo(smashPos);
                    this.audio.playAsteroidExplosion(distToShip);
                    this.game.addTrauma(0.85);
                    this.game.triggerHitmarker();
                }

                this.onTargetDestroyed(asteroidTarget);
            }
        }
    }

    updateAnchorWorldPos(anchor, outPos) {
        if (anchor.isMothership) {
            outPos.copy(anchor.target.position).add(anchor.localOffset);
        } else {
            const currentOffset = this.scratchVecC.copy(anchor.localOffset).applyQuaternion(anchor.target.mesh.quaternion);
            outPos.copy(anchor.target.position).add(currentOffset);
        }
    }

    checkHookCollision(p0, p1, excludeTarget = null, intendedTarget = null) {
        const vX = p1.x - p0.x;
        const vY = p1.y - p0.y;
        const vZ = p1.z - p0.z;
        const segLenSq = vX * vX + vY * vY + vZ * vZ;

        if (intendedTarget && intendedTarget !== excludeTarget && !intendedTarget.isMothership) {
            const hitRad = intendedTarget.radius + 6.0;
            let distSq = 0;
            let t = 0;

            if (segLenSq > 0.0001) {
                const dX = intendedTarget.position.x - p0.x;
                const dY = intendedTarget.position.y - p0.y;
                const dZ = intendedTarget.position.z - p0.z;
                t = Math.max(0, Math.min(1, (dX * vX + dY * vY + dZ * vZ) / segLenSq));
                const closeX = p0.x + t * vX;
                const closeY = p0.y + t * vY;
                const closeZ = p0.z + t * vZ;
                const diffX = intendedTarget.position.x - closeX;
                const diffY = intendedTarget.position.y - closeY;
                const diffZ = intendedTarget.position.z - closeZ;
                distSq = diffX * diffX + diffY * diffY + diffZ * diffZ;
            } else {
                distSq = p1.distanceToSquared(intendedTarget.position);
                t = 1.0;
            }

            if (distSq < hitRad * hitRad || p1.distanceTo(intendedTarget.position) < hitRad) {
                const hitPos = new THREE.Vector3(p0.x + t * vX, p0.y + t * vY, p0.z + t * vZ);
                return {
                    target: intendedTarget,
                    isMothership: false,
                    hitPos: hitPos
                };
            }
        }

        let closestHit = null;
        let closestT = 2.0;

        for (const chunkGroup of this.world.activeChunks.values()) {
            const asteroids = chunkGroup.userData.asteroids;
            if (!asteroids) continue;

            for (let i = 0; i < asteroids.length; i++) {
                const ast = asteroids[i];
                if (ast === excludeTarget) continue;

                const hitRadius = ast.radius + 6.0;
                let t = 0;
                let distSq = 0;

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
                    t = 0;
                }

                if (distSq < hitRadius * hitRadius) {
                    if (t < closestT) {
                        closestT = t;
                        const hitPos = new THREE.Vector3(p0.x + t * vX, p0.y + t * vY, p0.z + t * vZ);
                        closestHit = {
                            target: ast,
                            isMothership: false,
                            hitPos: hitPos
                        };
                    }
                }
            }
        }

        if (closestHit) {
            return closestHit;
        }

        const mothership = this.game.mothership;
        const distFromShip = p1.distanceTo(this.shipAnchorWorld);
        if (mothership && mothership !== excludeTarget && distFromShip > 35.0) {
            const localP = this.scratchVecA.copy(p1).sub(mothership.position);
            for (let i = 0; i < mothership.collisionBoxes.length; i++) {
                const box = mothership.collisionBoxes[i];
                if (localP.x >= box.min.x - 6 && localP.x <= box.max.x + 6 &&
                    localP.y >= box.min.y - 6 && localP.y <= box.max.y + 6 &&
                    localP.z >= box.min.z - 6 && localP.z <= box.max.z + 6) {
                    return {
                        target: mothership,
                        isMothership: true,
                        hitPos: p1.clone()
                    };
                }
            }
        }

        return null;
    }

    updateRopeVerlet(slot, endA, endB, delta) {
        const damping = 0.955;

        slot.nodes[0].pos.copy(endA);
        slot.nodes[this.nodeCount - 1].pos.copy(endB);

        for (let i = 1; i < this.nodeCount - 1; i++) {
            const node = slot.nodes[i];
            const vx = (node.pos.x - node.oldPos.x) * damping;
            const vy = (node.pos.y - node.oldPos.y) * damping;
            const vz = (node.pos.z - node.oldPos.z) * damping;

            node.oldPos.copy(node.pos);
            node.pos.x += vx;
            node.pos.y += vy;
            node.pos.z += vz;
        }

        const totalDist = endA.distanceTo(endB);
        const segTarget = totalDist / (this.nodeCount - 1);

        const iterations = 4;
        for (let it = 0; it < iterations; it++) {
            for (let i = 0; i < this.nodeCount - 1; i++) {
                const nodeA = slot.nodes[i];
                const nodeB = slot.nodes[i + 1];

                const dx = nodeB.pos.x - nodeA.pos.x;
                const dy = nodeB.pos.y - nodeA.pos.y;
                const dz = nodeB.pos.z - nodeA.pos.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
                const factor = (dist - segTarget) / dist;

                if (i === 0) {
                    nodeB.pos.x -= dx * factor;
                    nodeB.pos.y -= dy * factor;
                    nodeB.pos.z -= dz * factor;
                } else if (i + 1 === this.nodeCount - 1) {
                    nodeA.pos.x += dx * factor;
                    nodeA.pos.y += dy * factor;
                    nodeA.pos.z += dz * factor;
                } else {
                    nodeA.pos.x += dx * factor * 0.5;
                    nodeA.pos.y += dy * factor * 0.5;
                    nodeA.pos.z += dz * factor * 0.5;

                    nodeB.pos.x -= dx * factor * 0.5;
                    nodeB.pos.y -= dy * factor * 0.5;
                    nodeB.pos.z -= dz * factor * 0.5;
                }
            }
        }
    }

    updateBraidedRopeMesh(slot) {
        const m = this.curveSampleCount;
        const n = this.nodeCount;

        for (let s = 0; s < m; s++) {
            const t = s / (m - 1);
            const u = t * (n - 1);
            const idx = Math.min(n - 2, Math.floor(u));
            const frac = u - idx;

            const p0 = slot.nodes[Math.max(0, idx - 1)].pos;
            const p1 = slot.nodes[idx].pos;
            const p2 = slot.nodes[idx + 1].pos;
            const p3 = slot.nodes[Math.min(n - 1, idx + 2)].pos;

            const f2 = frac * frac;
            const f3 = f2 * frac;

            const out = slot.curvePoints[s];
            out.x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * frac + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3);
            out.y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * frac + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3);
            out.z = 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * frac + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * f2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * f3);
        }

        for (let s = 0; s < m; s++) {
            const curr = slot.curvePoints[s];

            if (s === 0) {
                this.scratchTang.copy(slot.curvePoints[1]).sub(curr);
            } else if (s === m - 1) {
                this.scratchTang.copy(curr).sub(slot.curvePoints[m - 2]);
            } else {
                this.scratchTang.copy(slot.curvePoints[s + 1]).sub(slot.curvePoints[s - 1]);
            }
            this.scratchTang.normalize();

            if (Math.abs(this.scratchTang.y) < 0.95) {
                this.scratchNorm.crossVectors(this.scratchTang, this.scratchUp).normalize();
            } else {
                this.scratchNorm.crossVectors(this.scratchTang, this.scratchAltUp).normalize();
            }
            this.scratchBinorm.crossVectors(this.scratchTang, this.scratchNorm).normalize();

            for (let k = 0; k < 3; k++) {
                const angle = s * this.twistRate + (k * Math.PI * 2) / 3;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                const sp = slot.strandPoints[k][s];
                sp.x = curr.x + this.braidRadius * (this.scratchNorm.x * cosA + this.scratchBinorm.x * sinA);
                sp.y = curr.y + this.braidRadius * (this.scratchNorm.y * cosA + this.scratchBinorm.y * sinA);
                sp.z = curr.z + this.braidRadius * (this.scratchNorm.z * cosA + this.scratchBinorm.z * sinA);
            }
        }

        const array = slot.ropePositions;
        let vIdx = 0;

        for (let k = 0; k < 3; k++) {
            const strand = slot.strandPoints[k];
            for (let s = 0; s < m - 1; s++) {
                const a = strand[s];
                const b = strand[s + 1];

                array[vIdx++] = a.x;
                array[vIdx++] = a.y;
                array[vIdx++] = a.z;

                array[vIdx++] = b.x;
                array[vIdx++] = b.y;
                array[vIdx++] = b.z;
            }
        }

        for (let s = 0; s < m; s++) {
            const p0 = slot.strandPoints[0][s];
            const p1 = slot.strandPoints[1][s];
            const p2 = slot.strandPoints[2][s];

            array[vIdx++] = p0.x;
            array[vIdx++] = p0.y;
            array[vIdx++] = p0.z;
            array[vIdx++] = p1.x;
            array[vIdx++] = p1.y;
            array[vIdx++] = p1.z;

            array[vIdx++] = p1.x;
            array[vIdx++] = p1.y;
            array[vIdx++] = p1.z;
            array[vIdx++] = p2.x;
            array[vIdx++] = p2.y;
            array[vIdx++] = p2.z;

            array[vIdx++] = p2.x;
            array[vIdx++] = p2.y;
            array[vIdx++] = p2.z;
            array[vIdx++] = p0.x;
            array[vIdx++] = p0.y;
            array[vIdx++] = p0.z;
        }

        for (let s = 0; s < m - 1; s++) {
            const p0 = slot.strandPoints[0][s];
            const p1Next = slot.strandPoints[1][s + 1];

            const p1 = slot.strandPoints[1][s];
            const p2Next = slot.strandPoints[2][s + 1];

            const p2 = slot.strandPoints[2][s];
            const p0Next = slot.strandPoints[0][s + 1];

            array[vIdx++] = p0.x;
            array[vIdx++] = p0.y;
            array[vIdx++] = p0.z;
            array[vIdx++] = p1Next.x;
            array[vIdx++] = p1Next.y;
            array[vIdx++] = p1Next.z;

            array[vIdx++] = p1.x;
            array[vIdx++] = p1.y;
            array[vIdx++] = p1.z;
            array[vIdx++] = p2Next.x;
            array[vIdx++] = p2Next.y;
            array[vIdx++] = p2Next.z;

            array[vIdx++] = p2.x;
            array[vIdx++] = p2.y;
            array[vIdx++] = p2.z;
            array[vIdx++] = p0Next.x;
            array[vIdx++] = p0Next.y;
            array[vIdx++] = p0Next.z;
        }

        slot.ropeGeometry.attributes.position.needsUpdate = true;
    }
}
