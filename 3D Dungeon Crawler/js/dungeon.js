const TILE = {
    EMPTY: 0,
    WALL: 1,
    DOOR_WOOD: 2,
    DOOR_IRON: 3,
    STAIRS: 4,
    CHEST: 5,
    TRAP: 6
};

class DungeonGenerator {
    constructor() {
        this.width = 17;
        this.height = 17;
        this.grid = [];
        this.revealed = [];
        this.rooms = [];
        this.torches = [];
        this.items = [];
        this.enemies = [];
        this.playerStart = { x: 1, z: 1, dir: 0 };
        this.stairsPos = { x: 1, z: 1 };
    }

    generate(level = 1) {
        this.width = Math.min(23, 15 + (level - 1) * 2);
        this.height = Math.min(23, 15 + (level - 1) * 2);

        if (this.width % 2 === 0) this.width++;
        if (this.height % 2 === 0) this.height++;

        this.grid = Array(this.height).fill(0).map(() => Array(this.width).fill(TILE.WALL));
        this.revealed = Array(this.height).fill(0).map(() => Array(this.width).fill(false));
        this.rooms = [];
        this.torches = [];
        this.items = [];
        this.enemies = [];

        const numRooms = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numRooms; i++) {
            const rw = 3 + Math.floor(Math.random() * 2) * 2;
            const rh = 3 + Math.floor(Math.random() * 2) * 2;
            const rx = 1 + Math.floor(Math.random() * ((this.width - rw - 1) / 2)) * 2;
            const ry = 1 + Math.floor(Math.random() * ((this.height - rh - 1) / 2)) * 2;

            for (let y = ry; y < ry + rh; y++) {
                for (let x = rx; x < rx + rw; x++) {
                    if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) {
                        this.grid[y][x] = TILE.EMPTY;
                    }
                }
            }

            this.rooms.push({ x: rx, y: ry, w: rw, h: rh });
        }

        const startX = 1;
        const startY = 1;
        this.carvePassagesFrom(startX, startY);

        for (const room of this.rooms) {
            const doorPoints = [
                { x: room.x + Math.floor(room.w / 2), y: Math.max(1, room.y - 1) },
                { x: room.x + Math.floor(room.w / 2), y: Math.min(this.height - 2, room.y + room.h) },
                { x: Math.max(1, room.x - 1), y: room.y + Math.floor(room.h / 2) },
                { x: Math.min(this.width - 2, room.x + room.w), y: room.y + Math.floor(room.h / 2) }
            ];
            const dp = doorPoints[Math.floor(Math.random() * doorPoints.length)];
            if (dp.y > 0 && dp.y < this.height - 1 && dp.x > 0 && dp.x < this.width - 1) {
                this.grid[dp.y][dp.x] = TILE.EMPTY;
            }
        }

        const startRoom = this.rooms[0] || { x: 1, y: 1, w: 1, h: 1 };
        this.playerStart = {
            x: startRoom.x + Math.floor(startRoom.w / 2),
            z: startRoom.y + Math.floor(startRoom.h / 2),
            dir: 0
        };
        this.grid[this.playerStart.z][this.playerStart.x] = TILE.EMPTY;

        const distances = this.calculateDistances(this.playerStart.x, this.playerStart.z);
        let maxDist = -1;
        let farthestTile = { x: this.width - 2, z: this.height - 2 };

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === TILE.EMPTY && distances[y][x] > maxDist) {
                    maxDist = distances[y][x];
                    farthestTile = { x, z: y };
                }
            }
        }

        this.stairsPos = farthestTile;
        this.grid[this.stairsPos.z][this.stairsPos.x] = TILE.STAIRS;

        this.placeDoors();
        this.placeKeyAndChests(distances, level);
        this.placeTraps();
        this.placeTorches();
        this.placeMonstersAndLoot(level);

        this.revealRadius(this.playerStart.x, this.playerStart.z, 2);

        return this;
    }

    carvePassagesFrom(cx, cy) {
        this.grid[cy][cx] = TILE.EMPTY;
        const dirs = [
            { x: 0, y: -2 },
            { x: 2, y: 0 },
            { x: 0, y: 2 },
            { x: -2, y: 0 }
        ];
        dirs.sort(() => Math.random() - 0.5);

        for (const dir of dirs) {
            const nx = cx + dir.x;
            const ny = cy + dir.y;
            if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
                if (this.grid[ny][nx] === TILE.WALL) {
                    this.grid[cy + dir.y / 2][cx + dir.x / 2] = TILE.EMPTY;
                    this.carvePassagesFrom(nx, ny);
                }
            }
        }
    }

    calculateDistances(startX, startY) {
        const dist = Array(this.height).fill(0).map(() => Array(this.width).fill(-1));
        const queue = [{ x: startX, y: startY, d: 0 }];
        dist[startY][startX] = 0;

        while (queue.length > 0) {
            const curr = queue.shift();
            const neighbors = [
                { x: curr.x, y: curr.y - 1 },
                { x: curr.x + 1, y: curr.y },
                { x: curr.x, y: curr.y + 1 },
                { x: curr.x - 1, y: curr.y }
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < this.width && n.y >= 0 && n.y < this.height) {
                    if (this.grid[n.y][n.x] !== TILE.WALL && dist[n.y][n.x] === -1) {
                        dist[n.y][n.x] = curr.d + 1;
                        queue.push({ x: n.x, y: n.y, d: curr.d + 1 });
                    }
                }
            }
        }
        return dist;
    }

    placeDoors() {
        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (this.grid[y][x] === TILE.EMPTY) {
                    const isHorizPassage = this.grid[y - 1][x] === TILE.WALL && this.grid[y + 1][x] === TILE.WALL &&
                                           this.grid[y][x - 1] === TILE.EMPTY && this.grid[y][x + 1] === TILE.EMPTY;
                    const isVertPassage = this.grid[y][x - 1] === TILE.WALL && this.grid[y][x + 1] === TILE.WALL &&
                                          this.grid[y - 1][x] === TILE.EMPTY && this.grid[y + 1][x] === TILE.EMPTY;

                    if (isHorizPassage || isVertPassage) {
                        const distToStairs = Math.abs(x - this.stairsPos.x) + Math.abs(y - this.stairsPos.z);
                        if (distToStairs <= 3 && distToStairs > 0 && Math.random() < 0.8) {
                            this.grid[y][x] = TILE.DOOR_IRON;
                        } else if (Math.random() < 0.25) {
                            this.grid[y][x] = TILE.DOOR_WOOD;
                        }
                    }
                }
            }
        }
    }

    placeKeyAndChests(distances, level) {
        const deadEnds = [];
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === TILE.EMPTY) {
                    if (x === this.playerStart.x && y === this.playerStart.z) continue;
                    if (x === this.stairsPos.x && y === this.stairsPos.z) continue;

                    let wallCount = 0;
                    if (this.grid[y - 1][x] === TILE.WALL) wallCount++;
                    if (this.grid[y + 1][x] === TILE.WALL) wallCount++;
                    if (this.grid[y][x - 1] === TILE.WALL) wallCount++;
                    if (this.grid[y][x + 1] === TILE.WALL) wallCount++;

                    if (wallCount >= 3) {
                        deadEnds.push({ x, y, dist: distances[y][x] });
                    }
                }
            }
        }

        deadEnds.sort((a, b) => b.dist - a.dist);

        if (deadEnds.length > 0) {
            const keySpot = deadEnds.splice(Math.floor(deadEnds.length / 2), 1)[0];
            this.items.push({
                type: 'gold_key',
                x: keySpot.x,
                z: keySpot.y,
                name: 'Chave Dourada da Cripta'
            });
        }

        const chestCount = Math.min(deadEnds.length, 2 + Math.floor(Math.random() * 2));
        for (let i = 0; i < chestCount; i++) {
            const spot = deadEnds.pop();
            if (spot) {
                this.grid[spot.y][spot.x] = TILE.CHEST;
            }
        }
    }

    placeTraps() {
        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (this.grid[y][x] === TILE.EMPTY) {
                    if (Math.abs(x - this.playerStart.x) < 2 && Math.abs(y - this.playerStart.z) < 2) continue;
                    if (x === this.stairsPos.x && y === this.stairsPos.z) continue;

                    if (Math.random() < 0.04) {
                        this.grid[y][x] = TILE.TRAP;
                    }
                }
            }
        }
    }

    placeTorches() {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === TILE.WALL) {
                    const neighbors = [
                        { dx: 0, dz: 1, angle: 0 },
                        { dx: 0, dz: -1, angle: Math.PI },
                        { dx: 1, dz: 0, angle: Math.PI / 2 },
                        { dx: -1, dz: 0, angle: -Math.PI / 2}
                    ];

                    for (const n of neighbors) {
                        const nx = x + n.dx;
                        const nz = y + n.dz;
                        if (nx >= 0 && nx < this.width && nz >= 0 && nz < this.height) {
                            if (this.torches.length < 8 && this.grid[nz][nx] === TILE.EMPTY && Math.random() < 0.15) {
                                this.torches.push({
                                    wallX: x,
                                    wallZ: y,
                                    facingX: n.dx,
                                    facingZ: n.dz,
                                    angle: n.angle
                                });
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    placeMonstersAndLoot(level) {
        const monsterCount = 4 + level * 2;
        const types = ['slime', 'goblin', 'skeleton'];
        if (level >= 2) types.push('demon');

        let spawned = 0;
        let attempts = 0;

        while (spawned < monsterCount && attempts < 200) {
            attempts++;
            const rx = 1 + Math.floor(Math.random() * (this.width - 2));
            const rz = 1 + Math.floor(Math.random() * (this.height - 2));

            const distToStart = Math.abs(rx - this.playerStart.x) + Math.abs(rz - this.playerStart.z);
            if (distToStart < 4) continue;
            if (this.grid[rz][rx] !== TILE.EMPTY) continue;
            if (this.enemies.some(e => e.x === rx && e.z === rz)) continue;

            let mType = 'slime';
            const roll = Math.random();
            if (level === 1) {
                mType = roll < 0.6 ? 'slime' : 'skeleton';
            } else if (level === 2) {
                mType = roll < 0.4 ? 'slime' : roll < 0.75 ? 'goblin' : 'skeleton';
            } else {
                mType = roll < 0.3 ? 'goblin' : roll < 0.65 ? 'skeleton' : 'demon';
            }

            this.enemies.push({
                type: mType,
                x: rx,
                z: rz,
                dir: Math.floor(Math.random() * 4)
            });
            spawned++;
        }

        if (level >= 2) {
            this.enemies.push({
                type: 'demon',
                x: this.stairsPos.x,
                z: Math.max(1, this.stairsPos.z - 1),
                dir: 2
            });
        }

        const potionCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < potionCount; i++) {
            const rx = 1 + Math.floor(Math.random() * (this.width - 2));
            const rz = 1 + Math.floor(Math.random() * (this.height - 2));
            if (this.grid[rz][rx] === TILE.EMPTY && !this.items.some(it => it.x === rx && it.z === rz)) {
                this.items.push({
                    type: Math.random() < 0.65 ? 'health_potion' : 'mana_potion',
                    x: rx,
                    z: rz,
                    name: Math.random() < 0.65 ? 'Poção de Vida' : 'Poção de Mana'
                });
            }
        }
    }

    revealRadius(px, pz, radius = 2) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = px + dx;
                const ny = pz + dy;
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    this.revealed[ny][nx] = true;
                }
            }
        }
    }

    isWalkable(x, z) {
        if (x < 0 || x >= this.width || z < 0 || z >= this.height) return false;
        const tile = this.grid[z][x];
        return tile === TILE.EMPTY || tile === TILE.STAIRS || tile === TILE.TRAP;
    }
}

window.DungeonGenerator = DungeonGenerator;
window.TILE = TILE;
