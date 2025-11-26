
import React, { useRef, useEffect, useState } from 'react';
import { Player, Boss, GameState, Projectile, FloatingText, Point, BossType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOSS_CONFIGS, PLAYER_SPRITES } from '../constants';

interface GameCanvasProps {
  players: Player[];
  boss: Boss | null;
  gameState: GameState;
  onUpdate: (players: Player[], boss: Boss | null, projectiles: Projectile[], texts: FloatingText[]) => void;
  onGameOver: (won: boolean, finalPlayers: Player[]) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  players: initialPlayers, 
  boss: initialBoss, 
  gameState, 
  onUpdate,
  onGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mutable game state
  const playersRef = useRef<Player[]>(initialPlayers);
  const bossRef = useRef<Boss | null>(initialBoss);
  const projectilesRef = useRef<Projectile[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const frameIdRef = useRef<number>(0);
  const gameOverTriggeredRef = useRef(false);

  // Sprite Management
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const [spritesLoaded, setSpritesLoaded] = useState(false);

  // Load Sprites
  useEffect(() => {
    const loadSprite = (key: string, src: string) => {
      const img = new Image();
      // Add timestamp to ensure latest version from public folder is loaded (bypasses cache)
      img.src = `${src}?t=${Date.now()}`;
      img.onload = () => {
        spritesRef.current[key] = img;
        setSpritesLoaded(prev => !prev);
      };
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${src}.`);
      };
    };

    loadSprite('p1_idle', PLAYER_SPRITES.P1.IDLE);
    loadSprite('p1_run', PLAYER_SPRITES.P1.RUN);
    loadSprite('p2_idle', PLAYER_SPRITES.P2.IDLE);
    loadSprite('p2_run', PLAYER_SPRITES.P2.RUN);
  }, []);

  // Sync props to refs
  useEffect(() => {
    playersRef.current = initialPlayers;
    bossRef.current = initialBoss;
    
    if (gameState !== GameState.PLAYING) {
        gameOverTriggeredRef.current = false;
        projectilesRef.current = [];
    }
  }, [initialPlayers, initialBoss, gameState]);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const spawnFloatingText = (text: string, pos: Point, color: string) => {
    textsRef.current.push({
      id: Math.random(),
      text,
      pos: { ...pos },
      color,
      lifetime: 60,
      velocity: { x: (Math.random() - 0.5) * 2, y: -2 }
    });
  };

  const spawnProjectile = (pos: Point, velocity: Point, damage: number, color: string, isHostile: boolean, radius: number = 5, lifetime: number = 120, ownerId?: 1 | 2) => {
    projectilesRef.current.push({
      id: Math.random(),
      ownerId,
      pos: { ...pos },
      velocity,
      damage,
      color,
      isHostile,
      radius,
      lifetime
    });
  };

  // --- GAME LOGIC HELPERS ---

  const checkCollision = (rect1: {pos: Point, width: number, height: number}, rect2: {pos: Point, width: number, height: number}) => {
    return (
      rect1.pos.x < rect2.pos.x + rect2.width &&
      rect1.pos.x + rect1.width > rect2.pos.x &&
      rect1.pos.y < rect2.pos.y + rect2.height &&
      rect1.pos.y + rect1.height > rect2.pos.y
    );
  };

  const checkCircleRectCollision = (circle: {pos: Point, radius: number}, rect: {pos: Point, width: number, height: number}) => {
    const testX = Math.max(rect.pos.x, Math.min(circle.pos.x, rect.pos.x + rect.width));
    const testY = Math.max(rect.pos.y, Math.min(circle.pos.y, rect.pos.y + rect.height));
    const distX = circle.pos.x - testX;
    const distY = circle.pos.y - testY;
    return (distX * distX + distY * distY) <= (circle.radius * circle.radius);
  };

  const updatePlayer = (p: Player) => {
    if (p.isDead) return;

    if (p.invincibility > 0) p.invincibility--;
    if (p.dashCooldown > 0) p.dashCooldown--;

    let dx = 0; 
    let dy = 0;
    const speed = p.stats.speed;

    if (p.id === 1) {
      if (keysRef.current.has('KeyW')) dy -= speed;
      if (keysRef.current.has('KeyS')) dy += speed;
      if (keysRef.current.has('KeyA')) { dx -= speed; p.direction = 'left'; }
      if (keysRef.current.has('KeyD')) { dx += speed; p.direction = 'right'; }
    } else {
      if (keysRef.current.has('ArrowUp')) dy -= speed;
      if (keysRef.current.has('ArrowDown')) dy += speed;
      if (keysRef.current.has('ArrowLeft')) { dx -= speed; p.direction = 'left'; }
      if (keysRef.current.has('ArrowRight')) { dx += speed; p.direction = 'right'; }
    }

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        p.lastMoveDir = { x: dx / len, y: dy / len };
    }

    // DASH LOGIC
    const dashKey = p.id === 1 ? 'ShiftLeft' : 'ShiftRight';
    if (keysRef.current.has(dashKey) && p.dashCooldown <= 0) {
        p.dashCooldown = 20 * 60; // 20 seconds
        const dashDist = 120;
        
        p.pos.x += p.lastMoveDir.x * dashDist;
        p.pos.y += p.lastMoveDir.y * dashDist;
        
        spawnFloatingText("BOOST!", p.pos, '#fff');
        p.invincibility = 20;
    }

    p.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.pos.x + dx));
    p.pos.y = Math.max(0, Math.min(CANVAS_HEIGHT - p.height, p.pos.y + dy));

    if (p.cooldown > 0) p.cooldown--;

    const attackKey = p.id === 1 ? 'Space' : 'Enter';
    if (keysRef.current.has(attackKey) && p.cooldown <= 0) {
      p.cooldown = p.stats.attackSpeed;
      // P1 fires Cyan plasma, P2 fires Orange plasma
      const projColor = p.id === 1 ? '#22d3ee' : '#f97316';
      
      spawnProjectile(
        { x: p.pos.x + p.width / 2, y: p.pos.y + p.height / 2 },
        { x: p.lastMoveDir.x * 12, y: p.lastMoveDir.y * 12 }, 
        p.stats.damage,
        projColor,
        false,
        6,
        120,
        p.id
      );
    }
  };

  const updateBoss = (boss: Boss, players: Player[]) => {
    if (boss.hp <= 0) return;

    boss.attackPattern++;
    boss.cooldown--;

    const livePlayers = players.filter(p => !p.isDead);
    if (livePlayers.length === 0) return;

    let target = livePlayers[0];
    let minDist = 99999;
    livePlayers.forEach(p => {
      const dist = Math.hypot(p.pos.x - boss.pos.x, p.pos.y - boss.pos.y);
      if (dist < minDist) {
        minDist = dist;
        target = p;
      }
    });

    const centerX = boss.pos.x + boss.width / 2;
    const centerY = boss.pos.y + boss.height / 2;
    const targetCenterX = target.pos.x + target.width / 2;
    const targetCenterY = target.pos.y + target.height / 2;

    switch (boss.type) {
      case 'SLIME': 
        if (boss.cooldown <= 0) {
            const angle = Math.atan2(targetCenterY - centerY, targetCenterX - centerX);
            boss.pos.x += Math.cos(angle) * (boss.speed * 5); 
            boss.pos.y += Math.sin(angle) * (boss.speed * 5);
            if (Math.random() > 0.97) boss.cooldown = 35; 
        } 
        break;

      case 'GOLEM':
        if (boss.attackPattern % 120 === 0) {
             const angle = Math.atan2(targetCenterY - centerY, targetCenterX - centerX);
             spawnProjectile({x: centerX, y: centerY}, {x: Math.cos(angle)*6, y: Math.sin(angle)*6}, 15, '#475569', true, 15, 200);
        }
        if (minDist > 120) {
            const angle = Math.atan2(targetCenterY - centerY, targetCenterX - centerX);
            boss.pos.x += Math.cos(angle) * boss.speed;
            boss.pos.y += Math.sin(angle) * boss.speed;
        }
        break;

      case 'WIZARD':
        if (boss.attackPattern % 180 === 0) {
            boss.pos.x = Math.random() * (CANVAS_WIDTH - boss.width);
            boss.pos.y = Math.random() * (CANVAS_HEIGHT - boss.height);
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                spawnProjectile({x: boss.pos.x + boss.width/2, y: boss.pos.y + boss.height/2}, {x: Math.cos(angle)*5, y: Math.sin(angle)*5}, 12, '#d946ef', true, 10);
            }
        }
        break;

      case 'ROGUE':
        if (boss.attackPattern % 60 === 0) {
            const angle = Math.atan2(targetCenterY - centerY, targetCenterX - centerX);
            boss.pos.x += Math.cos(angle) * 150; 
            boss.pos.y += Math.sin(angle) * 150;
            spawnProjectile({x: centerX, y: centerY}, {x: Math.cos(angle)*2, y: Math.sin(angle)*2}, 8, '#e11d48', true, 5);
        }
        break;
      
      case 'DEMON_KING':
        if (boss.attackPattern % 10 === 0) {
            const angle = (boss.attackPattern / 10) * 0.5; 
            spawnProjectile({x: centerX, y: centerY}, {x: Math.cos(angle)*4, y: Math.sin(angle)*4}, 8, '#ef4444', true, 8, 300);
            spawnProjectile({x: centerX, y: centerY}, {x: Math.cos(angle + Math.PI)*4, y: Math.sin(angle + Math.PI)*4}, 8, '#ef4444', true, 8, 300);
        }
        boss.pos.x += (CANVAS_WIDTH/2 - 60 - boss.pos.x) * 0.01;
        boss.pos.y += (CANVAS_HEIGHT/2 - 70 - boss.pos.y) * 0.01;
        break;
    }

    boss.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - boss.width, boss.pos.x));
    boss.pos.y = Math.max(0, Math.min(CANVAS_HEIGHT - boss.height, boss.pos.y));
  };

  const handlePlayerDamage = (player: Player, amount: number) => {
    if (player.invincibility > 0) return;
    
    const damage = Math.max(1, amount - player.stats.armor);
    player.stats.hp -= damage;
    spawnFloatingText(`-${damage}`, player.pos, '#ef4444');
    player.invincibility = 30; 
    
    if (player.stats.hp <= 0) {
        if (player.stats.hasReviveItem && !player.stats.usedRevive) {
            player.stats.hp = player.stats.maxHp * 0.5;
            player.stats.usedRevive = true; 
            player.stats.hasReviveItem = false;
            player.invincibility = 180; 
            spawnFloatingText("PHOENIX PROTOCOL!", {x: player.pos.x, y: player.pos.y - 30}, '#a855f7');
        } else {
            player.isDead = true;
            spawnFloatingText("KIA", player.pos, '#64748b');
        }
    }
  };

  const loop = () => {
    if (gameState !== GameState.PLAYING) {
        draw(); 
        frameIdRef.current = requestAnimationFrame(loop);
        return;
    }

    const boss = bossRef.current;
    if (!boss) return;

    playersRef.current.forEach(updatePlayer);
    updateBoss(boss, playersRef.current);

    playersRef.current.forEach(player => {
        if (!player.isDead && checkCollision(player, boss)) {
             handlePlayerDamage(player, 10); 
             
             const centerX = boss.pos.x + boss.width / 2;
             const centerY = boss.pos.y + boss.height / 2;
             const angle = Math.atan2(player.pos.y - centerY, player.pos.x - centerX);
             
             player.pos.x += Math.cos(angle) * 30;
             player.pos.y += Math.sin(angle) * 30;
             boss.pos.x -= Math.cos(angle) * 20;
             boss.pos.y -= Math.sin(angle) * 20;
             
             player.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.pos.x));
             player.pos.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.pos.y));
             boss.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - boss.width, boss.pos.x));
             boss.pos.y = Math.max(0, Math.min(CANVAS_HEIGHT - boss.height, boss.pos.y));
        }
    });

    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const p = projectilesRef.current[i];
        p.pos.x += p.velocity.x;
        p.pos.y += p.velocity.y;
        p.lifetime--;

        let hit = false;
        
        if (p.isHostile) {
            playersRef.current.forEach(player => {
                if (!player.isDead && checkCircleRectCollision(p, player)) {
                    handlePlayerDamage(player, p.damage);
                    hit = true;
                }
            });
        } else {
            if (checkCircleRectCollision(p, boss)) {
                boss.hp -= p.damage;
                spawnFloatingText(`-${p.damage}`, {x: boss.pos.x + Math.random()*boss.width, y: boss.pos.y}, '#ffffff');
                hit = true;
                if (p.ownerId) {
                    const owner = playersRef.current.find(pl => pl.id === p.ownerId);
                    if (owner) {
                        owner.damageDealtThisRound += p.damage;
                    }
                }
            }
        }

        if (hit || p.lifetime <= 0 || p.pos.x < 0 || p.pos.x > CANVAS_WIDTH || p.pos.y < 0 || p.pos.y > CANVAS_HEIGHT) {
            projectilesRef.current.splice(i, 1);
        }
    }

    for (let i = textsRef.current.length - 1; i >= 0; i--) {
        const t = textsRef.current[i];
        t.pos.y += t.velocity.y;
        t.lifetime--;
        if (t.lifetime <= 0) textsRef.current.splice(i, 1);
    }

    if (!gameOverTriggeredRef.current) {
        const allDead = playersRef.current.every(p => p.isDead);
        if (allDead) {
            gameOverTriggeredRef.current = true;
            onGameOver(false, playersRef.current);
        } else if (boss.hp <= 0) {
            gameOverTriggeredRef.current = true;
            onGameOver(true, playersRef.current);
        }
    }

    draw();
    onUpdate([...playersRef.current], {...boss}, [...projectilesRef.current], [...textsRef.current]);
    frameIdRef.current = requestAnimationFrame(loop);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111827'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const boss = bossRef.current;
    if (boss && boss.hp > 0) {
        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.pos.x, boss.pos.y, boss.width, boss.height);
        
        ctx.fillStyle = '#374151';
        ctx.fillRect(boss.pos.x, boss.pos.y - 15, boss.width, 10);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(boss.pos.x, boss.pos.y - 15, boss.width * (boss.hp / boss.maxHp), 10);
    }

    playersRef.current.forEach(p => {
        if (p.isDead) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height); // Dead placeholder
            ctx.globalAlpha = 1;
        } else {
            if (p.invincibility > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
               ctx.globalAlpha = 0.5;
            } else {
               ctx.globalAlpha = 1;
            }

            // SPRITE LOGIC
            const isMoving = (keysRef.current.has(p.id === 1 ? 'KeyA' : 'ArrowLeft') || 
                              keysRef.current.has(p.id === 1 ? 'KeyD' : 'ArrowRight') || 
                              keysRef.current.has(p.id === 1 ? 'KeyW' : 'ArrowUp') || 
                              keysRef.current.has(p.id === 1 ? 'KeyS' : 'ArrowDown'));
            
            // Fire Logic: Check if recently fired
            const isFiring = p.cooldown > (p.stats.attackSpeed - 8);

            let spriteKey = p.id === 1 ? 'p1_idle' : 'p2_idle';
            if (isMoving) {
                spriteKey = p.id === 1 ? 'p1_run' : 'p2_run';
            }

            const sprite = spritesRef.current[spriteKey];
            const facingLeft = p.direction === 'left';

            if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
                ctx.save();
                
                // Translate to center of player
                let drawX = p.pos.x + p.width/2;
                let drawY = p.pos.y + p.height/2;

                // RECOIL EFFECT: Knock back slightly when firing
                if (isFiring) {
                    const recoilAmount = 6;
                    drawX += facingLeft ? recoilAmount : -recoilAmount;
                }
                
                ctx.translate(drawX, drawY);
                
                if (facingLeft) {
                    ctx.scale(-1, 1);
                }

                // Simple bobbing animation if running
                let bobY = 0;
                if (isMoving) {
                    bobY = Math.sin(Date.now() / 80) * 3; 
                }

                // Aspect Ratio Scaling for new designs
                // The new sprites are taller.
                const targetHeight = 90; // Slightly larger for better detail
                const ratio = sprite.naturalWidth / sprite.naturalHeight;
                const targetWidth = targetHeight * ratio;

                // Draw image centered
                // Offset Y by -18 to align feet with hitbox bottom (Hitbox H=60, Image H=90)
                ctx.drawImage(sprite, -targetWidth/2, -targetHeight/2 + bobY - 18, targetWidth, targetHeight);
                
                // MUZZLE FLASH
                if (isFiring) {
                   // Color depends on player (Cyan for P1, Orange for P2)
                   const flashColor = p.id === 1 ? '#a5f3fc' : '#fed7aa'; // Light Cyan / Light Orange
                   const spikeColor = p.id === 1 ? '#22d3ee' : '#f97316'; // Cyan / Orange

                   ctx.fillStyle = flashColor;
                   ctx.globalCompositeOperation = 'lighter';
                   
                   // Position at the tip of the gun. 
                   const gunTipX = targetWidth/2 - 2; 
                   const gunTipY = bobY - 4; 

                   // Flash Core
                   ctx.beginPath();
                   ctx.arc(gunTipX, gunTipY, 8 + Math.random() * 5, 0, Math.PI * 2);
                   ctx.fill();
                   
                   // Flash Center (White hot)
                   ctx.fillStyle = '#ffffff';
                   ctx.beginPath();
                   ctx.arc(gunTipX, gunTipY, 4, 0, Math.PI * 2);
                   ctx.fill();
                   
                   // Flash Spikes (Dynamic)
                   ctx.strokeStyle = spikeColor;
                   ctx.lineWidth = 3;
                   ctx.beginPath();
                   ctx.moveTo(gunTipX, gunTipY);
                   ctx.lineTo(gunTipX + 25 + Math.random()*15, gunTipY);
                   ctx.stroke();

                   ctx.globalCompositeOperation = 'source-over';
                }

                ctx.restore();
            } else {
                // Fallback to Rect if sprites not loaded
                ctx.fillStyle = p.color;
                ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
                // Eyes
                ctx.fillStyle = 'white';
                const eyeOffsetX = (p.direction === 'right' ? 1 : -1) * 8;
                ctx.fillRect(p.pos.x + p.width/2 - 4 + eyeOffsetX, p.pos.y + 10, 8, 8);
            }
        }

        if (p.stats.hasReviveItem && !p.isDead) {
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.pos.x + p.width/2, p.pos.y - 10, 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#374151';
        ctx.fillRect(p.pos.x, p.pos.y - 10, p.width, 5);
        ctx.fillStyle = '#22c55e';
        const hpPct = Math.max(0, p.stats.hp / p.stats.maxHp);
        ctx.fillRect(p.pos.x, p.pos.y - 10, p.width * hpPct, 5);
        ctx.globalAlpha = 1;
    });

    projectilesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    textsRef.current.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText(t.text, t.pos.x, t.pos.y);
    });
  };

  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [gameState]);

  return (
    <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="border-4 border-gray-700 rounded-lg shadow-2xl bg-gray-900 mx-auto"
    />
  );
};

export default GameCanvas;
