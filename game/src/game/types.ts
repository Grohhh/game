export type CharacterClass = 'warrior' | 'mage' | 'ranger' | 'healer';

export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  attack: number;
  defense: number;
  magicPower: number;
  speed: number;
  critChance: number;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  manaCost: number;
  cooldown: number;
  currentCooldown: number;
  damage: number;
  range: number;
  aoe: number;
  description: string;
  type: 'damage' | 'heal' | 'buff' | 'aoe';
  color: string;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'accessory';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: Partial<Stats>;
  icon: string;
  description: string;
}

export interface Enemy {
  id: string;
  name: string;
  type: 'normal' | 'elite' | 'boss';
  position: Position;
  stats: Stats;
  level: number;
  exp: number;
  color: string;
  size: number;
  skills: Skill[];
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  currentAttackCooldown: number;
  isAggro: boolean;
  targetPosition: Position | null;
  spawnPosition: Position;
  loot: Item[];
  isDead: boolean;
  deathTime: number;
  respawnTime: number;
  animFrame: number;
  hitFlash: number;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  level: number;
  enemies: Enemy[];
  boss: Enemy;
  loot: Item[];
  completed: boolean;
  position: Position;
  size: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'damage' | 'heal' | 'xp' | 'magic' | 'fire' | 'ice' | 'poison';
  text?: string;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  size: number;
  target: string;
  type: string;
  life: number;
}

export interface GameState {
  player: PlayerState;
  enemies: Enemy[];
  dungeons: Dungeon[];
  particles: Particle[];
  projectiles: Projectile[];
  camera: Position;
  worldSize: number;
  currentZone: string;
  gameTime: number;
  isPaused: boolean;
  showInventory: boolean;
  showSkills: boolean;
  showDungeonMap: boolean;
  inDungeon: boolean;
  currentDungeon: Dungeon | null;
  notifications: Notification[];
  chatMessages: ChatMessage[];
}

export interface PlayerState {
  name: string;
  class: CharacterClass;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  position: Position;
  stats: Stats;
  skills: Skill[];
  inventory: Item[];
  equippedItems: { weapon?: Item; armor?: Item; accessory?: Item };
  isAttacking: boolean;
  targetId: string | null;
  animFrame: number;
  facing: number;
  isMoving: boolean;
  buffs: Buff[];
}

export interface Buff {
  id: string;
  name: string;
  duration: number;
  maxDuration: number;
  stats: Partial<Stats>;
  icon: string;
}

export interface Notification {
  id: string;
  text: string;
  type: 'info' | 'loot' | 'levelup' | 'quest' | 'death';
  time: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: 'system' | 'combat' | 'loot' | 'player';
  time: number;
}
