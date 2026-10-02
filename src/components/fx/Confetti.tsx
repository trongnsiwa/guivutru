import confetti from 'canvas-confetti';

export function firePastelConfetti() {
  const colors = ['#c9b6ff', '#ffb3d1', '#a0f0dc', '#ffcba4', '#a5d8ff'];

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    disableForReducedMotion: true,
  });
}

export function Confetti() {
  return null;
}
