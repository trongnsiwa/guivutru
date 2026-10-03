import { shouldReduceMotion } from '@/lib/motion';

const CONFETTI_PALETTE = [
  '#C9B6FF',
  '#FFB3D1',
  '#A0F0DC',
  '#FFCBA4',
  '#A5D8FF',
  '#FFF9E6',
];

export async function firePastelConfetti(reducedMotion?: boolean) {
  const isReduced = reducedMotion ?? shouldReduceMotion();
  if (isReduced) return;

  const { default: confetti } = await import('canvas-confetti');
  const disableForReducedMotion = shouldReduceMotion();

  // Burst 1 (left-center)
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    origin: { x: 0.45, y: 0.3 },
    colors: CONFETTI_PALETTE,
    disableForReducedMotion,
  });

  // Burst 2 (right-center, 150ms apart)
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 45,
      origin: { x: 0.55, y: 0.3 },
      colors: CONFETTI_PALETTE,
      disableForReducedMotion,
    });
  }, 150);
}

export function Confetti() {
  return null;
}

export default Confetti;
