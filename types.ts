
export enum FishRarity {
  COMMON = '普通',
  RARE = '稀有',
  EPIC = '史诗',
  LEGENDARY = '传说'
}

export enum DecorationType {
  PLANT_TALL = '高水草',
  PLANT_SHORT = '矮水草',
  PLANT_FERN = '爪哇蕨',
  ROCK_SMALL = '小石头',
  ROCK_MOSS = '苔藓石',
  ROCK_ROCKERY = '造景假山',
  DRIFTWOOD = '沉木',
  CORAL_RED = '红珊瑚',
  CORAL_BLUE = '蓝珊瑚',
  STATUE = '古代遗迹',
  VOLCANO = '休眠火山',
  SHIPWRECK = '沉船残骸',
  TREASURE_CHEST = '神秘宝箱',
  GIANT_CLAM = '巨型贝壳'
}

export enum FishSpecies {
  TETRA = 'TETRA', // 红绿灯/灯鱼 (流线型，侧身条纹)
  GOLDFISH = 'GOLDFISH', // 金鱼 (圆润身体，飘逸尾鳍)
  CLOWNFISH = 'CLOWNFISH' // 小丑鱼 (椭圆身体，圆鳍)
}

export enum FishPatternType {
  SOLID = 0,
  STRIPE_HORIZONTAL = 1, // 侧线 (灯鱼特征)
  STRIPE_VERTICAL = 2, // 虎皮纹
  SPOTS = 3, // 斑点/碎花 (金鱼特征)
  GRADIENT = 4 // 渐变色
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface FishDna {
  seed: number;
  species: FishSpecies;
  patternType: FishPatternType;
  finStyle: number; // 0-3, subtle variations within species
  colorPalette: string[]; // [Body, Pattern/Tail, Accent]
  rarity: FishRarity;
  name: string;
}

export interface FishPersonality {
  bravery: number;       // 0.5 - 1.5: How fast they accelerate towards food/away from danger
  reactionTime: number;  // 0.0 - 1.0: Probability to notice a change per check (Higher is slower/clumsier)
  social: number;        // 0.0 - 1.0: How strongly they follow the flock
  visionRange: number;   // 100 - 400: How far they can see
}

export interface FishEntity {
  id: string;
  dna: FishDna;
  personality: FishPersonality;
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2; 
  wanderTheta: number;   
  target: string | null; // ID of the food or point target
  size: number; // 0.5 (baby) to 1.5 (giant)
  depth: number; // 0 (far/back) to 1 (close/front) for parallax
  age: number; 
  hunger: number; // 0-100
  health: number; // 0-100
  isDead: boolean;
  state: 'IDLE' | 'WANDER' | 'SEEKING_FOOD' | 'FLEEING' | 'SCHOOLING';
  stateTimer: number; 
  lastDecisionTime: number; // To prevent jittery decision making
}

export interface FoodEntity {
  id: string;
  type: 'BASIC' | 'PREMIUM' | 'SHRIMP' | 'ALGAE';
  position: Vector2;
  nutrition: number;
  color: string;
}

export interface DecorationEntity {
  id: string;
  type: DecorationType;
  x: number;
  y: number; 
  scale: number;
  depth: number; 
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export interface GameState {
  money: number;
  waterQuality: number; 
  inventory: {
    basicFood: number;
    premiumFood: number;
    shrimpFood: number;
    algaeFood: number;
  };
  decorations: DecorationEntity[];
}
