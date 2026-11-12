import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { CharacterClass } from './game/types';
import { CLASS_DATA, RARITY_COLORS } from './game/data';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior');
  const [uiState, setUiState] = useState({
    hp: 500, maxHp: 500, mana: 100, maxMana: 100,
    level: 1, exp: 0, expToNext: 100, gold: 0,
    targetName: '', targetHp: 0, targetMaxHp: 0, targetLevel: 0,
    zone: '', skills: [] as any[],
    notifications: [] as any[], chatMessages: [] as any[],
    showInventory: false, showSkills: false, showDungeonMap: false,
    inventory: [] as any[], buffs: [] as any[],
    inDungeon: false, dungeonName: '',
    playerClass: 'warrior' as CharacterClass,
  });

  const updateUI = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.state;
    const player = state.player;
    const target = state.enemies.find(e => e.id === player.targetId && !e.isDead);
    
    setUiState({
      hp: Math.floor(player.stats.hp),
      maxHp: player.stats.maxHp,
      mana: Math.floor(player.stats.mana),
      maxMana: player.stats.maxMana,
      level: player.level,
      exp: player.exp,
      expToNext: player.expToNext,
      gold: player.gold,
      targetName: target?.name || '',
      targetHp: target ? Math.floor(target.stats.hp) : 0,
      targetMaxHp: target ? target.stats.maxHp : 0,
      targetLevel: target?.level || 0,
      zone: state.currentZone,
      skills: player.skills,
      notifications: state.notifications,
      chatMessages: state.chatMessages.slice(-10),
      showInventory: state.showInventory,
      showSkills: state.showSkills,
      showDungeonMap: state.showDungeonMap,
      inventory: player.inventory,
      buffs: player.buffs,
      inDungeon: state.inDungeon,
      dungeonName: state.currentDungeon?.name || '',
      playerClass: player.class,
    });
  }, []);

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(canvas);
    engine.setPlayerClass(selectedClass);
    engine.onStateChange = updateUI;
    engineRef.current = engine;
    engine.start();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      engine.resize(canvas.width, canvas.height);
    };
    window.addEventListener('resize', handleResize);

    const uiInterval = setInterval(updateUI, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(uiInterval);
    };
  }, [gameStarted, selectedClass, updateUI]);

  if (!gameStarted) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse top-10 left-10"></div>
          <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse bottom-10 right-10" style={{ animationDelay: '1s' }}></div>
          <div className="absolute w-64 h-64 bg-amber-600/10 rounded-full blur-3xl animate-pulse top-1/2 left-1/2" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Title */}
        <div className="relative z-10 text-center mb-8">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl tracking-wider">
            REALM OF LEGENDS
          </h1>
          <p className="text-gray-400 mt-4 text-lg tracking-wide">Браузерная RPG в стиле World of Warcraft</p>
        </div>

        {/* Class Selection */}
        <div className="relative z-10 mb-8">
          <h2 className="text-center text-gray-300 mb-4 text-lg">Выберите класс</h2>
          <div className="flex gap-4 flex-wrap justify-center">
            {(Object.entries(CLASS_DATA) as [CharacterClass, typeof CLASS_DATA[CharacterClass]][]).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedClass(key)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 w-44 text-center ${
                  selectedClass === key
                    ? 'border-amber-400 bg-amber-400/10 scale-105 shadow-lg shadow-amber-400/20'
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <div className="text-4xl mb-2">{data.icon}</div>
                <div className="font-bold text-lg" style={{ color: data.color }}>{data.name}</div>
                <div className="text-xs text-gray-400 mt-1">{data.description}</div>
                <div className="mt-2 text-xs text-gray-500">
                  HP: {data.baseStats.maxHp} | ATK: {data.baseStats.attack} | DEF: {data.baseStats.defense}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => setGameStarted(true)}
          className="relative z-10 px-12 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xl rounded-lg shadow-lg shadow-amber-600/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/50 border border-amber-400/50"
        >
          ⚔️ Начать приключение
        </button>

        {/* Controls info */}
        <div className="relative z-10 mt-8 text-center text-gray-500 text-sm max-w-lg">
          <p className="mb-1"><span className="text-gray-300">WASD</span> — Перемещение | <span className="text-gray-300">Клик</span> — Выбор цели</p>
          <p className="mb-1"><span className="text-gray-300">1-4</span> — Способности | <span className="text-gray-300">ПКМ</span> — Зелье здоровья</p>
          <p><span className="text-gray-300">I</span> — Инвентарь | <span className="text-gray-300">K</span> — Навыки | <span className="text-gray-300">M</span> — Карта</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Top bar - Zone name */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/70 border border-amber-600/50 rounded-lg px-6 py-1.5 backdrop-blur-sm">
          <span className="text-amber-400 font-bold text-sm">{uiState.zone}</span>
          {uiState.inDungeon && (
            <span className="text-red-400 ml-2 text-xs">⚔️ {uiState.dungeonName}</span>
          )}
        </div>
      </div>

      {/* Player frame */}
      <div className="absolute top-2 left-2 z-20">
        <div className="bg-black/80 border border-gray-600 rounded-lg p-3 backdrop-blur-sm w-64">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl"
              style={{ borderColor: CLASS_DATA[uiState.playerClass].color, backgroundColor: CLASS_DATA[uiState.playerClass].color + '20' }}>
              {CLASS_DATA[uiState.playerClass].icon}
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-sm">Герой <span className="text-amber-400">Ур.{uiState.level}</span></div>
              <div className="text-xs" style={{ color: CLASS_DATA[uiState.playerClass].color }}>{CLASS_DATA[uiState.playerClass].name}</div>
            </div>
          </div>
          
          {/* HP Bar */}
          <div className="mb-1">
            <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
              <div className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300 rounded-full"
                style={{ width: `${(uiState.hp / uiState.maxHp) * 100}%` }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                {uiState.hp} / {uiState.maxHp}
              </div>
            </div>
          </div>
          
          {/* Mana Bar */}
          <div className="mb-1">
            <div className="h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
              <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-300 rounded-full"
                style={{ width: `${(uiState.mana / uiState.maxMana) * 100}%` }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">
                {uiState.mana} / {uiState.maxMana}
              </div>
            </div>
          </div>

          {/* EXP Bar */}
          <div>
            <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
              <div className="h-full bg-gradient-to-r from-purple-700 to-purple-400 transition-all duration-300 rounded-full"
                style={{ width: `${(uiState.exp / uiState.expToNext) * 100}%` }}></div>
            </div>
            <div className="text-[10px] text-gray-400 text-center">EXP: {uiState.exp}/{uiState.expToNext}</div>
          </div>

          {/* Buffs */}
          {uiState.buffs.length > 0 && (
            <div className="flex gap-1 mt-1">
              {uiState.buffs.map((buff, i) => (
                <div key={i} className="w-6 h-6 bg-blue-900/50 border border-blue-400 rounded flex items-center justify-center text-xs" title={buff.name}>
                  {buff.icon}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target frame */}
      {uiState.targetName && (
        <div className="absolute top-2 right-40 z-20">
          <div className="bg-black/80 border border-red-600/50 rounded-lg p-3 backdrop-blur-sm w-56">
            <div className="text-red-400 font-bold text-sm mb-1">
              ☠️ {uiState.targetName} <span className="text-gray-400">Ур.{uiState.targetLevel}</span>
            </div>
            <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
              <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300 rounded-full"
                style={{ width: `${(uiState.targetHp / uiState.targetMaxHp) * 100}%` }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                {uiState.targetHp} / {uiState.targetMaxHp}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gold display */}
      <div className="absolute top-2 right-2 z-20">
        <div className="bg-black/70 border border-amber-600/50 rounded-lg px-3 py-1.5 backdrop-blur-sm">
          <span className="text-amber-400 font-bold">💰 {uiState.gold}</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/80 border border-gray-600 rounded-xl p-2 backdrop-blur-sm flex gap-2">
          {uiState.skills.map((skill, i) => (
            <button
              key={skill.id}
              onClick={() => engineRef.current?.useSkill(i)}
              className={`relative w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                skill.currentCooldown > 0 ? 'border-gray-700 opacity-60' : 'border-amber-600 hover:border-amber-400 hover:scale-105'
              }`}
              style={{ backgroundColor: skill.color + '20' }}
              title={`${skill.name}: ${skill.description}\nМана: ${skill.manaCost} | КД: ${skill.cooldown}с`}
            >
              <span className="text-xl">{skill.icon}</span>
              <span className="text-[8px] text-gray-300 mt-0.5">{i + 1}</span>
              {skill.currentCooldown > 0 && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{Math.ceil(skill.currentCooldown)}</span>
                </div>
              )}
            </button>
          ))}
          {/* Potion button */}
          <button
            onClick={() => engineRef.current?.useHealthPotion()}
            className="relative w-14 h-14 rounded-lg border-2 border-green-600 flex flex-col items-center justify-center hover:border-green-400 hover:scale-105 transition-all bg-green-900/20"
            title="Зелье здоровья (ПКМ)"
          >
            <span className="text-xl">🧪</span>
            <span className="text-[8px] text-gray-300 mt-0.5">RMB</span>
          </button>
        </div>
      </div>

      {/* Chat / Combat log */}
      <div className="absolute bottom-24 left-2 z-20 w-72">
        <div className="bg-black/70 border border-gray-700 rounded-lg p-2 backdrop-blur-sm max-h-40 overflow-hidden">
          {uiState.chatMessages.slice(-6).map((msg: any, i: number) => (
            <div key={i} className={`text-xs py-0.5 ${
              msg.type === 'system' ? 'text-yellow-400' :
              msg.type === 'combat' ? 'text-red-300' :
              msg.type === 'loot' ? 'text-green-300' : 'text-gray-300'
            }`}>
              <span className="font-bold">[{msg.sender}]</span> {msg.text}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="absolute top-20 right-2 z-20 w-64">
        {uiState.notifications.map((notif: any, i: number) => (
          <div key={notif.id || i} className={`mb-1 px-3 py-1.5 rounded-lg text-sm font-bold animate-pulse ${
            notif.type === 'levelup' ? 'bg-amber-600/80 text-white border border-amber-400' :
            notif.type === 'loot' ? 'bg-green-600/80 text-white border border-green-400' :
            notif.type === 'death' ? 'bg-red-600/80 text-white border border-red-400' :
            notif.type === 'quest' ? 'bg-purple-600/80 text-white border border-purple-400' :
            'bg-gray-700/80 text-white border border-gray-500'
          }`}>
            {notif.text}
          </div>
        ))}
      </div>

      {/* Inventory Panel */}
      {uiState.showInventory && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border-2 border-amber-600 rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-amber-400">🎒 Инвентарь</h2>
              <button onClick={() => { if (engineRef.current) engineRef.current.state.showInventory = false; updateUI(); }}
                className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {uiState.inventory.map((item: any, i: number) => (
                <div key={i} className="w-14 h-14 rounded-lg border-2 flex items-center justify-center text-xl relative group cursor-pointer"
                  style={{ borderColor: RARITY_COLORS[item.rarity], backgroundColor: RARITY_COLORS[item.rarity] + '15' }}
                  title={`${item.name}\n${item.description}\n${Object.entries(item.stats).map(([k, v]) => `+${v} ${k}`).join(', ')}`}>
                  {item.icon}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                    <span style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                  </div>
                </div>
              ))}
              {uiState.inventory.length === 0 && (
                <div className="col-span-5 text-center text-gray-500 py-8">Инвентарь пуст</div>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Предметов: {uiState.inventory.length} | 💰 {uiState.gold} золота
            </div>
          </div>
        </div>
      )}

      {/* Skills Panel */}
      {uiState.showSkills && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border-2 border-amber-600 rounded-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-amber-400">📖 Способности</h2>
              <button onClick={() => { if (engineRef.current) engineRef.current.state.showSkills = false; updateUI(); }}
                className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {uiState.skills.map((skill: any, i: number) => (
                <div key={skill.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border"
                    style={{ borderColor: skill.color, backgroundColor: skill.color + '20' }}>
                    {skill.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-sm">{i + 1}. {skill.name}</div>
                    <div className="text-gray-400 text-xs">{skill.description}</div>
                    <div className="text-xs mt-0.5">
                      <span className="text-blue-400">Мана: {skill.manaCost}</span> | 
                      <span className="text-yellow-400 ml-1">КД: {skill.cooldown}с</span> |
                      <span className="text-red-400 ml-1">Урон: {skill.damage}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dungeon Map */}
      {uiState.showDungeonMap && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border-2 border-amber-600 rounded-xl p-6 w-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-amber-400">🗺️ Карта мира</h2>
              <button onClick={() => { if (engineRef.current) engineRef.current.state.showDungeonMap = false; updateUI(); }}
                className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {engineRef.current?.state.dungeons.map(d => (
                <div key={d.id} className="p-3 rounded-lg border border-gray-700 bg-gray-800/50">
                  <div className="font-bold text-sm" style={{ color: d.color }}>{d.name}</div>
                  <div className="text-xs text-gray-400">{d.description}</div>
                  <div className="text-xs text-amber-400 mt-1">Рекомендуемый ур.: {d.level}</div>
                  <div className={`text-xs mt-1 ${d.completed ? 'text-green-400' : 'text-red-400'}`}>
                    {d.completed ? '✅ Пройдено' : '⚔️ Доступно'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mini help */}
      <div className="absolute bottom-4 left-2 z-20 text-[10px] text-gray-600">
        WASD: Движение | 1-4: Способности | ПКМ: Зелье | I: Инвентарь | K: Навыки | M: Карта | ESC: Выход из подземелья
      </div>
    </div>
  );
}

export default App;
