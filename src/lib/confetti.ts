import confetti from "canvas-confetti";

export function fireCelebrationConfetti() {
  if (typeof window === "undefined") return;

  // Multi-stage fireworks and confetti burst
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ["#ec4899", "#8b5cf6", "#f59e0b", "#10b981"],
  });

  fire(0.2, {
    spread: 60,
    colors: ["#3b82f6", "#f43f5e", "#fbbf24"],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#ffd700", "#ff69b4", "#00ffff"],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: ["#ffffff", "#f97316", "#a855f7"],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#22c55e", "#06b6d4"],
  });
}

export function fireMiniConfetti() {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 35,
    spread: 45,
    origin: { y: 0.6 },
    colors: ["#10b981", "#3b82f6", "#f59e0b"],
    zIndex: 9999,
  });
}

