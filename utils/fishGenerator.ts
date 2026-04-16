
import { FishDna, FishRarity, FishPatternType, FishSpecies, FishPersonality } from "../types";
import { FISH_NAMES, PALETTES, BASE_FISH_VALUES } from "../constants";

const mulberry32 = (a: number) => {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export const generateFishDna = (rarityOverride?: FishRarity): FishDna => {
  const seed = Math.floor(Math.random() * 1000000);
  const rng = mulberry32(seed);

  let rarity = FishRarity.COMMON;
  const roll = rng();
  if (rarityOverride) {
    rarity = rarityOverride;
  } else {
    if (roll > 0.95) rarity = FishRarity.LEGENDARY;
    else if (roll > 0.80) rarity = FishRarity.EPIC;
    else if (roll > 0.50) rarity = FishRarity.RARE;
  }

  const paletteOptions = PALETTES[rarity];
  const colorPalette = paletteOptions[Math.floor(rng() * paletteOptions.length)];

  // Determine Species
  let species = FishSpecies.TETRA;
  const speciesRoll = rng();
  
  // Species distribution
  // 45% Tetra, 40% Goldfish, 15% Clownfish
  if (speciesRoll < 0.45) {
      species = FishSpecies.TETRA;
  } else if (speciesRoll < 0.85) {
      species = FishSpecies.GOLDFISH;
  } else {
      species = FishSpecies.CLOWNFISH;
  }

  // Determine Pattern based on species defaults, but allow variation
  let patternType = FishPatternType.SOLID;
  
  if (species === FishSpecies.TETRA) {
      // Tetras strongly prefer the horizontal stripe, but rare ones might be solid or spotted
      patternType = rng() < 0.8 ? FishPatternType.STRIPE_HORIZONTAL : (rng() < 0.5 ? FishPatternType.SOLID : FishPatternType.GRADIENT);
  } else if (species === FishSpecies.GOLDFISH) {
      // Goldfish prefer Spots, Solid, or Gradient (Calico style)
      const pRoll = rng();
      if (pRoll < 0.4) patternType = FishPatternType.SPOTS;
      else if (pRoll < 0.7) patternType = FishPatternType.SOLID;
      else if (pRoll < 0.9) patternType = FishPatternType.GRADIENT;
      else patternType = FishPatternType.STRIPE_VERTICAL;
  } else {
      // Clownfish prefer Vertical Stripes (classic), but can be anything
      patternType = rng() < 0.7 ? FishPatternType.STRIPE_VERTICAL : FishPatternType.SOLID;
  }
  
  // Legendary fish force cooler patterns
  if (rarity === FishRarity.LEGENDARY) {
      patternType = rng() > 0.5 ? FishPatternType.STRIPE_VERTICAL : FishPatternType.SPOTS;
  }

  const prefix = FISH_NAMES.PREFIXES[Math.floor(rng() * FISH_NAMES.PREFIXES.length)];
  const suffix = FISH_NAMES.SUFFIXES[Math.floor(rng() * FISH_NAMES.SUFFIXES.length)];

  return {
    seed,
    species,
    patternType,
    finStyle: Math.floor(rng() * 3),
    colorPalette,
    rarity,
    name: `${prefix}${suffix}`
  };
};

export const generateFishPersonality = (species: FishSpecies): FishPersonality => {
    const isGoldfish = species === FishSpecies.GOLDFISH;
    const isTetra = species === FishSpecies.TETRA;
    
    return {
        // Bravery/Greed: How fast they rush to food. 1.0 is avg.
        bravery: 0.8 + Math.random() * 0.6, 
        
        // Reaction Time: Low is good (fast reaction), High is bad (slow).
        // Goldfish are a bit "dumb" (slower reaction), Tetras are snappy.
        reactionTime: isGoldfish ? (0.05 + Math.random() * 0.1) : (0.01 + Math.random() * 0.05),

        // Social: How much they clump. Tetras high, Goldfish medium.
        social: isTetra ? (0.8 + Math.random() * 0.2) : (0.4 + Math.random() * 0.4),

        // Vision: How far pixels they can see
        visionRange: 150 + Math.random() * 250 
    };
};

export const getFishPrice = (dna: FishDna, size: number, health: number = 100): number => {
  let baseValue = BASE_FISH_VALUES[dna.rarity];
  
  // Species bonus
  if (dna.species === FishSpecies.GOLDFISH) baseValue *= 1.2;
  if (dna.species === FishSpecies.CLOWNFISH) baseValue *= 1.4;

  // Growth Multiplier
  let sizeMult = 0.3; // Starting price is low
  if (size >= 1.0) {
      sizeMult = 1.2 + (size - 1.0) * 2.0; 
  } else {
      sizeMult = 0.3 + ((size - 0.5) / 0.5) * 0.9; 
  }

  // Health Penalty
  const healthMult = Math.max(0.1, health / 100);

  return Math.floor(baseValue * sizeMult * healthMult);
};
