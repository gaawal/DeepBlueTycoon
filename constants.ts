
import { FishRarity, DecorationType } from "./types";

export const TANK_WIDTH = 1000;
export const TANK_HEIGHT = 600;

export const INITIAL_MONEY = 500; 

export const PRICES = {
  FISH_EGG_COMMON: 10,
  FISH_EGG_RARE: 30,
  FOOD_BASIC: 5,   
  FOOD_PREMIUM: 15, 
  FOOD_SHRIMP: 40,
  FOOD_ALGAE: 12,

  MEDICINE_BACTERIA: 30, 
  MEDICINE_HEAL: 25,    

  // Decorations
  [DecorationType.PLANT_SHORT]: 20,
  [DecorationType.PLANT_TALL]: 35,
  [DecorationType.PLANT_FERN]: 45,
  [DecorationType.ROCK_SMALL]: 15,
  [DecorationType.ROCK_MOSS]: 30,
  [DecorationType.ROCK_ROCKERY]: 120,
  [DecorationType.DRIFTWOOD]: 60,
  [DecorationType.CORAL_RED]: 80,
  [DecorationType.CORAL_BLUE]: 100,
  [DecorationType.STATUE]: 250,
  [DecorationType.VOLCANO]: 180,
  [DecorationType.SHIPWRECK]: 300,
  [DecorationType.TREASURE_CHEST]: 150,
  [DecorationType.GIANT_CLAM]: 120,
};

// Descriptions for shop display
export const DECORATION_DESCRIPTIONS = {
  [DecorationType.PLANT_SHORT]: "点缀前景的绿色。",
  [DecorationType.PLANT_TALL]: "随波逐流的长草。",
  [DecorationType.PLANT_FERN]: "叶片茂密的蕨类。",
  [DecorationType.ROCK_SMALL]: "普通的鹅卵石。",
  [DecorationType.ROCK_MOSS]: "长满青苔的老石头。",
  [DecorationType.ROCK_ROCKERY]: "颇具意境的假山。",
  [DecorationType.DRIFTWOOD]: "天然沉木，调节酸碱度。",
  [DecorationType.CORAL_RED]: "鲜艳的红色珊瑚。",
  [DecorationType.CORAL_BLUE]: "稀有的蓝色珊瑚。",
  [DecorationType.STATUE]: "沉没的古代遗迹。",
  [DecorationType.VOLCANO]: "偶尔会冒泡的休眠火山。",
  [DecorationType.SHIPWRECK]: "传说中海盗的沉船。",
  [DecorationType.TREASURE_CHEST]: "里面会有金币吗？",
  [DecorationType.GIANT_CLAM]: "它在呼吸。",
};

// Adjusted Sell Values
export const BASE_FISH_VALUES = {
  [FishRarity.COMMON]: 30,   
  [FishRarity.RARE]: 120,    
  [FishRarity.EPIC]: 400,
  [FishRarity.LEGENDARY]: 1000
};

export const FOOD_STATS = {
  BASIC: { nutrition: 25, color: '#fbbf24', name: '普通饲料' },   
  PREMIUM: { nutrition: 60, color: '#f472b6', name: '高级饲料' }, 
  SHRIMP: { nutrition: 90, color: '#f87171', name: '丰年虾' },
  ALGAE: { nutrition: 15, color: '#4ade80', name: '螺旋藻片' },
};

// Updated Palettes 
// Format: [Body Color, Pattern/Tail Color, Accent/Fin Color]
export const PALETTES = {
  [FishRarity.COMMON]: [
      ['#e2e8f0', '#ef4444', '#3b82f6'], // Neon Style: Silver, Red, Blue
      ['#facc15', '#f97316', '#fbbf24'], // Goldfish Style: Gold, Orange, Yellow
      ['#ffedd5', '#ea580c', '#c2410c'], // Red/Orange
      ['#f8fafc', '#dc2626', '#b91c1c'], // White/Red Cap
      ['#cbd5e1', '#475569', '#1e293b'], // Silver/Grey
  ],
  [FishRarity.RARE]: [
      ['#1e293b', '#22d3ee', '#c084fc'], // Dark/Neon
      ['#fef3c7', '#be123c', '#9f1239'], // Gold/Dark Red
      ['#dcfce7', '#16a34a', '#15803d'], // Greenery
      ['#0f172a', '#fbbf24', '#000000'], // Black/Gold
  ],
  [FishRarity.EPIC]: [
      ['#312e81', '#818cf8', '#c084fc'], // Deep Purple
      ['#4c0519', '#fb7185', '#fda4af'], // Ruby
      ['#ffffff', '#000000', '#facc15'], // Calico/Koi
  ],
  [FishRarity.LEGENDARY]: [
      ['#000000', '#ef4444', '#f59e0b'], // Magma
      ['#ccfbf1', '#2dd4bf', '#14b8a6'], // Spirit Blue
      ['#fdf4ff', '#d946ef', '#86198f'], // Royal Pink
  ] 
};

export const FISH_NAMES = {
  PREFIXES: ['泡泡', '闪电', '大眼', '憨憨', '极速', '彩虹', '深海', '幽灵', '霸王', '贪吃', '赤炎', '冰霜', '流星', '月光', '水晶', '幻影', '暴风'],
  SUFFIXES: ['金鱼', '灯鱼', '小丑', '七彩', '将军', '红龙', '锦鲤', '球球', '尼莫']
};
