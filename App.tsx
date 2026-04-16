
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Coins, Skull, X, Check, Trash2, Sprout, Fish as FishIcon, Anchor, Hand, Minus, Plus } from 'lucide-react';
import { FishEntity, FoodEntity, GameState, Vector2, FishRarity, Particle, DecorationType, DecorationEntity } from './types';
import { INITIAL_MONEY, PRICES, TANK_HEIGHT, TANK_WIDTH, FOOD_STATS, DECORATION_DESCRIPTIONS } from './constants';
import { generateFishDna, getFishPrice, generateFishPersonality } from './utils/fishGenerator';
import { FishSVG } from './components/FishSVG';
import { DecorationSVG } from './components/DecorationSVG';

// --- Math Helpers ---
const add = (v1: Vector2, v2: Vector2) => ({ x: v1.x + v2.x, y: v1.y + v2.y });
const sub = (v1: Vector2, v2: Vector2) => ({ x: v1.x - v2.x, y: v1.y - v2.y });
const mult = (v: Vector2, n: number) => ({ x: v.x * n, y: v.y * n });
const div = (v: Vector2, n: number) => ({ x: v.x / n, y: v.y / n });
const mag = (v: Vector2) => Math.sqrt(v.x * v.x + v.y * v.y);
const normalize = (v: Vector2) => {
    const m = mag(v);
    return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
};
const limit = (v: Vector2, max: number) => {
    const m = mag(v);
    return m > max ? mult(normalize(v), max) : v;
};
const dist = (v1: Vector2, v2: Vector2) => Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    cost?: number;
    gain?: number;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, cost, gain, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-slate-800 border-4 border-slate-600 rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-300 mb-6">{message}</p>
                
                {(cost || gain) && (
                    <div className="flex justify-center items-center gap-2 mb-6 text-2xl font-mono font-bold bg-slate-900 p-3 rounded">
                        {cost && <span className="text-red-400">-${cost}</span>}
                        {gain && <span className="text-green-400">+${gain}</span>}
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold transition-colors">
                        取消
                    </button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-lg bg-gold-accent hover:bg-yellow-300 text-slate-900 font-bold flex items-center justify-center gap-2 transition-colors">
                        <Check size={20} /> 确认
                    </button>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    money: INITIAL_MONEY,
    waterQuality: 100,
    inventory: { 
      basicFood: 10, 
      premiumFood: 0,
      shrimpFood: 0,
      algaeFood: 0 
    },
    decorations: []
  });
  
  const [fishes, setFishes] = useState<FishEntity[]>([]);
  const [foods, setFoods] = useState<FoodEntity[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const [selectedDecorationId, setSelectedDecorationId] = useState<string | null>(null);

  // Dragging State for Decorations
  const [isDraggingDec, setIsDraggingDec] = useState(false);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const tankRef = useRef<HTMLDivElement>(null);

  const [shopCategory, setShopCategory] = useState<'LIVESTOCK' | 'SUPPLIES' | 'DECORATIONS'>('LIVESTOCK');
  const [selectedFoodType, setSelectedFoodType] = useState<'BASIC' | 'PREMIUM'>('BASIC');

  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      cost?: number;
      gain?: number;
      action: () => void;
  }>({ isOpen: false, title: '', message: '', action: () => {} });

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const fishesRef = useRef<FishEntity[]>([]);
  const foodsRef = useRef<FoodEntity[]>([]);
  
  useEffect(() => { fishesRef.current = fishes; }, [fishes]);
  useEffect(() => { foodsRef.current = foods; }, [foods]);

  // --- Physics Constants ---
  const BASE_SPEED = 2.0; 
  const BASE_FORCE = 0.08;

  // --- Game Loop ---
  const updateGame = (time: number) => {
    if (lastTimeRef.current === undefined) lastTimeRef.current = time;
    const deltaTime = Math.min((time - lastTimeRef.current!) / 16.67, 3);
    lastTimeRef.current = time;

    setFishes(prevFishes => {
      return prevFishes.map(fish => {
        if (fish.isDead) {
            // Dead fish float up slowly and drift
            return {
                ...fish,
                position: { 
                    x: fish.position.x + Math.sin(time / 1000) * 0.2, 
                    y: Math.max(0, fish.position.y - 0.3 * deltaTime) 
                },
                velocity: { x: 0, y: 0 }
            };
        }

        // --- Physiology ---
        let newHunger = fish.hunger + (0.005 * deltaTime);
        let newHealth = fish.health;
        let newSize = fish.size;
        let newAge = fish.age + (0.005 * deltaTime);

        if (newHunger >= 100) {
            newHunger = 100;
        } else if (newHunger < 20 && newHealth < 100) {
            newHealth += (0.05 * deltaTime);
        }

        if (newHealth <= 0) return { ...fish, isDead: true, health: 0 };
        
        if (newSize < 1.6 && newHunger < 80) {
             const growthRate = newSize < 0.8 ? 0.0001 : 0.00004;
             newSize += growthRate * deltaTime;
        }

        // --- Physics & AI State ---
        const sizeFactor = fish.size; 
        // Individual speed variations based on bravery/energy
        const speedMultiplier = fish.personality.bravery;
        const currentMaxSpeed = BASE_SPEED * (0.8 + sizeFactor * 0.4) * speedMultiplier; 
        const currentMaxForce = BASE_FORCE * (1.3 - sizeFactor * 0.3);

        let currentState = fish.state;
        let stateTimer = fish.stateTimer - deltaTime;
        let targetId = fish.target;

        // --- AI Decision Making (Perception System) ---
        // Instead of checking every frame, check based on random probability ("Reaction Time")
        // This desynchronizes the fish behavior.
        const shouldThink = Math.random() > (0.9 - (deltaTime * 0.01)); 

        if (shouldThink && currentState !== 'FLEEING') {
            
            // Check for Food if Hungry
            if (newHunger > 15) {
                let bestFood: FoodEntity | null = null;
                let minDist = 9999;
                
                // If we already have a target, check if it still exists
                if (currentState === 'SEEKING_FOOD' && targetId) {
                    const existingTarget = foodsRef.current.find(f => f.id === targetId);
                    if (!existingTarget) {
                        currentState = 'IDLE'; // Food eaten by someone else
                        targetId = null;
                    }
                }

                // Scan environment for new food
                // Only scan if not currently seeking OR occasionally re-scan to switch targets
                if (currentState !== 'SEEKING_FOOD' || Math.random() < 0.05) {
                    for (const food of foodsRef.current) {
                        const d = dist(fish.position, food.position);
                        
                        // SENSORY CHECK:
                        // 1. Smell: Close range (100px) - 360 detection
                        // 2. Vision: Long range (VisionRange) - Frontal cone only
                        let canSense = false;
                        
                        if (d < 100) {
                            canSense = true; // Smell
                        } else if (d < fish.personality.visionRange) {
                            // Dot product for vision cone
                            const toFood = normalize(sub(food.position, fish.position));
                            const heading = normalize(fish.velocity);
                            const dot = toFood.x * heading.x + toFood.y * heading.y;
                            if (dot > 0.5) canSense = true; // ~60 degree cone
                        }

                        // Probabilistic "Noticing" based on reactionTime
                        // Slower reactionTime = lower chance to notice per frame
                        if (canSense && d < minDist && Math.random() > fish.personality.reactionTime) {
                            minDist = d;
                            bestFood = food;
                        }
                    }

                    if (bestFood) {
                        currentState = 'SEEKING_FOOD';
                        targetId = bestFood.id;
                    }
                }
            } else {
                // Not hungry
                if (currentState === 'SEEKING_FOOD') {
                    currentState = 'WANDER';
                    targetId = null;
                }
            }

            // Fallback State Cycle
            if (currentState === 'SEEKING_FOOD' && !targetId) currentState = 'WANDER';
            
            if (currentState !== 'SEEKING_FOOD' && currentState !== 'SCHOOLING') {
                if (stateTimer <= 0) {
                    if (currentState === 'WANDER') {
                        currentState = 'IDLE';
                        stateTimer = 100 + Math.random() * 200; 
                    } else {
                        currentState = 'WANDER';
                        stateTimer = 200 + Math.random() * 400; 
                    }
                }
            }
        }

        // --- Calculate Forces ---
        let acc = { x: 0, y: 0 };
        let separation = { x: 0, y: 0 };
        let alignment = { x: 0, y: 0 };
        let cohesion = { x: 0, y: 0 };
        let neighborCount = 0;

        // Boids Rules
        // CRITICAL CHANGE: When seeking food, fish ignore social rules (Alignment/Cohesion) mostly
        // This prevents them from moving as a synchronized blob.
        const isFocusing = currentState === 'SEEKING_FOOD';
        const separationWeight = 2.0;
        const alignmentWeight = isFocusing ? 0.1 : 1.0 * fish.personality.social;
        const cohesionWeight = isFocusing ? 0.0 : 1.0 * fish.personality.social;

        for (const other of prevFishes) {
            if (other.id === fish.id || other.isDead) continue;
            
            const d = dist(fish.position, other.position);
            
            if (d < 50 * fish.size) { 
                let diff = sub(fish.position, other.position);
                diff = normalize(diff);
                diff = div(diff, d); // Weight by distance
                separation = add(separation, diff);
            }

            if (!isFocusing && d < 120) {
                neighborCount++;
                alignment = add(alignment, other.velocity);
                cohesion = add(cohesion, other.position);
            }
        }

        // 2. Apply Behaviors based on State
        let wanderForce = { x: 0, y: 0 };

        if (currentState === 'IDLE') {
            const friction = mult(fish.velocity, -0.05);
            acc = add(acc, friction);
            
            if (mag(separation) > 0) {
                separation = normalize(separation);
                separation = mult(separation, currentMaxSpeed * 0.5);
                separation = sub(separation, fish.velocity);
                acc = add(acc, limit(separation, currentMaxForce));
            }

        } else if (currentState === 'SEEKING_FOOD' && targetId) {
            const foodTarget = foodsRef.current.find(f => f.id === targetId);
            if (foodTarget) {
                let desired = sub(foodTarget.position, fish.position);
                const d = mag(desired);
                desired = normalize(desired);
                
                // Arrive behavior (slow down slightly when very close to avoid overshooting)
                if (d < 50) {
                     desired = mult(desired, currentMaxSpeed * (d/50));
                } else {
                     desired = mult(desired, currentMaxSpeed * 1.5); // Rush
                }

                let steer = sub(desired, fish.velocity);
                steer = limit(steer, currentMaxForce * 2); // Less perfect turn than before
                
                acc = add(acc, steer);
                
                // Still apply separation so they don't stack on top of the food
                acc = add(acc, mult(separation, 3.0)); 
            } else {
                // Lost target
                currentState = 'WANDER';
            }

        } else if (currentState === 'WANDER' || currentState === 'SCHOOLING') {
             // WANDER STEERING
             let currentWanderTheta = fish.wanderTheta + (Math.random() * 0.5 - 0.25); 
             
             let circleCenter = normalize(fish.velocity);
             if (mag(fish.velocity) < 0.1) circleCenter = { x: 1, y: 0 }; 
             circleCenter = mult(circleCenter, 60); 
             
             let displacement = { x: Math.cos(currentWanderTheta) * 30, y: Math.sin(currentWanderTheta) * 30 };
             wanderForce = add(circleCenter, displacement);
             wanderForce = normalize(wanderForce);
             wanderForce = mult(wanderForce, currentMaxForce * 0.8);

             fish.wanderTheta = currentWanderTheta; 

             acc = add(acc, wanderForce);

             // Apply Boids
             if (mag(separation) > 0) {
                separation = normalize(separation);
                separation = mult(separation, currentMaxSpeed);
                separation = sub(separation, fish.velocity);
                acc = add(acc, limit(separation, currentMaxForce * 2.5));
            }

            if (neighborCount > 0) {
                // Alignment
                alignment = div(alignment, neighborCount);
                if (mag(alignment) > 0) {
                    alignment = normalize(alignment);
                    alignment = mult(alignment, currentMaxSpeed);
                    alignment = sub(alignment, fish.velocity);
                    acc = add(acc, limit(alignment, currentMaxForce * alignmentWeight));
                }
                
                // Cohesion
                cohesion = div(cohesion, neighborCount);
                let desired = sub(cohesion, fish.position);
                if (mag(desired) > 0) {
                    desired = normalize(desired);
                    desired = mult(desired, currentMaxSpeed);
                    let steer = sub(desired, fish.velocity);
                    acc = add(acc, limit(steer, currentMaxForce * 0.8 * cohesionWeight));
                }
            }
        }

        // Boundary Repulsion (Soft borders)
        let boundaryForce = { x: 0, y: 0 };
        const margin = 80;
        if (fish.position.x < margin) boundaryForce.x = currentMaxSpeed;
        else if (fish.position.x > TANK_WIDTH - margin) boundaryForce.x = -currentMaxSpeed;
        if (fish.position.y < margin) boundaryForce.y = currentMaxSpeed;
        else if (fish.position.y > TANK_HEIGHT - margin) boundaryForce.y = -currentMaxSpeed;
        
        if (mag(boundaryForce) > 0) {
            boundaryForce = normalize(boundaryForce);
            boundaryForce = mult(boundaryForce, currentMaxSpeed);
            boundaryForce = sub(boundaryForce, fish.velocity);
            acc = add(acc, limit(boundaryForce, currentMaxForce * 3.5)); 
        }

        // Apply Accumulation
        let newVel = add(fish.velocity, acc);
        // Speed limit
        newVel = limit(newVel, currentMaxSpeed * (currentState === 'SEEKING_FOOD' ? 1.2 : 1.0));
        
        // Update Position
        let newPos = add(fish.position, mult(newVel, deltaTime));
        newPos.x = Math.max(0, Math.min(newPos.x, TANK_WIDTH));
        newPos.y = Math.max(0, Math.min(newPos.y, TANK_HEIGHT));

        return {
            ...fish,
            position: newPos,
            velocity: newVel,
            wanderTheta: fish.wanderTheta,
            hunger: newHunger,
            health: newHealth,
            age: newAge,
            size: newSize,
            state: currentState as any,
            target: targetId,
            stateTimer: stateTimer
        };
      });
    });

    // Update Food
    setFoods(prevFoods => {
        const nextFoods: FoodEntity[] = [];
        prevFoods.forEach(food => {
             let fy = food.position.y + (1.2 * deltaTime); // Sinks
             let eaten = false;
             for (const fish of fishesRef.current) {
                 if (!fish.isDead && fish.hunger > 10 && dist(fish.position, food.position) < (40 * fish.size)) {
                     eaten = true;
                     handleFishEat(fish.id, food);
                     break;
                 }
             }
             if (!eaten && fy < TANK_HEIGHT - 30) {
                 nextFoods.push({ ...food, position: { x: food.position.x + Math.sin(fy/50)*0.5, y: fy } });
             }
        });
        return nextFoods;
    });
    
    // Ambient Particles
    if (Math.random() < 0.1) {
        setParticles(prev => [...prev, {
            id: Math.random().toString(),
            x: Math.random() * TANK_WIDTH,
            y: TANK_HEIGHT,
            size: Math.random() * 4 + 1,
            speed: Math.random() * 1.5 + 0.5,
            opacity: 0.4
        }]);
    }
    setParticles(prev => prev.map(p => ({
        ...p,
        y: p.y - p.speed * deltaTime,
        opacity: p.y < 50 ? p.opacity - 0.02 : p.opacity
    })).filter(p => p.opacity > 0));

    requestRef.current = requestAnimationFrame(updateGame);
  };

  const handleFishEat = (fishId: string, food: FoodEntity) => {
      setFishes(prev => prev.map(f => {
          if (f.id === fishId) {
              return {
                  ...f,
                  hunger: Math.max(0, f.hunger - food.nutrition),
                  health: Math.min(100, f.health + 10),
                  // Reset state slightly so they don't look like robots stopping instantly
                  state: 'IDLE',
                  target: null,
                  stateTimer: 50 // Short pause after eating
              };
          }
          return f;
      }));
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // --- Input Handlers ---

  const handleTankClick = (e: React.MouseEvent) => {
      if (isDraggingDec) return;
      if (selectedFishId || selectedDecorationId) {
          setSelectedFishId(null);
          setSelectedDecorationId(null);
          return;
      }
      if (!tankRef.current) return;
      
      const rect = tankRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (TANK_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (TANK_HEIGHT / rect.height);
      
      dropFoodAt(x, y);
  };

  const dropFoodAt = (x: number, y: number) => {
      const type = selectedFoodType;
      if (type === 'BASIC' && gameState.inventory.basicFood <= 0) {
          alert("基础饲料不足，请前往商店购买！");
          return;
      }
      if (type === 'PREMIUM' && gameState.inventory.premiumFood <= 0) {
          alert("高级饲料不足，请前往商店购买！");
          return;
      }

      setGameState(prev => ({
          ...prev,
          inventory: {
              ...prev.inventory,
              basicFood: type === 'BASIC' ? prev.inventory.basicFood - 1 : prev.inventory.basicFood,
              premiumFood: type === 'PREMIUM' ? prev.inventory.premiumFood - 1 : prev.inventory.premiumFood
          }
      }));

      const stats = FOOD_STATS[type];
      setFoods(prev => [...prev, {
          id: Math.random().toString(),
          type,
          position: { x, y }, // Drop where clicked
          nutrition: stats.nutrition,
          color: stats.color
      }]);
  };

  const handleMouseDownDec = (e: React.MouseEvent, decId: string) => {
      e.stopPropagation();
      setSelectedDecorationId(decId);
      setSelectedFishId(null);
      setIsDraggingDec(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDraggingDec && selectedDecorationId && dragStartRef.current && tankRef.current) {
          const rect = tankRef.current.getBoundingClientRect();
          // Calculate scale factor between screen pixels and tank units
          const scaleX = TANK_WIDTH / rect.width;
          const scaleY = TANK_HEIGHT / rect.height;
          
          const dx = (e.clientX - dragStartRef.current.x) * scaleX;
          const dy = (e.clientY - dragStartRef.current.y) * scaleY;
          
          setGameState(prev => ({
              ...prev,
              decorations: prev.decorations.map(d => 
                  d.id === selectedDecorationId 
                  ? { ...d, x: Math.max(0, Math.min(TANK_WIDTH, d.x + dx)), y: Math.max(50, Math.min(TANK_HEIGHT, d.y + dy)) } 
                  : d
              )
          }));

          dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleMouseUp = () => {
      setIsDraggingDec(false);
      dragStartRef.current = null;
  };

  // --- Transactions ---

  const requestBuy = (itemKey: string, unitPrice: number, name: string, quantity: number) => {
      const totalCost = unitPrice * quantity;
      if (gameState.money < totalCost) return; 
      
      setConfirmState({
          isOpen: true,
          title: '确认购买',
          message: `确认支付 $${totalCost} 购买 ${quantity} x ${name}?`,
          cost: totalCost,
          action: () => executeBuy(itemKey, totalCost, quantity)
      });
  };

  const executeBuy = (item: string, cost: number, quantity: number) => {
      setGameState(prev => ({ ...prev, money: prev.money - cost }));
      
      // Loop for the quantity purchased
      for (let i = 0; i < quantity; i++) {
          if (item === 'EGG_COMMON') spawnFish(FishRarity.COMMON);
          else if (item === 'EGG_RARE') spawnFish(FishRarity.RARE);
          else if (item === 'FOOD_BASIC') { /* Handled bulk below to avoid state spam */ }
          else if (item === 'FOOD_PREMIUM') { /* Handled bulk below */ }
          else spawnDecoration(item as DecorationType);
      }

      // Handle Food Bulk Update specifically
      if (item === 'FOOD_BASIC') {
          setGameState(p => ({...p, inventory: {...p.inventory, basicFood: p.inventory.basicFood + (10 * quantity)}}));
      } else if (item === 'FOOD_PREMIUM') {
          setGameState(p => ({...p, inventory: {...p.inventory, premiumFood: p.inventory.premiumFood + (10 * quantity)}}));
      }
      
      setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  const requestSellFish = (fish: FishEntity) => {
      const value = getFishPrice(fish.dna, fish.size, fish.health);
      setConfirmState({
          isOpen: true,
          title: '确认出售',
          message: `将 ${fish.dna.name} 卖给收购商? (体型: ${(fish.size * 10).toFixed(1)}cm)`,
          gain: value,
          action: () => {
              setGameState(prev => ({ ...prev, money: prev.money + value }));
              setFishes(prev => prev.filter(f => f.id !== fish.id));
              setSelectedFishId(null);
              setConfirmState(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const requestSellDecoration = (dec: DecorationEntity) => {
     const cost = PRICES[dec.type];
     const value = Math.floor(cost * 0.5); 
     setConfirmState({
         isOpen: true,
         title: '移除装饰',
         message: `是否拆除 ${dec.type}?`,
         gain: value,
         action: () => {
             setGameState(prev => ({
                 ...prev,
                 money: prev.money + value,
                 decorations: prev.decorations.filter(d => d.id !== dec.id)
             }));
             setSelectedDecorationId(null);
             setConfirmState(prev => ({ ...prev, isOpen: false }));
         }
     });
  };

  const spawnFish = (rarity: FishRarity) => {
    const dna = generateFishDna(rarity);
    const personality = generateFishPersonality(dna.species);
    const angle = Math.random() * Math.PI * 2;
    const isWander = Math.random() > 0.3;
    setFishes(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      dna,
      personality,
      position: { x: TANK_WIDTH / 2 + (Math.random() - 0.5) * 100, y: 150 + (Math.random() - 0.5) * 50 },
      velocity: { x: Math.cos(angle), y: Math.sin(angle) },
      acceleration: { x: 0, y: 0 },
      wanderTheta: Math.random() * Math.PI * 2, 
      target: null,
      size: 0.5, 
      depth: Math.random() * 0.6 + 0.2, 
      age: 0,
      hunger: 20,
      health: 100,
      isDead: false,
      state: isWander ? 'WANDER' : 'IDLE', 
      stateTimer: 100 + Math.random() * 400,
      lastDecisionTime: 0
    }]);
  };

  const spawnDecoration = (type: DecorationType) => {
      setGameState(prev => ({
          ...prev,
          decorations: [...prev.decorations, {
              id: Math.random().toString(),
              type,
              x: Math.random() * (TANK_WIDTH - 200) + 100,
              y: TANK_HEIGHT - 50, // Default to bottom
              scale: 0.8 + Math.random() * 0.4,
              depth: Math.random() * 0.8 + 0.1
          }]
      }));
  };

  const getRarityColor = (rarity: FishRarity) => {
      switch(rarity) {
          case FishRarity.COMMON: return 'text-slate-300';
          case FishRarity.RARE: return 'text-blue-400 font-bold';
          case FishRarity.EPIC: return 'text-purple-400 font-bold';
          case FishRarity.LEGENDARY: return 'text-yellow-400 font-extrabold';
      }
  };

  const getStatusText = (fish: FishEntity) => {
      if (fish.isDead) return '已死亡';
      switch(fish.state) {
          case 'FLEEING': return '惊吓!';
          case 'SCHOOLING': return '群游中';
          case 'SEEKING_FOOD': return '觅食中';
          case 'IDLE': return '休息';
          case 'WANDER': return '闲逛';
          default: return '发呆';
      }
  }

  // Sort draw order by Depth (z-index simulation)
  // Far (depth 0) drawn first, Close (depth 1) drawn last
  const drawables = [
      ...gameState.decorations.map(d => ({ type: 'DEC', obj: d, depth: d.depth, y: d.y })),
      ...fishes.map(f => ({ type: 'FISH', obj: f, depth: f.depth, y: f.position.y })),
      ...foods.map(f => ({ type: 'FOOD', obj: f, depth: 0.5, y: f.position.y })) // Foods are mid-depth
  ].sort((a, b) => a.depth - b.depth);

  return (
    <div 
        className="w-full h-screen bg-black flex items-center justify-center overflow-hidden relative font-['Zcool_KuaiLe']"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
    >
      
      <ConfirmModal 
          {...confirmState} 
          onConfirm={confirmState.action}
          onCancel={() => setConfirmState(p => ({...p, isOpen: false}))} 
      />

      <div className="absolute inset-0 bg-gradient-to-b from-sky-900 via-blue-900 to-slate-900 pointer-events-none" />
      
      {/* Tank Container */}
      <div ref={tankRef}
           className="relative w-full max-w-6xl h-[85vh] border-[8px] border-slate-700/80 rounded-xl bg-cyan-900/20 shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden cursor-crosshair"
           onClick={handleTankClick}
      >
        {/* Background Scenery (Parallax Back) */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0">
             <svg className="w-full h-64 opacity-30" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <path d="M0,200 L0,80 Q250,50 500,100 T1000,60 V200 Z" fill="#0f172a" />
             </svg>
        </div>

        {/* Particles */}
        {particles.map(p => (
            <div key={p.id} 
                 className="absolute rounded-full bg-white/30 blur-[1px] pointer-events-none"
                 style={{ left: `${(p.x / TANK_WIDTH) * 100}%`, top: `${(p.y / TANK_HEIGHT) * 100}%`, width: p.size, height: p.size, opacity: p.opacity }} 
            />
        ))}

        {/* Main Draw Layer (Sorted by depth) */}
        {drawables.map((item, idx) => {
            if (item.type === 'DEC') {
                const dec = item.obj as DecorationEntity;
                // Calculate visual scale based on depth and inherent scale
                // Depth 0 (back) = 0.7x visual size, Depth 1 (front) = 1.0x visual size
                const depthScale = 0.6 + (dec.depth * 0.4); 
                const blur = (1 - dec.depth) * 2; // Further items are blurrier
                
                return (
                    <div key={dec.id}
                        className={`absolute origin-bottom transform -translate-x-1/2 -translate-y-full transition-filter duration-300 ${isDraggingDec && selectedDecorationId === dec.id ? 'scale-110 cursor-grabbing z-50' : 'cursor-grab'}`}
                        style={{ 
                            left: `${(dec.x / TANK_WIDTH) * 100}%`, 
                            top: `${(dec.y / TANK_HEIGHT) * 100}%`,
                            transform: `translate(-50%, -50%) scale(${dec.scale * depthScale})`,
                            filter: `blur(${blur}px) brightness(${0.5 + dec.depth * 0.5})`,
                            zIndex: Math.floor(dec.depth * 100)
                        }}
                        onMouseDown={(e) => handleMouseDownDec(e, dec.id)}
                    >
                        {selectedDecorationId === dec.id && (
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/20 p-1 rounded-full animate-pulse border border-white/50">
                                 <Hand size={16} className="text-white"/>
                             </div>
                        )}
                        <DecorationSVG type={dec.type} className="drop-shadow-lg" />
                    </div>
                );
            } else if (item.type === 'FISH') {
                const fish = item.obj as FishEntity;
                const isSelected = selectedFishId === fish.id;
                
                // ORIENTATION LOGIC FIX:
                const isFacingLeft = fish.velocity.x < 0;
                
                let tiltDeg = 0;
                if (!fish.isDead) {
                    const speed = Math.sqrt(fish.velocity.x**2 + fish.velocity.y**2);
                    if (speed > 0.1) {
                        const maxTilt = 35;
                        const angle = Math.atan2(fish.velocity.y, Math.abs(fish.velocity.x)) * (180 / Math.PI);
                        tiltDeg = Math.max(-maxTilt, Math.min(maxTilt, angle));
                        if (isFacingLeft) tiltDeg = -tiltDeg;
                    }
                }

                const depthScale = 0.6 + (fish.depth * 0.4);
                const blur = (1 - fish.depth) * 1.5;

                return (
                    <div key={fish.id}
                         className="absolute transition-transform duration-100 ease-out"
                         style={{
                             left: `${(fish.position.x / TANK_WIDTH) * 100}%`,
                             top: `${(fish.position.y / TANK_HEIGHT) * 100}%`,
                             transform: `translate(-50%, -50%)`,
                             zIndex: Math.floor(fish.depth * 100) + 10 
                         }}
                         onClick={(e) => { e.stopPropagation(); setSelectedFishId(fish.id); setSelectedDecorationId(null); }}
                    >
                         {/* Status Bubbles */}
                         {fish.state === 'FLEEING' && !fish.isDead && (
                             <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-lg font-bold text-yellow-300 animate-bounce">!</div>
                        )}
                        {fish.hunger >= 80 && !fish.isDead && fish.state !== 'FLEEING' && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-bold text-red-400 animate-pulse bg-black/50 px-1 rounded">饿</div>
                        )}
                        {fish.state === 'IDLE' && !fish.isDead && (
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-200 opacity-60 animate-pulse">Zzz</div>
                        )}
                        {fish.state === 'SEEKING_FOOD' && !fish.isDead && (
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-bold text-pink-300 opacity-60">!</div>
                        )}

                        {isSelected && <div className="absolute inset-[-20px] border-2 border-white/50 rounded-full animate-pulse pointer-events-none" />}

                        {/* RENDER TRANSFORMS HERE */}
                        <div style={{ 
                            transform: `scaleX(${isFacingLeft ? 1 : -1}) rotate(${tiltDeg}deg) scale(${depthScale})`,
                            filter: `blur(${blur}px) brightness(${0.6 + fish.depth * 0.4})`,
                            transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Smooth rotation
                        }}>
                            <FishSVG dna={fish.dna} size={fish.size} isDead={fish.isDead} velocity={fish.velocity} className="drop-shadow-lg" />
                        </div>
                    </div>
                );
            } else {
                const food = item.obj as FoodEntity;
                return (
                    <div key={food.id} className="absolute w-3 h-3 rounded-full shadow-sm animate-spin"
                    style={{ 
                        left: `${(food.position.x / TANK_WIDTH) * 100}%`, 
                        top: `${(food.position.y / TANK_HEIGHT) * 100}%`, 
                        backgroundColor: food.color,
                        zIndex: 50
                    }} />
                )
            }
        })}

        {/* Foreground Scenery (Parallax Front) */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none z-[200]">
             <svg className="w-full h-32 opacity-20" preserveAspectRatio="none" viewBox="0 0 1000 100">
                <path d="M0,100 L0,20 Q150,0 300,30 T600,10 T1000,40 V100 Z" fill="#000" />
             </svg>
        </div>
      </div>

      {/* HUD Left */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        <div className="bg-slate-900/90 border-2 border-slate-700/50 p-3 pr-6 rounded-2xl flex items-center gap-3 text-gold-accent shadow-xl backdrop-blur-md">
            <div className="bg-slate-800 p-2 rounded-full"><Coins size={24} className="text-yellow-400"/></div>
            <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">资金</div>
                <span className="font-mono text-2xl font-bold">${Math.floor(gameState.money)}</span>
            </div>
        </div>

        {/* Food Selector */}
        <div className="bg-slate-900/90 border-2 border-slate-700/50 p-2 rounded-xl flex flex-col gap-2 text-white shadow-xl backdrop-blur-md">
             <div className="text-xs text-slate-400 font-bold text-center border-b border-slate-700 pb-1">喂食选择 (点击鱼缸)</div>
             <div className="flex gap-2">
                <button 
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group ${selectedFoodType === 'BASIC' ? 'bg-slate-700 ring-2 ring-gold-accent' : 'hover:bg-slate-800'}`} 
                    onClick={() => setSelectedFoodType('BASIC')}
                >
                    <div className="w-4 h-4 rounded-full bg-amber-400" />
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold">普通</span>
                        <span className="text-[10px] text-slate-400">x{gameState.inventory.basicFood}</span>
                    </div>
                </button>
                <button 
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group ${selectedFoodType === 'PREMIUM' ? 'bg-slate-700 ring-2 ring-gold-accent' : 'hover:bg-slate-800'}`} 
                    onClick={() => setSelectedFoodType('PREMIUM')}
                >
                    <div className="w-4 h-4 rounded-full bg-pink-400" />
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold">高级</span>
                        <span className="text-[10px] text-slate-400">x{gameState.inventory.premiumFood}</span>
                    </div>
                </button>
             </div>
        </div>

        {/* Quick Buy Egg Button */}
        <button 
            onClick={() => requestBuy('EGG_COMMON', PRICES.FISH_EGG_COMMON, '普通鱼卵', 1)}
            className="bg-slate-900/90 border-2 border-slate-700/50 p-2 rounded-xl flex items-center gap-3 text-white shadow-xl backdrop-blur-md hover:bg-slate-800 transition-colors text-left"
        >
             <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-slate-300 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full opacity-50" />
             </div>
             <div>
                <div className="text-xs text-slate-400 font-bold">购买鱼苗</div>
                <div className="text-gold-accent font-bold font-mono">${PRICES.FISH_EGG_COMMON}</div>
             </div>
        </button>
      </div>

      <button 
        onClick={() => setIsShopOpen(true)}
        className="absolute bottom-10 right-10 bg-gradient-to-r from-gold-accent to-yellow-300 text-slate-900 p-5 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all hover:scale-110 hover:rotate-3 border-4 border-orange-500/50 z-40 group"
      >
          <ShoppingBag size={36} className="group-hover:animate-bounce" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">Shop</span>
      </button>

      {/* Selected Decoration Modal */}
      {selectedDecorationId && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/95 border border-slate-600 rounded-lg p-4 shadow-2xl z-40 flex items-center gap-4 animate-in slide-in-from-bottom-5">
              <div className="flex flex-col">
                  <span className="text-white font-bold">装饰品: {gameState.decorations.find(d => d.id === selectedDecorationId)?.type}</span>
                  <span className="text-xs text-slate-400">按住可拖动位置</span>
              </div>
              <button 
                onClick={() => {
                    const dec = gameState.decorations.find(d => d.id === selectedDecorationId);
                    if(dec) requestSellDecoration(dec);
                }}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-4 py-2 rounded border border-red-500/50 flex items-center gap-2"
              >
                  <Trash2 size={16}/> 出售
              </button>
              <button onClick={() => setSelectedDecorationId(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
          </div>
      )}

      {/* Fish Detail Modal */}
      {selectedFishId && (
          (() => {
              const fish = fishes.find(f => f.id === selectedFishId);
              if (!fish) return null;
              const currentPrice = getFishPrice(fish.dna, fish.size, fish.health);
              const growthPercent = Math.min(100, ((fish.size - 0.5) / 1.0) * 100);
              const isAdult = fish.size >= 1.0;
              
              return (
                  <div className="absolute bottom-6 right-6 bg-slate-800/95 border border-slate-600 rounded-xl p-5 shadow-2xl z-40 w-72 animate-in slide-in-from-bottom-5 backdrop-blur-md">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className={`text-lg font-bold ${getRarityColor(fish.dna.rarity)}`}>{fish.dna.name}</h3>
                              <div className="text-xs text-slate-400">{fish.dna.rarity} | {getStatusText(fish)}</div>
                          </div>
                          <button onClick={() => setSelectedFishId(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                      </div>

                      <div className="space-y-3 mb-4">
                          <div>
                              <div className="flex justify-between text-xs text-slate-300 mb-1">
                                  <span>饥饿度</span>
                                  <span>{Math.floor(fish.hunger)}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${fish.hunger > 80 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${fish.hunger}%`}}/>
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between text-xs text-slate-300 mb-1">
                                  <span>健康度</span>
                                  <span>{Math.floor(fish.health)}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${fish.health < 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${fish.health}%`}}/>
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between text-xs text-slate-300 mb-1">
                                  <span>成长 ({(fish.size * 10).toFixed(1)}cm)</span>
                                  <span>{Math.floor(growthPercent)}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="bg-blue-500 h-full" style={{width: `${growthPercent}%`}}/>
                              </div>
                          </div>
                          
                          {/* Personality Traits */}
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/50">
                                <div className="bg-slate-900/50 p-2 rounded text-center">
                                    <div className="text-[10px] text-slate-500 uppercase">性格</div>
                                    <div className="text-xs font-bold text-slate-300">{fish.personality.bravery > 1 ? '勇敢' : '胆小'}</div>
                                </div>
                                <div className="bg-slate-900/50 p-2 rounded text-center">
                                    <div className="text-[10px] text-slate-500 uppercase">反应</div>
                                    <div className="text-xs font-bold text-slate-300">{fish.personality.reactionTime < 0.05 ? '机敏' : '呆萌'}</div>
                                </div>
                          </div>
                      </div>

                      <button 
                          onClick={() => requestSellFish(fish)}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 border border-red-700 text-red-100 font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                          <Coins size={16} /> 出售 (+${currentPrice})
                      </button>
                  </div>
              );
          })()
      )}

      {/* Shop Modal */}
      {isShopOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden flex-col">
                {/* Header */}
                <div className="p-6 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShoppingBag size={32} className="text-gold-accent"/>
                        <h2 className="text-3xl font-bold text-white">水族商店</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-slate-600">
                            <Coins className="text-yellow-400" />
                            <span className="text-2xl font-mono text-white">${Math.floor(gameState.money)}</span>
                        </div>
                        <button onClick={() => setIsShopOpen(false)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded-full transition-colors">
                            <X size={24} className="text-white"/>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 bg-slate-800/50">
                    <button onClick={() => setShopCategory('LIVESTOCK')} className={`flex-1 py-4 text-center font-bold transition-colors ${shopCategory === 'LIVESTOCK' ? 'bg-slate-700 text-gold-accent border-b-4 border-gold-accent' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                        鱼类 & 生物
                    </button>
                    <button onClick={() => setShopCategory('SUPPLIES')} className={`flex-1 py-4 text-center font-bold transition-colors ${shopCategory === 'SUPPLIES' ? 'bg-slate-700 text-gold-accent border-b-4 border-gold-accent' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                        饲料 & 补给
                    </button>
                    <button onClick={() => setShopCategory('DECORATIONS')} className={`flex-1 py-4 text-center font-bold transition-colors ${shopCategory === 'DECORATIONS' ? 'bg-slate-700 text-gold-accent border-b-4 border-gold-accent' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                        装饰 & 造景
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        
                        {shopCategory === 'LIVESTOCK' && (
                            <>
                                <div onClick={() => requestBuy('EGG_COMMON', PRICES.FISH_EGG_COMMON, '普通鱼卵', 1)} 
                                     className="bg-slate-800 p-4 rounded-xl border-2 border-slate-700 hover:border-gold-accent cursor-pointer group transition-all hover:-translate-y-1">
                                    <div className="aspect-square bg-slate-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                                        <div className="w-16 h-16 rounded-full bg-slate-400 animate-pulse" />
                                    </div>
                                    <h3 className="font-bold text-white mb-1">普通鱼卵</h3>
                                    <p className="text-xs text-slate-400 mb-3">随机孵化出常见的观赏鱼。</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gold-accent font-mono font-bold">${PRICES.FISH_EGG_COMMON}</span>
                                        <div className="bg-slate-700 p-1.5 rounded-full group-hover:bg-gold-accent group-hover:text-black transition-colors"><Plus size={16}/></div>
                                    </div>
                                </div>

                                <div onClick={() => requestBuy('EGG_RARE', PRICES.FISH_EGG_RARE, '稀有鱼卵', 1)} 
                                     className="bg-slate-800 p-4 rounded-xl border-2 border-slate-700 hover:border-purple-400 cursor-pointer group transition-all hover:-translate-y-1">
                                    <div className="aspect-square bg-slate-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                                        <div className="w-16 h-16 rounded-full bg-purple-400 animate-pulse shadow-[0_0_20px_rgba(192,132,252,0.5)]" />
                                    </div>
                                    <h3 className="font-bold text-purple-200 mb-1">稀有鱼卵</h3>
                                    <p className="text-xs text-slate-400 mb-3">较高概率孵化出稀有甚至传说鱼种。</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gold-accent font-mono font-bold">${PRICES.FISH_EGG_RARE}</span>
                                        <div className="bg-slate-700 p-1.5 rounded-full group-hover:bg-purple-400 group-hover:text-black transition-colors"><Plus size={16}/></div>
                                    </div>
                                </div>
                            </>
                        )}

                        {shopCategory === 'SUPPLIES' && (
                             <>
                                {Object.entries(FOOD_STATS).filter(([key]) => ['BASIC', 'PREMIUM'].includes(key)).map(([key, stat]) => (
                                    <div key={key} onClick={() => requestBuy(`FOOD_${key}`, PRICES[`FOOD_${key}` as keyof typeof PRICES], stat.name, 10)} 
                                        className="bg-slate-800 p-4 rounded-xl border-2 border-slate-700 hover:border-green-400 cursor-pointer group transition-all hover:-translate-y-1">
                                       <div className="aspect-square bg-slate-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                                           <div className="w-8 h-8 rounded-full" style={{backgroundColor: stat.color}} />
                                           <span className="absolute bottom-2 right-2 text-xs font-bold text-white bg-black/50 px-1 rounded">x10</span>
                                       </div>
                                       <h3 className="font-bold text-white mb-1">{stat.name} (10份)</h3>
                                       <p className="text-xs text-slate-400 mb-3">营养值: {stat.nutrition}</p>
                                       <div className="flex justify-between items-center">
                                           <span className="text-gold-accent font-mono font-bold">${PRICES[`FOOD_${key}` as keyof typeof PRICES] * 10}</span>
                                           <div className="bg-slate-700 p-1.5 rounded-full group-hover:bg-green-400 group-hover:text-black transition-colors"><Plus size={16}/></div>
                                       </div>
                                   </div>
                                ))}
                             </>
                        )}

                        {shopCategory === 'DECORATIONS' && (
                            Object.keys(DECORATION_DESCRIPTIONS).map((typeKey) => {
                                const type = typeKey as DecorationType;
                                const desc = DECORATION_DESCRIPTIONS[type];
                                const price = PRICES[type];

                                return (
                                    <div key={type} onClick={() => requestBuy(type, price, type, 1)} 
                                         className="bg-slate-800 p-4 rounded-xl border-2 border-slate-700 hover:border-sky-400 cursor-pointer group transition-all hover:-translate-y-1 flex flex-col">
                                        <div className="aspect-square bg-slate-900/50 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden p-4">
                                            <DecorationSVG type={type} className="w-full h-full drop-shadow-lg" />
                                        </div>
                                        <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{type}</h3>
                                        <p className="text-xs text-slate-400 mb-3 line-clamp-2 h-8">{desc}</p>
                                        <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-700">
                                            <span className="text-gold-accent font-mono font-bold">${price}</span>
                                            <div className="bg-slate-700 p-1.5 rounded-full group-hover:bg-sky-400 group-hover:text-black transition-colors"><Plus size={16}/></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
