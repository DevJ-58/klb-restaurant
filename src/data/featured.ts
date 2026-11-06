export const featured = [
  'canard-laque',
  'tilapia-four',
  'saumon-champignons',
  'filet-mignon',
  'mouton-fondant',
  'cailles-gingembre',
] as const;

export const placements = {
  hero: 'gambas',
  appetite: 'poulet-four',
} as const;

export function getFeaturedBackgrounds(): readonly string[] {
  return [
    'surface-raised',
    'surface-green',
    'surface-base',
    'surface-warm',
    'surface-deep',
    'surface-warm-soft',
    'surface-base',
  ] as const;
}
