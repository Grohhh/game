import { GameState, PlayerState, Enemy, Particle, Projectile, Position, Skill, CharacterClass, Dungeon, Item, Notification, ChatMessage } from './types';
import { CLASS_DATA, SKILLS, ENEMY_TEMPLATES, BOSS_TEMPLATES, ITEM_TEMPLATES, generateEnemy, generateBoss, RARITY_COLORS } from './data';

const WORLD_SIZE = 4000;
const ZONE_SIZE = 1000;

export class GameEngine {
  state: GameState;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  keys: Set<string> = new Set();
  mousePos: Position = { x: 0, y: 0 };
  mouseWorldPos: Position = { x: 0, y: 0 };
  lastTime: number = 0;
  animTime: number = 0;
  onStateChange: (() => void) | null = null;
  npcBots: { id: string; name: string; position: Position; color: string; level: number; dialog: string; type: string }[] = [];
  trees: { x: number; y: number; size: number; type: number }[] = [];
  rocks: { x: number; y: number; size: number }[] = [];
  grassPatches: { x: number; y: number; size: number }[] = [];
  ambientParticles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = this.createInitialState();
    this.generateWorld();
    this.setupInput();
  }

  createInitialState(): GameState {
    return {
      player: this.createPlayer('warrior'),
      enemies: [],
      dungeons: [],
      particles: [],
      projectiles: [],
      camera: { x: 0, y: 0 },
      worldSize: WORLD_SIZE,
      currentZone: 'Элвиннский лес',
      gameTime: 0,
      isPaused: false,
      showInventory: false,
      showSkills: false,
      showDungeonMap: false,
      inDungeon: false,
      currentDungeon: null,
      notifications: [],
      chatMessages: [
        { id: '1', sender: 'Система', text: 'Добро пожаловать в Realm of Legends!', type: 'system', time: Date.now() },
        { id: '2', sender: 'Система', text: 'Используйте WASD для перемещения, мышь для атаки', type: 'system', time: Date.now() },
      ],
    };
  }

  createPlayer(classType: CharacterClass): PlayerState {
    const classData = CLASS_DATA[classType];
    return {
      name: 'Герой',
      class: classType,
      level: 1,
      exp: 0,
      expToNext: 100,
      gold: 0,
      position: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
      stats: { ...classData.baseStats },
      skills: [...SKILLS[classType]],
      inventory: [
        { ...ITEM_TEMPLATES[13] }, // health potion
        { ...ITEM_TEMPLATES[13] },
        { ...ITEM_TEMPLATES[14] }, // mana potion
      ],
      equippedItems: {},
      isAttacking: false,
      targetId: null,
      animFrame: 0,
      facing: 0,
      isMoving: false,
      buffs: [],
    };
  }

  generateWorld() {
    // Generate enemies per zone
    const zones = [
      { name: 'Элвиннский лес', enemies: ['boar', 'wolf', 'spider'], x: 0, y: 0 },
      { name: 'Тёмный лес', enemies: ['treant', 'darkElf', 'bear'], x: ZONE_SIZE, y: 0 },
      { name: 'Горы Грозовой Гряды', enemies: ['golem', 'harpy', 'ogre'], x: 0, y: ZONE_SIZE },
      { name: 'Огненные земли', enemies: ['demon', 'fireElemental', 'dragonWhelp'], x: ZONE_SIZE, y: ZONE_SIZE },
    ];

    let enemyId = 0;
    zones.forEach((zone) => {
      for (let i = 0; i < 12; i++) {
        const template = ENEMY_TEMPLATES[zone.enemies[Math.floor(Math.random() * zone.enemies.length)] as keyof typeof ENEMY_TEMPLATES];
        const pos = {
          x: zone.x + 100 + Math.random() * (ZONE_SIZE - 200),
          y: zone.y + 100 + Math.random() * (ZONE_SIZE - 200),
        };
        this.state.enemies.push(generateEnemy(template, pos, `enemy_${enemyId++}`));
      }
    });

    // Generate dungeons
    this.state.dungeons = [
      {
        id: 'dungeon_1', name: 'Пещера вепрей', description: 'Логово диких вепрей', level: 3,
        enemies: [], boss: generateBoss(BOSS_TEMPLATES.dungeon1Boss, { x: 300, y: 300 }, 'd1_boss'),
        loot: [ITEM_TEMPLATES[1], ITEM_TEMPLATES[6]], completed: false,
        position: { x: 400, y: 300 }, size: 40, color: '#8B4513'
      },
      {
        id: 'dungeon_2', name: 'Башня тёмного мага', description: 'Обитель тёмной магии', level: 6,
        enemies: [], boss: generateBoss(BOSS_TEMPLATES.dungeon2Boss, { x: 300, y: 300 }, 'd2_boss'),
        loot: [ITEM_TEMPLATES[2], ITEM_TEMPLATES[7]], completed: false,
        position: { x: 1300, y: 400 }, size: 40, color: '#9400D3'
      },
      {
        id: 'dungeon_3', name: 'Крепость големов', description: 'Древняя крепость каменных стражей', level: 9,
        enemies: [], boss: generateBoss(BOSS_TEMPLATES.dungeon3Boss, { x: 300, y: 300 }, 'd3_boss'),
        loot: [ITEM_TEMPLATES[3], ITEM_TEMPLATES[8]], completed: false,
        position: { x: 500, y: 1400 }, size: 40, color: '#4682B4'
      },
      {
        id: 'dungeon_4', name: 'Трон демонов', description: 'Врата в ад', level: 12,
        enemies: [], boss: generateBoss(BOSS_TEMPLATES.dungeon4Boss, { x: 300, y: 300 }, 'd4_boss'),
        loot: [ITEM_TEMPLATES[4], ITEM_TEMPLATES[9]], completed: false,
        position: { x: 1500, y: 1500 }, size: 40, color: '#FF0000'
      },
    ];

    // Generate NPC bots
    this.npcBots = [
      { id: 'npc_1', name: 'Торговец Маркус', position: { x: WORLD_SIZE / 2 - 80, y: WORLD_SIZE / 2 - 80 }, color: '#FFD700', level: 20, dialog: 'Добро пожаловать! У меня лучшие товары!', type: 'vendor' },
      { id: 'npc_2', name: 'Целительница Элина', position: { x: WORLD_SIZE / 2 + 80, y: WORLD_SIZE / 2 - 80 }, color: '#FF69B4', level: 15, dialog: 'Позвольте мне исцелить ваши раны...', type: 'healer' },
      { id: 'npc_3', name: 'Мастер оружия Грок', position: { x: WORLD_SIZE / 2 - 80, y: WORLD_SIZE / 2 + 80 }, color: '#CD853F', level: 25, dialog: 'Хотите улучшить своё оружие?', type: 'blacksmith' },
      { id: 'npc_4', name: 'Странник Зед', position: { x: WORLD_SIZE / 2 + 80, y: WORLD_SIZE / 2 + 80 }, color: '#4169E1', level: 30, dialog: 'Я видел вещи... ужасные вещи...', type: 'quest' },
    ];

    // Generate world decorations
    for (let i = 0; i < 300; i++) {
      this.trees.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        size: 20 + Math.random() * 30,
        type: Math.floor(Math.random() * 3),
      });
    }
    for (let i = 0; i < 150; i++) {
      this.rocks.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        size: 10 + Math.random() * 20,
      });
    }
    for (let i = 0; i < 500; i++) {
      this.grassPatches.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        size: 5 + Math.random() * 15,
      });
    }
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'i') this.state.showInventory = !this.state.showInventory;
      if (e.key === 'k') this.state.showSkills = !this.state.showSkills;
      if (e.key === 'm') this.state.showDungeonMap = !this.state.showDungeonMap;
      if (e.key === 'Escape') {
        this.state.showInventory = false;
        this.state.showSkills = false;
        this.state.showDungeonMap = false;
        if (this.state.inDungeon) this.exitDungeon();
      }
      // Skill hotkeys
      if (e.key >= '1' && e.key <= '4') {
        const skillIndex = parseInt(e.key) - 1;
        this.useSkill(skillIndex);
      }
      this.onStateChange?.();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.mouseWorldPos = {
        x: this.mousePos.x + this.state.camera.x,
        y: this.mousePos.y + this.state.camera.y,
      };
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left + this.state.camera.x;
      const clickY = e.clientY - rect.top + this.state.camera.y;

      // Check if clicked on enemy
      let closestEnemy: Enemy | null = null;
      let closestDist = Infinity;
      for (const enemy of this.state.enemies) {
        if (enemy.isDead) continue;
        const dist = this.distance(enemy.position, { x: clickX, y: clickY });
        if (dist < enemy.size + 10 && dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      if (closestEnemy) {
        this.state.player.targetId = closestEnemy.id;
        this.addChatMessage('Бой', `Цель: ${closestEnemy.name} (Ур.${closestEnemy.level})`, 'combat');
      }

      // Check dungeon entrance
      this.state.dungeons.forEach((dungeon) => {
        const dist = this.distance(dungeon.position, { x: clickX, y: clickY });
        if (dist < dungeon.size + 20) {
          const playerDist = this.distance(this.state.player.position, dungeon.position);
          if (playerDist < 100) {
            this.enterDungeon(dungeon);
          } else {
            this.addNotification(`Подойдите ближе к ${dungeon.name}`, 'info');
          }
        }
      });

      this.onStateChange?.();
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // Right click to use health potion
      this.useHealthPotion();
    });
  }

  enterDungeon(dungeon: Dungeon) {
    if (this.state.player.level < dungeon.level) {
      this.addNotification(`Нужен уровень ${dungeon.level} для входа!`, 'info');
      return;
    }
    this.state.inDungeon = true;
    this.state.currentDungeon = dungeon;
    this.state.enemies = [];
    
    // Generate dungeon enemies
    for (let i = 0; i < 5; i++) {
      const template = Object.values(ENEMY_TEMPLATES)[dungeon.level - 1 + Math.floor(Math.random() * 3)] || ENEMY_TEMPLATES.boar;
      const pos = { x: 100 + Math.random() * 400, y: 100 + Math.random() * 400 };
      const enemy = generateEnemy(template, pos, `dungeon_enemy_${i}`);
      enemy.stats.maxHp *= 1.5;
      enemy.stats.hp = enemy.stats.maxHp;
      enemy.stats.attack *= 1.3;
      this.state.enemies.push(enemy);
    }
    
    // Add boss
    const boss = { ...dungeon.boss, position: { x: 300, y: 300 }, spawnPosition: { x: 300, y: 300 }, isDead: false };
    this.state.enemies.push(boss);
    
    this.state.player.position = { x: 50, y: 300 };
    this.addNotification(`Вход в ${dungeon.name}!`, 'quest');
    this.addChatMessage('Система', `Вы вошли в подземелье: ${dungeon.name}`, 'system');
    this.onStateChange?.();
  }

  exitDungeon() {
    this.state.inDungeon = false;
    this.state.currentDungeon = null;
    this.state.player.position = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
    this.generateWorld();
    this.onStateChange?.();
  }

  useSkill(index: number) {
    const skill = this.state.player.skills[index];
    if (!skill) return;
    if (skill.currentCooldown > 0) {
      this.addNotification(`${skill.name} перезаряжается!`, 'info');
      return;
    }
    if (this.state.player.stats.mana < skill.manaCost) {
      this.addNotification('Недостаточно маны!', 'info');
      return;
    }

    this.state.player.stats.mana -= skill.manaCost;
    skill.currentCooldown = skill.cooldown;

    if (skill.type === 'heal') {
      const healAmount = Math.abs(skill.damage) + this.state.player.stats.magicPower;
      this.state.player.stats.hp = Math.min(this.state.player.stats.maxHp, this.state.player.stats.hp + healAmount);
      this.spawnParticles(this.state.player.position, 'heal', skill.color, 10);
      this.addDamageNumber(this.state.player.position, `+${Math.floor(healAmount)}`, '#00FF00');
      this.addChatMessage('Бой', `${skill.name}: +${Math.floor(healAmount)} HP`, 'combat');
    } else if (skill.type === 'buff') {
      this.state.player.buffs.push({
        id: skill.id,
        name: skill.name,
        duration: 10,
        maxDuration: 10,
        stats: { defense: this.state.player.stats.defense * 0.5 },
        icon: skill.icon,
      });
      this.spawnParticles(this.state.player.position, 'magic', skill.color, 15);
      this.addChatMessage('Бой', `${skill.name} активирован!`, 'combat');
    } else {
      // Damage skill
      const target = this.state.enemies.find(e => e.id === this.state.player.targetId && !e.isDead);
      if (target) {
        const damage = this.calculateDamage(skill.damage + this.state.player.stats.magicPower, target.stats.defense);
        this.applyDamage(target, damage);
        
        if (skill.aoe > 0) {
          this.state.enemies.forEach(enemy => {
            if (enemy.id !== target.id && !enemy.isDead) {
              const dist = this.distance(target.position, enemy.position);
              if (dist < skill.aoe) {
                const aoeDmg = this.calculateDamage((skill.damage + this.state.player.stats.magicPower) * 0.6, enemy.stats.defense);
                this.applyDamage(enemy, aoeDmg);
              }
            }
          });
        }

        // Projectile for ranged skills
        if (skill.range > 100) {
          const angle = Math.atan2(target.position.y - this.state.player.position.y, target.position.x - this.state.player.position.x);
          this.state.projectiles.push({
            x: this.state.player.position.x,
            y: this.state.player.position.y,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            damage: 0,
            color: skill.color,
            size: 8,
            target: target.id,
            type: skill.id,
            life: 60,
          });
        }

        this.spawnParticles(target.position, 'damage', skill.color, 12);
      } else {
        // Auto-target nearest enemy for AoE
        if (skill.aoe > 0) {
          this.state.enemies.forEach(enemy => {
            if (!enemy.isDead) {
              const dist = this.distance(this.state.player.position, enemy.position);
              if (dist < skill.aoe + skill.range) {
                const damage = this.calculateDamage(skill.damage + this.state.player.stats.magicPower, enemy.stats.defense);
                this.applyDamage(enemy, damage);
                this.spawnParticles(enemy.position, 'damage', skill.color, 8);
              }
            }
          });
        }
      }
    }
    this.onStateChange?.();
  }

  useHealthPotion() {
    const idx = this.state.player.inventory.findIndex(i => i.id === 'health_potion');
    if (idx >= 0) {
      const healAmount = 100;
      this.state.player.stats.hp = Math.min(this.state.player.stats.maxHp, this.state.player.stats.hp + healAmount);
      this.state.player.inventory.splice(idx, 1);
      this.spawnParticles(this.state.player.position, 'heal', '#00FF00', 8);
      this.addDamageNumber(this.state.player.position, `+${healAmount}`, '#00FF00');
      this.addNotification('Использовано зелье здоровья', 'info');
      this.onStateChange?.();
    }
  }

  calculateDamage(attack: number, defense: number): number {
    const baseDamage = Math.max(1, attack - defense * 0.5);
    const variance = 0.8 + Math.random() * 0.4;
    const isCrit = Math.random() < this.state.player.stats.critChance;
    return Math.floor(baseDamage * variance * (isCrit ? 2 : 1));
  }

  applyDamage(enemy: Enemy, damage: number) {
    enemy.stats.hp -= damage;
    enemy.hitFlash = 10;
    enemy.isAggro = true;
    
    const isCrit = damage > (enemy.stats.defense + this.state.player.stats.attack) * 0.8;
    this.addDamageNumber(enemy.position, `${damage}`, isCrit ? '#FFD700' : '#FF4444');
    
    if (enemy.stats.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy: Enemy) {
    enemy.isDead = true;
    enemy.deathTime = Date.now();
    enemy.stats.hp = 0;

    // Grant experience
    this.state.player.exp += enemy.exp;
    this.addDamageNumber(enemy.position, `+${enemy.exp} XP`, '#AAFFAA');
    this.spawnParticles(enemy.position, 'xp', '#FFD700', 20);

    // Gold drop
    const gold = Math.floor(5 + Math.random() * enemy.level * 3);
    this.state.player.gold += gold;

    // Loot drop
    if (Math.random() < (enemy.type === 'boss' ? 1 : 0.3)) {
      const lootPool = enemy.type === 'boss' 
        ? ITEM_TEMPLATES.filter(i => i.rarity === 'rare' || i.rarity === 'epic')
        : ITEM_TEMPLATES.filter(i => i.rarity === 'common' || i.rarity === 'uncommon');
      if (lootPool.length > 0) {
        const item = { ...lootPool[Math.floor(Math.random() * lootPool.length)] };
        this.state.player.inventory.push(item);
        this.addNotification(`Получен предмет: ${item.name}`, 'loot');
        this.addChatMessage('Добыча', `Вы получили: ${item.name}`, 'loot');
      }
    }

    // Potion drops
    if (Math.random() < 0.4) {
      this.state.player.inventory.push({ ...ITEM_TEMPLATES[13] });
    }
    if (Math.random() < 0.3) {
      this.state.player.inventory.push({ ...ITEM_TEMPLATES[14] });
    }

    // Check level up
    while (this.state.player.exp >= this.state.player.expToNext) {
      this.levelUp();
    }

    this.state.player.targetId = null;
    this.addChatMessage('Бой', `${enemy.name} повержен! +${enemy.exp} опыта, +${gold} золота`, 'combat');
    this.onStateChange?.();
  }

  levelUp() {
    this.state.player.exp -= this.state.player.expToNext;
    this.state.player.level++;
    this.state.player.expToNext = Math.floor(this.state.player.expToNext * 1.5);
    
    // Stat increases
    const classData = CLASS_DATA[this.state.player.class];
    this.state.player.stats.maxHp += Math.floor(classData.baseStats.maxHp * 0.1);
    this.state.player.stats.hp = this.state.player.stats.maxHp;
    this.state.player.stats.maxMana += Math.floor(classData.baseStats.maxMana * 0.08);
    this.state.player.stats.mana = this.state.player.stats.maxMana;
    this.state.player.stats.attack += Math.floor(classData.baseStats.attack * 0.12);
    this.state.player.stats.defense += Math.floor(classData.baseStats.defense * 0.1);
    this.state.player.stats.magicPower += Math.floor(classData.baseStats.magicPower * 0.1);

    this.spawnParticles(this.state.player.position, 'xp', '#FFD700', 30);
    this.addNotification(`Уровень повышен! Теперь вы ${this.state.player.level} уровня!`, 'levelup');
    this.addChatMessage('Система', `🎉 Поздравляем! Вы достигли ${this.state.player.level} уровня!`, 'system');
  }

  update(deltaTime: number) {
    if (this.state.isPaused) return;
    
    this.state.gameTime += deltaTime;
    this.animTime += deltaTime;

    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateParticles(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updateCamera();
    this.updateZone();
    this.updateCooldowns(deltaTime);
    this.updateBuffs(deltaTime);
    this.updateAmbientParticles();
    this.updateEnemyRespawn();
  }

  private autoAttackTimer = 0;

  updatePlayer(deltaTime: number) {
    const player = this.state.player;
    let dx = 0, dy = 0;

    if (this.keys.has('w') || this.keys.has('ц')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('ы')) dy += 1;
    if (this.keys.has('a') || this.keys.has('ф')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('в')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;
      player.position.x += dx * player.stats.speed;
      player.position.y += dy * player.stats.speed;
      player.facing = Math.atan2(dy, dx);
      player.isMoving = true;
      player.animFrame += deltaTime * 8;
    } else {
      player.isMoving = false;
    }

    // Clamp position
    const limit = this.state.inDungeon ? 600 : WORLD_SIZE;
    player.position.x = Math.max(10, Math.min(limit - 10, player.position.x));
    player.position.y = Math.max(10, Math.min(limit - 10, player.position.y));

    // Mana regen
    player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + deltaTime * 3);
    
    // HP regen (slow, only out of combat)
    const inCombat = this.state.enemies.some(e => !e.isDead && e.isAggro);
    if (!inCombat) {
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + deltaTime * 2);
    }

    // Auto-attack when target selected
    if (player.targetId) {
      const target = this.state.enemies.find(e => e.id === player.targetId && !e.isDead);
      if (target) {
        const dist = this.distance(player.position, target.position);
        if (dist < 70) {
          // Face the target
          player.facing = Math.atan2(target.position.y - player.position.y, target.position.x - player.position.x);
          
          this.autoAttackTimer -= deltaTime;
          if (this.autoAttackTimer <= 0) {
            this.autoAttackTimer = 1.5; // Attack speed
            const damage = this.calculateDamage(player.stats.attack, target.stats.defense);
            this.applyDamage(target, damage);
            this.spawnParticles(target.position, 'damage', CLASS_DATA[player.class].color, 5);
          }
        } else if (dist < 300) {
          // Move toward target
          const angle = Math.atan2(target.position.y - player.position.y, target.position.x - player.position.x);
          player.facing = angle;
          player.position.x += Math.cos(angle) * player.stats.speed;
          player.position.y += Math.sin(angle) * player.stats.speed;
          player.isMoving = true;
          player.animFrame += deltaTime * 8;
        }
      } else {
        player.targetId = null;
      }
    }
  }

  updateEnemies(deltaTime: number) {
    this.state.enemies.forEach(enemy => {
      if (enemy.isDead) return;

      enemy.animFrame += deltaTime * 3;
      if (enemy.hitFlash > 0) enemy.hitFlash -= deltaTime * 20;

      const distToPlayer = this.distance(enemy.position, this.state.player.position);

      // Aggro check
      if (distToPlayer < enemy.aggroRange) {
        enemy.isAggro = true;
      } else if (distToPlayer > enemy.aggroRange * 2) {
        enemy.isAggro = false;
      }

      if (enemy.isAggro) {
        // Move toward player
        if (distToPlayer > enemy.attackRange) {
          const angle = Math.atan2(
            this.state.player.position.y - enemy.position.y,
            this.state.player.position.x - enemy.position.x
          );
          enemy.position.x += Math.cos(angle) * enemy.stats.speed;
          enemy.position.y += Math.sin(angle) * enemy.stats.speed;
        } else {
          // Attack player
          enemy.currentAttackCooldown -= deltaTime;
          if (enemy.currentAttackCooldown <= 0) {
            enemy.currentAttackCooldown = enemy.attackCooldown;
            const damage = this.calculateEnemyDamage(enemy.stats.attack, this.state.player.stats.defense);
            this.state.player.stats.hp -= damage;
            this.addDamageNumber(this.state.player.position, `${damage}`, '#FF0000');
            this.spawnParticles(this.state.player.position, 'damage', '#FF0000', 5);
            
            if (this.state.player.stats.hp <= 0) {
              this.playerDeath();
            }
          }
        }
      } else {
        // Wander
        if (Math.random() < 0.005) {
          enemy.targetPosition = {
            x: enemy.spawnPosition.x + (Math.random() - 0.5) * 200,
            y: enemy.spawnPosition.y + (Math.random() - 0.5) * 200,
          };
        }
        if (enemy.targetPosition) {
          const dist = this.distance(enemy.position, enemy.targetPosition);
          if (dist > 5) {
            const angle = Math.atan2(
              enemy.targetPosition.y - enemy.position.y,
              enemy.targetPosition.x - enemy.position.x
            );
            enemy.position.x += Math.cos(angle) * enemy.stats.speed * 0.3;
            enemy.position.y += Math.sin(angle) * enemy.stats.speed * 0.3;
          } else {
            enemy.targetPosition = null;
          }
        }
      }
    });
  }

  calculateEnemyDamage(attack: number, defense: number): number {
    const baseDamage = Math.max(1, attack - defense * 0.4);
    const variance = 0.8 + Math.random() * 0.4;
    return Math.floor(baseDamage * variance);
  }

  playerDeath() {
    this.state.player.stats.hp = this.state.player.stats.maxHp * 0.5;
    this.state.player.stats.mana = this.state.player.stats.maxMana * 0.5;
    this.state.player.position = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
    this.state.player.gold = Math.floor(this.state.player.gold * 0.9);
    if (this.state.inDungeon) this.exitDungeon();
    this.addNotification('Вы погибли! Потеряно 10% золота.', 'death');
    this.addChatMessage('Система', '💀 Вы погибли и были возвращены на кладбище.', 'system');
    this.onStateChange?.();
  }

  updateParticles(deltaTime: number) {
    this.state.particles = this.state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.1;
      p.life -= deltaTime * 60;
      return p.life > 0;
    });
  }

  updateProjectiles(deltaTime: number) {
    this.state.projectiles = this.state.projectiles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      
      // Check collision with target
      const target = this.state.enemies.find(e => e.id === p.target);
      if (target && !target.isDead) {
        const dist = this.distance({ x: p.x, y: p.y }, target.position);
        if (dist < target.size) {
          this.spawnParticles(target.position, 'damage', p.color, 10);
          return false;
        }
      }
      
      return p.life > 0;
    });
  }

  updateCamera() {
    const targetX = this.state.player.position.x - this.canvas.width / 2;
    const targetY = this.state.player.position.y - this.canvas.height / 2;
    this.state.camera.x += (targetX - this.state.camera.x) * 0.1;
    this.state.camera.y += (targetY - this.state.camera.y) * 0.1;
  }

  updateZone() {
    const px = this.state.player.position.x;
    const py = this.state.player.position.y;
    if (px < ZONE_SIZE && py < ZONE_SIZE) this.state.currentZone = 'Элвиннский лес';
    else if (px >= ZONE_SIZE && py < ZONE_SIZE) this.state.currentZone = 'Тёмный лес';
    else if (px < ZONE_SIZE && py >= ZONE_SIZE) this.state.currentZone = 'Горы Грозовой Гряды';
    else this.state.currentZone = 'Огненные земли';
  }

  updateCooldowns(deltaTime: number) {
    this.state.player.skills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - deltaTime);
      }
    });
  }

  updateBuffs(deltaTime: number) {
    this.state.player.buffs = this.state.player.buffs.filter(buff => {
      buff.duration -= deltaTime;
      return buff.duration > 0;
    });
  }

  updateAmbientParticles() {
    if (Math.random() < 0.1) {
      this.ambientParticles.push({
        x: this.state.camera.x + Math.random() * this.canvas.width,
        y: this.state.camera.y + Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.2,
        life: 100,
        maxLife: 100,
        color: `hsl(${Math.random() * 60 + 100}, 70%, 70%)`,
        size: 2 + Math.random() * 3,
        type: 'magic',
      });
    }
    this.ambientParticles = this.ambientParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  }

  updateEnemyRespawn() {
    this.state.enemies.forEach(enemy => {
      if (enemy.isDead && Date.now() - enemy.deathTime > enemy.respawnTime) {
        enemy.isDead = false;
        enemy.stats.hp = enemy.stats.maxHp;
        enemy.position = { ...enemy.spawnPosition };
        enemy.isAggro = false;
      }
    });
  }

  spawnParticles(pos: Position, type: string, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.state.particles.push({
        x: pos.x + (Math.random() - 0.5) * 20,
        y: pos.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 30 + Math.random() * 30,
        maxLife: 60,
        color,
        size: 2 + Math.random() * 4,
        type: type as any,
      });
    }
  }

  addDamageNumber(pos: Position, text: string, color: string) {
    this.state.particles.push({
      x: pos.x + (Math.random() - 0.5) * 20,
      y: pos.y - 20,
      vx: (Math.random() - 0.5) * 2,
      vy: -2,
      life: 60,
      maxLife: 60,
      color,
      size: 14,
      type: 'damage',
      text,
    });
  }

  addNotification(text: string, type: 'info' | 'loot' | 'levelup' | 'quest' | 'death') {
    this.state.notifications.push({
      id: Date.now().toString(),
      text,
      type,
      time: Date.now(),
    });
    if (this.state.notifications.length > 5) {
      this.state.notifications.shift();
    }
    this.onStateChange?.();
  }

  addChatMessage(sender: string, text: string, type: 'system' | 'combat' | 'loot' | 'player') {
    this.state.chatMessages.push({
      id: Date.now().toString(),
      sender,
      text,
      type,
      time: Date.now(),
    });
    if (this.state.chatMessages.length > 50) {
      this.state.chatMessages.shift();
    }
    this.onStateChange?.();
  }

  distance(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  render() {
    const ctx = this.ctx;
    const cam = this.state.camera;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // Draw ground
    this.drawGround(ctx);
    
    // Draw decorations
    this.drawDecorations(ctx);
    
    // Draw dungeon entrances
    if (!this.state.inDungeon) {
      this.drawDungeonEntrances(ctx);
    }
    
    // Draw NPCs
    this.drawNPCs(ctx);
    
    // Draw enemies
    this.drawEnemies(ctx);
    
    // Draw player
    this.drawPlayer(ctx);
    
    // Draw particles
    this.drawParticles(ctx);
    
    // Draw projectiles
    this.drawProjectiles(ctx);
    
    // Draw ambient particles
    this.drawAmbientParticles(ctx);

    // Draw dungeon walls if in dungeon
    if (this.state.inDungeon) {
      this.drawDungeonWalls(ctx);
    }

    ctx.restore();

    // Draw UI overlay
    this.drawMinimap(ctx, w, h);
  }

  drawGround(ctx: CanvasRenderingContext2D) {
    const cam = this.state.camera;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Zone-based ground colors
    const zones = [
      { x: 0, y: 0, w: ZONE_SIZE, h: ZONE_SIZE, color1: '#2d5016', color2: '#3d6b1e' },
      { x: ZONE_SIZE, y: 0, w: ZONE_SIZE, h: ZONE_SIZE, color1: '#1a3a0a', color2: '#2d4f15' },
      { x: 0, y: ZONE_SIZE, w: ZONE_SIZE, h: ZONE_SIZE, color1: '#4a4a4a', color2: '#5a5a5a' },
      { x: ZONE_SIZE, y: ZONE_SIZE, w: ZONE_SIZE, h: ZONE_SIZE, color1: '#4a1a0a', color2: '#6b2a15' },
    ];

    zones.forEach(zone => {
      const gradient = ctx.createRadialGradient(
        zone.x + zone.w / 2, zone.y + zone.h / 2, 0,
        zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w
      );
      gradient.addColorStop(0, zone.color2);
      gradient.addColorStop(1, zone.color1);
      ctx.fillStyle = gradient;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    });

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 100;
    const startX = Math.floor(cam.x / gridSize) * gridSize;
    const startY = Math.floor(cam.y / gridSize) * gridSize;
    for (let x = startX; x < cam.x + w + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, cam.y);
      ctx.lineTo(x, cam.y + h);
      ctx.stroke();
    }
    for (let y = startY; y < cam.y + h + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(cam.x, y);
      ctx.lineTo(cam.x + w, y);
      ctx.stroke();
    }
  }

  drawDecorations(ctx: CanvasRenderingContext2D) {
    const cam = this.state.camera;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Grass
    this.grassPatches.forEach(g => {
      if (g.x < cam.x - 50 || g.x > cam.x + w + 50 || g.y < cam.y - 50 || g.y > cam.y + h + 50) return;
      ctx.fillStyle = `rgba(50, 180, 50, ${0.3 + Math.sin(this.animTime * 2 + g.x) * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, g.size, g.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Rocks
    this.rocks.forEach(r => {
      if (r.x < cam.x - 50 || r.x > cam.x + w + 50 || r.y < cam.y - 50 || r.y > cam.y + h + 50) return;
      const gradient = ctx.createRadialGradient(r.x - r.size * 0.2, r.y - r.size * 0.2, 0, r.x, r.y, r.size);
      gradient.addColorStop(0, '#888');
      gradient.addColorStop(1, '#444');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.size, r.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Trees
    this.trees.forEach(t => {
      if (t.x < cam.x - 80 || t.x > cam.x + w + 80 || t.y < cam.y - 80 || t.y > cam.y + h + 80) return;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(t.x + 5, t.y + t.size * 0.8, t.size * 0.6, t.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Trunk
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(t.x - 4, t.y - t.size * 0.3, 8, t.size * 0.6);
      // Canopy
      const canopyColor = t.type === 0 ? '#2E7D32' : t.type === 1 ? '#1B5E20' : '#388E3C';
      ctx.fillStyle = canopyColor;
      ctx.beginPath();
      ctx.arc(t.x, t.y - t.size * 0.4, t.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(t.x - t.size * 0.15, t.y - t.size * 0.5, t.size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawDungeonEntrances(ctx: CanvasRenderingContext2D) {
    this.state.dungeons.forEach(dungeon => {
      const pulse = Math.sin(this.animTime * 3) * 0.3 + 0.7;
      
      // Glow
      const gradient = ctx.createRadialGradient(dungeon.position.x, dungeon.position.y, 0, dungeon.position.x, dungeon.position.y, dungeon.size * 2);
      gradient.addColorStop(0, dungeon.color + '80');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(dungeon.position.x, dungeon.position.y, dungeon.size * 2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Portal
      ctx.fillStyle = dungeon.color;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dungeon.position.x, dungeon.position.y, dungeon.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner swirl
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const angle = this.animTime * 2 + (i * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(dungeon.position.x, dungeon.position.y, dungeon.size * 0.6, angle, angle + 1);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(dungeon.name, dungeon.position.x, dungeon.position.y - dungeon.size - 10);
      ctx.font = '10px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`Ур. ${dungeon.level}`, dungeon.position.x, dungeon.position.y - dungeon.size + 2);
    });
  }

  drawNPCs(ctx: CanvasRenderingContext2D) {
    this.npcBots.forEach(npc => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(npc.position.x, npc.position.y + 15, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      const gradient = ctx.createRadialGradient(npc.position.x - 3, npc.position.y - 5, 0, npc.position.x, npc.position.y, 15);
      gradient.addColorStop(0, npc.color);
      gradient.addColorStop(1, '#333');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(npc.position.x, npc.position.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Exclamation mark for quest givers
      if (npc.type === 'quest') {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', npc.position.x, npc.position.y - 22);
      } else if (npc.type === 'vendor') {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', npc.position.x, npc.position.y - 22);
      }

      // Name
      ctx.fillStyle = npc.color;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, npc.position.x, npc.position.y - 28);
    });
  }

  drawEnemies(ctx: CanvasRenderingContext2D) {
    const cam = this.state.camera;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.state.enemies.forEach(enemy => {
      if (enemy.isDead) return;
      if (enemy.position.x < cam.x - 100 || enemy.position.x > cam.x + w + 100 ||
          enemy.position.y < cam.y - 100 || enemy.position.y > cam.y + h + 100) return;

      const isTarget = enemy.id === this.state.player.targetId;
      const bobOffset = Math.sin(enemy.animFrame) * 3;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(enemy.position.x, enemy.position.y + enemy.size * 0.6, enemy.size * 0.6, enemy.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aggro indicator
      if (enemy.isAggro) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, enemy.aggroRange, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Target ring
      if (isTarget) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y + bobOffset, enemy.size + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Body
      const bodyGradient = ctx.createRadialGradient(
        enemy.position.x - enemy.size * 0.2, enemy.position.y + bobOffset - enemy.size * 0.2, 0,
        enemy.position.x, enemy.position.y + bobOffset, enemy.size
      );
      
      if (enemy.hitFlash > 0) {
        bodyGradient.addColorStop(0, '#FFFFFF');
        bodyGradient.addColorStop(1, enemy.color);
      } else {
        bodyGradient.addColorStop(0, this.lightenColor(enemy.color, 30));
        bodyGradient.addColorStop(1, enemy.color);
      }
      
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y + bobOffset, enemy.size, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = enemy.type === 'boss' ? '#FFD700' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth = enemy.type === 'boss' ? 3 : 1.5;
      ctx.stroke();

      // Eyes
      const eyeOffset = enemy.size * 0.3;
      ctx.fillStyle = enemy.isAggro ? '#FF0000' : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(enemy.position.x - eyeOffset, enemy.position.y + bobOffset - eyeOffset * 0.5, enemy.size * 0.15, 0, Math.PI * 2);
      ctx.arc(enemy.position.x + eyeOffset, enemy.position.y + bobOffset - eyeOffset * 0.5, enemy.size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(enemy.position.x - eyeOffset + 1, enemy.position.y + bobOffset - eyeOffset * 0.5, enemy.size * 0.08, 0, Math.PI * 2);
      ctx.arc(enemy.position.x + eyeOffset + 1, enemy.position.y + bobOffset - eyeOffset * 0.5, enemy.size * 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Health bar
      const barWidth = enemy.size * 2;
      const barHeight = 6;
      const barX = enemy.position.x - barWidth / 2;
      const barY = enemy.position.y - enemy.size - 15 + bobOffset;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
      
      const hpPercent = enemy.stats.hp / enemy.stats.maxHp;
      const hpColor = hpPercent > 0.6 ? '#00FF00' : hpPercent > 0.3 ? '#FFFF00' : '#FF0000';
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

      // Name and level
      ctx.fillStyle = enemy.type === 'boss' ? '#FFD700' : enemy.type === 'elite' ? '#00BFFF' : '#FFFFFF';
      ctx.font = `${enemy.type === 'boss' ? 'bold ' : ''}11px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`${enemy.name} [Ур.${enemy.level}]`, enemy.position.x, barY - 5);
    });
  }

  drawPlayer(ctx: CanvasRenderingContext2D) {
    const player = this.state.player;
    const classData = CLASS_DATA[player.class];
    const bobOffset = player.isMoving ? Math.sin(player.animFrame) * 4 : Math.sin(this.animTime * 2) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(player.position.x, player.position.y + 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player glow
    const glowGradient = ctx.createRadialGradient(player.position.x, player.position.y, 0, player.position.x, player.position.y, 35);
    glowGradient.addColorStop(0, classData.color + '40');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y, 35, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyGradient = ctx.createRadialGradient(
      player.position.x - 4, player.position.y + bobOffset - 4, 0,
      player.position.x, player.position.y + bobOffset, 18
    );
    bodyGradient.addColorStop(0, this.lightenColor(classData.color, 40));
    bodyGradient.addColorStop(0.7, classData.color);
    bodyGradient.addColorStop(1, this.darkenColor(classData.color, 30));
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y + bobOffset, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Class icon
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(classData.icon, player.position.x, player.position.y + bobOffset + 5);

    // Name plate
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.name} [Ур.${player.level}]`, player.position.x, player.position.y - 28 + bobOffset);

    // Direction indicator
    const dirX = player.position.x + Math.cos(player.facing) * 25;
    const dirY = player.position.y + bobOffset + Math.sin(player.facing) * 25;
    ctx.fillStyle = classData.color;
    ctx.beginPath();
    ctx.arc(dirX, dirY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawParticles(ctx: CanvasRenderingContext2D) {
    this.state.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  }

  drawProjectiles(ctx: CanvasRenderingContext2D) {
    this.state.projectiles.forEach(p => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.5, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Trail
      ctx.strokeStyle = p.color + '80';
      ctx.lineWidth = p.size * 0.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
      ctx.stroke();
    });
  }

  drawAmbientParticles(ctx: CanvasRenderingContext2D) {
    this.ambientParticles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  drawDungeonWalls(ctx: CanvasRenderingContext2D) {
    // Draw dungeon boundary
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 600, 600);

    // Floor tiles
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, 600, 600);
    
    // Tile pattern
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x < 600; x += 50) {
      for (let y = 0; y < 600; y += 50) {
        ctx.strokeRect(x, y, 50, 50);
      }
    }

    // Torches
    const torchPositions = [{ x: 30, y: 30 }, { x: 570, y: 30 }, { x: 30, y: 570 }, { x: 570, y: 570 }];
    torchPositions.forEach(pos => {
      const flicker = Math.sin(this.animTime * 10 + pos.x) * 3;
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 40 + flicker);
      gradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 40 + flicker, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawMinimap(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const mapSize = 150;
    const mapX = w - mapSize - 10;
    const mapY = 10;
    const scale = mapSize / WORLD_SIZE;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Zone colors
    const zoneColors = ['#2d5016', '#1a3a0a', '#4a4a4a', '#4a1a0a'];
    for (let i = 0; i < 4; i++) {
      const zx = (i % 2) * ZONE_SIZE * scale;
      const zy = Math.floor(i / 2) * ZONE_SIZE * scale;
      ctx.fillStyle = zoneColors[i];
      ctx.fillRect(mapX + zx, mapY + zy, ZONE_SIZE * scale, ZONE_SIZE * scale);
    }

    // Enemies
    this.state.enemies.forEach(enemy => {
      if (enemy.isDead) return;
      ctx.fillStyle = enemy.type === 'boss' ? '#FFD700' : '#FF0000';
      ctx.fillRect(mapX + enemy.position.x * scale - 1, mapY + enemy.position.y * scale - 1, 2, 2);
    });

    // Dungeons
    this.state.dungeons.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(mapX + d.position.x * scale, mapY + d.position.y * scale, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(mapX + this.state.player.position.x * scale, mapY + this.state.player.position.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Zone name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.state.currentZone, mapX + mapSize / 2, mapY + mapSize + 12);
  }

  lightenColor(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `rgb(${r},${g},${b})`;
  }

  darkenColor(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `rgb(${r},${g},${b})`;
  }

  setPlayerClass(classType: CharacterClass) {
    this.state.player = this.createPlayer(classType);
    this.onStateChange?.();
  }

  gameLoop(timestamp: number) {
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
