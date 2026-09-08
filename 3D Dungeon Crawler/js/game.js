class Game {
    constructor() {
        this.container = document.getElementById('viewport-container');
        this.level = 1;

        this.player = new Player();
        this.monsters = [];
        this.fireballs = [];
        this.itemPickups = [];
        this.torchLights = [];

        this.gridX = 1;
        this.gridZ = 1;
        this.facingDir = 0;

        this.cameraTargetPos = new THREE.Vector3();
        this.cameraTargetYaw = 0;
        this.currentYaw = 0;
        this.isMoving = false;
        this.walkPhase = 0;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.dungeonGroup = new THREE.Group();

        this.playerTorchLight = null;
        this.ambientLight = null;

        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

        this.isGameOver = false;
        this.dungeon = new DungeonGenerator();

        this.initThree();
        this.setupEventListeners();
        this.startLevel(1);
        this.animate();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050508, 0.2);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 40);
        this.camera.position.set(0, 1.1, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x050508);
        this.container.appendChild(this.renderer.domElement);

        this.playerTorchLight = new THREE.PointLight(0xffa040, 1.6, 7);
        this.camera.add(this.playerTorchLight);
        this.scene.add(this.camera);

        this.ambientLight = new THREE.AmbientLight(0x1a1525, 0.35);
        this.scene.add(this.ambientLight);

        this.scene.add(this.dungeonGroup);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    startLevel(levelNum) {
        this.level = levelNum;
        this.logMessage(`=== MASMORRA NÍVEL ${this.level} ===`);
        this.logMessage("Você adentra as profundezas escuras do labirinto...");

        while (this.dungeonGroup.children.length > 0) {
            const obj = this.dungeonGroup.children[0];
            this.dungeonGroup.remove(obj);
        }
        for (const m of this.monsters) {
            if (m.sprite) this.scene.remove(m.sprite);
        }
        this.monsters = [];

        for (const fb of this.fireballs) {
            fb.destroy();
        }
        this.fireballs = [];

        for (const item of this.itemPickups) {
            if (item.sprite) this.scene.remove(item.sprite);
        }
        this.itemPickups = [];

        this.torchLights = [];

        this.dungeon.generate(this.level);

        this.gridX = this.dungeon.playerStart.x;
        this.gridZ = this.dungeon.playerStart.z;
        this.facingDir = this.dungeon.playerStart.dir;

        const worldX = this.gridX * 2;
        const worldZ = this.gridZ * 2;
        this.camera.position.set(worldX, 1.1, worldZ);
        this.cameraTargetPos.set(worldX, 1.1, worldZ);

        this.cameraTargetYaw = this.getYawForDir(this.facingDir);
        this.currentYaw = this.cameraTargetYaw;
        this.camera.rotation.set(0, this.currentYaw, 0, 'YXZ');

        this.buildDungeonMeshes();
        this.spawnMonsters();
        this.spawnItemPickups();

        this.dungeon.revealRadius(this.gridX, this.gridZ, 2);
        this.updateHUD();
        this.drawMinimap();
    }

    getYawForDir(dir) {
        switch (dir) {
            case 0: return 0;
            case 1: return -Math.PI / 2;
            case 2: return Math.PI;
            case 3: return Math.PI / 2;
            default: return 0;
        }
    }

    getDirVector(dir) {
        switch (dir) {
            case 0: return { dx: 0, dz: -1 };
            case 1: return { dx: 1, dz: 0 };
            case 2: return { dx: 0, dz: 1 };
            case 3: return { dx: -1, dz: 0 };
            default: return { dx: 0, dz: -1 };
        }
    }

    buildDungeonMeshes() {
        const wallTexNormal = window.textureGen.createWallTexture(false);
        const wallTexMossy = window.textureGen.createWallTexture(true);
        const floorTex = window.textureGen.createFloorTexture();
        const ceilingTex = window.textureGen.createCeilingTexture();
        const woodDoorTex = window.textureGen.createWoodDoorTexture();
        const ironDoorTex = window.textureGen.createIronDoorTexture();
        const chestTex = window.textureGen.createChestTexture();
        const stairsTex = window.textureGen.createStairsTexture();
        const trapTex = window.textureGen.createTrapTexture(true);

        const wallMatNormal = new THREE.MeshStandardMaterial({ map: wallTexNormal, roughness: 0.9, metalness: 0.1 });
        const wallMatMossy = new THREE.MeshStandardMaterial({ map: wallTexMossy, roughness: 0.9, metalness: 0.1 });
        const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8, metalness: 0.1 });
        const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.9, metalness: 0.05 });
        const woodDoorMat = new THREE.MeshStandardMaterial({ map: woodDoorTex, roughness: 0.7 });
        const ironDoorMat = new THREE.MeshStandardMaterial({ map: ironDoorTex, roughness: 0.5, metalness: 0.4 });
        const chestMat = new THREE.MeshStandardMaterial({ map: chestTex, roughness: 0.6, metalness: 0.3 });
        const stairsMat = new THREE.MeshStandardMaterial({ map: stairsTex, roughness: 0.8 });
        const trapMat = new THREE.MeshStandardMaterial({ map: trapTex, roughness: 0.7, metalness: 0.3 });

        const wallGeom = new THREE.BoxGeometry(2, 2.4, 2);
        const planeGeom = new THREE.PlaneGeometry(2, 2);
        const chestGeom = new THREE.BoxGeometry(0.9, 0.7, 0.9);

        for (let y = 0; y < this.dungeon.height; y++) {
            for (let x = 0; x < this.dungeon.width; x++) {
                const tile = this.dungeon.grid[y][x];
                const wx = x * 2;
                const wz = y * 2;

                if (tile === TILE.WALL) {
                    const mat = (x + y) % 3 === 0 ? wallMatMossy : wallMatNormal;
                    const wallMesh = new THREE.Mesh(wallGeom, mat);
                    wallMesh.position.set(wx, 1.2, wz);
                    this.dungeonGroup.add(wallMesh);
                } else {
                    let fMat = floorMat;
                    if (tile === TILE.STAIRS) {
                        fMat = stairsMat;
                    } else if (tile === TILE.TRAP) {
                        fMat = trapMat;
                    }

                    const floorMesh = new THREE.Mesh(planeGeom, fMat);
                    floorMesh.rotation.x = -Math.PI / 2;
                    floorMesh.position.set(wx, 0, wz);
                    this.dungeonGroup.add(floorMesh);

                    const ceilingMesh = new THREE.Mesh(planeGeom, ceilingMat);
                    ceilingMesh.rotation.x = Math.PI / 2;
                    ceilingMesh.position.set(wx, 2.4, wz);
                    this.dungeonGroup.add(ceilingMesh);

                    if (tile === TILE.DOOR_WOOD || tile === TILE.DOOR_IRON) {
                        const doorMat = tile === TILE.DOOR_WOOD ? woodDoorMat : ironDoorMat;
                        const doorGeom = new THREE.BoxGeometry(1.8, 2.2, 0.2);
                        const doorMesh = new THREE.Mesh(doorGeom, doorMat);

                        const isHoriz = (x > 0 && this.dungeon.grid[y][x - 1] === TILE.WALL);
                        if (!isHoriz) {
                            doorMesh.rotation.y = Math.PI / 2;
                        }
                        doorMesh.position.set(wx, 1.1, wz);
                        doorMesh.userData = { isDoor: true, gridX: x, gridZ: y, type: tile, open: false };
                        this.dungeonGroup.add(doorMesh);
                    }

                    if (tile === TILE.CHEST) {
                        const chestMesh = new THREE.Mesh(chestGeom, chestMat);
                        chestMesh.position.set(wx, 0.35, wz);
                        chestMesh.userData = { isChest: true, gridX: x, gridZ: y, opened: false };
                        this.dungeonGroup.add(chestMesh);
                    }
                }
            }
        }

        for (const t of this.dungeon.torches) {
            const twx = t.wallX * 2 + t.facingX * 0.95;
            const twz = t.wallZ * 2 + t.facingZ * 0.95;
            const ty = 1.4;

            const torchTex = window.textureGen.createTorchSprite();
            const torchMat = new THREE.SpriteMaterial({ map: torchTex, transparent: true });
            const torchSprite = new THREE.Sprite(torchMat);
            torchSprite.position.set(twx, ty, twz);
            torchSprite.scale.set(0.6, 0.6, 1);
            this.dungeonGroup.add(torchSprite);

            const torchLight = new THREE.PointLight(0xff7722, 1.2, 5.5);
            torchLight.position.set(twx, ty + 0.1, twz);
            this.dungeonGroup.add(torchLight);
            this.torchLights.push(torchLight);
        }
    }

    spawnMonsters() {
        for (const data of this.dungeon.enemies) {
            const monster = new Monster(data, this.scene);
            this.monsters.push(monster);
        }
    }

    spawnItemPickups() {
        for (const it of this.dungeon.items) {
            let tex = null;
            if (it.type === 'gold_key') tex = window.textureGen.createKeySprite('gold');
            else if (it.type === 'iron_key') tex = window.textureGen.createKeySprite('iron');
            else if (it.type === 'health_potion') tex = window.textureGen.createPotionSprite('health');
            else if (it.type === 'mana_potion') tex = window.textureGen.createPotionSprite('mana');

            if (tex) {
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
                const sprite = new THREE.Sprite(mat);
                sprite.position.set(it.x * 2, 0.45, it.z * 2);
                sprite.scale.set(0.7, 0.7, 1);
                this.scene.add(sprite);

                this.itemPickups.push({
                    data: it,
                    sprite: sprite,
                    initialY: 0.45,
                    bobOffset: Math.random() * Math.PI * 2
                });
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;
            if (window.soundFX) window.soundFX.ensureContext();

            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward();
                    break;
                case 'KeyA':
                    this.strafeLeft();
                    break;
                case 'KeyD':
                    this.strafeRight();
                    break;
                case 'KeyQ':
                case 'ArrowLeft':
                    this.turnLeft();
                    break;
                case 'KeyE':
                case 'ArrowRight':
                    this.turnRight();
                    break;
                case 'Space':
                    this.playerAttack();
                    break;
                case 'KeyF':
                    this.castSpell();
                    break;
                case 'Digit1':
                    this.useHealthPotion();
                    break;
                case 'Digit2':
                    this.useManaPotion();
                    break;
            }
        });

        if (this.container) {
            this.container.addEventListener('click', () => {
                if (this.isGameOver) return;
                if (window.soundFX) window.soundFX.ensureContext();
                this.playerAttack();
            });
        }

        this.bindButton('btn-up', () => this.moveForward());
        this.bindButton('btn-down', () => this.moveBackward());
        this.bindButton('btn-left', () => this.turnLeft());
        this.bindButton('btn-right', () => this.turnRight());
        this.bindButton('btn-strafe-left', () => this.strafeLeft());
        this.bindButton('btn-strafe-right', () => this.strafeRight());
        this.bindButton('btn-attack', () => this.playerAttack());
        this.bindButton('btn-magic', () => this.castSpell());
        this.bindButton('btn-pot-hp', () => this.useHealthPotion());
        this.bindButton('btn-pot-mp', () => this.useManaPotion());
        this.bindButton('btn-rest', () => this.playerRest());

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                document.getElementById('game-over-screen').classList.add('hidden');
                this.isGameOver = false;
                this.player.reset();
                this.startLevel(1);
            });
        }
    }

    bindButton(id, callback) {
        const btn = document.getElementById(id);
        if (btn) {
            const trigger = (e) => {
                e.preventDefault();
                if (window.soundFX) window.soundFX.ensureContext();
                callback();
            };
            btn.addEventListener('click', trigger);
            btn.addEventListener('touchstart', trigger, { passive: false });
        }
    }

    moveForward() {
        const v = this.getDirVector(this.facingDir);
        this.tryMoveTo(this.gridX + v.dx, this.gridZ + v.dz);
    }

    moveBackward() {
        const v = this.getDirVector(this.facingDir);
        this.tryMoveTo(this.gridX - v.dx, this.gridZ - v.dz);
    }

    strafeLeft() {
        const v = this.getDirVector(this.facingDir);
        this.tryMoveTo(this.gridX + v.dz, this.gridZ - v.dx);
    }

    strafeRight() {
        const v = this.getDirVector(this.facingDir);
        this.tryMoveTo(this.gridX - v.dz, this.gridZ + v.dx);
    }

    turnLeft() {
        this.facingDir = (this.facingDir + 3) % 4;
        this.cameraTargetYaw = this.getYawForDir(this.facingDir);
        if (window.soundFX) window.soundFX.playTurn();
        this.drawMinimap();
    }

    turnRight() {
        this.facingDir = (this.facingDir + 1) % 4;
        this.cameraTargetYaw = this.getYawForDir(this.facingDir);
        if (window.soundFX) window.soundFX.playTurn();
        this.drawMinimap();
    }

    tryMoveTo(targetX, targetZ) {
        if (targetX < 0 || targetX >= this.dungeon.width || targetZ < 0 || targetZ >= this.dungeon.height) {
            return;
        }

        const tile = this.dungeon.grid[targetZ][targetX];

        if (tile === TILE.WALL) {
            if (window.soundFX) window.soundFX.playLocked();
            this.logMessage("Você colidiu com a parede de pedra.");
            this.shakeCamera();
            return;
        }

        if (tile === TILE.DOOR_WOOD || tile === TILE.DOOR_IRON) {
            const doorMesh = this.findDoorMesh(targetX, targetZ);
            if (doorMesh && !doorMesh.userData.open) {
                if (tile === TILE.DOOR_IRON) {
                    if (this.player.keys.gold > 0) {
                        this.player.keys.gold--;
                        doorMesh.userData.open = true;
                        this.dungeon.grid[targetZ][targetX] = TILE.EMPTY;
                        this.animateDoorOpen(doorMesh);
                        if (window.soundFX) window.soundFX.playDoor();
                        this.logMessage("Você usou a Chave Dourada e destrancou o portão de ferro!");
                        this.updateHUD();
                        return;
                    } else {
                        if (window.soundFX) window.soundFX.playLocked();
                        this.logMessage("O portão de ferro está trancado! Requer a Chave Dourada da Cripta.");
                        this.shakeCamera();
                        return;
                    }
                } else {
                    doorMesh.userData.open = true;
                    this.dungeon.grid[targetZ][targetX] = TILE.EMPTY;
                    this.animateDoorOpen(doorMesh);
                    if (window.soundFX) window.soundFX.playDoor();
                    this.logMessage("Você abriu a porta de madeira.");
                    return;
                }
            }
        }

        if (tile === TILE.CHEST) {
            this.openChest(targetX, targetZ);
            return;
        }

        const monster = this.monsters.find(m => !m.isDead && m.gridX === targetX && m.gridZ === targetZ);
        if (monster) {
            this.attackMonster(monster);
            return;
        }

        this.gridX = targetX;
        this.gridZ = targetZ;
        this.cameraTargetPos.set(this.gridX * 2, 1.1, this.gridZ * 2);
        if (window.soundFX) window.soundFX.playFootstep();

        this.dungeon.revealRadius(this.gridX, this.gridZ, 2);
        this.drawMinimap();

        this.checkItemPickup(this.gridX, this.gridZ);

        if (tile === TILE.TRAP) {
            const trapDamage = 12 + Math.floor(Math.random() * 8);
            this.logMessage(`💥 CUIDADO! Armadilha de espinhos no piso! Você sofreu ${trapDamage} de dano!`);
            this.flashScreen('red');
            if (this.player.takeDamage(trapDamage)) {
                this.gameOver();
            }
            this.updateHUD();
        }

        if (tile === TILE.STAIRS) {
            this.logMessage("🌟 Você encontrou a escadaria de pedra que desce para o próximo nível!");
            if (window.soundFX) window.soundFX.playVictory();
            this.flashScreen('gold');
            setTimeout(() => {
                this.startLevel(this.level + 1);
            }, 800);
        }
    }

    findDoorMesh(gx, gz) {
        for (const child of this.dungeonGroup.children) {
            if (child.userData && child.userData.isDoor && child.userData.gridX === gx && child.userData.gridZ === gz) {
                return child;
            }
        }
        return null;
    }

    animateDoorOpen(doorMesh) {
        let moved = 0;
        const interval = setInterval(() => {
            doorMesh.position.y += 0.1;
            moved += 0.1;
            if (moved >= 2.2) {
                clearInterval(interval);
                doorMesh.visible = false;
            }
        }, 30);
    }

    openChest(gx, gz) {
        for (const child of this.dungeonGroup.children) {
            if (child.userData && child.userData.isChest && child.userData.gridX === gx && child.userData.gridZ === gz) {
                if (child.userData.opened) {
                    this.logMessage("O baú de tesouro já está vazio.");
                    return;
                }
                child.userData.opened = true;
                if (window.soundFX) window.soundFX.playChest();

                const goldFound = 30 + Math.floor(Math.random() * 40);
                this.player.gold += goldFound;

                if (Math.random() < 0.6) {
                    this.player.potions.health++;
                    this.logMessage(`🎁 Baú aberto! Você encontrou ${goldFound} Moedas de Ouro e 1 Poção de Vida!`);
                } else {
                    this.player.potions.mana++;
                    this.logMessage(`🎁 Baú aberto! Você encontrou ${goldFound} Moedas de Ouro e 1 Poção de Mana!`);
                }

                child.rotation.x = -0.4;
                child.position.y = 0.45;
                this.flashScreen('gold');
                this.updateHUD();
                return;
            }
        }
    }

    checkItemPickup(gx, gz) {
        for (let i = this.itemPickups.length - 1; i >= 0; i--) {
            const item = this.itemPickups[i];
            if (item.data.x === gx && item.data.z === gz) {
                if (item.data.type === 'gold_key') {
                    this.player.keys.gold++;
                    this.logMessage("🔑 Você encontrou a Chave Dourada da Cripta!");
                } else if (item.data.type === 'health_potion') {
                    this.player.potions.health++;
                    this.logMessage("🧪 Você coletou uma Poção de Vida!");
                } else if (item.data.type === 'mana_potion') {
                    this.player.potions.mana++;
                    this.logMessage("🔮 Você coletou uma Poção de Mana!");
                }

                if (window.soundFX) window.soundFX.playPickup();
                this.scene.remove(item.sprite);
                this.itemPickups.splice(i, 1);
                this.updateHUD();
            }
        }
    }

    playerAttack() {
        const now = performance.now();
        if (now - this.player.attackCooldown < this.player.maxCooldown) return;
        this.player.attackCooldown = now;

        this.triggerWeaponAnimation();
        if (window.soundFX) window.soundFX.playAttack();

        const v = this.getDirVector(this.facingDir);
        const frontX = this.gridX + v.dx;
        const frontZ = this.gridZ + v.dz;

        const target = this.monsters.find(m => !m.isDead && m.gridX === frontX && m.gridZ === frontZ);
        if (target) {
            this.attackMonster(target);
        } else {
            this.logMessage("Você golpeia o ar vazio com sua espada.");
        }
    }

    attackMonster(monster) {
        let dmg = Math.floor(this.player.weapon.minDmg + Math.random() * (this.player.weapon.maxDmg - this.player.weapon.minDmg + 1));
        const isCrit = Math.random() < this.player.weapon.critChance;
        if (isCrit) dmg = Math.floor(dmg * 1.5);

        if (window.soundFX) window.soundFX.playHit();
        this.showSlashFX();

        const died = monster.takeDamage(dmg);
        if (isCrit) {
            this.logMessage(`💥 GOLPE CRÍTICO! Você causou ${dmg} de dano ao ${monster.name}!`);
        } else {
            this.logMessage(`⚔️ Você acertou o ${monster.name} causando ${dmg} de dano! [HP: ${monster.hp}/${monster.maxHp}]`);
        }

        if (died) {
            this.player.gold += monster.gold;
            this.logMessage(`☠️ O ${monster.name} foi derrotado! Você ganhou +${monster.xp} XP e ${monster.gold} de ouro!`);
            this.player.gainXp(monster.xp, (msg) => this.logMessage(msg));
            this.updateHUD();
        }
    }

    castSpell() {
        if (this.player.mp < this.player.spell.manaCost) {
            this.logMessage("Mana insuficiente para conjurar Bola de Fogo! (Requer 15 MP)");
            return;
        }

        this.player.mp -= this.player.spell.manaCost;
        this.updateHUD();

        if (window.soundFX) window.soundFX.playSpell();
        this.logMessage("🔥 Você conjura uma Bola de Fogo flamejante pelo corredor!");

        const v = this.getDirVector(this.facingDir);
        const startPos = new THREE.Vector3(this.gridX * 2, 1.1, this.gridZ * 2);
        const dirVec = new THREE.Vector3(v.dx, 0, v.dz);

        const fb = new Fireball(this.scene, startPos, dirVec);
        this.fireballs.push(fb);
    }

    useHealthPotion() {
        this.player.useHealthPotion((msg) => this.logMessage(msg));
        this.updateHUD();
    }

    useManaPotion() {
        this.player.useManaPotion((msg) => this.logMessage(msg));
        this.updateHUD();
    }

    playerRest() {
        this.logMessage("💤 Você descansa por alguns instantes nas sombras da masmorra...");
        this.player.heal(25);
        this.player.restoreMp(20);
        this.updateHUD();

        if (Math.random() < 0.35) {
            const v = this.getDirVector((this.facingDir + 2) % 4);
            const ambusher = this.monsters.find(m => !m.isDead && Math.abs(m.gridX - this.gridX) <= 2 && Math.abs(m.gridZ - this.gridZ) <= 2);
            if (ambusher) {
                this.logMessage(`⚠️ EMBOSCADA! Um ${ambusher.name} atacou enquanto você descansava!`);
                const dmg = 10;
                this.flashScreen('red');
                if (this.player.takeDamage(dmg)) this.gameOver();
                this.updateHUD();
            }
        }
    }

    gameOver() {
        this.isGameOver = true;
        if (window.soundFX) window.soundFX.playGameOver();
        this.logMessage("💀 VOCÊ CAIU NA ESCURIDÃO DA MASMORRA...");
        const screen = document.getElementById('game-over-screen');
        if (screen) screen.classList.remove('hidden');
    }

    triggerWeaponAnimation() {
        const weaponEl = document.getElementById('weapon-view');
        if (weaponEl) {
            weaponEl.classList.remove('weapon-swing');
            void weaponEl.offsetWidth;
            weaponEl.classList.add('weapon-swing');
        }
    }

    showSlashFX() {
        const slashEl = document.getElementById('slash-fx');
        if (slashEl) {
            slashEl.classList.remove('active');
            void slashEl.offsetWidth;
            slashEl.classList.add('active');
        }
    }

    flashScreen(type = 'red') {
        const flashEl = document.getElementById('screen-flash');
        if (flashEl) {
            flashEl.className = `screen-flash flash-${type}`;
            setTimeout(() => {
                flashEl.className = 'screen-flash';
            }, 250);
        }
    }

    shakeCamera() {
        let shake = 0.08;
        const interval = setInterval(() => {
            this.camera.position.x += (Math.random() - 0.5) * shake;
            shake *= 0.75;
            if (shake < 0.005) {
                clearInterval(interval);
            }
        }, 20);
    }

    logMessage(text) {
        const logBox = document.getElementById('combat-log');
        if (!logBox) return;

        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = text;
        logBox.appendChild(line);

        while (logBox.children.length > 40) {
            logBox.removeChild(logBox.firstChild);
        }
        logBox.scrollTop = logBox.scrollHeight;
    }

    updateHUD() {
        const hpPercent = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
        const mpPercent = Math.max(0, Math.min(100, (this.player.mp / this.player.maxMp) * 100));
        const xpPercent = Math.max(0, Math.min(100, (this.player.xp / this.player.xpToNext) * 100));

        const hpBar = document.getElementById('hp-bar');
        const mpBar = document.getElementById('mp-bar');
        const xpBar = document.getElementById('xp-bar');

        if (hpBar) hpBar.style.width = `${hpPercent}%`;
        if (mpBar) mpBar.style.width = `${mpPercent}%`;
        if (xpBar) xpBar.style.width = `${xpPercent}%`;

        const hpVal = document.getElementById('hp-val');
        const mpVal = document.getElementById('mp-val');
        const lvlVal = document.getElementById('lvl-val');
        const goldVal = document.getElementById('gold-val');
        const floorVal = document.getElementById('floor-val');
        const potHpCount = document.getElementById('pot-hp-count');
        const potMpCount = document.getElementById('pot-mp-count');
        const keyGoldCount = document.getElementById('key-gold-count');

        if (hpVal) hpVal.textContent = `${this.player.hp}/${this.player.maxHp}`;
        if (mpVal) mpVal.textContent = `${this.player.mp}/${this.player.maxMp}`;
        if (lvlVal) lvlVal.textContent = `${this.player.level}`;
        if (goldVal) goldVal.textContent = `${this.player.gold}`;
        if (floorVal) floorVal.textContent = `PISO ${this.level}`;
        if (potHpCount) potHpCount.textContent = `${this.player.potions.health}`;
        if (potMpCount) potMpCount.textContent = `${this.player.potions.mana}`;
        if (keyGoldCount) keyGoldCount.textContent = `${this.player.keys.gold}`;
    }

    drawMinimap() {
        if (!this.minimapCtx) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        ctx.clearRect(0, 0, w, h);

        const cols = this.dungeon.width;
        const rows = this.dungeon.height;
        const minDim = Math.min(w, h);
        const tileW = minDim / cols;
        const tileH = minDim / rows;
        const offX = Math.floor((w - minDim) / 2);
        const offY = Math.floor((h - minDim) / 2);

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const rx = Math.floor(offX + x * tileW);
                const ry = Math.floor(offY + y * tileH);
                const rw = Math.ceil(tileW);
                const rh = Math.ceil(tileH);

                if (!this.dungeon.revealed[y][x]) {
                    ctx.fillStyle = '#050508';
                    ctx.fillRect(rx, ry, rw, rh);
                    continue;
                }

                const tile = this.dungeon.grid[y][x];
                if (tile === TILE.WALL) {
                    ctx.fillStyle = '#3a3d45';
                } else if (tile === TILE.STAIRS) {
                    ctx.fillStyle = '#f1c40f';
                } else if (tile === TILE.DOOR_WOOD || tile === TILE.DOOR_IRON) {
                    ctx.fillStyle = '#e67e22';
                } else if (tile === TILE.CHEST) {
                    ctx.fillStyle = '#9b59b6';
                } else {
                    ctx.fillStyle = '#1c1f26';
                }
                ctx.fillRect(rx, ry, rw, rh);
            }
        }

        const px = offX + (this.gridX + 0.5) * tileW;
        const py = offY + (this.gridZ + 0.5) * tileH;

        ctx.save();
        ctx.translate(px, py);

        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2, tileW * 0.4), 0, Math.PI * 2);
        ctx.fill();

        const v = this.getDirVector(this.facingDir);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(v.dx * tileW * 0.9, v.dz * tileH * 0.9);
        ctx.stroke();

        ctx.restore();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = performance.now() * 0.001;

        this.camera.position.lerp(this.cameraTargetPos, 12 * delta);

        let diffYaw = this.cameraTargetYaw - this.currentYaw;
        while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
        while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
        this.currentYaw += diffYaw * (14 * delta);
        this.camera.rotation.y = this.currentYaw;

        if (this.playerTorchLight) {
            this.playerTorchLight.intensity = 1.6 + Math.sin(time * 12) * 0.12 + Math.random() * 0.06;
        }
        for (let i = 0; i < this.torchLights.length; i++) {
            this.torchLights[i].intensity = 1.1 + Math.sin(time * 10 + i) * 0.15;
        }

        for (const item of this.itemPickups) {
            item.sprite.position.y = item.initialY + Math.sin(time * 3 + item.bobOffset) * 0.08;
        }

        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fb = this.fireballs[i];
            fb.update(delta, this.dungeon, this.monsters, (gx, gz, monster) => {
                if (monster) {
                    const dmg = Math.floor(this.player.spell.minDmg + Math.random() * (this.player.spell.maxDmg - this.player.spell.minDmg));
                    this.logMessage(`💥 EXPLOSÃO MÁGICA! A Bola de Fogo atingiu o ${monster.name} causando ${dmg} de dano!`);
                    const died = monster.takeDamage(dmg);
                    if (died) {
                        this.player.gold += monster.gold;
                        this.logMessage(`☠️ O ${monster.name} virou cinzas! +${monster.xp} XP e ${monster.gold} de ouro!`);
                        this.player.gainXp(monster.xp, (msg) => this.logMessage(msg));
                        this.updateHUD();
                    }
                } else {
                    this.logMessage("A Bola de Fogo colidiu com a parede e explodiu em fagulhas!");
                }
            });
            if (!fb.alive) {
                this.fireballs.splice(i, 1);
            }
        }

        if (!this.isGameOver) {
            for (const monster of this.monsters) {
                const attack = monster.update(delta, this.gridX, this.gridZ, this.dungeon);
                if (attack && attack.action === 'attack') {
                    if (window.soundFX) window.soundFX.playMonsterGrowl();
                    this.logMessage(`🚨 O ${monster.name} atacou você ferozmente causando ${attack.damage} de dano!`);
                    this.flashScreen('red');
                    this.shakeCamera();
                    if (this.player.takeDamage(attack.damage)) {
                        this.gameOver();
                    }
                    this.updateHUD();
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const weaponDataUrl = window.textureGen.createWeaponOverlay();
    const weaponImg = document.getElementById('weapon-view');
    if (weaponImg) weaponImg.src = weaponDataUrl;

    window.game = new Game();
});
