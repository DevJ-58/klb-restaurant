export type HomeSectionId =
  | 'hero'
  | 'appetite'
  | 'incontournables'
  | 'chiffres'
  | 'ambiance'
  | 'marquee'
  | 'orderTiles'
  | 'findUs'
  | 'footer';

export type SectionSeam = 'none' | 'fade' | 'dome';

export type HomeSectionDefinition = {
  id: HomeSectionId;
  bgStart: string;
  bgEnd: string;
  seam?: SectionSeam;
};

export const homeSections: readonly HomeSectionDefinition[] = [
  { id: 'hero', bgStart: 'surface-base', bgEnd: 'surface-green' },
  { id: 'appetite', bgStart: 'surface-green', bgEnd: 'surface-green' },
  { id: 'incontournables', bgStart: 'surface-raised', bgEnd: 'surface-green', seam: 'dome' },
  { id: 'chiffres', bgStart: 'surface-green', bgEnd: 'surface-base' },
  { id: 'ambiance', bgStart: 'surface-raised', bgEnd: 'surface-raised', seam: 'fade' },
  { id: 'marquee', bgStart: 'ivory', bgEnd: 'ivory', seam: 'dome' },
  { id: 'orderTiles', bgStart: 'ivory', bgEnd: 'ivory', seam: 'none' },
  { id: 'findUs', bgStart: 'surface-raised', bgEnd: 'surface-raised', seam: 'dome' },
  { id: 'footer', bgStart: 'surface-base', bgEnd: 'surface-base', seam: 'dome' },
];

export const homeSectionById = Object.fromEntries(
  homeSections.map((section) => [section.id, section]),
) as Record<HomeSectionId, HomeSectionDefinition>;

export function assertSeams(): void {
  if (!import.meta.env.DEV) {
    return;
  }

  for (let index = 0; index < homeSections.length - 1; index += 1) {
    const current = homeSections[index];
    const next = homeSections[index + 1];
    if (!current || !next) {
      continue;
    }
    const seamAllowed = next.seam === 'dome' || next.seam === 'fade';
    if (current.bgEnd !== next.bgStart && !seamAllowed) {
      console.warn(
        `[sections] Fond discontinu entre "${current.id}" (${current.bgEnd}) et "${next.id}" (${next.bgStart}).`,
      );
    }
  }
}

assertSeams();
