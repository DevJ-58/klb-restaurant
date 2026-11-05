export type Price =
  | { kind: 'fixed'; amount: number }
  | { kind: 'from'; amount: number }
  | { kind: 'range'; min: number; max: number }
  | { kind: 'options'; amounts: number[] };

export type MenuTag = 'sur-commande' | 'formule';

export type MenuItem = {
  id: string;
  name: string;
  note?: string;
  price?: Price;
  image?: string;
  tags?: MenuTag[];
};

export type MenuCategory = {
  id: string;
  label: string;
  icon: string; // nom d’icône lucide-react
  intro?: string;
  price?: Price; // prix commun à toute la catégorie
  image?: string;
  items: MenuItem[];
};

const img = (slug: string) => '/images/plats/plat-' + slug + '.jpg';
const sc: MenuTag[] = ['sur-commande'];

export const menu: MenuCategory[] = [
  {
    id: 'plats-sur-commande',
    label: 'Plats sur commande',
    icon: 'ChefHat',
    intro: 'Appelez ou écrivez-nous sur WhatsApp pour commander.',
    items: [
      { id: 'mouton-fondant', name: 'Mouton fondant à la crème fraîche', price: { kind: 'fixed', amount: 10000 }, image: img('mouton-fondant'), tags: sc },
      // À CONFIRMER : deux prix pour le tilapia (tailles ou portions ?)
      { id: 'tilapia-four', name: 'Tilapia au four à la provençale', price: { kind: 'options', amounts: [5000, 15000] }, image: img('tilapia-four'), tags: sc },
      { id: 'poulet-four', name: 'Poulet au four', price: { kind: 'fixed', amount: 6000 }, image: img('poulet-four'), tags: sc },
      { id: 'roti-poulet-legumes', name: 'Rôti de poulet fourré aux légumes croquants', price: { kind: 'fixed', amount: 7000 }, image: img('roti-poulet-legumes'), tags: sc },
      { id: 'etouffe-mouton', name: 'Étouffé de mouton', price: { kind: 'fixed', amount: 8000 }, image: img('etouffe-mouton'), tags: sc },
      { id: 'poulet-saute', name: 'Poulet sauté aux arômes', price: { kind: 'fixed', amount: 6000 }, image: img('poulet-saute'), tags: sc },
      { id: 'filet-mignon', name: 'Filet mignon aux petits légumes', price: { kind: 'fixed', amount: 8000 }, image: img('filet-mignon'), tags: sc },
      { id: 'maree-ecrevisses', name: 'Marée d’écrevisses sur steak', price: { kind: 'fixed', amount: 15000 }, image: img('maree-ecrevisses'), tags: sc },
      { id: 'escargots', name: 'Sauté d’escargots aux sept épices', price: { kind: 'fixed', amount: 5000 }, image: img('escargots'), tags: sc },
      // À CONFIRMER : deux prix pour les gambas
      { id: 'gambas', name: 'Gambas sautées aux 3 poivrons doux', price: { kind: 'options', amounts: [5000, 7000] }, image: img('gambas'), tags: sc },
      { id: 'saumon-champignons', name: 'Filets de saumon aux champignons dorés', price: { kind: 'fixed', amount: 12000 }, image: img('saumon-champignons'), tags: sc },
      { id: 'brochettes-volaille', name: 'Brochettes de filets de volaille', price: { kind: 'fixed', amount: 4000 }, image: img('brochettes-volaille'), tags: sc },
      { id: 'choucouya', name: 'Choucouya', note: 'Au choix : mouton, pintade, bœuf, poulet ou lapin', price: { kind: 'from', amount: 6000 }, image: img('choucouya'), tags: sc },
      { id: 'marmite-chef', name: 'La marmite du chef', price: { kind: 'fixed', amount: 7000 }, image: img('marmite-chef'), tags: sc },
      { id: 'canard-laque', name: 'Canard laqué à la sauce marron', note: 'Plat complet : hors-d’œuvre et dessert inclus', price: { kind: 'fixed', amount: 25000 }, image: img('canard-laque'), tags: sc },
      { id: 'boeuf-oignons', name: 'Bœuf aux oignons très juteux', price: { kind: 'fixed', amount: 5000 }, image: img('boeuf-oignons'), tags: sc },
      { id: 'steak-liqueur', name: 'Steak à la liqueur', price: { kind: 'fixed', amount: 7000 }, image: img('steak-liqueur'), tags: sc },
      { id: 'cailles-gingembre', name: 'Cailles braisées au gingembre', price: { kind: 'fixed', amount: 5000 }, image: img('cailles-gingembre'), tags: sc },
      { id: 'pondeuse', name: 'Pondeuse au choix du client', note: 'Préparée selon votre choix', price: { kind: 'from', amount: 10000 }, image: img('pondeuse'), tags: sc },
    ],
  },
  {
    id: 'formules',
    label: 'Formules',
    icon: 'Sparkles',
    items: [
      // À CONFIRMER : fourchette de prix selon le vin choisi ?
      { id: 'formule-plaisir', name: 'Formule plaisir', note: 'Hors-d’œuvre, bouteille de vin bouché, dessert et plat de résistance', price: { kind: 'range', min: 25000, max: 30000 }, image: img('formule-plaisir'), tags: ['formule', 'sur-commande'] },
    ],
  },
  {
    id: 'garnitures',
    label: 'Garnitures',
    icon: 'Wheat',
    intro: 'Au choix, à partir de 1 000 F.',
    price: { kind: 'from', amount: 1000 },
    image: img('garnitures'),
    items: [
      { id: 'semoule-manioc', name: 'Semoule de manioc' },
      { id: 'riz-parfume', name: 'Riz parfumé' },
      { id: 'plantain-frit', name: 'Plantain frit' },
      { id: 'frites-pomme-de-terre', name: 'Frites de pomme de terre' },
      { id: 'frites-patate-douce', name: 'Frites de patate douce' },
      { id: 'pommes-de-terre-poele', name: 'Pommes de terre sautées à la poêle' },
      // À CONFIRMER : « purée de pomme » = pommes de terre ?
      { id: 'puree-fromage', name: 'Purée de pommes de terre au fromage' },
      { id: 'igname-vapeur', name: 'Igname à la vapeur' },
      { id: 'igname-frite', name: 'Igname frite' },
      { id: 'riz-legumes', name: 'Riz aux petits légumes' },
      { id: 'couscous-beurre', name: 'Couscous au beurre' },
      // À CONFIRMER : « plantain plat »
      { id: 'plantain-plat', name: 'Plantain plat' },
    ],
  },
];

export function formatFcfa(amount: number): string {
  const formattedAmount = new Intl.NumberFormat('fr-FR')
    .format(amount)
    .replace(/[\u00a0\u202f ]/g, '\u202f');
  return `${formattedAmount}\u00a0F`;
}

export function formatPrice(price: Price): string {
  switch (price.kind) {
    case 'fixed':
      return formatFcfa(price.amount);
    case 'from':
      return `À partir de ${formatFcfa(price.amount)}`;
    case 'range':
      return `${formatFcfa(price.min)} à ${formatFcfa(price.max)}`;
    case 'options':
      return price.amounts.map(formatFcfa).join(' ou ');
  }
}

export function getItem(id: string): MenuItem | undefined {
  return menu.flatMap((category) => category.items).find((item) => item.id === id);
}

export function getCategory(id: string): MenuCategory | undefined {
  return menu.find((category) => category.id === id);
}

export function countItems(categoryId: string): number {
  return getCategory(categoryId)?.items.length ?? 0;
}
