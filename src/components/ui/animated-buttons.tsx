import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────
   1. ShakeButton – gentle idle sway, faster on hover
   ───────────────────────────────────────────── */

interface ShakeButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function ShakeButton({ children, className = "" }: ShakeButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className={`inline-block ${className}`}
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
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   2. GoldCoinButton – coins burst out on hover
   ───────────────────────────────────────────── */

interface Coin {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  side: "top" | "bottom" | "left" | "right";
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
    scale: 0.6 + Math.random() * 0.5,
    delay: Math.random() * 0.15,
    side,
  };
}

function CoinParticle({ coin }: { coin: Coin }) {
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

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        fontSize: `${12 * coin.scale}px`,
        zIndex: 50,
      }}
      initial={{
        x: coin.x,
        y: coin.y,
        opacity: 1,
        scale: 0,
        rotate: 0,
      }}
      animate={{
        x: endX,
        y: endY,
        opacity: [1, 1, 0],
        scale: [0, coin.scale, coin.scale * 0.8],
        rotate: coin.rotation,
      }}
      transition={{
        duration: 0.9,
        delay: coin.delay,
        ease: "easeOut",
      }}
    >
      🪙
    </motion.div>
  );
}

export function GoldCoinButton({ children, className = "" }: GoldCoinButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [coins, setCoins] = useState<Coin[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  useEffect(() => {
    if (hovered) {
      // Initial burst
      spawnBurst();
      // Continuous spawning while hovering
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
  }, [hovered, spawnBurst]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div
      className={`inline-block relative ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={hovered ? { scale: 1.05 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Glow effect on hover */}
      {hovered && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,193,7,0.3) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Coin particles */}
      {coins.map((coin) => (
        <CoinParticle key={coin.id} coin={coin} />
      ))}

      {/* The actual button */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
