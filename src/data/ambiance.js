/**
 * @typedef {{
 *   id: string;
 *   src: string;
 *   ratio: string;
 *   legende: string;
 *   alt: string;
 *   optionnel?: boolean;
 * }} AmbiancePhoto
 */

/** @type {AmbiancePhoto[]} */
export const ambiancePhotos = [
  {
    id: 'comptoir',
    src: '/images/ambiance/ambiance-comptoir.jpg',
    ratio: '3 / 2',
    legende: 'Le comptoir',
    alt: 'Vue du comptoir de KLB Restaurant.',
  },
  {
    id: 'salle-01',
    src: '/images/ambiance/ambiance-salle-01.jpg',
    ratio: '4 / 5',
    legende: 'La salle',
    alt: 'Vue de la salle de KLB Restaurant.',
  },
  {
    id: 'salle-02',
    src: '/images/ambiance/ambiance-salle-02.jpg',
    ratio: '4 / 5',
    legende: 'La salle, côté lumière',
    alt: 'La salle de KLB Restaurant baignée par la lumière.',
  },
  {
    id: 'salle-03',
    src: '/images/ambiance/ambiance-salle-03.jpg',
    ratio: '3 / 2',
    legende: 'Autour de la table',
    alt: 'Une table dressée dans l’espace repas de KLB Restaurant.',
  },
  {
    id: 'terrasse',
    src: '/images/ambiance/ambiance-terrasse.jpg',
    ratio: '3 / 2',
    legende: 'La terrasse',
    alt: 'La terrasse de KLB Restaurant.',
    optionnel: true,
  },
  {
    id: 'detail-table',
    src: '/images/ambiance/ambiance-detail-table.jpg',
    ratio: '1 / 1',
    legende: 'Les détails',
    alt: 'Un détail de table chez KLB Restaurant.',
  },
  {
    id: 'facade',
    src: '/images/lieu/facade-klb.jpg',
    ratio: '16 / 9',
    legende: 'La façade',
    alt: 'Façade de KLB Restaurant à Morofé, Yamoussoukro.',
  },
];

export const ambianceCopy = {
  introduction: 'Chaque détail raconte un moment chez KLB.',
};
