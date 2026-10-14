const GRADIENT_COUNT = 5;

export function avatarGradient(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `var(--avatar-gradient-${(hash % GRADIENT_COUNT) + 1})`;
}
