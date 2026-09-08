class Player {
    constructor() {
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 50;
        this.maxHp = 100;
        this.hp = 100;
        this.maxMp = 50;
        this.mp = 50;
        this.gold = 0;

        this.keys = {
            iron: 0,
            gold: 0
        };
        this.potions = {
            health: 2,
            mana: 2
        };

        this.weapon = {
            name: 'Espada de Aço',
            minDmg: 12,
            maxDmg: 20,
            critChance: 0.15
        };

        this.spell = {
            name: 'Bola de Fogo',
            manaCost: 15,
            minDmg: 28,
            maxDmg: 42
        };

        this.attackCooldown = 0;
        this.maxCooldown = 400;
        this.isAttacking = false;
    }

    reset() {
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 50;
        this.maxHp = 100;
        this.hp = 100;
        this.maxMp = 50;
        this.mp = 50;
        this.gold = 0;
        this.keys = { iron: 0, gold: 0 };
        this.potions = { health: 2, mana: 2 };
    }

    gainXp(amount, logCallback) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.levelUp(logCallback);
        }
    }

    levelUp(logCallback) {
        this.level++;
        this.xp -= this.xpToNext;
        this.xpToNext = Math.floor(this.xpToNext * 1.5);
        this.maxHp += 20;
        this.hp = this.maxHp;
        this.maxMp += 10;
        this.mp = this.maxMp;
        this.weapon.minDmg += 3;
        this.weapon.maxDmg += 5;
        this.spell.minDmg += 6;
        this.spell.maxDmg += 10;

        if (window.soundFX) window.soundFX.playVictory();
        if (logCallback) {
            logCallback(`⭐ NÍVEL ${this.level}! HP e MP restaurados e poder aumentado!`);
        }
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (window.soundFX) window.soundFX.playPlayerHurt();
        return this.hp <= 0;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    restoreMp(amount) {
        this.mp = Math.min(this.maxMp, this.mp + amount);
    }

    useHealthPotion(logCallback) {
        if (this.potions.health <= 0) {
            if (logCallback) logCallback("Você não tem Poções de Vida!");
            return false;
        }
        if (this.hp >= this.maxHp) {
            if (logCallback) logCallback("Sua vida já está no máximo!");
            return false;
        }
        this.potions.health--;
        this.heal(40);
        if (window.soundFX) window.soundFX.playPotion();
        if (logCallback) logCallback("Você bebeu uma Poção de Vida! (+40 HP)");
        return true;
    }

    useManaPotion(logCallback) {
        if (this.potions.mana <= 0) {
            if (logCallback) logCallback("Você não tem Poções de Mana!");
            return false;
        }
        if (this.mp >= this.maxMp) {
            if (logCallback) logCallback("Sua mana já está no máximo!");
            return false;
        }
        this.potions.mana--;
        this.restoreMp(30);
        if (window.soundFX) window.soundFX.playPotion();
        if (logCallback) logCallback("Você bebeu uma Poção de Mana! (+30 MP)");
        return true;
    }
}

class Monster {
    constructor(data, scene) {
        this.type = data.type;
        this.gridX = data.x;
        this.gridZ = data.z;
        this.dir = data.dir || 0;
        this.scene = scene;

        this.initStats();

        this.sprite = null;
        this.animTimer = Math.random() * Math.PI * 2;
        this.animFrame = 0;
        this.isHurt = false;
        this.hurtTimer = 0;
        this.isDead = false;

        this.attackCooldown = 1200 + Math.random() * 600;
        this.moveCooldown = 1500 + Math.random() * 1000;
        this.lastAttackTime = 0;
        this.lastMoveTime = 0;

        this.createMesh();
    }

    initStats() {
        switch (this.type) {
            case 'slime':
                this.name = 'Gosma Ácida';
                this.maxHp = 30;
                this.hp = 30;
                this.minDmg = 5;
                this.maxDmg = 9;
                this.xp = 20;
                this.gold = 8;
                this.scale = 1.1;
                this.yOffset = 0.55;
                break;
            case 'goblin':
                this.name = 'Goblin Saqueador';
                this.maxHp = 50;
                this.hp = 50;
                this.minDmg = 8;
                this.maxDmg = 14;
                this.xp = 35;
                this.gold = 18;
                this.scale = 1.3;
                this.yOffset = 0.65;
                break;
            case 'skeleton':
                this.name = 'Esqueleto Guerreiro';
                this.maxHp = 70;
                this.hp = 70;
                this.minDmg = 12;
                this.maxDmg = 18;
                this.xp = 50;
                this.gold = 25;
                this.scale = 1.4;
                this.yOffset = 0.7;
                break;
            case 'demon':
                this.name = 'Arquidemônio Observador';
                this.maxHp = 140;
                this.hp = 140;
                this.minDmg = 18;
                this.maxDmg = 26;
                this.xp = 150;
                this.gold = 90;
                this.scale = 1.7;
                this.yOffset = 0.85;
                break;
        }
    }

    createMesh() {
        const tex = this.getTexture(0);
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthWrite: false
        });
        this.sprite = new THREE.Sprite(mat);
        this.sprite.scale.set(this.scale * 1.5, this.scale * 1.5, 1);
        this.updateWorldPosition();
        this.scene.add(this.sprite);
    }

    getTexture(frame) {
        if (!window.textureGen) return null;
        switch (this.type) {
            case 'slime': return window.textureGen.createSlimeSprite(frame);
            case 'skeleton': return window.textureGen.createSkeletonSprite(frame);
            case 'goblin': return window.textureGen.createGoblinSprite(frame);
            case 'demon': return window.textureGen.createDemonSprite(frame);
            default: return window.textureGen.createSlimeSprite(frame);
        }
    }

    updateWorldPosition() {
        if (!this.sprite) return;
        this.sprite.position.set(this.gridX * 2, this.yOffset, this.gridZ * 2);
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.isHurt = true;
        this.hurtTimer = 200;
        if (this.sprite) {
            this.sprite.material.color.setHex(0xff3333);
        }
        if (window.soundFX) window.soundFX.playMonsterGrowl();
        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        this.isDead = true;
        if (window.soundFX) window.soundFX.playMonsterDeath();
        if (this.sprite) {
            let fade = 1.0;
            const interval = setInterval(() => {
                fade -= 0.1;
                if (this.sprite) {
                    this.sprite.material.opacity = fade;
                    this.sprite.position.y -= 0.05;
                }
                if (fade <= 0) {
                    clearInterval(interval);
                    if (this.sprite) this.scene.remove(this.sprite);
                }
            }, 30);
        }
    }

    update(delta, playerGridX, playerGridZ, dungeon) {
        if (this.isDead) return;

        this.animTimer += delta * 4;
        const currentFrame = Math.sin(this.animTimer) > 0 ? 1 : 0;
        if (currentFrame !== this.animFrame) {
            this.animFrame = currentFrame;
            if (this.sprite) {
                this.sprite.material.map = this.getTexture(this.animFrame);
            }
        }

        if (this.isHurt) {
            this.hurtTimer -= delta * 1000;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
                if (this.sprite) this.sprite.material.color.setHex(0xffffff);
            }
        }

        if (this.type === 'demon' && this.sprite) {
            this.sprite.position.y = this.yOffset + Math.sin(this.animTimer * 0.8) * 0.1;
        }

        const dist = Math.abs(this.gridX - playerGridX) + Math.abs(this.gridZ - playerGridZ);

        const now = performance.now();
        if (dist === 1) {
            if (now - this.lastAttackTime > this.attackCooldown) {
                this.lastAttackTime = now;
                return { action: 'attack', damage: Math.floor(this.minDmg + Math.random() * (this.maxDmg - this.minDmg + 1)) };
            }
        } else if (dist <= 4 && now - this.lastMoveTime > this.moveCooldown) {
            this.lastMoveTime = now;
            this.chasePlayer(playerGridX, playerGridZ, dungeon);
        }
        return null;
    }

    chasePlayer(playerGridX, playerGridZ, dungeon) {
        const dx = playerGridX - this.gridX;
        const dz = playerGridZ - this.gridZ;

        let targetX = this.gridX;
        let targetZ = this.gridZ;

        if (Math.abs(dx) > Math.abs(dz)) {
            targetX += Math.sign(dx);
        } else {
            targetZ += Math.sign(dz);
        }

        if (dungeon.isWalkable(targetX, targetZ) && !(targetX === playerGridX && targetZ === playerGridZ)) {
            this.gridX = targetX;
            this.gridZ = targetZ;
            this.updateWorldPosition();
        } else {
            targetX = this.gridX;
            targetZ = this.gridZ;
            if (Math.abs(dx) <= Math.abs(dz)) {
                targetX += Math.sign(dx);
            } else {
                targetZ += Math.sign(dz);
            }
            if (dungeon.isWalkable(targetX, targetZ) && !(targetX === playerGridX && targetZ === playerGridZ)) {
                this.gridX = targetX;
                this.gridZ = targetZ;
                this.updateWorldPosition();
            }
        }
    }
}

class Fireball {
    constructor(scene, startPos, dirVector) {
        this.scene = scene;
        this.position = startPos.clone();
        this.direction = dirVector.clone().normalize();
        this.speed = 10;
        this.alive = true;
        this.lifeTime = 0;
        this.maxLife = 2.0;

        const geom = new THREE.SphereGeometry(0.2, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.position.copy(this.position);

        this.light = new THREE.PointLight(0xff4400, 2, 4);
        this.mesh.add(this.light);

        this.scene.add(this.mesh);
    }

    update(delta, dungeon, monsters, onHit) {
        if (!this.alive) return;

        this.lifeTime += delta;
        if (this.lifeTime > this.maxLife) {
            this.destroy();
            return;
        }

        const moveStep = this.direction.clone().multiplyScalar(this.speed * delta);
        this.position.add(moveStep);
        this.mesh.position.copy(this.position);

        const gx = Math.round(this.position.x / 2);
        const gz = Math.round(this.position.z / 2);

        if (gx < 0 || gx >= dungeon.width || gz < 0 || gz >= dungeon.height || dungeon.grid[gz][gx] === TILE.WALL) {
            this.explode(onHit, gx, gz, null);
            return;
        }

        for (const m of monsters) {
            if (!m.isDead && m.gridX === gx && m.gridZ === gz) {
                this.explode(onHit, gx, gz, m);
                return;
            }
        }
    }

    explode(onHit, gx, gz, hitMonster) {
        this.alive = false;
        if (window.soundFX) window.soundFX.playExplosion();
        this.destroy();
        if (onHit) onHit(gx, gz, hitMonster);
    }

    destroy() {
        this.alive = false;
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}

window.Player = Player;
window.Monster = Monster;
window.Fireball = Fireball;
