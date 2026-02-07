import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   1. ShakeButton – gentle idle sway + glowing ring on hover
   ───────────────────────────────────────────── */

interface ShakeButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function ShakeButton({ children, className = "" }: ShakeButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className={`inline-block relative ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={
        hovered
          ? {
              rotate: [0, -6, 6, -6, 6, -3, 3, 0],
              scale: [1, 1.05, 1.05, 1.05, 1.05, 1.03, 1.03, 1],
            }
          : {
              rotate: [0, -2, 2, -2, 2, 0],
              scale: 1,
            }
      }
      transition={
        hovered
          ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.1 }
          : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
      }
    >
      {/* Animated glowing ring effect on hover */}
      <AnimatePresence>
        {hovered && (
          <>
            {/* Outer expanding ring */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: "2px solid rgba(255, 193, 7, 0.6)",
                boxShadow: "0 0 20px rgba(255, 193, 7, 0.4)",
              }}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{
                scale: [1, 1.3, 1.5],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            {/* Second ring with delay */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: "2px solid rgba(255, 193, 7, 0.5)",
                boxShadow: "0 0 15px rgba(255, 193, 7, 0.3)",
              }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{
                scale: [1, 1.3, 1.5],
                opacity: [0.6, 0.3, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
            />
            {/* Inner glow */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255,193,7,0.2) 0%, transparent 70%)",
                filter: "blur(4px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        )}
      </AnimatePresence>

      {/* The actual button */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   2. GoldCoinButton – realistic gold coins burst out on hover
   ───────────────────────────────────────────── */

interface Coin {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  side: "top" | "bottom" | "left" | "right";
  flipSpeed: number;
}

interface GoldCoinButtonProps {
  children: React.ReactNode;
  className?: string;
}

let coinIdCounter = 0;

function createCoin(): Coin {
  const sides: Coin["side"][] = ["top", "bottom", "left", "right"];
  const side = sides[Math.floor(Math.random() * sides.length)];

  let x = 0;
  let y = 0;

  switch (side) {
    case "top":
      x = Math.random() * 100 - 50;
      y = -10;
      break;
    case "bottom":
      x = Math.random() * 100 - 50;
      y = 10;
      break;
    case "left":
      x = -20;
      y = Math.random() * 60 - 30;
      break;
    case "right":
      x = 20;
      y = Math.random() * 60 - 30;
      break;
  }

  return {
    id: coinIdCounter++,
    x,
    y,
    rotation: Math.random() * 360,
    scale: 0.8 + Math.random() * 0.4,
    delay: Math.random() * 0.15,
    side,
    flipSpeed: 0.3 + Math.random() * 0.3,
  };
}

// Realistic 3D Gold Coin Component
function GoldCoin({ coin }: { coin: Coin }) {
  // Determine end position: coins fall down and scatter
  let endX = coin.x;
  let endY = 0;

  switch (coin.side) {
    case "top":
      endX = coin.x + (Math.random() - 0.5) * 40;
      endY = -50 - Math.random() * 30;
      break;
    case "bottom":
      endX = coin.x + (Math.random() - 0.5) * 40;
      endY = 50 + Math.random() * 30;
      break;
    case "left":
      endX = -60 - Math.random() * 30;
      endY = coin.y + 30 + Math.random() * 20;
      break;
    case "right":
      endX = 60 + Math.random() * 30;
      endY = coin.y + 30 + Math.random() * 20;
      break;
  }

  const coinSize = 20 * coin.scale;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        width: coinSize,
        height: coinSize,
        zIndex: 50,
      }}
      initial={{
        x: coin.x - coinSize / 2,
        y: coin.y - coinSize / 2,
        opacity: 1,
        scale: 0,
        rotateY: 0,
      }}
      animate={{
        x: endX - coinSize / 2,
        y: endY - coinSize / 2,
        opacity: [1, 1, 0],
        scale: [0, coin.scale, coin.scale * 0.8],
        rotateY: [0, 360, 720],
      }}
      transition={{
        duration: 0.9,
        delay: coin.delay,
        ease: "easeOut",
        rotateY: {
          duration: coin.flipSpeed,
          repeat: 2,
          ease: "linear",
        },
      }}
    >
      {/* 3D Gold Coin with gradients */}
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full drop-shadow-lg"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
      >
        <defs>
          {/* Gold gradient for main coin */}
          <radialGradient id={`coinGold-${coin.id}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="40%" stopColor="#FFD700" />
            <stop offset="70%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#B8860B" />
          </radialGradient>
          {/* Edge gradient for 3D effect */}
          <linearGradient id={`coinEdge-${coin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DAA520" />
            <stop offset="50%" stopColor="#B8860B" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
          {/* Inner shine */}
          <radialGradient id={`coinShine-${coin.id}`} cx="25%" cy="25%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {/* Outer edge for 3D depth */}
        <circle cx="20" cy="21" r="18" fill={`url(#coinEdge-${coin.id})`} />
        {/* Main coin face */}
        <circle cx="20" cy="20" r="17" fill={`url(#coinGold-${coin.id})`} />
        {/* Inner ring */}
        <circle cx="20" cy="20" r="14" fill="none" stroke="#B8860B" strokeWidth="1.5" opacity="0.6" />
        {/* Dollar or Y symbol */}
        <text
          x="20"
          y="25"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#8B6914"
          style={{ fontFamily: "serif" }}
        >
          ¥
        </text>
        {/* Shine overlay */}
        <circle cx="20" cy="20" r="17" fill={`url(#coinShine-${coin.id})`} />
      </svg>
    </motion.div>
  );
}

export function GoldCoinButton({ children, className = "" }: GoldCoinButtonProps) {
  const [active, setActive] = useState(false);
  const [coins, setCoins] = useState<Coin[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnBurst = useCallback(() => {
    // Spawn 5-8 coins in a burst
    const count = 5 + Math.floor(Math.random() * 4);
    const newCoins: Coin[] = [];
    for (let i = 0; i < count; i++) {
      newCoins.push(createCoin());
    }
    setCoins((prev) => [...prev, ...newCoins]);

    // Clean up after animation completes
    const timeout = setTimeout(() => {
      setCoins((prev) => prev.filter((c) => !newCoins.includes(c)));
    }, 1200);
    timeoutRefs.current.push(timeout);
  }, []);

  // Handle touch start - activate animation
  const handleTouchStart = useCallback(() => {
    // Clear any pending touch end timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setActive(true);
  }, []);

  // Handle touch end - keep animation for a bit then deactivate
  const handleTouchEnd = useCallback(() => {
    // Keep animation visible for 1.5s after touch ends
    touchTimeoutRef.current = setTimeout(() => {
      setActive(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (active) {
      // Initial burst
      spawnBurst();
      // Continuous spawning while active
      intervalRef.current = setInterval(() => {
        spawnBurst();
      }, 600);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [active, spawnBurst]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className={`inline-block relative ${className}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      animate={
        active
          ? { scale: 1.05 }
          : {
              // Idle pulsing animation for mobile - subtle golden shimmer
              scale: [1, 1.02, 1],
            }
      }
      transition={
        active
          ? { type: "spring", stiffness: 300, damping: 20 }
          : { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }
    >
      {/* Idle golden glow - always visible, pulses when not active */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,215,0,0.25) 0%, rgba(255,193,7,0.1) 50%, transparent 70%)",
          filter: "blur(8px)",
        }}
        animate={
          active
            ? { opacity: 1, scale: 1.3 }
            : { opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }
        }
        transition={
          active
            ? { duration: 0.3 }
            : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Enhanced golden glow on active */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, rgba(255,193,7,0.2) 40%, transparent 70%)",
              filter: "blur(10px)",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Idle sparkle particles - always visible on mobile, subtle pulse */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`idle-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FFE066 0%, #FFD700 100%)",
            boxShadow: "0 0 4px #FFD700",
          }}
          animate={{
            x: Math.cos((i * Math.PI * 2) / 4 + Math.PI / 4) * (active ? 45 : 30),
            y: Math.sin((i * Math.PI * 2) / 4 + Math.PI / 4) * (active ? 28 : 18),
            opacity: active ? [0, 1, 0] : [0.2, 0.5, 0.2],
            scale: active ? [0, 1, 0.5] : [0.6, 1, 0.6],
          }}
          transition={{
            duration: active ? 1.2 : 3,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Extra sparkle particles on active */}
      <AnimatePresence>
        {active && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #FFE066 0%, #FFD700 100%)",
                  boxShadow: "0 0 6px #FFD700",
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 6) * 40,
                  y: Math.sin((i * Math.PI * 2) / 6) * 25,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Coin particles */}
      {coins.map((coin) => (
        <GoldCoin key={coin.id} coin={coin} />
      ))}

      {/* The actual button */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
