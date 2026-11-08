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
  { id: 'hero', bgStart: '#0B0806', bgEnd: '#0E2A1A' },
  { id: 'appetite', bgStart: '#0E2A1A', bgEnd: '#0E2A1A' },
  { id: 'incontournables', bgStart: '#1A110B', bgEnd: '#0E2A1A', seam: 'dome' },
  { id: 'chiffres', bgStart: '#0E2A1A', bgEnd: '#0B0806' },
  { id: 'ambiance', bgStart: '#1A110B', bgEnd: '#1A110B', seam: 'fade' },
  { id: 'marquee', bgStart: '#FBF6EA', bgEnd: '#FBF6EA', seam: 'dome' },
  { id: 'orderTiles', bgStart: '#FBF6EA', bgEnd: '#FBF6EA', seam: 'none' },
  { id: 'findUs', bgStart: '#1A110B', bgEnd: '#1A110B', seam: 'dome' },
  { id: 'footer', bgStart: '#0B0806', bgEnd: '#0B0806', seam: 'dome' },
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
