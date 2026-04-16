
import React, { useMemo } from 'react';
import { FishDna, FishPatternType, FishSpecies } from '../types';

interface FishSVGProps {
  dna: FishDna;
  size: number;
  className?: string;
  isDead?: boolean;
  velocity?: { x: number, y: number };
}

// --- PATTERN GENERATORS ---
const PatternDef = ({ id, type, color, secondaryColor }: { id: string, type: FishPatternType, color: string, secondaryColor: string }) => {
    if (type === FishPatternType.STRIPE_HORIZONTAL) {
        // Neon Tetra style glow line
        return (
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={secondaryColor} stopOpacity="0"/>
                <stop offset="10%" stopColor={color} stopOpacity="0.9"/>
                <stop offset="90%" stopColor={color} stopOpacity="0.9"/>
                <stop offset="100%" stopColor={secondaryColor} stopOpacity="0"/>
            </linearGradient>
        );
    }
    if (type === FishPatternType.STRIPE_VERTICAL) {
        // Wide bands for Clownfish
        return (
            <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
                <rect width="8" height="20" fill={color} opacity="0.9" />
            </pattern>
        );
    }
    if (type === FishPatternType.SPOTS) {
        return (
            <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="2" fill={color} opacity="0.6" />
                <circle cx="9" cy="9" r="1.5" fill={color} opacity="0.5" />
                <circle cx="8" cy="2" r="1" fill={color} opacity="0.4" />
            </pattern>
        );
    }
    if (type === FishPatternType.GRADIENT) {
        return (
             <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={secondaryColor} />
                <stop offset="100%" stopColor={color} />
            </linearGradient>
        );
    }
    return null;
};

export const FishSVG: React.FC<FishSVGProps> = ({ dna, size, className, isDead, velocity }) => {
  const { species, colorPalette, patternType, seed } = dna;
  
  const bodyColor = colorPalette[0];
  const patternColor = colorPalette[1] || bodyColor;
  const accentColor = colorPalette[2] || patternColor;

  const uniqueId = `fish-${dna.seed}`;
  const patternId = `pat-${uniqueId}`;

  // --- PHYSICS & ANIMATION ---
  const animState = useMemo(() => {
    if (isDead) return { duration: '0s', bodyDelay: '0s', tailDelay: '0s', finDelay: '0s' };
    const speed = velocity ? Math.sqrt(velocity.x**2 + velocity.y**2) : 0.5;
    
    // Goldfish swim slower with bigger wave; Tetras swim faster
    let speedFactor = 1.0;
    if (species === FishSpecies.GOLDFISH) speedFactor = 0.8; // Wobble
    if (species === FishSpecies.TETRA) speedFactor = 1.4; // Zippy
    if (species === FishSpecies.CLOWNFISH) speedFactor = 1.1; // Bouncy

    const baseDuration = Math.max(0.3, (2.2 - speed * 0.7) / speedFactor); 
    const randomOffset = (seed % 100) / 10; 
    
    return {
      duration: `${baseDuration.toFixed(2)}s`,
      bodyDelay: `${-randomOffset}s`,
      tailDelay: `${(-randomOffset - (baseDuration * 0.25)).toFixed(2)}s`, // Tail lags
      finDelay: `${(-randomOffset - (baseDuration * 0.1)).toFixed(2)}s`
    };
  }, [velocity, isDead, seed, species]);

  // --- SPECIES RENDERERS ---

  // 1. TETRA (红绿灯鱼)
  // Feature: Streamlined, lateral stripe, forked tail.
  if (species === FishSpecies.TETRA) {
      return (
        <svg width={120 * size} height={60 * size} viewBox="-40 -20 80 40" className={`${className} overflow-visible`}>
            <defs>
                <PatternDef id={patternId} type={patternType} color={patternColor} secondaryColor={bodyColor} />
            </defs>
            <g className={isDead ? "grayscale" : "animate-fish-body"} style={isDead ? {} : { animationDuration: animState.duration, animationDelay: animState.bodyDelay }}>
                 
                 {/* Tail (Forked) */}
                 <g transform="translate(20, 0)" className={isDead ? "" : "animate-fish-tail"} style={isDead ? {} : { animationDuration: animState.duration, animationDelay: animState.tailDelay, transformOrigin: '0 0' }}>
                    <path d="M0,0 L12,-8 L8,0 L12,8 Z" fill={accentColor} opacity="0.8" />
                 </g>
                 
                 {/* Body (Torpedo Shape) */}
                 <path d="M-25,0 Q-25,-9 0,-9 Q22,-7 22,0 Q22,7 0,9 Q-25,9 -25,0" fill={bodyColor} />
                 
                 {/* Pattern Overlay (Lateral Stripe or All-over) */}
                 {patternType === FishPatternType.STRIPE_HORIZONTAL ? (
                     <path d="M-22,-1 L15,-1" stroke={`url(#${patternId})`} strokeWidth="4" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.4))'}} />
                 ) : (
                     <path d="M-25,0 Q-25,-9 0,-9 Q22,-7 22,0 Q22,7 0,9 Q-25,9 -25,0" fill={`url(#${patternId})`} opacity="0.5" />
                 )}

                 {/* Fins */}
                 <path d="M-2,-9 L4,-14 L8,-9" fill={accentColor} opacity="0.7"/> {/* Dorsal */}
                 <path d="M2,4 L6,9 L2,6" fill={accentColor} opacity="0.7" className={isDead ? "" : "animate-fish-fin"} style={{ animationDuration: animState.duration }} /> {/* Pectoral */}
                 <path d="M-5,7 L0,12 L5,8" fill={accentColor} opacity="0.6" /> {/* Anal */}

                 {/* Eye */}
                 <circle cx="-18" cy="-2" r="2.5" fill="white" />
                 <circle cx="-18" cy="-2" r="1.2" fill="black" />
                 <circle cx="-18.5" cy="-2.5" r="0.5" fill="white" opacity="0.8" />
            </g>
        </svg>
      );
  }

  // 2. GOLDFISH (小金鱼)
  // Feature: Round/Egg body, Flowy split tail, High dorsal fin.
  if (species === FishSpecies.GOLDFISH) {
      return (
        <svg width={130 * size} height={100 * size} viewBox="-40 -35 80 70" className={`${className} overflow-visible`}>
            <defs>
                <PatternDef id={patternId} type={patternType} color={patternColor} secondaryColor={bodyColor} />
            </defs>
            <g className={isDead ? "grayscale" : "animate-fish-body"} style={isDead ? {} : { animationDuration: animState.duration, animationDelay: animState.bodyDelay }}>
                 
                 {/* Flowy Tail (Fantail Style) */}
                 <g transform="translate(15, 0)" className={isDead ? "" : "animate-fish-tail"} style={isDead ? {} : { animationDuration: animState.duration, animationDelay: animState.tailDelay, transformOrigin: '0 0' }}>
                    <path d="M0,0 Q10,-15 35,-20 Q40,-5 25,0 Q40,5 35,20 Q10,15 0,0" fill={accentColor} opacity="0.7" />
                    <path d="M0,0 Q10,-15 35,-20 Q40,-5 25,0 Q40,5 35,20 Q10,15 0,0" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.5"/>
                 </g>
                 
                 {/* Body (Egg Shape) */}
                 <ellipse cx="-5" cy="0" rx="25" ry="18" fill={bodyColor} />
                 <ellipse cx="-5" cy="0" rx="25" ry="18" fill={`url(#${patternId})`} opacity={patternType === FishPatternType.SOLID ? 0 : 0.6} />
                 
                 {/* High Dorsal Fin */}
                 <path d="M-15,-14 Q-5,-35 15,-10" fill={accentColor} opacity="0.8" />
                 
                 {/* Pectoral Fin (Waving) */}
                 <path d="M-5,10 Q5,20 0,25" fill={accentColor} opacity="0.8" className={isDead ? "" : "animate-fish-fin"} style={{ animationDuration: animState.duration, transformOrigin: '-5px 10px' }} />

                 {/* Eye (Big) */}
                 <circle cx="-20" cy="-3" r="3.5" fill="white" />
                 <circle cx="-20" cy="-3" r="1.8" fill="black" />
                 <circle cx="-21" cy="-4" r="0.8" fill="white" opacity="0.9" />

                 {/* Mouth/Wen (Cute bump) */}
                 <path d="M-28,2 Q-30,4 -28,6" stroke={bodyColor} strokeWidth="1.5" fill="none" opacity="0.5" />
            </g>
        </svg>
      );
  }

  // 3. CLOWNFISH (小丑鱼/尼莫)
  // Feature: Stout oval body, rounded fins, usually stripes.
  return (
    <svg width={110 * size} height={80 * size} viewBox="-35 -25 70 50" className={`${className} overflow-visible`}>
        <defs>
            <PatternDef id={patternId} type={patternType} color={patternColor} secondaryColor={bodyColor} />
        </defs>
        <g className={isDead ? "grayscale" : "animate-fish-body"} style={isDead ? {} : { animationDuration: animState.duration, animationDelay: animState.bodyDelay }}>
                
                {/* Rounded Tail */}
                <g transform="translate(18, 0)" className={isDead ? "" : "animate-fish-tail"} style={isDead ? {} : { animationDuration: animState.duration, animationDelay: animState.tailDelay, transformOrigin: '0 0' }}>
                   <path d="M0,0 Q15,-10 18,0 Q15,10 0,0" fill={accentColor} />
                   <path d="M2,-5 Q15,-10 18,-5 L18,5 Q15,10 2,5" fill={accentColor} opacity="0.8" />
                </g>

                {/* Dorsal Fin (Two parts: Spiny & Soft) */}
                <path d="M-15,-14 Q-8,-22 0,-14 L2,-14 Q8,-20 12,-8" fill={accentColor} />

                {/* Body (Stout Oval) */}
                <path d="M-28,0 Q-28,-16 0,-16 Q26,-16 26,0 Q26,16 0,16 Q-28,16 -28,0" fill={bodyColor} />
                
                {/* Pattern Overlay (Often Vertical Stripes for Clownfish) */}
                <path d="M-28,0 Q-28,-16 0,-16 Q26,-16 26,0 Q26,16 0,16 Q-28,16 -28,0" fill={`url(#${patternId})`} opacity={patternType === FishPatternType.SOLID ? 0 : 0.8} />

                {/* Pectoral Fin (Paddle shape) */}
                <path d="M-4,5 Q4,10 -2,14" fill={accentColor} className={isDead ? "" : "animate-fish-fin"} style={{ animationDuration: animState.duration }} />
                
                {/* Anal Fin */}
                <path d="M0,14 Q8,20 12,12" fill={accentColor} />

                {/* Eye */}
                <circle cx="-18" cy="-3" r="3" fill="white" />
                <circle cx="-18" cy="-3" r="1.5" fill="black" />
                <circle cx="-19" cy="-4" r="0.8" fill="white" opacity="0.8" />
        </g>
    </svg>
  );
};
