class EchoScanner {
    constructor(scene, maxPoints = 30000) {
        this.scene = scene;
        this.maxPoints = maxPoints;
        this.currentIndex = 0;
        this.activeCount = 0;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 40;

        this.positions = new Float32Array(maxPoints * 3);
        this.colors = new Float32Array(maxPoints * 3);
        this.baseColors = new Float32Array(maxPoints * 3);
        this.timestamps = new Float32Array(maxPoints);
        this.lifespans = new Float32Array(maxPoints);

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        const pointTexture = new THREE.CanvasTexture(canvas);

        this.material = new THREE.PointsMaterial({
            size: 0.32,
            map: pointTexture,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });

        this.pointCloud = new THREE.Points(this.geometry, this.material);
        this.pointCloud.frustumCulled = false;
        this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 10000);
        this.scene.add(this.pointCloud);
    }

    addPoint(pos, normal, baseR, baseG, baseB, lifeSec = 4.0) {
        const idx = this.currentIndex;
        const i3 = idx * 3;

        this.positions[i3] = pos.x + normal.x * 0.06;
        this.positions[i3 + 1] = pos.y + normal.y * 0.06;
        this.positions[i3 + 2] = pos.z + normal.z * 0.06;

        this.baseColors[i3] = baseR;
        this.baseColors[i3 + 1] = baseG;
        this.baseColors[i3 + 2] = baseB;

        this.colors[i3] = baseR;
        this.colors[i3 + 1] = baseG;
        this.colors[i3 + 2] = baseB;

        this.timestamps[idx] = performance.now();
        this.lifespans[idx] = lifeSec * 1000;

        this.currentIndex = (this.currentIndex + 1) % this.maxPoints;
        if (this.activeCount < this.maxPoints) this.activeCount++;
    }

    fireBeam(origin, forward, count = 100, colliders = []) {
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(forward, up).normalize();
        const adjustedUp = new THREE.Vector3().crossVectors(right, forward).normalize();

        let shortestDist = 999;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spread = Math.pow(Math.random(), 0.7) * 0.22;
            const rx = Math.cos(angle) * spread;
            const ry = Math.sin(angle) * spread;

            const rayDir = forward.clone()
                .addScaledVector(right, rx)
                .addScaledVector(adjustedUp, ry)
                .normalize();

            this.raycaster.set(origin, rayDir);
            const hits = this.raycaster.intersectObjects(colliders, false);

            if (hits.length > 0) {
                const hit = hits[0];
                if (hit.distance < shortestDist) shortestDist = hit.distance;

                let r = 0.0, g = 1.0, b = 0.4;
                let life = 3.5;

                const type = hit.object.userData ? hit.object.userData.type : 'wall';
                if (type === 'beacon_crystal') {
                    r = 1.0; g = 0.1; b = 0.5;
                    life = 6.0;
                } else if (type === 'exit_arch') {
                    r = 0.1; g = 0.9; b = 1.0;
                    life = 5.5;
                } else if (type === 'floor') {
                    r = 0.1; g = 0.6; b = 1.0;
                } else if (type === 'ceiling') {
                    r = 0.3; g = 0.8; b = 0.3;
                } else if (type === 'platform') {
                    r = 1.0; g = 0.8; b = 0.1;
                }

                const toOrigin = origin.clone().sub(hit.point).normalize();
                this.addPoint(hit.point, toOrigin, r, g, b, life);
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;

        return shortestDist;
    }

    fireRadialPulse(origin, count = 300, colliders = []) {
        const phiSpan = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phiSpan * i;

            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;

            const rayDir = new THREE.Vector3(x, y * 0.7, z).normalize();
            this.raycaster.set(origin, rayDir);
            const hits = this.raycaster.intersectObjects(colliders, false);

            if (hits.length > 0) {
                const hit = hits[0];
                let r = 0.0, g = 0.95, b = 0.85;
                let life = 5.0;

                const type = hit.object.userData ? hit.object.userData.type : 'wall';
                if (type === 'beacon_crystal') {
                    r = 1.0; g = 0.2; b = 0.6;
                    life = 7.0;
                } else if (type === 'exit_arch') {
                    r = 0.2; g = 1.0; b = 0.4;
                    life = 7.0;
                }

                const toOrigin = origin.clone().sub(hit.point).normalize();
                this.addPoint(hit.point, toOrigin, r, g, b, life);
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    }

    update() {
        const now = performance.now();
        let changed = false;

        const count = this.activeCount;
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const age = now - this.timestamps[i];
            const lifespan = this.lifespans[i];

            if (age >= lifespan) {
                if (this.colors[i3] > 0 || this.colors[i3 + 1] > 0 || this.colors[i3 + 2] > 0) {
                    this.colors[i3] = 0;
                    this.colors[i3 + 1] = 0;
                    this.colors[i3 + 2] = 0;
                    changed = true;
                }
            } else {
                const progress = age / lifespan;
                const fade = Math.pow(1 - progress, 1.6);

                const baseR = this.baseColors[i3];
                const baseG = this.baseColors[i3 + 1];
                const baseB = this.baseColors[i3 + 2];

                this.colors[i3] = baseR * fade;
                this.colors[i3 + 1] = baseG * fade;
                this.colors[i3 + 2] = baseB * fade;
                changed = true;
            }
        }

        if (changed) {
            this.geometry.attributes.color.needsUpdate = true;
        }
    }
}

window.EchoScanner = EchoScanner;

