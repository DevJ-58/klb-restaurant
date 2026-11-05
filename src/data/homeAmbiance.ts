export type AmbiancePhoto = {
  id: string;
  src: string;
  label: string;
  alt: string;
  available: boolean;
};

export const ambiancePhotos: AmbiancePhoto[] = [
  {
    id: 'salle-01',
    src: '/images/ambiance/ambiance-salle-01.jpg',
    label: 'La salle',
    alt: 'La salle du restaurant KLB',
    available: true,
  },
  {
    id: 'salle-02',
    src: '/images/ambiance/ambiance-salle-02.jpg',
    label: 'Ambiance',
    alt: 'Ambiance de la salle KLB',
    available: true,
  },
  {
    id: 'salle-03',
    src: '/images/ambiance/ambiance-salle-03.jpg',
    label: 'Détails',
    alt: 'Détails de la décoration chez KLB',
    available: true,
  },
  {
    id: 'comptoir',
    src: '/images/ambiance/ambiance-comptoir.jpg',
    label: 'Le comptoir',
    alt: 'Le comptoir du restaurant KLB',
    available: true,
  },
  {
    id: 'terrasse',
    src: '/images/ambiance/ambiance-terrasse.jpg',
    label: 'La terrasse',
    alt: 'La terrasse du restaurant KLB',
    available: true,
  },
  {
    id: 'table',
    src: '/images/ambiance/ambiance-detail-table.jpg',
    label: 'La table',
    alt: 'Une table dressée chez KLB',
    available: true,
  },
];
