import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  life: number;
  type: 'soap' | 'water' | 'sparkle';
}

interface InteractiveBubblesProps {
  intensity?: 'low' | 'medium' | 'high';
  theme?: 'light' | 'dark';
  followMouse?: boolean;
  clickEffect?: boolean;
}

const InteractiveBubbles: React.FC<InteractiveBubblesProps> = ({
  intensity = 'medium',
  theme = 'light',
  followMouse = true,
  clickEffect = true
}) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clickEffects, setClickEffects] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const bubbleCount = {
    low: 8,
    medium: 15,
    high: 25
  }[intensity];

  // Création des bulles initiales
  const createBubble = useCallback((id: number): Bubble => {
    const types: Array<'soap' | 'water' | 'sparkle'> = ['soap', 'water', 'sparkle'];
    return {
      id,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 40 + 10,
      opacity: Math.random() * 0.7 + 0.3,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      type: types[Math.floor(Math.random() * types.length)]
    };
  }, []);

  // Initialisation des bulles
  useEffect(() => {
    const initialBubbles = Array.from({ length: bubbleCount }, (_, i) => createBubble(i));
    setBubbles(initialBubbles);
  }, [bubbleCount, createBubble]);

  // Suivi de la souris
  useEffect(() => {
    if (!followMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [followMouse]);

  // Effet de clic
  useEffect(() => {
    if (!clickEffect) return;

    const handleClick = (e: MouseEvent) => {
      const newEffect = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      };
      
      setClickEffects(prev => [...prev, newEffect]);
      
      // Supprimer l'effet après l'animation
      setTimeout(() => {
        setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 1000);

      // Créer des bulles autour du clic
      const newBubbles = Array.from({ length: 5 }, (_, i) => ({
        ...createBubble(Date.now() + i),
        x: e.clientX + (Math.random() - 0.5) * 100,
        y: e.clientY + (Math.random() - 0.5) * 100,
        size: Math.random() * 20 + 5,
        life: 1
      }));

      setBubbles(prev => [...prev, ...newBubbles]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [clickEffect, createBubble]);

  // Animation des bulles
  useEffect(() => {
    const animationFrame = setInterval(() => {
      setBubbles(prevBubbles => {
        return prevBubbles
          .map(bubble => {
            let newX = bubble.x + bubble.vx;
            let newY = bubble.y + bubble.vy;
            let newVx = bubble.vx;
            let newVy = bubble.vy;

            // Attraction vers la souris (subtile)
            if (followMouse) {
              const dx = mousePos.x - bubble.x;
              const dy = mousePos.y - bubble.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 150) {
                const force = 0.002 * (150 - distance) / distance;
                newVx += dx * force;
                newVy += dy * force;
              }
            }

            // Rebond sur les bords
            if (newX <= 0 || newX >= window.innerWidth) {
              newVx *= -0.8;
              newX = Math.max(0, Math.min(window.innerWidth, newX));
            }
            if (newY <= 0 || newY >= window.innerHeight) {
              newVy *= -0.8;
              newY = Math.max(0, Math.min(window.innerHeight, newY));
            }

            // Friction
            newVx *= 0.999;
            newVy *= 0.999;

            // Gravité légère vers le haut (bulles remontent)
            newVy -= 0.01;

            return {
              ...bubble,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
              life: Math.max(0, bubble.life - 0.001)
            };
          })
          .filter(bubble => bubble.life > 0.1) // Supprimer les bulles qui meurent
          .slice(0, bubbleCount * 2); // Limiter le nombre total
      });
    }, 16); // 60 FPS

    return () => clearInterval(animationFrame);
  }, [mousePos, followMouse, bubbleCount]);

  const getBubbleColor = (bubble: Bubble) => {
    const isDark = theme === 'dark';
    const baseOpacity = bubble.opacity * bubble.life;
    
    switch (bubble.type) {
      case 'soap':
        return isDark 
          ? `rgba(0, 191, 255, ${baseOpacity * 0.6})` 
          : `rgba(0, 191, 255, ${baseOpacity * 0.4})`;
      case 'water':
        return isDark 
          ? `rgba(30, 144, 255, ${baseOpacity * 0.8})` 
          : `rgba(30, 144, 255, ${baseOpacity * 0.5})`;
      case 'sparkle':
        return isDark 
          ? `rgba(255, 255, 255, ${baseOpacity * 0.9})` 
          : `rgba(220, 20, 60, ${baseOpacity * 0.6})`;
      default:
        return `rgba(0, 191, 255, ${baseOpacity})`;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Bulles animées */}
      {bubbles.map(bubble => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full backdrop-blur-sm"
          style={{
            left: bubble.x - bubble.size / 2,
            top: bubble.y - bubble.size / 2,
            width: bubble.size,
            height: bubble.size,
            background: getBubbleColor(bubble),
            boxShadow: bubble.type === 'sparkle' 
              ? `0 0 ${bubble.size}px ${getBubbleColor(bubble)}` 
              : `inset 0 0 ${bubble.size * 0.3}px rgba(255, 255, 255, 0.3)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: bubble.life,
          }}
          transition={{
            scale: {
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      ))}

      {/* Effets de clic */}
      <AnimatePresence>
        {clickEffects.map(effect => (
          <motion.div
            key={effect.id}
            className="absolute pointer-events-none"
            style={{
              left: effect.x - 50,
              top: effect.y - 50,
              width: 100,
              height: 100,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="w-full h-full border-2 border-carcare-cyan-400 rounded-full" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveBubbles;