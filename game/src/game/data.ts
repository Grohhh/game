import { Skill, Item, Enemy, Dungeon, CharacterClass, Stats, Position } from './types';

export const CLASS_DATA: Record<CharacterClass, { name: string; icon: string; color: string; baseStats: Stats; description: string }> = {
  warrior: {
    name: 'Воин',
    icon: '⚔️',
    color: '#C79C6E',
    description: 'Мощный боец ближнего боя с высоким здоровьем и защитой',
    baseStats: { maxHp: 500, hp: 500, maxMana: 100, mana: 100, attack: 25, defense: 20, magicPower: 5, speed: 3, critChance: 0.1 }
  },
  mage: {
    name: 'Маг',
    icon: '🔮',
    color: '#69CCF0',
    description: 'Мастер магии с мощными заклинаниями и контролем',
    baseStats: { maxHp: 280, hp: 280, maxMana: 400, mana: 400, attack: 8, defense: 8, magicPower: 35, speed: 2.8, critChance: 0.15 }
  },
  ranger: {
    name: 'Охотник',
    icon: '🏹',
    color: '#ABD473',
    description: 'Ловкий стрелок с высоким уроном и мобильностью',
    baseStats: { maxHp: 350, hp: 350, maxMana: 200, mana: 200, attack: 22, defense: 12, magicPower: 10, speed: 4, critChance: 0.25 }
  },
  healer: {
    name: 'Жрец',
    icon: '✨',
    color: '#FFFFFF',
    description: 'Целитель с мощными исцеляющими заклинаниями',
    baseStats: { maxHp: 320, hp: 320, maxMana: 380, mana: 380, attack: 10, defense: 10, magicPower: 28, speed: 3, critChance: 0.08 }
  }
};

export const SKILLS: Record<CharacterClass, Skill[]> = {
  warrior: [
    { id: 'heroic_strike', name: 'Героический удар', icon: '⚔️', manaCost: 15, cooldown: 2, currentCooldown: 0, damage: 45, range: 60, aoe: 0, description: 'Мощный удар мечом', type: 'damage', color: '#FF6B35' },
    { id: 'whirlwind', name: 'Вихрь клинков', icon: '🌀', manaCost: 30, cooldown: 8, currentCooldown: 0, damage: 35, range: 80, aoe: 80, description: 'Атака по площади', type: 'aoe', color: '#FFD700' },
    { id: 'shield_wall', name: 'Стена щитов', icon: '🛡️', manaCost: 20, cooldown: 15, currentCooldown: 0, damage: 0, range: 0, aoe: 0, description: '+50% защиты на 10 сек', type: 'buff', color: '#4169E1' },
    { id: 'execute', name: 'Казнь', icon: '💀', manaCost: 25, cooldown: 5, currentCooldown: 0, damage: 80, range: 60, aoe: 0, description: 'Добивающий удар', type: 'damage', color: '#DC143C' },
  ],
  mage: [
    { id: 'fireball', name: 'Огненный шар', icon: '🔥', manaCost: 25, cooldown: 2, currentCooldown: 0, damage: 55, range: 250, aoe: 0, description: 'Запускает огненный шар', type: 'damage', color: '#FF4500' },
    { id: 'blizzard', name: 'Метель', icon: '❄️', manaCost: 50, cooldown: 10, currentCooldown: 0, damage: 40, range: 200, aoe: 120, description: 'Ледяная буря по площади', type: 'aoe', color: '#00BFFF' },
    { id: 'frost_nova', name: 'Ледяная новa', icon: '💎', manaCost: 30, cooldown: 12, currentCooldown: 0, damage: 25, range: 100, aoe: 100, description: 'Замораживает врагов вокруг', type: 'aoe', color: '#87CEEB' },
    { id: 'arcane_blast', name: 'Чародейский взрыв', icon: '💫', manaCost: 40, cooldown: 4, currentCooldown: 0, damage: 70, range: 200, aoe: 0, description: 'Мощный магический удар', type: 'damage', color: '#9370DB' },
  ],
  ranger: [
    { id: 'aimed_shot', name: 'Прицельный выстрел', icon: '🎯', manaCost: 20, cooldown: 3, currentCooldown: 0, damage: 50, range: 300, aoe: 0, description: 'Точный выстрел', type: 'damage', color: '#32CD32' },
    { id: 'multi_shot', name: 'Мульти-выстрел', icon: '🏹', manaCost: 35, cooldown: 6, currentCooldown: 0, damage: 30, range: 250, aoe: 100, description: 'Стреляет по нескольким целям', type: 'aoe', color: '#FFD700' },
    { id: 'evasion', name: 'Уклонение', icon: '💨', manaCost: 15, cooldown: 20, currentCooldown: 0, damage: 0, range: 0, aoe: 0, description: '+100% уклонения на 5 сек', type: 'buff', color: '#90EE90' },
    { id: 'poison_arrow', name: 'Отравленная стрела', icon: '☠️', manaCost: 25, cooldown: 5, currentCooldown: 0, damage: 35, range: 280, aoe: 0, description: 'Стрела с ядом', type: 'damage', color: '#9400D3' },
  ],
  healer: [
    { id: 'smite', name: 'Кара', icon: '☀️', manaCost: 20, cooldown: 2, currentCooldown: 0, damage: 40, range: 200, aoe: 0, description: 'Священный удар', type: 'damage', color: '#FFD700' },
    { id: 'heal', name: 'Исцеление', icon: '💚', manaCost: 35, cooldown: 3, currentCooldown: 0, damage: -60, range: 0, aoe: 0, description: 'Восстанавливает здоровье', type: 'heal', color: '#00FF00' },
    { id: 'holy_nova', name: 'Святая новa', icon: '⭐', manaCost: 45, cooldown: 10, currentCooldown: 0, damage: 35, range: 120, aoe: 120, description: 'Взрыв святой энергии', type: 'aoe', color: '#FFD700' },
    { id: 'renew', name: 'Обновление', icon: '🌿', manaCost: 30, cooldown: 8, currentCooldown: 0, damage: -100, range: 0, aoe: 0, description: 'Постепенное исцеление', type: 'heal', color: '#98FB98' },
  ]
};

export const ENEMY_TEMPLATES = {
  // Zone 1 - Starting area
  boar: { name: 'Дикий вепрь', color: '#8B4513', size: 18, hp: 80, attack: 8, defense: 3, exp: 15, level: 1 },
  wolf: { name: 'Серый волк', color: '#696969', size: 20, hp: 120, attack: 12, defense: 5, exp: 25, level: 2 },
  bandit: { name: 'Разбойник', color: '#4A4A4A', size: 22, hp: 150, attack: 15, defense: 8, exp: 35, level: 3 },
  spider: { name: 'Гигантский паук', color: '#2F4F4F', size: 16, hp: 100, attack: 18, defense: 4, exp: 30, level: 3 },
  
  // Zone 2 - Forest
  treant: { name: 'Древень', color: '#228B22', size: 28, hp: 250, attack: 20, defense: 15, exp: 55, level: 5 },
  darkElf: { name: 'Тёмный эльф', color: '#4B0082', size: 22, hp: 180, attack: 25, defense: 10, exp: 50, level: 5 },
  bear: { name: 'Медведь-шатун', color: '#654321', size: 30, hp: 300, attack: 22, defense: 18, exp: 60, level: 6 },
  
  // Zone 3 - Mountains
  golem: { name: 'Каменный голем', color: '#808080', size: 35, hp: 400, attack: 28, defense: 25, exp: 80, level: 8 },
  harpy: { name: 'Гарпия', color: '#8B008B', size: 24, hp: 220, attack: 32, defense: 12, exp: 70, level: 8 },
  ogre: { name: 'Огр', color: '#556B2F', size: 38, hp: 500, attack: 35, defense: 20, exp: 100, level: 10 },
  
  // Zone 4 - Volcanic
  demon: { name: 'Демон', color: '#DC143C', size: 30, hp: 600, attack: 40, defense: 22, exp: 120, level: 12 },
  fireElemental: { name: 'Элементаль огня', color: '#FF4500', size: 26, hp: 450, attack: 45, defense: 15, exp: 110, level: 12 },
  dragonWhelp: { name: 'Дракончик', color: '#B22222', size: 28, hp: 550, attack: 42, defense: 28, exp: 130, level: 13 },
};

export const BOSS_TEMPLATES = {
  dungeon1Boss: { name: 'Король вепрей', color: '#FFD700', size: 50, hp: 800, attack: 30, defense: 20, exp: 200, level: 5 },
  dungeon2Boss: { name: 'Тёмный маг', color: '#9400D3', size: 45, hp: 1200, attack: 45, defense: 15, exp: 350, level: 8 },
  dungeon3Boss: { name: 'Каменный страж', color: '#4682B4', size: 55, hp: 2000, attack: 55, defense: 35, exp: 500, level: 10 },
  dungeon4Boss: { name: 'Повелитель демонов', color: '#FF0000', size: 60, hp: 3500, attack: 70, defense: 30, exp: 800, level: 13 },
  worldBoss: { name: 'Древний дракон', color: '#FFD700', size: 80, hp: 8000, attack: 90, defense: 45, exp: 2000, level: 15 },
};

export const ITEM_TEMPLATES: Item[] = [
  // Weapons
  { id: 'rusty_sword', name: 'Ржавый меч', type: 'weapon', rarity: 'common', stats: { attack: 5 }, icon: '🗡️', description: 'Старый зазубренный меч' },
  { id: 'iron_sword', name: 'Железный меч', type: 'weapon', rarity: 'uncommon', stats: { attack: 12 }, icon: '⚔️', description: 'Крепкий железный клинок' },
  { id: 'flame_blade', name: 'Пламенный клинок', type: 'weapon', rarity: 'rare', stats: { attack: 25, magicPower: 10 }, icon: '🔥', description: 'Пылает вечным огнём' },
  { id: 'shadow_dagger', name: 'Кинжал тени', type: 'weapon', rarity: 'epic', stats: { attack: 35, critChance: 0.15 }, icon: '🗡️', description: 'Рассекает саму тьму' },
  { id: 'excalibur', name: 'Экскалибур', type: 'weapon', rarity: 'legendary', stats: { attack: 60, magicPower: 20, critChance: 0.1 }, icon: '⚔️', description: 'Легендарный меч королей' },
  
  // Armor
  { id: 'leather_armor', name: 'Кожаная броня', type: 'armor', rarity: 'common', stats: { defense: 5, maxHp: 30 }, icon: '🥋', description: 'Простая кожаная защита' },
  { id: 'chain_mail', name: 'Кольчуга', type: 'armor', rarity: 'uncommon', stats: { defense: 12, maxHp: 80 }, icon: '🛡️', description: 'Плетёная металлическая броня' },
  { id: 'plate_armor', name: 'Латные доспехи', type: 'armor', rarity: 'rare', stats: { defense: 25, maxHp: 150 }, icon: '🛡️', description: 'Тяжёлая стальная защита' },
  { id: 'dragon_scale', name: 'Чешуя дракона', type: 'armor', rarity: 'epic', stats: { defense: 40, maxHp: 250 }, icon: '🐉', description: 'Выкована из драконьей чешуи' },
  { id: 'divine_armor', name: 'Божественная броня', type: 'armor', rarity: 'legendary', stats: { defense: 55, maxHp: 400, magicPower: 15 }, icon: '✨', description: 'Благословлена богами' },
  
  // Accessories
  { id: 'silver_ring', name: 'Серебряное кольцо', type: 'accessory', rarity: 'common', stats: { magicPower: 5, maxMana: 30 }, icon: '💍', description: 'Усиливает магию' },
  { id: 'amulet_power', name: 'Амулет Силы', type: 'accessory', rarity: 'rare', stats: { attack: 15, maxHp: 100 }, icon: '📿', description: 'Пульсирует энергией' },
  { id: 'crown_kings', name: 'Корона королей', type: 'accessory', rarity: 'legendary', stats: { attack: 20, defense: 20, magicPower: 20, maxHp: 200 }, icon: '👑', description: 'Корона древних правителей' },
  
  // Potions
  { id: 'health_potion', name: 'Зелье здоровья', type: 'potion', rarity: 'common', stats: { maxHp: 100 }, icon: '🧪', description: 'Восстанавливает 100 HP' },
  { id: 'mana_potion', name: 'Зелье маны', type: 'potion', rarity: 'common', stats: { maxMana: 80 }, icon: '💧', description: 'Восстанавливает 80 маны' },
  { id: 'elixir_power', name: 'Эликсир мощи', type: 'potion', rarity: 'uncommon', stats: { attack: 20 }, icon: '⚗️', description: 'Временно увеличивает атаку' },
];

export function generateEnemy(template: typeof ENEMY_TEMPLATES[keyof typeof ENEMY_TEMPLATES], position: Position, id: string): Enemy {
  return {
    id,
    name: template.name,
    type: 'normal',
    position: { ...position },
    stats: {
      maxHp: template.hp,
      hp: template.hp,
      maxMana: 50,
      mana: 50,
      attack: template.attack,
      defense: template.defense,
      magicPower: 5,
      speed: 1.5,
      critChance: 0.05
    },
    level: template.level,
    exp: template.exp,
    color: template.color,
    size: template.size,
    skills: [],
    aggroRange: 150,
    attackRange: 50,
    attackCooldown: 2,
    currentAttackCooldown: 0,
    isAggro: false,
    targetPosition: null,
    spawnPosition: { ...position },
    loot: [],
    isDead: false,
    deathTime: 0,
    respawnTime: 15000,
    animFrame: 0,
    hitFlash: 0,
  };
}

export function generateBoss(template: typeof BOSS_TEMPLATES[keyof typeof BOSS_TEMPLATES], position: Position, id: string): Enemy {
  return {
    id,
    name: template.name,
    type: 'boss',
    position: { ...position },
    stats: {
      maxHp: template.hp,
      hp: template.hp,
      maxMana: 200,
      mana: 200,
      attack: template.attack,
      defense: template.defense,
      magicPower: 15,
      speed: 1.2,
      critChance: 0.1
    },
    level: template.level,
    exp: template.exp,
    color: template.color,
    size: template.size,
    skills: [],
    aggroRange: 250,
    attackRange: 70,
    attackCooldown: 1.5,
    currentAttackCooldown: 0,
    isAggro: false,
    targetPosition: null,
    spawnPosition: { ...position },
    loot: [],
    isDead: false,
    deathTime: 0,
    respawnTime: 60000,
    animFrame: 0,
    hitFlash: 0,
  };
}

export const RARITY_COLORS: Record<string, string> = {
  common: '#FFFFFF',
  uncommon: '#1EFF00',
  rare: '#0070DD',
  epic: '#A335EE',
  legendary: '#FF8000',
};
