
import React from 'react';
import { DecorationType } from '../types';

interface DecorationSVGProps {
  type: DecorationType;
  className?: string;
}

export const DecorationSVG: React.FC<DecorationSVGProps> = ({ type, className }) => {
  switch (type) {
    case DecorationType.PLANT_TALL:
      return (
        <svg viewBox="0 0 100 200" className={className} width="100" height="200">
          <path d="M50,200 Q60,150 40,100 Q30,50 50,0" stroke="#4ade80" strokeWidth="8" fill="none" className="animate-float origin-bottom" style={{animationDuration: '3s'}} />
          <path d="M50,200 Q30,160 40,120 Q60,80 30,20" stroke="#22c55e" strokeWidth="6" fill="none" className="animate-float origin-bottom" style={{animationDuration: '4.5s', animationDelay: '1s'}} />
          <path d="M50,200 Q70,140 60,90 Q40,40 60,10" stroke="#16a34a" strokeWidth="7" fill="none" className="animate-float origin-bottom" style={{animationDuration: '3.8s', animationDelay: '0.5s'}} />
        </svg>
      );
    
    case DecorationType.PLANT_SHORT:
      return (
        <svg viewBox="0 0 100 100" className={className} width="80" height="80">
          <path d="M50,100 Q30,70 20,40" stroke="#86efac" strokeWidth="6" fill="none" className="animate-swim origin-bottom" />
          <path d="M50,100 Q70,60 80,30" stroke="#4ade80" strokeWidth="6" fill="none" className="animate-swim origin-bottom" style={{animationDelay: '0.5s'}} />
          <path d="M50,100 Q50,60 50,20" stroke="#22c55e" strokeWidth="6" fill="none" className="animate-swim origin-bottom" style={{animationDelay: '0.2s'}} />
        </svg>
      );
    
    case DecorationType.PLANT_FERN:
      return (
        <svg viewBox="0 0 100 100" className={className} width="90" height="90">
             <g className="animate-swim origin-bottom">
                 <path d="M50,100 Q30,60 10,40 L15,50 L20,35 L25,45" stroke="#15803d" strokeWidth="4" fill="none" />
                 <path d="M50,100 Q70,60 90,40 L85,50 L80,35 L75,45" stroke="#166534" strokeWidth="4" fill="none" />
                 <path d="M50,100 Q50,50 50,20 L45,30 L55,30" stroke="#14532d" strokeWidth="4" fill="none" />
             </g>
        </svg>
      );

    case DecorationType.ROCK_SMALL:
      return (
        <svg viewBox="0 0 100 60" className={className} width="80" height="50">
          <path d="M10,60 L20,30 L40,10 L70,20 L90,60 Z" fill="#64748b" stroke="#475569" strokeWidth="2" />
          <path d="M30,60 L40,40 L60,30 L80,60 Z" fill="#94a3b8" opacity="0.5" />
        </svg>
      );

    case DecorationType.ROCK_MOSS:
      return (
        <svg viewBox="0 0 120 80" className={className} width="100" height="70">
           <path d="M10,80 Q20,20 60,15 Q100,20 110,80 Z" fill="#475569" />
           {/* Moss */}
           <path d="M30,30 Q45,20 60,30 T90,35" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />
           <circle cx="40" cy="40" r="5" fill="#22c55e" opacity="0.6" />
           <circle cx="80" cy="50" r="4" fill="#22c55e" opacity="0.6" />
        </svg>
      );

    case DecorationType.ROCK_ROCKERY:
        return (
            <svg viewBox="0 0 120 150" className={className} width="120" height="150">
                <path d="M20,150 L30,80 L50,60 L80,70 L100,150 Z" fill="#57534e" stroke="#292524" strokeWidth="2" />
                <path d="M40,90 L60,20 L80,90 Z" fill="#44403c" stroke="#292524" strokeWidth="2" />
                <path d="M60,20 L55,40 L65,40 Z" fill="#e7e5e4" opacity="0.5" />
                <circle cx="50" cy="70" r="4" fill="#15803d" opacity="0.8" />
                <circle cx="70" cy="100" r="5" fill="#15803d" opacity="0.8" />
            </svg>
        );

    case DecorationType.DRIFTWOOD:
        return (
            <svg viewBox="0 0 150 100" className={className} width="150" height="100">
                 <path d="M10,100 Q40,90 60,80 Q80,70 100,20" stroke="#78350f" strokeWidth="12" fill="none" strokeLinecap="round" />
                 <path d="M60,80 Q90,90 130,70" stroke="#78350f" strokeWidth="8" fill="none" strokeLinecap="round" />
                 <path d="M30,95 Q40,60 20,40" stroke="#522509" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
        );

    case DecorationType.CORAL_RED:
      return (
        <svg viewBox="0 0 100 100" className={className} width="90" height="90">
           <g transform="translate(50, 100) scale(1, -1)">
             <path d="M0,0 C10,40 -20,60 -10,90" stroke="#f87171" strokeWidth="8" fill="none" strokeLinecap="round" />
             <path d="M0,0 C-10,30 20,50 30,80" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" />
             <path d="M0,0 C5,20 -15,40 -25,50" stroke="#fca5a5" strokeWidth="6" fill="none" strokeLinecap="round" />
           </g>
        </svg>
      );

    case DecorationType.CORAL_BLUE:
        return (
          <svg viewBox="0 0 100 100" className={className} width="90" height="90">
             <g transform="translate(50, 100) scale(1, -1)">
               <path d="M0,0 L0,20 L-20,40 M0,20 L20,50 M0,60" stroke="#22d3ee" strokeWidth="6" fill="none" strokeLinecap="round" />
               <circle cx="-20" cy="40" r="6" fill="#0ea5e9" />
               <circle cx="20" cy="50" r="5" fill="#0ea5e9" />
               <circle cx="0" cy="70" r="4" fill="#0ea5e9" />
             </g>
          </svg>
        );

    case DecorationType.STATUE:
      return (
        <svg viewBox="0 0 100 150" className={className} width="100" height="150">
           <rect x="20" y="130" width="60" height="20" fill="#78716c" />
           <rect x="30" y="110" width="40" height="20" fill="#a8a29e" />
           {/* Pillar */}
           <path d="M35,110 L35,40 L65,40 L65,110" fill="#d6d3d1" />
           <path d="M35,40 L30,30 L70,30 L65,40" fill="#a8a29e" />
           {/* Broken top */}
           <path d="M35,110 L40,80 L35,60" stroke="#78716c" strokeWidth="1" fill="none" />
           {/* Vines */}
           <path d="M35,130 Q20,100 40,80 Q60,60 35,40" stroke="#15803d" strokeWidth="3" fill="none" />
        </svg>
      );

    case DecorationType.VOLCANO:
        return (
            <svg viewBox="0 0 140 100" className={className} width="140" height="100">
                <path d="M20,100 L50,30 Q70,20 90,30 L120,100 Z" fill="#44403c" stroke="#292524" strokeWidth="2" />
                <path d="M50,30 Q70,20 90,30" stroke="#ef4444" strokeWidth="4" fill="none" />
                <circle cx="70" cy="25" r="8" fill="#ea580c" className="animate-pulse" />
                {/* Bubbles */}
                <circle cx="70" cy="15" r="3" fill="rgba(255,255,255,0.4)" className="animate-float" style={{animationDuration:'2s'}} />
                <circle cx="65" cy="5" r="2" fill="rgba(255,255,255,0.3)" className="animate-float" style={{animationDuration:'2.5s', animationDelay: '0.5s'}} />
            </svg>
        );
  
    case DecorationType.SHIPWRECK:
        return (
            <svg viewBox="0 0 160 120" className={className} width="160" height="120">
                <path d="M10,80 Q80,120 150,70 L140,110 H20 Z" fill="#713f12" />
                <rect x="60" y="40" width="10" height="60" fill="#503010" transform="rotate(10 65 100)" />
                <path d="M60,50 L100,60 L60,80" fill="rgba(255,255,255,0.5)" opacity="0.3" />
                <circle cx="40" cy="90" r="8" fill="#000" opacity="0.4" />
            </svg>
        );
  
    case DecorationType.TREASURE_CHEST:
        return (
            <svg viewBox="0 0 80 60" className={className} width="60" height="50">
                <rect x="10" y="20" width="60" height="40" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="2"/>
                <path d="M10,20 Q40,0 70,20" fill="#d97706" stroke="#78350f" strokeWidth="2"/>
                <rect x="35" y="25" width="10" height="10" fill="#fcd34d" />
            </svg>
        );
  
    case DecorationType.GIANT_CLAM:
        return (
            <svg viewBox="0 0 80 60" className={className} width="70" height="50">
                <path d="M10,50 Q40,0 70,50" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
                <path d="M10,50 Q40,55 70,50" fill="#cbd5e1" />
                <circle cx="40" cy="45" r="5" fill="#fef3c7" className="animate-pulse" />
            </svg>
        );

    default:
      return null;
  }
};